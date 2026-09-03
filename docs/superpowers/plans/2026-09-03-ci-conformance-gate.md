# CI Conformance Gate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A design-system violation or Lighthouse budget breach blocks the deploy on all three Sunlogic sites, and the failure report tells you whether the page or the rule is wrong.

**Architecture:** One ruleset, two consumers. `shared/sunlogic-check.js` splits into a rule engine returning findings and a browser presenter keeping today's badge. A headless Playwright runner calls the same engine over every built page. Page discovery becomes one shared module so it cannot rot in one consumer and not the other.

**Tech Stack:** Node 22 (`node --test`, no new test runner), Playwright 1.62 (already a devDependency, currently unused), `@lhci/cli` 0.15.1, plain CommonJS to match `scripts/build-site.js`.

**Spec:** `docs/superpowers/specs/2026-09-03-ci-conformance-gate-design.md`

## Global Constraints

- **CommonJS, no build step for scripts.** `scripts/build-site.js` is `'use strict'` + `require`. Match it. No TypeScript, no ESM.
- **No new dependencies.** Playwright and `@lhci/cli` are already declared. `node --test` is built in. Adding a package is out of scope.
- **Findings must cross the page boundary.** A `Finding.selector` is a **string**, never a DOM node — `page.evaluate()` cannot return elements.
- **`el.className` is not always a string.** On SVG elements it is an `SVGAnimatedString`. Any code touching `className` must type-check first. This is a live bug source: 63 of the measured warnings are SVG `<text>`.
- **"No findings" and "didn't run" must never look the same.** Every runner asserts it actually evaluated what it discovered. See spec §4.4.
- **The browser presenter's behaviour must not change.** Same console group, same corner badge, same text, same colours. Only its plumbing changes.
- **Local `lhci` needs `CHROME_PATH`:** `/Users/stephanmarais/.cache/puppeteer/chrome-headless-shell/mac_arm-152.0.7977.54/chrome-headless-shell-mac-arm64/chrome-headless-shell`
- **Production guard is `window.SL_BUILD.prod`**, set by `scripts/build-site.js` from `CF_PAGES_BRANCH` / `GITHUB_REF_NAME`. Never infer the environment from `location.hostname` — that has been wrong twice.
- **Excluded pages** (all three deliberately non-indexable): `thank-you.html`, `ci-guide.html`, `landing-preview.html`.
- **Commit after every task.** Conventional commits, and every message ends with the `Changed:` / `Refs:` trailer required by `basic-rules.md` §9.

---

## File Structure

| File | Responsibility |
|---|---|
| `scripts/site-pages.js` | **New.** The single definition of "every page of every site" + the exclusion list. Throws on empty. |
| `scripts/static-server.js` | **New.** Minimal static file server on an ephemeral port. Used by the runner and the tests; nothing else. |
| `scripts/conformance.js` | **New.** Headless runner: Playwright over every page, calls `SL_CHECK.run()`, prints the report, sets the exit code. |
| `shared/sunlogic-check.js` | **Modified.** Split into engine (`window.SL_CHECK`) + presenter. Gains a `why` per rule. |
| `lighthouserc.js` | **Modified.** Discovery comes from `site-pages.js`. |
| `test/site-pages.test.js` | **New.** Discovery, exclusions, throw-on-empty. |
| `test/rules.test.js` | **New.** One fixture per rule, pass and fail. |
| `test/conformance.test.js` | **New.** The watchman test: a non-conformant fixture must make the gate exit non-zero. |
| `test/fixtures/*.html` | **New.** Minimal pages, one per rule case. |
| `package.json` | **Modified.** Adds `test` and `conformance` scripts. |
| `.github/workflows/*.yml` | **Modified.** Task 9 only. |

---

## Task 1: Shared page discovery

**Files:**
- Create: `scripts/site-pages.js`
- Create: `test/site-pages.test.js`
- Modify: `lighthouserc.js:15-48` (replace its own discovery)
- Modify: `package.json` (add `test` script)

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `sitePages(distDir)` → `Array<{ site: string, file: string, url: string }>`, sorted by site then file. `url` is `/<site>/<file>`. **Throws** if `distDir` is missing or yields zero pages.
  - `EXCLUDED_PAGES` → `Set<string>` of basenames.

- [ ] **Step 1: Write the failing test**

Create `test/site-pages.test.js`:

```js
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test test/site-pages.test.js`
Expected: FAIL — `Cannot find module '../scripts/site-pages.js'`

- [ ] **Step 3: Write the implementation**

Create `scripts/site-pages.js`:

```js
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
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --test test/site-pages.test.js`
Expected: PASS, 7 tests

- [ ] **Step 5: Add the test script**

In `package.json`, add to `scripts`:

```json
"test": "node --test test/"
```

- [ ] **Step 6: Point lighthouserc.js at the shared module**

Replace `lighthouserc.js` lines 15–48 (everything from `const fs = require('fs');` down to and including the `if (urls.length === 0) { throw … }` block) with:

```js
const path = require('path');
const { sitePages } = require('./scripts/site-pages.js');

const DIST_DIR = path.join(__dirname, 'dist');

/* Served from dist/ rather than from each site directory, so one lhci run
   covers all three. Each page's own asset references are relative
   (shared/…, images/…), so they resolve correctly under /<site>/.
   Discovery and the exclusion list live in scripts/site-pages.js — see the
   comment there for why they are not duplicated here any more. */
const urls = sitePages(DIST_DIR).map((p) => p.url);
```

Also update the header comment: delete the paragraph beginning "It used to glob dist/*.html" (lines 8–13), since that history now lives in `site-pages.js`.

- [ ] **Step 7: Verify Lighthouse still discovers 42 pages**

Run:
```bash
npm run build && node -e "const c=require('./lighthouserc.js');const u=c.ci.collect.url;const by={};u.forEach(x=>{const s=x.split('/')[1];by[s]=(by[s]||0)+1});console.log(u.length, JSON.stringify(by))"
```
Expected: `42 {"electrical":14,"energy":14,"main":14}`

- [ ] **Step 8: Commit**

```bash
git add scripts/site-pages.js test/site-pages.test.js lighthouserc.js package.json
git commit -m "$(cat <<'EOF'
refactor(ci): one definition of every page of every site

lighthouserc.js had its own copy of page discovery. That copy globbed
dist/*.html, which was right while the build produced one site straight into
dist/ and wrong once dist/ held only site directories — it matched nothing and
the job audited zero pages while passing green.

Discovery now lives in scripts/site-pages.js, so a fourth site or a new page is
picked up by every consumer or by none. It throws on an empty set rather than
letting downstream mistake nothing-to-check for nothing-wrong.

Adds `npm test` (node --test, built in, no new dependency).

Changed:
- scripts/site-pages.js — new: sitePages(distDir), EXCLUDED_PAGES
- test/site-pages.test.js — new: discovery, exclusions, throw-on-empty
- lighthouserc.js — discovery delegated to the shared module
- package.json — test script
Refs: none

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Split the checker into engine and presenter

**Files:**
- Modify: `shared/sunlogic-check.js` (whole file restructured; 11 rules keep their logic)

**Interfaces:**
- Consumes: `window.SL_BUILD.prod` (already set by `scripts/build-site.js`).
- Produces:
  - `window.SL_CHECK.run()` → `{ fails: Finding[], warns: Finding[], info: { placeholders: number } }`
  - `window.SL_CHECK.WHY` → `Record<string, string>` — rule id to its stated intent.
  - `Finding` = `{ rule: string, why: string, detail: string, selector: string }`
  - Rule ids: `surface`, `palette`, `type`, `elevation`, `accent`, `copy`, `rhythm`, `limit`, `a11y`.

**Why this shape:** `selector` is a serialised string because `page.evaluate()` cannot return DOM nodes. `why` exists because a blocking failure that will not state its intent is not decidable — on 2026-09-03 the reasoning "a dialog is its own view with its own emphasis budget" existed only as a code comment, so deciding whether the rule applied meant reading the source.

- [ ] **Step 1: Write the failing test**

Create `test/fixtures/engine-smoke.html`:

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<title>engine smoke</title>
<link rel="stylesheet" href="../../shared/sunlogic.css"/>
<script src="../../shared/icons.js" defer></script>
<script src="../../shared/sunlogic-check.js" defer></script>
</head>
<body>
<main><section class="sl-section"><div class="sl-container">
  <h2 class="sl-section-heading">A Perfectly Ordinary Heading</h2>
</div></section></main>
</body>
</html>
```

Create `test/rules.test.js` with just the engine-contract tests for now:

```js
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test test/rules.test.js`
Expected: FAIL — `Cannot find module '../scripts/static-server.js'`

- [ ] **Step 3: Write the static server helper**

Create `scripts/static-server.js`:

```js
'use strict';

/* A minimal static file server on an ephemeral port. Used by the conformance
 * runner and by the tests, and by nothing else — it exists so those two do not
 * each grow their own copy. */

const http = require('http');
const fs = require('fs');
const path = require('path');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.woff2': 'font/woff2',
};

function startServer(rootDir) {
  const root = path.resolve(rootDir);
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const rel = decodeURIComponent(req.url.split('?')[0]);
      const file = path.resolve(path.join(root, rel));
      /* Refuse anything that escapes the root — this serves a repo directory. */
      if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('not found: ' + rel);
        return;
      }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream' });
      fs.createReadStream(file).pipe(res);
    });
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      resolve({
        port,
        close: () => server.close(),
        urlFor: (p) => 'http://127.0.0.1:' + port + p,
      });
    });
  });
}

module.exports = { startServer };
```

- [ ] **Step 4: Run the test to verify it now fails on the engine, not the server**

Run: `node --test test/rules.test.js`
Expected: FAIL — `window.SL_CHECK.run() returned nothing — the engine is not exposed`

- [ ] **Step 5: Restructure the checker**

Rewrite `shared/sunlogic-check.js`. The eleven rules keep their existing logic verbatim; what changes is that they push structured findings, the result is returned rather than presented, and the production guard moves off the whole file and onto the presenter.

```js
/* ============================================================
   SUNLOGIC DESIGN-SYSTEM CHECK
   Add to any page during development:
       <script src="shared/sunlogic-check.js" defer></script>

   Two consumers, one ruleset:
     window.SL_CHECK.run()  the engine — returns findings, presents nothing
     the presenter          console group + corner badge, dev builds only

   The engine is always available, including in a production build, because
   scripts/conformance.js audits a production build and needs to call it. Only
   the presenter is suppressed there.

   This exists because "read the guidelines" does not survive a long
   session. A failing check does.
   ============================================================ */
(function () {
  const PALETTE = new Set([
    'rgb(246, 111, 0)', 'rgb(184, 83, 0)', 'rgb(13, 32, 40)', 'rgb(8, 22, 25)',
    'rgb(255, 247, 233)', 'rgb(247, 238, 217)', 'rgb(240, 229, 207)',
    'rgb(218, 202, 182)', 'rgb(255, 255, 255)', 'rgb(160, 155, 147)',
    'rgb(90, 84, 75)', 'rgb(186, 26, 26)', 'rgba(0, 0, 0, 0)',
  ]);
  const FACES = ['Hanken Grotesk', 'JetBrains Mono'];

  /* Each rule's intent, in a form the report can print. A blocking failure
     that will not say why the rule exists is not decidable: you cannot tell
     "this page is wrong" from "this rule is wrong" without it. */
  const WHY = {
    surface: 'the page ground is beige and its text navy — a page that starts on another colour is not in the system',
    palette: 'every colour on the page comes from the token file; an off-palette value is either a mistake or a token that was never added',
    type: 'two typefaces carry everything — Hanken Grotesk for text, JetBrains Mono for labels and data. A third face is not in the vocabulary',
    elevation: 'the system is flat: separation comes from tone and hairlines, never from a shadow',
    accent: 'one emphasis button in view, plus the closing CTA — more than that and none of them reads as the thing to click',
    copy: 'headings are Title Case and prose sub-heads are sentence case; capitals belong to the mono face at label size',
    rhythm: 'a reader should never meet the same band colour twice running — the alternation is what separates sections without a rule line',
    limit: 'the nav caps at four links, because a fifth turns a route into a menu',
    a11y: 'anything you tap is at least 44px tall, and every image either says what it shows or is a labelled empty state',
  };

  /* A serialised locator, not the node. page.evaluate() cannot return
     elements, so the runner would receive {} for every finding.
     className is deliberately type-checked: on an SVG element it is an
     SVGAnimatedString, and 63 of the findings on this site are SVG <text>. */
  const selectorFor = (el) => {
    if (!el || !el.tagName) return '';
    const tag = el.tagName.toLowerCase();
    const id = el.id ? '#' + el.id : '';
    const cls = typeof el.className === 'string' && el.className.trim()
      ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.')
      : '';
    return tag + id + cls;
  };

  function run() {
    const fails = [];
    const warns = [];
    const finding = (rule, detail, el) => ({ rule, why: WHY[rule], detail, selector: selectorFor(el) });
    const fail = (rule, detail, el) => fails.push(finding(rule, detail, el));
    const warn = (rule, detail, el) => warns.push(finding(rule, detail, el));

    /* 1 — Page surface is beige, text is navy. */
    const bodyBg = getComputedStyle(document.body).backgroundColor;
    if (bodyBg !== 'rgb(255, 247, 233)') fail('surface', 'body background is ' + bodyBg + ', should be rgb(255, 247, 233)', document.body);

    /* 2 — No colour outside the palette. */
    document.querySelectorAll('body *').forEach((el) => {
      if (el.dataset && el.dataset.slCheckBadge) return;      /* never flag the badge itself */
      const cs = getComputedStyle(el);
      if (el.offsetParent === null && cs.position !== 'fixed') return;
      ['backgroundColor', 'color'].forEach((prop) => {
        const v = cs[prop];
        if (v.startsWith('rgba') && v.endsWith(', 0)')) return;
        if (v.startsWith('rgba')) return;           // scrims and glass are legal
        if (!PALETTE.has(v)) warn('palette', prop + ': ' + v + ' is not a system colour', el);
      });
    });

    /* 3 — Two typefaces only. */
    document.querySelectorAll('body *').forEach((el) => {
      if (el.dataset && el.dataset.slCheckBadge) return;
      if (!el.textContent.trim()) return;
      const f = getComputedStyle(el).fontFamily;
      if (!FACES.some((x) => f.includes(x))) warn('type', 'font-family: ' + f, el);
    });

    /* 4 — Flat. No shadows on cards, panels or buttons. */
    document.querySelectorAll('.sl-card, .sl-btn, .sl-stat, .sl-terminal, .sl-section').forEach((el) => {
      const s = getComputedStyle(el).boxShadow;
      if (s !== 'none' && !el.matches(':focus-visible')) fail('elevation', 'box-shadow on ' + el.className, el);
    });

    /* 5 — One emphasis button in view (the closing CTA is the allowed second).
       "In view" is the point, so the drawer is excluded — and a dialog for the
       same reason: it is its own view with its own emphasis budget, and while
       it is open the page behind it is inert. */
    const emph = document.querySelectorAll('.sl-btn--emphasis:not(.sl-drawer .sl-btn):not(dialog .sl-btn)');
    if (emph.length > 2) fail('accent', emph.length + ' emphasis buttons on the page; the limit is one, plus the closing CTA', emph[2]);

    /* 6 — Case. Headings are Title Case; prose sub-heads are sentence case. */
    document.querySelectorAll('.sl-hero-heading, .sl-section-heading, .sl-title, .sl-cta__heading').forEach((el) => {
      const t = el.textContent.trim();
      if (t.length > 3 && t === t.toUpperCase() && /[A-Z]/.test(t)) {
        fail('copy', 'ALL CAPS heading: "' + t.slice(0, 48) + '" — capitals belong to the mono face at label size', el);
      }
    });
    /* An h3 given .sl-title is an explicit titled heading (a named
       sub-document, say), so it follows heading case, not prose case. */
    document.querySelectorAll('.sl-prose h3:not(.sl-title)').forEach((el) => {
      const words = el.textContent.trim().split(/\s+/).filter((w) => w.length > 3);
      const caps = words.filter((w) => /^[A-Z]/.test(w));
      if (words.length > 2 && caps.length > words.length / 2) {
        warn('copy', 'prose sub-head looks Title Cased: "' + el.textContent.trim().slice(0, 48) + '" — sub-heads inside prose are sentence case', el);
      }
    });

    /* 7 — No two adjacent full-bleed bands share a background. The closing CTA
       is an inset rounded card on a transparent gutter: it has no band colour
       of its own, but that gutter does separate what sits either side of it,
       so it RESETS the run rather than joining it. */
    const bands = [...document.querySelectorAll('.sl-hero, .sl-trust, .sl-section, .sl-statement, .sl-cta-wrap, .sl-footer')]
      /* A .sl-hero inside a section is a card wearing the hero's layer stack,
         not a band of its own. Only a top-level hero counts. */
      .filter((s) => !(s.classList.contains('sl-hero') && s.parentElement.closest('.sl-section')));
    let prevBg = null;
    bands.forEach((s) => {
      if (s.classList.contains('sl-cta-wrap')) { prevBg = null; return; }
      const bg = getComputedStyle(s).backgroundColor;
      if (prevBg !== null && bg === prevBg) fail('rhythm', 'two adjacent bands share ' + bg, s);
      prevBg = bg;
    });

    /* 8 — Nav caps at four links. */
    const navLinks = document.querySelectorAll('.sl-nav__links .sl-nav__link');
    if (navLinks.length > 4) fail('limit', navLinks.length + ' nav links; the limit is four', navLinks[4]);

    /* 9 — Touch targets. */
    document.querySelectorAll('a, button, .sl-btn, .sl-icon-btn').forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.height > 0 && r.height < 44 && !el.closest('.sl-footer, .sl-nav__links')) {
        warn('a11y', Math.round(r.height) + 'px tall, minimum is 44px', el);
      }
    });

    /* 10 — Every image slot is either real or a labelled empty state. */
    document.querySelectorAll('img').forEach((el) => {
      if (!el.alt) fail('a11y', 'image with no alt text', el);
    });

    /* 11 — Placeholders are visible, not invented. Informational. */
    const placeholders = (document.body.innerText.match(/\[[^\]]*(pending|placeholder)[^\]]*\]/gi) || []).length;

    return { fails, warns, info: { placeholders } };
  }

  window.SL_CHECK = { run, WHY };

  /* ---- Presenter. Dev builds only. -------------------------------------
     The guard reads the build flag rather than location.hostname: a hostname
     regex was right while there was one site and shipped a developer badge to
     the public on two of three once the environment grew. window.SL_BUILD.prod
     is a property of the build, so a fourth host cannot reintroduce it.
     Only this presenter is suppressed — the engine above stays callable,
     because the headless runner audits production builds. */
  if (window.SL_BUILD && window.SL_BUILD.prod) return;

  const present = (result) => {
    const { fails, warns, info } = result;
    const style = (c) => 'color:' + c + ';font-weight:600';
    console.group('%cSunlogic design-system check', 'font-weight:700;font-size:13px');
    if (!fails.length && !warns.length) console.log('%c✓ all checks pass', style('#0a7'));
    fails.forEach((f) => console.log('%c✗ ' + f.rule + '%c  ' + f.detail, style('#c00'), 'color:inherit', f.selector));
    warns.forEach((w) => console.log('%c! ' + w.rule + '%c  ' + w.detail, style('#b70'), 'color:inherit', w.selector));
    if (info.placeholders) console.log('%ci placeholders%c  ' + info.placeholders + ' unresolved value(s) visible on this page — correct, until the client supplies them', style('#678'), 'color:inherit');
    console.groupEnd();

    const badge = document.createElement('div');
    badge.textContent = fails.length ? fails.length + ' system error' + (fails.length > 1 ? 's' : '')
      : warns.length ? warns.length + ' warning' + (warns.length > 1 ? 's' : '') : 'system ok';
    badge.style.cssText = 'position:fixed;left:12px;bottom:12px;z-index:20;padding:6px 10px;' +
      'border-radius:4px;font:600 11px/1 ui-monospace,monospace;letter-spacing:.05em;' +
      'text-transform:uppercase;cursor:pointer;' +
      'background:' + (fails.length ? '#BA1A1A' : warns.length ? '#F66F00' : '#0D2028') + ';color:' + (warns.length && !fails.length ? '#0D2028' : '#fff');
    badge.dataset.slCheckBadge = '1';
    badge.title = 'Sunlogic check — open the console for detail';
    badge.onclick = () => badge.remove();
    document.body.appendChild(badge);
  };

  if (document.readyState === 'complete') setTimeout(() => present(run()), 200);
  else window.addEventListener('load', () => setTimeout(() => present(run()), 200));
})();
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `node --test test/rules.test.js`
Expected: PASS, 3 tests

- [ ] **Step 7: Verify the presenter is unchanged in a dev build**

```bash
npm run build:main
node -e "
const path=require('path');
const {chromium}=require(path.join(process.cwd(),'node_modules','playwright'));
const {startServer}=require('./scripts/static-server.js');
(async()=>{
  const s=await startServer(path.join(process.cwd(),'dist','main'));
  const b=await chromium.launch();const p=await b.newPage();
  await p.goto(s.urlFor('/index.html'),{waitUntil:'load'});
  await p.waitForTimeout(600);
  const badge=await p.evaluate(()=>{const e=document.querySelector('[data-sl-check-badge]');return e&&e.textContent;});
  console.log('dev build badge:',JSON.stringify(badge));
  await b.close();s.close();
})();"
```
Expected: `dev build badge: "system ok"` — identical to today.

- [ ] **Step 8: Verify the engine survives a production build and the presenter does not**

```bash
CF_PAGES_BRANCH=main npm run build:main
node -e "
const path=require('path');
const {chromium}=require(path.join(process.cwd(),'node_modules','playwright'));
const {startServer}=require('./scripts/static-server.js');
(async()=>{
  const s=await startServer(path.join(process.cwd(),'dist','main'));
  const b=await chromium.launch();const p=await b.newPage();
  await p.goto(s.urlFor('/index.html'),{waitUntil:'load'});
  await p.waitForTimeout(600);
  const out=await p.evaluate(()=>({
    engine: typeof (window.SL_CHECK||{}).run,
    badge: !!document.querySelector('[data-sl-check-badge]'),
  }));
  console.log(out);
  await b.close();s.close();
})();"
npm run build:main   # leave dist as a dev build
```
Expected: `{ engine: 'function', badge: false }` — the engine callable, the badge gone. This is the whole point of the split.

- [ ] **Step 9: Commit**

```bash
git add shared/sunlogic-check.js scripts/static-server.js test/rules.test.js test/fixtures/engine-smoke.html
git commit -m "$(cat <<'EOF'
refactor(check): split the checker into a rule engine and a presenter

The checker computed findings and immediately logged them and painted a badge,
so nothing could read the result. It now exposes window.SL_CHECK.run(),
returning {fails, warns, info}, with the console group and corner badge
rebuilt on top of that — same output, same badge, same colours.

Each finding gains a `why`: the rule's intent, in a form a report can print. A
blocking failure that will not say why its rule exists is not decidable, and
the reasoning previously lived only in code comments.

A finding's `selector` is a serialised string, never a node, because
page.evaluate() cannot return elements — the headless runner would receive {}
for every finding.

The production guard now suppresses only the presenter. The engine stays
callable in a production build because the conformance runner audits one.

Changed:
- shared/sunlogic-check.js — engine/presenter split, WHY per rule, selectorFor
- scripts/static-server.js — new: shared ephemeral-port static server
- test/rules.test.js — new: engine contract, every rule has a why
- test/fixtures/engine-smoke.html — new: minimal conformant page
Refs: none

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: A fixture per rule, and the watchman test

**Files:**
- Create: `test/fixtures/rhythm-fail.html`, `rhythm-pass-nested-hero.html`, `accent-fail.html`, `accent-pass-dialog.html`, `copy-fail-allcaps.html`, `a11y-fail-noalt.html`
- Modify: `test/rules.test.js` (add the per-rule cases)

**Interfaces:**
- Consumes: `window.SL_CHECK.run()` from Task 2; `startServer` from Task 2.
- Produces: nothing new. This task buys confidence, not API.

**Why these six fixtures:** each of the three rule bugs found on 2026-09-03 would have been caught by one of them. `rhythm-pass-nested-hero.html` and `accent-pass-dialog.html` are the regression tests for two of those bugs; without them the next refactor silently re-breaks the rules.

- [ ] **Step 1: Write the failing tests**

Append to `test/rules.test.js`:

```js
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
```

- [ ] **Step 2: Run to verify they fail**

Run: `node --test test/rules.test.js`
Expected: 6 FAIL — `not found: /test/fixtures/rhythm-fail.html`

- [ ] **Step 3: Write the fixtures**

Every fixture uses this shell. Only the `<main>` contents differ.

`test/fixtures/rhythm-fail.html` — two `bg="alt"` sections back to back:

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/><title>rhythm fail</title>
<link rel="stylesheet" href="../../shared/sunlogic.css"/>
<script src="../../shared/icons.js" defer></script>
<script src="../../shared/components.js" defer></script>
<script src="../../shared/sunlogic-check.js" defer></script>
</head>
<body>
<main>
  <dl-section bg="alt"><p class="sl-body">First alt band.</p></dl-section>
  <dl-section bg="alt"><p class="sl-body">Second alt band, same colour, adjacent.</p></dl-section>
</main>
</body>
</html>
```

`test/fixtures/rhythm-pass-nested-hero.html` — two hero-layer cards inside one section:

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/><title>rhythm pass: nested heroes</title>
<link rel="stylesheet" href="../../shared/sunlogic.css"/>
<script src="../../shared/icons.js" defer></script>
<script src="../../shared/components.js" defer></script>
<script src="../../shared/sunlogic-check.js" defer></script>
</head>
<body>
<main>
  <dl-section bg="page">
    <dl-grid cols="2">
      <div class="sl-hero"><div class="sl-hero__inner"><p class="sl-body">Card one.</p></div></div>
      <div class="sl-hero"><div class="sl-hero__inner"><p class="sl-body">Card two.</p></div></div>
    </dl-grid>
  </dl-section>
</main>
</body>
</html>
```

`test/fixtures/accent-fail.html` — three emphasis buttons in the page:

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/><title>accent fail</title>
<link rel="stylesheet" href="../../shared/sunlogic.css"/>
<script src="../../shared/icons.js" defer></script>
<script src="../../shared/components.js" defer></script>
<script src="../../shared/sunlogic-check.js" defer></script>
</head>
<body>
<main>
  <dl-section bg="page"><dl-actions>
    <dl-button variant="emphasis" href="#a">One</dl-button>
    <dl-button variant="emphasis" href="#b">Two</dl-button>
    <dl-button variant="emphasis" href="#c">Three</dl-button>
  </dl-actions></dl-section>
</main>
</body>
</html>
```

`test/fixtures/accent-pass-dialog.html` — two on the page plus one in a closed dialog:

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/><title>accent pass: dialog</title>
<link rel="stylesheet" href="../../shared/sunlogic.css"/>
<script src="../../shared/icons.js" defer></script>
<script src="../../shared/components.js" defer></script>
<script src="../../shared/sunlogic-check.js" defer></script>
</head>
<body>
<main>
  <dl-section bg="page"><dl-actions>
    <dl-button variant="emphasis" href="#a">One</dl-button>
    <dl-button variant="emphasis" href="#b">Two</dl-button>
  </dl-actions></dl-section>
</main>
<dialog class="sl-modal">
  <dl-button variant="emphasis" href="#c">Submit, in its own view</dl-button>
</dialog>
</body>
</html>
```

`test/fixtures/copy-fail-allcaps.html`:

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/><title>copy fail</title>
<link rel="stylesheet" href="../../shared/sunlogic.css"/>
<script src="../../shared/icons.js" defer></script>
<script src="../../shared/sunlogic-check.js" defer></script>
</head>
<body>
<main><section class="sl-section"><div class="sl-container">
  <h2 class="sl-section-heading">SHOUTING AT THE READER</h2>
</div></section></main>
</body>
</html>
```

`test/fixtures/a11y-fail-noalt.html`:

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/><title>a11y fail</title>
<link rel="stylesheet" href="../../shared/sunlogic.css"/>
<script src="../../shared/icons.js" defer></script>
<script src="../../shared/sunlogic-check.js" defer></script>
</head>
<body>
<main><section class="sl-section"><div class="sl-container">
  <img src="../../site-main/images/sl_logo_main_blue.svg" width="40" height="12"/>
</div></section></main>
</body>
</html>
```

- [ ] **Step 4: Run to verify they pass**

Run: `node --test test/rules.test.js`
Expected: PASS, 9 tests

If `rhythm-pass-nested-hero` or `accent-pass-dialog` fails, the rule has regressed — that is the test doing its job. Fix the rule in `shared/sunlogic-check.js`, not the fixture.

- [ ] **Step 5: Commit**

```bash
git add test/
git commit -m "$(cat <<'EOF'
test(check): a fixture per rule, including the two regressions

Six fixtures driving the real engine in a real browser, because the rules read
computed styles and cannot be unit tested without one.

Two are regression tests for rule bugs found on 2026-09-03, both of which
blocked legitimate pages: a .sl-hero nested inside a section counted as a
full-bleed band, and an emphasis button inside a closed dialog counted toward
the page's one-emphasis limit. Nothing asserted either rule could still be
right, which is why both broke silently.

Changed:
- test/rules.test.js — rhythm, accent, copy and a11y cases
- test/fixtures/*.html — six minimal pages, pass and fail per rule
Refs: none

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: The headless conformance runner

**Files:**
- Create: `scripts/conformance.js`
- Create: `test/conformance.test.js`
- Modify: `package.json` (add `conformance` script)

**Interfaces:**
- Consumes: `sitePages(distDir)` (Task 1), `startServer(rootDir)` (Task 2), `window.SL_CHECK.run()` (Task 2).
- Produces:
  - `npm run conformance` → exit 0 clean, exit 1 on any `fail`, exit 1 on an integrity breach.
  - `runConformance({ distDir, viewport })` → `{ pages: number, evaluated: number, fails: Finding[], warns: Finding[] }` — exported for the tests.
  - Env: `SL_CONFORMANCE_OVERRIDE="reason"` forces exit 0, prints a banner.

- [ ] **Step 1: Write the failing test**

Create `test/conformance.test.js`:

```js
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
```

- [ ] **Step 2: Run to verify it fails**

Run: `node --test test/conformance.test.js`
Expected: FAIL — `Cannot find module '../scripts/conformance.js'`

- [ ] **Step 3: Write the runner**

Create `scripts/conformance.js`:

```js
#!/usr/bin/env node
'use strict';

/* The design-system gate.
 *
 * Serves the built sites, opens every page in a real browser, and calls the
 * same window.SL_CHECK.run() that paints the developer badge — one ruleset,
 * two consumers, so the gate and the badge can never disagree.
 *
 * The integrity assertions are the point. A check that can pass while checking
 * nothing is worse than no check, because it launders confidence: Lighthouse
 * audited zero pages here for weeks and reported success the whole time. So
 * "no findings" and "didn't run" must never produce the same result. */

const path = require('path');

const ROOT = path.join(__dirname, '..');
const { chromium } = require(path.join(ROOT, 'node_modules', 'playwright'));
const { sitePages } = require('./site-pages.js');
const { startServer } = require('./static-server.js');

/* Mobile first, matching lighthouserc.js. Touch-target heights differ by
   width, so the viewport is part of the result and is printed with it. */
const DEFAULT_VIEWPORT = { width: 412, height: 823 };

async function runConformance(options) {
  const opts = options || {};
  const distDir = opts.distDir || path.join(ROOT, 'dist');
  const viewport = opts.viewport || DEFAULT_VIEWPORT;

  const pages = sitePages(distDir);          /* throws on empty */
  const server = await startServer(distDir);
  const browser = await chromium.launch();

  const fails = [];
  const warns = [];
  let evaluated = 0;

  try {
    for (const p of pages) {
      const page = await browser.newPage({ viewport });
      try {
        await page.goto(server.urlFor(p.url), { waitUntil: 'load' });
        const hasEngine = await page.evaluate(() => !!(window.SL_CHECK && window.SL_CHECK.run));
        if (!hasEngine) {
          throw new Error(
            p.url + ' did not expose window.SL_CHECK. A page without the engine ' +
            'reports zero findings, which is indistinguishable from a clean page — ' +
            'failing instead of counting it as a pass.');
        }
        const result = await page.evaluate(() => window.SL_CHECK.run());
        evaluated++;
        for (const f of result.fails) fails.push(Object.assign({ page: p.url }, f));
        for (const w of result.warns) warns.push(Object.assign({ page: p.url }, w));
      } finally {
        await page.close();
      }
    }
  } finally {
    await browser.close();
    server.close();
  }

  /* Belt and braces on top of the per-page assertion: if the loop ever gains
     an early continue, this catches the coverage gap it would open. */
  if (evaluated !== pages.length) {
    throw new Error('evaluated ' + evaluated + ' of ' + pages.length + ' pages — coverage gap');
  }

  return { pages: pages.length, evaluated, fails, warns, viewport };
}

/* Grouped by rule, not by page: a rule failing on 40 pages is one rule
   problem, and 40 separate stanzas hide that. */
function report(result) {
  const groups = {};
  for (const f of result.fails.concat(result.warns)) {
    const sev = result.fails.includes(f) ? 'fail' : 'warn';
    groups[f.rule] = groups[f.rule] || { why: f.why, fail: [], warn: [] };
    groups[f.rule][sev].push(f);
  }

  const lines = [];
  for (const [rule, g] of Object.entries(groups)) {
    for (const sev of ['fail', 'warn']) {
      if (!g[sev].length) continue;
      lines.push('');
      lines.push((sev === 'fail' ? '✗ ' : '! ') + rule + '   ' + g[sev].length + ' on ' +
        new Set(g[sev].map((f) => f.page)).size + ' page(s)');
      lines.push('  intent:  ' + g.why);
      for (const f of g[sev].slice(0, 6)) {
        lines.push('  ' + f.page + '   ' + f.detail);
        if (f.selector) lines.push('      element: ' + f.selector);
      }
      if (g[sev].length > 6) lines.push('  … and ' + (g[sev].length - 6) + ' more');
      lines.push('  →  fix the page, or amend the rule in shared/sunlogic-check.js');
    }
  }

  lines.push('');
  lines.push('pages checked ' + result.evaluated + '/' + result.pages +
    '   fails ' + result.fails.length + '   warns ' + result.warns.length +
    '   viewport ' + result.viewport.width + 'x' + result.viewport.height);
  return lines.join('\n');
}

async function main() {
  const override = process.env.SL_CONFORMANCE_OVERRIDE;
  const result = await runConformance({});
  console.log(report(result));

  if (!result.fails.length) return;

  if (override && override.trim()) {
    console.log('');
    console.log('================================================================');
    console.log('CONFORMANCE OVERRIDDEN — ' + result.fails.length + ' failure(s) allowed through');
    console.log('reason: ' + override.trim());
    console.log('================================================================');
    return;
  }
  process.exitCode = 1;
}

if (require.main === module) {
  main().catch((err) => { console.error(String(err.message || err)); process.exit(1); });
}

module.exports = { runConformance, report };
```

- [ ] **Step 4: Run to verify it passes**

Run: `node --test test/conformance.test.js`
Expected: PASS, 5 tests

- [ ] **Step 5: Add the script**

In `package.json`, add to `scripts`:

```json
"conformance": "node scripts/conformance.js"
```

- [ ] **Step 6: Run it against the real sites**

Run: `npm run build && npm run conformance`
Expected: `pages checked 42/42   fails 0   warns 150   viewport 412x823`, exit 0. The 150 warns are the §3.3 backlog, cleared in Tasks 5–7.

Confirm the exit code: `echo $?` → `0`

- [ ] **Step 7: Commit**

```bash
git add scripts/conformance.js test/conformance.test.js package.json
git commit -m "$(cat <<'EOF'
feat(ci): headless conformance runner over every page of every site

Serves the built sites, opens each page in a real browser and calls the same
window.SL_CHECK.run() that paints the developer badge, so the gate and the
badge can never disagree.

The integrity assertions are the substance. A page that fails to load the
engine reports zero findings, which is indistinguishable from a clean page, so
a missing SL_CHECK is an error rather than a pass; and pages-evaluated must
equal pages-discovered. Lighthouse audited zero pages here for weeks and
reported success throughout — that is the failure mode being designed out.

Reports grouped by rule rather than by page, because a rule failing on 40 pages
is one rule problem, and each group prints the rule's intent so a blocking
failure can be decided rather than guessed at.

SL_CONFORMANCE_OVERRIDE="reason" forces a pass and prints a banner. One coarse
override on purpose: a per-finding waiver is a baseline arrived at one line at
a time, and this codebase keeps its exceptions in the rules.

Includes the watchman test: a deliberately non-conformant page must make the
gate fail. Without it every silent-pass mode returns on the next refactor.

Changed:
- scripts/conformance.js — new: runConformance(), report(), CLI entry
- test/conformance.test.js — new: watchman test, coverage and integrity
- package.json — conformance script
Refs: none

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Clear the two rule-level causes

**Files:**
- Modify: `shared/sunlogic.css` (add an `svg text` rule)
- Modify: `shared/sunlogic-check.js` (touch-target rule scope)
- Modify: `test/rules.test.js` (add cases for both)
- Create: `test/fixtures/type-pass-svg.html`, `test/fixtures/a11y-pass-inline-link.html`

**Interfaces:**
- Consumes: everything from Tasks 1–4.
- Produces: nothing new.

**Why:** 138 of the 150 measured warnings come from two causes, and both are the rule being too broad rather than 138 page defects. See spec §3.3.

- [ ] **Step 1: Write the failing tests**

Append to `test/rules.test.js`:

```js
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
```

- [ ] **Step 2: Write the fixtures**

`test/fixtures/type-pass-svg.html`:

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/><title>type pass: svg</title>
<link rel="stylesheet" href="../../shared/sunlogic.css"/>
<script src="../../shared/icons.js" defer></script>
<script src="../../shared/sunlogic-check.js" defer></script>
</head>
<body>
<main><section class="sl-section"><div class="sl-container">
  <svg viewBox="0 0 200 40" width="200" height="40">
    <text x="4" y="24">A diagram label</text>
  </svg>
</div></section></main>
</body>
</html>
```

`test/fixtures/a11y-pass-inline-link.html`:

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/><title>a11y pass: inline link</title>
<link rel="stylesheet" href="../../shared/sunlogic.css"/>
<script src="../../shared/icons.js" defer></script>
<script src="../../shared/sunlogic-check.js" defer></script>
</head>
<body>
<main><section class="sl-section"><div class="sl-container">
  <div class="sl-prose">
    <p class="sl-body">A paragraph with <a href="#x">an inline link</a> inside it, which is
    text and not a tap target.</p>
  </div>
</div></section></main>
</body>
</html>
```

- [ ] **Step 3: Run to verify they fail**

Run: `node --test test/rules.test.js`
Expected: 2 FAIL — a `type` warning for `font-family: monospace`, and an `a11y` warning for a ~21px link.

- [ ] **Step 4: Fix the type cause in CSS**

In `shared/sunlogic.css`, immediately after the `--font-mono` token block's consumers (anywhere in the base layer is fine; put it beside the other element defaults), add:

```css
/* SVG text does not inherit the page font — it falls back to the UA's
   monospace — so diagram labels rendered in a face that is not in the system
   at all. Every <text> in every inline SVG was flagged by the type rule, 63
   findings from one cause. */
svg text { font-family: var(--font-mono); }
```

- [ ] **Step 5: Fix the a11y cause in the rule**

In `shared/sunlogic-check.js`, rule 9, replace the exclusion selector:

```js
    /* 9 — Touch targets. 44px is a minimum for something you tap; an inline
       text link inside a paragraph is not a tap target, and treating it as one
       produced 75 findings that were all the rule's fault. The footer and nav
       were already exempt for exactly this reason — .sl-prose, .sl-body and
       the contact roll are the same case. */
    document.querySelectorAll('a, button, .sl-btn, .sl-icon-btn').forEach((el) => {
      const r = el.getBoundingClientRect();
      const inlineText = el.closest('.sl-footer, .sl-nav__links, .sl-prose, .sl-body, .sl-roll');
      if (r.height > 0 && r.height < 44 && !inlineText) {
        warn('a11y', Math.round(r.height) + 'px tall, minimum is 44px', el);
      }
    });
```

- [ ] **Step 6: Run to verify they pass**

Run: `node --test test/`
Expected: PASS, all tests

- [ ] **Step 7: Re-measure the backlog**

Run: `npm run build && npm run conformance`
Expected: `fails 0   warns 12` or thereabouts — only the `copy` group should remain. If `type` or `a11y` still appear, read the report's `intent` line and decide whether the remaining cases are the page or the rule; do not widen the exemption to silence a genuine finding.

- [ ] **Step 8: Commit**

```bash
git add shared/sunlogic.css shared/sunlogic-check.js test/
git commit -m "$(cat <<'EOF'
fix(check): clear the two rule-level causes behind 138 warnings

Of 150 findings measured across the three sites, 138 came from two causes and
both were the rule being too broad rather than 138 page defects.

63 `type` warnings were <text> inside inline SVG. SVG text does not inherit the
page font, so every diagram label computed to the UA's monospace — a face that
is not in the system at all. One CSS rule gives them the mono face.

75 `a11y` warnings were inline text links measured against a 44px minimum that
exists for things you tap. The rule already exempted .sl-footer and
.sl-nav__links for that reason; prose, body copy and the contact roll are the
same case and are now exempt too.

Both gain regression fixtures, so the next refactor cannot quietly reintroduce
either.

Changed:
- shared/sunlogic.css — svg text takes --font-mono
- shared/sunlogic-check.js — touch-target rule exempts inline text contexts
- test/rules.test.js — cases for both
- test/fixtures/type-pass-svg.html, a11y-pass-inline-link.html — new
Refs: none

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: Triage the copy findings at both viewports

**Files:**
- Modify: `shared/sunlogic-check.js` (prose-case rule, if the triage says so)
- Modify: blog pages under `site-main/`, `site-energy/`, `site-electrical/` (whichever findings are genuine)
- Modify: `test/rules.test.js`
- Create: `test/fixtures/copy-pass-proper-noun.html`

**Interfaces:**
- Consumes: `npm run conformance` from Task 4.
- Produces: a clean `warns 0` at both viewports.

**Why this task is triage and not a fix list:** the spec called `copy` "the only one that is really the pages' fault". That is **wrong**, and the plan corrects it. The rule counts long words starting with a capital, so `"Cape Town's own structure"` — sentence case with a proper noun — trips it: 2 of its 3 long words are capitalised. Each of the 12 findings has to be read before it is fixed.

- [ ] **Step 1: List the findings**

Run: `npm run build && npm run conformance 2>&1 | sed -n '/copy/,/→/p'`

Write down each heading. Classify each as:
- **page wrong** — genuinely Title Cased, e.g. `"1. Install a Geyser Timer or Smart Geyser Controller"`.
- **rule wrong** — sentence case containing a proper noun, e.g. `"Cape Town's own structure"`.

- [ ] **Step 2: Write the failing test for the rule-wrong case**

Append to `test/rules.test.js`:

```js
// The rule counts long words starting with a capital, so a sentence-case
// sub-head containing a proper noun trips it: "Cape Town's own structure" has
// 3 long words of which 2 are capitalised. A proper noun is not Title Case.
test('copy: a sentence-case prose sub-head with a proper noun is not flagged', async () => {
  const r = await check('copy-pass-proper-noun.html');
  assert.deepStrictEqual(r.warns.filter((w) => w.rule === 'copy'), []);
});
```

Create `test/fixtures/copy-pass-proper-noun.html`:

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/><title>copy pass: proper noun</title>
<link rel="stylesheet" href="../../shared/sunlogic.css"/>
<script src="../../shared/icons.js" defer></script>
<script src="../../shared/sunlogic-check.js" defer></script>
</head>
<body>
<main><section class="sl-section"><div class="sl-container">
  <div class="sl-prose">
    <h3>Cape Town's own structure</h3>
    <p class="sl-body">Sentence case, with a proper noun in it.</p>
  </div>
</div></section></main>
</body>
</html>
```

- [ ] **Step 3: Run to verify it fails**

Run: `node --test test/rules.test.js`
Expected: FAIL — one `copy` warning for the proper-noun heading.

- [ ] **Step 4: Narrow the rule**

In `shared/sunlogic-check.js`, replace the prose-case check with one that ignores the first word (always capitalised in sentence case) and requires a clearer majority:

```js
    /* An h3 given .sl-title is an explicit titled heading (a named
       sub-document, say), so it follows heading case, not prose case.
       The first word is skipped because sentence case capitalises it, and the
       threshold is a clear majority of the rest: counting every capitalised
       long word flagged "Cape Town's own structure", where the capitals are a
       proper noun rather than Title Case. */
    document.querySelectorAll('.sl-prose h3:not(.sl-title)').forEach((el) => {
      const text = el.textContent.trim();
      const words = text.split(/\s+/).filter((w) => w.length > 3).slice(1);
      const caps = words.filter((w) => /^[A-Z]/.test(w));
      if (words.length > 2 && caps.length > words.length * 0.7) {
        warn('copy', 'prose sub-head looks Title Cased: "' + text.slice(0, 48) + '" — sub-heads inside prose are sentence case', el);
      }
    });
```

- [ ] **Step 5: Run to verify both copy tests pass**

Run: `node --test test/rules.test.js`
Expected: PASS — `copy-fail-allcaps` still fails the ALL CAPS check, `copy-pass-proper-noun` is clean.

- [ ] **Step 6: Fix the genuinely Title-Cased sub-heads**

For each heading classified "page wrong" in Step 1, rewrite it to sentence case in **all three site directories** — the blog pages are currently duplicated across `site-main/`, `site-energy/` and `site-electrical/`, so a heading fixed in one must be fixed in all three or the gate stays red on two.

Example, in all three copies of `blog-3-essential-checks.html`:

```
-  <h3>1. Install a Geyser Timer or Smart Geyser Controller</h3>
+  <h3>1. Install a geyser timer or smart geyser controller</h3>
-  <h3>2. Install Proper Surge Protection</h3>
+  <h3>2. Install proper surge protection</h3>
-  <h3>3. Ensure Your Security Systems Have Reliable Backup Power</h3>
+  <h3>3. Ensure your security systems have reliable backup power</h3>
```

Verify the count: `grep -c "Install a geyser timer" site-*/blog-3-essential-checks.html` → `1` for each of the three.

- [ ] **Step 7: Confirm clean at mobile**

Run: `npm run build && npm run conformance`
Expected: `fails 0   warns 0   viewport 412x823`

- [ ] **Step 8: Confirm clean at desktop**

Touch-target heights depend on width, so a mobile-only pass is not proof.

Run:
```bash
node -e "
const {runConformance,report}=require('./scripts/conformance.js');
runConformance({viewport:{width:1440,height:900}}).then(r=>{
  console.log(report(r));
  process.exitCode = r.fails.length || r.warns.length ? 1 : 0;
});"
```
Expected: `fails 0   warns 0   viewport 1440x900`, exit 0.

If desktop surfaces findings mobile did not, triage them the same way and add a fixture before fixing.

- [ ] **Step 9: Commit**

```bash
git add shared/sunlogic-check.js test/ site-main site-energy site-electrical
git commit -m "$(cat <<'EOF'
fix(copy): triage the prose-case findings, page by page

The spec called this group "the only one that is really the pages' fault".
That was wrong. The rule counted every long word starting with a capital, so a
sentence-case sub-head containing a proper noun tripped it: "Cape Town's own
structure" has three long words of which two are capitalised. A proper noun is
not Title Case.

So the rule now skips the first word — sentence case capitalises it anyway —
and requires a clear majority of the rest. The genuinely Title-Cased sub-heads
are rewritten to sentence case, in all three site directories, since the blog
pages are duplicated across them.

Verified clean at 412x823 and at 1440x900: touch-target heights depend on
viewport width, so a mobile-only pass is not proof.

Changed:
- shared/sunlogic-check.js — prose-case rule ignores the leading word, 0.7
  majority threshold
- site-main, site-energy, site-electrical — Title-Cased prose sub-heads
  rewritten to sentence case
- test/rules.test.js, test/fixtures/copy-pass-proper-noun.html — regression
Refs: none

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: Collapse the severity tiers

**Files:**
- Modify: `scripts/conformance.js` (exit on any finding)
- Modify: `test/conformance.test.js`
- Modify: `docs/superpowers/specs/2026-09-03-ci-conformance-gate-design.md` (§3.2, §4.3, §9)

**Interfaces:**
- Consumes: a clean run from Task 6.
- Produces: `npm run conformance` exits non-zero on **any** finding.

**Do not start this task until Task 6 reports `fails 0 warns 0` at both viewports.** Collapsing the tiers over a non-empty backlog makes the gate red on day one, which is the thing that gets gates switched off.

- [ ] **Step 1: Write the failing test**

In `test/conformance.test.js`, add:

```js
// One severity. The engine keeps fails and warns as a confidence signal, but
// the gate no longer distinguishes them: "block the deploy" was the decision,
// and the backlog that made that impossible has been cleared.
test('a warning is enough to fail the gate', async () => {
  const dir = distWith('engine-smoke.html');
  const page = path.join(dir, 'main', 'index.html');
  /* An off-palette background is a `palette` warning, not a fail. */
  fs.writeFileSync(page, fs.readFileSync(page, 'utf8')
    .replace('<main>', '<main><p class="sl-body" style="background:#ff00ff">hot pink</p>'));
  const r = await runConformance({ distDir: dir });
  assert.strictEqual(r.fails.length, 0, 'this fixture should produce warnings, not fails');
  assert.ok(r.warns.length > 0);
  assert.strictEqual(r.blocking, r.fails.length + r.warns.length,
    'blocking count must include warnings once the tiers are collapsed');
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `node --test test/conformance.test.js`
Expected: FAIL — `r.blocking` is `undefined`.

- [ ] **Step 3: Collapse the tiers in the runner**

In `scripts/conformance.js`, add `blocking` to the returned object:

```js
  return {
    pages: pages.length,
    evaluated,
    fails,
    warns,
    /* One severity. The engine still separates fails from warns as a
       confidence signal, and the report still labels them, but the gate counts
       every finding. The two tiers existed while the §3.3 backlog was being
       cleared; it is clear. */
    blocking: fails.length + warns.length,
    viewport,
  };
```

And in `main()`, replace `if (!result.fails.length) return;` with:

```js
  if (!result.blocking) return;
```

and the override banner's count with `result.blocking`.

- [ ] **Step 4: Run to verify it passes**

Run: `node --test test/`
Expected: PASS, all tests

- [ ] **Step 5: Verify the gate is still green on the real sites**

Run: `npm run build && npm run conformance; echo "exit: $?"`
Expected: `fails 0   warns 0`, `exit: 0`

- [ ] **Step 6: Verify it rejects a real regression**

Temporarily break a page, confirm rejection, restore:

```bash
perl -pi -e 's{<dl-section bg="alt" id="why">}{<dl-section bg="page" id="why">}' site-main/landing-preview.html
npm run build:main >/dev/null && npm run conformance; echo "exit: $?"
git checkout site-main/landing-preview.html
```
Expected: a `rhythm` failure and `exit: 1`. (`landing-preview.html` is excluded from discovery, so if this produces no finding, break `site-main/index.html` instead and restore it the same way.)

- [ ] **Step 7: Update the spec**

In `docs/superpowers/specs/2026-09-03-ci-conformance-gate-design.md`:
- §3.2: replace "The `fail`/`warn` split remains inside the engine as a confidence signal while the three causes are cleared, and collapses in step 6 of §8." with "The `fail`/`warn` split remains inside the engine as a confidence signal; the gate counts every finding."
- §4.3: replace the two-tier paragraph with "The gate exits non-zero on any finding. The engine still separates `fail` from `warn` and the report still labels them, but both block."
- §9: update to `0 fails, 0 warns` and note the verification viewports.

- [ ] **Step 8: Commit**

```bash
git add scripts/conformance.js test/conformance.test.js docs/
git commit -m "$(cat <<'EOF'
feat(ci): one severity — every finding blocks

The backlog that made this impossible is cleared: 150 warnings down to zero,
verified at 412x823 and 1440x900. So the gate stops distinguishing fails from
warnings and blocks on any finding, which is what "block the deploy" meant.

The engine keeps the two tiers as a confidence signal and the report keeps
labelling them, because the distinction is useful when reading a failure. It
just no longer changes whether the deploy proceeds.

Changed:
- scripts/conformance.js — result.blocking counts every finding; main() exits
  on it
- test/conformance.test.js — a warning alone must fail the gate
- docs/superpowers/specs/2026-09-03-ci-conformance-gate-design.md — §3.2, §4.3
  and §9 aligned with one severity
Refs: none

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 8: Close the Lighthouse healthcheck hole

> **Later correction (2026-09-03, post-implementation):** the premise below —
> that `lhci autorun` exits 0 after printing `Healthcheck failed!` — is
> false. It exits 1, because `autorun` always runs the healthcheck with
> `--fatal`. The original observation read a shell pipeline's exit code
> (e.g. `... | tail`), which is the last command's status, not lhci's. This
> plan section is left as originally written, as the record of what was
> instructed and why; it is not corrected in place. The wrapper described
> below was still built and kept, on its own merits unrelated to the false
> claim: the browser-resolution guard gives a clear failure message instead
> of an obscure lhci one, and the assertion-count guard is independent of
> this bug — it catches a future lhci version that changes its wording, or a
> config that ends up auditing zero pages. See
> `docs/superpowers/specs/2026-09-03-ci-conformance-gate-design.md` §4.4 and
> `.superpowers/sdd/2026-09-03-ci-conformance-gate/task-8-report.md` for the
> corrected account.

**Files:**
- Create: `scripts/lighthouse.js`
- Modify: `package.json` (`lighthouse` script points at it)
- Modify: `.github/workflows/lighthouse-ci.yml`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: `npm run lighthouse` exits non-zero if Chrome is missing or if any assertion fails.

**Why:** `lhci autorun` prints `Healthcheck failed!` and **exits 0**. Observed on 2026-09-03: with no Chrome resolvable, the job goes green having audited nothing. That is the same silent-pass class as the empty glob, from a different direction.

- [ ] **Step 1: Reproduce the hole**

Run: `CHROME_PATH=/nonexistent npx --no-install lhci autorun; echo "exit: $?"`
Expected: prints `❌  Chrome installation not found` and `Healthcheck failed!`, then `exit: 0`. That zero is the bug.

- [ ] **Step 2: Write the wrapper**

Create `scripts/lighthouse.js`:

```js
#!/usr/bin/env node
'use strict';

/* Wrapper around `lhci autorun`, for one reason: lhci prints
 * "Healthcheck failed!" and then exits 0. A runner with no resolvable Chrome
 * therefore reports success having audited nothing — the same silent-pass
 * class as the page-discovery glob that matched no files for weeks.
 *
 * So: resolve a browser and fail loudly before running, and treat the
 * healthcheck line in the output as a failure regardless of the exit code. */

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

function resolveChrome() {
  if (process.env.CHROME_PATH && fs.existsSync(process.env.CHROME_PATH)) {
    return process.env.CHROME_PATH;
  }
  /* Playwright is a declared dependency and its browser is already installed
     for the conformance runner, so borrow it rather than asking for a second
     download. */
  try {
    const { chromium } = require(path.join(ROOT, 'node_modules', 'playwright'));
    const exe = chromium.executablePath();
    if (exe && fs.existsSync(exe)) return exe;
  } catch (e) { /* fall through to the error below */ }
  return null;
}

const chrome = resolveChrome();
if (!chrome) {
  console.error(
    'lighthouse: no Chrome found. Set CHROME_PATH, or run ' +
    '`npx playwright install chromium`.\n' +
    'Failing rather than letting lhci exit 0 on a failed healthcheck.');
  process.exit(1);
}
console.log('lighthouse: using ' + chrome);

const run = spawnSync(
  path.join(ROOT, 'node_modules', '.bin', 'lhci'),
  ['autorun'],
  { cwd: ROOT, encoding: 'utf8', env: Object.assign({}, process.env, { CHROME_PATH: chrome }) });

process.stdout.write(run.stdout || '');
process.stderr.write(run.stderr || '');

const output = (run.stdout || '') + (run.stderr || '');
if (/Healthcheck failed/i.test(output)) {
  console.error('\nlighthouse: healthcheck failed — treating as a failure despite lhci exit ' + run.status);
  process.exit(1);
}
if (!/Checking assertions against \d+ URL/.test(output)) {
  console.error('\nlighthouse: no assertions were checked — refusing to report a pass over nothing.');
  process.exit(1);
}
process.exit(run.status === null ? 1 : run.status);
```

- [ ] **Step 3: Point the npm script at it**

In `package.json`, change:

```json
"lighthouse": "npm run build && node scripts/lighthouse.js"
```

- [ ] **Step 4: Verify the hole is closed**

Run: `CHROME_PATH=/nonexistent npm run lighthouse; echo "exit: $?"`
Expected: it resolves Playwright's Chromium instead of failing (since `/nonexistent` does not exist), prints `lighthouse: using …`, and runs. To test the genuine no-Chrome path, temporarily rename Playwright's browser directory, or trust the code path — the assertion-count guard below is the stronger check.

Run: `npm run lighthouse; echo "exit: $?"`
Expected: `Checking assertions against 42 URL(s)`, then `exit: 0`.

- [ ] **Step 5: Verify a real budget breach fails**

Temporarily tighten a threshold and confirm rejection:

```bash
perl -pi -e "s{'categories:seo': \['error', \{ minScore: 0.9 \}\]}{'categories:seo': ['error', { minScore: 1.01 }]}" lighthouserc.js
npm run lighthouse; echo "exit: $?"
git checkout lighthouserc.js
```
Expected: assertion failures listed, `exit: 1`.

- [ ] **Step 6: Update the workflow comment**

In `.github/workflows/lighthouse-ci.yml`, replace the comment above `Run Lighthouse CI` (the paragraph beginning "Runs against the built dist/ directory") with:

```yaml
      # Runs against the built dist/ directory served locally, not the live
      # site — this never depends on DNS/domain state. Pages come from
      # scripts/site-pages.js, so a new page or a fourth site is covered on
      # its first push. Wrapped by scripts/lighthouse.js because `lhci
      # autorun` exits 0 after printing "Healthcheck failed!", which made a
      # Chrome-less runner report success over nothing.
```

- [ ] **Step 7: Commit**

```bash
git add scripts/lighthouse.js package.json .github/workflows/lighthouse-ci.yml
git commit -m "$(cat <<'EOF'
fix(ci): stop lhci passing green when it audited nothing

`lhci autorun` prints "Healthcheck failed!" and then exits 0, so a runner with
no resolvable Chrome reports success having audited nothing. Observed here on
2026-09-03. Same silent-pass class as the page-discovery glob that matched no
files for weeks, arriving from a different direction.

scripts/lighthouse.js resolves a browser before running — CHROME_PATH, or
Playwright's Chromium, which is already installed for the conformance runner —
and fails loudly if there is none. It then treats the healthcheck line as a
failure regardless of exit code, and refuses to report a pass unless the output
actually says how many URLs were asserted against.

Changed:
- scripts/lighthouse.js — new: browser resolution, healthcheck and
  assertion-count guards
- package.json — lighthouse script runs the wrapper
- .github/workflows/lighthouse-ci.yml — comment explains the wrapper
Refs: none

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 9: Wire the gate into both publish paths

**Files:**
- Modify: `.github/workflows/deploy-site.yml`
- Modify: `.github/workflows/lighthouse-ci.yml`
- Create: `docs/deploy/cloudflare-build-command.md`

**Interfaces:**
- Consumes: `npm run conformance` (Task 4), `npm run lighthouse` (Task 8), `npm test` (Task 1).
- Produces: a push that violates the CI does not publish.

**This is the only task that changes what happens on a push.** Everything before it can be run by hand.

**Note on the two mechanisms:** the apex publishes through GitHub Actions and the two subdomains through Cloudflare Pages. All three converge on Cloudflare once Xneelo clears, at which point the workflow half of this task is deleted and only the build command remains. The gate itself is mechanism-agnostic — one `npm run conformance` — precisely so that convergence is a deletion rather than a rewrite.

- [ ] **Step 1: Gate the apex deploy**

In `.github/workflows/deploy-site.yml`, insert between `Install dependencies` and `Build the main site (dist/main)`:

```yaml
      # The gate. A design-system violation or a Lighthouse budget breach stops
      # the deploy here rather than being reported after the fact. Runs against
      # a full build of all three sites, because shared/ is copied into each and
      # a change there can break a site whose own source was untouched.
      - name: Build all sites for checking
        run: npm run build

      - name: Unit tests
        run: npm test

      - name: Design-system conformance
        run: npm run conformance

      - name: Lighthouse budgets
        run: node scripts/lighthouse.js
```

`Build the main site (dist/main)` stays where it is: it rebuilds `dist/main` with the production `CF_PAGES_BRANCH`/`GITHUB_REF_NAME` context so `SL_BUILD.prod` is correct in what actually ships.

- [ ] **Step 2: Verify the workflow parses**

Run: `python3 -c "import yaml;yaml.safe_load(open('.github/workflows/deploy-site.yml'));print('ok')"`
Expected: `ok`

- [ ] **Step 3: Make the Lighthouse workflow gate too**

In `.github/workflows/lighthouse-ci.yml`, add before `Run Lighthouse CI`:

```yaml
      - name: Unit tests
        run: npm test

      - name: Design-system conformance
        run: npm run build && npm run conformance
```

- [ ] **Step 4: Document the Cloudflare build command**

Create `docs/deploy/cloudflare-build-command.md`:

```markdown
# Cloudflare Pages build commands

Two Pages projects, both Git-connected to `main` of
`StephanM-ZA/sunlogic_website`. The apex publishes through GitHub Actions for
now and joins these once the Xneelo cutover completes.

| Project | Build command | Output directory |
|---|---|---|
| `sunlogic-energy` | `npm run build && npm test && npm run conformance && npm run build:energy` | `dist/energy` |
| `sunlogic-electrical` | `npm run build && npm test && npm run conformance && npm run build:electrical` | `dist/electrical` |

## Why the build command and not a separate step

Cloudflare Pages has no pre-build hook: the build command *is* the only place
to gate. A non-zero exit there means the deployment fails and the previous one
stays live, which is exactly the behaviour wanted — a violation does not
publish.

## Why `npm run build` first

`npm run conformance` audits `dist/`, and it audits all three sites because
`shared/` is copied into each one. A change to `shared/sunlogic.css` can break
a site whose own source directory was untouched, so the gate has to see
everything before the per-site build produces what ships.

## Why the per-site build runs last

It rebuilds with Cloudflare's `CF_PAGES_BRANCH` in the environment, so
`window.SL_BUILD.prod` is `true` in the published output and the developer
badge stays out of production. See `scripts/build-site.js:isProductionBuild`.

## Overriding a blocked deploy

Set `SL_CONFORMANCE_OVERRIDE` to a non-empty reason in the project's
environment variables. The gate passes and prints a banner naming the reason.
Remove it once the finding is fixed — it is deliberately coarse and deliberately
loud, because the alternative is a per-finding waiver list, which is a baseline
arrived at one line at a time.

## Chromium on the Cloudflare builder

`npm run conformance` needs a browser. Cloudflare's build image does not ship
one, so the build command needs `npx playwright install --with-deps chromium`
prepended on first use, or `PLAYWRIGHT_BROWSERS_PATH=0` set so the download is
cached in `node_modules` between builds. Verify on the first gated deployment
and correct this file with whatever actually worked.
```

- [ ] **Step 5: Verify the gate rejects a violation end to end, locally**

```bash
perl -pi -e 's{<dl-section bg="alt" id="why-sunlogic">}{<dl-section bg="page" id="why-sunlogic">}' site-main/index.html
npm run build >/dev/null && npm run conformance; echo "exit: $?"
git checkout site-main/index.html
npm run build >/dev/null && npm run conformance; echo "restored exit: $?"
```
Expected: a `rhythm` failure and `exit: 1`, then `restored exit: 0`.

- [ ] **Step 6: Commit and push**

```bash
git add .github/workflows/ docs/deploy/
git commit -m "$(cat <<'EOF'
feat(ci): a CI violation now stops the deploy

The gate was runnable by hand from the previous commits; this is the commit
that gives it teeth. A design-system violation or a Lighthouse budget breach
fails the build, and a failed build does not publish.

Both publish paths call the same `npm run conformance`: GitHub Actions for the
apex, and the Cloudflare Pages build command for the two subdomains, documented
in docs/deploy/cloudflare-build-command.md because it lives in the dashboard
rather than in the repo. Cloudflare has no pre-build hook, so the build command
is the only place to gate — a non-zero exit there keeps the previous deployment
live.

The gate runs a full three-site build before the per-site one, because shared/
is copied into every site and a change there can break a site whose own source
was untouched.

Once all three sites move to Cloudflare the workflow half of this is deleted
and only the build command remains. The gate is one mechanism-agnostic command
so that convergence is a deletion rather than a rewrite.

Changed:
- .github/workflows/deploy-site.yml — test, conformance and Lighthouse gates
  before the shipping build
- .github/workflows/lighthouse-ci.yml — test and conformance gates
- docs/deploy/cloudflare-build-command.md — new: the two build commands, why
  the gate lives in the build command, override, and the Chromium caveat
Refs: none

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
git push
```

- [ ] **Step 7: Watch the first gated run**

```bash
until [ "$(gh -R StephanM-ZA/sunlogic_website run list --limit 2 --json status --jq '[.[]|select(.status!="completed")]|length')" = "0" ]; do sleep 15; done
gh -R StephanM-ZA/sunlogic_website run list --limit 2 --json conclusion,name --jq '.[] | "\(.conclusion) — \(.name)"'
```
Expected: both `success`.

Then confirm the gate did real work rather than passing vacuously:

```bash
ID=$(gh -R StephanM-ZA/sunlogic_website run list --workflow=deploy-site.yml --limit 1 --json databaseId --jq '.[0].databaseId')
gh -R StephanM-ZA/sunlogic_website run view $ID --log | grep -E "pages checked|Checking assertions"
```
Expected: `pages checked 42/42   fails 0   warns 0` and `Checking assertions against 42 URL(s)`. A green run without those two lines is a vacuous pass and must be investigated before trusting the gate.

- [ ] **Step 8: Verify the two Cloudflare projects**

Update the build command on `sunlogic-energy` in the Cloudflare dashboard first, deploy, and confirm from the build log that `pages checked 42/42` appears. Only then do `sunlogic-electrical` — one at a time, so a broken build command cannot take both subdomains down at once.

Confirm both are live and current:

```bash
for h in energy.sunlogic.co.za electrical.sunlogic.co.za; do
  printf "%-30s " "$h"
  curl -s -H "Cache-Control: no-cache" "https://$h/" | grep -o '"short":"[a-f0-9]*"\|"prod":[a-z]*' | tr '\n' ' '
  echo
done
```
Expected: both on the pushed SHA with `"prod":true`.

---

## Self-Review

**Spec coverage.** Every section of the spec maps to a task:

| Spec | Task |
|---|---|
| §3.1 no suppression, exceptions in the rule | Tasks 5, 6 — both fix rules rather than adding waivers |
| §3.2/§3.3 one severity after a backlog pass | Tasks 5, 6, 7 |
| §4.1 engine/presenter split, `why` per rule | Task 2 |
| §4.2 `site-pages.js` | Task 1 |
| §4.3 `conformance.js` | Task 4 |
| §4.4 integrity — three silent-pass modes | Task 1 (empty set), Task 4 (missing engine, coverage gap), Task 8 (healthcheck) |
| §4.5 Lighthouse folded in | Task 1 (discovery), Task 8 (gating) |
| §5 the report, grouped by rule, with intent | Task 4 |
| §6 override | Task 4 |
| §7 testing — fixtures, watchman, integration | Tasks 1, 3, 4 |
| §8 sequencing | Tasks 1–9 in order |

**One spec correction this plan makes.** §3.3 says the `copy` group is "the only one that is really the pages' fault". It is not: the prose-case rule counts long words starting with a capital, so `"Cape Town's own structure"` — sentence case with a proper noun — trips it. Task 6 is therefore triage, and Step 7 of Task 7 updates the spec. Verified by replicating the rule against the real heading.

**Placeholders.** None. Every code step carries the code; every verification step carries the command and its expected output. Two things are deliberately left to be discovered rather than guessed: the exact list of `copy` findings (Task 6 Step 1 produces it, because guessing which of 12 headings are genuine would be inventing findings) and the Chromium incantation for Cloudflare's build image (Task 9 Step 4 says to verify and correct the doc, because that depends on their image).

**Type consistency.** `Finding` is `{rule, why, detail, selector}` in Task 2 and the runner adds `page` in Task 4 — checked against the report in Task 4 and the tests in Tasks 3, 5, 6. `sitePages()` returns `{site, file, url}` in Task 1 and is consumed as `p.url` in Tasks 1 and 4. `startServer()` returns `{port, close, urlFor}` in Task 2 and is consumed in Tasks 2, 3, 4. `runConformance()` returns `{pages, evaluated, fails, warns, viewport}` in Task 4, gaining `blocking` in Task 7 — the Task 7 test asserts on `blocking`, which does not exist before that task, and the step order makes that the failing test.

**Ordering risk worth naming.** Task 7 must not start before Task 6 reports zero at both viewports; the plan says so in bold at the top of Task 7. Collapsing the tiers over a live backlog makes the gate red on day one, and a gate that is red on day one gets switched off.
