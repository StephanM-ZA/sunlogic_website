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
