/**
 * Creator codes, shared by the browser and the /api functions.
 *
 * - Waitlist: a creator code gives that % off at launch (instead of FIRSTNIGHT20).
 * - Pre-book: a creator code gives NO discount; it is only saved as
 *   "Referred By" so you can see which creator drove paid pre-books.
 *
 * - Pre-book via a creator: the order also comes with a creator gift package
 *   (shown on the pre-book page; "Referred By" in the sheet = ship the gift).
 *
 * TO ADD A CREATOR: add their code here (uppercase) with their display name
 * and waitlist %, and create the same code with the same % in Shopify.
 * Creator links: https://www.superstate.in/?ref=CODE (works on any page).
 */
export const CREATORS = {
  ABHIJITH30: { name: 'Abhijith', discount: 30 },
  ABHIMANYU30: { name: 'Abhimanyu', discount: 30 },
  FAIHA30: { name: 'Faiha', discount: 30 },
  KRISHNA30: { name: 'Krishna', discount: 30 },
  SALIH30: { name: 'Salih', discount: 30 },
  SHAMNAS30: { name: 'Shamnas', discount: 30 }
};

// Returns the code in canonical form if it's a known creator code, else null.
export function normalizeCreatorCode(code) {
  const c = String(code || '').trim().toUpperCase();
  return Object.prototype.hasOwnProperty.call(CREATORS, c) ? c : null;
}

export function creatorName(code) {
  const c = normalizeCreatorCode(code);
  return c ? CREATORS[c].name : null;
}

/* Remembering a creator link (?ref=CODE or ?code=CODE) across pages */
const REF_KEY = 'superstate_ref';
const REF_DAYS = 30;

export function captureRefFromUrl() {
  let code = null;
  try {
    const p = new URLSearchParams(window.location.search);
    code = normalizeCreatorCode(p.get('ref') || p.get('code'));
  } catch (e) { /* ignore */ }
  if (code) {
    try { localStorage.setItem(REF_KEY, JSON.stringify({ code, at: Date.now() })); } catch (e) { /* private mode */ }
  }
  return code;
}

export function getStoredRef() {
  try {
    const r = JSON.parse(localStorage.getItem(REF_KEY) || 'null');
    if (r && Date.now() - r.at < REF_DAYS * 864e5) return normalizeCreatorCode(r.code);
  } catch (e) { /* ignore */ }
  return null;
}
