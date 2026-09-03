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
