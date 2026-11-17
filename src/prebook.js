import {
  PACKS, priceFor, discountFor, LAUNCH_CODE, GIFT_PACK, formatINR, validatePrebook,
  getSavedPrebook, clearSavedPrebook, savePrebook, memberIdFor
} from './services/prebookService.js';
import { captureRefFromUrl, getStoredRef, creatorName } from './shared/creators.js';
import { initPixel, track, gaClientId } from './shared/pixel.js';

/* ---------- Abandoned cart tracking ---------- */
const SHEET_URL = 'https://script.google.com/macros/s/AKfycbwaEJowZ6_LHvjI9F8zuk9WPy_rffW3X9U9HTcllmgRVwebnIhTlOw1dmvSBjMnvNoh/exec';
function trackCheckoutStarted(details, pack, qty, amount) {
  fetch(SHEET_URL, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event: 'checkout_started',
      name: details.name,
      whatsapp: details.phone,
      email: details.email,
      pincode: details.pincode,
      product: 'Sleep Well',
      pack,
      qty,
      amount,
      timestamp: new Date().toISOString()
    })
  }).catch(() => {});
}

initPixel();

const $ = id => document.getElementById(id);
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const rupees = n => `₹${formatINR(n)}`;

/* ---------- Pack, quantity and discount code ---------- */
const params = new URLSearchParams(location.search);
let pack = PACKS[params.get('pack')] ? params.get('pack') : 'Pack Of 5';
let qty = Math.min(Math.max(parseInt(params.get('qty'), 10) || 1, 1), 20);
// A creator link (?ref= on this or an earlier page) pre-fills their code.
const linkRef = captureRefFromUrl() || getStoredRef();
const refInput = $('pb-ref');
if (linkRef) refInput.value = linkRef;

// The code we price with: the typed one if valid, else the launch code.
const typedCode = () => refInput.value.trim();
const activeDiscount = () => discountFor(typedCode()) || discountFor(LAUNCH_CODE);
let price = priceFor(pack, qty, activeDiscount().code);
track('InitiateCheckout', { content_name: 'Sleep Well', content_ids: ['sleep-well'], currency: 'INR', value: price.pre, creator: activeDiscount().creator || undefined });

// Arrived from the product page with a pack already chosen: skip the pack
// picker and marketing, show a short summary + one form (class set in <head>).
const express = document.documentElement.classList.contains('pv-express');

const submitBtn = $('pb-submit');
const payLabel = () => `pay ${rupees(price.pre)} →`;

function renderOrder(animate) {
  const d = activeDiscount();
  price = priceFor(pack, qty, d.code);

  document.querySelectorAll('.pv-pack').forEach(btn => {
    btn.setAttribute('aria-checked', String(btn.dataset.pack === pack));
  });
  document.querySelectorAll('.pv-pack-price').forEach(el => {
    const p = priceFor(el.dataset.for, 1, d.code);
    el.innerHTML = `${rupees(p.pre)} <s>${rupees(p.full)}</s>`;
  });
  $('pv-qty').textContent = qty;
  $('pv-minus').disabled = qty <= 1;
  $('pv-plus').disabled = qty >= 20;

  $('pv-line-label').textContent = `Sleep Well · ${pack} × ${qty}`;
  $('pv-line-mrp').textContent = rupees(price.full);
  $('pv-line-off-label').textContent = d.creator
    ? `${creatorName(d.code)}'s code · ${d.code} (${d.pct}%)`
    : `launch discount · ${d.code} (${d.pct}%)`;
  $('pv-line-off').textContent = `−${rupees(price.off)}`;
  $('pv-pack-gift-line').hidden = pack !== GIFT_PACK;
  const total = $('pv-total');
  total.textContent = rupees(price.pre);
  if (animate && !reduceMotion) { total.classList.remove('bump'); void total.offsetWidth; total.classList.add('bump'); }
  $('pv-saved').innerHTML = `you save <b class="num">${rupees(price.off)}</b>`;
  $('pv-badge').textContent = `−${d.pct}%`;

  const serves = PACKS[pack].serves;
  $('pv-x-name').textContent = `Sleep Well · ${serves} sachets`;
  $('pv-x-serve').textContent = pack === GIFT_PACK ? `${serves} nights · + a SuperState gift 🎁` : `${serves} nights · 1 sachet a night`;
  $('pv-x-qty').textContent = qty;
  $('pv-x-minus').disabled = qty <= 1;
  $('pv-x-plus').disabled = qty >= 20;

  $('pv-sticky-label').textContent = `${pack} × ${qty}`;
  $('pv-sticky-total').textContent = rupees(price.pre);
  if (!submitBtn.disabled) submitBtn.textContent = payLabel();
  renderGift(d);
  history.replaceState(null, '', `?pack=${encodeURIComponent(pack)}&qty=${qty}${d.creator ? `&ref=${d.creator}` : ''}`);
}

// Creator followers get a gift package with their order
function renderGift(d) {
  const name = d.creator ? creatorName(d.creator) : null;
  $('pv-gift').hidden = !name;
  $('pv-gift-line').hidden = !name;
  const note = $('pb-ref-note');
  const raw = typedCode();
  if (raw && !discountFor(raw)) {
    note.innerHTML = `we don't know <b>${raw.toUpperCase().replace(/[^A-Z0-9]/g, '')}</b>. you still get 20% off with ${LAUNCH_CODE}.`;
  } else if (name) {
    note.innerHTML = `<span class="pb-ref-ok">✓ ${d.code} applied: ${d.pct}% off + ${name}'s gift package 🎁</span>`;
  } else {
    note.innerHTML = `<span class="pb-ref-ok">✓ ${LAUNCH_CODE} applied: 20% off.</span> got a creator's code? type it here for 30% off + a free gift 🎁`;
  }
  renderCodeApplied(d, raw);
  if (!name) return;
  $('pv-gift-title').textContent = `because you follow ${name} 🎁`;
  $('pv-gift-text').textContent = `you get ${d.pct}% off, and your order comes with a special package of SuperState gifts, just for ${name}'s community.`;
  $('pv-gift-line-label').textContent = `${name}'s gift package`;
}

// Express mode: the code box stays tucked away unless someone wants it
const codeField = $('pb-code-field');
function renderCodeApplied(d, raw) {
  const el = $('pb-code-applied');
  if (raw && !discountFor(raw)) codeField.classList.add('open');
  if (codeField.classList.contains('open')) { el.textContent = ''; return; }
  el.innerHTML = d.creator
    ? `✓ ${d.code} applied: ${d.pct}% off + ${creatorName(d.creator)}'s gift 🎁 <button type="button" data-code-open>change</button>`
    : `✓ 20% launch discount applied. <button type="button" data-code-open>have a creator code?</button>`;
}
$('pb-code-applied').addEventListener('click', e => {
  if (!e.target.closest('[data-code-open]')) return;
  codeField.classList.add('open');
  renderCodeApplied(activeDiscount(), typedCode());
  if (!discountFor(typedCode()) || !activeDiscount().creator) refInput.value = '';
  refInput.focus();
});

document.querySelectorAll('.pv-pack').forEach(btn => btn.addEventListener('click', () => {
  pack = btn.dataset.pack;
  renderOrder(true);
}));
$('pv-minus').addEventListener('click', () => { if (qty > 1) { qty--; renderOrder(true); } });
$('pv-plus').addEventListener('click', () => { if (qty < 20) { qty++; renderOrder(true); } });
$('pv-x-minus').addEventListener('click', () => { if (qty > 1) { qty--; renderOrder(true); } });
$('pv-x-plus').addEventListener('click', () => { if (qty < 20) { qty++; renderOrder(true); } });
refInput.addEventListener('input', () => { setError('ref', ''); renderOrder(true); });

/* ---------- Returning customer: show their last order ---------- */
const saved = getSavedPrebook();
if (saved && saved.paid && !params.get('pack')) showDone(saved, false);

/* ---------- Form ---------- */
const form = $('pb-form');
const fields = ['name', 'phone', 'email', 'address', 'pincode', 'city', 'state', 'ref'];
fields.forEach(f => $(`pb-${f}`).addEventListener('input', () => setError(f, '')));

/* ---------- Pincode -> city + state (less typing) ---------- */
const placeRow = $('pb-place-row');
const pinPlace = $('pb-pin-place');
function showPlaceFields() {
  placeRow.classList.remove('auto');
  pinPlace.textContent = '';
}
function showPlace(city, state) {
  placeRow.classList.add('auto');
  pinPlace.innerHTML = `📍 ${city}, ${state} <button type="button">edit</button>`;
}
pinPlace.addEventListener('click', e => { if (e.target.closest('button')) { showPlaceFields(); $('pb-city').focus(); } });
let pinLookup = 0;
async function lookupPincode() {
  const pin = $('pb-pincode').value.replace(/\D/g, '');
  if (!/^[1-9]\d{5}$/.test(pin)) return;
  const id = ++pinLookup;
  pinPlace.textContent = 'finding your city…';
  try {
    const res = await fetch(`/api/pincode?pin=${pin}`);
    const data = await res.json();
    if (id !== pinLookup) return;
    if (!res.ok || !data.city) throw new Error(data.error || 'lookup failed');
    $('pb-city').value = data.city;
    $('pb-state').value = data.state;
    setError('city', ''); setError('state', '');
    showPlace(data.city, data.state);
  } catch (err) {
    if (id === pinLookup) showPlaceFields();
  }
}
$('pb-pincode').addEventListener('input', lookupPincode);
if (express) placeRow.classList.add('auto');

/* ---------- Returning customer: remember their details on this device ---------- */
const DETAILS_KEY = 'superstate_details';
try {
  const remembered = JSON.parse(localStorage.getItem(DETAILS_KEY) || 'null');
  if (remembered) {
    ['name', 'phone', 'email', 'address', 'pincode', 'city', 'state'].forEach(f => {
      if (remembered[f] && !$(`pb-${f}`).value) $(`pb-${f}`).value = remembered[f];
    });
    if (remembered.city && remembered.state) showPlace(remembered.city, remembered.state);
  }
} catch (e) { /* private mode: fine */ }

function setBusy(on, label) {
  submitBtn.disabled = on;
  submitBtn.textContent = on ? label : payLabel();
}
renderOrder(false);

/* ---------- Sticky pay bar (phones): after the hero, until the pay form is on screen ---------- */
const sticky = $('pv-sticky');
const payForm = document.querySelector('.pv-checkout .pb-card-form');
let formOnScreen = false;
function updateSticky() {
  const pastHero = window.scrollY > window.innerHeight * 0.6;
  const show = pastHero && !formOnScreen && !$('pb-reserve').hidden;
  sticky.classList.toggle('visible', show);
  sticky.setAttribute('aria-hidden', show ? 'false' : 'true');
  $('pv-sticky-btn').tabIndex = show ? 0 : -1;
}
if ('IntersectionObserver' in window) {
  new IntersectionObserver(([entry]) => {
    formOnScreen = entry.isIntersecting;
    updateSticky();
  }, { threshold: 0.2 }).observe(payForm);
}
window.addEventListener('scroll', updateSticky, { passive: true });
$('pv-sticky-btn').addEventListener('click', () => {
  payForm.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  setTimeout(() => $('pb-name').focus({ preventScroll: true }), reduceMotion ? 0 : 500);
});

form.addEventListener('submit', async e => {
  e.preventDefault();
  fields.forEach(f => setError(f, ''));
  setError('form', '');

  const details = {
    name: $('pb-name').value.trim(),
    phone: $('pb-phone').value,
    email: $('pb-email').value.trim().toLowerCase(),
    address: $('pb-address').value.trim().replace(/\s+/g, ' '),
    pincode: $('pb-pincode').value.replace(/\D/g, ''),
    city: $('pb-city').value.trim(),
    state: $('pb-state').value.trim()
  };
  const check = validatePrebook(details);
  const d = discountFor(typedCode());
  if (!d) {
    check.isValid = false;
    check.errors.ref = `We don't know that code. Clear it to use ${LAUNCH_CODE} (20% off).`;
  }
  if (!check.isValid) {
    if (check.errors.city || check.errors.state) showPlaceFields();
    const firstBad = fields.find(f => check.errors[f]);
    Object.entries(check.errors).forEach(([k, msg]) => setError(k, msg));
    if (firstBad) $(`pb-${firstBad}`).focus();
    return;
  }
  details.phone = check.phone;
  try { localStorage.setItem(DETAILS_KEY, JSON.stringify(details)); } catch (e) { /* private mode: fine */ }

  // --- Shopify checkout redirect ---
  // Instead of opening a Razorpay modal, we redirect to Shopify's hosted
  // checkout. Shopify handles payment (Razorpay gateway), abandoned cart
  // recovery, order management and analytics natively.

  const SHOPIFY_DOMAIN = 'superstate-2.myshopify.com';
  const SHOPIFY_VARIANT_IDS = {
    'Pack Of 5': 45350782140459,
    'Pack Of 15': 45350782173227,
    'Pack Of 30': 45350782205995
  };

  const variantId = SHOPIFY_VARIANT_IDS[pack];
  if (!variantId) {
    setError('form', 'Something went wrong with this pack. Please refresh and try again.');
    return;
  }

  setBusy(true, 'taking you to checkout…');

  // Track abandoned cart (the customer is leaving our site)
  trackCheckoutStarted(details, pack, qty, price.pre);

  const creator = d.creator || undefined;
  track('AddPaymentInfo', { content_name: `Sleep Well · ${pack}`, content_ids: ['sleep-well'], currency: 'INR', value: price.pre, num_items: qty, creator });

  // Build Shopify cart permalink with pre-filled customer details
  const params = new URLSearchParams();
  if (details.email) params.set('checkout[email]', details.email);
  if (details.name) {
    const [first, ...rest] = details.name.trim().split(/\s+/);
    params.set('checkout[shipping_address][first_name]', first || '');
    params.set('checkout[shipping_address][last_name]', rest.join(' ') || '');
  }
  if (details.phone) params.set('checkout[shipping_address][phone]', `+91${details.phone}`);
  if (details.address) params.set('checkout[shipping_address][address1]', details.address);
  if (details.city) params.set('checkout[shipping_address][city]', details.city);
  if (details.state) params.set('checkout[shipping_address][province]', details.state);
  if (details.pincode) params.set('checkout[shipping_address][zip]', details.pincode);
  params.set('checkout[shipping_address][country]', 'IN');
  if (d.code) params.set('discount', d.code);
  params.set('ref', 'superstate-website');

  const checkoutUrl = `https://${SHOPIFY_DOMAIN}/cart/${variantId}:${qty}?${params.toString()}`;
  window.location.href = checkoutUrl;
});

function setError(field, msg) {
  const el = $(`pb-${field}-err`);
  if (el) el.textContent = msg;
  const input = $(`pb-${field}`);
  if (input && (input.tagName === 'INPUT' || input.tagName === 'TEXTAREA')) input.classList.toggle('err', !!msg);
}

$('pb-again').addEventListener('click', () => {
  clearSavedPrebook();
  location.href = '/products/sleep-well/#buy-section';
});

/* ---------- Order confirmed ---------- */
function showDone(r, celebrate) {
  $('pb-reserve').hidden = true;
  $('pb-done').hidden = false;
  $('pv-sticky').classList.remove('visible');
  window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });

  const first = r.name.split(' ')[0];
  const name = r.creator ? creatorName(r.creator) : null;
  $('pb-done-sub').textContent = `${first}, your Sleep Well ships in 5–7 working days.`;
  $('pb-order-no').textContent = r.orderLabel ? `order ${r.orderLabel}` : '';
  $('pb-order-pack').textContent = `Sleep Well · ${r.pack} × ${r.qty}`;
  $('pb-order-paid').textContent = `₹${formatINR(r.prebookPrice)} paid`;
  $('pb-order-saved').textContent = r.saved ? `you saved ₹${formatINR(r.saved)} with ${r.code}` : '';
  const gifts = [];
  if (r.pack === GIFT_PACK) gifts.push('🎁 SuperState gift (30-night pack) in your box');
  if (name) gifts.push(`🎁 ${name}'s gift package in your box`);
  $('pb-order-gifts').innerHTML = gifts.map(g => `<li>${g}</li>`).join('');
  $('pb-step1').textContent = `${r.pack} × ${r.qty} · ₹${formatINR(r.prebookPrice)} paid`;
  $('pb-step2-phone').textContent = `+91 ${r.phone.slice(0, 5)} ${r.phone.slice(5)}`;
  $('pb-payid').textContent = r.paymentId ? `payment ID ${r.paymentId}` : '';
  $('pb-step3').textContent = gifts.length ? 'free shipping across India. your gift comes in the same box' : 'free shipping across India';

  const shareText = `just got SuperState Sleep Well ☾ coffee, but for sleep. 20% off for launch → https://superstate.in/products/sleep-well/`;
  const share = $('pb-share');
  share.href = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
  if (navigator.share) {
    share.addEventListener('click', e => {
      e.preventDefault();
      navigator.share({ title: 'SuperState Sleep Well', text: shareText }).catch(() => {});
    }, { once: true });
  }

  if (celebrate && !reduceMotion) setTimeout(burst, 350);
}

/* ---------- Confetti ---------- */
function burst() {
  const canvas = $('confetti');
  const ctx = canvas.getContext('2d');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = innerWidth * dpr;
  canvas.height = innerHeight * dpr;
  ctx.scale(dpr, dpr);
  const colors = ['#E4FF5A', '#ffffff', '#33cc99', '#ffc9e0', '#9db8ff'];
  const pieces = Array.from({ length: 140 }, () => ({
    x: innerWidth / 2,
    y: innerHeight * 0.38,
    vx: (Math.random() - 0.5) * 14,
    vy: -Math.random() * 13 - 4,
    w: Math.random() * 8 + 4,
    h: Math.random() * 5 + 3,
    rot: Math.random() * Math.PI,
    vr: (Math.random() - 0.5) * 0.3,
    c: colors[Math.floor(Math.random() * colors.length)]
  }));
  let frame = 0;
  (function tick() {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    pieces.forEach(p => {
      p.vy += 0.32; p.vx *= 0.99;
      p.x += p.vx; p.y += p.vy; p.rot += p.vr;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.c;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    });
    if (++frame < 220) requestAnimationFrame(tick);
    else ctx.clearRect(0, 0, innerWidth, innerHeight);
  })();
}
