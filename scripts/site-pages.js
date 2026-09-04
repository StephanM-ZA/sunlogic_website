'use strict';

/* The single definition of "every page of every site".
 *
 * This module exists because the duplication rotted. lighthouserc.js had its
 * own copy of discovery that globbed dist/*.html — correct while the build
 * produced one site straight into dist/, wrong the moment dist/ held only
 * site directories. It matched nothing, Lighthouse audited zero pages, and the
 * job passed green for weeks because there was nothing in it to fail.
 *
 * One module means a fourth site or a new page is picked up by every consumer
 * or by none, never by one of them. */

const fs = require('fs');
const path = require('path');

/* Deliberately not indexable, so Lighthouse's is-crawlable audit correctly
 * fails on them: thank-you.html is reachable only after a submit,
 * ci-guide.html is an internal design document, and landing-preview.html
 * carries its own noindex while the apex rebuild is in progress. */
const EXCLUDED_PAGES = new Set(['thank-you.html', 'ci-guide.html', 'landing-preview.html']);

/* `options.sites` narrows the set to the named site directories. It exists for
 * local iteration only — checking 11 pages instead of 34 while editing one
 * site. Nothing on a deploy path passes it: the Cloudflare build command and
 * both workflows call the runner bare, which is what keeps the gate whole.
 *
 * An unknown name throws rather than quietly matching nothing, for the same
 * reason this module exists at all — `sitePages(dist, {sites:['man']})`
 * returning zero pages would report a clean run over a typo. */
function sitePages(distDir, options) {
  const opts = options || {};
  if (!fs.existsSync(distDir)) {
    throw new Error('site-pages: ' + distDir + ' does not exist — run `npm run build` first.');
  }
  const built = fs
    .readdirSync(distDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  let sites = built;
  if (opts.sites && opts.sites.length) {
    const unknown = opts.sites.filter((s) => !built.includes(s));
    if (unknown.length) {
      throw new Error(
        'site-pages: unknown site(s) ' + unknown.join(', ') + '. Built sites are: ' +
        built.join(', ') + '. Refusing to run over nothing.');
    }
    sites = built.filter((s) => opts.sites.includes(s));
  }

  const pages = sites.flatMap((site) =>
    fs
      .readdirSync(path.join(distDir, site))
      .filter((file) => file.endsWith('.html') && !EXCLUDED_PAGES.has(file))
      .sort()
      .map((file) => ({ site, file, url: '/' + site + '/' + file })));

  /* Loudly, not quietly. An empty set is indistinguishable from a clean run
   * downstream, and that is exactly how this went unnoticed before. */
  if (pages.length === 0) {
    throw new Error(
      'site-pages: no pages found under ' + distDir + '. Run `npm run build` first. ' +
      'Failing rather than reporting a clean run over nothing.');
  }
  return pages;
}

module.exports = { sitePages, EXCLUDED_PAGES };
