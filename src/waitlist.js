import { submitWaitlist, getSavedSubmission, copyToClipboard, WAITLIST_CONFIG } from './services/waitlistService.js';

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

  const copyBtn      = document.getElementById('wl-copy-btn');
  const couponEl     = document.getElementById('wl-coupon-display');
  const discountEl   = document.getElementById('wl-discount-display');
  const copyStatus   = document.getElementById('wl-copy-status');
  const successName  = document.getElementById('wl-success-name');
  const successEmail = document.getElementById('wl-success-email');
  const influencerMsg= document.getElementById('wl-influencer-msg');

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
  [nameInput, emailInput, phoneInput].forEach(inp => {
    inp?.addEventListener('input', () => clearError(inp));
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

  /* ─── Copy coupon ────────────────────────────────────────────────────── */
  copyBtn?.addEventListener('click', async () => {
    const code = couponEl?.textContent?.trim() || WAITLIST_CONFIG.EARLY_ACCESS_CODE;
    const ok = await copyToClipboard(code);
    if (ok) {
      copyBtn.classList.add('copied');
      copyBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Copied!`;
      if (copyStatus) { copyStatus.textContent = 'Copied to clipboard!'; copyStatus.style.opacity = '1'; }
      setTimeout(() => {
        copyBtn.classList.remove('copied');
        copyBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Copy Code`;
        if (copyStatus) copyStatus.style.opacity = '0';
      }, 3000);
    }
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
    [nameInput, emailInput, phoneInput].forEach(i => i && clearError(i));
  }

  function showErrors(errors) {
    const map = { name: nameInput, email: emailInput, phone: phoneInput };
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

    if (successName)  successName.textContent  = record.name?.split(' ')[0] || 'there';
    if (successEmail) successEmail.textContent = record.email || '';
    if (couponEl)     couponEl.textContent     = record.promoCode || WAITLIST_CONFIG.EARLY_ACCESS_CODE;
    if (discountEl)   discountEl.textContent   = `${record.discount || 10}% OFF`;

    if (influencerMsg) {
      influencerMsg.style.display = record.isInfluencer ? 'block' : 'none';
    }

    formCard.style.transition = 'opacity 0.3s, transform 0.3s';
    formCard.style.opacity = '0';
    formCard.style.transform = 'translateY(-12px)';

    setTimeout(() => {
      formCard.style.display = 'none';
      successCard.style.display = 'block';
      requestAnimationFrame(() => successCard.classList.add('visible'));
      successCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 280);
  }
});
