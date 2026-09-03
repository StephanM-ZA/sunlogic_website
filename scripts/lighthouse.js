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
