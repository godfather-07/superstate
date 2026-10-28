/**
 * Logs a paid pre-book to the Google Sheet ("Prebooks" tab) via the Apps
 * Script web app. Used by verify-payment (browser confirmation) and the
 * Razorpay webhook (server confirmation). The Apps Script ignores an order
 * it has already logged, so calling this twice for one payment is safe.
 */

const DEFAULT_SHEET_URL = 'https://script.google.com/macros/s/AKfycbza8JLklPSp1mxHHkrtSTtrevjhxTQHkm-cv5Gb7hKbZUVGONPl-1Ot3rO09bK31IZo/exec';

// Returns the member number the sheet assigned, or null.
export async function logPaidPrebook(order, paymentId) {
  const url = process.env.SHEET_WEBHOOK_URL || process.env.VITE_WAITLIST_SHEET_URL || DEFAULT_SHEET_URL;
  const n = order.notes || {};
  const form = new URLSearchParams({
    type: 'prebook',
    name: n.name || '',
    phone: n.phone || '',
    email: n.email || '',
    address: n.address || '',
    pincode: n.pincode || '',
    city: n.city || '',
    state: n.state || '',
    referredBy: n.ref || '',
    discountCode: n.discount_code || '',
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
