/**
 * Logs a paid pre-book to the Google Sheet ("Prebooks" tab) via the Apps
 * Script web app. Used by verify-payment (browser confirmation) and the
 * Razorpay webhook (server confirmation). The Apps Script ignores an order
 * it has already logged, so calling this twice for one payment is safe.
 */

const DEFAULT_SHEET_URL = 'https://script.google.com/macros/s/AKfycbza8JLklPSp1mxHHkrtSTtrevjhxTQHkm-cv5Gb7hKbZUVGONPl-1Ot3rO09bK31IZo/exec';

// Returns { memberNumber, duplicate }. duplicate = the sheet had already
// logged this order (the other of verify-payment / webhook got there first).
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
  return { memberNumber: Number.isInteger(num) && num > 0 ? num : null, duplicate: data.result === 'duplicate' };
}

// Saves a contact-form message to the "Messages" tab. Throws if the sheet
// didn't confirm, so the form can tell the visitor to use WhatsApp instead.
export async function logContactMessage(msg) {
  const url = process.env.SHEET_WEBHOOK_URL || process.env.VITE_WAITLIST_SHEET_URL || DEFAULT_SHEET_URL;
  const form = new URLSearchParams({ type: 'contact', ...msg });
  const res = await fetch(url, { method: 'POST', body: form, redirect: 'follow' });
  const data = await res.json().catch(() => ({}));
  if (data.result !== 'success') throw new Error(`sheet replied ${res.status} ${data.result || ''}`.trim());
}
