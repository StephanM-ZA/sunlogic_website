'use strict';

/* Loading a page for the browser gates, with the flakiness taken out.
 *
 * Both gates — scripts/conformance.js and scripts/layout-sweep.js — open every
 * built page in a real browser and measure it. Both were doing it with a bare
 *
 *     await page.goto(url, { waitUntil: 'load' })
 *
 * and no timeout of their own, which meant Playwright's generic 30s default.
 * That is not a deadline anybody chose for this workload. `load` waits for
 * every image on the page, these pages carry hero photography, and the sweep
 * runs six tabs at once — so on a build container the navigation can miss 30s
 * while nothing whatsoever is wrong with the page. It did: Cloudflare Pages
 * deployment 84926717 for sunlogic-electrical failed on blog-3-essential-
 * checks.html, off a static server on the builder's own loopback, after the
 * tests and the design gate had both passed. The retry of the identical commit
 * went green.
 *
 * One rejection fails all 575 of the sweep's combinations, so a flake here
 * costs a deploy. Hence: a deadline sized for this workload, and two more
 * attempts before believing it.
 *
 * WHAT IS RETRIED IS DELIBERATELY NARROW — opening the tab and navigating, the
 * step that was actually flaky. Nothing that measures the page is retried.
 * Measurement here is deterministic: when conformance says a page never
 * exposed window.SL_CHECK, that is true and will be true three times, and
 * burying it under "failed 3 attempts" would turn a precise diagnosis into
 * noise. A flaky load is infrastructure; a failing measurement is a finding.
 */

/* 60s, not 30: generous enough that a loaded builder is not mistaken for a
   broken page, short enough that a page which genuinely never fires `load`
   still fails the build rather than hanging it. */
const NAV_TIMEOUT_MS = 60000;
const NAV_ATTEMPTS = 3;

/* Retries are PRINTED, and that is the point of them being here rather than
   swallowed inside each gate. A flake that is silently absorbed is a flake
   nobody ever fixes; if these lines start showing up in every build, the
   builder is telling you the pool is too big (see SWEEP_CONCURRENCY). */
function announceRetry(attempt, max, label, why) {
  console.log('  retry ' + attempt + '/' + max + '  ' + label + '  (' + why + ')');
}

/**
 * Open a new page and navigate it, retrying a failed navigation.
 *
 * Returns the loaded page. THE CALLER OWNS IT and must close it — every
 * caller here does that in a `finally`, because a tab left open on a thrown
 * measurement leaks a browser process for the rest of the run.
 *
 * opts.label    what to call this page in retry lines and in the final error.
 *               Include the viewport width if the caller varies it; the width
 *               is half of what you need to reproduce a layout failure, and
 *               the bare Playwright stack never carried it.
 * opts.onRetry  (attempt, max, why) => boolean. Return false to stop retrying
 *               and throw now — the sweep uses this so that once one
 *               combination has given up and the browser is being torn down,
 *               the other workers' tabs fail quietly instead of each retrying
 *               into a closing browser and burying the real failure.
 */
async function loadPage(browser, newPageOptions, url, opts) {
  const o = opts || {};
  const attempts = o.attempts || NAV_ATTEMPTS;
  const timeout = o.timeout || NAV_TIMEOUT_MS;
  const label = o.label || url;

  for (let attempt = 1; ; attempt++) {
    const page = await browser.newPage(newPageOptions);
    try {
      await page.goto(url, { waitUntil: 'load', timeout });
      return page;
    } catch (err) {
      /* The tab is in an unknown state, so it never gets reused across
         attempts — and closing it can itself throw if the browser is already
         going away, which must not mask the navigation error underneath. */
      await page.close().catch(() => {});

      const why = String((err && err.message) || err).split('\n')[0];
      const keepGoing = attempt < attempts &&
        (o.onRetry ? o.onRetry(attempt, attempts - 1, why) !== false : true);
      if (!keepGoing) {
        throw new Error(label + ' failed to load after ' + attempt +
          (attempt === 1 ? ' attempt — ' : ' attempts — ') + why);
      }
      if (!o.onRetry) announceRetry(attempt, attempts - 1, label, why);
      /* Linear backoff, to let whatever burst caused this pass. */
      await new Promise((r) => setTimeout(r, 1000 * attempt));
    }
  }
}

module.exports = { loadPage, NAV_TIMEOUT_MS, NAV_ATTEMPTS };
