import {
  PACKS, priceFor, discountFor, LAUNCH_CODE, GIFT_PACK, formatINR, validatePrebook,
  getSavedPrebook, clearSavedPrebook, savePrebook, memberIdFor, createOrder, verifyPayment
} from './services/prebookService.js';
import { captureRefFromUrl, getStoredRef, creatorName } from './shared/creators.js';
import { initPixel, track, gaClientId } from './shared/pixel.js';

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
  if (!name) return;
  $('pv-gift-title').textContent = `because you follow ${name} 🎁`;
  $('pv-gift-text').textContent = `you get ${d.pct}% off, and your order comes with a special package of SuperState gifts, just for ${name}'s community.`;
  $('pv-gift-line-label').textContent = `${name}'s gift package`;
}

document.querySelectorAll('.pv-pack').forEach(btn => btn.addEventListener('click', () => {
  pack = btn.dataset.pack;
  renderOrder(true);
}));
$('pv-minus').addEventListener('click', () => { if (qty > 1) { qty--; renderOrder(true); } });
$('pv-plus').addEventListener('click', () => { if (qty < 20) { qty++; renderOrder(true); } });
refInput.addEventListener('input', () => { setError('ref', ''); renderOrder(true); });

/* ---------- Returning customer: show their last order ---------- */
const saved = getSavedPrebook();
if (saved && saved.paid && !params.get('pack')) showDone(saved, false);

/* ---------- Form ---------- */
const form = $('pb-form');
const fields = ['name', 'phone', 'email', 'address', 'pincode', 'city', 'state', 'ref'];
fields.forEach(f => $(`pb-${f}`).addEventListener('input', () => setError(f, '')));

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
    const firstBad = fields.find(f => check.errors[f]);
    Object.entries(check.errors).forEach(([k, msg]) => setError(k, msg));
    if (firstBad) $(`pb-${firstBad}`).focus();
    return;
  }
  details.phone = check.phone;

  if (typeof window.Razorpay !== 'function') {
    setError('form', "Payments couldn't load. Check your connection and refresh the page.");
    return;
  }

  // 1. Server creates the order (and decides the amount, including the discount)
  setBusy(true, 'opening secure payment…');
  const order = await createOrder({ ...details, code: d.code, pack, qty, ga_cid: gaClientId() });
  if (!order.ok) {
    setBusy(false);
    setError('form', order.data.error || 'Could not start the payment. Please try again.');
    return;
  }

  const creator = d.creator || undefined;
  track('AddPaymentInfo', { content_name: `Sleep Well · ${pack}`, content_ids: ['sleep-well'], currency: 'INR', value: price.pre, num_items: qty, creator });

  // 2. Razorpay checkout modal
  const rzp = new window.Razorpay({
    key: order.data.key_id, // public Key ID, sent by our server with each order
    order_id: order.data.order_id,
    amount: order.data.amount,
    currency: order.data.currency,
    name: 'SuperState',
    description: `Sleep Well · ${pack} × ${qty} (${d.code}, ${d.pct}% off)`,
    image: `${location.origin}/logo-wordmark.png`,
    prefill: { name: details.name, email: details.email, contact: `+91${details.phone}` },
    notes: { pack, qty: String(qty) },
    theme: { color: '#003399' },
    // Only UPI and cards are enabled on our Razorpay account for now.
    config: {
      display: {
        blocks: {
          pay: {
            name: 'Pay with UPI or card',
            instruments: [{ method: 'upi' }, { method: 'card' }]
          }
        },
        sequence: ['block.pay'],
        preferences: { show_default_blocks: false }
      }
    },
    handler: async response => {
      // 3. Server verifies the signature before we show anything as paid
      setBusy(true, 'confirming your payment…');
      const result = await verifyPayment(response);
      if (!result.ok || !result.data.verified) {
        setBusy(false);
        setError('form', `We couldn't confirm this payment. If money left your account, WhatsApp us with ID ${response.razorpay_payment_id} and we'll sort it out.`);
        return;
      }
      const orderNumber = result.data.member_number || null;
      const record = {
        ...details,
        pack,
        qty,
        code: d.code,
        pct: d.pct,
        creator: d.creator,
        fullPrice: price.full,
        prebookPrice: price.pre,
        saved: price.off,
        paid: true,
        paymentId: response.razorpay_payment_id,
        orderId: response.razorpay_order_id,
        submittedAt: new Date().toISOString(),
        orderNumber,
        orderLabel: memberIdFor(orderNumber, details.phone)
      };
      savePrebook(record);
      // eventID = Razorpay payment id, so a future server-side (CAPI) event can be de-duplicated
      track('Purchase', {
        content_name: `Sleep Well · ${pack}`, content_ids: ['sleep-well'], content_type: 'product',
        currency: 'INR', value: price.pre, num_items: qty, creator, coupon: d.code
      }, { eventID: response.razorpay_payment_id });
      setBusy(false);
      showDone(record, true);
    },
    modal: {
      ondismiss: () => {
        setBusy(false);
        setError('form', 'Payment cancelled. Your launch discount is still here whenever you’re ready.');
      }
    }
  });

  rzp.on('payment.failed', resp => {
    const reason = resp && resp.error && resp.error.description;
    setBusy(false);
    setError('form', `Payment failed${reason ? `: ${reason}` : ''}. No money was taken. Please try again.`);
  });

  rzp.open();
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
