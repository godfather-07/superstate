/**
 * POST /api/razorpay-webhook
 * Razorpay calls this directly when a payment is captured, so a paid
 * pre-book reaches the sheet even if the customer closed the tab before
 * /api/verify-payment ran.
 *
 * Security: X-Razorpay-Signature = HMAC-SHA256(raw request body,
 * RAZORPAY_WEBHOOK_SECRET). The webhook secret is the one you choose when
 * creating the webhook in the Razorpay dashboard (not the API key secret).
 *
 * Duplicates are fine: the Apps Script skips orders it has already logged.
 */

import crypto from 'node:crypto';
import { getRazorpay, sendJson } from './_lib/razorpay.js';
import { logPaidPrebook } from './_lib/sheet.js';

// Read the exact bytes Razorpay signed. Don't touch req.body first: on
// Vercel it parses (and re-serialises) the body lazily on access.
async function readRaw(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  return Buffer.concat(chunks);
}

export function isValidWebhookSignature(rawBody, signature, secret) {
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(String(signature || ''), 'utf8');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  const secret = (process.env.RAZORPAY_WEBHOOK_SECRET || '').trim();
  if (!secret) {
    console.error('razorpay-webhook: RAZORPAY_WEBHOOK_SECRET not set');
    return sendJson(res, 500, { error: 'Webhook not configured.' });
  }

  const raw = await readRaw(req);
  if (!isValidWebhookSignature(raw, req.headers['x-razorpay-signature'], secret)) {
    console.warn('razorpay-webhook: bad signature');
    return sendJson(res, 400, { error: 'Invalid signature.' });
  }

  let event;
  try { event = JSON.parse(raw.toString('utf8')); } catch (e) {
    return sendJson(res, 400, { error: 'Invalid JSON.' });
  }

  // Only act on captured payments; acknowledge everything else so Razorpay
  // doesn't keep retrying.
  if (event.event !== 'payment.captured') return sendJson(res, 200, { ignored: event.event });

  const payment = event.payload && event.payload.payment && event.payload.payment.entity;
  if (!payment || !payment.order_id) return sendJson(res, 200, { ignored: 'no order' });

  try {
    const order = await getRazorpay().orders.fetch(payment.order_id);
    if (!order.notes || order.notes.type !== 'prebook') return sendJson(res, 200, { ignored: 'not a pre-book' });
    const memberNumber = await logPaidPrebook(order, payment.id);
    return sendJson(res, 200, { logged: true, member_number: memberNumber });
  } catch (err) {
    // 500 makes Razorpay retry later, which is what we want for a sheet hiccup.
    console.error('razorpay-webhook: could not log payment', err && (err.error || err.message));
    return sendJson(res, 500, { error: 'Could not log payment; Razorpay will retry.' });
  }
}
