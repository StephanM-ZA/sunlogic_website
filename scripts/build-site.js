#!/usr/bin/env node
// Copies site-daylight/ to dist/ and minifies every .css/.js file in the
// copy. Source under site-daylight/ stays hand-readable; dist/ is the
// build artifact GitHub Pages actually publishes (see
// .github/workflows/deploy-site.yml).

'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const csso = require('csso');
const { minify: minifyJs } = require('terser');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'site-daylight');
const OUT = path.join(ROOT, 'dist');
const REPO_URL = 'https://github.com/StephanM-ZA/sunlogic_website';

// Commit SHA visible in the site's own footer, stamped fresh on every
// build so it's never stale and never needs a manual reminder to
// update. GITHUB_SHA is set automatically in the deploy workflow;
// falling back to `git` covers local `npm run build`.
function getBuildInfo() {
  const sha = process.env.GITHUB_SHA
    || execSync('git rev-parse HEAD', { cwd: ROOT }).toString().trim();
  const date = new Date().toISOString().slice(0, 10);
  return { sha, short: sha.slice(0, 7), repo: REPO_URL, date };
}

function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
      copyRecursive(path.join(src, entry), path.join(dest, entry));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

async function minifyFile(filePath) {
  const ext = path.extname(filePath);
  const src = fs.readFileSync(filePath, 'utf8');
  if (ext === '.css') {
    const { css } = csso.minify(src);
    fs.writeFileSync(filePath, css);
  } else if (ext === '.js') {
    const result = await minifyJs(src, { format: { comments: false } });
    if (result.code) fs.writeFileSync(filePath, result.code);
  }
}

async function walkAndMinify(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walkAndMinify(full);
    } else if (/\.(css|js)$/.test(entry.name)) {
      await minifyFile(full);
    }
  }
}

function stampBuildInfo(dir, build) {
  const tag = '<script>window.SL_BUILD=' + JSON.stringify(build) + ';</script>\n</head>';
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      stampBuildInfo(full, build);
    } else if (entry.name.endsWith('.html')) {
      const html = fs.readFileSync(full, 'utf8');
      if (html.includes('</head>')) {
        fs.writeFileSync(full, html.replace('</head>', tag));
      }
    }
  }
}

async function main() {
  if (fs.existsSync(OUT)) fs.rmSync(OUT, { recursive: true, force: true });
  copyRecursive(SRC, OUT);
  stampBuildInfo(OUT, getBuildInfo());
  await walkAndMinify(OUT);
  console.log('Build complete:', OUT);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
