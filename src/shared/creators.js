/**
 * Creator codes, shared by the browser and the /api functions.
 *
 * - Waitlist: a creator code gives that % off at launch (instead of FIRSTNIGHT20).
 * - Pre-book: a creator code gives NO extra discount (50% is already the best
 *   price); it is only saved as "Referred By" so you can see which creator
 *   drove paid pre-books.
 *
 * TO ADD A CREATOR: add their code here (uppercase) with their waitlist %,
 * and create the same code with the same % in Shopify.
 * Creator links: https://www.superstate.in/?ref=CODE (works on any page).
 */
export const CREATOR_CODES = {
  ABHIJITH30: 30,
  ABHIMANYU30: 30,
  FAIHA30: 30
};

// Returns the code in canonical form if it's a known creator code, else null.
export function normalizeCreatorCode(code) {
  const c = String(code || '').trim().toUpperCase();
  return Object.prototype.hasOwnProperty.call(CREATOR_CODES, c) ? c : null;
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
