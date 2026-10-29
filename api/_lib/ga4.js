/**
 * Sends the purchase to Google Analytics 4 from the server (Measurement
 * Protocol), so a sale is counted even if the customer's browser never got
 * back to our page after paying (UPI app switch, closed tab, ad blocker).
 *
 * Needs GA4_API_SECRET (GA4 → Admin → Data streams → web stream →
 * Measurement Protocol API secrets). The browser's GA client id travels on
 * the Razorpay order (notes.ga_cid) so the sale joins the visitor's session.
 * The browser also sends `purchase` with the same transaction_id.
 */

export const GA4_MEASUREMENT_ID = 'G-5915THJCM5';

export function ga4Configured() {
  return Boolean((process.env.GA4_API_SECRET || '').trim());
}

export async function sendGa4Purchase(order, paymentId) {
  const secret = (process.env.GA4_API_SECRET || '').trim();
  if (!secret) return false;
  const n = order.notes || {};
  const clientId = /^\d+\.\d+$/.test(n.ga_cid || '') ? n.ga_cid : `${Date.now()}.${Math.floor(Math.random() * 1e9)}`;
  const value = order.amount / 100;
  const item = { item_id: 'sleep-well', item_name: `Sleep Well · ${n.pack || ''}`.trim(), quantity: Number(n.qty) || 1 };
  if (n.discount_code) item.coupon = n.discount_code;
  const params = { transaction_id: paymentId, value, currency: 'INR', items: [item] };
  if (n.discount_code) params.coupon = n.discount_code;
  if (n.ref) params.creator = n.ref;
  const url = `https://www.google-analytics.com/mp/collect?measurement_id=${GA4_MEASUREMENT_ID}&api_secret=${encodeURIComponent(secret)}`;
  const res = await fetch(url, { method: 'POST', body: JSON.stringify({ client_id: clientId, events: [{ name: 'purchase', params }] }) });
  return res.ok;
}
