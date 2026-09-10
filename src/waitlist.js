import { submitWaitlist, getSavedSubmission, clearSavedSubmission, resolveCoupon } from './services/waitlistService.js';

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

  const successName    = document.getElementById('wl-success-name');
  const successEmail   = document.getElementById('wl-success-email');
  const successDiscount = document.getElementById('wl-success-discount');
  const redoBtn         = document.getElementById('wl-redo-btn');
  const codeApplied     = document.getElementById('code-applied');

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

  /* ─── Live influencer code check ─────────────────────────────────────── */
  codeInput?.addEventListener('input', () => {
    const coupon = resolveCoupon(codeInput.value);
    if (codeApplied) codeApplied.style.display = coupon.isInfluencer ? 'block' : 'none';
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
    if (codeApplied) codeApplied.style.display = 'none';
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
    if (successDiscount) successDiscount.textContent = record.discount || 10;

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
