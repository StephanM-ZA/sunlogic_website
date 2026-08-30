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
    const webhook = form.getAttribute('data-webhook');
    fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(function(response) {
      if (response.ok) {
        form.innerHTML = '<p class="font-body text-text-primary">Thanks — we will be in touch shortly.</p>';
      } else {
        throw new Error('Webhook returned ' + response.status);
      }
    }).catch(function(err) {
      console.warn('Form submission webhook failed:', err);
      form.innerHTML = '<p class="font-body text-danger">Something went wrong — please call us instead.</p>';
    });
  });
}
document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('form[data-dl-form]').forEach(dlInitForm);
});
