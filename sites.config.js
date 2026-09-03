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
      { href: '/', key: 'home', label: 'Home' },
      { href: 'https://energy.sunlogic.co.za', key: 'solar', label: 'Solar' },
      { href: 'https://electrical.sunlogic.co.za', key: 'electrical', label: 'Electrical', accent: 'navy' },
    ],
    footer: null,
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
    nav: null,
    footer: null,
    logo: 'images/sl_logo_energy_blue.svg',
    logoWhite: 'images/sl_logo_white.svg',
    logoVertical: 'images/sl_logo_verticle_energy_white.svg',
  },

  {
    key: 'electrical',
    domain: 'https://electrical.sunlogic.co.za',
    src: 'site-electrical',
    out: 'dist/electrical',
    nav: null,
    footer: null,
    logo: 'images/sl_logo_electrical_blue.svg',
    logoWhite: 'images/sl_logo_white.svg',
    logoVertical: 'images/sl_logo_verticle_electrical_white.svg',
  },
];

module.exports = {
  SITES,
  byKey: (key) => SITES.find((s) => s.key === key),
};
