import { submitWaitlist, getSavedSubmission, clearSavedSubmission, WAITLIST_CONFIG } from './services/waitlistService.js';
import { captureRefFromUrl, getStoredRef, creatorName } from './shared/creators.js';

document.addEventListener('DOMContentLoaded', () => {
  /* ─── Elements ─────────────────────────────────────────────────────────── */
  const formCard     = document.getElementById('wl-form-card');
  const successCard  = document.getElementById('wl-success-card');
  const form         = document.getElementById('wl-form');
  const submitBtn    = document.getElementById('wl-submit');
  const btnText      = document.getElementById('wl-btn-text');
  const btnSpinner   = document.getElementById('wl-spinner');

  const nameInput    = document.getElementById('wl-name');
  const emailInput   = document.getElementById('wl-email');
  const phoneInput   = document.getElementById('wl-phone');
  const genderInput  = document.getElementById('wl-gender');
  const codeInput    = document.getElementById('wl-code');
  const codeGroup    = document.getElementById('wl-code-group');
  const codeToggle   = document.getElementById('wl-code-toggle');

  const successName    = document.getElementById('wl-success-name');
  const successEmail   = document.getElementById('wl-success-email');
  const successDiscount = document.getElementById('wl-success-discount');
  const redoBtn         = document.getElementById('wl-redo-btn');
  const copyBtn         = document.getElementById('wl-copy-btn');

  /* ─── Restore existing submission ────────────────────────────────────── */
  const saved = getSavedSubmission();
  if (saved) showSuccess(saved, true);

  /* ─── Gender slider ──────────────────────────────────────────────────── */
  const genderBtns = document.querySelectorAll('.wl-gender-btn');
  const genderBg   = document.querySelector('.wl-gender-bg');
  genderBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      genderBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      if (genderInput) genderInput.value = btn.dataset.gender;
      if (genderBg) genderBg.classList.toggle('slide-right', btn.dataset.gender === 'female');
    });
  });

  /* ─── Real-time inline error clearing ───────────────────────────────── */
  [nameInput, emailInput, phoneInput, codeInput].forEach(inp => {
    inp?.addEventListener('input', () => clearError(inp));
  });

  /* ─── Creator code (hidden until asked for) ──────────────────────────── */
  function openCodeField(focus) {
    if (!codeGroup || !codeToggle) return;
    codeGroup.hidden = false;
    codeToggle.hidden = true;
    codeToggle.setAttribute('aria-expanded', 'true');
    if (focus) codeInput?.focus();
  }
  function closeCodeField() {
    if (!codeGroup || !codeToggle) return;
    codeGroup.hidden = true;
    codeToggle.hidden = false;
    codeToggle.setAttribute('aria-expanded', 'false');
  }
  codeToggle?.addEventListener('click', () => openCodeField(true));

  // Came from a creator's link? Fill their code in for them.
  const refCode = captureRefFromUrl() || getStoredRef();
  if (refCode && codeInput) { codeInput.value = refCode; openCodeField(false); }

  /* ─── Copy the code ──────────────────────────────────────────────────── */
  copyBtn?.addEventListener('click', async () => {
    const code = document.getElementById('wl-success-code')?.textContent || WAITLIST_CONFIG.EARLY_ACCESS_CODE;
    try {
      await navigator.clipboard.writeText(code);
      copyBtn.textContent = 'copied ✓';
    } catch (err) {
      copyBtn.textContent = code;
    }
  });

  /* ─── Form submit ────────────────────────────────────────────────────── */
  form?.addEventListener('submit', async e => {
    e.preventDefault();
    clearAllErrors();
    setLoading(true);

    try {
      const res = await submitWaitlist({
        name: nameInput?.value || '',
        email: emailInput?.value || '',
        phone: phoneInput?.value || '',
        gender: genderInput?.value || 'prefer_not_to_say',
        promoCode: codeInput?.value || ''
      });

      if (res.success) {
        showSuccess(res.record, false);
      } else if (res.errors) {
        showErrors(res.errors);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  });

  /* ─── Redo waitlist ──────────────────────────────────────────────────── */
  redoBtn?.addEventListener('click', () => {
    clearSavedSubmission();
    form?.reset();
    clearAllErrors();
    closeCodeField();
    if (copyBtn) copyBtn.textContent = 'copy';
    genderBtns.forEach(b => b.classList.remove('active'));
    genderBtns[0]?.classList.add('active');
    if (genderInput) genderInput.value = genderBtns[0]?.dataset.gender || 'male';
    if (genderBg) genderBg.classList.remove('slide-right');
    showForm();
  });

  /* ─── Helpers ────────────────────────────────────────────────────────── */
  function setLoading(on) {
    if (!submitBtn) return;
    submitBtn.disabled = on;
    if (btnText)    btnText.style.opacity = on ? '0' : '1';
    if (btnSpinner) btnSpinner.style.display = on ? 'inline-block' : 'none';
  }

  function clearError(inp) {
    inp.classList.remove('wl-input-error');
    const id = inp.id.replace('wl-', '') + '-err';
    const el = document.getElementById(id);
    if (el) { el.textContent = ''; el.style.display = 'none'; }
  }

  function clearAllErrors() {
    [nameInput, emailInput, phoneInput, codeInput].forEach(i => i && clearError(i));
  }

  function showErrors(errors) {
    const map = { name: nameInput, email: emailInput, phone: phoneInput, code: codeInput };
    if (errors.code) openCodeField(false);
    let first = true;
    Object.entries(errors).forEach(([key, msg]) => {
      const inp = map[key];
      if (!inp) return;
      inp.classList.add('wl-input-error');
      const errEl = document.getElementById(`${key}-err`);
      if (errEl) { errEl.textContent = msg; errEl.style.display = 'block'; }
      if (first) { inp.focus(); first = false; }
    });
  }

  function showSuccess(record, alreadyJoined) {
    if (!formCard || !successCard) return;

    if (successName)     successName.textContent     = record.name?.split(' ')[0] || 'there';
    if (successEmail)    successEmail.textContent    = record.email || '';
    if (successDiscount) successDiscount.textContent = record.discount || 20;
    const successCode = document.getElementById('wl-success-code');
    if (successCode) successCode.textContent = record.promoCode || WAITLIST_CONFIG.EARLY_ACCESS_CODE;
    renderUpsell(record.isInfluencer ? record.promoCode : null);

    formCard.style.transition = 'opacity 0.3s, transform 0.3s';
    formCard.style.opacity = '0';
    formCard.style.transform = 'translateY(-12px)';

    setTimeout(() => {
      formCard.style.display = 'none';
      successCard.style.display = 'block';
      requestAnimationFrame(() => successCard.classList.add('visible'));
      if (!alreadyJoined) confetti();
      successCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 280);
  }

  // Point everyone to the pre-book; creator followers also get the gift pitch
  function renderUpsell(code) {
    const cta = document.getElementById('wl-upsell-cta');
    if (!cta) return;
    const set = (id, prop, v) => { const el = document.getElementById(id); if (el) el[prop] = v; };
    const name = creatorName(code);
    const base = '/pages/prebook/?pack=Pack%20Of%2030&qty=1';
    if (name) {
      set('wl-success-pill', 'innerHTML', `<b>✓</b> ${name}'s crew 💛`);
      set('wl-coupon-off', 'textContent', `${name}'s code · use it on launch day`);
      set('wl-upsell-icon', 'textContent', '🎁');
      set('wl-upsell-tag', 'textContent', `only for ${name}'s followers`);
      set('wl-upsell-h', 'innerHTML', 'pre-book now, get a <em>free gift package.</em>');
      set('wl-upsell-p', 'textContent', `because ${name} sent you, your pre-book comes with a special package of SuperState gifts. other pre-bookers don't get this.`);
      set('wl-upsell-perks', 'innerHTML', '<li class="hot">free gift package 🎁</li><li class="hot">50% off</li><li>30 nights · ₹750 <s>₹1,500</s></li><li>member card 💳</li>');
      set('wl-upsell-cta-text', 'textContent', 'pre-book with my gift');
      cta.href = `${base}&ref=${encodeURIComponent(code)}`;
    } else {
      set('wl-success-pill', 'innerHTML', "<b>✓</b> you're on the list");
      set('wl-coupon-off', 'textContent', 'use it at checkout on launch day');
      set('wl-upsell-icon', 'textContent', '⚡');
      set('wl-upsell-tag', 'textContent', 'want it cheaper?');
      set('wl-upsell-h', 'innerHTML', 'skip the wait. <em>pre-book at 50% off.</em>');
      set('wl-upsell-p', 'textContent', 'pay now, ships with the next drop.');
      set('wl-upsell-perks', 'innerHTML', '<li class="hot">50% off</li><li>30 nights · ₹750 <s>₹1,500</s></li><li>member card 💳</li>');
      set('wl-upsell-cta-text', 'textContent', 'pre-book at 50% off');
      cta.href = base;
    }
  }

  // Brand-colour confetti burst over the success card
  function confetti() {
    const box = document.getElementById('wl-confetti');
    if (!box || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    box.innerHTML = '';
    const colors = ['#E4FF5A', '#ffffff', '#33cc99', '#7aa2ff', '#E4FF5A'];
    for (let i = 0; i < 70; i++) {
      const p = document.createElement('i');
      p.style.left = `${Math.random() * 100}%`;
      p.style.background = colors[i % colors.length];
      p.style.setProperty('--dx', `${(Math.random() - 0.5) * 160}px`);
      p.style.setProperty('--rot', `${Math.random() * 720 - 360}deg`);
      p.style.animationDuration = `${1.6 + Math.random() * 1.4}s`;
      p.style.animationDelay = `${Math.random() * 0.4}s`;
      if (i % 3 === 0) { p.style.width = '10px'; p.style.height = '10px'; p.style.borderRadius = '50%'; }
      box.appendChild(p);
    }
    setTimeout(() => { box.innerHTML = ''; }, 3600);
  }

  function showForm() {
    if (!formCard || !successCard) return;

    successCard.classList.remove('visible');

    setTimeout(() => {
      successCard.style.display = 'none';
      formCard.style.display = 'block';
      formCard.style.opacity = '0';
      formCard.style.transform = 'translateY(-12px)';
      requestAnimationFrame(() => {
        formCard.style.opacity = '1';
        formCard.style.transform = 'translateY(0)';
      });
      formCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 280);
  }
});
