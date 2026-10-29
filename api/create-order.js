/**
 * POST /api/create-order
 * Body: { pack, qty, name, phone, email, address, pincode, city, state, code }
 * code = discount code. Blank or FIRSTNIGHT20 = 20% off (everyone); a creator
 * code = 30% off and is saved as `ref` (Referred By) for the creator gift.
 * Returns: { order_id, amount, currency, key_id }
 *
 * The amount is computed here from the pack table (never taken from the
 * client), so nobody can change what they pay by editing the request.
 */

import { getRazorpay, getKeys, sendJson, readJson, razorpayErrorStatus, missingKeysMessage } from './_lib/razorpay.js';
import { priceFor, discountFor } from '../src/shared/packs.js';

const MIN_AMOUNT_PAISE = 100;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  const razorpay = getRazorpay();
  if (!razorpay) {
    console.error('create-order: RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET not set');
    return sendJson(res, 500, { error: missingKeysMessage() });
  }

  const body = await readJson(req);
  if (!body) return sendJson(res, 400, { error: 'Invalid JSON body.' });

  const { pack, name = '', phone = '', email = '', address = '', pincode = '', city = '', state = '' } = body;
  // Blank code = FIRSTNIGHT20 (20% for everyone); a creator code = 30%.
  // `ref` is accepted too, for links made before the launch sale.
  const code = body.code || body.ref || '';
  if (!discountFor(code)) return sendJson(res, 400, { error: "We don't know that code." });
  const price = priceFor(pack, Number(body.qty), code);
  if (!price) return sendJson(res, 400, { error: 'Unknown pack or quantity.' });
  const ref = price.creator || '';
  if (price.prePaise < MIN_AMOUNT_PAISE) {
    return sendJson(res, 400, { error: 'Amount must be at least ₹1.' });
  }

  try {
    const order = await razorpay.orders.create({
      amount: price.prePaise,
      currency: 'INR',
      receipt: `prebook_${Date.now()}`,
      // Kept on the order so verify-payment can trust them later.
      // type stays 'prebook' so the webhook and the sheet's Prebooks tab keep working.
      notes: {
        type: 'prebook',
        pack,
        qty: String(Number(body.qty)),
        name: String(name).slice(0, 80),
        phone: String(phone).replace(/\D/g, '').slice(-10),
        email: String(email).slice(0, 120),
        address: String(address).slice(0, 200),
        pincode: String(pincode).replace(/\D/g, '').slice(0, 6),
        city: String(city).slice(0, 40),
        state: String(state).slice(0, 40),
        ref,
        discount_code: price.code,
        full_price: String(price.full),
        // GA4 client id, so the server-side purchase joins this visitor's session
        ga_cid: /^\d+\.\d+$/.test(String(body.ga_cid || '')) ? String(body.ga_cid) : ''
      }
    });
    return sendJson(res, 200, {
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: getKeys().keyId
    });
  } catch (err) {
    const status = razorpayErrorStatus(err);
    console.error('create-order: Razorpay error', status, err && (err.error || err.message));
    return sendJson(res, status, {
      error: status === 401 ? 'Payment provider rejected our credentials.' : 'Could not start the payment. Please try again.'
    });
  }
}
