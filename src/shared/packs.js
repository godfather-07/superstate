/**
 * Single source of truth for Sleep Well pre-book pricing.
 * Imported by the browser (src/prebook.js) AND the server (api/), so the
 * amount Razorpay charges is always computed server-side from these values.
 */

export const PACKS = {
  'Pack Of 5': { price: 299, serves: 5 },
  'Pack Of 15': { price: 900, serves: 15 },
  'Pack Of 30': { price: 1500, serves: 30 }
};

export const PREBOOK_DISCOUNT_PCT = 50;
export const MAX_QTY = 20;

// Returns rupee amounts plus the paise amount Razorpay needs, or null if the
// pack/qty is invalid.
export function priceFor(pack, qty) {
  const p = PACKS[pack];
  const q = Number(qty);
  if (!p || !Number.isInteger(q) || q < 1 || q > MAX_QTY) return null;
  const full = p.price * q;
  const prePaise = Math.round(full * (100 - PREBOOK_DISCOUNT_PCT)); // full * 100 * (1 - pct/100)
  return { full, pre: prePaise / 100, prePaise };
}
