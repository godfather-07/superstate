/**
 * GET /api/pincode?pin=682001 -> { city, state }
 * Lets the checkout fill in city and state from the pincode, so customers
 * type less. Uses India Post's public pincode directory; 404 if unknown.
 * The checkout falls back to plain city/state fields if this fails.
 */

import { sendJson } from './_lib/razorpay.js';

export default async function handler(req, res) {
  const url = new URL(req.url, 'http://x');
  const pin = String(url.searchParams.get('pin') || '');
  if (!/^[1-9]\d{5}$/.test(pin)) return sendJson(res, 400, { error: 'Enter a 6-digit pincode.' });

  try {
    const r = await fetch(`https://api.postalpincode.in/pincode/${pin}`, { signal: AbortSignal.timeout(4000) });
    const data = await r.json();
    const office = data && data[0] && data[0].Status === 'Success' && data[0].PostOffice && data[0].PostOffice[0];
    if (!office) return sendJson(res, 404, { error: 'Unknown pincode.' });
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'public, s-maxage=2592000, max-age=86400'); // pincodes rarely change
    return res.end(JSON.stringify({ city: office.District, state: office.State }));
  } catch (err) {
    console.error('pincode lookup failed', err && err.message);
    return sendJson(res, 502, { error: 'Lookup unavailable.' });
  }
}
