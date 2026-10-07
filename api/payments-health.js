/**
 * GET /api/payments-health
 * Diagnostic for "Payments are not configured yet.": shows which Razorpay
 * variables this deployment can see and which Vercel environment it runs in.
 * Never returns secret values; only names, presence and the key mode.
 */

import { sendJson } from './_lib/razorpay.js';

export default function handler(req, res) {
  const id = (process.env.RAZORPAY_KEY_ID || '').trim();
  const secret = (process.env.RAZORPAY_KEY_SECRET || '').trim();

  // Names only (e.g. catches "RAZORPAY_KEY_SECRET " with a stray space or
  // different casing). Values are never included.
  const similarNames = Object.keys(process.env)
    .filter(k => /razorpay/i.test(k))
    .map(k => JSON.stringify(k));

  const mode = id.startsWith('rzp_live_') ? 'live' : id.startsWith('rzp_test_') ? 'test' : 'unknown';

  return sendJson(res, 200, {
    ok: Boolean(id && secret),
    vercel_environment: process.env.VERCEL_ENV || 'not on Vercel',
    deployment_url: process.env.VERCEL_URL || null,
    RAZORPAY_KEY_ID: id ? `set (${mode} key)` : 'MISSING',
    RAZORPAY_KEY_SECRET: secret ? `set (${secret.length} chars)` : 'MISSING',
    RAZORPAY_WEBHOOK_SECRET: (process.env.RAZORPAY_WEBHOOK_SECRET || '').trim() ? 'set' : 'MISSING (optional, but recommended for live)',
    razorpay_variable_names_seen: similarNames
  });
}
