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

function sitePages(distDir) {
  if (!fs.existsSync(distDir)) {
    throw new Error('site-pages: ' + distDir + ' does not exist — run `npm run build` first.');
  }
  const sites = fs
    .readdirSync(distDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

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
