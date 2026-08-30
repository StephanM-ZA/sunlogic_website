/* Form wiring. On success the browser goes to thank-you.html — that page is
   the confirmation, so nothing here renders a success state of its own. */

function dlFormError(form) {
  if (form.querySelector('[data-dl-form-error]')) { return; }
  const p = document.createElement('p');
  p.className = 'sl-body sl-hint--error';
  p.setAttribute('data-dl-form-error', '');
  p.setAttribute('role', 'alert');
  p.textContent = 'Something went wrong — please call us instead.';
  form.appendChild(p);
}

function dlInitForm(form) {
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    const honeypot = form.querySelector('[name="website"]');
    if (honeypot && honeypot.value) {
      return;
    }
    const requiredFields = form.querySelectorAll('[required]');
    for (let i = 0; i < requiredFields.length; i++) {
      if (!requiredFields[i].value.trim()) {
        requiredFields[i].focus();
        return;
      }
    }
    const data = {};
    new FormData(form).forEach(function(value, key) {
      if (key !== 'website') { data[key] = value; }
    });
    const done = function() { window.location.href = 'thank-you.html'; };
    const webhook = form.getAttribute('data-webhook');
    /* Same convention as plugins/calculator: an unconfigured webhook logs the
       payload instead of posting it, so the page still behaves end to end
       while the backend is pending. */
    if (!webhook || webhook === 'PENDING_BACKEND') {
      console.warn('No webhook configured (or still PENDING_BACKEND) — lead not sent:', data);
      done();
      return;
    }
    fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(function(response) {
      if (!response.ok) {
        throw new Error('Webhook returned ' + response.status);
      }
      done();
    }).catch(function(err) {
      console.warn('Form submission webhook failed:', err);
      dlFormError(form);
    });
  });
}
document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('form[data-dl-form]').forEach(dlInitForm);
});
