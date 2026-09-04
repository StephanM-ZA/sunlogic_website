#!/usr/bin/env node
'use strict';

/* Layout sweep — every page, at every breakpoint the CSS actually declares.
 *
 * The design gate (scripts/conformance.js) answers "is this in the system?":
 * palette, type, case, band rhythm, nav limits. It says nothing about whether
 * the page HOLDS TOGETHER — a heading can be perfectly on-palette while
 * sitting on top of the logo.
 *
 * This is the other half. It opens each page at each width and looks for the
 * four ways a responsive layout fails visibly:
 *
 *   overflow   the page scrolls sideways, or an element sticks out past the
 *              viewport. The classic symptom of a fixed width or a long
 *              unbroken string.
 *   overlap    two elements that should sit beside each other are drawn on
 *              top of each other. Only checked between siblings, and only
 *              where neither is positioned deliberately — see below.
 *   clipped    a box is shorter than the text inside it, so the last line is
 *              cut off. Catches a fixed height meeting bigger type.
 *   collapsed  an element that has content but zero width or height, which is
 *              usually a flex/grid child that lost its basis.
 *
 * Widths come from the stylesheet itself rather than a hand-written list, so
 * a new media query is swept the day it is added and nobody has to remember
 * to add it here. Each declared breakpoint is probed on both sides — 1px
 * below and at the boundary — because that is exactly where a layout snaps.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const { chromium } = require(path.join(ROOT, 'node_modules', 'playwright'));
const { sitePages } = require('./site-pages.js');
const { startServer } = require('./static-server.js');

/* Read the breakpoints out of the CSS instead of guessing them. */
function declaredBreakpoints() {
  const css = fs.readFileSync(path.join(ROOT, 'shared', 'sunlogic.css'), 'utf8');
  const found = new Set();
  const re = /@media[^{]*?(min|max)-width:\s*(\d+)px/g;
  let m;
  while ((m = re.exec(css))) found.add(Number(m[2]));
  return [...found].sort((a, b) => a - b);
}

function sweepWidths() {
  const bps = declaredBreakpoints();
  const widths = new Set([320, 360, 412, 768, 1024, 1280, 1440, 1920]);
  /* Both sides of every declared boundary: a rule that applies at N and not
     at N-1 is the whole point of a breakpoint, and bugs live on one side. */
  for (const b of bps) { widths.add(b - 1); widths.add(b); }
  return [...widths].filter((w) => w >= 320).sort((a, b) => a - b);
}

/* Runs inside the page. Returns plain data only.
 *
 * The exclusions below are the whole difference between a useful sweep and
 * a useless one. The first version of this script reported 19,257 findings
 * across 450 combinations, essentially all of them deliberate: the icon set
 * is SVG whose paths overlap by design, dl-reveal animates with a transform
 * so an armed element genuinely sits over its neighbour mid-reveal, and
 * dl-roll is a fixed-height window with a taller stack of items rolling
 * through it. A report nobody can read is the same as no report — worse,
 * because it looks like diligence.
 */
function auditInPage() {
  const out = [];
  const vw = window.innerWidth;

  /* Deliberate stacking, by component. Each of these is a thing whose whole
     job is to draw one box over another, so an "overlap" inside it is the
     feature working. */
  const BY_DESIGN = '.sl-roll, .sl-hero, .sl-cta, .sl-drawer, .sl-dock, ' +
    '[class*="plugin-"], dialog, .sl-nav';

  const inSvg = (el) => !!el.closest('svg');
  /* A transform moves a box away from where layout put it, so its rect says
     nothing about whether the layout is sound. dl-reveal.is-armed is exactly
     this: translateY(16px) before it becomes visible. */
  const transformed = (el) => {
    for (let n = el; n && n !== document.body; n = n.parentElement) {
      const t = getComputedStyle(n).transform;
      if (t && t !== 'none') return true;
    }
    return false;
  };

  /* An element wider than the viewport inside a box that clips or scrolls is
     contained, not broken — the day-feed panel scrolls its own rows, and a
     wide table in an overflow-x:auto wrapper is the correct pattern, not a
     fault. Only unclipped overflow reaches the page edge. */
  const clippedByAncestor = (el) => {
    for (let n = el.parentElement; n && n !== document.documentElement; n = n.parentElement) {
      const o = getComputedStyle(n);
      if (o.overflowX !== 'visible' || o.overflow === 'hidden') return true;
    }
    return false;
  };

  /* The skip link and other visually-hidden helpers are parked far off-canvas
     on purpose and pulled back on focus. Something at -9999px is a technique,
     not a mistake; something at -12px is a mistake. */
  const offscreenOnPurpose = (el, r) => r.left < -1000 || r.right < -1000;
  const sel = (el) => {
    const tag = el.tagName.toLowerCase();
    const id = el.id ? '#' + el.id : '';
    const cls = typeof el.className === 'string' && el.className.trim()
      ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : '';
    return tag + id + cls;
  };

  /* 1 — the page itself must not scroll sideways. */
  const docW = document.documentElement.scrollWidth;
  if (docW > vw + 1) {
    out.push({ kind: 'overflow', detail: 'document scrollWidth ' + docW + ' > viewport ' + vw, selector: 'html' });
  }

  const all = [...document.querySelectorAll('body *')].filter((el) => !inSvg(el));
  const visible = all.filter((el) => {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || cs.opacity === '0') return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 || r.height > 0;
  });

  for (const el of visible) {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);

    /* 2 — element sticking out past the right edge. Fixed/sticky chrome and
       anything deliberately translated is skipped: an off-canvas drawer is
       supposed to be out there. Left edge is checked too, at -1 tolerance. */
    if (cs.position !== 'fixed' && cs.position !== 'sticky' && cs.transform === 'none' &&
        !clippedByAncestor(el) && !offscreenOnPurpose(el, r)) {
      if (r.right > vw + 1 && r.width <= vw) {
        out.push({ kind: 'overflow', detail: 'right edge ' + Math.round(r.right) + ' past viewport ' + vw, selector: sel(el) });
      }
      if (r.left < -1 && r.width <= vw) {
        out.push({ kind: 'overflow', detail: 'left edge ' + Math.round(r.left), selector: sel(el) });
      }
    }

    /* 3 — content taller than its own box.
       Three legitimate reasons a box is shorter than its content, all
       excluded: a line-clamped summary, a component that rolls a taller
       stack through a fixed window (dl-roll), and a box the user can
       scroll. What is left is type that has outgrown a fixed height. */
    const clamped = cs.webkitLineClamp && cs.webkitLineClamp !== 'none';
    if (cs.overflowY === 'hidden' && !clamped && !el.closest(BY_DESIGN) &&
        el.scrollHeight > el.clientHeight + 8 && el.clientHeight > 0) {
      out.push({ kind: 'clipped', detail: 'content ' + el.scrollHeight + 'px in a ' + el.clientHeight + 'px box', selector: sel(el) });
    }

    /* 4 — has text but no box to put it in. */
    if (el.childElementCount === 0 && el.textContent.trim() && (r.width === 0 || r.height === 0)) {
      out.push({ kind: 'collapsed', detail: 'text present but box is ' + Math.round(r.width) + 'x' + Math.round(r.height), selector: sel(el) });
    }
  }

  /* 5 — siblings drawn on top of each other.
     Only BLOCK-level siblings, both in normal flow, neither transformed,
     neither inside a component whose job is to stack. Inline elements are
     excluded because two links on one wrapped line share a line box and
     their rects legitimately intersect — that is text, not a layout fault. */
  const containers = all.filter((el) => el.childElementCount > 1 && !el.closest(BY_DESIGN));
  for (const parent of containers) {
    const kids = [...parent.children].filter((el) => {
      if (inSvg(el)) return false;
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden') return false;
      if (cs.display === 'inline' || cs.display === 'inline-block') return false;
      if (cs.position === 'absolute' || cs.position === 'fixed' || cs.position === 'sticky') return false;
      if (cs.float !== 'none') return false;
      if (transformed(el)) return false;
      const r = el.getBoundingClientRect();
      return r.width > 4 && r.height > 4;
    });
    for (let i = 0; i < kids.length; i++) {
      for (let j = i + 1; j < kids.length; j++) {
        const a = kids[i].getBoundingClientRect();
        const b = kids[j].getBoundingClientRect();
        const ox = Math.min(a.right, b.right) - Math.max(a.left, b.left);
        const oy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
        /* 4px of slack: sub-pixel layout and negative letter-spacing produce
           1-2px touches that are not overlaps. */
        if (ox > 4 && oy > 4) {
          out.push({
            kind: 'overlap',
            detail: sel(kids[i]) + ' overlaps ' + sel(kids[j]) + ' by ' + Math.round(ox) + 'x' + Math.round(oy) + 'px',
            selector: sel(parent),
          });
        }
      }
    }
  }
  return out;
}

async function main() {
  const distDir = path.join(ROOT, 'dist');
  const only = process.argv[2];
  const pages = sitePages(distDir, { sites: only ? [only] : undefined });
  const widths = sweepWidths();
  const server = await startServer(distDir);
  const browser = await chromium.launch();

  console.log('sweeping ' + pages.length + ' pages x ' + widths.length + ' widths (' + widths.join(', ') + ')\n');

  const findings = [];
  let checks = 0;
  try {
    for (const p of pages) {
      for (const width of widths) {
        const page = await browser.newPage({ viewport: { width, height: 900 } });
        try {
          await page.goto(server.urlFor(p.url), { waitUntil: 'load' });
          await page.addStyleTag({ content: '*,*::before,*::after{transition:none !important;animation:none !important}' });
          await page.waitForTimeout(120);
          const found = await page.evaluate(auditInPage);
          checks++;
          for (const f of found) findings.push(Object.assign({ page: p.url, width }, f));
        } finally {
          await page.close();
        }
      }
    }
  } finally {
    await browser.close();
    await server.close();
  }

  /* Integrity: the same rule the design gate holds itself to. "Nothing found"
     and "nothing ran" must not print the same thing. */
  const expected = pages.length * widths.length;
  if (checks !== expected) {
    console.error('swept ' + checks + ' of ' + expected + ' page/width combinations — incomplete');
    process.exit(1);
  }

  const byKind = {};
  for (const f of findings) (byKind[f.kind] = byKind[f.kind] || []).push(f);

  for (const [kind, list] of Object.entries(byKind)) {
    console.log('\n' + kind.toUpperCase() + ' — ' + list.length);
    /* Group identical finding across widths: one bug at nine widths is one
       bug, and printing it nine times buries the other eight. */
    const seen = {};
    for (const f of list) {
      const key = f.page + '|' + f.selector + '|' + f.detail.replace(/\d+/g, '#');
      (seen[key] = seen[key] || { f, widths: [] }).widths.push(f.width);
    }
    for (const { f, widths: ws } of Object.values(seen).slice(0, 40)) {
      console.log('  ' + f.page + '  ' + f.selector);
      console.log('      ' + f.detail + '   @ ' + ws.join(', '));
    }
  }

  console.log('\n================================================================');
  console.log('swept ' + checks + ' page/width combinations   findings ' + findings.length);
  console.log('================================================================');
  process.exit(findings.length ? 1 : 0);
}

main().catch((err) => { console.error(err); process.exit(1); });
