/* ============================================================
   SUNLOGIC DESIGN-SYSTEM CHECK
   Add to any page during development:
       <script src="shared/sunlogic-check.js" defer></script>

   Two consumers, one ruleset:
     window.SL_CHECK.run()  the engine — returns findings, presents nothing
     the presenter          console group + corner badge, dev builds only

   The engine is always available, including in a production build, because
   scripts/conformance.js audits a production build and needs to call it. Only
   the presenter is suppressed there.

   This exists because "read the guidelines" does not survive a long
   session. A failing check does.
   ============================================================ */
(function () {
  const PALETTE = new Set([
    'rgb(246, 111, 0)', 'rgb(184, 83, 0)', 'rgb(13, 32, 40)', 'rgb(8, 22, 25)',
    'rgb(255, 247, 233)', 'rgb(247, 238, 217)', 'rgb(240, 229, 207)',
    'rgb(218, 202, 182)', 'rgb(255, 255, 255)', 'rgb(160, 155, 147)',
    'rgb(90, 84, 75)', 'rgb(186, 26, 26)', 'rgba(0, 0, 0, 0)',
    /* Highlight: --surface-highlight #FEEDD9, --border-highlight #F5D6AE,
       --accent-highlight #F0A050. The callout tint. Beige carrying a little
       orange, so a block that has to interrupt actually does. */
    'rgb(254, 237, 217)', 'rgb(245, 214, 174)', 'rgb(240, 160, 80)',
  ]);
  const FACES = ['Hanken Grotesk', 'JetBrains Mono'];

  /* Each rule's intent, in a form the report can print. A blocking failure
     that will not say why the rule exists is not decidable: you cannot tell
     "this page is wrong" from "this rule is wrong" without it. */
  const WHY = {
    surface: 'the page ground is beige and its text navy — a page that starts on another colour is not in the system',
    palette: 'every colour on the page comes from the token file; an off-palette value is either a mistake or a token that was never added',
    type: 'two typefaces carry everything — Hanken Grotesk for text, JetBrains Mono for labels and data. A third face is not in the vocabulary',
    elevation: 'the system is flat: separation comes from tone and hairlines, never from a shadow',
    accent: 'one emphasis button in view, plus the closing CTA — more than that and none of them reads as the thing to click',
    copy: 'section and hero headings are Title Case; prose sub-heads and card headings past five words are sentence case; capitals belong to the mono face at label size',
    rhythm: 'a reader should never meet the same band colour twice running — the alternation is what separates sections without a rule line',
    limit: 'the nav caps at four links, because a fifth turns a route into a menu',
    dash: 'no em dash in copy, ever: it is a house rule and a stylesheet comment saying otherwise was live on three sites for months',
    hover: 'a pointer cursor is a promise that something happens; on anything that is not a control it teaches a reader to ignore the signal everywhere else',
    glyph: 'a mark on a control is an icon from the set, never a typed character: a glyph centres on its font metrics, cannot be restyled with the set, and is not in the vocabulary',
    tone: 'cards inside one section share one tone; a section that mixes white and warm reads as two systems on one page',
    label: 'one action carries one label everywhere; three names for the same booking makes a reader who hesitated once decide again',
    escape: 'every page offers a way back to the top, because a reader who has reached the foot of an 8,000px page should not have to scroll all the way back to reach the nav',
    stale: 'a counted claim is checked against the file it is counted from, because a number that used to be true is how a verified claim quietly becomes an invented one',
    contrast: 'a button announces itself before it is pressed: on a light ground it is navy at rest and wipes to orange, never a light outline on cream',
    a11y: 'anything you tap should be at least 44px tall, and every image either says what it shows or is a labelled empty state — but this rule does not catch every sub-44px control: inline text is exempt because it is not a control, and the footer/nav link lists are exempt by a separate standing decision that dense navigation is not a tap target',
  };

  /* A serialised locator, not the node. page.evaluate() cannot return
     elements, so the runner would receive {} for every finding.
     className is deliberately type-checked: on an SVG element it is an
     SVGAnimatedString, and 63 of the findings on this site are SVG <text>. */
  const selectorFor = (el) => {
    if (!el || !el.tagName) return '';
    const tag = el.tagName.toLowerCase();
    const id = el.id ? '#' + el.id : '';
    const cls = typeof el.className === 'string' && el.className.trim()
      ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.')
      : '';
    return tag + id + cls;
  };

  function run() {
    const fails = [];
    const warns = [];
    const finding = (rule, detail, el) => ({ rule, why: WHY[rule], detail, selector: selectorFor(el) });
    const fail = (rule, detail, el) => fails.push(finding(rule, detail, el));
    const warn = (rule, detail, el) => warns.push(finding(rule, detail, el));

    /* 1 — Page surface is beige, text is navy. */
    const bodyBg = getComputedStyle(document.body).backgroundColor;
    if (bodyBg !== 'rgb(255, 247, 233)') fail('surface', 'body background is ' + bodyBg + ', should be rgb(255, 247, 233)', document.body);

    /* 2 — No colour outside the palette. */
    document.querySelectorAll('body *').forEach((el) => {
      if (el.dataset && el.dataset.slCheckBadge) return;      /* never flag the badge itself */
      const cs = getComputedStyle(el);
      if (el.offsetParent === null && cs.position !== 'fixed') return;
      ['backgroundColor', 'color'].forEach((prop) => {
        const v = cs[prop];
        if (v.startsWith('rgba') && v.endsWith(', 0)')) return;
        if (v.startsWith('rgba')) return;           // scrims and glass are legal
        if (!PALETTE.has(v)) warn('palette', prop + ': ' + v + ' is not a system colour', el);
      });
    });

    /* 3 — Two typefaces only. */
    document.querySelectorAll('body *').forEach((el) => {
      if (el.dataset && el.dataset.slCheckBadge) return;
      if (!el.textContent.trim()) return;
      const f = getComputedStyle(el).fontFamily;
      if (!FACES.some((x) => f.includes(x))) warn('type', 'font-family: ' + f, el);
    });

    /* 4 — Flat. No shadows on cards, panels or buttons. */
    document.querySelectorAll('.sl-card, .sl-btn, .sl-stat, .sl-terminal, .sl-section').forEach((el) => {
      const s = getComputedStyle(el).boxShadow;
      if (s !== 'none' && !el.matches(':focus-visible')) fail('elevation', 'box-shadow on ' + el.className, el);
    });

    /* 5 — One emphasis button in view (the closing CTA is the allowed second).
       "In view" is the point, so the drawer is excluded — and a dialog for the
       same reason: it is its own view with its own emphasis budget, and while
       it is open the page behind it is inert.

       The division promo is excluded on the same grounds, and this one was a
       deliberate amendment rather than an oversight. It is a full-width card
       below the closing CTA carrying another site's hero: by the time it is
       on screen the CTA has scrolled away, so the two never compete for the
       same glance. The rule protects against several orange buttons fighting
       within one view, not against a page having three across its whole
       length — and a promo for the other division that does not look
       clickable fails at the only thing it exists to do.

       An audience close inside a .sl-statement is exempt on the same
       grounds, and this was the second deliberate amendment. A page that
       serves three audiences in one scroll asks each of them for the sale
       where THEIR argument ends, thousands of pixels from the hero and
       from each other. Two of those closes are never in one view, and a
       close that does not look clickable fails at the only thing it is
       for. The rule protects a single glance, not a page's whole length.

       Note what is NOT exempt: an emphasis button anywhere else on the
       page still counts, so this cannot be used to smuggle a fourth in. */
    const emph = document.querySelectorAll(
      '.sl-btn--emphasis:not(.sl-drawer .sl-btn):not(dialog .sl-btn):not(.sl-hero--promo .sl-btn)' +
      ':not(.sl-statement .sl-btn)');
    if (emph.length > 2) fail('accent', emph.length + ' emphasis buttons on the page; the limit is one, plus the closing CTA', emph[2]);

    /* 6 — Case. Headings are Title Case; prose sub-heads are sentence case. */
    document.querySelectorAll('.sl-hero-heading, .sl-section-heading, .sl-title, .sl-cta__heading').forEach((el) => {
      const t = el.textContent.trim();
      if (t.length > 3 && t === t.toUpperCase() && /[A-Z]/.test(t)) {
        fail('copy', 'ALL CAPS heading: "' + t.slice(0, 48) + '" — capitals belong to the mono face at label size', el);
      }
    });
    /* An h3 given .sl-title is an explicit titled heading, so it follows
       heading case, not prose case.
       Title Case capitalises every significant word. Sentence case that
       happens to contain a proper noun — "Cape Town's own structure" — leaves
       at least one lowercase, which is the distinction being drawn here.
       An earlier attempt skipped the leading word and used a 0.7 ratio; that
       stopped catching Title Case at exactly three long words, because
       dropping one left two and failed the length guard before the ratio was
       reached. Requiring all-capitalised states the rule directly and has no
       such boundary. */
    document.querySelectorAll('.sl-prose h3:not(.sl-title)').forEach((el) => {
      const text = el.textContent.trim();
      const words = text.split(/\s+/).filter((w) => w.length > 3);
      const caps = words.filter((w) => /^[A-Z]/.test(w));
      if (words.length > 2 && caps.length === words.length) {
        warn('copy', 'prose sub-head looks Title Cased: "' + text.slice(0, 48) + '" — sub-heads inside prose are sentence case', el);
      }
    });
    /* A card or step heading that is a whole sentence takes sentence case,
       even though it is a heading.

       Title Case earns its keep on a short label: "Straight Numbers" reads
       as a name for a thing. Stretched across a sentence it stops naming
       anything and just shouts, and a grid of four of them shouts four
       times. "We Will Take On a System We Did Not Install" was the line
       that made the rule necessary.

       Five words is the line. At five or fewer a heading still reads as a
       label; past that it is a sentence and is set like one. Counted on
       words of any length, so short function words count too, because they
       are exactly what makes a Title Cased sentence look wrong.

       Section and hero headings are NOT covered. They are the page's own
       structure and stay Title Case at any length. */
    document.querySelectorAll('.sl-card .sl-title, .sl-step .sl-title').forEach((el) => {
      const text = el.textContent.trim();
      const words = text.split(/\s+/).filter(Boolean);
      /* An article card's heading is the post's own title, not a label this
         system gets to case. Both directions below skip it: the same post is
         linked from more than one site, and a rule that recased it here would
         make the two copies disagree.

         Two tests, not one. Keying the exemption on the date alone meant a
         related-post card where nobody remembered the date silently stopped
         being an article card and started being judged as a label: the rule
         failed "Why Your Electricity Bill Went Up" on two blog posts while
         passing the identical heading on three other pages. A card that links
         to a post is an article card whether or not it carries a date. */
      const card = el.closest('.sl-card, .sl-step');
      if (card && card.querySelector('.sl-card__date')) return;
      if (card && card.querySelector('a[href*="blog-"]')) return;

      /* Significant words only, on both directions: Title Case leaves short
         function words lowercase, so "Rent to Own" and "Roofs, Carports and
         Open Ground" are correctly cased and must not be flagged. */
      const significant = words.filter((w) => w.length > 3);
      const caps = significant.filter((w) => /^[A-Z]/.test(w));

      if (words.length > 5) {
        if (significant.length > 2 && caps.length === significant.length) {
          fail('copy', 'card heading of ' + words.length + ' words is Title Cased: "' +
            text.slice(0, 52) + '" — headings past five words are sentence case', el);
        }
        return;
      }

      /* The other direction, which went unenforced while the rule was written
         down. SYSTEM.md has always said "Title Case to five words and sentence
         case past that", but only the second half was checked, so short
         headings drifted into sentence case one page at a time: "Straight
         numbers" sat beside "Backup Power" on the apex, and "We certify what
         we install" sat beside "At Home" on energy. A half-enforced rule is
         how a documented system stops being one. Zero significant words
         ("Tax") is nothing to judge, so it passes. */
      if (significant.length && caps.length !== significant.length) {
        const lower = significant.filter((w) => !/^[A-Z]/.test(w));
        fail('copy', 'card heading of ' + words.length + ' words is sentence case: "' +
          text.slice(0, 52) + '" — headings to five words are Title Case (' +
          lower.join(', ') + ')', el);
      }
    });

    /* 7 — No two adjacent full-bleed bands share a background.

       The closing CTA used to be exempt: its gutter was transparent, so it
       had no band colour of its own and merely RESET the run. It now sits
       on the alt tint, because on the page ground its gutter matched
       whatever section came before it and the panel looked like it was
       floating inside that section rather than closing the page. Having a
       colour makes it a band like any other, so it is counted. It takes
       the sunk tint, the third warm ground, which no section uses, so it
       can never collide with the section above it. */
    const bands = [...document.querySelectorAll('.sl-hero, .sl-trust, .sl-section, .sl-statement, .sl-cta-wrap, .sl-footer')]
      /* A .sl-hero inside a section is a card wearing the hero's layer stack,
         not a band of its own. Only a top-level hero counts. */
      .filter((s) => !(s.classList.contains('sl-hero') && s.parentElement.closest('.sl-section')));
    let prevBg = null;
    bands.forEach((s) => {
      /* The division promo is not a band of its own. It has no top padding
         and carries the closing CTA's ground on purpose, so the two read as
         one block running down to the footer — a colour change under a card
         that is meant to be floating draws a line exactly where the float
         should be. Skipped, leaving the CTA's colour as the run so far. */
      if (s.classList.contains('sl-section--promo')) return;
      const bg = getComputedStyle(s).backgroundColor;
      if (prevBg !== null && bg === prevBg) fail('rhythm', 'two adjacent bands share ' + bg, s);
      prevBg = bg;
    });

    /* 13 — One label for the site visit.

       Five buttons pointed at the same form on one page wearing three
       labels: "Book Your Free Site Visit", "Book a free site visit" and
       "Book a Free Site Assessment". Twenty-one instances across the three
       sites. Nothing told a reader they were the same offer, so anyone who
       hesitated at the first had to decide again at the second.

       Matched on meaning, not on the whole string, so a rename cannot
       quietly reintroduce a second name. Electrical's "Book a Compliance
       Inspection" is a DIFFERENT action and is deliberately not matched. */
    const BOOK_LABEL = 'Book Your Free Site Visit';
    document.querySelectorAll('.sl-btn, .sl-cta__action').forEach((el) => {
      const t = el.textContent.trim();
      if (!/free site (visit|assessment)|site assessment/i.test(t)) return;
      if (t !== BOOK_LABEL) {
        fail('label', 'site-visit button reads "' + t + '"; the one label is "' + BOOK_LABEL + '"', el);
      }
    });

    /* 14 — No em dash in anything a reader sees.

       A house rule, and until today three SYSTEM.md files told the next
       person the opposite. Rules that live only in prose do not survive a
       long session, so this one is a check.

       Em dash only. The en dash is a different character doing a
       different job: numeric and time ranges (6-9 years, 08:00-18:00) and
       the empty-value glyph on a live stat card are all correct
       typography and are not copy. */
    if (document.body && document.body.innerText.includes('\u2014')) {
      const owner = [...document.querySelectorAll('body *')].find(
        (el) => !el.children.length && el.textContent.includes('\u2014'));
      fail('dash', 'em dash in visible copy: "' +
        (owner ? owner.textContent.trim().slice(0, 60) : '') + '"', owner || document.body);
    }

    /* 15 — One card tone per section.

       A section that runs a row of white cards and then a row of warm
       ones looks like two design systems sharing a page, and that is
       exactly what a reader notices before they notice anything else.
       Tone is a property of the BAND the cards sit on, not a per-card
       choice: white steps up from a beige ground, warm does not.

       Steps are exempt. The final step of a numbered sequence is navy on
       purpose and the guide has always said so. */
    document.querySelectorAll('.sl-section').forEach((sec) => {
      const tones = new Set();
      /* Content cards only. A callout is the highlight tint by
         definition, a stat is glass by definition, and a step's final
         card is navy by definition. None of those is a tone CHOICE, so
         counting them made the rule fire on correct pages. */
      sec.querySelectorAll('.sl-card:not(.sl-step):not(.sl-callout):not(.sl-stat):not(.sl-person):not(.sl-cta)').forEach((c) => {
        tones.add(['warm', 'sunk', 'inverse', 'glass']
          .find((t) => c.classList.contains('sl-card--' + t)) || 'white');
      });
      if (tones.size > 1) {
        fail('tone', 'section mixes card tones: ' + [...tones].join(' and '), sec);
      }
    });

    /* 16 — Marks on controls are icons, never typed characters.

       A "+" or a minus sign in a ::before is not in the icon vocabulary,
       centres on the font's metrics rather than on its box, and cannot be
       restyled with the rest of the set. Two of them shipped inside
       disclosure controls before this rule existed.

       Letters and digits are fine: a step number, a counter, a label. */
    document.querySelectorAll('summary, button, .sl-btn, .sl-icon-btn').forEach((el) => {
      ['::before', '::after'].forEach((pseudo) => {
        [el, ...el.querySelectorAll('*')].forEach((node) => {
          const c = getComputedStyle(node, pseudo).content;
          if (!c || c === 'none' || c === 'normal') return;
          const text = c.replace(/^["']|["']$/g, '').trim();
          if (!text || /counter\(/.test(c)) return;
          if (/[\p{L}\p{N}]/u.test(text)) return;      /* letters and digits are legitimate */
          fail('glyph', 'typed glyph "' + text + '" used as a mark on a control; use an icon from the set', node);
        });
      });
    });

    /* 18 — Never a light-on-light button at rest.

       A control has to announce itself before it can be pressed. The outline
       variant used to be a transparent box with a warm hairline, which on a
       cream ground is a button you only find if you already know it is there,
       sitting on the same page as a solid navy dock button that announces
       itself perfectly well. On a light ground a button is navy at rest and
       wipes to orange on hover.

       Measured, not asserted: the button's own background against the first
       painted background behind it. 1.6:1 is comfortably below anything the
       palette produces deliberately (navy on cream is about 13:1) and
       comfortably above the 1.09:1 that retired .sl-btn--secondary. A button
       with no background of its own is exempt: ghost over photography is a
       deliberate treatment and the scrim, not the fill, does that work. */
    const REL_LUM = (c) => {
      const m = String(c).match(/[\d.]+/g);
      if (!m || m.length < 3) return null;
      const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
      return 0.2126 * f(+m[0]) + 0.7152 * f(+m[1]) + 0.0722 * f(+m[2]);
    };
    const GROUND_OF = (el) => {
      let n = el.parentElement;
      while (n) {
        const bg = getComputedStyle(n).backgroundColor;
        if (bg && !/rgba\(0, 0, 0, 0\)|transparent/.test(bg)) return bg;
        n = n.parentElement;
      }
      return 'rgb(255, 255, 255)';
    };
    document.querySelectorAll('.sl-btn').forEach((el) => {
      const bg = getComputedStyle(el).backgroundColor;
      if (!bg || /rgba\(0, 0, 0, 0\)|transparent/.test(bg)) return;   /* ghost: no fill of its own */
      const lb = REL_LUM(bg), lg = REL_LUM(GROUND_OF(el));
      if (lb == null || lg == null) return;
      const hi = Math.max(lb, lg), lo = Math.min(lb, lg);
      const ratio = (hi + 0.05) / (lo + 0.05);
      if (ratio >= 1.6) return;
      fail('contrast', 'button sits at ' + ratio.toFixed(2) + ':1 against its own ground; ' +
        'on a light ground a button is navy at rest and wipes to orange', el);
    });

    /* 18b — and the wipe has to be a different colour from the fill it covers.
       wipe="navy" existed to make a paired Solar/Electrical row distinguishable
       before you read the labels, back when outline was a transparent box. The
       moment outline became navy at rest, those six buttons wiped navy over
       navy: a hover that runs, costs a repaint, and changes nothing. Nobody
       would have seen it in a screenshot. */
    document.querySelectorAll('.sl-btn').forEach((el) => {
      const cs = getComputedStyle(el);
      const bg = cs.backgroundColor;
      const wipe = cs.getPropertyValue('--btn-wipe').trim();
      if (!wipe || !bg || /rgba\(0, 0, 0, 0\)|transparent/.test(bg)) return;
      const lb = REL_LUM(bg), lw = REL_LUM(wipe);
      if (lb == null || lw == null) return;
      const hi = Math.max(lb, lw), lo = Math.min(lb, lw);
      if ((hi + 0.05) / (lo + 0.05) >= 1.25) return;
      fail('contrast', 'the hover wipe is the same colour as the button it covers, so hovering does nothing visible', el);
    });

    /* 19 — A counted claim matches the data it is counted from.

       The reviews section says "Twenty reviews" and "Read All 20 on Google".
       Both numbers come from plugins/review-carousel/reviews.data.js. Refresh
       that export without touching the copy and the page starts stating a
       number that used to be true, which is the quietest way a verified claim
       turns into an invented one. Only runs where the carousel is present. */
    if (window.PLUGIN_REVIEWS && document.querySelector('plugin-review-carousel')) {
      const actual = window.PLUGIN_REVIEWS.length;
      const section = document.querySelector('plugin-review-carousel').closest('.sl-section') || document.body;
      section.querySelectorAll('.sl-body, .sl-btn, .sl-section-heading').forEach((el) => {
        const m = el.textContent.match(/\b(\d{1,4})\b/g);
        if (!m) return;
        m.forEach((n) => {
          /* Only judge numbers that are actually claiming a review count: the
             five in "five stars" is a rating, not a tally, and is spelled out
             for exactly that reason. */
          if (!/\breviews?\b|\bRead All\b/i.test(el.textContent)) return;
          if (+n !== actual && +n > 1) {
            fail('stale', 'the review section states ' + n + ' but reviews.data.js holds ' +
              actual + '; the copy and the data have drifted apart', el);
          }
        });
      });
    }

    /* 20 — Card headings inside one grid share one case.

       Rule 6 is correct card by card and still produces sets that read as a
       mistake: a six-word heading goes to sentence case, its four-word
       neighbours stay Title Case, and the grid looks like nobody checked it.
       That was fixed by hand on the energy home page, on solar.html, and twice
       on the smart page before this rule existed. The defect is not either
       heading. It is the mix, so the mix is what gets measured.

       The fix is always the copy, not the case: reword the odd one to sit on
       the same side of five words as its neighbours. Article cards are exempt
       for the same reason they are exempt from rule 6, and a grid needs at
       least two judgeable headings before there is a set to be inconsistent
       about. */
    document.querySelectorAll('.sl-grid-2, .sl-grid-3, .sl-cols').forEach((grid) => {
      const titles = [...grid.querySelectorAll('.sl-card .sl-title, .sl-step .sl-title')]
        .filter((el) => {
          const card = el.closest('.sl-card, .sl-step');
          if (card && card.querySelector('.sl-card__date')) return false;
          if (card && card.querySelector('a[href*="blog-"]')) return false;
          return true;
        });
      if (titles.length < 2) return;
      const cased = titles.map((el) => {
        const words = el.textContent.trim().split(/\s+/).filter(Boolean);
        const sig = words.filter((w) => w.length > 3);
        if (!sig.length) return null;                 /* "Tax": nothing to judge */
        return sig.every((w) => /^[A-Z]/.test(w));
      }).filter((v) => v !== null);
      if (cased.length < 2) return;
      if (new Set(cased).size === 1) return;
      const names = titles.map((el) => '"' + el.textContent.trim() + '"').join(', ');
      fail('copy', 'one grid, two heading cases: ' + names +
        '. Reword the odd one so the set sits on one side of five words', titles[0]);
    });

    /* 17 — The pointer cursor belongs to controls.

       The companion to the hover rule in the stylesheet. Hover state and
       pointer cursor both promise that something happens; on a static
       block they teach a reader that the signal means nothing, and the
       reader then stops trusting it on the elements where it does.

       Real controls: a link with an href, a button, a summary, a form
       field, a label, anything with an explicit role or tabindex. */
    document.querySelectorAll('body *').forEach((el) => {
      if (el.dataset && el.dataset.slCheckBadge) return;
      if (getComputedStyle(el).cursor !== 'pointer') return;
      if (el.closest('a[href], button, summary, label, [role="button"], [role="link"], [tabindex]')) return;
      if (el.matches('input, select, textarea')) return;
      fail('hover', 'pointer cursor on ' + el.tagName.toLowerCase() +
        (typeof el.className === 'string' && el.className ? '.' + el.className.split(/\s+/)[0] : '') +
        ', which is not a control', el);
    });

    /* 8 — Nav caps at four links. */
    const navLinks = document.querySelectorAll('.sl-nav__links .sl-nav__link');
    if (navLinks.length > 4) fail('limit', navLinks.length + ' nav links; the limit is four', navLinks[4]);

    /* 9 — Touch targets. 44px is a minimum for something you tap. Two
       things are exempt, and they are different kinds of exemption.
       First, the display check: an element laid out as `inline` is part
       of a sentence, not a control — every real control in this system
       computes to inline-flex or flex. This is the general discriminator
       and it runs first, against every candidate.
       Second, a narrower, separate standing decision that predates this
       branch: the footer and nav link lists are navigation, not tap
       targets, so anything inside .sl-footer or .sl-nav__links is exempt
       regardless of display. That decision does NOT extend to prose, body
       copy or the contact roll — those were folded into the same
       closest() call by accident, which let it swallow block- and
       flex-level links in those regions before they ever reached the
       display check above. A link sitting in running prose is normally
       inline anyway and clears rule 9 through the first check; a link
       laid out as flex or block inside prose IS a control and is meant to
       be caught. So: this rule does not flag everything under 44px — only
       what is neither inline text nor inside the footer/nav — and it must
       not be read as claiming otherwise. */
    document.querySelectorAll('a, button, .sl-btn, .sl-icon-btn').forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.height === 0) return;
      /* Round BEFORE comparing, not only when reporting. getBoundingClientRect
         returns a float, and an element the stylesheet sets to exactly 44px
         measures 43.996 when it sits under a fractional transform — the dock
         slides on translateY, so its phone link did. The rule then flagged it
         and printed "44px tall, minimum is 44px", a finding that contradicts
         itself and could not be reproduced by a second run a moment later.
         It fired on roughly one load in eight. A gate that reports a
         different answer on the same page is worse than no gate, so the
         threshold now tests the same number the message prints. Sub-pixel
         layout is not an accessibility failure. */
      const h = Math.round(r.height);
      if (h >= 44) return;
      if (getComputedStyle(el).display === 'inline') return;
      if (el.closest('.sl-footer, .sl-nav__links')) return;
      warn('a11y', h + 'px tall, minimum is 44px', el);
    });

    /* 10 — Every image slot is either real or a labelled empty state.
       alt="" is the correct marker for a decorative image, not a missing
       one — checking !el.alt treated the empty string the same as a
       genuinely absent attribute, so only a missing attribute is flagged. */
    document.querySelectorAll('img').forEach((el) => {
      if (!el.hasAttribute('alt')) fail('a11y', 'image with no alt text', el);
    });

    /* 11 — Placeholders are visible, not invented. Informational. */
    const placeholders = (document.body.innerText.match(/\[[^\]]*(pending|placeholder)[^\]]*\]/gi) || []).length;

    /* 12 — Every page offers a way back to the top.
       It is rendered by dl-dock rather than written into each page, so this
       cannot fail through a page forgetting the markup — it fails when a
       page has no dock at all, which is the thing worth catching: a long
       page that strands the reader at the bottom. Checked for existence,
       not visibility: it is `hidden` until a quarter of the page has gone
       past, and every page is at scroll position 0 when the gate runs. */
    if (!document.querySelector('.sl-totop')) {
      fail('escape', 'no back-to-top button on this page', document.body);
    }

    return { fails, warns, info: { placeholders } };
  }

  window.SL_CHECK = { run, WHY };

  /* ---- Presenter. Dev builds only. -------------------------------------
     The guard reads the build flag rather than location.hostname: a hostname
     regex was right while there was one site and shipped a developer badge to
     the public on two of three once the environment grew. window.SL_BUILD.prod
     is a property of the build, so a fourth host cannot reintroduce it.
     Only this presenter is suppressed — the engine above stays callable,
     because the headless runner audits production builds. */
  if (window.SL_BUILD && window.SL_BUILD.prod) return;

  const present = (result) => {
    const { fails, warns, info } = result;
    const style = (c) => 'color:' + c + ';font-weight:600';
    console.group('%cSunlogic design-system check', 'font-weight:700;font-size:13px');
    if (!fails.length && !warns.length) console.log('%c✓ all checks pass', style('#0a7'));
    fails.forEach((f) => console.log('%c✗ ' + f.rule + '%c  ' + f.detail, style('#c00'), 'color:inherit', f.selector));
    warns.forEach((w) => console.log('%c! ' + w.rule + '%c  ' + w.detail, style('#b70'), 'color:inherit', w.selector));
    if (info.placeholders) console.log('%ci placeholders%c  ' + info.placeholders + ' unresolved value(s) visible on this page — correct, until the client supplies them', style('#678'), 'color:inherit');
    console.groupEnd();

    const badge = document.createElement('div');
    badge.textContent = fails.length ? fails.length + ' system error' + (fails.length > 1 ? 's' : '')
      : warns.length ? warns.length + ' warning' + (warns.length > 1 ? 's' : '') : 'system ok';
    badge.style.cssText = 'position:fixed;left:12px;bottom:12px;z-index:20;padding:6px 10px;' +
      'border-radius:4px;font:600 11px/1 ui-monospace,monospace;letter-spacing:.05em;' +
      'text-transform:uppercase;cursor:pointer;' +
      'background:' + (fails.length ? '#BA1A1A' : warns.length ? '#F66F00' : '#0D2028') + ';color:' + (warns.length && !fails.length ? '#0D2028' : '#fff');
    badge.dataset.slCheckBadge = '1';
    badge.title = 'Sunlogic check — open the console for detail';
    badge.onclick = () => badge.remove();
    document.body.appendChild(badge);
  };

  if (document.readyState === 'complete') setTimeout(() => present(run()), 200);
  else window.addEventListener('load', () => setTimeout(() => present(run()), 200));
})();
