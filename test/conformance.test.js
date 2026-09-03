'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { runConformance } = require('../scripts/conformance.js');
const ROOT = path.join(__dirname, '..');

/* A dist-shaped directory containing one page copied from test/fixtures, with
   shared/ alongside it so the page's relative asset paths resolve. */
function distWith(fixture) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sl-conf-'));
  const site = path.join(dir, 'main');
  fs.mkdirSync(site, { recursive: true });
  const html = fs.readFileSync(path.join(ROOT, 'test', 'fixtures', fixture), 'utf8')
    .replace(/\.\.\/\.\.\/shared\//g, 'shared/')
    .replace(/\.\.\/\.\.\/site-main\//g, '');
  fs.writeFileSync(path.join(site, 'index.html'), html);
  fs.cpSync(path.join(ROOT, 'shared'), path.join(site, 'shared'), { recursive: true });
  return dir;
}

test('a conformant page produces no fails', async () => {
  const r = await runConformance({ distDir: distWith('engine-smoke.html') });
  assert.strictEqual(r.fails.length, 0, JSON.stringify(r.fails, null, 1));
});

// THE WATCHMAN TEST. Without this, every silent-pass mode returns the first
// time someone refactors: the gate would report clean over nothing at all and
// nobody would notice, which is exactly what the empty Lighthouse glob did.
test('a non-conformant page makes the gate fail', async () => {
  const r = await runConformance({ distDir: distWith('accent-fail.html') });
  assert.ok(r.fails.length > 0, 'the gate did not reject a deliberately broken page');
  assert.ok(r.fails.some((f) => f.rule === 'accent'));
});

// Proves the freeze actually works, not merely that it was called: the fixture
// starts a 5s colour transition from one palette colour to another right as the
// page parses, so without disabling transitions first the check would sample an
// interpolated, off-palette RGB triple and wrongly warn. Both endpoints are
// system colours — only a mid-flight sample is a problem.
test('measures resting colour, not a frame mid-transition', async () => {
  const r = await runConformance({ distDir: distWith('palette-pass-transition.html') });
  assert.ok(!r.warns.some((w) => w.rule === 'palette'),
    'palette warning fired — the runner read an animated frame instead of the resting colour: ' +
    JSON.stringify(r.warns.filter((w) => w.rule === 'palette'), null, 1));
});

test('every discovered page is actually evaluated', async () => {
  const r = await runConformance({ distDir: distWith('engine-smoke.html') });
  assert.strictEqual(r.pages, 1);
  assert.strictEqual(r.evaluated, r.pages);
});

test('a page without the engine is an integrity breach, not a clean page', async () => {
  const dir = distWith('engine-smoke.html');
  const page = path.join(dir, 'main', 'index.html');
  fs.writeFileSync(page,
    fs.readFileSync(page, 'utf8').replace(/<script src="shared\/sunlogic-check\.js"[^>]*><\/script>/, ''));
  await assert.rejects(() => runConformance({ distDir: dir }), /did not expose window\.SL_CHECK/);
});

test('an empty dist is an error, not a pass', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sl-conf-empty-'));
  fs.mkdirSync(path.join(dir, 'main'), { recursive: true });
  await assert.rejects(() => runConformance({ distDir: dir }), /no pages found/);
});
