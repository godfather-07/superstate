/**
 * Superstate Waitlist Service
 *
 * COUPON LOGIC: one code for everyone. Every signup gets FIRSTNIGHT20
 * (20% off at launch); there is no code field on the form.
 * The sheet keeps its Promo Code / Discount / Is Influencer columns so the
 * existing Apps Script keeps working.
 */

export const WAITLIST_CONFIG = {
  EARLY_ACCESS_CODE: 'FIRSTNIGHT20',
  EARLY_ACCESS_DISCOUNT: 20,
  STORAGE_KEY_USER: 'superstate_waitlist_user',
  STORAGE_KEY_ALL: 'superstate_waitlist_submissions',
  SIMULATE_LATENCY_MS: 900,
  // Apps Script Web App URL for the "Influencer Waitlist Responses" sheet.
  // Not a secret (it's inlined into the client bundle either way) — override
  // it with VITE_WAITLIST_SHEET_URL if the script is ever redeployed.
  SHEET_WEBHOOK_URL: import.meta.env.VITE_WAITLIST_SHEET_URL
    || 'https://script.google.com/macros/s/AKfycbxhS7lMkCtr6ClWnCTr4vg0STeSdXis1Tr3prD5KljXsBfZ_II9t9UGO6aJxMrXTMxJ/exec'
};

export function resolveCoupon() {
  return {
    code: WAITLIST_CONFIG.EARLY_ACCESS_CODE,
    discount: WAITLIST_CONFIG.EARLY_ACCESS_DISCOUNT,
    isInfluencer: false,
    isValid: true
  };
}

export function validateForm({ name, email, phone }, coupon) {
  const errors = {};
  if (!name || name.trim().length < 2) errors.name = 'Please enter your full name.';
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errors.email = 'Enter a valid email address.';
  if (!phone || !phone.trim()) {
    errors.phone = 'Phone number is required.';
  } else {
    const clean = phone.replace(/[\s\-\+\(\)]/g, '');
    if (!/^\d{7,15}$/.test(clean)) errors.phone = 'Enter a valid phone number.';
  }
  if (coupon && !coupon.isValid) {
    errors.code = 'Invalid code. Leave blank for the standard discount.';
  }
  return { isValid: Object.keys(errors).length === 0, errors };
}

export function getSavedSubmission() {
  try {
    const raw = localStorage.getItem(WAITLIST_CONFIG.STORAGE_KEY_USER);
    return raw ? JSON.parse(raw) : null;
  } catch (e) { return null; }
}

export function clearSavedSubmission() {
  try { localStorage.removeItem(WAITLIST_CONFIG.STORAGE_KEY_USER); } catch (e) { /* silent */ }
}

export async function submitWaitlist(data) {
  const coupon = resolveCoupon(data.promoCode);

  const record = {
    name: data.name.trim(),
    email: data.email.trim().toLowerCase(),
    phone: (data.phone || '').trim(),
    gender: data.gender || 'prefer_not_to_say',
    promoCode: coupon.isValid ? coupon.code : '',
    discount: coupon.discount,
    isInfluencer: coupon.isInfluencer,
    submittedAt: new Date().toISOString()
  };

  const validation = validateForm(record, coupon);
  if (!validation.isValid) return { success: false, errors: validation.errors };

  await new Promise(r => setTimeout(r, WAITLIST_CONFIG.SIMULATE_LATENCY_MS));

  try {
    localStorage.setItem(WAITLIST_CONFIG.STORAGE_KEY_USER, JSON.stringify(record));
    const all = JSON.parse(localStorage.getItem(WAITLIST_CONFIG.STORAGE_KEY_ALL) || '[]');
    const idx = all.findIndex(r => r.email === record.email);
    if (idx >= 0) all[idx] = record; else all.push(record);
    localStorage.setItem(WAITLIST_CONFIG.STORAGE_KEY_ALL, JSON.stringify(all));
  } catch (e) { /* silent */ }

  await sendToSheet(record);

  return { success: true, record };
}

async function sendToSheet(record) {
  if (!WAITLIST_CONFIG.SHEET_WEBHOOK_URL) return;
  try {
    const fd = new FormData();
    Object.entries(record).forEach(([k, v]) => fd.append(k, v));
    // no-cors: Apps Script web apps don't return CORS headers; the request
    // still lands and appends the row, we just can't read the response.
    await fetch(WAITLIST_CONFIG.SHEET_WEBHOOK_URL, { method: 'POST', mode: 'no-cors', body: fd });
  } catch (e) { /* non-fatal: local submission already saved */ }
}
