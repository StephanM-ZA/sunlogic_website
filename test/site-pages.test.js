'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { sitePages, EXCLUDED_PAGES } = require('../scripts/site-pages.js');

function fixtureDist(layout) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sl-pages-'));
  for (const [site, files] of Object.entries(layout)) {
    fs.mkdirSync(path.join(dir, site), { recursive: true });
    for (const f of files) fs.writeFileSync(path.join(dir, site, f), '<!doctype html>');
  }
  return dir;
}

test('finds every html page in every site directory', () => {
  const dist = fixtureDist({ main: ['index.html', 'solar.html'], energy: ['index.html'] });
  const pages = sitePages(dist);
  assert.deepStrictEqual(pages.map((p) => p.url),
    ['/energy/index.html', '/main/index.html', '/main/solar.html']);
});

test('returns site and file alongside the url', () => {
  const dist = fixtureDist({ main: ['index.html'] });
  assert.deepStrictEqual(sitePages(dist)[0], { site: 'main', file: 'index.html', url: '/main/index.html' });
});

test('skips the deliberately non-indexable pages', () => {
  const dist = fixtureDist({ main: ['index.html', 'thank-you.html', 'ci-guide.html', 'landing-preview.html'] });
  assert.deepStrictEqual(sitePages(dist).map((p) => p.file), ['index.html']);
});

test('ignores non-html files', () => {
  const dist = fixtureDist({ main: ['index.html', 'robots.txt', 'sitemap.xml'] });
  assert.deepStrictEqual(sitePages(dist).map((p) => p.file), ['index.html']);
});

// The bug this module exists to prevent: dist/*.html matched nothing after the
// three-site split and Lighthouse audited zero pages while passing green.
test('throws rather than returning an empty set', () => {
  const dist = fixtureDist({ main: ['thank-you.html'] });
  assert.throws(() => sitePages(dist), /no pages found/);
});

test('throws when dist does not exist at all', () => {
  assert.throws(() => sitePages('/nope/not/here'), /does not exist/);
});

test('exports the exclusion list for consumers that need it', () => {
  assert.ok(EXCLUDED_PAGES instanceof Set);
  assert.ok(EXCLUDED_PAGES.has('thank-you.html'));
});

/* The site filter. It exists so local iteration can check one site instead of
   all three; these guard the two ways that could go wrong — silently matching
   nothing, and silently checking more than asked. */

test('narrows to the named site', () => {
  const dist = fixtureDist({ main: ['index.html', 'legal.html'], energy: ['index.html'], electrical: ['index.html'] });
  assert.deepStrictEqual(sitePages(dist, { sites: ['main'] }).map((p) => p.url),
    ['/main/index.html', '/main/legal.html']);
});

test('narrows to several named sites', () => {
  const dist = fixtureDist({ main: ['index.html'], energy: ['index.html'], electrical: ['index.html'] });
  assert.deepStrictEqual(sitePages(dist, { sites: ['energy', 'electrical'] }).map((p) => p.site),
    ['electrical', 'energy']);
});

test('an unknown site name throws rather than matching nothing', () => {
  const dist = fixtureDist({ main: ['index.html'], energy: ['index.html'] });
  assert.throws(() => sitePages(dist, { sites: ['man'] }), /unknown site\(s\) man/);
});

test('a typo alongside a real site still throws', () => {
  const dist = fixtureDist({ main: ['index.html'], energy: ['index.html'] });
  assert.throws(() => sitePages(dist, { sites: ['main', 'enrgy'] }), /unknown site\(s\) enrgy/);
});

test('no filter, or an empty one, means every site', () => {
  const dist = fixtureDist({ main: ['index.html'], energy: ['index.html'] });
  const all = sitePages(dist).map((p) => p.url);
  assert.deepStrictEqual(sitePages(dist, {}).map((p) => p.url), all);
  assert.deepStrictEqual(sitePages(dist, { sites: [] }).map((p) => p.url), all);
});
