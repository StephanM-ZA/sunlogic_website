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
    copy: 'headings are Title Case and prose sub-heads are sentence case; capitals belong to the mono face at label size',
    rhythm: 'a reader should never meet the same band colour twice running — the alternation is what separates sections without a rule line',
    limit: 'the nav caps at four links, because a fifth turns a route into a menu',
    escape: 'every page offers a way back to the top, because a reader who has reached the foot of an 8,000px page should not have to scroll all the way back to reach the nav',
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

       Note what is NOT exempt: an emphasis button anywhere else on the page
       still counts, so this cannot be used to smuggle a fourth in. */
    const emph = document.querySelectorAll(
      '.sl-btn--emphasis:not(.sl-drawer .sl-btn):not(dialog .sl-btn):not(.sl-hero--promo .sl-btn)');
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

    /* 7 — No two adjacent full-bleed bands share a background. The closing CTA
       is an inset rounded card on a transparent gutter: it has no band colour
       of its own, but that gutter does separate what sits either side of it,
       so it RESETS the run rather than joining it. */
    const bands = [...document.querySelectorAll('.sl-hero, .sl-trust, .sl-section, .sl-statement, .sl-cta-wrap, .sl-footer')]
      /* A .sl-hero inside a section is a card wearing the hero's layer stack,
         not a band of its own. Only a top-level hero counts. */
      .filter((s) => !(s.classList.contains('sl-hero') && s.parentElement.closest('.sl-section')));
    let prevBg = null;
    bands.forEach((s) => {
      if (s.classList.contains('sl-cta-wrap')) { prevBg = null; return; }
      const bg = getComputedStyle(s).backgroundColor;
      if (prevBg !== null && bg === prevBg) fail('rhythm', 'two adjacent bands share ' + bg, s);
      prevBg = bg;
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
      if (r.height === 0 || r.height >= 44) return;
      if (getComputedStyle(el).display === 'inline') return;
      if (el.closest('.sl-footer, .sl-nav__links')) return;
      warn('a11y', Math.round(r.height) + 'px tall, minimum is 44px', el);
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
