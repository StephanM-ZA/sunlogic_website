'use strict';

const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const { chromium } = require(path.join(ROOT, 'node_modules', 'playwright'));
const { startServer } = require('../scripts/static-server.js');

let server, browser;

test.before(async () => {
  server = await startServer(ROOT);
  browser = await chromium.launch();
});
test.after(async () => {
  await browser.close();
  server.close();
});

async function check(fixture) {
  const page = await browser.newPage({ viewport: { width: 412, height: 823 } });
  await page.goto(server.urlFor('/test/fixtures/' + fixture), { waitUntil: 'load' });
  const result = await page.evaluate(() => window.SL_CHECK && window.SL_CHECK.run());
  await page.close();
  return result;
}

test('engine is exposed and returns the documented shape', async () => {
  const r = await check('engine-smoke.html');
  assert.ok(r, 'window.SL_CHECK.run() returned nothing — the engine is not exposed');
  assert.ok(Array.isArray(r.fails));
  assert.ok(Array.isArray(r.warns));
  assert.strictEqual(typeof r.info.placeholders, 'number');
});

test('every finding carries a rule, a why, a detail and a string selector', async () => {
  const r = await check('engine-smoke.html');
  for (const f of [...r.fails, ...r.warns]) {
    assert.strictEqual(typeof f.rule, 'string', 'rule must be a string');
    assert.ok(f.why && f.why.length > 20, 'rule ' + f.rule + ' has no stated intent');
    assert.strictEqual(typeof f.detail, 'string');
    assert.strictEqual(typeof f.selector, 'string',
      'selector must be a string — a DOM node cannot cross page.evaluate()');
  }
});

test('every rule id has a why', async () => {
  const page = await browser.newPage();
  await page.goto(server.urlFor('/test/fixtures/engine-smoke.html'), { waitUntil: 'load' });
  const why = await page.evaluate(() => window.SL_CHECK.WHY);
  await page.close();
  for (const id of ['surface', 'palette', 'type', 'elevation', 'accent', 'copy', 'rhythm', 'limit', 'a11y']) {
    assert.ok(why[id] && why[id].length > 20, 'no why for rule: ' + id);
  }
});

/* --- rhythm ---------------------------------------------------------- */

test('rhythm: two adjacent sections sharing a background is a fail', async () => {
  const r = await check('rhythm-fail.html');
  assert.ok(r.fails.some((f) => f.rule === 'rhythm'), 'expected a rhythm fail');
});

// Regression: a .sl-hero nested in a section is a card wearing the hero's
// layer stack, not a band. Two side by side in a grid used to read as
// "adjacent bands sharing a background" and blocked a legitimate page.
test('rhythm: two nested .sl-hero cards in one grid are not adjacent bands', async () => {
  const r = await check('rhythm-pass-nested-hero.html');
  assert.deepStrictEqual(r.fails.filter((f) => f.rule === 'rhythm'), []);
});

/* --- accent ---------------------------------------------------------- */

test('accent: three emphasis buttons in view is a fail', async () => {
  const r = await check('accent-fail.html');
  assert.ok(r.fails.some((f) => f.rule === 'accent'), 'expected an accent fail');
});

// Regression: a dialog is its own view with its own emphasis budget, and while
// it is open the page behind it is inert. Its submit button used to count
// toward the page's limit.
test('accent: an emphasis button inside a dialog does not count', async () => {
  const r = await check('accent-pass-dialog.html');
  assert.deepStrictEqual(r.fails.filter((f) => f.rule === 'accent'), []);
});

/* --- copy ------------------------------------------------------------ */

test('copy: an ALL CAPS heading is a fail', async () => {
  const r = await check('copy-fail-allcaps.html');
  assert.ok(r.fails.some((f) => f.rule === 'copy'), 'expected a copy fail');
});

/* --- a11y ------------------------------------------------------------ */

test('a11y: an image with no alt text is a fail', async () => {
  const r = await check('a11y-fail-noalt.html');
  assert.ok(r.fails.some((f) => f.rule === 'a11y' && /alt/.test(f.detail)));
});
