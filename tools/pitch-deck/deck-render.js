/* ============================================================
   SUNLOGIC DECK RENDERER
   A deck model in, markup out. No DOM, no editor, no browser API
   beyond string handling, which is why render.mjs can load this
   same file under node and the Download button and the command
   line cannot drift apart. That drift is what the LearnIQ planner
   learned the hard way: never hand-maintain a second layout.

   The model is in README.md. The short version: meta + company +
   an ordered list of sections, each holding slides, and this file
   knows how to draw each kind of slide.

   WHAT IT ENFORCES, so a deck built next year cannot drift:

   1. Band rhythm. Slide backgrounds alternate automatically, so
      no two neighbours share one. A cover, a statement and the
      closing CTA carry their own colour and sit outside it.
   2. Heading case and the em dash. checkModel() reports, never
      rewrites, because the wording is the author's.

   Copy fields are HTML on purpose: a sentence needs <strong> and
   &rsquo;. Anything landing in an attribute is escaped.
   ============================================================ */
(function () {
  'use strict';

  var root = typeof window !== 'undefined' ? window : globalThis;

  var VERSION = '1.0';
  var MODEL   = 1;               /* model version, stamped into saved files */

  /* ---------------------------------------------------------- helpers */

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
  function raw(s) { return s == null ? '' : String(s); }
  function has(s) { return raw(s).trim() !== ''; }
  function arr(a) { return Array.isArray(a) ? a : []; }

  /* A field still carrying its bracketed placeholder is unwritten, not
     wrong. The house rules are held against finished copy only, and the
     check counts what is left instead of reporting each one as a fault. */
  function placeholder(s) { return /^\[[^\]]*\]$/.test(raw(s).trim()); }

  /* The deck's own assets, and the document builder's only as a fall
     back. A deck has to work served from its own folder, from file://
     and as one emailed file, so it reaches outside itself for nothing. */
  function assets() { return root.SL_DECK_ASSETS || root.SL_DOC_ASSETS || {}; }
  function brand()  { return root.SL_DECK_BRAND || { tokens: {}, bands: [], mark: '' }; }

  /* The lockup, in the right colour for the band it sits on. A CSS rule
     cannot do this: WeasyPrint does not style the inside of an SVG, so a
     white-on-navy mark has to be a different mark. */
  function mark(onDark) {
    var b = brand();
    return (onDark && b.markLight) ? b.markLight : (b.mark || '');
  }
  function css()    { return root.SL_DECK_CSS || {}; }

  /* Icons come from the document builder's set, so a deck and a
     proposal draw the same bolt. An unknown name falls back rather
     than rendering a hole. */
  function icon(name, cls) {
    var set = assets().icons || (root.SL_DOC_ASSETS || {}).icons || {};
    var svg = set[name] || set.bolt;
    if (!svg) return '';
    svg = svg.replace('<svg ', '<svg class="' + (cls || 'sl-d-card__icon') + '" ');
    return svg.replace(/\swidth="[^"]*"|\sheight="[^"]*"/g, '');
  }

  /* A heading is a plain part and an emphasised part. The emphasis is
     the only place orange appears in running text, so it is a field
     rather than something an author types <em> into. */
  function heading(s, tag, cls) {
    if (!has(s.h) && !has(s.em)) return '';
    return '<' + tag + ' class="' + cls + '">' + raw(s.h)
      + (has(s.em) ? (has(s.h) ? ' ' : '') + '<em class="sl-d-em">' + raw(s.em) + '</em>' : '')
      + '</' + tag + '>';
  }

  function headStack(s) {
    var out = '';
    if (has(s.eyebrow)) out += '<p class="sl-d-eyebrow">' + raw(s.eyebrow) + '</p>';
    out += heading(s, 'h2', 'sl-d-h');
    if (has(s.lead)) out += '<p class="sl-d-lead">' + raw(s.lead) + '</p>';
    return out ? '<div class="sl-d-head">' + out + '</div>' : '';
  }

  function body(inner) { return '<div class="sl-d-body">' + inner + '</div>'; }

  /* ---------------------------------------------------------- slides */

  /* Each entry takes the slide and the model and returns the inside of
     the slide box. The box itself, its band and its footer are added by
     slideHtml(), so no slide type can opt out of the rhythm. */
  var SLIDES = {

    /* The cover. Four facts at most: a fifth is a slide of its own. */
    cover: function (s, m, onWhite) {
      var meta = m.meta || {};
      var kv = arr(s.kv).slice(0, 4).map(function (r) {
        return '<div><dt>' + raw(r.k) + '</dt><dd>' + raw(r.v) + '</dd></div>';
      }).join('');
      return '<div class="sl-d-cover-top">' + mark(!onWhite)
        + (has(meta.ref) ? '<p class="sl-d-eyebrow" style="margin:0">' + raw(meta.ref) + '</p>' : '')
        + '</div>'
        + '<div class="sl-d-cover-mid">' + headStack(s) + '</div>'
        + (kv ? '<dl class="sl-d-kv">' + kv + '</dl>' : '');
    },

    /* The one dark statement. Two of them and neither means anything. */
    statement: function (s) {
      return body((has(s.eyebrow) ? '<p class="sl-d-eyebrow">' + raw(s.eyebrow) + '</p>' : '')
        + '<p class="sl-d-statement">' + raw(s.text)
        + (has(s.em) ? ' <em class="sl-d-em">' + raw(s.em) + '</em>' : '') + '</p>'
        + (has(s.body) ? '<p class="sl-d-lead">' + raw(s.body) + '</p>' : ''));
    },

    cards: function (s) {
      var cols = (Number(s.cols) === 2) ? 2 : 3;
      return headStack(s) + body('<div class="sl-d-cards sl-d-cards--' + cols + '">'
        + arr(s.items).map(function (it) {
            return '<div class="sl-d-card">' + icon(it.icon)
              + '<h3>' + raw(it.title) + '</h3><p>' + raw(it.body) + '</p></div>';
          }).join('') + '</div>');
    },

    kv: function (s) {
      return headStack(s) + body('<dl class="sl-d-kvlist">'
        + arr(s.items).map(function (it) {
            return '<div><dt>' + raw(it.k) + '</dt><dd>' + raw(it.v) + '</dd></div>';
          }).join('') + '</dl>');
    },

    bullets: function (s) {
      var cols = (Number(s.cols) === 1) ? 1 : 2;
      return headStack(s) + body('<ul class="sl-d-bullets sl-d-bullets--' + cols + '">'
        + arr(s.items).map(function (t) { return '<li><span>' + raw(t) + '</span></li>'; }).join('')
        + '</ul>');
    },

    /* Big figures. Four across, because a fifth stops being read. */
    metrics: function (s) {
      return headStack(s) + body('<div class="sl-d-metrics">'
        + arr(s.items).slice(0, 4).map(function (it) {
            return '<div class="sl-d-metric"><b>' + raw(it.v) + '</b>'
              + '<span>' + raw(it.k) + '</span>'
              + (has(it.note) ? '<em>' + raw(it.note) + '</em>' : '') + '</div>';
          }).join('') + '</div>');
    },

    quote: function (s) {
      return body('<blockquote class="sl-d-quote">' + raw(s.text) + '</blockquote>'
        + '<p class="sl-d-cite"><b>' + raw(s.cite) + '</b>'
        + (has(s.role) ? '<span>' + raw(s.role) + '</span>' : '') + '</p>');
    },

    timeline: function (s) {
      return headStack(s) + body('<dl class="sl-d-timeline">'
        + arr(s.items).map(function (it) {
            return '<div class="sl-d-step"><dt>' + raw(it.when) + '</dt>'
              + '<h3>' + raw(it.title) + '</h3><p>' + raw(it.body) + '</p></div>';
          }).join('') + '</dl>');
    },

    table: function (s) {
      var head = arr(s.head).map(function (h) { return '<th>' + raw(h) + '</th>'; }).join('');
      var rows = arr(s.rows).map(function (r) {
        return '<tr>' + arr(r).map(function (c) { return '<td>' + raw(c) + '</td>'; }).join('') + '</tr>';
      }).join('');
      return headStack(s) + body('<table class="sl-d-table">'
        + (head ? '<thead><tr>' + head + '</tr></thead>' : '')
        + '<tbody>' + rows + '</tbody></table>'
        + (has(s.note) ? '<p class="sl-d-note">' + raw(s.note) + '</p>' : ''));
    },

    /* The closing call to action. Last, and only once. */
    cta: function (s) {
      return body(headStack(s) + '<div class="sl-d-actions">'
        + arr(s.actions).slice(0, 2).map(function (a) {
            return '<div class="sl-d-action"><b>' + raw(a.label) + '</b>'
              + (has(a.sub) ? '<span>' + raw(a.sub) + '</span>' : '') + '</div>';
          }).join('') + '</div>');
    },

    /* Drawn from company, so contact details are written once. */
    contact: function (s, m) {
      var c = m.company || {};
      var row = function (k, v) {
        return has(v) ? '<div><dt>' + esc(k) + '</dt><dd>' + raw(v) + '</dd></div>' : '';
      };
      return headStack(s) + body('<div class="sl-d-contact">'
        + '<dl>' + row('Registered name', c.regName) + row('Registration', c.reg)
        + row('VAT', c.vat) + row('Address', c.address)
        + row('Website', c.website) + row('Email', c.email) + '</dl>'
        + '<div class="sl-d-who"><b>' + raw(c.contactName) + '</b>'
        + '<span>' + raw(c.contactRole) + '</span>'
        + (has(c.contactEmail) ? '<a href="mailto:' + esc(c.contactEmail) + '">' + raw(c.contactEmail) + '</a>' : '')
        + (has(c.contactPhone) ? '<a href="tel:' + esc(String(c.contactPhone).replace(/[^+\d]/g, '')) + '">' + raw(c.contactPhone) + '</a>' : '')
        + '</div></div>');
    }
  };

  /* Slides that carry their own colour. They are never counted into the
     alternation, so removing one cannot flip every band after it. */
  var OWN_BAND = { cover: 1, statement: 1, cta: 1 };

  /* ------------------------------------------------------- selection

     One place decides what is in a render. The picker, the Export
     button and make-pdf.py --only all come through here, so a deck
     of three sections is the same three sections whoever asked.

       opts.only    array of section keys, or null for all
       opts.slides  { sectionKey: [slide indices] }, or absent for all
       opts.onePager  keep only sections marked onePager            */

  function select(m, opts) {
    opts = opts || {};
    var only = opts.only && opts.only.length ? opts.only : null;
    var pick = opts.slides || {};
    return arr(m.sections).filter(function (sec) {
      if (only && only.indexOf(sec.k) < 0) return false;
      if (opts.onePager && !sec.onePager) return false;
      return true;
    }).map(function (sec) {
      var keep = pick[sec.k];
      var slides = arr(sec.slides).filter(function (s, i) {
        return !keep || keep.indexOf(i) > -1;
      });
      return { sec: sec, slides: slides };
    }).filter(function (g) {
      /* A ticked section with nothing ticked under it would print a
         heading above an empty page. */
      return g.slides.length > 0;
    });
  }

  /* --------------------------------------------------------- the deck */

  function slideHtml(s, m, state, onWhite) {
    var fn = SLIDES[s.type];
    if (!fn) return '';
    var own = OWN_BAND[s.type];
    var cls = 'sl-d-slide sl-d-slide--' + s.type;
    if (!own) { cls += ' sl-d-slide--b' + (state.band % 2); state.band++; }
    /* The cover's photograph is brand, not style, so it is handed to the
       stylesheet as a variable rather than written into it. */
    var style = (s.type === 'cover' && brand().cover && !onWhite)
      ? ' style="--cover-photo:url(' + brand().cover + ')"' : '';
    state.page++;
    var meta = m.meta || {};
    var foot = s.type === 'cover' ? ''
      : '<footer class="sl-d-foot">'
        + '<span>' + raw(meta.title || '') + (has(meta.client) ? ' &middot; ' + raw(meta.client) : '') + '</span>'
        + '<span class="sl-d-pageno">' + state.page + '</span>'
        + mark(!!own && !onWhite) + '</footer>';
    return '<section class="' + cls + '"' + style + '>' + fn(s, m, onWhite) + foot + '</section>';
  }

  /* The body of a deck: a tab per section, then its slides. The tabs are
     hidden on screen furniture rules and shown in the one-pager, where a
     reader needs to know which part they are looking at. */
  function deckHtml(m, opts) {
    var state = { band: 0, page: 0 };
    /* The one-pager is one voice on white, so the dark slides lose their
       colour there. A white lockup on white paper is an empty space, and
       a CSS rule cannot recolour an SVG for WeasyPrint, so the choice is
       made here instead. */
    var onWhite = !!(opts && opts.onePager);
    return '<div class="sl-d-deck">' + select(m, opts).map(function (g) {
      /* The tab carries the type of the slide it introduces, so a sheet
         can drop the ones that name themselves without a :has() selector
         that WeasyPrint may not have. */
      var first = (g.slides[0] || {}).type || 'none';
      return '<div class="sl-d-sec sl-d-sec--' + first + '"><b>' + raw(g.sec.n) + '</b><span></span></div>'
        + g.slides.map(function (s) { return slideHtml(s, m, state, onWhite); }).join('');
    }).join('') + '</div>';
  }

  /* --------------------------------------------------------- the CSS */

  function tokensCss(b) {
    var t = (b || brand()).tokens || {};
    return ':root{' + Object.keys(t).map(function (k) {
      return '--' + k + ':' + t[k];
    }).join(';') + '}';
  }

  /* The brand fonts as data, so a deck opened from an attachment and a
     deck printed by WeasyPrint are set in the same face. One declaration
     per real file at its real weight: a range like `100 900` is rejected
     outright by WeasyPrint, which then silently sets the whole deck in a
     fallback, and a synthesized 900 on a 3em heading is obvious. */
  function fontsCss() {
    var d = root.SL_DECK_ASSETS, a = assets(), out = '';
    var face = function (family, weight, b64) {
      return '@font-face{font-family:"' + family + '";font-style:normal;'
        + 'font-weight:' + weight + ';font-display:swap;'
        + 'src:url(data:font/woff2;base64,' + b64 + ') format("woff2")}';
    };
    if (d) {
      if (d.body400) out += face('Hanken Grotesk', 400, d.body400);
      if (d.body500) out += face('Hanken Grotesk', 500, d.body500);
      if (d.body700) out += face('Hanken Grotesk', 700, d.body700);
      if (d.body800) out += face('Hanken Grotesk', 800, d.body800);
      if (d.body900) out += face('Hanken Grotesk', 900, d.body900);
      if (d.mono400) out += face('JetBrains Mono', 400, d.mono400);
      return out;
    }
    /* Without deck-assets.js, the document builder's single 400 face is
       better than nothing. Declared at its own weight, never as a range. */
    if (a.fontBody) out += face('Hanken Grotesk', 400, a.fontBody);
    if (a.fontMono) out += face('JetBrains Mono', 400, a.fontMono);
    return out;
  }

  function styles(mode) {
    var c = css();
    var out = fontsCss() + tokensCss() + (c.core || '');
    if (mode === 'print')    out += c.print || '';
    else if (mode === 'one') out += c.onePager || '';
    else                     out += c.screen || '';
    return out;
  }

  /* ------------------------------------------------------- documents */

  function page(title, style, bodyHtml) {
    return '<!DOCTYPE html>\n<html lang="en-ZA">\n<head>\n<meta charset="utf-8">\n'
      + '<meta name="viewport" content="width=device-width,initial-scale=1">\n'
      + '<title>' + esc(title) + '</title>\n'
      + '<style>' + style + '</style>\n</head>\n<body>\n' + bodyHtml + '\n</body>\n</html>';
  }

  /* The deck as one file, to send. Carries its own fonts and styles and
     needs nothing beside it. */
  function standalone(m, opts) {
    var meta = m.meta || {};
    return page(meta.title || 'Deck', styles('screen'), deckHtml(m, opts));
  }

  /* What goes to WeasyPrint, and what the print dialog prints. */
  function printDoc(m, opts) {
    opts = opts || {};
    var meta = m.meta || {};
    return page(meta.title || 'Deck',
      styles(opts.onePager ? 'one' : 'print'),
      deckHtml(m, opts));
  }

  /* --------------------------------------------------- model check

     The house rules a renderer cannot fix for you, because the wording
     is the author's. Reported, never silently rewritten. */

  function titleCased(text) {
    var words = String(text).trim().split(/\s+/).filter(function (w) { return w.length > 3; });
    return words.length ? words.every(function (w) { return /^[A-Z[]/.test(w); }) : null;
  }

  function checkModel(m) {
    var out = [], todo = 0;
    var walk = function (where, text) {
      if (!has(text)) return;
      if (placeholder(text)) { todo++; return; }
      if (String(text).indexOf('\u2014') > -1)
        out.push({ rule: 'dash', where: where, detail: 'em dash in copy: ' + String(text).slice(0, 60) });
    };

    var covers = 0, ctas = 0, contacts = 0, statements = 0;

    /* The deck details and the company block carry copy too, and a deck
       sent with [ reference ] still on the cover is the mistake this
       count exists to catch. */
    Object.keys(m.meta || {}).forEach(function (k) { walk('meta.' + k, m.meta[k]); });
    Object.keys(m.company || {}).forEach(function (k) { walk('company.' + k, m.company[k]); });

    arr(m.sections).forEach(function (sec) {
      if (!has(sec.k)) out.push({ rule: 'section', where: sec.n || '?', detail: 'section has no key, so it cannot be selected' });
      if (!arr(sec.slides).length) out.push({ rule: 'empty', where: sec.k, detail: 'section has no slides' });

      arr(sec.slides).forEach(function (s, i) {
        var at = sec.k + '[' + i + '] ' + s.type;
        if (!SLIDES[s.type]) out.push({ rule: 'type', where: at, detail: 'unknown slide type' });

        if (s.type === 'cover')     covers++;
        if (s.type === 'cta')       ctas++;
        if (s.type === 'contact')   contacts++;
        if (s.type === 'statement') statements++;

        ['h', 'em', 'lead', 'text', 'body', 'note', 'cite', 'role'].forEach(function (k) { walk(at + '.' + k, s[k]); });
        arr(s.items).forEach(function (it, n) {
          if (typeof it === 'string') return walk(at + '.items[' + n + ']', it);
          ['title', 'body', 'k', 'v', 'when', 'note'].forEach(function (k) { walk(at + '.items[' + n + '].' + k, it[k]); });
          /* Five words or fewer is Title Case, past five is sentence case. */
          if (s.type === 'cards' && has(it.title) && !placeholder(it.title)) {
            var words = String(it.title).trim().split(/\s+/).length;
            var tc = titleCased(it.title);
            if (words <= 5 && tc === false)
              out.push({ rule: 'case', where: at + '.items[' + n + '].title', detail: 'five words or fewer, so Title Case: ' + it.title });
            if (words > 5 && tc === true)
              out.push({ rule: 'case', where: at + '.items[' + n + '].title', detail: 'past five words, so sentence case: ' + it.title });
          }
        });
        arr(s.kv).forEach(function (r, n) {
          walk(at + '.kv[' + n + '].k', r.k);
          walk(at + '.kv[' + n + '].v', r.v);
        });
        arr(s.rows).forEach(function (r, n) {
          arr(r).forEach(function (c, x) { walk(at + '.rows[' + n + '][' + x + ']', c); });
        });
        arr(s.actions).forEach(function (a, n) {
          walk(at + '.actions[' + n + '].label', a.label);
          walk(at + '.actions[' + n + '].sub', a.sub);
        });
        if (s.type === 'cover' && arr(s.kv).length > 4)
          out.push({ rule: 'ceiling', where: at, detail: 'more than four facts on the cover' });
      });
    });

    if (covers > 1)     out.push({ rule: 'ceiling', where: 'deck', detail: covers + ' covers, so one of them is not a cover' });
    if (ctas > 1)       out.push({ rule: 'ceiling', where: 'deck', detail: ctas + ' closing calls to action, which asks for nothing' });
    if (contacts > 1)   out.push({ rule: 'ceiling', where: 'deck', detail: contacts + ' contact slides' });
    if (statements > 1) out.push({ rule: 'ceiling', where: 'deck', detail: statements + ' statement bands, so neither stands out' });
    if (todo) out.push({ rule: 'todo', where: 'deck', detail: todo + ' fields are still placeholders' });

    return out;
  }

  /* ----------------------------------------------------------- export */

  root.SLDeck = {
    version: VERSION, model: MODEL,
    select: select, deckHtml: deckHtml,
    standalone: standalone, printDoc: printDoc,
    styles: styles, tokensCss: tokensCss, fontsCss: fontsCss,
    icon: icon, mark: mark, checkModel: checkModel,
    slideTypes: Object.keys(SLIDES)
  };
}());
