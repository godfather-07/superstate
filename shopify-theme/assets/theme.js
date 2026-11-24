/*
 * SuperState theme: site-wide behaviour.
 *
 * - creator links (?ref=CODE) are remembered for 30 days and sent to checkout
 * - the launch code (Theme settings) is used when there's no creator code
 * - cart drawer on every page, built from Shopify's /cart.js
 * - Meta Pixel + GA4 + GTM dataLayer events for the storefront
 * - menu drawer, hide-on-scroll navbar, fade-up animations, launch nudge
 *
 * Settings come from snippets/theme-config.liquid as window.SS.
 * Every code must also exist in Shopify admin → Discounts: the theme only shows
 * prices and passes the code to checkout, Shopify applies (and validates) it.
 */
(() => {
  const SS = (window.SS = window.SS || {});
  SS.creators = SS.creators || {};

  /* ---------- storage helpers (private mode safe) ---------- */
  const store = {
    get(key, session) {
      try { return (session ? sessionStorage : localStorage).getItem(key); } catch (e) { return null; }
    },
    set(key, value, session) {
      try { (session ? sessionStorage : localStorage).setItem(key, value); } catch (e) { /* ignore */ }
    },
    del(key) {
      try { localStorage.removeItem(key); } catch (e) { /* ignore */ }
    }
  };

  /* ---------- money ---------- */
  // Shopify Ajax amounts are in paise. ₹1,200 / ₹239.20
  SS.formatINR = rupees => {
    const n = Math.round(Number(rupees) * 100) / 100;
    return '₹' + (Number.isInteger(n)
      ? n.toLocaleString('en-IN')
      : n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
  };
  SS.formatPaise = paise => SS.formatINR(Number(paise) / 100);

  /* ---------- creator + discount codes ---------- */
  const REF_KEY = 'superstate_ref';
  const CODE_KEY = 'superstate_code'; // a code typed into the cart drawer
  const REF_DAYS = 30;

  const normCreator = code => {
    const c = String(code || '').trim().toUpperCase();
    return Object.prototype.hasOwnProperty.call(SS.creators, c) ? c : null;
  };

  (function captureRef() {
    let code = null;
    try {
      const p = new URLSearchParams(location.search);
      code = normCreator(p.get('ref') || p.get('code'));
    } catch (e) { /* ignore */ }
    if (code) store.set(REF_KEY, JSON.stringify({ code, at: Date.now() }));
  })();

  SS.storedCreator = () => {
    try {
      const r = JSON.parse(store.get(REF_KEY) || 'null');
      if (r && Date.now() - r.at < REF_DAYS * 864e5) return normCreator(r.code);
    } catch (e) { /* ignore */ }
    return null;
  };

  // { code, pct, creator, known }. pct is null for a code we don't know about
  // (Shopify will still try it at checkout).
  SS.discount = () => {
    const typed = String(store.get(CODE_KEY) || '').trim().toUpperCase();
    const pick = typed || SS.storedCreator() || SS.launchCode || '';
    if (!pick) return { code: '', pct: 0, creator: null, known: true };
    const creator = normCreator(pick);
    if (creator) return { code: creator, pct: SS.creators[creator].pct, creator, known: true };
    if (pick === SS.launchCode) return { code: pick, pct: SS.launchPct || 0, creator: null, known: true };
    return { code: pick, pct: null, creator: null, known: false };
  };

  SS.setTypedCode = code => {
    const c = String(code || '').trim().toUpperCase();
    if (c) store.set(CODE_KEY, c); else store.del(CODE_KEY);
    document.dispatchEvent(new CustomEvent('ss:discount-change'));
  };

  SS.checkoutUrl = () => {
    const d = SS.discount();
    const base = (SS.routes && SS.routes.root ? SS.routes.root : '/').replace(/\/?$/, '/') + 'checkout';
    return d.code ? `${base}?discount=${encodeURIComponent(d.code)}` : base;
  };

  // Saves who referred the order on the cart, so it shows on the Shopify order.
  SS.tagCart = () => {
    const d = SS.discount();
    const attributes = { 'Referred by': d.creator || '', 'Discount code': d.code || '' };
    return fetch(`${SS.routes.cartUpdate}.js`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ attributes })
    }).catch(() => {});
  };

  SS.goToCheckout = async () => {
    const d = SS.discount();
    SS.track('InitiateCheckout', { content_name: 'Sleep Well', content_ids: ['sleep-well'], currency: 'INR', creator: d.creator || undefined, coupon: d.code || undefined });
    await SS.tagCart();
    location.href = SS.checkoutUrl();
  };

  /* ---------- tracking: Meta Pixel + GA4 + GTM ---------- */
  const GA4_EVENTS = { ViewContent: 'view_item', AddToCart: 'add_to_cart', InitiateCheckout: 'begin_checkout' };
  const pixelIds = (SS.metaPixelIds || []).map(s => String(s).trim()).filter(Boolean);

  if (pixelIds.length && !window.fbq) {
    /* Meta's standard base code */
    !function (f, b, e, v, n, t, s) {
      if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
      if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = [];
      t = b.createElement(e); t.async = !0; t.src = v;
      s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
    }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    pixelIds.forEach(id => window.fbq('init', id));
    window.fbq('track', 'PageView');
  }

  SS.track = (event, params = {}) => {
    try {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ event: `ss_${event}`, ...params });
    } catch (e) { /* ignore */ }
    try {
      const name = GA4_EVENTS[event];
      if (name && typeof window.gtag === 'function') {
        const item = { item_id: 'sleep-well', item_name: params.content_name || 'Sleep Well', quantity: params.num_items || 1 };
        if (params.variant) item.item_variant = params.variant;
        const ga = { currency: params.currency || 'INR', items: [item] };
        if (params.value != null) ga.value = params.value;
        if (params.coupon) ga.coupon = params.coupon;
        if (params.creator) ga.creator = params.creator;
        window.gtag('event', name, ga);
      }
    } catch (e) { /* ignore */ }
    try {
      if (pixelIds.length && typeof window.fbq === 'function') window.fbq('track', event, params);
    } catch (e) { /* never let tracking break the page */ }
  };

  /* ---------- cart ---------- */
  const drawer = document.querySelector('[data-cart-drawer]');
  let cartBusy = false;

  const cartFetch = (url, body) => fetch(url, {
    method: body ? 'POST' : 'GET',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: body ? JSON.stringify(body) : undefined
  }).then(async r => {
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data.description || data.message || 'Cart error');
    return data;
  });

  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function setCount(count) {
    document.querySelectorAll('[data-cart-count]').forEach(el => {
      el.textContent = count;
      el.hidden = !count;
    });
  }

  function renderCart(cart) {
    if (!drawer) return;
    setCount(cart.item_count);
    const list = drawer.querySelector('[data-cart-items]');
    const empty = drawer.querySelector('[data-cart-empty]');
    const footer = drawer.querySelector('[data-cart-footer]');
    const title = drawer.querySelector('.cart-drawer-title');
    list.querySelectorAll('.cart-item-card').forEach(c => c.remove());

    if (!cart.item_count) {
      title.textContent = 'Shopping Cart';
      empty.hidden = false;
      empty.style.display = 'flex';
      footer.hidden = true;
      return;
    }
    title.textContent = `Shopping Cart (${cart.item_count})`;
    empty.hidden = true;
    empty.style.display = 'none';
    footer.hidden = false;

    cart.items.forEach((item, i) => {
      const card = document.createElement('div');
      card.className = 'cart-item-card';
      const img = item.image || '';
      const variant = item.variant_title && item.variant_title !== 'Default Title' ? item.variant_title : '';
      card.innerHTML = `
        <div class="cart-item-img">${img ? `<img src="${esc(img)}${img.includes('?') ? '&' : '?'}width=160" alt="${esc(item.product_title)}" loading="lazy">` : ''}</div>
        <div class="cart-item-details">
          <div>
            <a class="cart-item-name" href="${esc(item.url)}">${esc(item.product_title)}</a>
            <div class="cart-live-selectors">
              ${variant ? `<span class="cart-item-variant">${esc(variant)}</span>` : ''}
              <div class="cart-qty-selector">
                <button type="button" data-line="${i + 1}" data-qty="${item.quantity - 1}" aria-label="Decrease quantity">−</button>
                <span>${item.quantity}</span>
                <button type="button" data-line="${i + 1}" data-qty="${item.quantity + 1}" aria-label="Increase quantity">+</button>
              </div>
            </div>
          </div>
          <div class="cart-item-price-row">
            <div class="cart-item-price">${SS.formatPaise(item.final_line_price)}</div>
            <button type="button" class="cart-item-remove" data-line="${i + 1}" data-qty="0">Remove</button>
          </div>
        </div>`;
      list.appendChild(card);
    });

    // Estimated discount: Shopify applies the real one at checkout
    const d = SS.discount();
    const subtotal = cart.total_price;
    const line = drawer.querySelector('[data-cart-discount-line]');
    const input = drawer.querySelector('[data-coupon-input]');
    if (input && !input.value && store.get(CODE_KEY)) input.value = store.get(CODE_KEY);
    let off = 0;
    if (d.code && d.pct) off = Math.round(subtotal * d.pct / 100);
    drawer.querySelector('[data-cart-subtotal]').textContent = SS.formatPaise(subtotal);
    if (d.code) {
      line.hidden = false;
      line.style.display = 'flex';
      drawer.querySelector('[data-cart-discount-label]').textContent =
        d.creator ? `${d.code} (${SS.creators[d.creator].name}'s code)` : d.code;
      drawer.querySelector('[data-cart-discount]').textContent = d.pct ? `−${SS.formatPaise(off)}` : 'at checkout';
    } else {
      line.hidden = true;
      line.style.display = 'none';
    }
    drawer.querySelector('[data-cart-total]').textContent = SS.formatPaise(subtotal - off);
    drawer.querySelector('[data-cart-checkout]').href = SS.checkoutUrl();
  }

  SS.refreshCart = () => cartFetch(`${SS.routes.cart}.js`).then(cart => { renderCart(cart); return cart; });

  SS.openCart = () => {
    if (!drawer) { location.href = SS.routes.cart; return; }
    drawer.classList.add('active');
    drawer.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    SS.refreshCart().catch(() => {});
  };

  SS.closeCart = () => {
    if (!drawer) return;
    drawer.classList.remove('active');
    drawer.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };

  SS.addToCart = async (variantId, quantity = 1, meta = {}) => {
    await cartFetch(`${SS.routes.cartAdd}.js`, { items: [{ id: Number(variantId), quantity: Number(quantity) }] });
    SS.track('AddToCart', { content_name: 'Sleep Well', content_ids: ['sleep-well'], currency: 'INR', num_items: quantity, ...meta });
    SS.openCart();
  };

  if (drawer) {
    drawer.addEventListener('click', async e => {
      if (e.target === drawer || e.target.closest('[data-cart-close]')) { SS.closeCart(); return; }
      const btn = e.target.closest('[data-line]');
      if (btn && !cartBusy) {
        cartBusy = true;
        try {
          const cart = await cartFetch(`${SS.routes.cartChange}.js`, { line: Number(btn.dataset.line), quantity: Math.max(0, Number(btn.dataset.qty)) });
          renderCart(cart);
        } catch (err) { alert(err.message); }
        cartBusy = false;
        return;
      }
      const checkout = e.target.closest('[data-cart-checkout]');
      if (checkout) { e.preventDefault(); SS.goToCheckout(); }
    });

    const form = drawer.querySelector('[data-coupon-form]');
    const msg = drawer.querySelector('[data-coupon-msg]');
    form && form.addEventListener('submit', e => {
      e.preventDefault();
      const input = form.querySelector('[data-coupon-input]');
      const code = input.value.trim().toUpperCase();
      input.value = code;
      SS.setTypedCode(code);
      const d = SS.discount();
      if (!code) msg.textContent = d.code ? `using ${d.code}` : '';
      else if (d.creator) msg.textContent = `✓ ${SS.creators[d.creator].name}'s code: ${d.pct}% off + a free creator gift`;
      else if (d.known) msg.textContent = `✓ ${d.code}: ${d.pct}% off`;
      else msg.textContent = `we'll apply ${d.code} at checkout`;
      SS.refreshCart().catch(() => {});
    });
  }

  document.addEventListener('keydown', e => { if (e.key === 'Escape') SS.closeCart(); });
  document.addEventListener('click', e => {
    const opener = e.target.closest('[data-cart-open]');
    if (opener && drawer) { e.preventDefault(); SS.openCart(); }
  });

  /* ---------- mobile menu ---------- */
  const menuBtn = document.querySelector('.mobile-menu-btn');
  const menu = document.querySelector('.mobile-drawer');
  const menuClose = document.querySelector('.close-drawer');
  if (menuBtn && menu && menuClose) {
    const open = () => { menu.classList.add('open'); menu.setAttribute('aria-hidden', 'false'); document.body.style.overflow = 'hidden'; };
    const close = () => { menu.classList.remove('open'); menu.setAttribute('aria-hidden', 'true'); document.body.style.overflow = ''; };
    menuBtn.addEventListener('click', open);
    menuClose.addEventListener('click', close);
    menu.addEventListener('click', e => { if (e.target.closest('a')) close(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  }

  /* ---------- navbar hides on scroll down ---------- */
  const navbar = document.querySelector('.navbar');
  if (navbar) {
    let lastY = scrollY, ticking = false;
    addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = scrollY;
        navbar.classList.toggle('navbar--hidden', y > lastY && y > 100);
        lastY = y;
        ticking = false;
      });
    }, { passive: true });
  }

  const markScrolled = () => document.body.classList.toggle('scrolled-past-hero', scrollY > innerHeight * 0.6);
  addEventListener('scroll', markScrolled, { passive: true });
  markScrolled();

  /* ---------- fade-up on scroll ---------- */
  window.SS_FADE_READY = true;
  const fades = document.querySelectorAll('.fade-up');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries, obs) => entries.forEach(en => {
      if (en.isIntersecting) { en.target.classList.add('visible'); obs.unobserve(en.target); }
    }), { threshold: 0.1 });
    fades.forEach(el => io.observe(el));
  } else {
    document.documentElement.classList.remove('js-fade');
    fades.forEach(el => el.classList.add('visible'));
  }

  /* ---------- launch nudge (not on product / cart pages) ---------- */
  function nudge() {
    if (!SS.showNudge || !SS.launchPct || ['product', 'cart', 'password'].includes(SS.template)) return;
    const SNOOZE_KEY = 'superstate_nudge_snoozed_at';
    const SESSION_KEY = 'superstate_nudge_shown';
    if (store.get(SESSION_KEY, true)) return;
    const snoozed = Number(store.get(SNOOZE_KEY));
    if (snoozed && Date.now() - snoozed < 3 * 864e5) return;

    const tpl = document.getElementById('ss-nudge-template');
    if (!tpl) return;
    let shown = false, el = null;
    const offs = [];
    const close = () => {
      store.set(SNOOZE_KEY, String(Date.now()));
      el.classList.remove('ss-nudge-in');
      setTimeout(() => el.remove(), 350);
    };
    const show = () => {
      if (shown || document.querySelector('.mobile-drawer.open') || (drawer && drawer.classList.contains('active'))) return;
      shown = true;
      offs.forEach(off => off());
      store.set(SESSION_KEY, '1', true);
      el = tpl.content.firstElementChild.cloneNode(true);
      document.body.appendChild(el);
      requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('ss-nudge-in')));
      el.querySelector('.ss-nudge-close').addEventListener('click', close);
      el.querySelector('.ss-nudge-later').addEventListener('click', close);
      el.querySelector('.ss-nudge-cta').addEventListener('click', () => store.set(SNOOZE_KEY, String(Date.now())));
      document.addEventListener('keydown', e => { if (e.key === 'Escape' && el.isConnected) close(); });
    };
    const timer = setTimeout(show, 12000);
    offs.push(() => clearTimeout(timer));
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - innerHeight;
      if (max > 0 && scrollY / max >= 0.45) show();
    };
    addEventListener('scroll', onScroll, { passive: true });
    offs.push(() => removeEventListener('scroll', onScroll));
    const onLeave = e => { if (!e.relatedTarget && e.clientY <= 0) show(); };
    document.addEventListener('mouseout', onLeave);
    offs.push(() => document.removeEventListener('mouseout', onLeave));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', nudge);
  else nudge();
})();
