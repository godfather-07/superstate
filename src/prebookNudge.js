/**
 * Launch-sale nudge: a small, dismissible card that points visitors to the
 * checkout. Bottom-right card on desktop, bottom sheet on phones
 * (no full-screen popup, so it doesn't block reading or hurt mobile SEO).
 *
 * Shows once per visit, after NUDGE.DELAY_MS on the page, after scrolling
 * NUDGE.SCROLL_PCT of it, or when the mouse heads for the tab bar (desktop),
 * whichever comes first. Never shows on the product or checkout pages, to
 * people who already ordered, or for NUDGE.SNOOZE_DAYS after
 * someone closes it.
 */

const NUDGE = {
  DELAY_MS: 12000,
  SCROLL_PCT: 0.45,
  SNOOZE_DAYS: 3,
  SNOOZE_KEY: 'superstate_nudge_snoozed_at',
  SESSION_KEY: 'superstate_nudge_shown',
  PREBOOK_KEY: 'superstate_order', // set by the checkout page after payment
  SKIP_PATHS: ['/products/', '/pages/prebook'],
  HREF: '/pages/prebook/?pack=Pack%20Of%2030&qty=1'
};

function read(store, key) {
  try { return window[store].getItem(key); } catch (e) { return null; }
}
function write(store, key, value) {
  try { window[store].setItem(key, value); } catch (e) { /* private mode: fine */ }
}

function shouldRun() {
  const path = window.location.pathname;
  if (NUDGE.SKIP_PATHS.some(p => path.startsWith(p))) return false;
  if (read('localStorage', NUDGE.PREBOOK_KEY)) return false;
  if (read('sessionStorage', NUDGE.SESSION_KEY)) return false;
  const snoozedAt = Number(read('localStorage', NUDGE.SNOOZE_KEY));
  if (snoozedAt && Date.now() - snoozedAt < NUDGE.SNOOZE_DAYS * 864e5) return false;
  return true;
}

const CSS = `
.ss-nudge {
  position: fixed; right: 24px; bottom: 24px; z-index: 900;
  width: min(360px, calc(100vw - 32px));
  padding: 1.25rem 1.25rem 1.1rem;
  background: #003399; color: #ffffff;
  border-radius: 20px;
  box-shadow: 0 18px 50px rgba(0, 20, 70, 0.35);
  font-family: 'Bricolage Grotesque', sans-serif;
  opacity: 0; transform: translateY(24px);
  transition: opacity .35s ease, transform .35s cubic-bezier(.2,.9,.3,1.2);
}
.ss-nudge.ss-nudge-in { opacity: 1; transform: translateY(0); }
.ss-nudge-close {
  position: absolute; top: 10px; right: 10px;
  width: 32px; height: 32px; border: 0; border-radius: 50%;
  background: rgba(255,255,255,.12); color: #ffffff;
  font-size: 16px; line-height: 1; cursor: pointer;
}
.ss-nudge-close:hover { background: rgba(255,255,255,.22); }
.ss-nudge-badge {
  display: inline-block; padding: .25rem .6rem; border-radius: 999px;
  background: #E4FF5A; color: #001a4d;
  font-size: 12px; font-weight: 800; letter-spacing: .02em;
}
.ss-nudge-title {
  margin: .7rem 2rem .35rem 0;
  font-size: 22px; line-height: 1.15; font-weight: 800; letter-spacing: -.01em; color: #ffffff;
}
.ss-nudge-title em { font-style: normal; color: #E4FF5A; }
.ss-nudge-sub { margin: 0 0 1rem; font-size: 14.5px; line-height: 1.45; color: #d5ddf3; }
.ss-nudge-sub s { opacity: .7; }
.ss-nudge-cta {
  display: flex; align-items: center; justify-content: center; gap: .4rem;
  width: 100%; min-height: 48px; border-radius: 12px;
  background: #E4FF5A; color: #001a4d; text-decoration: none;
  font-size: 16px; font-weight: 800;
  transition: transform .15s ease;
}
.ss-nudge-cta:hover { transform: translateY(-1px); }
.ss-nudge-later {
  display: block; width: 100%; margin-top: .55rem; padding: .35rem;
  border: 0; background: none; color: #b9c6ea;
  font-family: inherit; font-size: 13.5px; font-weight: 600; cursor: pointer;
}
.ss-nudge-later:hover { color: #ffffff; }
@media (max-width: 600px) {
  .ss-nudge {
    left: 0; right: 0; bottom: 0; width: 100%;
    border-radius: 22px 22px 0 0;
    padding: 1.2rem 16px calc(1rem + env(safe-area-inset-bottom));
  }
  .ss-nudge-title { font-size: 21px; }
}
@media (prefers-reduced-motion: reduce) {
  .ss-nudge, .ss-nudge-cta { transition: none; }
}
`;

function build() {
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);

  const el = document.createElement('aside');
  el.className = 'ss-nudge';
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-labelledby', 'ss-nudge-title');
  el.innerHTML = `
    <button type="button" class="ss-nudge-close" aria-label="Close">✕</button>
    <span class="ss-nudge-badge">launch sale · 20% off</span>
    <p class="ss-nudge-title" id="ss-nudge-title">Sleep Well is live. <em>20% off</em> for launch.</p>
    <p class="ss-nudge-sub">coffee, but for sleep. 30 nights for ₹1,200 <s>₹1,500</s>, with a SuperState gift in the box. ships in 5–7 days.</p>
    <a class="ss-nudge-cta" href="${NUDGE.HREF}">shop the launch →</a>
    <button type="button" class="ss-nudge-later">maybe later</button>
  `;
  return el;
}

function init() {
  if (!shouldRun()) return;

  let shown = false;
  let el = null;
  const triggers = [];

  function close() {
    write('localStorage', NUDGE.SNOOZE_KEY, String(Date.now()));
    el.classList.remove('ss-nudge-in');
    document.removeEventListener('keydown', onKey);
    setTimeout(() => el.remove(), 350);
  }
  function onKey(e) { if (e.key === 'Escape') close(); }

  function show() {
    if (shown) return;
    // Don't pop up over an open mobile menu; try again on the next trigger.
    if (document.querySelector('.mobile-drawer.open')) return;
    shown = true;
    triggers.forEach(off => off());
    write('sessionStorage', NUDGE.SESSION_KEY, '1');

    el = build();
    document.body.appendChild(el);
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('ss-nudge-in')));
    el.querySelector('.ss-nudge-close').addEventListener('click', close);
    el.querySelector('.ss-nudge-later').addEventListener('click', close);
    el.querySelector('.ss-nudge-cta').addEventListener('click', () => {
      write('localStorage', NUDGE.SNOOZE_KEY, String(Date.now()));
    });
    document.addEventListener('keydown', onKey);
  }

  // 1. time on page
  const timer = setTimeout(show, NUDGE.DELAY_MS);
  triggers.push(() => clearTimeout(timer));

  // 2. scrolled far enough to be interested
  const onScroll = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    if (max > 0 && window.scrollY / max >= NUDGE.SCROLL_PCT) show();
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  triggers.push(() => window.removeEventListener('scroll', onScroll));

  // 3. desktop exit intent: mouse leaves through the top of the window
  const onLeave = e => { if (!e.relatedTarget && e.clientY <= 0) show(); };
  document.addEventListener('mouseout', onLeave);
  triggers.push(() => document.removeEventListener('mouseout', onLeave));
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
