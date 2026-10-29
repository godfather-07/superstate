/**
 * Copies a paid website order into Shopify, so orders, customers, inventory
 * and sales reports in Shopify match what Razorpay actually charged.
 *
 * Needs (Vercel environment variables):
 * - SHOPIFY_ADMIN_TOKEN   Admin API access token (starts with shpat_) from a
 *                         custom app with read_orders + write_orders scopes.
 *                         Secret: never put it in frontend code.
 * - SHOPIFY_STORE_DOMAIN  optional, defaults to superstate-2.myshopify.com
 *
 * Each Shopify order is tagged with the Razorpay payment id; before creating
 * one we look for that tag, so a retried webhook never makes a duplicate.
 */

import { PACKS } from '../../src/shared/packs.js';

const API_VERSION = '2025-01';
const DEFAULT_DOMAIN = 'superstate-2.myshopify.com';

// Same variants the old Shopify checkout used (Sleep Well packs).
const VARIANT_IDS = {
  'Pack Of 5': 45350782140459,
  'Pack Of 15': 45350782173227,
  'Pack Of 30': 45350782205995
};

function config() {
  const token = (process.env.SHOPIFY_ADMIN_TOKEN || '').trim();
  const domain = (process.env.SHOPIFY_STORE_DOMAIN || DEFAULT_DOMAIN).trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
  return token ? { token, domain } : null;
}

export function shopifyConfigured() {
  return Boolean(config());
}

async function shopify(cfg, path, init = {}) {
  const res = await fetch(`https://${cfg.domain}/admin/api/${API_VERSION}/${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': cfg.token, ...(init.headers || {}) }
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.errors) {
    throw new Error(`Shopify ${res.status}: ${JSON.stringify(data.errors || data).slice(0, 300)}`);
  }
  return data;
}

async function findByPayment(cfg, paymentId) {
  const data = await shopify(cfg, 'graphql.json', {
    method: 'POST',
    body: JSON.stringify({
      query: 'query($q: String!) { orders(first: 1, query: $q) { edges { node { id name } } } }',
      variables: { q: `tag:'${paymentId}'` }
    })
  });
  const edge = data.data && data.data.orders.edges[0];
  return edge ? edge.node : null;
}

const money = n => (Math.round(Number(n) * 100) / 100).toFixed(2);

// Builds the Shopify order from the Razorpay order notes (set by create-order).
export function buildShopifyOrder(order, paymentId, memberNumber) {
  const n = order.notes || {};
  const qty = Number(n.qty) || 1;
  const pack = PACKS[n.pack];
  const variantId = VARIANT_IDS[n.pack];
  if (!pack || !variantId) throw new Error(`unknown pack "${n.pack}"`);

  const paid = order.amount / 100;
  const full = pack.price * qty;
  const off = Math.max(0, full - paid);
  const [first, ...rest] = String(n.name || '').trim().split(/\s+/);
  const phone = n.phone ? `+91${String(n.phone).replace(/\D/g, '').slice(-10)}` : undefined;
  const address = {
    first_name: first || 'Customer',
    last_name: rest.join(' ') || '-',
    address1: n.address || '',
    city: n.city || '',
    province: n.state || '',
    zip: n.pincode || '',
    country_code: 'IN',
    phone
  };

  const tags = ['website', 'razorpay', paymentId];
  if (n.ref) tags.push(`creator:${n.ref}`);
  if (n.pack === 'Pack Of 30') tags.push('gift');

  return {
    order: {
      line_items: [{ variant_id: variantId, quantity: qty, price: money(pack.price) }],
      email: n.email || undefined,
      shipping_address: address,
      billing_address: address,
      financial_status: 'paid',
      taxes_included: true,
      discount_codes: off > 0 ? [{ code: n.discount_code || 'WEBSITE', amount: money(off), type: 'fixed_amount' }] : [],
      transactions: [{ kind: 'sale', status: 'success', amount: money(paid), gateway: 'Razorpay', authorization: paymentId }],
      tags: tags.join(', '),
      note: n.ref ? `Creator code ${n.ref}: pack the creator gift.` : undefined,
      note_attributes: [
        { name: 'Razorpay payment', value: paymentId },
        { name: 'Razorpay order', value: order.id },
        { name: 'Discount code', value: n.discount_code || '' },
        { name: 'Referred by', value: n.ref || '' },
        { name: 'Website order no.', value: memberNumber ? String(memberNumber) : '' }
      ],
      source_name: 'superstate.in',
      inventory_behaviour: 'decrement_obeying_policy',
      send_receipt: false,
      send_fulfillment_receipt: false
    }
  };
}

// Returns { status: 'created' | 'exists' | 'not-configured', name? }. Throws on Shopify errors.
export async function syncShopifyOrder(order, paymentId, memberNumber) {
  const cfg = config();
  if (!cfg) return { status: 'not-configured' };
  const existing = await findByPayment(cfg, paymentId);
  if (existing) return { status: 'exists', name: existing.name };
  const data = await shopify(cfg, 'orders.json', {
    method: 'POST',
    body: JSON.stringify(buildShopifyOrder(order, paymentId, memberNumber))
  });
  return { status: 'created', name: data.order && data.order.name };
}
