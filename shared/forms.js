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

/* Field-level errors: say which field, say why, go there.
   ------------------------------------------------------------------
   The form used to fail with one line at the bottom — "Something went wrong.
   Please call us instead." — for every cause there is. A required field left
   blank, an email with no @, a photo that would not upload: all of them
   looked identical, and none of them said where to look. On a twenty-field
   form filled in on a phone that is not a message, it is a dead end.

   So: mark the field, name the reason under it, and put the reader there. */
function dlFieldError(control, message) {
  control.setAttribute('aria-invalid', 'true');
  const field = control.closest('.sl-field') || control.parentElement;
  let note = field.querySelector('.sl-field-error');
  if (!note) {
    note = document.createElement('p');
    note.className = 'sl-field-error';
    /* role=alert so a screen reader announces it on arrival rather than
       leaving a blind user to discover a silent red border. */
    note.setAttribute('role', 'alert');
    field.appendChild(note);
  }
  note.textContent = message;
}

function dlClearFieldError(control) {
  control.removeAttribute('aria-invalid');
  const field = control.closest('.sl-field') || control.parentElement;
  const note = field && field.querySelector('.sl-field-error');
  if (note) { note.remove(); }
}

function dlClearAllErrors(form) {
  form.querySelectorAll('[aria-invalid="true"]').forEach(dlClearFieldError);
  const banner = form.querySelector('[data-dl-form-error]');
  if (banner) { banner.remove(); }
}

/* Mark it, explain it, scroll to it, focus it. The scroll matters more than
   it looks: the offending field is usually above the submit button and off
   screen, so without this the reader is told something is wrong and shown
   nothing. */
function dlFailField(control, message) {
  dlFieldError(control, message);
  control.scrollIntoView({ block: 'center', behavior: 'smooth' });
  control.focus({ preventScroll: true });
  return false;
}

/* An email the browser would reject. Deliberately not a clever pattern:
   something@something.something is the only shape worth enforcing, and
   anything stricter starts rejecting real addresses. */
function dlEmailLooksValid(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function dlValidate(form) {
  dlClearAllErrors(form);
  const controls = form.querySelectorAll('input, select, textarea');
  for (let i = 0; i < controls.length; i++) {
    const el = controls[i];
    /* Disabled means it is in a branch that is not showing. Hidden means the
       honeypot. Neither is the reader's problem. */
    if (el.disabled || el.name === 'website') { continue; }

    if (el.hasAttribute('required')) {
      if (el.type === 'file') {
        if (!el.files.length) { return dlFailField(el, 'Please add at least one file'); }
      } else if (!el.value.trim()) {
        return dlFailField(el, el.tagName === 'SELECT' ? 'Please choose an option' : 'This field is required');
      }
    }
    if (el.type === 'email' && el.value.trim() && !dlEmailLooksValid(el.value)) {
      return dlFailField(el, 'Enter a valid email address, like name@example.co.za');
    }
    if (el.type === 'url' && el.value.trim() && !/^https?:\/\//i.test(el.value.trim())) {
      return dlFailField(el, 'Enter a full link starting with https://');
    }
  }
  return true;
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

/* Check photos as soon as they are chosen.
   ------------------------------------------------------------------
   Finding out a photo is unusable only after filling in twenty fields and
   pressing Submit is the worst possible moment. Compressing here also means
   the result is cached on the input, so submit does not redo the work. */
function dlInitFileChecks(form) {
  form.querySelectorAll('input[type="file"]').forEach(function(input) {
    input.addEventListener('change', async function() {
      dlClearFieldError(input);
      input._dlReady = null;
      if (!input.files.length) { return; }
      const ready = [];
      for (const file of input.files) {
        const small = await dlCompressImage(file, 1600, 0.82);
        const problem = dlFileProblem(small, small.size);
        if (problem) { dlFieldError(input, problem); return; }
        ready.push(small);
      }
      input._dlReady = ready;
      const saved = Array.prototype.reduce.call(input.files, function(n, f) { return n + f.size; }, 0) -
        ready.reduce(function(n, f) { return n + f.size; }, 0);
      if (saved > 0) {
        dlFieldError(input, ready.length + (ready.length === 1 ? ' photo ready' : ' photos ready') +
          ', resized to save ' + Math.round(saved / 1024 / 1024 * 10) / 10 + ' MB');
        const note = input.closest('.sl-field').querySelector('.sl-field-error');
        /* Not an error, so it must not look like one. Same slot, plain tone. */
        if (note) { note.className = 'sl-hint'; note.removeAttribute('role'); }
        input.removeAttribute('aria-invalid');
      }
    });
  });
}

/* Address lookup as you type.
   ------------------------------------------------------------------
   OpenStreetMap's Nominatim, chosen over the alternatives for one reason
   that matters here: it takes countrycodes=za, so "Main Road" returns Cape
   Town rather than Manchester. It is free and needs no key, which is the
   constraint this whole feature lives under.

   Its usage policy asks for at most one request a second, so the input is
   debounced at 600ms and nothing fires under three characters. For a form two
   people fill in a few times a day that is comfortably inside it. Attribution
   is in the field hint, which the policy also asks for.

   Picking a result fills the GPS and Maps-link fields too. Those are already
   on the form and were being typed by hand, or more often left blank. */
const DL_ADDRESS_ENDPOINT = 'https://nominatim.openstreetmap.org/search';

function dlCloseSuggestions(input) {
  const list = input.parentElement.querySelector('.sl-suggest');
  if (list) { list.remove(); }
  input.removeAttribute('aria-expanded');
}

function dlFillRelated(form, input, place) {
  const set = function(attr, value) {
    const name = input.getAttribute(attr);
    if (!name || !value) { return; }
    const el = Array.prototype.find.call(
      form.querySelectorAll('[name="' + name + '"]'), function(e) { return !e.disabled; });
    /* Never overwrite something already typed. A filled field is somebody's
       work; a blank one is an offer of help. */
    if (el && !el.value.trim()) { el.value = value; }
  };
  set('data-dl-address-gps', place.lat && place.lon ? place.lat + ', ' + place.lon : '');
  set('data-dl-address-map', place.lat && place.lon
    ? 'https://www.google.com/maps/search/?api=1&query=' + place.lat + ',' + place.lon : '');
}

function dlRenderSuggestions(form, input, places) {
  dlCloseSuggestions(input);
  if (!places.length) { return; }
  const list = document.createElement('ul');
  list.className = 'sl-suggest';
  list.setAttribute('role', 'listbox');
  places.forEach(function(place) {
    const item = document.createElement('li');
    item.className = 'sl-suggest__item';
    item.setAttribute('role', 'option');
    item.textContent = place.display_name;
    item.addEventListener('mousedown', function(e) {
      /* mousedown, not click: blur fires first on a click and would close the
         list before the selection landed. */
      e.preventDefault();
      input.value = place.display_name;
      dlClearFieldError(input);
      dlFillRelated(form, input, place);
      dlCloseSuggestions(input);
    });
    list.appendChild(item);
  });
  input.parentElement.appendChild(list);
  input.setAttribute('aria-expanded', 'true');
}

function dlInitAddress(form) {
  form.querySelectorAll('[data-dl-address]').forEach(function(input) {
    let timer = null;
    let latest = 0;
    input.setAttribute('autocomplete', 'off');
    input.setAttribute('role', 'combobox');

    input.addEventListener('input', function() {
      if (timer) { clearTimeout(timer); }
      const query = input.value.trim();
      if (query.length < 3) { dlCloseSuggestions(input); return; }
      timer = setTimeout(async function() {
        const mine = ++latest;
        try {
          const url = DL_ADDRESS_ENDPOINT + '?format=jsonv2&countrycodes=za&limit=6&q=' +
            encodeURIComponent(query);
          const response = await fetch(url);
          const places = await response.json();
          /* An earlier, slower request must not overwrite a later one's
             results. Typing outruns the network constantly. */
          if (mine !== latest) { return; }
          dlRenderSuggestions(form, input, Array.isArray(places) ? places : []);
        } catch (err) {
          /* Lookup is a convenience. If it is down, the field is still a
             plain text box and the brief still sends. */
          console.warn('Address lookup unavailable:', err);
        }
      }, 600);
    });

    input.addEventListener('keydown', function(e) {
      const list = input.parentElement.querySelector('.sl-suggest');
      if (!list) { return; }
      const items = Array.prototype.slice.call(list.children);
      const current = items.findIndex(function(i) { return i.getAttribute('aria-selected') === 'true'; });
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const next = e.key === 'ArrowDown'
          ? Math.min(current + 1, items.length - 1)
          : Math.max(current - 1, 0);
        items.forEach(function(i) { i.removeAttribute('aria-selected'); });
        items[next].setAttribute('aria-selected', 'true');
        items[next].scrollIntoView({ block: 'nearest' });
      } else if (e.key === 'Enter' && current >= 0) {
        e.preventDefault();
        items[current].dispatchEvent(new MouseEvent('mousedown'));
      } else if (e.key === 'Escape') {
        dlCloseSuggestions(input);
      }
    });

    input.addEventListener('blur', function() { setTimeout(function() { dlCloseSuggestions(input); }, 150); });
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
/* Downscale before uploading.
   ------------------------------------------------------------------
   Not an optimisation. Photos are stored as rows in D1, which caps a single
   value at 2 MB, and a modern phone camera produces 8 to 12 MB. Without this
   step every real photo an installer takes would be refused.

   1600px on the long edge at quality 0.82 lands a distribution board around
   300 KB and is still legible enough to read a breaker label off, which is
   the whole job these photos have to do.

   Best effort, never fatal. A PDF passes straight through; a format the
   browser cannot decode (HEIC outside Safari, mainly) throws in
   createImageBitmap and the original is returned, where the size check gives
   the installer a clear refusal rather than this failing silently. A
   re-encode that somehow came out bigger is discarded too. */
/* What the browser says the file is, or what its name says when the browser
   says nothing.
   ------------------------------------------------------------------
   file.type is EMPTY surprisingly often — a HEIC straight off an iPhone is
   the common one, because a browser that cannot decode the format frequently
   declines to name it either. An empty type skipped compression AND failed
   the server's allow-list, so the photo was refused with "unsupported file
   type" for a perfectly ordinary iPhone picture. Falling back to the
   extension costs nothing and fixes that whole class. */
const DL_TYPE_BY_EXTENSION = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp',
  heic: 'image/heic', heif: 'image/heif', pdf: 'application/pdf',
};

function dlFileType(file) {
  if (file.type) { return file.type; }
  const ext = (file.name.split('.').pop() || '').toLowerCase();
  return DL_TYPE_BY_EXTENSION[ext] || '';
}

const DL_MAX_UPLOAD_BYTES = 1900000;

/* Why a file cannot be sent, in words the person holding the phone can act
   on. Returns null when it is fine. */
function dlFileProblem(file, compressedSize) {
  const type = dlFileType(file);
  if (!type) {
    return file.name + ': this file type is not supported. Use a JPEG, PNG or PDF.';
  }
  if (!DL_TYPE_BY_EXTENSION[(file.name.split('.').pop() || '').toLowerCase()] &&
      type.indexOf('image/') !== 0 && type !== 'application/pdf') {
    return file.name + ': this file type is not supported. Use a JPEG, PNG or PDF.';
  }
  if (compressedSize > DL_MAX_UPLOAD_BYTES) {
    if (type === 'image/heic' || type === 'image/heif') {
      /* The honest version of this failure. This browser cannot decode HEIC,
         so it cannot be shrunk here, and the original is over the limit.
         Telling them to change an iPhone setting is more use than "too
         large". */
      return file.name + ': iPhone HEIC photos cannot be resized in this browser. ' +
        'On the iPhone set Settings > Camera > Formats > Most Compatible, or share the photo as JPEG.';
    }
    return file.name + ': still too large after resizing (' +
      Math.round(compressedSize / 1024 / 1024 * 10) / 10 + ' MB). Please send a smaller photo.';
  }
  return null;
}

async function dlCompressImage(file, maxDim, quality) {
  const type = dlFileType(file);
  if (type.indexOf('image/') !== 0) { return file; }
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvas.getContext('2d').drawImage(bitmap, 0, 0, width, height);
    const blob = await new Promise(function(resolve) {
      canvas.toBlob(resolve, 'image/jpeg', quality);
    });
    bitmap.close();
    if (!blob || blob.size >= file.size) { return file; }
    /* Renamed to .jpg because that is now what it is. The extension is
       cosmetic here, since the stored type comes from the content type, but a
       listing showing "roof.heic" that opens as a JPEG is a small lie that
       costs someone ten minutes one day. */
    return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg' });
  } catch (err) {
    console.warn('Could not downscale ' + file.name + ', sending as is:', err);
    return file;
  }
}

async function dlUploadFile(endpoint, original, reference) {
  const file = await dlCompressImage(original, 1600, 0.82);
  const problem = dlFileProblem(file, file.size);
  /* Checked here as well as on the server so the reason is specific and
     local. The server's 413/415 are correct but arrive as a number. */
  if (problem) { const e = new Error(problem); e.dlFileProblem = true; throw e; }
  const headers = { 'Content-Type': dlFileType(file), 'X-File-Name': file.name };
  /* Names the photo after the job it belongs to, so it can be traced back to
     a brief. Optional on purpose: an upload must never fail because this
     field happened to be blank. */
  if (reference) { headers['X-Brief-Reference'] = reference; }
  const response = await fetch(endpoint, { method: 'POST', headers, body: file });
  const body = await response.json().catch(function() { return {}; });
  if (!response.ok || !body.url) {
    throw new Error('Upload of ' + original.name + ' failed: ' + (body.error || response.status));
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
  const refField = form.getAttribute('data-dl-upload-reference');
  const refEl = refField && form.querySelector('[name="' + refField + '"]');
  const reference = refEl ? refEl.value.trim() : '';
  const inputs = Array.prototype.filter.call(
    form.querySelectorAll('input[type="file"]'),
    function(input) { return !input.disabled && input.files && input.files.length; });
  if (!inputs.length) { return { values: values, extras: extras }; }

  let done = 0;
  const total = inputs.reduce(function(n, input) { return n + (input._dlReady || input.files).length; }, 0);
  for (const input of inputs) {
    const urls = [];
    /* Compressed already when the file was chosen; fall back to the raw list
       if that check has not run (a form built after load, say). */
    for (const file of (input._dlReady || input.files)) {
      dlUploadNote(form, 'Uploading photo ' + (done + 1) + ' of ' + total + '…');
      try {
        urls.push(await dlUploadFile(endpoint, file, reference));
      } catch (err) {
        /* Which field, so the submit handler can mark it and go there. An
           upload that fails anonymously is the bug this whole pass exists to
           fix. */
        err.dlControl = input;
        throw err;
      }
      done += 1;
    }
    values[input.name] = urls[0];
    for (let i = 1; i < urls.length; i++) { extras.push(urls[i]); }
  }
  dlUploadNote(form, total === 1 ? 'Photo uploaded.' : total + ' photos uploaded.');
  return { values: values, extras: extras };
}

function dlInitForm(form) {
  /* Turn the browser's own validation OFF, so ours runs.
     ------------------------------------------------------------------
     This is the reason a failing field showed nothing useful. With `required`
     on the controls, the browser validates first and never dispatches
     `submit`, so the handler below — and every message it produces — was dead
     code on any form that had a problem. What the browser showed instead was
     a transient native bubble that says "Please fill in this field", vanishes
     on the next click, cannot be styled, and on a long form does not say
     which field it means once it has gone.

     Setting novalidate here rather than in the markup so that every form on
     the site gets the same treatment, including ones built after load. The
     `required` attributes stay exactly where they are: dlValidate reads them,
     and they are still what tells a screen reader the field is mandatory. */
  form.setAttribute('novalidate', '');

  dlInitBranches(form);
  dlInitFileChecks(form);
  dlInitAddress(form);

  /* Clear a field's error the moment it is corrected, rather than leaving it
     red until the next submit. A form that keeps shouting after you have
     fixed the thing teaches people to ignore it. */
  form.addEventListener('input', function(e) {
    if (e.target.getAttribute('aria-invalid') === 'true') { dlClearFieldError(e.target); }
  });
  form.addEventListener('change', function(e) {
    if (e.target.getAttribute('aria-invalid') === 'true') { dlClearFieldError(e.target); }
  });

  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    const honeypot = form.querySelector('[name="website"]');
    if (honeypot && honeypot.value) {
      return;
    }
    if (!dlValidate(form)) { return; }
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
      const note = form.querySelector('[data-dl-upload-status]');
      if (note) { note.remove(); }
      if (err.dlControl) {
        /* A named file, a named reason, and the page scrolled to the field
           that holds it. */
        dlFailField(err.dlControl, err.message);
      } else {
        dlFormError(form);
      }
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
