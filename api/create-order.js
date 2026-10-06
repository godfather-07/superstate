/**
 * POST /api/create-order
 * Body: { pack, qty, name, phone, email }
 * Returns: { order_id, amount, currency, key_id }
 *
 * The amount is computed here from the pack table (never taken from the
 * client), so nobody can change what they pay by editing the request.
 */

import { getRazorpay, getKeys, sendJson, readJson, razorpayErrorStatus } from './_lib/razorpay.js';
import { priceFor } from '../src/shared/packs.js';

const MIN_AMOUNT_PAISE = 100;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  const razorpay = getRazorpay();
  if (!razorpay) {
    console.error('create-order: RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET not set');
    return sendJson(res, 500, { error: 'Payments are not configured yet.' });
  }

  const body = await readJson(req);
  if (!body) return sendJson(res, 400, { error: 'Invalid JSON body.' });

  const { pack, name = '', phone = '', email = '' } = body;
  const price = priceFor(pack, Number(body.qty));
  if (!price) return sendJson(res, 400, { error: 'Unknown pack or quantity.' });
  if (price.prePaise < MIN_AMOUNT_PAISE) {
    return sendJson(res, 400, { error: 'Amount must be at least ₹1.' });
  }

  try {
    const order = await razorpay.orders.create({
      amount: price.prePaise,
      currency: 'INR',
      receipt: `prebook_${Date.now()}`,
      // Kept on the order so verify-payment can trust them later.
      notes: {
        type: 'prebook',
        pack,
        qty: String(Number(body.qty)),
        name: String(name).slice(0, 80),
        phone: String(phone).replace(/\D/g, '').slice(-10),
        email: String(email).slice(0, 120),
        full_price: String(price.full)
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
