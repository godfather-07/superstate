/**
 * POST /api/verify-payment
 * Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature }
 * Returns: { verified: true, member_number } only when the signature matches.
 *
 * Signature = HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET).
 * On a match, the paid pre-booking is logged to the Google Sheet from the
 * server, using the details stored on the Razorpay order (not the client).
 */

import crypto from 'node:crypto';
import { getKeys, getRazorpay, sendJson, readJson, missingKeysMessage } from './_lib/razorpay.js';

const DEFAULT_SHEET_URL = 'https://script.google.com/macros/s/AKfycbxhS7lMkCtr6ClWnCTr4vg0STeSdXis1Tr3prD5KljXsBfZ_II9t9UGO6aJxMrXTMxJ/exec';

export function isValidSignature(orderId, paymentId, signature, secret) {
  const expected = crypto.createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest('hex');
  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(String(signature), 'utf8');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  const keys = getKeys();
  if (!keys) {
    console.error('verify-payment: RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET not set');
    return sendJson(res, 500, { error: missingKeysMessage() });
  }

  const body = await readJson(req);
  const orderId = body && body.razorpay_order_id;
  const paymentId = body && body.razorpay_payment_id;
  const signature = body && body.razorpay_signature;
  if (!orderId || !paymentId || !signature) {
    return sendJson(res, 400, { verified: false, error: 'Missing payment details.' });
  }

  if (!isValidSignature(orderId, paymentId, signature, keys.keySecret)) {
    console.warn('verify-payment: signature mismatch for order', orderId);
    return sendJson(res, 400, { verified: false, error: 'Payment could not be verified.' });
  }

  // Verified. Log it to the sheet; a sheet hiccup must not fail a real payment.
  let memberNumber = null;
  try {
    const order = await getRazorpay().orders.fetch(orderId);
    memberNumber = await logPaidPrebook(order, paymentId);
  } catch (err) {
    console.error('verify-payment: could not log to sheet', err && (err.error || err.message));
  }

  return sendJson(res, 200, { verified: true, member_number: memberNumber });
}

async function logPaidPrebook(order, paymentId) {
  const url = process.env.SHEET_WEBHOOK_URL || process.env.VITE_WAITLIST_SHEET_URL || DEFAULT_SHEET_URL;
  const n = order.notes || {};
  const form = new URLSearchParams({
    type: 'prebook',
    name: n.name || '',
    phone: n.phone || '',
    email: n.email || '',
    pack: n.pack || '',
    qty: n.qty || '',
    fullPrice: n.full_price || '',
    prebookPrice: String(order.amount / 100),
    paymentStatus: 'Paid',
    orderId: order.id,
    paymentId
  });
  const res = await fetch(url, { method: 'POST', body: form, redirect: 'follow' });
  const data = await res.json().catch(() => ({}));
  const num = Number(data.memberNumber);
  return Number.isInteger(num) && num > 0 ? num : null;
}
