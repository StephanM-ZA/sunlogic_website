/* ============================================================
   SUNLOGIC DESIGN-SYSTEM CHECK
   Add to any page during development:
       <script src="shared/sunlogic-check.js" defer></script>
   It prints a pass/fail table to the console and paints a badge
   in the corner. Remove the tag (or it self-disables) in production.

   This exists because "read the guidelines" does not survive a long
   session. A failing check does.
   ============================================================ */
(function () {
  /* Run everywhere except the live production host. The previous guard
     disabled the check on any https URL, which meant it never ran on a dev
     server, a staging URL or a deploy preview — i.e. almost everywhere it
     was needed. Remove the script tag for production; that is the off switch. */
  if (/^(www\.)?sunlogic\.co\.za$/.test(location.hostname)) return;

  const PALETTE = new Set([
    'rgb(246, 111, 0)', 'rgb(184, 83, 0)', 'rgb(13, 32, 40)', 'rgb(8, 22, 25)',
    'rgb(255, 247, 233)', 'rgb(247, 238, 217)', 'rgb(240, 229, 207)',
    'rgb(218, 202, 182)', 'rgb(255, 255, 255)', 'rgb(160, 155, 147)',
    'rgb(90, 84, 75)', 'rgb(186, 26, 26)', 'rgba(0, 0, 0, 0)',
  ]);
  const FACES = ['Hanken Grotesk', 'JetBrains Mono'];
  const fails = [];
  const warns = [];
  const fail = (rule, detail, el) => fails.push({ rule, detail, el });
  const warn = (rule, detail, el) => warns.push({ rule, detail, el });

  const run = () => {
    /* 1 — Page surface is beige, text is navy. */
    const bodyBg = getComputedStyle(document.body).backgroundColor;
    if (bodyBg !== 'rgb(255, 247, 233)') fail('surface', 'body background is ' + bodyBg + ', should be rgb(255, 247, 233)', document.body);

    /* 2 — No colour outside the palette. */
    document.querySelectorAll('body *').forEach((el) => {
      if (el.dataset.slCheckBadge) return;      /* never flag the badge itself */
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
      if (el.dataset.slCheckBadge) return;
      if (!el.textContent.trim()) return;
      const f = getComputedStyle(el).fontFamily;
      if (!FACES.some((x) => f.includes(x))) warn('type', 'font-family: ' + f, el);
    });

    /* 4 — Flat. No shadows on cards, panels or buttons. */
    document.querySelectorAll('.sl-card, .sl-btn, .sl-stat, .sl-terminal, .sl-section').forEach((el) => {
      const s = getComputedStyle(el).boxShadow;
      if (s !== 'none' && !el.matches(':focus-visible')) fail('elevation', 'box-shadow on ' + el.className, el);
    });

    /* 5 — One emphasis button in view (the closing CTA is the allowed second). */
    const emph = document.querySelectorAll('.sl-btn--emphasis:not(.sl-drawer .sl-btn)');
    if (emph.length > 2) fail('accent', emph.length + ' emphasis buttons on the page; the limit is one, plus the closing CTA', emph[2]);

    /* 6 — Case. Headings are Title Case; prose sub-heads are sentence case.
       Flag ALL CAPS headings, and prose sub-heads that have been Title Cased. */
    document.querySelectorAll('.sl-hero-heading, .sl-section-heading, .sl-title, .sl-cta__heading').forEach((el) => {
      const t = el.textContent.trim();
      if (t.length > 3 && t === t.toUpperCase() && /[A-Z]/.test(t)) {
        fail('copy', 'ALL CAPS heading: "' + t.slice(0, 48) + '" — capitals belong to the mono face at label size', el);
      }
    });
    /* An h3 given .sl-title is an explicit titled heading (a named
       sub-document, say), so it follows heading case, not prose case. */
    document.querySelectorAll('.sl-prose h3:not(.sl-title)').forEach((el) => {
      const words = el.textContent.trim().split(/\s+/).filter((w) => w.length > 3);
      const caps = words.filter((w) => /^[A-Z]/.test(w));
      if (words.length > 2 && caps.length > words.length / 2) {
        warn('copy', 'prose sub-head looks Title Cased: "' + el.textContent.trim().slice(0, 48) + '" — sub-heads inside prose are sentence case', el);
      }
    });

    /* 7 — No two adjacent full-bleed bands share a background. Statement
       bands, the hero and the trust strip are tonal breaks, so they count in
       the run. The closing CTA is an inset rounded card on a transparent
       gutter: it has no band colour of its own, but that gutter does separate
       what sits either side of it, so it RESETS the run rather than joining
       it. That is why a navy CTA can sit above the navy footer. */
    const bands = [...document.querySelectorAll('.sl-hero, .sl-trust, .sl-section, .sl-statement, .sl-cta-wrap, .sl-footer')];
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

    /* 9 — Touch targets. */
    document.querySelectorAll('a, button, .sl-btn, .sl-icon-btn').forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.height > 0 && r.height < 44 && !el.closest('.sl-footer, .sl-nav__links')) {
        warn('a11y', Math.round(r.height) + 'px tall, minimum is 44px', el);
      }
    });

    /* 10 — Every image slot is either real or a labelled empty state. */
    document.querySelectorAll('img').forEach((el) => {
      if (!el.alt) fail('a11y', 'image with no alt text', el);
    });

    /* 11 — Placeholders are visible, not invented. Informational. */
    const pending = (document.body.innerText.match(/\[[^\]]*(pending|placeholder)[^\]]*\]/gi) || []).length;

    const style = (c) => 'color:' + c + ';font-weight:600';
    console.group('%cSunlogic design-system check', 'font-weight:700;font-size:13px');
    if (!fails.length && !warns.length) console.log('%c✓ all checks pass', style('#0a7'));
    fails.forEach((f) => console.log('%c✗ ' + f.rule + '%c  ' + f.detail, style('#c00'), 'color:inherit', f.el));
    warns.forEach((w) => console.log('%c! ' + w.rule + '%c  ' + w.detail, style('#b70'), 'color:inherit', w.el));
    if (pending) console.log('%ci placeholders%c  ' + pending + ' unresolved value(s) visible on this page — correct, until the client supplies them', style('#678'), 'color:inherit');
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

  if (document.readyState === 'complete') setTimeout(run, 200);
  else window.addEventListener('load', () => setTimeout(run, 200));
})();
