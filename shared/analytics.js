/* ============================================================
   SUNLOGIC ANALYTICS
   One GA4 property per site, behind a consent gate.

   Nothing here runs until SL_GA_ID below is filled in. With it empty the
   file is inert: no banner, no cookies, no network. That is deliberate —
   shipping the wiring before the property exists should change nothing a
   visitor can see.

   TWO DECISIONS ARE BAKED IN, both made explicitly:

   1. ONE property PER SITE, selected by hostname — see SL_GA_IDS for what
      that costs and what it buys.

   2. Consent BEFORE loading, not Consent Mode. Google's consent mode would
      let gtag load in a denied state and send cookieless pings; this
      instead loads nothing at all until someone accepts. It is the
      stricter reading of POPIA and, more usefully, it is verifiable: if
      consent has not been given there is no Google script on the page, and
      you can see that in the network tab rather than having to reason
      about what a denied ping does.

   The cost of that choice, stated plainly: activity before the click on
   Accept is not measured, and a visitor who ignores the banner is never
   measured. Numbers here will be lower than a site that tracks everyone.
   That is the trade that was chosen, not a bug to fix later.
   ============================================================ */
(function () {
  'use strict';

  /* ---- Configuration -------------------------------------------------
     One GA4 property PER SITE, keyed by hostname.

     This is a change from the original plan of a single cross-domain
     property, and the trade is worth stating because it cannot be
     recovered retrospectively: with separate properties, a visitor who
     follows the closing promo from Energy to Electrical is two sessions in
     two properties, and each site appears in the other's report as a
     referrer. Neither property can show that journey as one visit. What
     you get in exchange is a clean, self-contained property per division,
     which is the right shape if the two are ever reported on — or handed
     over — separately.

     The cross_site_click event is what survives the split: it is recorded
     in the property of the site being LEFT, carrying to_site and which
     placement sent them, so the hand-off is still countable from one side
     even though the session is not continuous.

     A host with no ID here stays inert — no banner, no cookies. That keeps
     Cloudflare preview builds and localhost out of the reports rather than
     filing them under whichever property happened to be first. */
  const SL_GA_IDS = {
    'sunlogic.co.za': 'G-0ZF74GHJ7M',
    'www.sunlogic.co.za': 'G-0ZF74GHJ7M',
    'energy.sunlogic.co.za': 'G-G6Q0E6WGH3',
    'electrical.sunlogic.co.za': 'G-44SRED3Q20',
  };

  const SL_GA_ID = SL_GA_IDS[window.location.hostname] || '';

  /* Bumping this re-asks everyone. Only change it if what is being
     consented TO changes — a new tool, a new cookie — because silently
     re-asking is worse than not asking. */
  const CONSENT_KEY = 'sl-consent-v1';

  /* The categories a visitor can decide about.
     ------------------------------------------------------------------
     Essential is listed but not toggleable, and that is not a dark
     pattern: it covers the things the site cannot work without (the form
     you are filling in, the choice you are making right now), and offering
     a switch that does nothing would be worse than showing none. Analytics
     is the only real decision on this site — there is no advertising
     pixel, no remarketing, nothing sold on, and the list says so rather
     than implying a longer one exists. */
  const CATEGORIES = [
    { key: 'essential', label: 'Essential', locked: true,
      note: 'Makes the site work — your form entries and this choice. No tracking.' },
    { key: 'analytics', label: 'Analytics', locked: false,
      note: 'Which pages get used and which links get clicked, so we can improve them. Google Analytics.' },
  ];

  if (!SL_GA_ID) return;                     /* not configured: stay inert */

  /* ---- Consent state -------------------------------------------------
     Stored as an object, one flag per category, so adding a category later
     does not invalidate a decision already made about the others.
     localStorage throws in some privacy modes rather than returning null,
     and an analytics banner is never worth breaking a page over. */
  function readConsent() {
    try {
      const raw = window.localStorage.getItem(CONSENT_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }
  function writeConsent(obj) {
    try { window.localStorage.setItem(CONSENT_KEY, JSON.stringify(obj)); } catch (e) { /* ignore */ }
  }

  const saved = readConsent();
  let granted = !!(saved && saved.analytics);

  /* ---- GA4 -----------------------------------------------------------
     Loaded once, only after consent. */
  let loaded = false;
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }

  function loadGA() {
    if (loaded) return;
    loaded = true;
    const s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(SL_GA_ID);
    document.head.appendChild(s);

    gtag('js', new Date());
    gtag('config', SL_GA_ID, {
      /* No cross-domain linker: it stitches sessions WITHIN one property,
         and these are three. Setting it here would imply a continuity the
         data cannot have. See the note on SL_GA_IDS above. */
      /* Truncates the visitor's IP before storage. Not required once
         consent has been given, kept because it costs nothing and the
         full address was never wanted for anything. */
      anonymize_ip: true,
    });
  }

  if (granted) loadGA();

  /* ---- The one function the rest of the file calls --------------------
     Silent unless consent has been given. Every listener below is wired
     regardless, so nothing has to be re-attached at the moment someone
     accepts — the events simply start counting. */
  function track(name, params) {
    if (!granted || !loaded) return;
    gtag('event', name, params || {});
  }
  window.slTrack = track;

  /* ---- Banner ---------------------------------------------------------
     Three ways out, and none of them is a trap:
       Accept all        every category on
       Accept minimum    essential only — one click, same as Accept all
       Choose            expands the toggles, then Save

     "Accept minimum" is a single click sitting next to "Accept all",
     deliberately. A banner where refusing costs three clicks and a hunt
     through a settings panel is technically a choice and practically not
     one. Declining here is exactly as easy as accepting.

     It hides the dock and the back-to-top button while it is up, the same
     way the drawer does, because all three live in the bottom of the
     viewport and the decision should not be competing with a CTA. */
  function showBanner() {
    const wrap = document.createElement('div');
    wrap.className = 'sl-consent';
    wrap.setAttribute('role', 'dialog');
    wrap.setAttribute('aria-label', 'Cookie choices');

    const toggles = CATEGORIES.map(function (c) {
      return '<label class="sl-consent__opt">' +
        '<input type="checkbox" data-sl-cat="' + c.key + '"' +
        (c.locked ? ' checked disabled' : ' checked') + '/>' +
        '<span><strong>' + c.label + (c.locked ? ' · always on' : '') + '</strong>' +
        '<span class="sl-consent__note">' + c.note + '</span></span></label>';
    }).join('');

    wrap.innerHTML =
      '<div class="sl-consent__row">' +
        '<p class="sl-consent__text">We\u2019d like to measure how this site is used, so we can see ' +
        'which pages actually help. Nothing is measured unless you say so, and nothing is sold on. ' +
        '<a href="legal.html#cookie-policy">How we use cookies</a>.</p>' +
        '<div class="sl-consent__actions">' +
          '<button type="button" class="sl-consent__btn" data-sl-act="choose" aria-expanded="false">Choose</button>' +
          '<button type="button" class="sl-consent__btn" data-sl-act="minimum">Accept minimum</button>' +
          '<button type="button" class="sl-consent__btn sl-consent__btn--yes" data-sl-act="all">Accept all</button>' +
        '</div>' +
      '</div>' +
      '<div class="sl-consent__panel" hidden>' + toggles +
        '<button type="button" class="sl-consent__btn sl-consent__btn--yes" data-sl-act="save">Save choices</button>' +
      '</div>';

    document.body.appendChild(wrap);
    document.body.classList.add('sl-consent-open');

    function settle(choice) {
      writeConsent(choice);
      wrap.remove();
      document.body.classList.remove('sl-consent-open');
      if (choice.analytics) { granted = true; loadGA(); track('consent_granted'); }
    }

    wrap.addEventListener('click', function (e) {
      const btn = e.target.closest('[data-sl-act]');
      if (!btn) return;
      const act = btn.getAttribute('data-sl-act');
      const panel = wrap.querySelector('.sl-consent__panel');

      if (act === 'choose') {
        const open = !panel.hidden;
        panel.hidden = open;
        btn.setAttribute('aria-expanded', String(!open));
        return;
      }
      if (act === 'all') return settle({ essential: true, analytics: true });
      if (act === 'minimum') return settle({ essential: true, analytics: false });
      if (act === 'save') {
        const choice = { essential: true };
        CATEGORIES.forEach(function (c) {
          if (c.locked) return;
          const box = wrap.querySelector('[data-sl-cat="' + c.key + '"]');
          choice[c.key] = !!(box && box.checked);
        });
        return settle(choice);
      }
    });
  }

  /* Lets the legal page offer "change your cookie choices" without this
     file needing to know that page exists. Wired to any element carrying
     data-sl-consent-reopen, so the legal copy can move or be reworded
     without touching this file. */
  window.slConsentReopen = function () {
    if (document.querySelector('.sl-consent')) return;
    showBanner();
  };
  document.addEventListener('click', function (e) {
    const link = e.target.closest && e.target.closest('[data-sl-consent-reopen]');
    if (!link) return;
    e.preventDefault();
    window.slConsentReopen();
  });

  /* ---- Event wiring ---------------------------------------------------
     All delegated from document, so none of this needs a data attribute
     in any of the 31 pages and a new page is covered the day it is added.
     Naming follows GA4's own recommended events where one fits
     (generate_lead) and is plainly descriptive where none does. */

  const host = window.location.hostname;

  /* Which of the three sites this is. Mapped explicitly rather than taking
     the first label of the hostname: that returned "127" on localhost and
     would return a preview subdomain's name on a Cloudflare preview build,
     quietly filing test traffic under invented site names that then need
     explaining in the reports. Anything not one of ours is "other", which
     is both true and easy to exclude. */
  const SITES = {
    'sunlogic.co.za': 'apex',
    'www.sunlogic.co.za': 'apex',
    'energy.sunlogic.co.za': 'energy',
    'electrical.sunlogic.co.za': 'electrical',
  };
  const siteOf = (h) => SITES[h] || 'other';

  document.addEventListener('click', function (e) {
    const a = e.target.closest && e.target.closest('a, button');
    if (!a) return;
    const href = a.getAttribute && a.getAttribute('href');
    const label = (a.textContent || '').trim().slice(0, 60);

    if (href && href.indexOf('tel:') === 0) {
      return track('phone_click', { number: href.replace('tel:', ''), from_site: siteOf(host) });
    }
    if (href && href.indexOf('mailto:') === 0) {
      return track('email_click', { address: href.replace('mailto:', ''), from_site: siteOf(host) });
    }
    if (a.classList.contains('sl-footer__social')) {
      return track('social_click', { network: (a.getAttribute('aria-label') || '').split(' ')[0] });
    }
    if (a.classList.contains('sl-totop')) {
      return track('back_to_top', { page: window.location.pathname });
    }

    /* A link to one of our own other hosts. This is the number the promo
       and the cross-sell buttons exist to move, so it carries where it was
       clicked from: nav, footer, the promo card, or a cross-sell button. */
    if (href && /^https?:\/\//.test(href)) {
      let h;
      try { h = new URL(href, window.location.href).hostname; } catch (err) { h = ''; }
      if (h && h !== host && /(^|\.)sunlogic\.co\.za$/i.test(h)) {
        const place = a.closest('.sl-hero--promo') ? 'division_promo'
          : a.closest('.sl-nav') ? 'nav'
          : a.closest('.sl-drawer') ? 'drawer'
          : a.closest('.sl-footer') ? 'footer'
          : a.closest('.sl-split-copy, dl-card') ? 'cross_sell'
          : 'body';
        return track('cross_site_click', {
          from_site: siteOf(host), to_site: siteOf(h), placement: place, link_text: label,
        });
      }
      /* Leaving Sunlogic altogether — a manufacturer, a government page,
         the social accounts, the site credit. GA4's enhanced measurement
         has an outbound click of its own, but it cannot know WHERE on the
         page the link sat, and "which section sends people away" is the
         useful half. Social links are excluded: they are handled above
         with the network named. */
      if (h && h !== host && !a.classList.contains('sl-footer__social')) {
        return track('outbound_click', {
          from_site: siteOf(host), destination: h, link_text: label,
          placement: a.closest('.sl-footer') ? 'footer'
            : a.closest('.sl-prose') ? 'article_body' : 'body',
        });
      }
    }

    /* Anything that opens the quote/contact path. */
    if (a.classList.contains('sl-dock__cta') || a.classList.contains('sl-btn')) {
      const opensContact = href && /contact(\.html)?(#|$|\?)/.test(href);
      if (opensContact) {
        return track('contact_cta_click', {
          label: label, placement: a.closest('.sl-dock') ? 'dock'
            : a.closest('.sl-hero') ? 'hero'
            : a.closest('.sl-cta') ? 'closing_cta'
            : a.closest('.sl-nav') ? 'nav' : 'body',
          from_site: siteOf(host),
        });
      }
    }
  });

  /* Started filling the form. Fires once — the useful number is how many
     people begin against how many finish, not how many keystrokes. */
  let formStarted = false;
  document.addEventListener('input', function (e) {
    if (formStarted) return;
    if (!e.target.closest || !e.target.closest('form[data-dl-form]')) return;
    formStarted = true;
    track('contact_form_start', { from_site: siteOf(host), page: window.location.pathname });
  }, true);

  /* Submitted. The `need` value is the division, which is the thing worth
     segmenting on: it says which trade the traffic is actually for. */
  document.addEventListener('submit', function (e) {
    const form = e.target.closest && e.target.closest('form[data-dl-form]');
    if (!form) return;
    const need = form.querySelector('[name="need"]');
    track('generate_lead', {
      from_site: siteOf(host),
      page: window.location.pathname,
      division: need ? need.value : '',
    });
  }, true);

  /* The calculator already announces itself; forms.js dispatches
     dl-form-success for an inline confirmation and the calculator's own
     submit path goes through the same form handler. Listening for the
     event rather than reaching into the plugin keeps this file out of the
     plugin's internals. */
  document.addEventListener('dl-form-success', function () {
    track('form_success', { from_site: siteOf(host), page: window.location.pathname });
  });

  /* ---- Where they get to, and where they stop ------------------------
     GA4 answers two of the four questions on its own and needs help with
     the other two:

       where traffic comes FROM   automatic (referrer, UTM, session source)
       how long they stay         automatic (engagement time per page)
       where they GO              partly — page_view covers within a site,
                                  cross_site_click covers the hand-off
       where they DROP OFF        not at all, without the below

     "Average time on page" is a poor answer to "where did I lose them",
     because a long time can mean absorbed or lost. Depth and progress say
     which. */

  /* Scroll depth. GA4's own enhanced measurement fires once, at 90%, which
     tells you who finished and nothing about who did not. Quarter marks
     turn a long page into a drop-off curve: 25/50/75/100 with a big fall
     between two of them names the section people stop at. Fires once each
     per page view. */
  (function () {
    const marks = [25, 50, 75, 100];
    const hit = {};
    function check() {
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - window.innerHeight;
      if (scrollable < 240) return;            /* nothing to scroll through */
      const pct = Math.min(100, Math.round((window.scrollY / scrollable) * 100));
      marks.forEach(function (m) {
        if (pct >= m && !hit[m]) {
          hit[m] = true;
          track('scroll_depth', { percent: m, page: location.pathname, from_site: siteOf(host) });
        }
      });
    }
    let ticking = false;
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(function () { ticking = false; check(); }); }
    }, { passive: true });
  })();

  /* Time actually spent looking at the page, not time the tab existed.
     The clock stops when the tab is hidden, so a page left open in a
     background tab overnight does not report as the most engaging page on
     the site — which is exactly how naive time-on-page metrics mislead. */
  (function () {
    const marks = [15, 30, 60, 120, 300];
    const hit = {};
    let spent = 0;
    let since = document.visibilityState === 'visible' ? Date.now() : 0;

    function accrue() {
      if (since) { spent += (Date.now() - since) / 1000; since = 0; }
    }
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'visible') since = Date.now();
      else accrue();
    });
    setInterval(function () {
      if (document.visibilityState !== 'visible') return;
      const now = spent + (since ? (Date.now() - since) / 1000 : 0);
      marks.forEach(function (m) {
        if (now >= m && !hit[m]) {
          hit[m] = true;
          track('engaged_time', { seconds: m, page: location.pathname, from_site: siteOf(host) });
        }
      });
    }, 5000);
  })();

  /* Form drop-off, which is the one that pays for itself.
     contact_form_start against generate_lead already gives a rate; this
     gives a REASON, by reporting the last field the visitor actually
     filled before leaving. If people consistently stop at "Suburb", that
     is a fixable fact about the form rather than a mystery about intent. */
  (function () {
    let lastField = '';
    let submitted = false;

    document.addEventListener('input', function (e) {
      const f = e.target.closest && e.target.closest('form[data-dl-form] [name]');
      if (f && f.name && f.name !== 'website') lastField = f.name;   /* never the honeypot */
    }, true);

    document.addEventListener('submit', function (e) {
      if (e.target.closest && e.target.closest('form[data-dl-form]')) submitted = true;
    }, true);

    /* pagehide, not beforeunload: beforeunload is unreliable on mobile and
       blocks the back/forward cache. */
    window.addEventListener('pagehide', function () {
      if (!lastField || submitted) return;
      track('contact_form_abandon', {
        last_field: lastField, page: location.pathname, from_site: siteOf(host),
      });
    });
  })();

  document.addEventListener('DOMContentLoaded', function () {
    /* The calculator is a plugin with its own submit button inside a
       custom element; catching it here rather than in the plugin keeps
       the plugin free of anything site-specific. */
    document.addEventListener('click', function (e) {
      if (!e.target.closest) return;
      if (e.target.closest('.plugin-calc-submit')) {
        track('calculator_submit', { from_site: siteOf(host) });
      }
    });
    if (!readConsent()) showBanner();
  });
})();
