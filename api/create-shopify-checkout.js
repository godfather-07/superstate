/**
 * POST /api/create-shopify-checkout
 * Body: { pack, qty, name, phone, email, address, pincode, city, state, code, ga_cid }
 *
 * Builds a Shopify checkout URL by creating a cart permalink with pre-filled
 * customer details. The customer is redirected to Shopify's hosted checkout
 * where they complete payment (Razorpay is configured as a payment gateway
 * inside Shopify).
 *
 * This replaces the direct Razorpay flow: instead of opening a Razorpay modal,
 * the customer goes to Shopify checkout, which handles payment, abandoned cart
 * emails, discount codes, order management and analytics natively.
 *
 * Needs (Vercel environment variables):
 * - SHOPIFY_STORE_DOMAIN   e.g. superstate-2.myshopify.com
 * - SHOPIFY_ADMIN_TOKEN    for creating draft orders with pre-applied discounts
 * - SHOPIFY_VARIANT_IDS    optional JSON mapping pack names to variant IDs
 */

import { priceFor, discountFor, PACKS } from '../src/shared/packs.js';

const DEFAULT_DOMAIN = 'superstate-2.myshopify.com';

// Same variant IDs used by shopify.js
const DEFAULT_VARIANT_IDS = {
  'Pack Of 5': 45350782140459,
  'Pack Of 15': 45350782173227,
  'Pack Of 30': 45350782205995
};

function sendJson(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

async function readJson(req) {
  try {
    if (req.body && typeof req.body === 'object') return req.body;
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch { return null; }
}

function getConfig() {
  const domain = (process.env.SHOPIFY_STORE_DOMAIN || DEFAULT_DOMAIN).trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
  const token = (process.env.SHOPIFY_ADMIN_TOKEN || '').trim();
  const rawVariants = (process.env.SHOPIFY_VARIANT_IDS || '').trim();
  let variants = domain === DEFAULT_DOMAIN ? DEFAULT_VARIANT_IDS : {};
  if (rawVariants) {
    try { variants = JSON.parse(rawVariants); } catch { /* use defaults */ }
  }
  return { domain, token, variants };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  const body = await readJson(req);
  if (!body) return sendJson(res, 400, { error: 'Invalid JSON body.' });

  const { pack, qty: rawQty, name, phone, email, address, pincode, city, state, code } = body;
  const qty = Number(rawQty) || 1;

  // Validate pack and discount
  const d = discountFor(code);
  if (!d) return sendJson(res, 400, { error: 'Invalid discount code.' });
  const price = priceFor(pack, qty, d.code);
  if (!price) return sendJson(res, 400, { error: 'Invalid pack or quantity.' });

  const cfg = getConfig();
  const variantId = cfg.variants[pack];
  if (!variantId) {
    return sendJson(res, 500, { error: 'Product variant not configured for this pack.' });
  }

  // Build the Shopify cart permalink with pre-filled checkout fields
  // Format: /cart/VARIANT_ID:QTY?checkout[email]=...&discount=CODE
  const checkoutParams = new URLSearchParams();

  // Pre-fill customer details
  if (email) checkoutParams.set('checkout[email]', email);
  if (name) {
    const [first, ...rest] = name.trim().split(/\s+/);
    checkoutParams.set('checkout[shipping_address][first_name]', first || '');
    checkoutParams.set('checkout[shipping_address][last_name]', rest.join(' ') || '');
  }
  if (phone) checkoutParams.set('checkout[shipping_address][phone]', `+91${String(phone).replace(/\D/g, '').slice(-10)}`);
  if (address) checkoutParams.set('checkout[shipping_address][address1]', address);
  if (city) checkoutParams.set('checkout[shipping_address][city]', city);
  if (state) checkoutParams.set('checkout[shipping_address][province]', state);
  if (pincode) checkoutParams.set('checkout[shipping_address][zip]', pincode);
  checkoutParams.set('checkout[shipping_address][country]', 'IN');

  // Apply discount code
  if (d.code) checkoutParams.set('discount', d.code);

  // Add source attribution
  checkoutParams.set('ref', 'superstate-website');

  const checkoutUrl = `https://${cfg.domain}/cart/${variantId}:${qty}?${checkoutParams.toString()}`;

  return sendJson(res, 200, {
    checkout_url: checkoutUrl,
    amount: price.pre,
    discount: { code: d.code, pct: d.pct }
  });
}
