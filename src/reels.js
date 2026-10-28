/**
 * Product page "they tried it first" row: creator reels + customer reviews in
 * one auto-scrolling strip. Clicking a reel opens it on Instagram.
 *
 * VIDEOS: Instagram doesn't let embedded reels autoplay. To make a reel
 * autoplay here, put its MP4 in public/assets/reels/ and set `video` below
 * (e.g. '/assets/reels/abhimanyu.mp4'). Without a file the card shows the
 * Instagram embed instead.
 *
 * REVIEWS: real customer words only, with their OK to show them.
 * { quote: '...', name: 'Anakha', place: 'Trivandrum', pack: '30 nights' }
 */

const REELS = [
  { url: 'https://www.instagram.com/p/DetKVM7vVpa/', embed: 'https://www.instagram.com/p/DetKVM7vVpa/embed/', handle: null, video: null },
  { url: 'https://www.instagram.com/abhimanyuu._p/reel/DeZV2_LMjYW/', embed: 'https://www.instagram.com/reel/DeZV2_LMjYW/embed/', handle: 'abhimanyuu._p', code: 'ABHIMANYU30', video: null },
  { url: 'https://www.instagram.com/dietician.shreya/reel/DeCD1C7TZxE/', embed: 'https://www.instagram.com/reel/DeCD1C7TZxE/embed/', handle: 'dietician.shreya', video: null },
  { url: 'https://www.instagram.com/_luttu_/reel/De9TEsnSyXo/', embed: 'https://www.instagram.com/reel/De9TEsnSyXo/embed/', handle: '_luttu_', video: null }
];

const REVIEWS = [];

const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function reelCard(r) {
  const who = r.handle ? `@${r.handle}` : 'on Instagram';
  const media = r.video
    ? `<video src="${r.video}" muted loop playsinline preload="metadata" aria-hidden="true"></video>`
    : `<iframe src="${r.embed}" title="Sleep Well reel ${esc(who)}" loading="lazy" scrolling="no" allow="encrypted-media; picture-in-picture" referrerpolicy="strict-origin-when-cross-origin" tabindex="-1"></iframe>`;
  const code = r.code
    ? `<a class="reel-code" href="/pages/prebook/?pack=Pack%20Of%2030&amp;qty=1&amp;ref=${r.code}">use code ${r.code} · 30% off →</a>`
    : '';
  return `<li class="reel-card">
    <div class="reel-frame">
      ${media}
      <a class="reel-link" href="${r.url}" target="_blank" rel="noopener" aria-label="Watch ${esc(who)}'s reel on Instagram"><span class="reel-play" aria-hidden="true">▶ watch reel</span></a>
    </div>
    <div class="reel-meta"><a class="reel-handle" href="${r.url}" target="_blank" rel="noopener">${esc(who)} ↗</a>${code}</div>
  </li>`;
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
    if (REELS[i]) cards.push(reelCard(REELS[i]));
    if (REVIEWS[i]) cards.push(reviewCard(REVIEWS[i]));
  }
  cards.push(tagCard);
  row.innerHTML = cards.join('');

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
