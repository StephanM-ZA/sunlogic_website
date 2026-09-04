/* Per-site configuration for the three Sunlogic sites.
 *
 *   sunlogic.co.za              site-main        the current full site, unchanged
 *   energy.sunlogic.co.za       site-energy      holding page
 *   electrical.sunlogic.co.za   site-electrical  holding page
 *
 * All three build from this one repo and share shared/, which is copied into
 * each site's output so every page's existing relative reference to
 * shared/sunlogic.css keeps working untouched.
 *
 * Directory names match the domain each one serves, so the mapping stays
 * obvious. When content is eventually split, pages move between these
 * directories; the directories and their domains do not change.
 *
 * `nav` and `footer` are injected into every page as window.SL_SITE by
 * scripts/build-site.js, the same way window.SL_BUILD already is. They are
 * null on the holding sites because those pages have no nav or footer.
 */

'use strict';

const SITES = [
  {
    key: 'main',
    domain: 'https://sunlogic.co.za',
    src: 'site-main',
    out: 'dist/main',
    /* The apex is a company landing page that routes to the two divisions, so
       its nav points at the subdomains rather than at pages on this domain.
       No Energy tab: energy-management lives on the energy site. */
    nav: [
      /* Real URLs, not filenames: this list is injected as JSON and the
         build's extensionless rewrite only matches quoted paths in HTML and
         single-quoted paths in JS, so it would not touch these. */
      /* Labelled About, not Home: the apex is the company page and the two
         divisions are the destinations, so the first tab describes what it
         is rather than where it sits. The key stays `home` — it is the
         route's identity, matched against each page's active= attribute. */
      { href: '/', key: 'home', label: 'About' },
      { href: 'https://energy.sunlogic.co.za', key: 'energy', label: 'Energy' },
      { href: 'https://electrical.sunlogic.co.za', key: 'electrical', label: 'Electrical', accent: 'navy' },
    ],
    /* Columns of [label, href]. No Energy and no Worth knowing: energy-management
       lives on the energy site and each division site carries its own blog, so
       the apex has nothing of either to link to. Real URLs, not filenames, for
       the same reason as nav above. */
    footer: [
      [['Energy', 'https://energy.sunlogic.co.za'], ['Electrical', 'https://electrical.sunlogic.co.za']],
      [['Contact', '/contact'], ['Legal', '/legal']],
    ],
    /* Per-site logo artwork. Same filenames would have been simpler, but these
       are three distinct lockups, so the path is config rather than convention.
       `logoWhite` is the horizontal wordmark for dark grounds (the mobile
       drawer); there is no per-site artwork for it yet, so all three still
       point at the shared white lockup. */
    logo: 'images/sl_logo_main_blue.svg',
    logoWhite: 'images/sl_logo_white.svg',
    logoVertical: 'images/sl_logo_verticle_main_white.svg',
  },

  {
    key: 'energy',
    domain: 'https://energy.sunlogic.co.za',
    src: 'site-energy',
    out: 'dist/energy',
    /* Each division site leads with its own division and carries exactly one
       link across to the other, listed last, so the site reads as that
       division's rather than as a shared two-trade site.
       ------------------------------------------------------------------
       Until now both division sites had nav: null and fell through to the
       fallback list in shared/components.js — Home · Solar · Electrical ·
       Energy. That single shared default is why each site carried the other
       division's pages at all, and it still used the pre-rename names. A
       real list per site is what actually separates them.

       Four links, not five: shared/sunlogic-check.js fails a nav with more
       than four ("a fifth turns a route into a menu"), so the blog stays a
       footer link — Worth knowing — exactly where it already was. */
    nav: [
      { href: 'index.html', key: 'home', label: 'Home' },
      { href: 'solar.html', key: 'solar', label: 'Energy' },
      { href: 'energy-management.html', key: 'smart', label: 'Smart Solutions' },
      /* Absolute, so the build's extensionless rewrite leaves it alone and it
         crosses to the other host. Navy wherever Electrical appears. */
      { href: 'https://electrical.sunlogic.co.za', key: 'electrical', label: 'Electrical', accent: 'navy' },
    ],
    footer: [
      [['Energy', 'solar.html'], ['Smart Solutions', 'energy-management.html'],
       ['Worth knowing', 'blog.html'], ['Electrical', 'https://electrical.sunlogic.co.za']],
      [['Contact', 'contact.html'], ['Legal', 'legal.html']],
    ],
    logo: 'images/sl_logo_energy_blue.svg',
    logoWhite: 'images/sl_logo_white.svg',
    logoVertical: 'images/sl_logo_verticle_energy_white.svg',
  },

  {
    key: 'electrical',
    domain: 'https://electrical.sunlogic.co.za',
    src: 'site-electrical',
    out: 'dist/electrical',
    /* Mirror of the energy site's list — own division first, one link across
       to the other last. See that entry for why these exist at all. */
    nav: [
      { href: 'index.html', key: 'home', label: 'Home' },
      { href: 'electrical.html', key: 'electrical', label: 'Electrical', accent: 'navy' },
      { href: 'energy-management.html', key: 'smart', label: 'Smart Solutions' },
      { href: 'https://energy.sunlogic.co.za', key: 'energy', label: 'Energy' },
    ],
    footer: [
      [['Electrical', 'electrical.html'], ['Smart Solutions', 'energy-management.html'],
       ['Worth knowing', 'blog.html'], ['Energy', 'https://energy.sunlogic.co.za']],
      [['Contact', 'contact.html'], ['Legal', 'legal.html']],
    ],
    logo: 'images/sl_logo_electrical_blue.svg',
    logoWhite: 'images/sl_logo_white.svg',
    logoVertical: 'images/sl_logo_verticle_electrical_white.svg',
  },
];

module.exports = {
  SITES,
  byKey: (key) => SITES.find((s) => s.key === key),
};
