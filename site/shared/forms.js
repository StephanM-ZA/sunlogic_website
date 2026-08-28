// Generic lead-form handler — wires up every <form data-sl-form> on the page
// the same way: inline validation, honeypot spam trap, JSON POST to a
// webhook, redirect to a thank-you page. One reusable module instead of
// per-page copies, so every lead form on the site (hero assessment form,
// contact page, future landing pages) behaves identically.
//
// Usage: <form data-sl-form data-webhook="https://..." data-redirect="thank-you.html">
// Mark required fields with the native `required` attribute (sl-field does
// this for you via its own `required` attribute). Add a honeypot trap with
// class="sl-hp-trap" — any value in it silently drops the submission.
//
// data-webhook left as the literal string 'PENDING_BACKEND' is treated as
// "no backend wired up yet": the form still validates and redirects to the
// thank-you page (so the front-end flow is fully testable), but skips the
// network call and logs a console notice instead of failing against a
// nonsense URL.
(function () {
  // sl-field passes `required` through to its real <input>/<select>/
  // <textarea>, but the attribute also stays on the sl-field host tag
  // itself (a display:contents custom element). A bare `[required]`
  // selector matches that host too — its `.value` is undefined, which
  // isEmpty() reads as "always empty", so validation would fail even
  // when every real field is filled in. Scope to actual form controls.
  const REQUIRED_CONTROL_SELECTOR = 'input[required], select[required], textarea[required]';

  function fieldWrap(el) {
    return el.closest('.sl-field-wrap') || el.parentElement;
  }

  function errorMessageFor(el) {
    if (el.type === 'email') return 'Please enter a valid email address.';
    if (el.tagName === 'SELECT') return 'Please make a selection.';
    return 'This field is required.';
  }

  function isEmpty(el) {
    return !el.value || (el.tagName === 'SELECT' && el.value === '');
  }

  function isBadEmail(el) {
    return el.type === 'email' && el.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value);
  }

  function setError(el, show) {
    const wrap = fieldWrap(el);
    const msg = wrap.querySelector('[data-field-error]');
    if (show) {
      el.classList.add('border-error');
      el.classList.remove('border-surface-variant');
      if (msg) {
        msg.textContent = errorMessageFor(el);
        msg.classList.remove('hidden');
      }
    } else {
      el.classList.remove('border-error');
      el.classList.add('border-surface-variant');
      if (msg) msg.classList.add('hidden');
    }
  }

  function validate(form) {
    let valid = true;
    let firstInvalid = null;
    form.querySelectorAll(REQUIRED_CONTROL_SELECTOR).forEach((el) => {
      const bad = isEmpty(el) || isBadEmail(el);
      setError(el, bad);
      if (bad) {
        valid = false;
        if (!firstInvalid) firstInvalid = el;
      }
    });
    if (firstInvalid) firstInvalid.focus();
    return valid;
  }

  function wireForm(form) {
    form.querySelectorAll(REQUIRED_CONTROL_SELECTOR).forEach((el) => {
      const clear = () => setError(el, false);
      el.addEventListener('input', clear);
      el.addEventListener('change', clear);
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      const honeypot = form.querySelector('.sl-hp-trap');
      if (honeypot && honeypot.value) return;

      if (!validate(form)) return;

      const webhook = form.dataset.webhook || '';
      const redirect = form.dataset.redirect || 'thank-you.html';
      const data = {};
      new FormData(form).forEach((value, key) => { data[key] = value; });

      // sl-button is a display:contents host — its rendered <button> is a
      // real node inside the form, so query for that directly rather than
      // the host element (setting .textContent on the host would destroy
      // the button element it wraps).
      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn ? submitBtn.textContent : '';
      if (submitBtn) {
        submitBtn.textContent = 'Sending...';
        submitBtn.setAttribute('disabled', '');
      }

      if (!webhook || webhook === 'PENDING_BACKEND') {
        console.info('[sl-forms] No backend wired up yet for this form — skipping submission, still redirecting.', data);
        window.location.href = redirect;
        return;
      }

      fetch(webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
        .then(() => { window.location.href = redirect; })
        .catch(() => {
          // Still redirect — the submission may have reached the backend
          // even if this browser's fetch reports a network error, and a
          // stuck form is worse than an unconfirmed one.
          window.location.href = redirect;
        })
        .finally(() => {
          if (submitBtn) {
            submitBtn.textContent = originalText;
            submitBtn.removeAttribute('disabled');
          }
        });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('form[data-sl-form]').forEach(wireForm);
  });
})();
