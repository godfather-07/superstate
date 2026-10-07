import {
  PREBOOK_CONFIG, PACKS, priceFor, formatINR, validatePrebook, getSavedPrebook, clearSavedPrebook,
  savePrebook, memberIdFor, createOrder, verifyPayment
} from './services/prebookService.js';

const $ = id => document.getElementById(id);
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- Pack + price (from the product page link, editable here) ---------- */
const params = new URLSearchParams(location.search);
let pack = PACKS[params.get('pack')] ? params.get('pack') : 'Pack Of 5';
let qty = Math.min(Math.max(parseInt(params.get('qty'), 10) || 1, 1), 20);
let price = priceFor(pack, qty);

const rupees = n => `₹${formatINR(n)}`;

// prices on the pack buttons
document.querySelectorAll('.pv-pack-price').forEach(el => {
  const p = priceFor(el.dataset.for, 1);
  el.innerHTML = `${rupees(p.pre)} <s>${rupees(p.full)}</s>`;
});

function renderOrder(animate) {
  price = priceFor(pack, qty);
  document.querySelectorAll('.pv-pack').forEach(btn => {
    btn.setAttribute('aria-checked', String(btn.dataset.pack === pack));
  });
  $('pv-qty').textContent = qty;
  $('pv-minus').disabled = qty <= 1;
  $('pv-plus').disabled = qty >= 20;
  $('pv-line-label').textContent = `Sleep Well · ${pack} × ${qty}`;
  $('pv-line-mrp').textContent = rupees(price.full);
  $('pv-line-off').textContent = `−${rupees(price.full - price.pre)}`;
  const total = $('pv-total');
  total.textContent = rupees(price.pre);
  if (animate && !reduceMotion) { total.classList.remove('bump'); void total.offsetWidth; total.classList.add('bump'); }
  $('pv-meta').textContent = `BATCH 02 · ${pack.toUpperCase()}${qty > 1 ? ` × ${qty}` : ''}`;
  $('pv-sticky-label').textContent = `${pack} × ${qty}`;
  $('pv-sticky-total').textContent = rupees(price.pre);
  if (!submitBtn.disabled) submitBtn.textContent = payLabel();
  history.replaceState(null, '', `?pack=${encodeURIComponent(pack)}&qty=${qty}`);
}

document.querySelectorAll('.pv-pack').forEach(btn => btn.addEventListener('click', () => {
  pack = btn.dataset.pack;
  renderOrder(true);
}));
$('pv-minus').addEventListener('click', () => { if (qty > 1) { qty--; renderOrder(true); } });
$('pv-plus').addEventListener('click', () => { if (qty < 20) { qty++; renderOrder(true); } });

// live card preview
const now = new Date();
$('pv-since').textContent = `${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getFullYear()).slice(-2)}`;
$('pv-stat-members').textContent = PREBOOK_CONFIG.BATCH01_MEMBERS;
$('pb-name').addEventListener('input', e => {
  const v = e.target.value.trim();
  $('pv-name').textContent = v ? v.toUpperCase() : 'YOUR NAME HERE';
  $('pv-name').classList.toggle('typing', !!v);
});
enableTilt($('pv-card'));

/* ---------- Returning visitor: show their card straight away ---------- */
const saved = getSavedPrebook();
if (saved && !params.get('pack')) showCard(saved, false);

/* ---------- Form ---------- */
const form = $('pb-form');
const fields = ['name', 'phone', 'email'];

fields.forEach(f => $(`pb-${f}`).addEventListener('input', () => setError(f, '')));

const submitBtn = $('pb-submit');
const payLabel = () => `pay ${rupees(price.pre)} · 50% off →`;

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
    email: $('pb-email').value.trim().toLowerCase()
  };
  const check = validatePrebook(details);
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

  // 1. Server creates the order (and decides the amount)
  setBusy(true, 'opening secure payment…');
  const order = await createOrder({ ...details, pack, qty });
  if (!order.ok) {
    setBusy(false);
    setError('form', order.data.error || 'Could not start the payment. Please try again.');
    return;
  }

  // 2. Razorpay checkout modal
  const rzp = new window.Razorpay({
    key: order.data.key_id, // public Key ID, sent by our server with each order
    order_id: order.data.order_id,
    amount: order.data.amount,
    currency: order.data.currency,
    name: 'SuperState',
    description: `Sleep Well · ${pack} × ${qty} (pre-book, 50% off)`,
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
      const memberNumber = result.data.member_number || null;
      const record = {
        ...details,
        pack,
        qty,
        fullPrice: price.full,
        prebookPrice: price.pre,
        paid: true,
        paymentId: response.razorpay_payment_id,
        orderId: response.razorpay_order_id,
        submittedAt: new Date().toISOString(),
        memberNumber,
        memberId: memberIdFor(memberNumber, details.phone)
      };
      savePrebook(record);
      setBusy(false);
      showCard(record, true);
    },
    modal: {
      ondismiss: () => {
        setBusy(false);
        setError('form', 'Payment cancelled. Your 50% off is still here whenever you’re ready.');
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
  if (input && input.tagName === 'INPUT') input.classList.toggle('err', !!msg);
}

$('pb-again').addEventListener('click', () => {
  clearSavedPrebook();
  location.href = '/products/sleep-well/#buy-section';
});

/* ---------- Card reveal ---------- */
function showCard(r, celebrate) {
  $('pb-reserve').hidden = true;
  $('pb-done').hidden = false;
  $('pv-sticky').classList.remove('visible');
  window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });

  const first = r.name.split(' ')[0];
  const since = new Date(r.submittedAt || Date.now());
  $('ss-name').textContent = r.name.toUpperCase();
  $('ss-number').textContent = r.memberId;
  $('ss-meta').textContent = `BATCH 02 · ${r.pack.toUpperCase()}${r.qty > 1 ? ` × ${r.qty}` : ''}`;
  $('ss-since').textContent = `${String(since.getMonth() + 1).padStart(2, '0')}/${String(since.getFullYear()).slice(-2)}`;
  $('pb-done-sub').textContent = `${first}, you're paid up at 50% off. here's your SuperState card.`;
  $('pb-step1').textContent = `${r.pack} × ${r.qty} · ₹${formatINR(r.prebookPrice)} paid (50% off)`;
  $('pb-step2-phone').textContent = `+91 ${r.phone.slice(0, 5)} ${r.phone.slice(5)}`;
  $('pb-payid').textContent = r.paymentId ? `payment ID ${r.paymentId}` : '';

  const others = PREBOOK_CONFIG.BATCH01_MEMBERS;
  $('pb-club-text').innerHTML = r.memberNumber
    ? `you're <strong>member ${r.memberId}</strong>. <strong>${others} night owls</strong> from batch 01 got theirs first`
    : `<strong>${others} night owls</strong> from batch 01 already have theirs`;

  const shareText = `just got my SuperState card ☾ (${r.memberId}). pre-booked Sleep Well at 50% off, coffee but for sleep → https://superstate.in/products/sleep-well/`;
  const share = $('pb-share');
  share.href = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
  if (navigator.share) {
    share.addEventListener('click', e => {
      e.preventDefault();
      navigator.share({ title: 'My SuperState card', text: shareText }).catch(() => {});
    }, { once: true });
  }

  const card = $('ss-card');
  if (celebrate && !reduceMotion) {
    setTimeout(() => { card.classList.add('revealed'); burst(); }, 450);
  } else {
    card.classList.add('revealed');
  }
  enableTilt(card);
}

/* ---------- Holographic tilt ---------- */
function enableTilt(card) {
  if (reduceMotion) return;
  const move = (x, y) => {
    const r = card.getBoundingClientRect();
    const px = Math.min(Math.max((x - r.left) / r.width, 0), 1);
    const py = Math.min(Math.max((y - r.top) / r.height, 0), 1);
    card.classList.add('tilting');
    card.style.setProperty('--mx', `${px * 100}%`);
    card.style.setProperty('--my', `${py * 100}%`);
    card.style.setProperty('--ry', `${(px - 0.5) * 22}deg`);
    card.style.setProperty('--rx', `${(0.5 - py) * 16}deg`);
  };
  const reset = () => {
    card.classList.remove('tilting');
    card.style.setProperty('--rx', '0deg');
    card.style.setProperty('--ry', '0deg');
    card.style.setProperty('--mx', '50%');
    card.style.setProperty('--my', '50%');
  };
  card.addEventListener('pointermove', e => move(e.clientX, e.clientY));
  card.addEventListener('pointerleave', reset);
  card.addEventListener('pointerup', reset);

  // gentle idle shimmer so it feels alive on phones too
  let t = 0;
  const idle = () => {
    if (!card.classList.contains('tilting')) {
      t += 0.012;
      card.style.setProperty('--mx', `${50 + Math.sin(t) * 30}%`);
      card.style.setProperty('--my', `${50 + Math.cos(t * 0.8) * 20}%`);
    }
    requestAnimationFrame(idle);
  };
  requestAnimationFrame(idle);
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
