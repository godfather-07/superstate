/**
 * Superstate Pre-book Service
 *
 * Payments aren't live yet (Razorpay approval pending), so a pre-book is a
 * reservation: we store the pack, quantity and contact details in the
 * "Prebooks" tab of the waitlist sheet, then WhatsApp a Razorpay link to
 * confirm at the pre-book price once payments open.
 *
 * MEMBER NUMBERS come from the Apps Script (google-apps-script/
 * waitlist-webhook.gs), which counts pre-book rows. Until that updated
 * script is deployed, the card shows an ID based on the phone number.
 */

import { WAITLIST_CONFIG } from './waitlistService.js';

export const PREBOOK_CONFIG = {
  // Full (MRP) price per pack; pre-book is 50% off.
  PACKS: {
    'Pack Of 5': { price: 299, serves: 5 },
    'Pack Of 15': { price: 900, serves: 15 },
    'Pack Of 30': { price: 1500, serves: 30 }
  },
  DISCOUNT_PCT: 50,
  // Batch 01 customers who already have a card. Keep this number true.
  BATCH01_MEMBERS: 27,
  STORAGE_KEY: 'superstate_prebook',
  SHEET_WEBHOOK_URL: WAITLIST_CONFIG.SHEET_WEBHOOK_URL
};

export function priceFor(pack, qty) {
  const p = PREBOOK_CONFIG.PACKS[pack];
  if (!p) return null;
  const full = p.price * qty;
  const pre = Math.round(full * (100 - PREBOOK_CONFIG.DISCOUNT_PCT)) / 100;
  return { full, pre };
}

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

export async function submitPrebook({ name, phone, email, pack, qty }) {
  const check = validatePrebook({ name, phone, email });
  if (!check.isValid) return { success: false, errors: check.errors };

  const price = priceFor(pack, qty);
  if (!price) return { success: false, errors: { form: 'Please pick a pack again.' } };

  const record = {
    type: 'prebook',
    name: name.trim(),
    phone: check.phone,
    email: email.trim().toLowerCase(),
    pack,
    qty,
    fullPrice: price.full,
    prebookPrice: price.pre,
    submittedAt: new Date().toISOString(),
    memberNumber: null
  };

  record.memberNumber = await sendToSheet(record);
  record.memberId = record.memberNumber
    ? `Nº ${String(record.memberNumber).padStart(3, '0')}`
    : `SS-${record.phone.slice(-4)}`;

  try { localStorage.setItem(PREBOOK_CONFIG.STORAGE_KEY, JSON.stringify(record)); } catch (e) { /* silent */ }
  return { success: true, record };
}

// Returns the member number if the deployed Apps Script provides one.
async function sendToSheet(record) {
  if (!PREBOOK_CONFIG.SHEET_WEBHOOK_URL) return null;
  const fd = new FormData();
  Object.entries(record).forEach(([k, v]) => { if (v !== null) fd.append(k, v); });
  try {
    // Apps Script ContentService responses are readable cross-origin for a
    // plain form POST, so we can read the member number back.
    const res = await fetch(PREBOOK_CONFIG.SHEET_WEBHOOK_URL, { method: 'POST', body: fd });
    const data = await res.json().catch(() => ({}));
    const n = Number(data.memberNumber);
    return Number.isInteger(n) && n > 0 ? n : null;
  } catch (e) {
    // Couldn't read the response: make sure the row still lands.
    try {
      await fetch(PREBOOK_CONFIG.SHEET_WEBHOOK_URL, { method: 'POST', mode: 'no-cors', body: fd });
    } catch (e2) { /* non-fatal: saved locally */ }
    return null;
  }
}
