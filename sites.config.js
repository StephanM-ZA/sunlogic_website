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
    /* The current site, unchanged. Its nav and footer stay hardcoded in
       components.js for now, so this build is byte-for-byte what it is today. */
    nav: null,
    footer: null,
  },

  {
    key: 'energy',
    domain: 'https://energy.sunlogic.co.za',
    src: 'site-energy',
    out: 'dist/energy',
    nav: null,
    footer: null,
  },

  {
    key: 'electrical',
    domain: 'https://electrical.sunlogic.co.za',
    src: 'site-electrical',
    out: 'dist/electrical',
    nav: null,
    footer: null,
  },
];

module.exports = {
  SITES,
  byKey: (key) => SITES.find((s) => s.key === key),
};
