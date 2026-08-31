// Lighthouse CI config. Runs against the built dist/ directory locally —
// not the live site — so it never depends on DNS/domain state and never
// blocks the deploy workflow, which is separate.
//
// Pages are discovered by globbing dist/*.html at config-load time, so a
// new page added under site-daylight/ is covered automatically on its
// first push — nothing to update here when the site grows.

const fs = require('fs');
const path = require('path');

const DIST_DIR = path.join(__dirname, 'dist');

// thank-you.html (post-submit-only) and ci-guide.html (internal design
// doc) are both deliberately blocked from indexing in robots.txt, so
// Lighthouse's "is-crawlable" SEO audit intentionally and correctly
// fails on them — that's not a bug to track. Everything else in
// dist/*.html is audited.
const EXCLUDED_PAGES = new Set(['thank-you.html', 'ci-guide.html']);

const urls = fs
  .readdirSync(DIST_DIR)
  .filter((f) => f.endsWith('.html') && !EXCLUDED_PAGES.has(f))
  .sort()
  .map((f) => '/' + f);

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
        // Local staticDistDir serving lacks compression/HTTP2 that the
        // real GitHub Pages CDN has, so LCP-heavy pages score a few
        // points lower here than in production — 0.80 leaves headroom
        // for that gap while still catching a real regression.
        'categories:performance': ['error', { minScore: 0.8 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
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
