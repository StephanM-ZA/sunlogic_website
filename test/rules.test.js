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

/* --- type: SVG text ---------------------------------------------------- */

// 63 of the 150 warnings measured on 2026-09-03 were <text> inside inline SVG.
// SVG text does not inherit the page font, so it computes to the UA's
// monospace and the rule flagged every label in every diagram.
test('type: SVG text inherits the mono face rather than the UA default', async () => {
  const r = await check('type-pass-svg.html');
  assert.deepStrictEqual(r.warns.filter((w) => w.rule === 'type'), []);
});

/* --- a11y: inline links ------------------------------------------------ */

// 75 of the 150 were inline text links measured against a 44px minimum that
// exists for buttons. The rule already exempts .sl-footer and .sl-nav__links
// for this reason; prose and the contact roll are the same case.
test('a11y: an inline text link inside prose is not a touch target', async () => {
  const r = await check('a11y-pass-inline-link.html');
  assert.deepStrictEqual(r.warns.filter((w) => w.rule === 'a11y'), []);
});

/* --- a11y: computed display, not just container --------------------- */

// A container allow-list only covers the containers someone thought to list.
// `display: inline` is the general case: a link laid out as text, wherever it
// lives, is not a tap target. A `display: block` link under 44px outside any
// exempt container is still a genuine finding — the display check narrows
// the rule, it doesn't gut it.
test('a11y: an inline-display link is exempt, a block-display link under 44px is still flagged', async () => {
  const r = await check('a11y-inline-vs-block-link.html');
  const findings = r.warns.filter((w) => w.rule === 'a11y');
  assert.strictEqual(findings.length, 1, 'expected exactly one a11y warning, for the block link');
  assert.match(findings[0].detail, /20px tall, minimum is 44px/);
});

/* --- copy: sentence case with a proper noun ---------------------------- */

// The rule counts long words starting with a capital, so a sentence-case
// sub-head containing a proper noun trips it: "Cape Town's own structure" has
// 3 long words of which 2 are capitalised. A proper noun is not Title Case.
test('copy: a sentence-case prose sub-head with a proper noun is not flagged', async () => {
  const r = await check('copy-pass-proper-noun.html');
  assert.deepStrictEqual(r.warns.filter((w) => w.rule === 'copy'), []);
});
