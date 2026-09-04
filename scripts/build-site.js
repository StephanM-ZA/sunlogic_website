#!/usr/bin/env node
// Builds every site in sites.config.js — site-main, site-energy and
// site-electrical — into its own dist/ directory: copies the source, folds in
// shared/, optimises images, rewrites links to extensionless, stamps the build
// and site config, then minifies every .css/.js in the copy. Source stays
// hand-readable; dist/ is the artifact that actually gets published. dist/main
// goes to GitHub Pages (see .github/workflows/deploy-site.yml); the other two
// go to Cloudflare Pages.

'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const csso = require('csso');
const { minify: minifyJs } = require('terser');
const sharp = require('sharp');

const { SITES, byKey } = require('../sites.config.js');

const ROOT = path.join(__dirname, '..');
/* The design system lives outside any one site so all three can share it.
   It is copied into each site's output, which keeps every page's existing
   relative reference (shared/sunlogic.css) working untouched. */
const SHARED = path.join(ROOT, 'shared');
const REPO_URL = 'https://github.com/StephanM-ZA/sunlogic_website';

// Commit SHA visible in the site's own footer, stamped fresh on every
// build so it's never stale and never needs a manual reminder to
// update. Each CI provider exposes it under its own name:
//   GITHUB_SHA           GitHub Actions
//   CF_PAGES_COMMIT_SHA  Cloudflare Pages
// `git` covers a local `npm run build`. If none of those work (a build
// image without git, say), the stamp is omitted rather than the build
// failing: SL_BUILD_LINE() already renders nothing when the sha is absent.
/* Is this build the one the public will see? Not a branch check and not a
   hostname check: a local build of main is still a local build and should keep
   its dev tooling, and hostnames rot — sunlogic-check.js guarded itself with a
   regex matching one host, so when the environment grew to three it kept its
   developer badge on two of them, in public. The honest signal is the CI
   variable, which only a real publish sets:
     CF_PAGES_BRANCH    Cloudflare Pages
     GITHUB_REF_NAME    GitHub Actions
   A preview build on any other branch is not production, and correctly keeps
   the dev tooling. */
const PROD_BRANCH = 'main';

function isProductionBuild() {
  const branch = process.env.CF_PAGES_BRANCH || process.env.GITHUB_REF_NAME || '';
  return branch === PROD_BRANCH;
}

function getBuildInfo() {
  const prod = isProductionBuild();
  let sha = process.env.CF_PAGES_COMMIT_SHA || process.env.GITHUB_SHA || '';
  if (!sha) {
    try {
      sha = execSync('git rev-parse HEAD', { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'] })
        .toString().trim();
    } catch (e) {
      console.warn('  (no commit SHA available; footer build stamp omitted)');
      return { prod };
    }
  }
  const date = new Date().toISOString().slice(0, 10);
  return { sha, short: sha.slice(0, 7), repo: REPO_URL, date, prod };
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

/* Cloudflare Pages serves extensionless URLs and 308-redirects /solar.html to
   /solar. Left alone that means every internal link and every canonical tag
   points at a URL that redirects away from itself, which is bad for search and
   adds a hop to every click.

   Rather than rewrite the hand-authored source (which stays readable and opens
   correctly from disk), the links are rewritten here, in the build output only:
     href="contact.html"          -> href="/contact"
     href="solar.html#larger"     -> href="/solar#larger"
     href="index.html"            -> href="/"
     https://host/solar.html      -> https://host/solar
   Applies to HTML, the component library's own link lists, and the sitemap. */
function toExtensionless(text) {
  return text
    // relative links in HTML: href="x.html" and href="x.html#frag"
    .replace(/href="index\.html(#[^"]*)?"/g, (m, frag) => 'href="/' + (frag || '') + '"')
    .replace(/href="([a-z0-9-]+)\.html(#[^"]*)?"/g, (m, name, frag) => 'href="/' + name + (frag || '') + '"')
    // link lists inside components.js, which use single quotes
    .replace(/'index\.html'/g, "'/'")
    .replace(/'([a-z0-9-]+)\.html'/g, "'/$1'")
    // absolute URLs: canonical, og:url, twitter, JSON-LD, sitemap <loc>
    .replace(/(https:\/\/[a-z0-9.-]*sunlogic\.co\.za)\/index\.html/g, '$1/')
    .replace(/(https:\/\/[a-z0-9.-]*sunlogic\.co\.za)\/([a-z0-9-]+)\.html/g, '$1/$2');
}

/* Absolute URLs point at whichever host the page was authored for, and every
   page of all three sites was authored as sunlogic.co.za — they began as
   copies of the single site. Left alone, energy.sunlogic.co.za/solar declares
   <link rel="canonical" href="https://sunlogic.co.za/solar">, which is an
   instruction to index a different host instead of itself; since the apex
   cleanup that target is a 301 back to the page making the claim.

   Fixed here rather than in the source for the same reason the extensionless
   rewrite is: the source stays one readable set of pages, and a site added to
   sites.config.js tomorrow gets correct canonicals without anyone editing 34
   files. On the apex, domain IS the apex, so this is a no-op.

   The logo is a second, smaller case. The JSON-LD company logo is written as
   /images/sl_logo_main_blue.svg, which exists only on the apex — swapping the
   host alone would turn it into a 404 on both division sites. Each site
   declares its own lockup in sites.config.js, so use that. */
const APEX_ORIGIN = 'https://sunlogic.co.za';

function rewriteAbsoluteUrls(text, site) {
  let out = text;
  if (site.domain && site.domain !== APEX_ORIGIN) {
    out = out.split(APEX_ORIGIN + '/').join(site.domain + '/');
  }
  if (site.logo && site.logo !== 'images/sl_logo_main_blue.svg') {
    /* Leading slash on purpose: this must hit absolute URLs only. Relative
       references are rendered from window.SL_SITE.logo and are already
       per-site. */
    out = out.split('/images/sl_logo_main_blue.svg').join('/' + site.logo);
  }
  return out;
}

function rewriteHost(dir, site) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      rewriteHost(full, site);
    } else if (/\.(html|xml|txt|js|json)$/.test(entry.name)) {
      const src = fs.readFileSync(full, 'utf8');
      const out = rewriteAbsoluteUrls(src, site);
      if (out !== src) fs.writeFileSync(full, out);
    }
  }
}

/* Every absolute URL on a site's own host must resolve to something that site
   actually ships. This is the assertion the canonical bug needed and did not
   have: a wrong host is invisible in a build log and only shows up months
   later as pages missing from the index. Checked against the built tree, so a
   page deleted during a content split fails the build that deletes it. */
function verifyAbsoluteUrls(outDir, site) {
  const origin = site.domain;
  if (!origin) return [];
  const broken = [];
  const seen = new Set();

  const resolves = (urlPath) => {
    const clean = urlPath.split('#')[0].split('?')[0];
    if (clean === '' || clean === '/') return fs.existsSync(path.join(outDir, 'index.html'));
    const rel = clean.replace(/^\//, '');
    return fs.existsSync(path.join(outDir, rel)) ||
           fs.existsSync(path.join(outDir, rel + '.html'));
  };

  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) { walk(full); continue; }
      if (!/\.(html|xml|txt|json)$/.test(entry.name)) continue;
      const text = fs.readFileSync(full, 'utf8');
      const re = new RegExp(origin.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(/[^"\'<>\\s)]*)?', 'g');
      let m;
      while ((m = re.exec(text)) !== null) {
        const urlPath = m[1] || '/';
        const key = urlPath;
        if (seen.has(key)) continue;
        seen.add(key);
        if (!resolves(urlPath)) broken.push(origin + urlPath);
      }
    }
  };
  walk(outDir);
  return broken;
}

function rewriteToExtensionless(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      rewriteToExtensionless(full);
    } else if (/\.(html|xml|js)$/.test(entry.name)) {
      const src = fs.readFileSync(full, 'utf8');
      const out = toExtensionless(src);
      if (out !== src) fs.writeFileSync(full, out);
    }
  }
}

/* Injects the build stamp and, when the site defines one, its own nav and
   footer link lists as window.SL_SITE. The nav/footer components read that and
   fall back to their built-in lists if it is absent, so a site with no config
   renders exactly as it always has. */
const SITE_KEYS = ['nav', 'footer', 'logo', 'logoWhite', 'logoVertical'];

function stampBuildInfo(dir, build, site) {
  /* Whitelisted rather than spread wholesale: the config also carries build
     paths (src, out) that have no business in a published page. */
  const cfg = {};
  for (const k of SITE_KEYS) if (site && site[k]) cfg[k] = site[k];
  const siteCfg = Object.keys(cfg).length
    ? '<script>window.SL_SITE=' + JSON.stringify(cfg) + ';</script>'
    : '';
  const tag = '<script>window.SL_BUILD=' + JSON.stringify(build) + ';</script>' + siteCfg + '\n</head>';
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      stampBuildInfo(full, build, site);
    } else if (entry.name.endsWith('.html')) {
      const html = fs.readFileSync(full, 'utf8');
      if (html.includes('</head>')) {
        fs.writeFileSync(full, html.replace('</head>', tag));
      }
    }
  }
}

async function buildSite(site, build) {
  const src = path.join(ROOT, site.src);
  const out = path.join(ROOT, site.out);
  console.log('\n' + site.key + '  (' + site.src + ' -> ' + site.out + ')');
  if (fs.existsSync(out)) fs.rmSync(out, { recursive: true, force: true });
  copyRecursive(src, out);
  copyRecursive(SHARED, path.join(out, 'shared'));
  const renameMap = await optimizeImages(out);
  rewriteImageReferences(out, renameMap);
  /* Before the extensionless pass, so that pass sees the final hosts. */
  rewriteHost(out, site);
  rewriteToExtensionless(out);
  stampBuildInfo(out, build, site);
  await walkAndMinify(out);

  const broken = verifyAbsoluteUrls(out, site);
  if (broken.length) {
    throw new Error(
      site.key + ': ' + broken.length + ' absolute URL(s) on its own host do not resolve ' +
      'in ' + site.out + ':\n  ' + broken.join('\n  ') +
      '\nA canonical or og:url pointing at a page this site does not ship is worse ' +
      'than none — fix the reference or ship the page.');
  }
}

/* Builds every site in sites.config.js, or just one if a key is passed:
   `node scripts/build-site.js energy`. */
async function main() {
  const only = process.argv[2];
  const sites = only ? [byKey(only)] : SITES;
  if (only && !sites[0]) throw new Error('Unknown site key: ' + only);
  const build = getBuildInfo();
  for (const site of sites) await buildSite(site, build);
  console.log('\nBuild complete: ' + sites.map((s) => s.out).join(', '));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
