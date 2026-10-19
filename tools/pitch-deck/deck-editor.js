/* ============================================================
   SUNLOGIC DECK EDITOR
   The panel. It knows nothing about how a deck looks: it edits a
   model and hands it to deck-render.js, which is why a change to
   the house style happens in one file and every deck follows.

   The page you are looking at IS the deck. The editor is a panel
   over it, and editing is per slide, behind a pencil, one open at
   a time, so the rest of the page stays a deck and nothing is
   changed by a stray click. doc-builder works this way for the
   same reason.

   Copy is autosaved under a storage key, and Save file / Open file
   / Export are there because copy that exists only in one
   browser's site data is copy that can be cleared away.
   ============================================================ */
(function () {
  'use strict';

  var VERSION = '1.0';
  var D = function () { return window.SLDeck; };

  /* ---------------------------------------------------- field schema

     What the panel shows for each slide type. Adding a slide type
     means adding a renderer in deck-render.js and an entry here.
     Nothing else in the tool needs to know about it.

     kinds: text | area | check | num | icon | rows                  */

  var HEAD = [['eyebrow', 'text', 'Eyebrow'], ['h', 'text', 'Heading'],
              ['em', 'text', 'Heading, orange part'], ['lead', 'area', 'Standfirst']];

  var FIELDS = {
    cover: { label: 'Cover', head: HEAD,
      list: { key: 'kv', label: 'Facts, four at most', kind: 'object',
        cols: [['k', 'text', 'Label'], ['v', 'text', 'Value']] } },

    statement: { label: 'Statement band',
      head: [['eyebrow', 'text', 'Eyebrow'], ['text', 'area', 'Statement'],
             ['em', 'area', 'Statement, orange part'], ['body', 'area', 'Supporting line']] },

    cards: { label: 'Cards', head: HEAD.concat([['cols', 'num', 'Columns, 2 or 3']]),
      list: { key: 'items', label: 'Cards', kind: 'object',
        cols: [['icon', 'icon', 'Icon'], ['title', 'text', 'Title'], ['body', 'area', 'Body']] } },

    kv: { label: 'Label and paragraph', head: HEAD,
      list: { key: 'items', label: 'Pairs', kind: 'object',
        cols: [['k', 'text', 'Label'], ['v', 'area', 'Body']] } },

    bullets: { label: 'Bullets', head: HEAD.concat([['cols', 'num', 'Columns, 1 or 2']]),
      list: { key: 'items', label: 'Lines', kind: 'string', field: 'area' } },

    metrics: { label: 'Big numbers', head: HEAD,
      list: { key: 'items', label: 'Figures, four at most', kind: 'object',
        cols: [['v', 'text', 'Figure'], ['k', 'text', 'What it measures'], ['note', 'text', 'Basis of the figure']] } },

    quote: { label: 'Quote',
      head: [['text', 'area', 'Quote'], ['cite', 'text', 'Name'], ['role', 'text', 'Role, company']] },

    timeline: { label: 'Timeline', head: HEAD,
      list: { key: 'items', label: 'Steps', kind: 'object',
        cols: [['when', 'text', 'When'], ['title', 'text', 'Title'], ['body', 'area', 'Body']] } },

    /* A table is edited as text, a row to a line, cells divided by a
       pipe. A grid of inputs is a worse way to retype a price list. */
    table: { label: 'Table', head: HEAD.concat([['note', 'area', 'Note under the table']]),
      rows: true },

    cta: { label: 'Call to action', head: HEAD,
      list: { key: 'actions', label: 'Actions, two at most', kind: 'object',
        cols: [['label', 'text', 'Label'], ['sub', 'text', 'What happens next']] } },

    contact: { label: 'Contact', head: HEAD }
  };

  var META = [['title', 'text', 'Deck title'], ['subtitle', 'text', 'Subtitle'],
              ['ref', 'text', 'Reference'], ['date', 'text', 'Date'],
              ['client', 'text', 'Prepared for'], ['footNote', 'text', 'Footer note'],
              ['pdfName', 'text', 'PDF file name']];

  var COMPANY = [['name', 'text', 'Name'], ['regName', 'text', 'Registered name'],
              ['reg', 'text', 'Registration'], ['vat', 'text', 'VAT'],
              ['address', 'text', 'Address'], ['email', 'text', 'Email'],
              ['phone', 'text', 'Phone'], ['website', 'text', 'Website'],
              ['contactName', 'text', 'Contact name'], ['contactRole', 'text', 'Contact role'],
              ['contactEmail', 'text', 'Contact email'], ['contactPhone', 'text', 'Contact phone']];

  var SECTION = [['n', 'text', 'Section name, as the picker shows it'],
                 ['d', 'area', 'What it is, as the picker shows it'],
                 ['onePager', 'check', 'Include in the one-pager']];

  /* ---------------------------------------------------------- helpers */

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function el(html) { var d = document.createElement('div'); d.innerHTML = html; return d.firstElementChild; }
  function arr(a) { return Array.isArray(a) ? a : []; }

  function setPath(obj, path, value) {
    var parts = path.split('.'), last = parts.pop(), o = obj;
    parts.forEach(function (k) {
      var i = /^\d+$/.test(k) ? Number(k) : k;
      if (o[i] == null) o[i] = /^\d+$/.test(parts[parts.indexOf(k) + 1] || last) ? [] : {};
      o = o[i];
    });
    o[/^\d+$/.test(last) ? Number(last) : last] = value;
  }
  function getPath(obj, path) {
    return path.split('.').reduce(function (o, k) { return o == null ? o : o[k]; }, obj);
  }

  /* --------------------------------------------------------- the CSS
     The panel's own, kept apart from the deck's, because none of it
     belongs in a printed or exported deck. */

  var CSS = [
'.sl-d-edit{position:fixed;inset:0 auto 0 0;z-index:60;width:min(430px,92vw);',
' background:#fff;border-right:1px solid var(--border-hairline);display:flex;',
' flex-direction:column;box-shadow:12px 0 40px -28px rgba(13,32,40,.5);',
' font-family:var(--font-body);font-size:14px;transform:translateX(-101%);',
' transition:transform .22s cubic-bezier(.16,1.08,.38,.98)}',
'.sl-d-edit[data-open="1"]{transform:none}',
'.sl-d-edit__bar{display:flex;flex-wrap:wrap;gap:6px;align-items:center;padding:10px 12px;',
' border-bottom:1px solid var(--border-hairline);background:var(--surface-page)}',
'.sl-d-edit__bar .sl-mark{height:20px;margin-right:auto}',
'.sl-d-edit__v{font-family:var(--font-mono);font-size:10px;color:var(--color-grey);letter-spacing:.08em}',
'.sl-d-edit__body{flex:1 1 auto;overflow:auto;padding:10px 12px 40px}',
'.sl-d-row{display:flex;align-items:center;gap:8px;padding:7px 0;',
' border-bottom:1px solid var(--border-hairline)}',
'.sl-d-row--sec{margin-top:14px;border-bottom:2px solid var(--color-navy)}',
'.sl-d-row b{flex:1 1 auto;font-weight:600;font-size:13px}',
'.sl-d-row--sec b{font-family:var(--font-mono);font-size:11px;letter-spacing:.1em;text-transform:uppercase}',
'.sl-d-row em{font-style:normal;font-family:var(--font-mono);font-size:10px;color:var(--color-grey)}',
'.sl-d-row button{font:inherit;font-size:12px;padding:3px 7px;border-radius:4px;cursor:pointer;',
' border:1px solid var(--border-hairline);background:#fff;color:var(--text-primary)}',
'.sl-d-row button:hover{border-color:var(--color-orange)}',
'.sl-d-form{padding:10px 0 16px}',
'.sl-d-f{display:block;margin-bottom:10px}',
'.sl-d-f span{display:block;margin-bottom:3px;font-family:var(--font-mono);font-size:10px;',
' letter-spacing:.08em;text-transform:uppercase;color:var(--color-grey-strong)}',
'.sl-d-f input[type=text],.sl-d-f input[type=number],.sl-d-f textarea,.sl-d-f select{',
' width:100%;font:inherit;font-size:13px;padding:6px 8px;border-radius:4px;',
' border:1px solid var(--border-warm);background:#fff;color:var(--text-primary)}',
'.sl-d-f textarea{min-height:62px;resize:vertical;line-height:1.45}',
'.sl-d-f--check{display:flex;gap:8px;align-items:center}',
'.sl-d-f--check span{margin:0;text-transform:none;letter-spacing:0;font-family:var(--font-body);font-size:13px}',
'.sl-d-sub{border-left:2px solid var(--color-orange);padding:8px 0 8px 10px;margin:0 0 10px}',
'.sl-d-sub h4{margin:0 0 6px;font-family:var(--font-mono);font-size:10px;letter-spacing:.1em;',
' text-transform:uppercase;color:var(--color-orange-text)}',
'.sl-d-opener{position:fixed;left:14px;bottom:14px;z-index:55}',
'.sl-d-note{margin:8px 0 0;font-size:12px;color:var(--text-secondary)}',
'.sl-d-out{white-space:pre-wrap;font-family:var(--font-mono);font-size:11px;line-height:1.5;',
' background:var(--surface-sunk);border-radius:6px;padding:10px;margin:10px 0 0}',

/* the picker */
'.sl-d-back{position:fixed;inset:0;z-index:70;background:rgba(13,32,40,.5);display:none}',
'.sl-d-back[data-open="1"]{display:block}',
'.sl-d-pick{position:fixed;z-index:71;inset:auto 0 0 0;margin:0 auto;max-width:620px;',
' background:#fff;border-radius:16px 16px 0 0;max-height:86vh;display:none;',
' flex-direction:column;font-family:var(--font-body)}',
'.sl-d-pick[data-open="1"]{display:flex}',
'@media(min-width:720px){.sl-d-pick{inset:50% 0 auto;transform:translateY(-50%);',
' border-radius:16px;max-height:84vh}}',
'.sl-d-pick__head{display:flex;gap:12px;align-items:flex-start;padding:16px 18px 12px;',
' border-bottom:1px solid var(--border-hairline)}',
'.sl-d-pick__head h3{margin:0;font-family:var(--font-display);font-size:18px;font-weight:800}',
'.sl-d-pick__head p{margin:3px 0 0;font-size:13px;color:var(--text-secondary)}',
'.sl-d-pick__body{flex:1 1 auto;overflow:auto;padding:12px 18px}',
'.sl-d-ps{display:flex;gap:10px;align-items:flex-start;padding:9px 0;',
' border-bottom:1px solid var(--border-hairline);cursor:pointer}',
'.sl-d-ps b{display:block;font-size:14px;font-weight:600}',
'.sl-d-ps em{display:block;font-style:normal;font-size:12px;color:var(--text-secondary)}',
'.sl-d-psub{margin:0 0 6px 28px}',
'.sl-d-psub summary{font-family:var(--font-mono);font-size:11px;letter-spacing:.06em;',
' color:var(--color-orange-text);cursor:pointer;padding:4px 0}',
'.sl-d-psub label{display:flex;gap:7px;align-items:center;font-size:12px;padding:3px 0}',
'.sl-d-pwrap[data-off="1"]{opacity:.42}',
'.sl-d-pick__bar{display:flex;gap:8px;align-items:center;padding:12px 18px;',
' border-top:1px solid var(--border-hairline);flex-wrap:wrap}',
'.sl-d-pick__bar .sl-d-gap{flex:1 1 auto}',
'.sl-d-link{font:inherit;font-size:12px;background:none;border:0;cursor:pointer;',
' color:var(--color-orange-text);text-decoration:underline;padding:4px}',
'.sl-d-st{font-family:var(--font-mono);font-size:11px;color:var(--text-secondary)}'
  ].join('\n');

  function injectCss() {
    if (document.getElementById('sl-deck-edit-css')) return;
    var s = document.createElement('style');
    s.id = 'sl-deck-edit-css';
    s.textContent = D().fontsCss() + D().tokensCss()
      + (window.SL_DECK_CSS.core || '') + (window.SL_DECK_CSS.screen || '') + CSS;
    document.head.appendChild(s);
  }

  /* ------------------------------------------------------- the element */

  var Deck = function () { return Reflect.construct(HTMLElement, [], Deck); };
  Deck.prototype = Object.create(HTMLElement.prototype);
  Deck.prototype.constructor = Deck;
  Object.setPrototypeOf(Deck, HTMLElement);

  Deck.prototype.connectedCallback = function () {
    if (this.ready) return;
    this.ready = true;
    this.key = this.getAttribute('storage-key') || 'sl-deck-current';
    /* `view` is the hosted deck: the reader gets the deck and the download
       picker, and none of the editor. It is one attribute rather than a
       second page, so a shared deck cannot drift from the one you edit. */
    this.view = this.hasAttribute('view');
    this.open = null;                 /* which row's form is showing */
    this.load();
    injectCss();
    this.buildChrome();
    this.draw();
  };

  Deck.prototype.load = function () {
    var fresh = clone(window.SL_DECK_TEMPLATE);
    /* A reader gets the deck as published. Picking up whatever happens to
       be in their browser would be somebody else's draft. */
    if (this.view) { this.model = fresh; return; }
    try {
      var s = localStorage.getItem(this.key);
      var m = s ? JSON.parse(s) : null;
      /* A model from an older version of the template is still the
         author's copy, so it is kept and not replaced. */
      this.model = (m && arr(m.sections).length) ? m : fresh;
    } catch (e) { this.model = fresh; }
  };

  Deck.prototype.save = function () {
    if (this.view) return;
    try { localStorage.setItem(this.key, JSON.stringify(this.model)); } catch (e) {}
  };

  Deck.prototype.buildChrome = function () {
    var self = this;
    var mark = (window.SL_DECK_BRAND || {}).mark || '';

    this.deck = el('<main class="sl-d-host"></main>');
    this.panel = el('<aside class="sl-d-edit" aria-label="Edit the deck">'
      + '<div class="sl-d-edit__bar">' + mark
      + '<span class="sl-d-edit__v">v' + VERSION + '/' + D().version + '</span>'
      + '<button class="sl-d-btn" data-a="close">Close</button>'
      + '</div>'
      + '<div class="sl-d-edit__bar">'
      + '<button class="sl-d-btn" data-a="save">Save file</button>'
      + '<button class="sl-d-btn" data-a="open">Open file</button>'
      + '<button class="sl-d-btn" data-a="export">Export</button>'
      + '<button class="sl-d-btn" data-a="check">Check</button>'
      + '<button class="sl-d-btn" data-a="reset">Reset</button>'
      + '</div>'
      + '<div class="sl-d-edit__body"></div></aside>');
    this.body = this.panel.querySelector('.sl-d-edit__body');

    this.opener = el('<button class="sl-d-btn sl-d-btn--go sl-d-opener" data-a="opener">Edit copy</button>');
    this.file = el('<input type="file" accept="application/json,.json" hidden>');

    this.back = el('<div class="sl-d-back"></div>');
    this.pick = el('<div class="sl-d-pick" role="dialog" aria-modal="true" aria-label="What goes in the PDF"></div>');

    if (this.view) {
      /* The deck, the bar and the picker. No panel, no opener, no file
         input: there is nothing here for a reader to edit. */
      this.append(this.deck, this.back, this.pick);
    } else {
      this.append(this.deck, this.panel, this.opener, this.file, this.back, this.pick);
      this.opener.addEventListener('click', function () { self.setOpen(true); });
    }
    if (!this.view) {
      this.panel.addEventListener('click', function (e) {
        var b = e.target.closest('[data-a]');
        if (b) { e.preventDefault(); self.act(b.getAttribute('data-a'), b); }
      });
      this.panel.addEventListener('input', function (e) { self.field(e.target, false); });
      this.panel.addEventListener('change', function (e) {
        if (e.target.matches('select,[type=checkbox],[type=number]')) self.field(e.target, true);
      });
      this.file.addEventListener('change', function () { self.readFile(); });
    }
    this.back.addEventListener('click', function () { self.closePicker(); });
    this.pick.addEventListener('click', function (e) {
      var b = e.target.closest('[data-p]');
      if (b) { e.preventDefault(); self.pickAct(b.getAttribute('data-p')); }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { self.closePicker(); }
    });
  };

  Deck.prototype.setOpen = function (v) {
    this.panel.setAttribute('data-open', v ? '1' : '0');
    this.opener.hidden = !!v;
  };

  /* ----------------------------------------------------------- drawing */

  Deck.prototype.draw = function () {
    this.redrawDeck();
    if (!this.view) { this.drawPanel(); this.save(); }
  };

  Deck.prototype.redrawDeck = function () {
    this.deck.innerHTML = this.bar() + D().deckHtml(this.model, null);
    var self = this;
    var dl = this.deck.querySelector('[data-a="download"]');
    if (dl) dl.addEventListener('click', function () { self.openPicker(); });
  };

  Deck.prototype.bar = function () {
    var m = this.model, meta = m.meta || {};
    var n = arr(m.sections).reduce(function (t, s) { return t + arr(s.slides).length; }, 0);
    return '<div class="sl-d-bar">' + ((window.SL_DECK_BRAND || {}).mark || '')
      + '<span class="sl-d-count">' + esc(meta.client || meta.subtitle || '') + '</span>'
      + '<span class="sl-d-bar__gap"></span>'
      + '<span class="sl-d-count">' + n + ' slides</span>'
      + '<button class="sl-d-btn sl-d-btn--go" data-a="download">Download PDF</button></div>';
  };

  Deck.prototype.drawPanel = function () {
    var self = this, m = this.model, out = [];
    out.push(this.rowHtml('meta', 'Deck details', 'meta'));
    out.push(this.rowHtml('company', 'Company and contact', 'company'));

    arr(m.sections).forEach(function (sec, si) {
      out.push('<div class="sl-d-row sl-d-row--sec"><b>' + esc(sec.n || sec.k) + '</b>'
        + '<em>' + esc(sec.k) + '</em>'
        + '<button data-a="editsec" data-i="' + si + '" title="Edit the section">Edit</button>'
        + '<button data-a="secup" data-i="' + si + '" title="Move up">&uarr;</button>'
        + '<button data-a="secdown" data-i="' + si + '" title="Move down">&darr;</button>'
        + '<button data-a="secdel" data-i="' + si + '" title="Delete the section">&times;</button></div>');
      if (self.open === 'sec' + si) out.push(self.form());

      arr(sec.slides).forEach(function (s, i) {
        out.push('<div class="sl-d-row"><b>' + esc((FIELDS[s.type] || {}).label || s.type) + '</b>'
          + '<button data-a="edit" data-i="' + si + '.' + i + '">Edit</button>'
          + '<button data-a="up" data-i="' + si + '.' + i + '">&uarr;</button>'
          + '<button data-a="down" data-i="' + si + '.' + i + '">&darr;</button>'
          + '<button data-a="del" data-i="' + si + '.' + i + '">&times;</button></div>');
        if (self.open === si + '.' + i) out.push(self.form());
      });

      out.push('<div class="sl-d-row"><em>Add a slide here</em>'
        + '<select data-a="addsel" data-i="' + si + '">'
        + Object.keys(FIELDS).map(function (k) {
            return '<option value="' + k + '">' + esc(FIELDS[k].label) + '</option>';
          }).join('') + '</select>'
        + '<button data-a="add" data-i="' + si + '">Add</button></div>');
    });

    out.push('<div class="sl-d-row sl-d-row--sec"><b>Add a section</b>'
      + '<button data-a="addsec">Add</button></div>');
    out.push('<p class="sl-d-note">Autosaved in this browser. Save file keeps a copy you can open anywhere.</p>');
    this.body.innerHTML = out.join('');
    if (this.lastOut) this.body.insertAdjacentHTML('beforeend', '<pre class="sl-d-out">' + esc(this.lastOut) + '</pre>');
  };

  Deck.prototype.rowHtml = function (id, label, kind) {
    return '<div class="sl-d-row"><b>' + esc(label) + '</b>'
      + '<button data-a="edit" data-i="' + id + '">Edit</button></div>'
      + (this.open === id ? this.form() : '');
  };

  function input(kind, path, value, label) {
    var p = esc(path), v = value == null ? '' : value;
    if (kind === 'check')
      return '<label class="sl-d-f sl-d-f--check"><input type="checkbox" data-p="' + p + '"'
        + (v ? ' checked' : '') + '><span>' + esc(label) + '</span></label>';
    if (kind === 'area')
      return '<label class="sl-d-f"><span>' + esc(label) + '</span>'
        + '<textarea data-p="' + p + '">' + esc(v) + '</textarea></label>';
    if (kind === 'num')
      return '<label class="sl-d-f"><span>' + esc(label) + '</span>'
        + '<input type="number" data-p="' + p + '" value="' + esc(v) + '"></label>';
    if (kind === 'icon') {
      var set = Object.keys((((window.SL_DECK_ASSETS || window.SL_DOC_ASSETS) || {}).icons) || {});
      return '<label class="sl-d-f"><span>' + esc(label) + '</span><select data-p="' + p + '">'
        + set.map(function (n) {
            return '<option value="' + n + '"' + (n === v ? ' selected' : '') + '>' + n + '</option>';
          }).join('') + '</select></label>';
    }
    return '<label class="sl-d-f"><span>' + esc(label) + '</span>'
      + '<input type="text" data-p="' + p + '" value="' + esc(v) + '"></label>';
  }

  Deck.prototype.form = function () {
    var m = this.model, id = this.open, html = '';

    if (id === 'meta')
      html = META.map(function (f) { return input(f[1], 'meta.' + f[0], (m.meta || {})[f[0]], f[2]); }).join('');

    else if (id === 'company')
      html = COMPANY.map(function (f) { return input(f[1], 'company.' + f[0], (m.company || {})[f[0]], f[2]); }).join('');

    else if (id.indexOf('sec') === 0) {
      var si = Number(id.slice(3)), sec = m.sections[si];
      html = SECTION.map(function (f) {
        return input(f[1], 'sections.' + si + '.' + f[0], sec[f[0]], f[2]);
      }).join('')
      + input('text', 'sections.' + si + '.k', sec.k, 'Key, used by the picker and by --only');
    }

    else {
      var parts = id.split('.'), x = Number(parts[0]), y = Number(parts[1]);
      var s = m.sections[x].slides[y];
      var spec = FIELDS[s.type] || { head: [] };
      var base = 'sections.' + x + '.slides.' + y + '.';

      html = (spec.head || []).map(function (f) {
        return input(f[1], base + f[0], s[f[0]], f[2]);
      }).join('');

      if (spec.rows) {
        html += '<div class="sl-d-sub"><h4>The table</h4>'
          + input('text', base + '_head', arr(s.head).join(' | '), 'Header cells, divided by |')
          + input('area', base + '_rows', arr(s.rows).map(function (r) { return arr(r).join(' | '); }).join('\n'),
                  'Rows, one to a line, cells divided by |')
          + '</div>';
      }

      var L = spec.list;
      if (L) {
        html += '<div class="sl-d-sub"><h4>' + esc(L.label) + '</h4>';
        arr(s[L.key]).forEach(function (it, n) {
          if (L.kind === 'string') {
            html += input(L.field || 'text', base + L.key + '.' + n, it, 'Line ' + (n + 1));
          } else {
            L.cols.forEach(function (c) {
              html += input(c[1], base + L.key + '.' + n + '.' + c[0], it[c[0]], c[2] + ' ' + (n + 1));
            });
          }
          html += '<div class="sl-d-row"><em>' + (n + 1) + '</em>'
            + '<button data-a="itemdel" data-i="' + id + '.' + L.key + '.' + n + '">Remove</button></div>';
        });
        html += '<div class="sl-d-row"><em>Add</em>'
          + '<button data-a="itemadd" data-i="' + id + '.' + L.key + '">Add one</button></div></div>';
      }
    }

    return '<div class="sl-d-form">' + html + '</div>';
  };

  /* ----------------------------------------------------------- editing */

  Deck.prototype.field = function (t, structural) {
    var path = t.getAttribute('data-p');
    if (!path) return;
    var v = t.type === 'checkbox' ? t.checked
          : t.type === 'number'   ? Number(t.value)
          : t.value;

    /* The two synthetic fields: a table edited as text. */
    if (/\._head$/.test(path) || /\._rows$/.test(path)) {
      var at = path.replace(/\._(head|rows)$/, '');
      if (/_head$/.test(path)) setPath(this.model, at + '.head', String(v).split('|').map(function (c) { return c.trim(); }));
      else setPath(this.model, at + '.rows', String(v).split('\n').filter(function (l) { return l.trim() !== ''; })
             .map(function (l) { return l.split('|').map(function (c) { return c.trim(); }); }));
    } else {
      setPath(this.model, path, v);
    }

    this.redrawDeck();
    this.save();
    if (structural) this.drawPanel();
  };

  function blank(type) {
    var spec = FIELDS[type] || {};
    var s = { type: type };
    (spec.head || []).forEach(function (f) { s[f[0]] = f[1] === 'check' ? false : ''; });
    if (spec.rows) { s.head = ['', '', '']; s.rows = [['', '', '']]; }
    if (spec.list) s[spec.list.key] = [blankItem(spec.list)];
    return s;
  }
  function blankItem(L) {
    if (L.kind === 'string') return '';
    var o = {};
    L.cols.forEach(function (c) { o[c[0]] = ''; });
    return o;
  }

  Deck.prototype.act = function (a, btn) {
    var m = this.model, i = btn && btn.getAttribute('data-i');

    if (a === 'opener') return this.setOpen(true);
    if (a === 'close')  return this.setOpen(false);

    if (a === 'edit')    { this.open = (this.open === i) ? null : i; return this.drawPanel(); }
    if (a === 'editsec') { var k = 'sec' + i; this.open = (this.open === k) ? null : k; return this.drawPanel(); }

    if (a === 'up' || a === 'down' || a === 'del') {
      var p = i.split('.'), si = Number(p[0]), n = Number(p[1]);
      var list = m.sections[si].slides;
      if (a === 'del') list.splice(n, 1);
      else {
        var to = a === 'up' ? n - 1 : n + 1;
        if (to < 0 || to >= list.length) return;
        list.splice(to, 0, list.splice(n, 1)[0]);
      }
      this.open = null; return this.draw();
    }

    if (a === 'secup' || a === 'secdown' || a === 'secdel') {
      var x = Number(i);
      if (a === 'secdel') {
        if (!confirm('Delete the whole "' + (m.sections[x].n || m.sections[x].k) + '" section?')) return;
        m.sections.splice(x, 1);
      } else {
        var t2 = a === 'secup' ? x - 1 : x + 1;
        if (t2 < 0 || t2 >= m.sections.length) return;
        m.sections.splice(t2, 0, m.sections.splice(x, 1)[0]);
      }
      this.open = null; return this.draw();
    }

    if (a === 'add') {
      var sel = this.body.querySelector('select[data-a="addsel"][data-i="' + i + '"]');
      m.sections[Number(i)].slides.push(blank(sel ? sel.value : 'cards'));
      this.open = i + '.' + (m.sections[Number(i)].slides.length - 1);
      return this.draw();
    }

    if (a === 'addsec') {
      /* A key has to be unique, because it is what the picker and
         --only name. Numbered rather than guessed from the name. */
      var keys = m.sections.map(function (s) { return s.k; });
      var n2 = m.sections.length + 1, key = 'section' + n2;
      while (keys.indexOf(key) > -1) key = 'section' + (++n2);
      m.sections.push({ k: key, n: 'New section', d: 'What it is, as the picker shows it.',
                        onePager: false, slides: [blank('cards')] });
      this.open = 'sec' + (m.sections.length - 1);
      return this.draw();
    }

    if (a === 'itemadd' || a === 'itemdel') {
      var bits = i.split('.');
      var isSec = bits[0] === 'sec';
      if (isSec) return;
      var sx = Number(bits[0]), sy = Number(bits[1]), key = bits[2], idx = Number(bits[3]);
      var slide = m.sections[sx].slides[sy];
      var L = (FIELDS[slide.type] || {}).list;
      if (!L) return;
      if (!Array.isArray(slide[key])) slide[key] = [];
      if (a === 'itemadd') slide[key].push(blankItem(L));
      else slide[key].splice(idx, 1);
      return this.draw();
    }

    if (a === 'save')   return this.download(JSON.stringify(this.model, null, 1),
                          (this.model.meta.pdfName || 'deck') + '.json', 'application/json');
    if (a === 'export') return this.download(D().standalone(this.model, null),
                          (this.model.meta.pdfName || 'deck') + '.html', 'text/html');
    if (a === 'open')   return this.file.click();
    if (a === 'check')  return this.check();
    if (a === 'reset') {
      if (!confirm('Throw away this copy and start from the standard deck?')) return;
      this.model = clone(window.SL_DECK_TEMPLATE);
      this.open = null; this.lastOut = ''; return this.draw();
    }
  };

  Deck.prototype.download = function (text, name, mime) {
    var a = document.createElement('a');
    var blob = new Blob([text], { type: mime });
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 400);
  };

  Deck.prototype.readFile = function () {
    var self = this, f = this.file.files && this.file.files[0];
    if (!f) return;
    var r = new FileReader();
    r.onload = function () {
      try {
        var m = JSON.parse(r.result);
        if (!arr(m.sections).length) throw new Error('no sections in that file');
        self.model = m; self.open = null; self.lastOut = ''; self.draw();
      } catch (e) { self.lastOut = 'Could not open that file.\n' + e.message; self.drawPanel(); }
    };
    r.readAsText(f);
    this.file.value = '';
  };

  Deck.prototype.check = function () {
    var fails = D().checkModel(this.model);
    this.lastOut = fails.length
      ? fails.map(function (x) { return x.rule + '  ' + x.where + '\n    ' + x.detail; }).join('\n')
      : 'Nothing to report. Band rhythm, ceilings and heading case all hold.';
    this.drawPanel();
  };

  /* ------------------------------------------------------- the picker

     The whole deck is fourteen pages and most of the time one part of
     it is what the reader asked for, so the button asks first. The keys
     come from the model's own sections and go straight to the renderer,
     which does the gating. No layout lives here, and make-pdf.py --only
     takes the same keys.                                             */

  Deck.prototype.openPicker = function () {
    var secs = arr(this.model.sections);
    this.pick.innerHTML = '<div class="sl-d-pick__head"><div>'
      + '<h3>What goes in the PDF?</h3>'
      + '<p>All of it runs to ' + secs.reduce(function (t, s) { return t + arr(s.slides).length; }, 0)
      + ' slides, so take only the parts they asked for.</p></div>'
      + '<button class="sl-d-btn" data-p="close" aria-label="Close">&times;</button></div>'
      + '<div class="sl-d-pick__body">'
      + secs.map(function (sec, i) {
          var multi = arr(sec.slides).length > 1;
          return '<div class="sl-d-pwrap" id="pw-' + i + '">'
            + '<label class="sl-d-ps"><input type="checkbox" data-sec="' + i + '" checked>'
            + '<span><b>' + esc(sec.n || sec.k) + '</b><em>' + esc(sec.d || '') + '</em></span></label>'
            + (multi ? '<details class="sl-d-psub"><summary>Choose which slides &middot; '
                + '<span id="pc-' + i + '"></span></summary>'
                + arr(sec.slides).map(function (s, n) {
                    return '<label><input type="checkbox" data-kid="' + i + '" value="' + n + '" checked>'
                      + '<span>' + esc((FIELDS[s.type] || {}).label || s.type)
                      + (s.h ? ' &middot; ' + esc(String(s.h).slice(0, 34)) : '') + '</span></label>';
                  }).join('')
                + '</details>' : '')
            + '</div>';
        }).join('')
      + '<label class="sl-d-ps"><input type="checkbox" id="pone">'
      + '<span><b>As a one-pager</b><em>A4 portrait and condensed, instead of one slide a page. '
      + 'Uses the sections marked for it.</em></span></label>'
      + '</div>'
      + '<div class="sl-d-pick__bar">'
      + '<button class="sl-d-link" data-p="all">Select all</button>'
      + '<button class="sl-d-link" data-p="none">Clear</button>'
      + '<span class="sl-d-gap"></span><span class="sl-d-st" id="pst"></span>'
      + '<button class="sl-d-btn sl-d-btn--go" data-p="go" id="pgo">Create the PDF</button></div>'
      /* On the hosted deck there is no render server, so the browser's own
         print engine does it. Say so before the dialog appears rather than
         letting it arrive unannounced. */
      + (this.view ? '<p class="sl-d-note" style="padding:0 18px 14px;margin:0">'
          + 'Your browser&rsquo;s print dialog opens next. Choose <b>Save as PDF</b> '
          + 'as the destination.</p>' : '');

    var self = this;
    this.pick.querySelectorAll('[data-sec],[data-kid],#pone').forEach(function (b) {
      b.addEventListener('change', function () {
        /* Ticking a section back on brings its slides with it, or the
           section would come back empty and print nothing. */
        if (b.hasAttribute('data-sec') && b.checked) {
          var kids = self.kids(b.getAttribute('data-sec'));
          if (kids.length && !kids.some(function (k) { return k.checked; }))
            kids.forEach(function (k) { k.checked = true; });
        }
        self.pickSync();
      });
    });
    this.pick.setAttribute('data-open', '1');
    this.back.setAttribute('data-open', '1');
    this.pickSync();
  };

  Deck.prototype.kids = function (i) {
    return Array.prototype.slice.call(this.pick.querySelectorAll('[data-kid="' + i + '"]'));
  };

  Deck.prototype.closePicker = function () {
    this.pick.setAttribute('data-open', '0');
    this.back.setAttribute('data-open', '0');
  };

  /* A section counts as live when it is ticked and something under it
     is too. Without this the PDF carries a heading and nothing else. */
  Deck.prototype.live = function () {
    var self = this, out = [];
    arr(this.model.sections).forEach(function (sec, i) {
      var box = self.pick.querySelector('[data-sec="' + i + '"]');
      if (!box || !box.checked) return;
      var kids = self.kids(i);
      var picked = kids.length
        ? kids.filter(function (k) { return k.checked; }).map(function (k) { return Number(k.value); })
        : null;
      if (kids.length && !picked.length) return;
      out.push({ k: sec.k, slides: picked });
    });
    return out;
  };

  Deck.prototype.pickSync = function () {
    var self = this;
    arr(this.model.sections).forEach(function (sec, i) {
      var kids = self.kids(i);
      if (!kids.length) return;
      var on = kids.filter(function (k) { return k.checked; }).length;
      var c = self.pick.querySelector('#pc-' + i);
      if (c) c.textContent = on === kids.length ? 'all ' + kids.length : on ? on + ' of ' + kids.length : 'none';
      var box = self.pick.querySelector('[data-sec="' + i + '"]');
      var w = self.pick.querySelector('#pw-' + i);
      if (w) w.setAttribute('data-off', box && box.checked ? '0' : '1');
    });
    var n = this.live().length;
    var go = this.pick.querySelector('#pgo');
    go.disabled = n === 0;
    go.textContent = n === 0 ? 'Pick at least one' : 'Create the PDF';
  };

  Deck.prototype.pickAct = function (a) {
    var self = this;
    if (a === 'close') return this.closePicker();
    if (a === 'all' || a === 'none') {
      var v = a === 'all';
      this.pick.querySelectorAll('[data-sec],[data-kid]').forEach(function (b) { b.checked = v; });
      return this.pickSync();
    }
    if (a === 'go') return this.makePdf();
  };

  Deck.prototype.opts = function () {
    var live = this.live(), slides = {};
    live.forEach(function (s) { if (s.slides) slides[s.k] = s.slides; });
    return {
      only: live.map(function (s) { return s.k; }),
      slides: slides,
      onePager: !!this.pick.querySelector('#pone').checked
    };
  };

  Deck.prototype.st = function (text) {
    var s = this.pick.querySelector('#pst');
    if (s) s.textContent = text || '';
  };

  /* WeasyPrint cannot run in a browser: the LearnIQ planner proved that
     at length, and no amount of self-hosting fixes it. So the exact PDF
     comes from serve.py, and with no server the browser's own print
     engine is the fall back, which still produces a PDF through Save as
     PDF and is the only thing that works from an attachment. */
  Deck.prototype.makePdf = function () {
    var self = this, opts = this.opts();
    var name = (this.model.meta.pdfName || 'Sunlogic-Pitch')
      + (opts.onePager ? '-one-pager' : '')
      + (opts.only.length === arr(this.model.sections).length ? '' : '-' + opts.only.join('-'));
    var go = this.pick.querySelector('#pgo');
    go.disabled = true;
    this.st('rendering');

    fetch('/pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: this.model, opts: opts, name: name })
    }).then(function (r) {
      if (!r.ok) return r.json().then(function (j) { throw new Error(j.error || r.status); });
      return r.blob();
    }).then(function (blob) {
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = name + '.pdf';
      document.body.appendChild(a); a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
      self.st('saved');
      setTimeout(function () { self.closePicker(); self.st(''); go.disabled = false; }, 900);
    }).catch(function (err) {
      console.info('No render server, printing instead.', err.message);
      self.printFallback(opts);
      self.st('print dialog');
      go.disabled = false;
    });
  };

  Deck.prototype.printFallback = function (opts) {
    var html = D().printDoc(this.model, opts);
    var w = window.open('', '_blank');
    if (!w) { this.download(html, 'deck.html', 'text/html'); return; }
    w.document.open(); w.document.write(html); w.document.close();
    /* Give the fonts a moment, or the first page prints in a fallback face. */
    setTimeout(function () { try { w.focus(); w.print(); } catch (e) {} }, 700);
  };

  if (!window.customElements.get('plugin-pitch-deck'))
    window.customElements.define('plugin-pitch-deck', Deck);
}());
