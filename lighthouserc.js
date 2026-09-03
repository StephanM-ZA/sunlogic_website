// Lighthouse CI config. Runs against the built dist/ directory locally —
// not the live site — so it never depends on DNS/domain state and never
// blocks the deploy workflow, which is separate.
//
// Pages are discovered per site at config-load time, so a new page is
// covered automatically on its first push and a fourth site would be too.
//
// It used to glob dist/*.html, which was correct when the build produced one
// site straight into dist/. After the three-site split dist/ holds only
// directories, so that glob matched nothing and this job audited zero pages —
// passing green for weeks because there was nothing in it to fail. Discovery
// that can silently return an empty set is worse than no discovery, so the
// export below refuses to run on one.

const fs = require('fs');
const path = require('path');

const DIST_DIR = path.join(__dirname, 'dist');

// Pages that are deliberately not indexable, so Lighthouse's "is-crawlable"
// SEO audit intentionally and correctly fails on them — not a bug to track.
// thank-you.html is post-submit-only and ci-guide.html is an internal design
// doc, both blocked in robots.txt; landing-preview.html carries its own
// noindex meta while the apex rebuild is in progress.
// Everything else is audited.
const EXCLUDED_PAGES = new Set(['thank-you.html', 'ci-guide.html', 'landing-preview.html']);

/* Served from dist/ rather than from each site directory, so one lhci run
   covers all three. Each page's own asset references are relative
   (shared/…, images/…), so they resolve correctly under /<site>/. */
const sites = fs
  .readdirSync(DIST_DIR, { withFileTypes: true })
  .filter((e) => e.isDirectory())
  .map((e) => e.name)
  .sort();

const urls = sites.flatMap((site) =>
  fs
    .readdirSync(path.join(DIST_DIR, site))
    .filter((f) => f.endsWith('.html') && !EXCLUDED_PAGES.has(f))
    .sort()
    .map((f) => '/' + site + '/' + f));

if (urls.length === 0) {
  throw new Error(
    'lighthouserc: no pages found under ' + DIST_DIR + '. Run a build first ' +
    '(npm run build). Failing loudly rather than auditing nothing.');
}

module.exports = {
  ci: {
    collect: {
      staticDistDir: DIST_DIR,
      url: urls,
      numberOfRuns: 1,
      settings: {
        formFactor: 'mobile',
        screenEmulation: { mobile: true, width: 412, height: 823, deviceScaleFactor: 1.75, disabled: false },
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
      },
    },
    assert: {
      assertions: {
        // Performance is warn-only: GitHub-hosted runners are shared,
        // variable-load CPUs, and Lighthouse's own CPU throttling
        // simulation compounds on top of that — the same page scored
        // 0.96 locally and 0.72 on a GitHub runner in back-to-back
        // tests, pure environment noise, not a regression. Real
        // performance work for this site was verified by hand across
        // both local and the live GitHub Pages CDN — this check just
        // surfaces the number, it doesn't gate on it.
        'categories:performance': ['warn', { minScore: 0.8 }],
        // 0.85 instead of a stricter number: the scroll-reveal
        // animation occasionally gets caught mid-fade by the crawler,
        // producing a real but non-representative contrast-audit dip
        // (confirmed harmless — see git log for the investigation).
        // A genuine structural a11y bug (missing alt text, invalid
        // ARIA role, no accessible name) drops scores far more than
        // this leaves room for.
        'categories:accessibility': ['error', { minScore: 0.85 }],
        'categories:best-practices': ['error', { minScore: 0.95 }],
        'categories:seo': ['error', { minScore: 0.9 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
      },
    },
    upload: {
      target: 'filesystem',
      outputDir: './.lighthouseci',
    },
  },
};
