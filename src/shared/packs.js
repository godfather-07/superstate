/**
 * Single source of truth for Sleep Well pricing and discount codes.
 * Imported by the browser (src/prebook.js, product page) AND the server
 * (api/), so the amount Razorpay charges is always computed server-side.
 *
 * Launch sale:
 * - everyone gets LAUNCH_CODE (FIRSTNIGHT20) = 20% off, applied automatically
 * - a creator code from src/shared/creators.js = that creator's % (30%) and a
 *   creator gift package with the order
 * - the 30-night pack always comes with a special SuperState gift
 */

import { CREATORS, normalizeCreatorCode } from './creators.js';

export const PACKS = {
  'Pack Of 5': { price: 299, serves: 5 },
  'Pack Of 15': { price: 900, serves: 15 },
  'Pack Of 30': { price: 1500, serves: 30 }
};

export const LAUNCH_CODE = 'FIRSTNIGHT20';
export const LAUNCH_DISCOUNT_PCT = 20;
export const GIFT_PACK = 'Pack Of 30';
export const MAX_QTY = 20;

// Resolves a typed code. Blank = the launch code. Unknown = null.
export function discountFor(code) {
  const c = String(code || '').trim().toUpperCase();
  if (!c || c === LAUNCH_CODE) return { code: LAUNCH_CODE, pct: LAUNCH_DISCOUNT_PCT, creator: null };
  const creator = normalizeCreatorCode(c);
  if (creator) return { code: creator, pct: CREATORS[creator].discount, creator };
  return null;
}

// Rupee amounts plus the paise amount Razorpay needs, or null if the
// pack/qty/code is invalid. `pre` is what the customer pays.
export function priceFor(pack, qty, code) {
  const p = PACKS[pack];
  const q = Number(qty);
  const d = discountFor(code);
  if (!p || !d || !Number.isInteger(q) || q < 1 || q > MAX_QTY) return null;
  const full = p.price * q;
  const prePaise = Math.round(full * (100 - d.pct)); // full * 100 * (1 - pct/100)
  return { full, pre: prePaise / 100, prePaise, off: full - prePaise / 100, pct: d.pct, code: d.code, creator: d.creator };
}
