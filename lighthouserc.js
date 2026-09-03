// Lighthouse CI config. Runs against the built dist/ directory locally —
// not the live site — so it never depends on DNS/domain state and never
// blocks the deploy workflow, which is separate.
//
// Pages are discovered per site at config-load time, so a new page is
// covered automatically on its first push and a fourth site would be too.

const path = require('path');
const { sitePages } = require('./scripts/site-pages.js');

const DIST_DIR = path.join(__dirname, 'dist');

/* Served from dist/ rather than from each site directory, so one lhci run
   covers all three. Each page's own asset references are relative
   (shared/…, images/…), so they resolve correctly under /<site>/.
   Discovery and the exclusion list live in scripts/site-pages.js — see the
   comment there for why they are not duplicated here any more. */
const urls = sitePages(DIST_DIR).map((p) => p.url);

/* The assertions every page is held to. Defined once here because the 404
   pages need exactly one of them relaxed, and lhci's assertMatrix replaces
   `assertions` wholesale rather than layering on top of it. */
const BASE_ASSERTIONS = {
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
};

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
      assertMatrix: [
        {
          /* Everything that is not a 404 page. */
          matchingUrlPattern: '^(?!.*/404\\.html$).*$',
          assertions: BASE_ASSERTIONS,
        },
        {
          matchingUrlPattern: '.*/404\\.html$',
          assertions: {
            ...BASE_ASSERTIONS,
            /* The only SEO audit a 404 page fails is is-crawlable, "Page is
               blocked from indexing", and it fails because the page carries
               robots=noindex on purpose. One failed audit drops the whole
               SEO category to 0.63, which took the build down.

               The page is right and the audit is right; the missing piece is
               context lhci cannot have. Lighthouse collects against
               staticDistDir, which serves 404.html over HTTP 200 like any
               other file. In production Cloudflare Pages serves it with a
               real 404 status, which is what actually keeps it out of the
               index — the noindex is belt and braces on top.

               Scoped as narrowly as it can be: the SEO category, on this one
               URL pattern. Performance, accessibility, best-practices and
               CLS still gate on 404 pages exactly as they do everywhere
               else. */
            'categories:seo': 'off',
          },
        },
      ],
    },
    upload: {
      target: 'filesystem',
      outputDir: './.lighthouseci',
    },
  },
};
