#!/usr/bin/env node
'use strict';

/* Wrapper around `lhci autorun`, for defence in depth.
 *
 * A check that reports success while having audited nothing is the failure
 * this repository has already suffered once: page discovery globbed a path
 * that matched no files, and the job passed green for weeks. So this refuses
 * to report a pass unless the output states how many URLs were asserted
 * against, and it resolves a browser up front so a missing one fails with a
 * clear message rather than an obscure lhci error.
 *
 * NOTE: an earlier version of this comment claimed `lhci autorun` exits 0
 * after printing "Healthcheck failed!". That is false — it exits 1, because
 * autorun runs the healthcheck with --fatal. The original observation read a
 * shell pipeline's exit code, which is the last command's status rather than
 * lhci's. The healthcheck check below is kept as belt and braces against a
 * future version changing that behaviour, not because it is needed today.
 */

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
/* Must be [1-9]\d*, not \d+: lhci prints "Checking assertions against 0
   URL(s)" and exits 0 when the URL set is empty, so a bare \d+ would match
   zero and wave through exactly the scenario this guard exists to catch. */
if (!/Checking assertions against [1-9]\d* URL/.test(output)) {
  console.error('\nlighthouse: no assertions were checked — refusing to report a pass over nothing.');
  process.exit(1);
}
process.exit(run.status === null ? 1 : run.status);
