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

/* Element visibility and touch-target heights differ by width, and roughly
   ten colour findings per page only exist at desktop width — a gate that
   only ever opened 412x823 never visited them. The CLI path runs both;
   runConformance() itself still takes a single viewport per call because
   the tests call it that way. */
const DESKTOP_VIEWPORT = { width: 1440, height: 900 };
const GATED_VIEWPORTS = [DEFAULT_VIEWPORT, DESKTOP_VIEWPORT];

async function runConformance(options) {
  const opts = options || {};
  const distDir = opts.distDir || path.join(ROOT, 'dist');
  const viewport = opts.viewport || DEFAULT_VIEWPORT;

  const pages = sitePages(distDir, { sites: opts.sites });   /* throws on empty or unknown */
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
        /* Measure resting state. A colour caught partway through a transition is a
           sampling artefact, not a violation: .sl-nav__link transitions colour over
           100ms and components.js sets aria-current after render, so a sample taken
           200ms after load intermittently read a value between two palette colours
           and reported a palette warning for it. Without this the warn count drifts
           between runs, and a gate whose count moves on its own fails deploys at
           random. */
        await page.addStyleTag({ content: '*,*::before,*::after{transition:none !important;animation:none !important}' });
        /* The CSS freeze above closes the transition door, but not the
           JavaScript one: dl-terminal[stream] in shared/components.js paints
           one row every 900ms, and the fleet-live poll rewrites
           .sl-stat__value on its own timer, both well after `load` fires. A
           page sampled mid-render gives findings that shift between runs for
           reasons that have nothing to do with the page being right or
           wrong. Wait for the DOM to actually stop changing — no mutation
           for ~1000ms — before evaluating, with a ~5000ms ceiling so a
           page that never stops animating fails fast instead of hanging
           the gate. */
        await page.evaluate(() => new Promise((resolve) => {
          const QUIET_MS = 1000;
          const CEILING_MS = 5000;
          let quietTimer = null;
          const done = () => {
            clearTimeout(quietTimer);
            observer.disconnect();
            clearTimeout(ceiling);
            resolve();
          };
          const observer = new MutationObserver(() => {
            clearTimeout(quietTimer);
            quietTimer = setTimeout(done, QUIET_MS);
          });
          observer.observe(document.documentElement, {
            childList: true, subtree: true, attributes: true, characterData: true,
          });
          quietTimer = setTimeout(done, QUIET_MS);
          const ceiling = setTimeout(done, CEILING_MS);
        }));
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
    /* Carried into the report so a narrowed run can never be mistaken for a
       full one. "pages checked 11/11" reads identically either way. */
    sites: opts.sites && opts.sites.length ? opts.sites.slice() : null,
  };
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
    '   viewport ' + result.viewport.width + 'x' + result.viewport.height +
    (result.sites ? '   sites ' + result.sites.join(',') + ' ONLY' : ''));
  return lines.join('\n');
}

async function main() {
  const override = process.env.SL_CONFORMANCE_OVERRIDE;

  /* Bare = every site, which is what every deploy path calls. Names narrow it
     for local iteration: `npm run conformance -- main`. */
  const sites = process.argv.slice(2).filter((a) => !a.startsWith('-'));

  /* Both gated viewports, aggregated. Each is a separate runConformance()
     call — and a separate browser/server lifecycle — because the design
     requires both widths checked, not just the default one runConformance()
     falls back to when called bare. */
  const results = [];
  for (const viewport of GATED_VIEWPORTS) {
    const result = await runConformance({ viewport, sites });
    results.push(result);
    console.log(report(result));
    console.log('');
  }

  const totalBlocking = results.reduce((sum, r) => sum + r.blocking, 0);
  const totalFails = results.reduce((sum, r) => sum + r.fails.length, 0);
  const totalWarns = results.reduce((sum, r) => sum + r.warns.length, 0);

  console.log('================================================================');
  console.log('per-viewport: ' + results.map((r) =>
    r.viewport.width + 'x' + r.viewport.height + ' → fails ' + r.fails.length +
    ' warns ' + r.warns.length).join('   |   '));
  console.log('total fails ' + totalFails + '   total warns ' + totalWarns +
    '   total blocking ' + totalBlocking);
  if (sites.length) {
    console.log('PARTIAL RUN — ' + sites.join(', ') + ' only. The deploy gate runs every site.');
  }
  console.log('================================================================');

  if (!totalBlocking) return;

  if (override && override.trim()) {
    console.log('');
    console.log('================================================================');
    console.log('CONFORMANCE OVERRIDDEN — ' + totalBlocking + ' failure(s) allowed through');
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
