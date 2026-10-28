/**
 * POST /api/contact
 * Body: { name, email, phone, reason, orderId, message, website }
 * Saves a contact-form message to the Google Sheet ("Messages" tab) through
 * the Apps Script web app. `website` is a hidden honeypot: real people leave
 * it empty, bots fill it in, and we silently drop those.
 */

import { sendJson, readJson } from './_lib/razorpay.js';
import { logContactMessage } from './_lib/sheet.js';

const REASONS = ['order', 'product', 'general', 'media', 'collab'];

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendJson(res, 405, { error: 'Method not allowed' });
  }
  const body = await readJson(req);
  if (!body) return sendJson(res, 400, { error: 'Invalid request.' });
  if (body.website) return sendJson(res, 200, { ok: true }); // honeypot: pretend it worked

  const clean = (v, max) => String(v || '').replace(/\s+/g, ' ').trim().slice(0, max);
  const msg = {
    name: clean(body.name, 80),
    email: clean(body.email, 120).toLowerCase(),
    phone: String(body.phone || '').replace(/\D/g, '').slice(-10),
    reason: REASONS.includes(body.reason) ? body.reason : 'general',
    orderId: clean(body.orderId, 60),
    message: String(body.message || '').trim().slice(0, 2000)
  };

  const errors = {};
  if (msg.name.length < 2) errors.name = 'Please enter your name.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(msg.email)) errors.email = 'Enter a valid email address.';
  if (msg.phone && !/^[6-9]\d{9}$/.test(msg.phone)) errors.phone = 'Enter a 10-digit mobile number.';
  if (msg.message.length < 5) errors.message = 'Tell us a little more.';
  if (Object.keys(errors).length) return sendJson(res, 400, { error: 'Please check the highlighted fields.', errors });

  try {
    await logContactMessage(msg);
    return sendJson(res, 200, { ok: true });
  } catch (err) {
    console.error('contact: could not save message', err && err.message);
    return sendJson(res, 502, { error: "We couldn't send that right now. Please WhatsApp us instead." });
  }
}
