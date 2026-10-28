/**
 * Product page "they tried it first" row: creator reels + customer reviews in
 * one auto-scrolling strip. Clicking a reel opens it on Instagram.
 *
 * VIDEOS: `video` is a short silent preview loop (public/assets/reels/) that
 * autoplays while on screen. Tapping a card opens `url` (the Instagram reel);
 * if there's no reel link yet, it plays `full` (with sound) in a pop-up.
 * Cards with only `embed` (no video file) show the Instagram embed instead.
 *
 * REVIEWS: real customer words only, with their OK to show them.
 * { quote: '...', name: 'Anakha', place: 'Trivandrum', pack: '30 nights' }
 */

const REELS = [
  { name: 'Abhimanyu', handle: 'abhimanyuu._p', code: 'ABHIMANYU30', url: 'https://www.instagram.com/abhimanyuu._p/reel/DeZV2_LMjYW/',
    video: '/assets/reels/abhimanyu-preview.mp4', poster: '/assets/reels/abhimanyu-poster.jpg' },
  { name: 'Hridya', url: null, full: '/assets/reels/hridya-full.mp4',
    video: '/assets/reels/hridya-preview.mp4', poster: '/assets/reels/hridya-poster.jpg' },
  { name: 'Shreya', handle: 'dietician.shreya', url: 'https://www.instagram.com/dietician.shreya/reel/DeCD1C7TZxE/',
    video: '/assets/reels/shreya-preview.mp4', poster: '/assets/reels/shreya-poster.jpg' },
  { name: 'Shanavas', url: null, full: '/assets/reels/shanavas-full.mp4',
    video: '/assets/reels/shanavas-preview.mp4', poster: '/assets/reels/shanavas-poster.jpg' }
];

const REVIEWS = [];

const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function reelCard(r, i) {
  const who = r.handle ? `@${r.handle}` : (r.name || 'on Instagram');
  const media = r.video
    ? `<video src="${r.video}" poster="${r.poster || ''}" muted loop playsinline preload="none" aria-hidden="true"></video>`
    : `<iframe src="${r.embed}" title="Sleep Well reel ${esc(who)}" loading="lazy" scrolling="no" allow="encrypted-media; picture-in-picture" referrerpolicy="strict-origin-when-cross-origin" tabindex="-1"></iframe>`;
  const open = r.url
    ? `<a class="reel-link" href="${r.url}" target="_blank" rel="noopener" aria-label="Watch ${esc(r.name || who)}'s reel on Instagram"><span class="reel-play" aria-hidden="true">▶ watch on Instagram</span></a>`
    : `<button type="button" class="reel-link" data-full="${i}" aria-label="Play ${esc(r.name || who)}'s video with sound"><span class="reel-play" aria-hidden="true">▶ tap for sound</span></button>`;
  const label = r.url
    ? `<a class="reel-handle" href="${r.url}" target="_blank" rel="noopener">${esc(r.name ? `${r.name} · ${who}` : who)} ↗</a>`
    : `<span class="reel-handle">${esc(r.name || who)}</span>`;
  const code = r.code
    ? `<a class="reel-code" href="/pages/prebook/?pack=Pack%20Of%2030&amp;qty=1&amp;ref=${r.code}">use code ${r.code} · 30% off →</a>`
    : '';
  return `<li class="reel-card">
    <div class="reel-frame">
      ${media}
      ${open}
    </div>
    <div class="reel-meta">${label}${code}</div>
  </li>`;
}

// Full video with sound, for reels without an Instagram link yet
function playFull(r) {
  let dlg = document.getElementById('reel-modal');
  if (!dlg) {
    dlg = document.createElement('dialog');
    dlg.id = 'reel-modal';
    dlg.className = 'reel-modal';
    dlg.innerHTML = '<button type="button" class="reel-modal-x" aria-label="Close">✕</button><video controls playsinline></video>';
    document.body.appendChild(dlg);
    const v = dlg.querySelector('video');
    const close = () => { v.pause(); dlg.close(); };
    dlg.querySelector('.reel-modal-x').addEventListener('click', close);
    dlg.addEventListener('click', e => { if (e.target === dlg) close(); });
    dlg.addEventListener('close', () => v.pause());
  }
  const v = dlg.querySelector('video');
  v.src = r.full;
  v.poster = r.poster || '';
  if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', '');
  v.play().catch(() => {});
}

function reviewCard(v) {
  return `<li class="reel-card">
    <figure class="reel-frame review-frame">
      <span class="review-mark" aria-hidden="true">“</span>
      <blockquote>${esc(v.quote)}</blockquote>
      <figcaption><b>${esc(v.name)}</b>${v.place ? `, ${esc(v.place)}` : ''}${v.pack ? `<span>${esc(v.pack)}</span>` : ''}</figcaption>
    </figure>
    <div class="reel-meta"><span class="reel-handle">verified customer</span></div>
  </li>`;
}

const tagCard = `<li class="reel-card">
  <div class="reel-frame review-frame review-cta">
    <span class="review-mark" aria-hidden="true">🌙</span>
    <p class="review-cta-h">your night <em>here.</em></p>
    <p>tried Sleep Well? post your 10pm ritual and tag <b>@superstate.in</b>. we'll feature the best ones right here.</p>
    <a class="reel-code" href="https://www.instagram.com/superstate.in/" target="_blank" rel="noopener">tag us on Instagram →</a>
  </div>
  <div class="reel-meta"><span class="reel-handle">could be you ✨</span></div>
</li>`;

export function initReels() {
  const row = document.getElementById('reels-row');
  if (!row) return;

  // reels and reviews alternate, then the "tag us" card
  const cards = [];
  const n = Math.max(REELS.length, REVIEWS.length);
  for (let i = 0; i < n; i++) {
    if (REELS[i]) cards.push(reelCard(REELS[i], i));
    if (REVIEWS[i]) cards.push(reviewCard(REVIEWS[i]));
  }
  cards.push(tagCard);
  row.innerHTML = cards.join('');
  row.addEventListener('click', e => {
    const btn = e.target.closest('[data-full]');
    if (btn) playFull(REELS[Number(btn.dataset.full)]);
  });

  // MP4 reels: play only while on screen (saves data), muted + looping
  const videos = row.querySelectorAll('video');
  if (videos.length && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => entries.forEach(e => {
      if (e.isIntersecting) e.target.play().catch(() => {}); else e.target.pause();
    }), { threshold: 0.4 });
    videos.forEach(v => io.observe(v));
  }

  // Gentle auto-scroll; pauses while someone is touching/hovering, loops back to the start
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  let paused = false, visible = false, resumeAt = 0, pos = row.scrollLeft;
  const hold = ms => { paused = true; resumeAt = performance.now() + ms; };
  ['pointerenter', 'pointerdown', 'touchstart', 'focusin', 'wheel'].forEach(ev =>
    row.addEventListener(ev, () => hold(4000), { passive: true }));
  row.addEventListener('pointerleave', () => hold(1200));
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0.2 }).observe(row);
  }
  const speed = 0.45; // px per frame (~27px/s)
  const tick = now => {
    if (paused && now > resumeAt) { paused = false; pos = row.scrollLeft; }
    if (visible && !paused) {
      const max = row.scrollWidth - row.clientWidth;
      if (max > 0) {
        if (pos >= max - 1) { hold(1800); row.scrollTo({ left: 0, behavior: 'smooth' }); pos = 0; }
        else { pos += speed; row.scrollLeft = pos; }
      }
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
