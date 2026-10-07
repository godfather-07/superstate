/**
 * Shared server helpers for the Razorpay endpoints.
 * Files under api/_lib are not exposed as routes on Vercel (leading "_").
 * Credentials come only from environment variables; nothing here is
 * bundled into the browser.
 */

import Razorpay from 'razorpay';

export function getKeys() {
  // trim: values pasted into a dashboard often pick up a stray space/newline
  const keyId = (process.env.RAZORPAY_KEY_ID || '').trim();
  const keySecret = (process.env.RAZORPAY_KEY_SECRET || '').trim();
  if (!keyId || !keySecret) return null;
  return { keyId, keySecret };
}

let client = null;
export function getRazorpay() {
  const keys = getKeys();
  if (!keys) return null;
  if (!client) client = new Razorpay({ key_id: keys.keyId, key_secret: keys.keySecret });
  return client;
}

export function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

// Vercel parses JSON bodies into req.body; the local dev middleware doesn't,
// so fall back to reading the stream.
export async function readJson(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch (e) { return null; }
  }
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw) return {};
  try { return JSON.parse(raw); } catch (e) { return null; }
}

// Razorpay SDK errors carry the HTTP status of the API call.
export function razorpayErrorStatus(err) {
  const code = err && (err.statusCode || err.status);
  return code === 401 ? 401 : 500;
}
