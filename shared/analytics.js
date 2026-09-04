/* ============================================================
   SUNLOGIC ANALYTICS
   One GA4 property across three hosts, behind a consent gate.

   Nothing here runs until SL_GA_ID below is filled in. With it empty the
   file is inert: no banner, no cookies, no network. That is deliberate —
   shipping the wiring before the property exists should change nothing a
   visitor can see.

   TWO DECISIONS ARE BAKED IN, both made explicitly:

   1. ONE property, cross-domain. sunlogic.co.za, energy.* and electrical.*
      are three hosts that read as one company, and the closing promo on
      each division site exists to send people to the other one. Left
      alone, GA4 ends the session at the host boundary and records the
      other Sunlogic site as the referrer — so the cross-sell would show up
      as external traffic and the journey that produced a lead would be
      split across two sessions. Listing all three below keeps one visit
      one visit.

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
     Paste the GA4 Measurement ID here (looks like G-XXXXXXXXXX). One ID:
     all three sites report into the same property on purpose. */
  const SL_GA_ID = '';

  /* Every host the property covers. GA4 needs these to treat a hop
     between them as one session rather than a new one with a referrer. */
  const SL_DOMAINS = ['sunlogic.co.za', 'energy.sunlogic.co.za', 'electrical.sunlogic.co.za'];

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
      /* The three hosts as one property. */
      linker: { domains: SL_DOMAINS, accept_incoming: true },
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
  const siteOf = (h) => (h.split('.')[0] === 'sunlogic' ? 'apex' : h.split('.')[0]);

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
