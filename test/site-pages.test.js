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
