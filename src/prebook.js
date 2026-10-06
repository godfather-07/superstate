import {
  PREBOOK_CONFIG, priceFor, formatINR, submitPrebook, getSavedPrebook, clearSavedPrebook
} from './services/prebookService.js';

const $ = id => document.getElementById(id);
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- Pack + price from the product page link ---------- */
const params = new URLSearchParams(location.search);
const pack = PREBOOK_CONFIG.PACKS[params.get('pack')] ? params.get('pack') : 'Pack Of 5';
const qty = Math.min(Math.max(parseInt(params.get('qty'), 10) || 1, 1), 20);
const price = priceFor(pack, qty);

$('pb-pack-label').textContent = `${pack} × ${qty}`;
$('pb-price-now').textContent = `₹${formatINR(price.pre)}`;
$('pb-price-was').textContent = `₹${formatINR(price.full)}`;

/* ---------- Returning visitor: show their card straight away ---------- */
const saved = getSavedPrebook();
if (saved && !params.get('pack')) showCard(saved, false);

/* ---------- Form ---------- */
const form = $('pb-form');
const fields = ['name', 'phone', 'email'];

fields.forEach(f => $(`pb-${f}`).addEventListener('input', () => setError(f, '')));

form.addEventListener('submit', async e => {
  e.preventDefault();
  fields.forEach(f => setError(f, ''));
  setError('form', '');

  const btn = $('pb-submit');
  btn.disabled = true;
  btn.textContent = 'locking it in…';

  const res = await submitPrebook({
    name: $('pb-name').value,
    phone: $('pb-phone').value,
    email: $('pb-email').value,
    pack,
    qty
  });

  btn.disabled = false;
  btn.textContent = 'lock my 50% off →';

  if (!res.success) {
    let first = null;
    Object.entries(res.errors).forEach(([k, msg]) => {
      setError(k, msg);
      if (!first && $(`pb-${k}`) && k !== 'form') first = $(`pb-${k}`);
    });
    first?.focus();
    return;
  }
  showCard(res.record, true);
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
  window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });

  const first = r.name.split(' ')[0];
  const since = new Date(r.submittedAt || Date.now());
  $('ss-name').textContent = r.name.toUpperCase();
  $('ss-number').textContent = r.memberId;
  $('ss-meta').textContent = `BATCH 02 · ${r.pack.toUpperCase()}${r.qty > 1 ? ` × ${r.qty}` : ''}`;
  $('ss-since').textContent = `${String(since.getMonth() + 1).padStart(2, '0')}/${String(since.getFullYear()).slice(-2)}`;
  $('pb-done-sub').textContent = `${first}, your spot is locked at 50% off. here's your SuperState card.`;
  $('pb-step1').textContent = `${r.pack} × ${r.qty} at ₹${formatINR(r.prebookPrice)} (50% off)`;
  $('pb-step2-phone').textContent = `+91 ${r.phone.slice(0, 5)} ${r.phone.slice(5)}`;

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
