/*
 * Sleep Well product page.
 * - pack cards = Shopify variants; prices shown with the launch / creator %
 * - "Buy now" uses a cart permalink: replaces the cart with this pack and goes
 *   straight to Shopify checkout with the discount code applied
 * - "or add to cart" adds to the cart drawer
 * - sticky mobile buy bar, FAQ accordions, creator reels, sheep game
 * Needs assets/theme.js (window.SS) loaded first.
 */
(() => {
  const SS = window.SS || {};
  const section = document.querySelector('[data-product-section]');
  if (!section) return;

  const cards = [...section.querySelectorAll('.pack-pill-card')];
  const variantInput = section.querySelector('[data-variant-input]');
  const qtyInput = document.getElementById('pdp-qty-input');
  const errorEl = section.querySelector('[data-form-error]');
  const fmt = paise => SS.formatPaise ? SS.formatPaise(paise) : `₹${(paise / 100).toFixed(2)}`;
  let qty = 1;

  const selected = () => cards.find(c => c.classList.contains('active')) || cards[0];

  // the % shown: a remembered creator code beats the launch code
  function activePct() {
    const d = SS.discount ? SS.discount() : { pct: SS.launchPct || 0 };
    return d.pct == null ? (SS.launchPct || 0) : d.pct;
  }

  function priceFor(card) {
    const price = Number(card.dataset.price);
    const compare = Number(card.dataset.compare) || 0;
    const pct = activePct();
    if (pct > 0) return { sale: Math.round(price * (100 - pct) / 100), strike: price, pct };
    if (compare > price) return { sale: price, strike: compare, pct: Math.round((compare - price) * 100 / compare) };
    return { sale: price, strike: 0, pct: 0 };
  }

  function render() {
    const d = SS.discount ? SS.discount() : {};
    cards.forEach(card => {
      const p = priceFor(card);
      const sale = card.querySelector('[data-pack-sale]');
      const was = card.querySelector('[data-pack-was]');
      const serve = card.querySelector('[data-pack-serve]');
      if (sale) sale.textContent = fmt(p.sale);
      if (was) { was.textContent = fmt(p.strike); was.style.display = p.strike ? '' : 'none'; }
      const serves = Number(card.dataset.serves);
      if (serve && serves) serve.textContent = `₹${Math.round(p.sale / serves / 100)}/serve`;
    });

    const card = selected();
    if (!card) return;
    const p = priceFor(card);
    const top = section.querySelector('[data-top-price]');
    const orig = section.querySelector('[data-top-original]');
    const badge = section.querySelector('[data-top-badge]');
    if (top) top.textContent = fmt(p.sale);
    if (orig) { orig.textContent = fmt(p.strike); orig.style.display = p.strike ? 'inline-block' : 'none'; }
    if (badge) { badge.textContent = `${p.pct}% OFF`; badge.style.display = p.pct ? 'inline-block' : 'none'; }
    const meta = document.querySelector('[data-sticky-meta]');
    if (meta) meta.textContent = `${card.dataset.title} · ${fmt(p.sale)}`;

    // a creator link was used: say so
    const note = section.querySelector('[data-launch-note]');
    if (note && d.creator && SS.creators[d.creator]) {
      note.innerHTML = `🎁 <b>${SS.creators[d.creator].name}'s code ${d.code}:</b> ${d.pct}% off + a free creator gift, applied automatically at checkout.`;
    }
    const priceNote = section.querySelector('[data-price-note]');
    if (priceNote && d.creator) priceNote.textContent = `creator price · ${d.pct}% off with ${d.code} · incl. taxes`;

    const available = card.dataset.available === 'true';
    document.querySelectorAll('[data-buy-now]').forEach(b => { b.disabled = !available; });
    const add = section.querySelector('[data-add-to-cart]');
    if (add) add.disabled = !available;
    const main = document.getElementById('prebook-btn');
    if (main) main.textContent = available ? `Buy now${p.pct ? ` · ${p.pct}% off` : ''}` : 'Sold out';
  }

  function select(card) {
    cards.forEach(c => { c.classList.toggle('active', c === card); c.setAttribute('aria-checked', c === card ? 'true' : 'false'); });
    if (variantInput) variantInput.value = card.dataset.variantId;
    qty = 1;
    if (qtyInput) qtyInput.value = 1;
    try {
      const url = new URL(location.href);
      url.searchParams.set('variant', card.dataset.variantId);
      history.replaceState(null, '', url.toString());
    } catch (e) { /* ignore */ }
    render();
  }

  cards.forEach(card => {
    card.addEventListener('click', () => select(card));
    card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(card); } });
  });

  const setQty = n => { qty = Math.max(1, Math.min(20, n)); if (qtyInput) qtyInput.value = qty; };
  const minus = section.querySelector('[data-qty-minus]');
  const plus = section.querySelector('[data-qty-plus]');
  minus && minus.addEventListener('click', () => setQty(qty - 1));
  plus && plus.addEventListener('click', () => setQty(qty + 1));

  const variantId = () => (selected() ? selected().dataset.variantId : variantInput && variantInput.value);

  function showError(msg) {
    if (!errorEl) { alert(msg); return; }
    errorEl.textContent = msg;
    errorEl.hidden = !msg;
  }

  // Buy now → put exactly this pack in the cart → Shopify checkout with the code.
  // (Not a /cart/<id>:<qty> link: Shopify sends those to the primary domain,
  // so they break whenever that domain isn't pointing at the store.)
  async function buyNow(btn) {
    const id = variantId();
    if (!id) return;
    const d = SS.discount ? SS.discount() : {};
    const card = selected();
    const p = card ? priceFor(card) : { sale: 0 };
    SS.track && SS.track('InitiateCheckout', {
      content_name: 'Sleep Well', content_ids: ['sleep-well'], currency: 'INR',
      value: (p.sale * qty) / 100, num_items: qty, variant: card && card.dataset.title,
      coupon: d.code || undefined, creator: d.creator || undefined
    });
    const label = btn ? btn.textContent : '';
    if (btn) { btn.disabled = true; btn.textContent = 'Opening checkout…'; }
    const routes = SS.routes || {};
    const root = (routes.root || '/').replace(/\/?$/, '/');
    const post = (url, body) => fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body)
    }).then(async r => {
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.description || data.message || 'Could not start checkout');
      return data;
    });
    try {
      await post(`${root}cart/clear.js`, {});
      await post(`${routes.cartAdd || root + 'cart/add'}.js`, { items: [{ id: Number(id), quantity: qty }] });
      await post(`${routes.cartUpdate || root + 'cart/update'}.js`, {
        attributes: { 'Referred by': d.creator || '', 'Discount code': d.code || '' }
      });
      location.href = SS.checkoutUrl ? SS.checkoutUrl() : `${root}checkout`;
    } catch (err) {
      showError(err.message || 'Could not start checkout. Please try again.');
      if (btn) { btn.disabled = false; btn.textContent = label; }
    }
  }
  document.querySelectorAll('[data-buy-now]').forEach(b => b.addEventListener('click', () => buyNow(b)));

  // or add to cart (drawer)
  const form = document.getElementById('product-form');
  form && form.addEventListener('submit', async e => {
    e.preventDefault();
    if (!SS.addToCart) { form.submit(); return; }
    const btn = form.querySelector('[data-add-to-cart]');
    showError('');
    if (btn) { btn.disabled = true; btn.textContent = 'adding…'; }
    try {
      const card = selected();
      await SS.addToCart(variantId(), qty, { variant: card && card.dataset.title, value: card ? priceFor(card).sale * qty / 100 : undefined });
    } catch (err) {
      showError(err.message || 'Could not add to cart. Please try again.');
    }
    if (btn) { btn.disabled = false; btn.textContent = 'or add to cart'; }
  });

  document.addEventListener('ss:discount-change', render);
  render();

  // ViewContent
  const d = SS.discount ? SS.discount() : {};
  SS.track && SS.track('ViewContent', { content_name: 'Sleep Well', content_type: 'product', content_ids: ['sleep-well'], currency: 'INR', creator: d.creator || undefined });

  // Sticky buy bar (phones): on screen whenever the main Buy button isn't
  const sticky = document.getElementById('sticky-buy');
  const mainBuy = document.getElementById('prebook-btn');
  if (sticky && mainBuy && 'IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      const show = !entry.isIntersecting;
      sticky.classList.toggle('visible', show);
      sticky.setAttribute('aria-hidden', show ? 'false' : 'true');
      sticky.querySelector('button').tabIndex = show ? 0 : -1;
    }).observe(mainBuy);
    const info = sticky.querySelector('.sticky-buy-info');
    const goPacks = () => {
      const stack = document.querySelector('.supply-pack-stack') || section;
      stack.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };
    info.addEventListener('click', goPacks);
    info.addEventListener('keydown', e => { if (e.key === 'Enter') goPacks(); });
  }
})();

/* ---------- FAQ accordions (product page) ---------- */
document.addEventListener('click', e => {
  const header = e.target.closest('.pdp-accordion-header');
  if (!header) return;
  const item = header.closest('.pdp-accordion-item');
  const body = item.querySelector('.pdp-accordion-body');
  const open = item.classList.toggle('open');
  header.setAttribute('aria-expanded', open ? 'true' : 'false');
  body.style.maxHeight = open ? body.scrollHeight + 'px' : null;
  if (open) setTimeout(() => { if (item.classList.contains('open')) body.style.maxHeight = '1200px'; }, 300);
});

/* ---------- ritual video: keep still for reduced motion ---------- */
(() => {
  const v = document.querySelector('.ritual-video');
  if (v && matchMedia('(prefers-reduced-motion: reduce)').matches) { v.removeAttribute('autoplay'); v.pause(); }
})();

/* ---------- creator reels row ---------- */
(() => {
  const row = document.getElementById('reels-row');
  if (!row) return;

  const videos = row.querySelectorAll('video');
  if (videos.length && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => entries.forEach(en => {
      if (en.isIntersecting) en.target.play().catch(() => {}); else en.target.pause();
    }), { threshold: 0.4 });
    videos.forEach(v => io.observe(v));
  }

  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  let paused = false, visible = false, resumeAt = 0, pos = row.scrollLeft;
  const hold = ms => { paused = true; resumeAt = performance.now() + ms; };
  ['pointerenter', 'pointerdown', 'touchstart', 'focusin', 'wheel'].forEach(ev => row.addEventListener(ev, () => hold(4000), { passive: true }));
  row.addEventListener('pointerleave', () => hold(1200));
  if ('IntersectionObserver' in window) new IntersectionObserver(([en]) => { visible = en.isIntersecting; }, { threshold: 0.2 }).observe(row);
  const speed = 0.45;
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
})();

/* ---------- sleepy sheep: win-your-code mini game ---------- */

    (() => {
      const card = document.getElementById("win");
      if (!card) return;

      const CODE = (window.SS && window.SS.launchCode) || "FIRSTNIGHT20";
      const TARGET = 10;
      const states = card.querySelectorAll(".game-state");
      const canvas = document.getElementById("sheep-canvas");
      const ctx = canvas.getContext("2d");
      const scoreEl = document.getElementById("game-score");

      let raf = null;
      let game = null;

      function show(name) {
        states.forEach(el => { el.hidden = el.dataset.state !== name; });
      }

      function reveal(won) {
        stop();
        document.getElementById("reveal-eyebrow").textContent = won
          ? "you did that ✨ 10/10 alarms dodged"
          : "no games, no stress. here you go 💛";
        show("reveal");
      }

      function sizeCanvas() {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const w = canvas.clientWidth;
        const h = canvas.clientHeight;
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        return { w, h };
      }

      function start() {
        show("play");
        const { w, h } = sizeCanvas();
        const ground = h - 28;
        game = {
          w, h, ground,
          sheep: { x: 44, y: ground, vy: 0, size: 34 },
          obstacles: [],
          stars: Array.from({ length: 18 }, () => ({ x: Math.random() * w, y: Math.random() * (ground - 40), r: Math.random() * 1.4 + 0.4 })),
          speed: 260,
          nextSpawn: 1.1,
          score: 0,
          last: performance.now(),
          over: false
        };
        scoreEl.textContent = `0 / ${TARGET}`;
        window.addEventListener("keydown", onKey);
        raf = requestAnimationFrame(loop);
        canvas.focus({ preventScroll: true });
      }

      function stop() {
        if (raf) cancelAnimationFrame(raf);
        raf = null;
        window.removeEventListener("keydown", onKey);
      }

      function jump() {
        if (!game || game.over) return;
        const s = game.sheep;
        if (s.y >= game.ground - 0.5) s.vy = -540;
      }

      function onKey(e) {
        if (e.code === "Space" || e.code === "ArrowUp") {
          e.preventDefault();
          jump();
        }
      }

      function spawn() {
        const kinds = ["⏰", "⏰", "☕", "📱"];
        game.obstacles.push({ x: game.w + 20, kind: kinds[Math.floor(Math.random() * kinds.length)], size: 28, passed: false });
        // gap shrinks a little as the game speeds up, but stays fair
        game.nextSpawn = 0.95 + Math.random() * 0.8 - Math.min(game.score * 0.015, 0.15);
      }

      function loop(now) {
        const dt = Math.min((now - game.last) / 1000, 0.033);
        game.last = now;
        update(dt);
        draw();
        if (!game.over) raf = requestAnimationFrame(loop);
      }

      function update(dt) {
        const g = game, s = g.sheep;
        g.speed += dt * 8;
        s.vy += 1900 * dt;
        s.y = Math.min(s.y + s.vy * dt, g.ground);
        if (s.y === g.ground) s.vy = 0;

        g.nextSpawn -= dt;
        if (g.nextSpawn <= 0) spawn();

        g.stars.forEach(st => { st.x -= g.speed * 0.08 * dt; if (st.x < 0) st.x += g.w; });

        for (const o of g.obstacles) {
          o.x -= g.speed * dt;
          // forgiving hitbox
          const hit = Math.abs(o.x - s.x) < (o.size + s.size) * 0.32 && s.y > g.ground - o.size * 0.75;
          if (hit) {
            g.over = true;
            setTimeout(() => { stop(); show("lost"); }, 350);
            return;
          }
          if (!o.passed && o.x < s.x - 10) {
            o.passed = true;
            g.score++;
            scoreEl.textContent = `${g.score} / ${TARGET}`;
            if (g.score >= TARGET) {
              g.over = true;
              setTimeout(() => reveal(true), 300);
              return;
            }
          }
        }
        g.obstacles = g.obstacles.filter(o => o.x > -40);
      }

      function draw() {
        const g = game, s = g.sheep;
        ctx.clearRect(0, 0, g.w, g.h);

        ctx.fillStyle = "rgba(255,255,255,0.7)";
        g.stars.forEach(st => { ctx.beginPath(); ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2); ctx.fill(); });

        ctx.font = "26px serif";
        ctx.textBaseline = "alphabetic";
        ctx.fillText("🌙", g.w - 48, 38);

        ctx.strokeStyle = "rgba(228,255,90,0.6)";
        ctx.setLineDash([6, 8]);
        ctx.beginPath();
        ctx.moveTo(0, g.ground + 4);
        ctx.lineTo(g.w, g.ground + 4);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.textAlign = "center";
        g.obstacles.forEach(o => {
          ctx.font = `${o.size}px serif`;
          ctx.fillText(o.kind, o.x, g.ground);
        });

        // sheep faces right
        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.scale(-1, 1);
        ctx.font = `${s.size}px serif`;
        ctx.fillText("🐑", 0, 0);
        ctx.restore();
        if (s.y < g.ground - 6) {
          ctx.font = "13px serif";
          ctx.fillText("z", s.x + 20, s.y - 30);
        }
        ctx.textAlign = "start";
      }

      canvas.tabIndex = 0;
      canvas.addEventListener("pointerdown", e => { e.preventDefault(); jump(); });

      card.addEventListener("click", async e => {
        const btn = e.target.closest("[data-action]");
        if (!btn) return;
        const action = btn.dataset.action;
        if (action === "play") start();
        if (action === "skip") reveal(false);
        if (action === "copy") {
          try {
            await navigator.clipboard.writeText(CODE);
            btn.textContent = "copied ✓";
          } catch (err) {
            btn.textContent = CODE;
          }
        }
      });
    })();
  
/* keyboard support for the FAQ accordion headers */
document.addEventListener('keydown', e => {
  if ((e.key === 'Enter' || e.key === ' ') && e.target.classList && e.target.classList.contains('pdp-accordion-header')) {
    e.preventDefault();
    e.target.click();
  }
});
