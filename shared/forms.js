/* Form wiring. On success the browser goes to thank-you.html — that page is
   the confirmation. A form marked data-success="inline" gets the confirmation
   rendered in its place instead, for the contact modal, where navigating to a
   thank-you page would defeat the point of not leaving the page. */

function dlFormSuccessInline(form) {
  const panel = document.createElement('div');
  panel.className = 'sl-form-success';
  /* role=status rather than alert: this is a confirmation, not a problem, so
     it is announced without interrupting whatever the reader is doing. */
  panel.setAttribute('role', 'status');
  panel.innerHTML =
    '<p class="sl-title">Thank you, that is with us</p>' +
    '<p class="sl-body">We will come back to you shortly. This will close on its own.</p>';
  form.replaceWith(panel);
  /* Dispatched from the panel, which is in the document — the form is detached
     by this point and an event from it would reach nothing. The modal listens
     for this to start its own dismiss timer. */
  panel.dispatchEvent(new CustomEvent('dl-form-success', { bubbles: true }));
}

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
    const requiredFields = form.querySelectorAll('input[required], select[required], textarea[required]');
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
    const done = function() {
      if (form.getAttribute('data-success') === 'inline') { dlFormSuccessInline(form); return; }
      window.location.href = 'thank-you.html';
    };
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
/* Prefills "What you need" (and the message) from ?need=, set by the
   lead-context link rewriting in components.js — so a visitor who
   arrived from the solar or electrical page doesn't have to re-answer
   the question that page already implied. */
function dlPrefillFromQuery() {
  const need = new URLSearchParams(window.location.search).get('need');
  if (!need) { return; }
  const select = document.querySelector('select[name="need"]');
  if (!select || !Array.from(select.options).some(function(o) { return o.value === need; })) { return; }
  select.value = need;
  /* Spelled out per division rather than lower-casing the option label. The
     labels are division names, not things you can drop into a sentence: the
     rename to Energy/Smart turned this into "I'm interested in smart for my
     property", which is not a sentence anyone would type. "Not sure yet" is
     absent on purpose — someone who has not decided has nothing to prefill,
     and putting words in their mouth is worse than an empty box. */
  const INTEREST = {
    'Energy': 'solar and backup power',
    'Electrical': 'electrical work',
    'Smart Solutions': 'smart energy management',
    'Servicing': 'a service on an existing installation',
  };
  const message = document.querySelector('textarea[name="message"]');
  if (message && !message.value && INTEREST[need]) {
    message.value = "I'm interested in " + INTEREST[need] + " for my property. ";
  }
}

/* Exposed so a component that builds a form after load can wire it up — the
   contact modal rebuilds its form each time it closes, and that new form is
   long past the DOMContentLoaded sweep below. */
window.dlInitForm = dlInitForm;

document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('form[data-dl-form]').forEach(dlInitForm);
  dlPrefillFromQuery();
});
