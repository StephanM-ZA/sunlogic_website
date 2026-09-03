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
const sharp = require('sharp');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'site-energy');
/* The design system lives outside any one site so all three can share it.
   It is copied into each site's output, which keeps every page's existing
   relative reference (shared/sunlogic.css) working untouched. */
const SHARED = path.join(ROOT, 'shared');
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

// JPEG/JPEG-alike and GIF are the two formats we ship that WebP reliably
// beats: JPEG loses nothing visible at quality 80, and an animated GIF is
// almost always 50%+ larger than the same frames as animated WebP. PNG and
// existing WebP aren't touched — the only PNG on the site is the favicon,
// which needs to stay a PNG for OS/browser compatibility.
const CONVERTIBLE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.gif']);

function findFiles(dir, extensions) {
  const found = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      found.push(...findFiles(full, extensions));
    } else if (extensions.has(path.extname(entry.name).toLowerCase())) {
      found.push(full);
    }
  }
  return found;
}

// Converts every JPEG/GIF in dir to WebP in place and deletes the original.
// Returns a map of {old relative path -> new relative path}, both posix-style
// (forward slashes) since that's what the HTML source uses, for the caller to
// rewrite references with.
async function optimizeImages(dir) {
  const renameMap = {};
  const files = findFiles(dir, CONVERTIBLE_EXTENSIONS);
  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    const outFile = file.slice(0, -ext.length) + '.webp';
    const isAnimated = ext === '.gif';
    await sharp(file, isAnimated ? { animated: true } : undefined)
      .webp({ quality: 80 })
      .toFile(outFile);
    const beforeBytes = fs.statSync(file).size;
    const afterBytes = fs.statSync(outFile).size;
    fs.unlinkSync(file);
    const oldRel = path.relative(dir, file).split(path.sep).join('/');
    const newRel = path.relative(dir, outFile).split(path.sep).join('/');
    renameMap[oldRel] = newRel;
    console.log(
      '  ' + oldRel + ' -> ' + newRel + ' (' +
      Math.round(beforeBytes / 1024) + 'K -> ' + Math.round(afterBytes / 1024) + 'K)'
    );
  }
  return renameMap;
}

// Every occurrence of a converted image's path is an exact, literal string
// (img/photo src, <link rel=preload>, og:image, twitter:image, JSON-LD
// "image") — never a pattern needing regex — so a plain string-replace over
// each HTML file is sufficient and can't misfire on an unrelated path.
function rewriteImageReferences(dir, renameMap) {
  const pairs = Object.entries(renameMap);
  if (pairs.length === 0) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      rewriteImageReferences(full, renameMap);
    } else if (entry.name.endsWith('.html')) {
      let html = fs.readFileSync(full, 'utf8');
      let changed = false;
      for (const [oldRel, newRel] of pairs) {
        if (html.includes(oldRel)) {
          html = html.split(oldRel).join(newRel);
          changed = true;
        }
      }
      if (changed) fs.writeFileSync(full, html);
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
  copyRecursive(SHARED, path.join(OUT, 'shared'));
  console.log('Optimizing images:');
  const renameMap = await optimizeImages(OUT);
  rewriteImageReferences(OUT, renameMap);
  stampBuildInfo(OUT, getBuildInfo());
  await walkAndMinify(OUT);
  console.log('Build complete:', OUT);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
