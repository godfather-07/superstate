/**
 * Superstate Pre-book Service
 *
 * Pre-booking = pay today at 50% off via Razorpay Standard Checkout.
 *   1. POST /api/create-order   -> server prices the pack and creates the order
 *   2. Razorpay modal           -> customer pays
 *   3. POST /api/verify-payment -> server checks the signature, logs the paid
 *                                  pre-book to the sheet, returns a member number
 * The Key Secret only ever lives on the server (api/).
 */

import { PACKS, priceFor } from '../shared/packs.js';

export const PREBOOK_CONFIG = {
  // Batch 01 customers who already have a card. Keep this number true.
  BATCH01_MEMBERS: 27,
  STORAGE_KEY: 'superstate_prebook'
};

export { PACKS, priceFor };

export function formatINR(n) {
  return Number.isInteger(n)
    ? n.toLocaleString('en-IN')
    : n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function validatePrebook({ name, phone, email }) {
  const errors = {};
  if (!name || name.trim().length < 2) errors.name = 'Please enter your name.';
  const digits = (phone || '').replace(/\D/g, '').replace(/^91(?=\d{10}$)/, '');
  if (!/^[6-9]\d{9}$/.test(digits)) errors.phone = 'Enter a 10-digit WhatsApp number.';
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errors.email = 'Enter a valid email address.';
  return { isValid: Object.keys(errors).length === 0, errors, phone: digits };
}

export function getSavedPrebook() {
  try {
    const raw = localStorage.getItem(PREBOOK_CONFIG.STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export function clearSavedPrebook() {
  try { localStorage.removeItem(PREBOOK_CONFIG.STORAGE_KEY); } catch (e) { /* silent */ }
}

export function memberIdFor(memberNumber, phone) {
  return memberNumber
    ? `Nº ${String(memberNumber).padStart(3, '0')}`
    : `SS-${String(phone).slice(-4)}`;
}

export function savePrebook(record) {
  try { localStorage.setItem(PREBOOK_CONFIG.STORAGE_KEY, JSON.stringify(record)); } catch (e) { /* silent */ }
}

async function postJson(url, body) {
  let res;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
  } catch (e) {
    return { ok: false, data: { error: 'No internet connection. Please try again.' } };
  }
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

export function createOrder(details) {
  return postJson('/api/create-order', details);
}

export function verifyPayment(response) {
  return postJson('/api/verify-payment', {
    razorpay_order_id: response.razorpay_order_id,
    razorpay_payment_id: response.razorpay_payment_id,
    razorpay_signature: response.razorpay_signature
  });
}
