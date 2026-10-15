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
  /* The defaults are the contact modal's, where this started. A form that is
     not an enquiry says what actually happened instead: the brief page is
     filled in by our own team, and "we will come back to you shortly" is the
     wrong sentence to show someone who works here. */
  panel.innerHTML =
    '<p class="sl-title">' +
    (form.getAttribute('data-success-title') || 'Thank you, that is with us') + '</p>' +
    '<p class="sl-body">' +
    (form.getAttribute('data-success-body') ||
      'We will come back to you shortly. This will close on its own.') + '</p>';
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
  p.textContent = 'Something went wrong. Please call us instead.';
  form.appendChild(p);
}

/* Conditional branches.
   ------------------------------------------------------------------
   A form marked data-dl-branch-on="<field name>" shows exactly the branch
   whose data-dl-branch list contains that field's value, and hides the rest.

   Hidden branches are DISABLED, not merely hidden. A hidden-but-enabled
   control is still submitted and still blocks submit on `required`, so the
   brief would have refused to send while pointing the installer at a field
   they cannot see. Disabling takes it out of both FormData and validation,
   which is the behaviour the old WordPress form had and the only one that
   makes a branched form usable. */
function dlApplyBranches(form, value) {
  form.querySelectorAll('[data-dl-branch]').forEach(function(branch) {
    const wanted = branch.getAttribute('data-dl-branch').split('|');
    const show = wanted.indexOf(value) !== -1;
    branch.hidden = !show;
    branch.querySelectorAll('input, select, textarea').forEach(function(el) {
      el.disabled = !show;
    });
  });
}

function dlInitBranches(form) {
  const on = form.getAttribute('data-dl-branch-on');
  if (!on) { return; }
  const controller = form.querySelector('[name="' + on + '"]');
  if (!controller) {
    console.warn('data-dl-branch-on names a field that is not in this form:', on);
    return;
  }
  dlApplyBranches(form, controller.value);
  controller.addEventListener('change', function() { dlApplyBranches(form, controller.value); });
}

/* Photo uploads.
   ------------------------------------------------------------------
   Each file is PUT one request at a time to data-dl-upload, which answers with
   the URL it can be fetched back from. One request per file, in sequence: a
   brief is filled in on site from a phone, and a connection that drops mid-way
   through one 60 MB multipart body costs the whole submission, while this
   costs one photo and can say which.

   What goes back into the field is a URL, because that is what the receiving
   end stores and hands on. See the comment in project-brief.html for why only
   the first URL goes in the field itself. */
async function dlUploadFile(endpoint, file) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': file.type, 'X-File-Name': file.name },
    body: file,
  });
  const body = await response.json().catch(function() { return {}; });
  if (!response.ok || !body.url) {
    throw new Error('Upload of ' + file.name + ' failed: ' + (body.error || response.status));
  }
  return body.url;
}

function dlUploadNote(form, text) {
  let note = form.querySelector('[data-dl-upload-status]');
  if (!note) {
    note = document.createElement('p');
    note.className = 'sl-hint';
    note.setAttribute('data-dl-upload-status', '');
    note.setAttribute('role', 'status');
    form.appendChild(note);
  }
  note.textContent = text;
  return note;
}

/* Returns { values, extras }: one URL per file field for the payload, and
   every URL beyond the first, which the page appends to its comments so a
   second and third photo are not quietly dropped. */
async function dlUploadFields(form, endpoint) {
  const values = {};
  const extras = [];
  const inputs = Array.prototype.filter.call(
    form.querySelectorAll('input[type="file"]'),
    function(input) { return !input.disabled && input.files && input.files.length; });
  if (!inputs.length) { return { values: values, extras: extras }; }

  let done = 0;
  const total = inputs.reduce(function(n, input) { return n + input.files.length; }, 0);
  for (const input of inputs) {
    const urls = [];
    for (const file of input.files) {
      dlUploadNote(form, 'Uploading photo ' + (done + 1) + ' of ' + total + '…');
      urls.push(await dlUploadFile(endpoint, file));
      done += 1;
    }
    values[input.name] = urls[0];
    for (let i = 1; i < urls.length; i++) { extras.push(urls[i]); }
  }
  dlUploadNote(form, total === 1 ? 'Photo uploaded.' : total + ' photos uploaded.');
  return { values: values, extras: extras };
}

function dlInitForm(form) {
  dlInitBranches(form);

  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    const honeypot = form.querySelector('[name="website"]');
    if (honeypot && honeypot.value) {
      return;
    }
    const requiredFields = form.querySelectorAll('input[required], select[required], textarea[required]');
    for (let i = 0; i < requiredFields.length; i++) {
      /* A disabled control is in a branch that is not showing. Focusing it
         would scroll to nothing and the submit would never complete. */
      if (requiredFields[i].disabled) { continue; }
      if (requiredFields[i].type === 'file') {
        if (!requiredFields[i].files.length) { requiredFields[i].focus(); return; }
        continue;
      }
      if (!requiredFields[i].value.trim()) {
        requiredFields[i].focus();
        return;
      }
    }
    const data = {};
    new FormData(form).forEach(function(value, key) {
      /* A File object has no place in a JSON payload — the upload step below
         replaces these keys with the URL the file now lives at. */
      if (key !== 'website' && !(value instanceof File)) { data[key] = value; }
    });

    const done = function() {
      if (form.getAttribute('data-success') === 'inline') { dlFormSuccessInline(form); return; }
      window.location.href = 'thank-you.html';
    };
    const webhook = form.getAttribute('data-webhook');
    const uploadEndpoint = form.getAttribute('data-dl-upload');
    const submit = form.querySelector('[type="submit"]');

    if (submit) { submit.setAttribute('aria-busy', 'true'); }
    try {
      if (uploadEndpoint) {
        const uploaded = await dlUploadFields(form, uploadEndpoint);
        Object.keys(uploaded.values).forEach(function(k) { data[k] = uploaded.values[k]; });
        /* Everything past the first photo per field, named in the copy the
           recipient reads, so nothing uploaded goes unmentioned. */
        if (uploaded.extras.length) {
          const notes = form.getAttribute('data-dl-upload-extras-into');
          if (notes) {
            data[notes] = (data[notes] ? data[notes] + '\n\n' : '') +
              'Further photos uploaded:\n' + uploaded.extras.join('\n');
          }
        }
      }

      /* Same convention as plugins/calculator: an unconfigured webhook logs the
         payload instead of posting it, so the page still behaves end to end
         while the backend is pending. */
      if (!webhook || webhook === 'PENDING_BACKEND') {
        console.warn('No webhook configured (or still PENDING_BACKEND) — lead not sent:', data);
        done();
        return;
      }
      const response = await fetch(webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error('Webhook returned ' + response.status);
      }
      done();
    } catch (err) {
      console.warn('Form submission failed:', err);
      dlFormError(form);
    } finally {
      if (submit) { submit.removeAttribute('aria-busy'); }
    }
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
