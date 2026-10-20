# Checkpoint — Sunlogic Website

**Saved:** 2026-10-19 (session 17 — **a pitch deck and one-pager tool built at
`tools/pitch-deck/`, tested and verified; nothing deployed and nothing
committed.** See "Session 17" below.)

> Current as of commit `15de0bf`, which is on `origin/main` and deployed. The
> session-10 checkpoint was left stale and cost most of a session: it reported
> two defects that had already been fixed or never existed, and both were
> chased twice before anyone checked the source. If you change something,
> change this file in the same pass.

---

## Session 24 — deployed and verified, and one rule I bent

Commits `14632f2`, `fe406df`, `d549d0a` are on `origin/main` and **live**. Build stamp on
production is `d549d0a`.

**Verified against production, not assumed:**

- `og:image` on the gas page is `gas-hero-og.jpg`, with `og:image:type`, `width` and `height`
- that file serves as **`200 image/jpeg`, 35,647 bytes**
- the favicon reference is `fav_icon.png?v=30d284c6`, and **that URL serves the new mark**
  (md5 `984db617…`, matching local and dist)

**What I cannot verify:** whether WhatsApp now renders the card. That needs someone to paste a
link into a chat. Everything upstream of the scraper is correct.

### The rule I bent, and what it leaves behind

`site-energy/_headers` serves `/images/*` with `max-age=31536000, immutable` and says in terms:

> "do NOT overwrite an image with different content under the same filename. A visitor who has
> it cached will not see the replacement for a year. Rename it instead."

**I overwrote `fav_icon.png` in place.** The mitigation — adding `?v=` so the reference carries
a content hash, the same pattern the file already blesses for CSS and JS — means every page
requests the versioned URL and gets the new mark, so real visitors are fine. But the bare URL
is still edge-cached: `cf-cache-status: HIT`, `age: 73175`, serving the old md5 `e2bb9b7d…`.

Nothing on any of the three sites links to the bare URL, so the practical risk is a consumer
that ignores the `<link rel="icon">` tag and guesses the path. Low, but real, and it persists
for up to a year unless someone purges the Cloudflare cache.

**Renaming instead would not have helped**, because the edge would keep serving the cached old
file at the old URL regardless. The versioned reference is the better long-term fix — it now
self-updates from the content hash — but the in-place overwrite should have been a conscious
decision rather than something I did and only noticed afterwards.

### Remaining uncommitted — none of it mine

`site-energy/_redirects` (modified before this work), and the untracked `Claude outputs/`,
`site-energy/plugins/doc-builder|quote-builder/`, `site-energy/share/`, `site-energy/tools/`,
`tools/*` and `workers/doc-share/`. **`tools/doc-builder/` must stay untracked** — its
`harness/api-test.mjs` fails on a hardcoded `/home/claude/...` path, and `npm test` is in the
Cloudflare build command, so committing it stops deploys on all three sites.

---

## Session 23 — the certificate reaches the appliances too (uncommitted)

**Stephan's correction, and he is right.** The page led with "The certificate covers the
installation, not the appliance." That came from the gazetted Annexure 1 form, which declares
that *the installation* complies and is safe and says nothing about how an appliance was made.
Technically defensible. **Practically misleading**, because a reader met it as a bold "Worth
knowing" statement and took away *the certificate has nothing to do with my appliances* — the
opposite of what matters to them.

His point: an appliance failing inside its warranty needs the certificate before a supplier
will act, and insurers want it specifically for gas appliances.

**The distinction worth keeping** is between what the document *attests to* (the installation)
and what it *gates* (warranty claims and insurance on the appliances). The page now leads with
the second and keeps the first as the explanation.

Changed in four places in `gas.html` — the "Worth knowing" statement, the "If You Are Buying"
card, "Does the certificate cover my stove?", and the insurance answer. One new FAQ added,
**"What happens to my appliance warranty?"**, which the research found is an empty topic across
all seven Western Cape competitors.

**Evidence, and why every sentence says "generally":**

| Claim | Basis |
|---|---|
| Insurers can decline a gas-related claim with no CoC and an unregistered installer | Sourced, secondary. Existing bucket (b) wording, unchanged |
| A supplier will generally want the certificate before acting on an appliance warranty claim | **Stephan's trade experience. No published SA source exists** — the research looked and found nothing on appliance-warranty handling |

These are predictions about how third parties behave, not statements of law, so under CPA s41
they carry a hedge. `compliance-checker` caught one line that had none — "are what a supplier
will ask for" — and it was brought into line.

**Do not re-flatten this to "the certificate does not cover the appliance."** It reads as
correct and sends the customer the wrong way. Recorded in `docs/gas-service-pack-2.md` §8.0a.

**Checks:** conformance:energy 12/12, 0 fails, 0 warns, both viewports.

---

## Session 22 — day feed gets gas, and a share-preview bug found (uncommitted)

### Button layout on "Who we work for"

The Homes card's two buttons sat side by side while the Businesses card's stacked, because
`.sl-actions` wraps and "at home" is shorter than "for business". All five buttons in that
section now carry `full`, so each takes its own row in all three cards at every width.

### "Compliance" was the wrong eyebrow

That section is two halves: the paperwork we carry, and the live "Today" job board beside it.
"Compliance" named only the left one. Now **"Behind the scenes"**, which covers both. The HTML
comment above the section records why.

### Day feed now includes gas

`site-energy/plugins/day-feed/schedule.data.js`. One `Gas 1` crew, 17 gas field jobs, 3 gas
office lines. Gas jobs use `{suburb}` and `{municipality}` only — there is no cylinder or
appliance token, and adding one means touching `day-feed-schedule.js`, which is byte-identical
across all three sites and meant to stay that way.

**Nothing in the pool quotes a clearance, test pressure or service interval**, for the same
reason those are off the gas page: verified only against the superseded 2008 edition.

**Re-measured, because the file says to.** 343 working days from 1 Jan 2026:

| | solar | smart | office | gas | entries/day |
|---|---|---|---|---|---|
| before | 44.7% | 31.1% | 24.3% | — | 8.85 |
| after | 41.3% | 25.7% | 19.9% | **13.0%** | 9.17 |

The crew comment in the file now carries these numbers. Note they do **not** match the
48/29/23 the comment used to quote, so the original was measured some other way; both of mine
come from one method and are comparable with each other. Harness is in the session scratchpad.

### Favicon replaced, and it can now bust its own cache

**The mark.** Stephan picked the transparent sun. There was no standalone mark to use — the
brand has wide lockups only — so it was cut from `site-main/images/sl_logo_main_blue.svg`
(4612x1388) by rendering it, slicing the left 32% and trimming to the ink bounds, which came
out 798x837. Padded to square with 14% breathing room so a circular crop does not clip the
ring, output at 512x512. It replaces `images/fav_icon.png` on all three sites, which were all
carrying the identical pre-rebrand icon (md5 `e2bb9b7d…`, 254x254, November 2025). Now md5
`984db617…`. **No HTML change was needed for the swap** — same filename, same 30 references.

**The cache problem, which was the less obvious half.** The reference was
`href="images/fav_icon.png"` with no version, and browsers key favicon cache on URL, so a
returning visitor could have kept the old mark indefinitely. `hashAssetVersions()` in
`scripts/build-site.js` only matched `shared/` and `plugins/` `.css`/`.js`, so an image could
never self-version. The pattern now also accepts `images/` and `png|svg|webp|jpe?g|ico`, and
the favicon reference carries `?v=1` on all 30 pages. **The widened pattern changes nothing
else**, because it still only rewrites references that already carry `?v=` — an asset has to
opt in. The build now emits `fav_icon.png?v=30d284c6` on all three sites, and that hash will
move on its own if the icon is ever changed again.

**Gate:** build OK, `npm test` passes, `conformance` 26 pages 0 fails 0 warns, `sweep` 650
page/width combinations 0 findings.

### Share previews fixed — and the cause was the build, not the source files

**The source files were never the problem.** Every `og:image` in `site-*/` pointed at a JPEG
or a PNG. `optimizeImages()` in `scripts/build-site.js` converts every `.jpg`, `.jpeg` and
`.gif` in the output to WebP, deletes the original, and then `rewriteImageReferences()`
rewrites every reference to match — **and its own comment names `og:image` as one of the
things it rewrites.** So the pipeline was turning correct share tags into broken ones on every
build, and nothing in source looked wrong.

I only caught it because the first attempt appeared to work: 26 pages updated, no webp left in
`site-*/`. Checking `dist/` showed `gas-hero-og.jpg` had become `gas-hero-og.webp` and the tag
had followed it. **Verify the built output, not the source.**

**The fix.** A `SHARE_CARD = /-og\.jpe?g$/i` exemption in `build-site.js`, filtered out of the
conversion list — the same kind of exemption the favicon already had for staying PNG. The
constant carries a comment explaining why, because the next person to add a share image needs
to know the suffix is load-bearing.

**The assets.** 13 share images at **1200x630** (the size Facebook, WhatsApp, LinkedIn and X
all use), JPEG at quality 82, mozjpeg, progressive. 28-186 KB each. Generated from the
existing hero artwork with `fit: cover` and `position: attention`, which handled the two
awkward sources well — `electrical-hero.webp` is portrait (1280x1920) and the crop found the
distribution board. The exception is `energy-hero.webp`, a composed product diagram where
cropping clipped the devices; that one is letterboxed on page beige instead.

**The tags.** All 26 pages now carry `og:image` and `twitter:image` pointing at the JPEG, plus
`og:image:type`, `og:image:width` and `og:image:height`. Scrapers use those to decide whether
to render a large card at all.

**Verified in `dist/`, not just in source:** zero webp `og:image` tags, 26 pages with
`og:image:type`, and the file serves as `200 image/jpeg`.

**Gate:** build OK, conformance 26 pages 0 fails 0 warns, sweep 650 combinations 0 findings.

### One pre-existing test failure, not ours and not deployed

`npm test` reports `# pass 154 # fail 1`. The failure is
`tools/doc-builder/harness/api-test.mjs`, which opens a hardcoded
`/home/claude/docbuilder/examples/...` path — a container path from another machine. It is
**untracked**: only `tools/pitch-deck/*` is committed from `tools/`, so Cloudflare never sees
it and the deploy gate is unaffected. It belongs to the other session's in-progress doc-builder
work. Left alone.

### Still open

`og:image:alt` is not set on any page. Worth adding, but each page needs its own sentence, so
it is a copy task rather than a build one.



Worth being blunt, because the favicon swap looks like a fix and is not one.

**25 of 26 `og:image` tags across all three sites point at `.webp` files, and no page declares
`og:image:type`, `og:image:width` or `og:image:height`.** Scrapers that cannot read webp —
WhatsApp among them — fall back to the favicon. That fallback is why the old logo appeared.
After this change the fallback will show the *new* logo, which is better but still wrong: a
share card should carry a photograph of the work, not an icon.

**The fix, not applied:** emit a 1200x630 JPEG or PNG per page from the existing hero artwork
and declare type and dimensions alongside it. One page already proves the point — a blog post
uses a `.jpeg` og:image, and testing whether that one previews correctly in WhatsApp while the
others do not would confirm the diagnosis outright before any work is done.



Stephan reported the old logo appearing when sharing a link, and guessed the favicon. The
favicon is indeed stale, but **it is not the whole cause**:

1. **25 of 26 `og:image` tags across all three sites point at `.webp` files**, and **none of
   the pages declares `og:image:type`, `og:image:width` or `og:image:height`**. Several major
   link-preview scrapers, WhatsApp among them, do not render webp and fall back to the
   favicon — which is exactly the behaviour reported.
2. **The favicon is the pre-rebrand mark.** `images/fav_icon.png` is byte-identical across all
   three sites (md5 `e2bb9b7d…`), 254x254, dated November 2025 on the apex, and it is the old
   orange-ring-and-blue-disc logo from the screenshot. 30 pages reference it.

**Fixing the favicon alone will not fix the share preview.** The og:image format is the
actual cause; the favicon is what the fallback lands on.

Both fixes need new image assets, and `site-energy/CLAUDE.md` lists the logo under "Open —
flag, never guess" because **no standalone mark exists** — only wide lockups
(`sl_logo_*_blue.svg`, 4612x1388). The sun is extractable from the left of the lockup, but
cropping brand artwork into a new mark is a brand decision, so it is flagged rather than done.

**Suggested fix, not applied:** generate a 1200x630 JPEG for `og:image` on each page from the
existing hero artwork, declare `og:image:type`/`width`/`height`, and cut a square favicon from
the current lockup's sun.

---

## Session 21 — energy home page rebalanced for gas (uncommitted)

**Stephan: the home page was focused on solar and only said "we also install gas". Balance it,
each section has its own.** So gas is now woven through `site-energy/index.html` rather than
confined to one block near the bottom. Ten edits, additive wherever possible — existing solar
copy was left standing, not rewritten.

| Section | What gas got |
|---|---|
| Hero | Body now names both trades: "Gas for cooking, hot water and heat. Both installed, certified and serviced by the same company." |
| Trust strip | A fourth item, "SAQCC Gas registered practitioner". Fits on one line at 1280 and sweeps clean |
| Why now | A "Where gas comes into it" callout after the two sums — framed on what gas **does**, never on cost against electricity |
| The whole job | A closing line: gas runs the same five steps minus the cleaning, with the readings in writing |
| Why Sunlogic | Two of the four cards were already true of gas and now say so: the certify card and the take-on-someone-else's-work card |
| Who we work for | Homes and Businesses each gained a second button, to `gas.html#at-home` and `gas.html#for-business`. Larger Sites keeps one, because there is no gas equivalent |
| Compliance | Checklist went from three items to five: the gas Certificate of Conformity, and the City plans plus flammable substance application for commercial gas |
| Gas section | Heading changed from "We Also Install and Certify Gas" to **"Gas for Cooking, Hot Water and Heat"** — the "we also" framing was the thing being objected to |

**Deliberately left solar-only:** `#our-work` (three real installs, and there is no gas job
photography to balance them with), `#smart-control` (a solar and electrical argument), and the
live PV/battery hero stats.

**Checks:** `conformance:energy` 12/12 pages, 0 fails, 0 warns at both viewports.
`sweep:energy` 300 page/width combinations, 0 findings — which matters here because the
four-item trust strip and the stacked double buttons are the two real layout risks. Verified in
the browser at 1280 and at mobile.

**Still open:** a gas job photograph would let `#our-work` carry one, and the gas hero is still
the Pexels stand-in.

---

## Session 20 — Energy nav submenu, and the push confirmed live

> **These notes were written once and lost before they were committed.** Another session
> rewrote `CHECKPOINT.md` in between. Second time this file has collided today: session 18's
> gas notes went up inside `b90b758`, a pitch-deck commit, rather than mine. **Two sessions are
> appending to one file with no locking.** Worth splitting per-session notes into their own
> files, or at least re-reading immediately before writing.
>
> The duplicate "Session 17" was mine, not theirs: 17 was already taken by the pitch-deck
> session when I numbered the gas entry. My two headings are renumbered to 18 and 19; theirs is
> untouched.

### Live, verified 19 October 18:18 SAST

The earlier push deployed. The first two checks returned 404 because the Cloudflare build was
still queued — the free plan builds one project at a time and the deploy notes record ~400s of
queueing. Confirmed against production, not assumed:

- `https://energy.sunlogic.co.za/gas` -> **200**, correct title, the trust strip reading
  "SAQCC Gas registered practitioner" with no number, `gas-hero` in the markup
- `https://energy.sunlogic.co.za/energy` -> the `#solar-and-gas` routing section is present
- Live stylesheet `shared/sunlogic.css?v=f61ad667` contains `min-width:860px`, so **the nav fix
  is live**

**The deploy gate is `build && npm test && conformance && sweep`, and I had only run
conformance before pushing.** The rest were run afterwards and pass. Note for next time:
**`sweep` tests 25 widths including 766, 767, 768, 859 and 860** — the tooling to catch the nav
collision already existed, it just was not what I reached for.

### Energy nav submenu — committed `451e728`, pushed

"Energy" opens a submenu with **Solar** and **Gas** on hover or keyboard focus. Energy keeps its
one nav slot and the children hang below it, so the nav still caps at four routes.

- `sites.config.js` — the energy site's Energy entry gains `children`
- `shared/components.js` — `DlNavBar` renders an entry with `children` as a group
- `shared/sunlogic.css` — submenu styles, and the item divider retargeted

Three things the next person should not undo:

1. Submenu links carry `.sl-nav__sublink`, **not** `.sl-nav__link`. `sunlogic-check.js` counts
   the latter to enforce the four-link cap, and a submenu is not a fifth route.
2. The divider moved from `.sl-nav__link + .sl-nav__link` to `.sl-nav__item + .sl-nav__item`,
   because wrapping one item in a group broke the adjacent-sibling chain for everything after
   it. Bare links and groups both carry `.sl-nav__item`.
3. The group, not the link, owns `:hover` — full bar height, panel flush underneath, no dead
   gap. `:focus-within` is what makes it work on a keyboard. Hidden with `visibility`, not
   `display`, so the children stay out of the tab order while closed and the transition runs.

Below 860px there is no hover, so the drawer stacks Solar and Gas as indented rows.

**Gate at time of commit:** build OK, `npm test` passes, `conformance` 26 pages 0 fails 0 warns
at both viewports, `sweep` 650 page/width combinations 0 findings.

**Still only on the energy site.** The apex and electrical navs link to Energy cross-site and
could carry the same submenu; not done.

---

## Session 17 — the pitch deck platform (new tool, nothing deployed)

**Task:** a standardised HTML pitch deck and one-pager with an editable config,
and a download that gives the whole deck, one section, or any selection.

**Nothing on any live site was touched.** No page, Worker or deploy. The work is
a new tool at `tools/pitch-deck/`, a sibling of `tools/doc-builder/`.

### What was built

| File | What it is |
|---|---|
| `tools/pitch-deck/deck.data.js` | The standard deck: 12 sections, bracketed placeholder copy |
| `tools/pitch-deck/brand.sunlogic.js` | Tokens and the two lockups, the swappable part |
| `tools/pitch-deck/deck-render.js` | Model to markup. No DOM, so node loads it too |
| `tools/pitch-deck/deck-style.js` | Three stylesheets as strings: screen, print, one-pager |
| `tools/pitch-deck/deck-editor.js` | `<plugin-pitch-deck>`: panel, autosave, files, picker |
| `tools/pitch-deck/deck-assets.js` | Generated. Fonts by weight and the icons |
| `tools/pitch-deck/render.mjs` | Node entry, so the button and the CLI share one renderer |
| `tools/pitch-deck/make-pdf.py` | WeasyPrint, with `--only` and `--one-pager` |
| `tools/pitch-deck/make-assets.py` | Fonts and icons to `deck-assets.js` |
| `tools/pitch-deck/serve.py` | Serves the folder, and `POST /pdf` for the button |
| `tools/pitch-deck/test-render.html` | 47 assertions, every slide type |
| `docs/superpowers/specs/2026-10-19-pitch-deck-design.md` | The design |
| `.claude/launch.json` | A `pitch-deck` entry on port 8723 |

### Key decisions

- **One renderer, two callers.** `render.mjs` loads the browser files under node,
  so `make-pdf.py` and the Download button cannot produce different documents.
  The LearnIQ planner's rule, and the reason it has no date bugs any more.
- **No WeasyPrint in the browser.** It cannot work there. `serve.py` renders, and
  with no server the deck falls back to the print dialog.
- **Stylesheets are strings in a .js file**, because a deck has to work from
  `file://`, from an attachment, and on WeasyPrint's stdin.
- **The deck carries its own fonts and icons.** `../doc-builder/doc-assets.js`
  404s over http, and a deck set in 800 and 900 needs weights a proposal does
  not. Icons stay single-sourced in `doc-builder/icons.json`.
- **Fonts are declared one file per weight.** `font-weight:100 900` is rejected
  outright by WeasyPrint, which then sets everything in a fallback face.

### Verified

- `test-render.html`: 47 passed, 0 failed.
- PDFs rendered and page counts confirmed with `pdfinfo`: full deck 14 pages A4
  landscape, one-pager 1 page A4 portrait, a single section 1 page, a single
  slide 1 page. Samples in `tools/pitch-deck/examples/`.
- The panel, the picker and the `POST /pdf` round trip driven in a browser: a
  copy edit reaches the deck and `localStorage`, and the picker returns a real
  PDF with the right filename in about six seconds.
- Embedded fonts in the PDF checked: Hanken Grotesk 400/700/800/900 and
  JetBrains Mono, no fallback face.

### The copy, done in the same session

`deck.data.js` now carries the site's own words, lifted verbatim from
`site-energy/index.html`, `energy.html`, `energy-management.html` and
`contact.html`. It is not a rewrite of them. Placeholders went from 107 to 41.

`checkModel` was under-counting: it never walked `meta`, `company`, a cover's
`kv` facts, or a quotation's `cite` and `role`. Fixed, and its count now agrees
with an independent walk of the model.

The one-pager went to two sides the moment real copy replaced the placeholders.
Type came down to 8.3pt to win it back, and it now fits with about five per
cent of the page spare. That margin is copy-dependent. Check it with
`pdfinfo` after any substantial copy change.

**The 41 fields still bracketed are facts nobody has recorded anywhere in this
repo, and must not be invented:**

1. **The numbers slide, all of it.** No saving, payback or yield figure exists
   anywhere. `index.html` already says this about its own three jobs.
2. **The cost table, all nine cells.** Prices are per job and belong in a
   proposal, not a deck template.
3. **A client quotation**, with a name and a role. Nobody has been quoted on
   any page.
4. **Insurance cover, and what happens on a callout.** The electrical proposal
   boilerplate in `doc-builder/doc-templates.js` has terms, but they are the
   electrical contracting terms and were deliberately not transplanted into an
   energy deck.
5. **What the offer excludes.**
6. **How long each step of `How it works` takes.** The steps are the site's;
   the durations are not written down.
7. Per-recipient fields, which are meant to stay bracketed in the template:
   client, date, reference, subtitle, and the VAT number.

### The look, corrected in the same session

First pass styled the deck off `doc-builder/doc-style.css`, which is the
**document** house style, not the site's. It shared the colour tokens, so it
looked plausible and was wrong: no photograph, a hand-drawn approximation of
the lockup instead of the real one, and a type scale that was close but not
the site's.

Corrected against the live site, measured with `getComputedStyle` on the built
page at 1440 rather than by eye:

- The lockup is now `sl_logo_energy_blue.svg` and `sl_logo_energy_white.svg`,
  baked into `deck-assets.js` by `make-assets.py`.
- The cover carries `hero-energy-1440w.webp` under a two-stop scrim, as the
  site's hero does. WeasyPrint embeds the webp without complaint.
- Type scale matched: 48px/800 section headings at 1.166 and -0.01em, 72px/900
  cover, eyebrows at 14px/600 and 0.05em, body 18px on 1.555, cards at 28px
  padding and an 8px radius.
- Two layout bugs found by rasterising the PDF with `pdftoppm` and looking:
  a statement slide's footer rode up with its centred content, and every grid
  was inset from the margin in print because `border-spacing` also spaces
  before the first cell.

A full-deck PDF is now about 1.7 MB because of the cover photograph. The
one-pager drops it and stays under 40 kB.

### Hosted as an unlinked page, same session

`site-energy/share/pitch.html` -> `/share/pitch` on the energy site. Generated
by `node tools/pitch-deck/render.mjs --share`, one file with every script
inlined, never hand edited. **Re-run it after any copy change.**

`<plugin-pitch-deck view>` is a new attribute: deck and download picker, no
editor, and it does not touch the reader's localStorage.

Unlinked by four separate things, three of which already existed for `/share/`:
nothing links to it, it is not in the sitemap, `robots.txt` disallows `/share/`,
`_headers` sets `no-store` and `X-Robots-Tag: noindex, nofollow` on `/share/*`,
and the page carries its own noindex meta.

**One trap worth remembering.** `build-site.js` stamps `SL_BUILD` in front of
the first `</head>` it finds by plain text replace. `deck-render.js` carries
that string in a JS literal, so the stamp landed *inside* the inlined script
and cut it short, and the page rendered as a wall of source. `render.mjs`
now rewrites `</head>`, `</body>`, `</html>` and `</script>` to `<\/...` when
it inlines, which JavaScript reads identically and a text search does not find.
Any future page that inlines JS containing those strings will hit the same
thing.

Verified on the built site: 14 slides, view mode on, no edit panel, nothing
written to localStorage, noindex meta present, `SL_BUILD` stamped in the right
place, picker opens with all 12 sections, `POST /pdf` 404s and falls back as
designed, and a fresh tab logs no console output at all.
`npm run conformance:energy`: 12/12 pages, 0 fails, 0 warns.

**Deployed and verified live** at <https://energy.sunlogic.co.za/share/pitch>.

Only the three pitch deck commits were pushed, with `git push origin f7b1d3a:main`
rather than `git push`. By the time the push happened another session had
committed three gas commits ON TOP of them, and a plain push would have put the
gas page live. The gas commits remain local and unpushed.

Checked against the live site, not the build: `SL_BUILD.short` reads `f7b1d3a`,
the page returns 200 with `cache-control: no-store` and
`x-robots-tag: noindex, nofollow`, live robots.txt disallows `/share/` and
`/tools/`, the sitemap has no mention of it, `/gas` still 404s, and a fresh tab
makes exactly one request for the page and logs nothing. The deck is one
self-contained file, so there is no second request to fail.

- `92f47c1` feat(pitch-deck): the tool and the hosted `/share/pitch` page, 18 files
- `55a7ca9` chore(site-energy): disallow and no-store `/tools` and `/share`
- `f7b1d3a` docs(checkpoint): this section

The second was needed because the first was not safe on its own: the robots
disallow and the `no-store` / `X-Robots-Tag` headers for `/share/` existed only
as uncommitted edits belonging to the document-gate work, so a deploy of the
first commit alone would have left the page relying on its `noindex` meta and
nothing else. Both are now in HEAD. Verified against HEAD rather than the
working tree: robots disallows `/share/`, `_headers` sets no-store and
`X-Robots-Tag: noindex, nofollow` on `/share/*`, the page carries its meta, and
it is absent from the sitemap.

**OPEN RISK, before deploying.** `site-energy/_redirects` is still uncommitted
and belongs to the document-gate work. It adds:

    /share/*    /share/index.html    200

a catch-all rewrite. Cloudflare Pages is understood to serve a matching static
asset before consulting `_redirects`, which is what makes the usual SPA
fallback work, so `/share/pitch` should win on its own file. **That has not
been tested on Pages.** The day that line is committed and deployed, open
`/share/pitch` and check the deck appears rather than the document gate. If the
gate appears, put an explicit rule ABOVE the wildcard, since Pages takes the
first match:

    /share/pitch    /share/pitch.html    200

**Separate small defect, noticed in passing, not fixed.** The 404 page
references `shared/sunlogic.css` and the shared scripts relatively, so when it
is served for a missing path one level down, such as `/share/anything`, those
resolve to `/share/shared/...` and 404. The 404 page then renders unstyled and
logs half a dozen console errors. Harmless but visible, and it is what
`/share/pitch` looked like during the two minutes before Pages finished
deploying. Absolute paths would fix it.

Everything else in the working tree is other sessions' unfinished work and was
left alone: the gas page and its sitemap, llms.txt, nav and index changes,
`site-energy/share/index.html`, `workers/doc-share/`, and the rest of `tools/`.

### Next steps

1. Stephan supplies the seven groups above, or decides a section comes out.
2. Decide whether `tools/pitch-deck/examples/*.pdf` should be committed or
   ignored. They are generated.
3. Nothing is committed yet. Everything above is uncommitted working tree.

---

## Session 19 — Energy becomes the parent of solar and gas

**Stephan: "gas should go under energy. so solar and gas."** Gas is reached through Energy
rather than taking a nav slot.

- `site-energy/energy.html` — new `#solar-and-gas` routing section directly under the subnav:
  "Energy Covers Solar and Gas", two cards, button to `gas.html`. `Solar and gas` added as the
  first subnav item. The bottom "Also from Sunlogic" cross-sell was **removed** — superseded.
  Meta description now covers both trades, in all three places it appears.
- Nav unchanged: Home · Energy · Smart Solutions · Electrical.
- `conformance:energy` passes 0 fails, 0 warns, both viewports. Verified in the browser.

**Left alone deliberately:** `energy.html`'s `<title>` and hero are still solar-only. They are
client copy, and the page now parents two trades while introducing itself as the solar page.
Worth a decision.

### Pre-existing bug found and FIXED: the nav collided at 768px

Reproduced on `energy.html` at exactly **768px**, the width at which `shared/sunlogic.css`
switches the desktop nav on (`@media (min-width: 768px)`). The logo is 186px and the link list
is 555px, which needs roughly 790px with the gutters — so between **768px and ~790px** the
wordmark runs into "HOME" and "Smart Solutions" wraps to two lines, making the bar 44px tall.
At 800px there is an 11px gap; at 1100px, 311px.

**This affects all three sites and has nothing to do with gas.** `conformance` misses it
because it tests 412 and 1440, neither of which lands in the gap. **iPad portrait is 768px.**

**Fixed by raising the nav breakpoint from 768px to 860px** in `shared/sunlogic.css` — one
line, with the arithmetic written into the comment above it so it can be re-derived. 860 is
789 + 71px of slack, and the slack is deliberate: the 555px link list is measured with
JetBrains Mono loaded, and a fallback face renders wider. Everything from 768px to 859px now
gets the drawer, which is the better control on a touch device anyway.

Verified on all three sites: at 768 and 859 the drawer shows and the desktop nav is hidden; at
860 the desktop nav returns with a 71px gap on Energy and Electrical, 230px on the apex, every
link on one line. `npm run conformance` (all three sites, 26 pages) passes 0 fails, 0 warns at
both viewports.

**Only the nav query moved.** The other sixteen 768px queries in `shared/sunlogic.css` are
layout — grids, hero heights, split panels — and were left alone deliberately.

**No manual `?v=` bump was needed, and the CLAUDE.md instruction to do one is out of date.**
`scripts/build-site.js` calls `hashAssetVersions()` after minification and rewrites every `?v=`
from the hash of the bytes actually served; the build now emits `sunlogic.css?v=f61ad667` on
all three sites. The `?v=45` in the source files is a dev-time placeholder, not the shipped
value. The CLAUDE.md line "There is no build step, so nothing fingerprints these" predates that
and should be corrected.

**Worth doing, not done:** `scripts/conformance.js` tests 412 and 1440 only, which is why this
survived. A third viewport in the 760-860 band would have caught it and would stop it
regressing. That changes the deploy gate for every site, so it is a decision rather than an
edit.

### Not committed

Session 17's work is committed (`214c7b8`, `aa4fea9`, `58d2604` on `main`, 6 ahead of
`origin/main`, **not pushed**). This session's `energy.html` change and these notes are not.

---

## Session 18 — gas.html built (site change, nothing in flight)

**Direction change from Stephan:** *"I don't want a gas vs discussion. I want a residential and
commercial gas page and solution."* The running-cost comparison is **off the page** and should
not be re-added. The research behind it stays in `docs/gas-service-pack-1.md` §2 as internal
guidance only, so nobody makes a saving claim the numbers do not support.

**Built: `site-energy/gas.html`.** Three sectors mirroring `energy.html`: 01 At home, 02 For
business, 03 Servicing and certificates. Sells flame control, hot water that does not run out,
working through an outage, and a job that passes, rather than a saving.

- `npm run conformance:energy` — **0 fails, 0 warns** at 412x823 and 1440x900
- In-browser check script — all checks pass, 1 unresolved placeholder
  (`[REGISTRATION NUMBER]`), which the checker itself calls correct until supplied
- Verified in the browser at desktop and mobile

**Four conformance failures were caught and fixed before it passed**, worth recording because
they are easy to repeat:

1. **No em dash in visible copy, ever.** Four `&mdash;` in the draft. Em dashes inside HTML
   comments are fine and match existing pages.
2. **A `dl-statement` with `warm` is itself an alt band** (`.sl-statement--warm` sets
   `--surface-page-alt`), so the section after it cannot be `bg="alt"`. `dl-sector` is also a
   band (`--surface-sunk`), which is why page → sector → page passes.
3. **Card headings to five words are Title Case**, including ones that read like sentences
   ("If You Are Selling").
4. **The build refuses an absolute URL to a page or image the site does not ship.** `og:image`
   pointed at `images/gas-hero.webp`, which does not exist; it points at `energy-hero.webp`
   until gas photography is shot. There is a TODO in the head.

**Also wired:** `Gas` column entry in the energy footer (`sites.config.js`), `gas.html` in
`site-energy/sitemap.xml`, Gas service entry in `site-energy/llms.txt`. Footer link verified
rendering on `energy.html`.

**Nav unchanged.** The energy nav is Home · Energy · Smart Solutions · Electrical and the
four-link cap is enforced by `sunlogic-check.js`, so Gas can only enter by displacing
something. Recommendation in the pack: displace **Smart Solutions** — Gas is a trade people
search for by name, Smart Solutions is a product they find once they are here. **Stephan's
call, not taken.**

### Decided 19 October, after the first build

**The SAQCC registration number is never published.** The trust strip reads "SAQCC Gas
registered practitioner" and carries no number. The research argued the other way (only two of
seven competitors publish one) and was overruled. Both pack files are updated; do not
reintroduce the placeholder.

**Cross-sell is in, nav is not changed.**

- `site-energy/energy.html` — a `bg="page"` section before the closing CTA, "We Do the Gas Side
  of the Job Too", outline button to `gas.html`
- `site-energy/index.html` — a `bg="page"` section with three cards (At Home, For Business,
  Servicing and Certificates) before the closing CTA
- Both are plain sections, not `dl-division-promo`: that component is for the *other division's
  site* and the apex/electrical pages already use it that way

**Gas is noted on the apex.** `site-main/index.html` — one item added to the Sunlogic Energy
division's service list: "Gas installation, from hobs and hot water to commercial kitchens".
`site-main/llms.txt` — gas added to the Sunlogic Energy description. `conformance:main` passes
4/4, 0 fails, 0 warns, both viewports.

**Flagged, not changed — apex copy that now under-describes the division.** Two lines predate
gas and are the client's own copy, so they were left alone:

1. The routing sentence in `#divisions`: *"If it makes power, stores it or controls it, that's
   Energy."* Gas does none of those, so someone looking for gas is not routed by it.
2. The Energy division card heading: *"Solar, Backup and Smart Control"*.

Both are one-line changes whenever Stephan wants them.

### Copy review of the as-built page — run 19 October, after Stephan asked

The 15 October `copychief` / `compliance-checker` run covered the **pack draft**, not what
shipped. Re-run against `gas.html` as rendered. **Report in `docs/gas-service-pack-2.md` §8.
Seven fixes applied; conformance still 0/0.**

**The finding that mattered, and it is a standing rule now:** three lines claimed an operating
history in gas that Sunlogic does not have yet — *"the single most common thing we are called
out to"*, *"most of what we service was installed by somebody else"*, *"it has saved people a
great deal more than it costs"*. We are **entering** gas. Under CPA s41 a false representation
about an enterprise's experience is actionable, and it is the kind of thing a customer can test
in conversation. All three rewritten to argue from the fault or from logic instead.

**CORRECTED, same day: Stephan said "keep the track record" and all three lines are restored.**
The review assumed Sunlogic was entering gas and had no gas callouts or service book. That
assumption was wrong, the claims are true, and there is no CPA issue. The "no track-record
claims" rule written from that premise is **withdrawn**. The other four fixes stand — they were
an internal contradiction, an unverifiable competitor claim, a wrong word and an unattributed
figure, none of which depended on the assumption.

**Also updated on the apex, on request:** the routing sentence now reads "If it makes power,
stores it, controls it or runs on gas, that's Energy", and the Energy division card heading is
"Solar, Backup, Gas and |Smart Control".

Also fixed: the body claimed a gas geyser works in an outage while our own FAQ correctly says
it depends on the model; a competitive claim ("almost nobody in this market sells this") sitting
inside a process step; "the two moments when gas work gets inspected", where neither named
moment is an inspection; and the indoor storage limit stated bare rather than attributed to the
standard.

**Worth noting:** cutting the economics section removed the entire financial-claims category.
No price, tariff, saving or payback claim appears anywhere on the page.

**Housekeeping:** `docs/gas-service-pack-2.md` is now ~11,400 words, which is at the
Documentation Bible's 15,000-token ceiling. Split it into `-2` and `-3` if it grows again.

**Open on the page:**

1. ~~Gas photography.~~ **Hero placed 19 October** — Pexels 4063198 by Honye Sanges, Pexels
   licence (free commercial use, no attribution required). Centre-cropped 6000x4000 to 2:1,
   emitted at 640/1024/1440/1920 webp q80 as `site-energy/images/gas-hero*.webp`, preloaded,
   and `og:image`/`twitter:image` now point at it. 88 KB for all four files; 35 KB at 1920,
   because the frame is nearly all black. **It is still a flame shot**, which the research
   called the competitor cliche, so the original brief stands as a replacement: a cylinder bank
   or bulk tank against a Cape Town house wall, dusk register. Our own job photography would
   beat it.
2. Nav decision. Energy nav is still Home · Energy · Smart Solutions · Electrical.
3. The standards purchase (R2,589.80) still gates every SANS number. **No SANS distance,
   clearance, ventilation area, test pressure or interval appears on the page** — the copy was
   written to work without them, so this does not block publishing.

**Nothing committed.** New and untracked: `site-energy/gas.html`. Modified: `sites.config.js`,
`site-energy/index.html`, `site-energy/energy.html`, `site-energy/sitemap.xml`,
`site-energy/llms.txt`, `site-main/index.html`, `site-main/llms.txt`.

---

## Session 16 — gas research pack + verification pass (docs only, nothing in flight)

**Task:** investigate gas installation and servicing in South Africa, residential
and commercial, and produce a pack for adding it to the energy site.

**Nothing was changed on any site.** No HTML, CSS, JS or Worker touched. Four new
documents, all under `docs/`:

- `docs/gas-service-pack-1.md` — the case, the position, the page map for `gas.html`
- `docs/gas-service-pack-2.md` — draft copy section by section, FAQs, title/meta/schema,
  the compliance buckets, the verification gate, and the review record in §7
- `docs/research/reports/SA gas installation market pack.md` — 12,600-word research report
- `docs/research/research_notes/SA gas installation market pack/` — five researcher note files

**Key decisions taken in the pack:**

- Gas is positioned as a **compliance and performance** product, not a savings product.
  The research is unambiguous that gas loses on running cost against a heat pump, against
  Eskom Homelight 20A and CoCT Lifeline, and against electric for cooking. The defensible
  argument is price trajectory (regulated LPG flat 33 months vs electricity +22.6% in 24).
- The position is **"one contractor, one certificate trail"** — unoccupied in the Western
  Cape across seven competitor sites read in full.
- **Load-shedding is not used anywhere.** 504 consecutive clear days as at early Oct 2026.
- Nav recommendation is **Option A**: Gas takes the fourth slot, `energy-management.html`
  moves to the footer. `dl-nav-bar` is capped at four links by the system.

**Skills run:** `anthropic-skills:deep-research` (5 parallel researchers + report writer),
`landing-page-copy` and `direct-response-copy` for the draft, `copychief` and
`compliance-checker` for review. 11 fixes from the reviews are applied in part 2; the
record of what changed and why is part 2 §7.

### 2026-10-19 — verification pass 2, and the SAQCC blocker lifted

A second session (`local_32de762d`) re-ran the lookups that had failed for tool reasons rather
than availability. **Six of seven targets closed, and the Pressure Equipment Regulations were
read in full.** Report: `docs/research/gas-verification-pass-2.md`. All 19 patches are applied
to both pack files.

**Stephan confirmed the SAQCC Gas authorised person is sorted.** Part 1 §0 is rewritten
accordingly — it now only asks for the practitioner's name, registration number and category,
which are placeholders in part 2's hero and trust strip.

**Two things in the draft copy were factually wrong and are fixed:**

1. Regulation 17(2) places the pre-commissioning inspection and leak-test duty on the
   **user**, not the owner. On a tenanted property those differ.
2. The City of Cape Town gas threshold sits under the **National Building Regulations and
   Building Standards Act**, not the Community Fire Safety By-law.

**Closed by the pass:** City of Cape Town tariffs settled (Domestic 2026/27 = 413.79 c/kWh to
600 kWh, 493.90 above, incl. VAT — the 400.63/480.73 set circulating is wrong) · City gas
thresholds verified · R.262 of 2017 read in full, and it pins **no edition year** for any
standard, so "the current edition applies" is our reading · SANS 827 is **not** incorporated ·
Part 1/2/3/7 scopes verbatim, and Part 7 was wrong in the research · MHI quantities are real SA
figures, **20/50/200 t** · LPG calorific value sourced (Afrox Handigas, net 45.8 MJ/kg at 25 °C
= 12.72 kWh/kg) · the gazetted Annexure 1 CoC form is **one page** with no expiry field, so the
five-page version is registrar practice · servicing answered by reading reg 17: "service" and
"maintain" appear nowhere, only 17(1)(c) requires an authorised person and it covers install
and remove only.

**Route notes worth keeping:** `resource.capetown.gov.za` refuses connections, but every
document is served from `https://www.capetown.gov.za/_documents/resource.capetown.gov.za/<same
path>`. SAQCC Gas spells the path `gas-practioners`, not `gas-practitioners`. `saflii.org`
returns 403 — use `acts.co.za` for SA regulations. And a PDF that "could not be retrieved" was
often just undecoded binary needing local extraction.

**Still blocked, and it is now almost entirely one purchase:**

1. **Buy SANS 10087-1:2026 (Ed. 7.01) R1,465.10 and SANS 10087-3:2015 (Ed. 5.00) R1,124.70 —
   R2,589.80.** Note the edition: it is **not** "Edition 7 (2024)", which the first pass
   assumed. Every distance, clearance, ventilation area, test pressure and consumable age is
   still read only against the superseded 2008 Edition 5, and all bulk-tank distances are a
   straight blank. Part 2 §5.1.
2. **Appliance efficiencies** — entirely unverified, and the hob figures are what drive the
   "gas cooking costs more" conclusion, so that claim stays gated even with the calorific
   value sourced.
3. **One email to SAQCC Gas** (drafted in the report §8): administrative CoC validity, category
   codes, and the numeric trade boundary. **No longer a blocker** — each has publishable
   wording already.
4. Nav decision, and which certificates we can actually issue in-house.
5. Who owns the monthly LPG price on the page, or it comes off.

20 `[VERIFY]` markers remain in part 2, and essentially all of them sit behind item 1.

**Already in place, no work needed:** `site-main/project-brief.html` carries a Gas job
category with its own branch, and `job_category` is free text in the relay, so Gas
submissions already land without a migration.

**One error to stamp out wherever it appears:** a gas CoC is issued by an authorised person
registered with **SAQCC Gas**, not by someone registered with the LP Gas Safety Association.
The wrong version is all over SA conveyancing and estate-agency pages.

---

## Session 15 — IN FLIGHT: director mail to stephan@ not arriving

**Reported:** the `accepted` details email for lead 28 never arrived. Called
vital.

### DEPLOYED 2026-10-15 — the lead-safety fix is live

Production Worker version history for 2026-10-15, newest first:

- `97943215-28f1-4f24-b02a-73a08d73c5d1` — **the race fix.** Migration 0006
  (applied). A real bounce test found that Resend's webhook can arrive BEFORE
  the `messages` row exists (observed: event 13:49:20, row 13:49:22), so a
  genuine bounce matched nothing and escalated to nobody. On a director
  notification that IS lead 28 — bounced offer, director never told, 24-hour
  clock running on silence — and it was live in production. 79 tests had all
  seeded the row before the event, so the suite was evidence about its own
  assumption. `reconcileUnmatched` now applies events that arrived early, as
  soon as the send is recorded. It was only visible because unmatched events
  are recorded (cae7079); before that it would have been accepted and
  discarded.
- `e6b1ea36-8376-45fa-9de8-383391b4a042` — internal submissions marked out of
  the pending queue at submit time.

- `11981630-57d6-4cb1-bd41-d120267ce323` — every send() site records its
  message id; unmatched webhook events kept. Needs migration 0004 (applied).
- `d867ea9a-e716-49a5-8fbd-3c33eb782ffc` — delivery confirmation. Built by
  `git archive` of 46c5476 (predates the uploads R2 binding) because a deploy
  from HEAD fails while R2 is disabled; recipe in
  `docs/lead-delivery-confirmation.md`.
- `bb4255a3-bdc5-4ccd-a41c-c0b67bb790e5` — the lead-safety fix below.
- `39910dc7-9d7b-4da9-93f9-ca9116fb4ae7` — 2026-09-10, the rollback floor.

The lead-safety fix is verified present in the CURRENT live bundle, by checking
the live claim page for CSS rules that exist only in the patched `claim.mjs`
(`.d{text-align:left`, `.d dl{`, `.d .m{`). Re-run that check after every
deploy — three sessions have deployed this Worker today.

Staging ran the lead-safety code as `cdf1b2bc-330e-414d-915b-56d162f9d198`.

**Internal test rows and the digest.** Leads 29 and 30 were diagnostic
submissions from this session; both sat `status='pending'` forever because
`handleLeadRoute` returns early for internal submissions without marking the
lead, so the digest would have reported "2 queued for sending" every morning
and climbed with each test. Both were set to `status='sent'` on 2026-10-15
(queued count back to 0). The CODE is fixed too, as of `e6b1ea36`: verified in
production with lead 31, which landed `status='sent'` with no offer.

Leads 32 and 33 were bounce-test leads created and then deleted by the
delivery session, along with their offers, messages and events. Production
leads are now 26, 27, 28 (real) and 29, 30, 31 (internal tests from this
session, all `sent`). Tomorrow's first digest reports arrived_24h 3,
open_offers 0, queued_now 0, failed 0, unmatched 0 — the 3 are those internal
tests, not real enquiries.

**Still not proven by a real bounce:** the DIRECTOR branch (offer expires,
lead hands to the other director with a live token). 8 unit tests cover it,
and `workers/leads-relay/scripts/manual-bounce.mjs` is committed for when
Stephan wants it driven for real — it emails Craig, so it needs his say-so.

Deployed from a THROWAWAY WORKTREE at HEAD with only two files patched, because
the main working tree carries two other sessions' uncommitted work and R2 is
not enabled on the account — a deploy from the dirty tree fails on the
`UPLOADS` binding. HEAD's worker source is byte-identical to the previously
deployed commit `7c023e1`, so the deploy changed exactly two things:

- `src/claim.mjs` — the accept page now renders the lead itself: name, a
  tappable phone, a mailto email, suburb, property type and the full message,
  all escaped. The 5-second auto-close is gone, deliberately: it would throw
  away the only copy the director is holding. An unreadable payload degrades
  to "Accepted" with no detail rather than failing the accept.
- `src/index.js` — the claim route's `notify` now records a throw on the lead
  instead of discarding it in `waitUntil`.

**Verified, not assumed:** 38 tests pass in the clean tree (31 existing + 7 new
in `test/claim.test.mjs`); production secrets and bindings unchanged after the
deploy with no `MAIL_REDIRECT_TO`; routes answer 405/400/200/404 as expected;
and the full submit-then-accept flow was run against staging on the identical
code — details block present, phone tappable, `<angle>` and `&` escaped, no
self-closing tab.

**Committed on `main`, nothing pushed** (2026-10-15, three commits on top of
15de0bf, deliberately NOT on a branch because this checkout is shared with two
other live sessions):

- `b3299d3` fix(leads-relay): show the lead on the claim page and record a
  thrown notify — **this is the commit that is deployed** as Worker version
  bb4255a3. Verified: its only `index.js` change against the previously
  deployed source is the `.catch` hunk, and its `claim.mjs` contains no
  webhook, `messages` or uploads code.
- `46c5476` feat(leads-relay): confirm delivery of emails via Resend webhook —
  NOT deployed. Needs migration 0003 on production D1, a RESEND_WEBHOOK_SECRET,
  and the webhook registered in the Resend dashboard. Note it also routes the
  daily digest through `send()`; the n8n workflow still reacts to
  `event: 'digest'`, so confirm there is no double-send before deploying.
- `ed4c19b` feat(leads-relay): accept project brief photo uploads into R2 —
  another session's work in progress, committed as a snapshot. Cannot deploy:
  R2 is not enabled on the Cloudflare account. A `RESEND_WEBHOOK_SECRET`
  comment block landed in this commit's `wrangler.toml` though it belongs with
  46c5476; cosmetic, left alone.

75 tests pass at HEAD.

Root cause of the ORIGINAL incident is still not established: Resend accepted
the message and nothing watched what happened next. The delivery-confirmation
work addresses that but needs the Resend dashboard (webhook + signing secret)
and migration 0003 applied to production D1 before it can go live.

### Production state changed this session (all deliberate, all reversible)

- `rotation.last_offered_to` set to `craig`, so the NEXT new lead is offered to
  stephan. (The pointer names who was offered LAST; the Worker offers the
  other one.)
- Lead 28 claimed for stephan via a real `POST /claim/<token>` (not a hand
  write), so every side effect ran. `claimed_by=stephan`, accepted 2026-10-15
  08:01:21 UTC, 56 min before it would have lapsed to craig.
- Lead 29 created as a deliberate internal test (`stephan@sunlogic.co.za` as
  the sender, which the Worker excludes from the rotation). No offer, no
  director paged, pointer untouched. It will sit `status='pending'` forever —
  see the wart below.

### Established by evidence

- Form is live and correct on all three sites, all posting to
  `https://leads.sunlogic.co.za/leads/contact`.
- Production Worker (version `39910dc7`, deployed 2026-09-10) has NO
  `MAIL_REDIRECT_TO`. The temporary gmail redirect is gone from production; the
  only remaining mention is `[env.staging.vars]`, which is correct.
- Rotation works on real traffic: lead 26 craig, lead 27 stephan (expired) then
  craig, lead 28 stephan.
- Mail DNS is healthy: `send.sunlogic.co.za` has SPF (amazonses), DKIM, and the
  SES feedback MX; `_dmarc.sunlogic.co.za` is `p=none`.
- `compose('accepted')` maps to `body-assignment-full.html`, which exists.
  `loadOffer` selects every field `notify` needs, so the known silent-failure
  shapes are ruled out.
- **Resend CAN deliver to stephan@sunlogic.co.za.** The lead-29 test reply was
  sent through the same Resend-first `send()` path and the user confirmed it
  arrived. So this is not a dead mailbox or a domain/filtering problem.

### Still unknown — the next step

Whether Resend actually accepted and delivered the 08:01:21 UTC `accepted`
message for lead 28. **The Resend dashboard (or API) is the only authoritative
source** and needs the user's account; `RESEND_API_KEY` is a Worker secret and
cannot be read back with wrangler, and there is no `.dev.vars` locally.

### Two real design defects found while investigating (not yet fixed)

1. **An `accepted` email that fails is invisible.** The claim route runs
   `ctx.waitUntil(notify(...))` and discards the result. `notify` writes
   `leads.last_error` on failure, but a throw before `send()` — or a dropped
   `waitUntil` — leaves no trace anywhere. That is exactly why this question
   cannot be answered from the data.
2. **The daily digest does not exercise the mail path it is supposed to
   prove.** `sendDailyDigest` POSTs only to `N8N_WEBHOOK_URL`; it never goes
   through Resend. If Resend dies, the digest still arrives and nobody learns
   anything. The dead-man's switch has a blind spot over the primary sender.

Wart: `retryPendingLeads` picks up every internal-test row (`status='pending'`,
no `pending_send` offer), does nothing, and never increments `attempts`, so the
row is re-examined every 5 minutes forever. Harmless, but it means test rows
accumulate in that query.

---

## Session 14 — Project Brief form rebuilt and LIVE

**Task:** `https://sunlogic.co.za/project-brief/` 404ed. The old WordPress
(Quform) brief form was gone. Rebuilt in the current design system, posting to
the n8n webhook that was listening the whole time.

**Committed as `88cdf51` and deployed.** `https://sunlogic.co.za/project-brief`
answers 200; `/project-brief/` 301s to it and `/project-brief.html` 308s to it;
noindex, canonical and the robots.txt disallow are all live; it is not in the
sitemap. Verified on the live origin: five categories, branch switching
correct, `SL_CHECK` 0 fails 0 warns, no console errors.

**ONE THING BLOCKS REAL USE: photo uploads are dead.**
`https://leads.sunlogic.co.za/uploads/brief` returns **404** — the Worker has
not been deployed with the upload route, because (per `ed4c19b`) **R2 is not
enabled on the Cloudflare account** and `wrangler deploy` fails on the UPLOADS
binding.

Consequence, and it is not graceful: `dlUploadFile` throws on the 404,
`dlInitForm` catches it and calls `dlFormError`, so **a brief submitted with
any photo attached fails completely** and shows "Something went wrong. Please
call us instead." The brief is not sent. A brief submitted with NO photos
posts to n8n normally and works end to end.

Decision taken: leave the abort-on-failure behaviour as is; the team is being
told not to attach photos until R2 is on.

**Photos are stored in D1. Code is done and verified; two production
commands remain, and they need the owner to run them.**

Three stores were tried before this one, and each failed for a non-engineering
reason:

1. **R2** — enabling it needs a card at checkout. `wrangler r2 bucket create`
   returns code 10042. Declined.
2. **Drive via a Worker service account** — built, tested, reverted. Needed a
   Google Cloud project created from scratch.
3. **Drive via n8n**, which already has a Drive credential — specified in
   `docs/project-brief-photo-upload-spec.md`, but it is an n8n change and goes
   through `serverMonitor`.

**D1 was already enabled, already bound, already deployed.** Photos are rows
in `brief_photos`, served back by the Worker at `/uploads/<key>`. Using the
storage that was actually available beat a better-shaped store that was not.
If R2 is ever enabled, moving is a small change in one handler and the page
never knows.

**The cost, and how it is paid:** D1 caps a value at 2 MB and a phone camera
produces 8–12 MB. So the page downscales first — `dlCompressImage` in
`shared/forms.js`, 1600px long edge, JPEG q0.82. A DB board lands ~300 KB and
stays legible. ~1,500 photos fit the free 500 MB database; `brief_photos` is
indexed on `created_at` so a retention sweep is easy later.

**The bug worth remembering.** D1 returns a BLOB as a plain Array of byte
values, not an ArrayBuffer. `new Response(row.bytes)` does **not** throw — it
returns 200 with an EMPTY body. Every photo would have served as a zero-byte
file with perfectly correct headers, and nothing would have logged anything.
Caught only by byte-comparing a round trip. The fix is
`new Response(new Uint8Array(row.bytes))`. **Keep byte-comparing round trips.**

Verified locally against `wrangler dev` with a real 300 KB PNG: upload 201,
fetch-back byte-identical, `size_bytes = length(bytes)` in the row, 3 MB
refused 413, SVG refused 415.

### DEPLOYED AND VERIFIED ON PRODUCTION — photos work

Migration applied (3 queries, database 0.10 MB) and the Worker deployed, both
by the owner on 2026-10-15; this environment's classifier blocks production
deploys.

Verified against production, not locally:

| Check | Result |
|---|---|
| `OPTIONS /uploads/brief` from the live origin | 204, allows `Content-Type, X-File-Name, X-Brief-Reference` |
| Upload a 300 KB PNG | 201 with a real URL |
| Fetch it back and byte-compare | identical |
| SVG | refused 415 |
| 3 MB file | refused 413 |
| Upload from the live page itself | 201, with and without the reference header |
| Open a photo URL in a browser | renders at full resolution |

**One thing that looks like a bug and is not.** `GET /uploads/<key>` sends no
CORS headers, deliberately, so a cross-origin `fetch()` from the page is
blocked and fails with "Failed to fetch". That cost twenty minutes of
debugging. The real consumers never do that: Trello fetches server side and a
person opens the link directly, both of which work. Do not "fix" this by
adding CORS to the GET route.

Also worth keeping: `dlCompressImage` correctly declines to compress when the
re-encode would be larger. A flat-colour PNG compresses better as PNG than as
JPEG, so it returns the original. `didCompress: false` is a pass, not a
failure.

### The only untested step

**A real brief submitted with photos attached.** Not done here, deliberately:
it writes a Postgres row, copies a Drive document, emails both directors and
opens a Trello card. That first real submission is the owner's to make.

What it should produce: the Trello card carries the first photo as an
attachment and any others as links in its description, all opening on
`leads.sunlogic.co.za`.

### Test rows left in production

A handful of verification photos are in `brief_photos` with
`reference = 'VERIFY-TEST'` or `'LIVE-CHECK'`. Harmless, a few hundred KB.
To clear them:

```bash
npx wrangler d1 execute sunlogic-leads --remote \
  --command "DELETE FROM brief_photos WHERE reference IN ('VERIFY-TEST','LIVE-CHECK')"
```

### First SUCCESSFUL submission — and why there is still no Trello card

Row **41** in `sunlogic_briefs.submissions`: Stephan Marais, Renewable, with
`upload_photos_db` set to a real URL that serves 200 / image/jpeg / 215 KB.
**The form, the upload, the D1 store and the n8n webhook all work.**

The n8n execution (`332352`) then **errored**, so `processed` is false and no
Trello card was created. The failing node and its reason, pulled out of
`execution_data` (which n8n stores index-encoded, so it needs dereferencing):

```
FAILED NODE: Send email  (n8n-nodes-base.emailSend)
NodeApiError: "certificate has expired"   httpCode: ESOCKET
```

Confirmed independently, not taken on trust:

```
smtp.sunlogic.co.za → CN=sunlogic.co.za
notAfter = Oct  3 09:10:37 2026 GMT        (expired)
```

**Why that kills the Trello card.** `Send email` and the Trello chain are two
parallel branches off `Download file`. The email node throws, the execution
aborts, and `Upload file → Share file → Delete temp file → Create Trello card
→ attach photos → PostgreSQL Update` never runs. Nothing is wrong with the
Trello side.

**Blast radius is one brief.** 39 processed, 2 not: row 1 (ancient) and row 41
(this one). Yours is the first brief submitted since the certificate expired,
because the form was dead for the whole period in between.

**The fix is not in this repo.** Either renew the Xneelo certificate for
`sunlogic.co.za` (the real fix, and it also affects anything else sending
through that mailbox), or set "Ignore SSL Issues" on the Send email node as a
stopgap — an n8n change, so `serverMonitor`. Worth considering at the same
time: putting Trello **before** email in that workflow, so a mail outage stops
costing the card and the `processed` flag.

Row 41 can be replayed from the n8n UI once mail works.

### Two fixes from that session

- **The page goes to the confirmation after a successful send.** Submit sits
  at the foot of a twenty-field form, so the success panel replaced the form
  well above the fold and the page appeared to do nothing.
- **The street number survives.** OSM frequently holds the road but not the
  house, so "9 Chesham Road" came back as "Chesham Road, Wyndover…" and the
  one part a driver needs was dropped. `dlAddressLabel` uses OSM's
  `house_number` when it exists and otherwise puts the typed leading number
  back. Verified: "9 Chesham Road Claremont" → "9 Chesham Road, Wyndover,
  Claremont…", while "Long Street Cape Town" gains no invented number.

### "Load failed" on the retest — a STALE DEPLOY, not a code fault

2026-10-15. The brief failed again with Safari's wording for a dead `fetch()`.
Caught on a live `wrangler tail`, which is the only reason it took minutes
rather than a day — the Worker has no observability block, so nothing is
queryable after the fact.

```
OPTIONS https://leads.sunlogic.co.za/uploads/brief  -> 404
```

The CORS preflight 404s, so the browser never sends the POST and reports
"Load failed" with no detail. Probing the deployed routes shows whose code is
live:

| Route | OPTIONS | POST |
|---|---|---|
| `/uploads/brief` | **404** | **404** |
| `/leads/contact` | 204 | 400 |
| `/leads/calculator` | 204 | 400 |
| `/resend/webhook` | 405 | 401 |

**The Resend webhook is deployed and the photo uploads are not.** Another
session ran `wrangler deploy` from a tree that predated commit `63c1366`, and
that deploy replaced the one verified working at 13:37. Both features are
present in HEAD and the working tree is clean, so a single redeploy from here
restores both.

**The operational hazard, which will recur:** two sessions deploy this same
Worker. `wrangler deploy` ships a whole script, not a diff, so whoever
deploys from a stale checkout silently removes the other's routes. Nothing
errors. The only symptom is a 404 on a route that worked an hour ago. Before
deploying this Worker: `git pull`, confirm the tree is clean, and afterwards
probe the routes you did not touch.

**Redeployed and verified** (version `853d6299`): all four routes answer
correctly with both features present at last —

| Route | OPTIONS |
|---|---|
| `/uploads/brief` | 204 |
| `/leads/contact` | 204 |
| `/leads/calculator` | 204 |
| `/resend/webhook` | 405 (POST only, as designed) |

A 300 KB PNG uploaded to production returns 201 and fetches back
byte-identical, and `dlUploadFile` called from the live page itself returns a
real URL.

### Documents (PDF, Word, Excel) + files split across D1 rows

2026-10-16. Asked for PDF/docx support. PDF was already allowed; Word and
Excel were not. The real obstacle was size, not type.

**D1 caps a single value at 2 MB.** Fine for a photo the page downscales to
~300 KB, useless for a document: a scanned CoC is 1-5 MB and an electrical
layout plan more. Widening the type list alone would have shipped a feature
that failed on most real files.

So a file over one chunk is now **split**: chunk 0 stays in
`brief_photos.bytes`, chunks 1..n go in the new `brief_file_chunks`
(migration `0009`), and the GET reassembles in `ORDER BY chunk`. Asymmetrical
on purpose — every existing row keeps working with no backfill, and a photo
is still one primary-key lookup. Both written in a single `env.DB.batch`, so a
file is wholly stored or not stored at all; a short reassembly logs
`upload_incomplete` and answers 500 rather than serving most of a PDF as a
success.

Limit raised 1.9 MB → **25 MB**, a product decision again rather than a
platform one.

**A lie the page had been telling:** the upload hint still read "Up to 15 MB
each" from the R2 design, while the real limit had been 1.9 MB since the D1
switch. Four occurrences, now "Photos, PDF, Word or Excel. Up to 25 MB each".

Verified against a running Worker with the owner's actual filename: a 5 MB
`E100 Electrical Layout Plan Rev-01 (1).PDF` stored as 3 chunks
(1,900,000 + 2) and round-tripped **byte-identical**; a 300 KB `.docx` stored
as 1 chunk, 0 extra, also byte-identical. Unit tests 20/20, including that
every allowed type has an extension AND passes `UPLOAD_KEY_PATTERN` — a type
added to one but not the other uploads fine and then 404s on the way out.

### The deploy regression happened a SECOND time — now guarded

The "Load failed" on the PDF was not the PDF. `/uploads/brief` was returning
**404 again**: another `wrangler deploy` from a checkout behind `63c1366`,
exactly as on 2026-10-15. `/resend/webhook` live, `/uploads/brief` gone.

`wrangler deploy` ships the WHOLE script, not a diff. Two sessions deploy this
Worker. A deploy from a stale checkout silently deletes the other's routes,
prints success, and the only symptom is a 404 that reaches the browser as a
bare "Load failed" with nothing to diagnose. Both times it cost a live
`wrangler tail` and lucky timing to find.

Guarded now, rather than just fixed again:

- `workers/leads-relay/scripts/smoke.mjs` probes every route and exits
  non-zero naming the missing one. It checks the routes you did NOT touch,
  which is where this hides.
- `npm run worker:deploy` = deploy + smoke. **Use it instead of a bare
  `wrangler deploy`.**
- `workers/leads-relay/DEPLOYING.md` explains why, with both incident dates.

Proven: run against the currently-broken live Worker, the smoke test fails on
`/uploads/brief -> 404 (expected 204)` and passes the other three.

Still worth doing: there is no `[observability]` block in `wrangler.toml`, so
Worker logs are not queryable after the fact. Both incidents needed a tail
running at the moment someone retried.

### The first real submission FAILED, and what came out of it

Submitted 2026-10-15 with photos. It showed "Something went wrong. Please call
us instead." and sent nothing.

**Diagnosis, from the data rather than a guess:** zero executions of
`e86TQUi0qAbwqqVk`, no new row in `sunlogic_briefs.submissions` (still id 40,
Craig Lewis), and no photo row in D1 beyond my own test rows. So the photo
upload failed and the page correctly refused to send a brief whose photos were
missing. The fault was the message, not the refusal.

**Most likely cause:** `file.type` is EMPTY for a lot of real files, HEIC
straight off an iPhone being the common one. An empty type skipped
compression AND failed the server's allow-list, so an ordinary iPhone photo
came back "unsupported file type" with nothing on screen to say so.

Four things changed as a result:

1. **`novalidate` is now set on every form by `dlInitForm`.** This is the big
   one. With `required` on the controls the browser validated first and
   **never dispatched `submit`**, so the handler and every message it produced
   were dead code on any form with a problem. The `required` attributes stay;
   `dlValidate` reads them.
2. **Field-level errors.** `dlFailField` marks the control red
   (`--color-error-container`, a token that existed and had never been used on
   a surface), writes the reason under that field, scrolls to it and focuses
   it. Corrected input clears it immediately.
3. **File type inferred from the extension** when the browser gives none, and
   files checked **when they are chosen** rather than at submit. A HEIC that
   cannot be resized now says so, and says what to change on the iPhone.
4. `--color-error-container` added to `sunlogic-check.js`'s palette. It was a
   real token missing from that list, which the rule's own comment
   anticipates.

### Three changes the owner asked for, all done

- **Project Brief Submitted By is a dropdown**: Stephan Marais, Craig Lewis.
  Not guessed — taken from the 40 rows already in
  `sunlogic_briefs.submissions` (Stephan 22, Craig 17, one blank). It renders
  as `[Team Lead]` on the client-facing brief document, so a typo there
  reaches a client.
- **Street Address searches as you type.** OpenStreetMap Nominatim, chosen
  over Photon because it takes `countrycodes=za`, so "Main Road" returns Cape
  Town rather than Manchester. Free, no key. Debounced 600ms and silent under
  three characters, which keeps it inside Nominatim's one-request-a-second
  policy; attribution is in the field hint, as that policy asks. Keyboard
  navigable. **Picking a result also fills GPS location and Google Maps
  Link**, which were previously typed by hand or left blank. All four Street
  Address fields, one per branch.
- **Invalid fields are shown, named and jumped to** — see above.

Verified in the browser: empty form marks and focuses "Project Brief Submitted
By" with "Please choose an option"; a bad email marks and focuses with "Enter
a valid email address, like name@example.co.za"; real typing clears it;
"9 Chesham Road Claremont" returns a suggestion and filling it sets GPS
`-33.9781261, 18.4854264` and the matching Maps link. Conformance 0/0.

### Gas added as a fifth Job Category

`Renewable | Electrical | Gas | Quote Request | Other`. The Gas branch carries
address, GPS, maps link, Building Type, Proposed Date, photos and comments.

**It has no Residential/Commercial field.** The first cut gave it one in the
`Type` key; it was removed because `Business or Personal`, asked of every
brief, is the same question. Reasoning and the condition that would reverse it
are in `docs/project-brief.md`.

No backend change: `job_category` is free text, so "Gas" lands without a
migration, and the branch reuses keys that already exist. Gas photos use
`Please upload photos` (`upload_photos`), the same path as Electrical.

Verified: Gas selected shows only the Gas branch, payload is 15 keys with
`Job Category: "Gas"` and no stray `Type`, conformance 0/0.

**The page is excluded from the CI gate** (`EXCLUDED_PAGES`), so its
conformance is only ever checked by hand. It was checked at the two viewports
the gate itself uses, 412x823 and 1440x900, across all five Job Categories:
0 fails, 0 warns, no horizontal scroll at either width. Re-check it the same
way after any edit to this page, because nothing in CI will.

**One defect found and fixed while verifying:** the inline success heading read
"Brief submitted", and a card heading of five words or fewer must be Title
Case. It is now "Brief Submitted". Worth noting how it was missed first time
round: `SL_CHECK` was only ever run on the unsubmitted page, and that heading
does not exist until the form is replaced by the success panel. **Run the check
after submit as well as before.**

### `npm test` runs again — Playwright browsers were missing

`test/conformance.test.js` was failing because Playwright could not launch:
the installed package (1.62.1) wanted `chromium_headless_shell-1234` and the
cache only held `1243` and `1248`. Fixed with `npx playwright install`.
Nothing to do with the brief form; it had been blocking `npm run conformance`
and `npm run sweep` the same way.

**`npm test` after the fix: 127 of 128 pass.** The one failure is
`tools/doc-builder/harness/api-test.mjs`, which is **untracked work in
progress belonging to someone else** (`?? tools/` was already in git status at
the start of this session). It fails on a hard-coded path from another machine:

```
ENOENT: no such file or directory, open '/home/claude/docbuilder/examples/SL-2609-IMY-proposal.json'
```

Not caused by this work and not this session's to fix, but whoever owns
`tools/` should know their harness cannot run on this Mac.

**`npm run conformance` after the fix: green.** 25/25 pages, 0 fails and 0
warns at both gated viewports (412x823 and 1440x900). That is the whole gate
passing on the three built sites with these changes in place. It does not
cover `project-brief.html`, which is in `EXCLUDED_PAGES` and was checked by
hand instead.

### Before this goes live

1. `npx wrangler r2 bucket create sunlogic-brief-uploads` (and
   `-staging`), then deploy the Worker. Until then `/uploads/brief` answers
   503 and photos cannot be attached; the rest of the form works.
2. Nothing has been posted to the live webhook. **The first real submission is
   untested end to end** — it writes a row, copies a Drive doc, emails both
   directors and opens a Trello card, so it was left for a human to do
   deliberately rather than as a test.
3. The three n8n defects in `docs/project-brief.md` (dead WordPress delete
   calls, a hard-coded secret in the workflow JSON, an unauthenticated
   webhook) are iMac changes and belong to `serverMonitor`.

---

## /solar became /energy, 2026-10-15

The division rename (Solar → Energy) had been applied to the nav and footer
labels but never to the page itself. Every label said Energy; the address said
`/solar`, and the page's own eyebrow and `<title>` still said Solar. Clicking
"Run the Sums Yourself" on the Energy home page therefore landed you on a URL
and a hero that both announced a division the site no longer has — which read
as the header changing rather than as a page you had navigated to.

`site-energy/solar.html` is now `site-energy/energy.html`, served at `/energy`.

| Changed | Detail |
|---|---|
| The page | `git mv`, plus its canonical, `og:url` and `<dl-nav-bar active>` |
| `sites.config.js` | nav and footer entries: `solar.html` → `energy.html`, key `solar` → `energy` |
| 7 in-site links | home page x4 (`#home-cost`, `#at-home`, `#small-business`, `#larger-sites`), 404 page, and 4 blog posts linking `#calculator-home` |
| `sitemap.xml`, `llms.txt` | the page's own URL |
| `site-energy/_redirects` | **new** `/solar` and `/solar.html` → `/energy` 301 |
| `site-main/_redirects` | its `/solar` 301s now target `energy.sunlogic.co.za/energy` |
| `site-electrical/_redirects` | same |

The apex and Electrical both already carried `/solar` → Energy redirects. Those
are the "all three sites" part — retargeted, not removed, so an old apex link
still lands in one hop.

**Deliberately NOT changed — visible copy.** The page still calls itself Solar
in three places: the hero eyebrow `SOLAR`, the `<title>` "Solar Sized On What
You Use | …", and button labels like "Solar at home" on the home page. That is
copy, and copy on this site runs through the skills that own it — and "solar"
is still the correct word for the technology even where it is the wrong word
for the division. Needs a decision, not a find-and-replace.

**Also left alone, on purpose**
- `shared/components.js` fallback nav/footer — pre-rename throughout
  (`Home · Solar · Electrical · Energy`), used only when a page is opened off
  disk with no `SL_SITE`. Renaming one entry of four would make it incoherent;
  it wants its own pass.
- `shared/sunlogic-check.js:432` names `solar.html` in a note about a past
  fix. Changing it would falsify the history it records.
- `docs/` (plans, specs, copy reviews) and `archive/site-tailwind/` — dated
  records of what was true then. `docs/site-architecture.md` describes the
  pre-split single site and is stale for other reasons too.
- `test/site-pages.test.js` uses `solar.html` as an invented fixture filename,
  not a reference to this page.
- `/energy-management` is still named for the pre-rename "Energy management"
  division, now called Smart Solutions — the page content already says Smart
  solutions, only the URL is stale. Same job, not done.

Verified: conformance 25/25 pages, 0 fails / 0 warns at both viewports; sweep
575 combinations, 0 findings; `npm test` 137/138, the one failure still the
untracked doc-builder harness. Locally `/energy` is 200. Nav highlighting
survives the key rename — `Energy` carries `aria-current="page"` and
`data-has-active="true"`. No `href` to the old page survives in any built page
of any site; the three remaining "solar" matches are an image filename, an
external citation, and a `mailto:` subject.

---

## Where this stands — read this first

**Task:** fix three mobile defects reported from a phone, across the apex,
Energy and Electrical sites. **Done, deployed, verified live.** The work then
grew one step: the Electrical deploy failed on a flaky gate while shipping it,
so the gate was fixed as well.

**Branch `main`, in sync with `origin/main`. The only uncommitted file of
mine is this one** — a docs-only commit would re-trigger all three Pages
builds, so it was left for whoever wants to batch it with real work.
Four commits this session, all pushed and all deployed:

| Commit | What |
|---|---|
| `9f0a84a` | `fix(layout): release dl-hero and dl-section height floors on upgrade` |
| `9912d57` | `fix(footer): centre footer in single-column phone state` |
| `6025061` | `fix(brand): show each site's own lockup in the mobile menu drawer` |
| `15de0bf` | `fix(ci): retry page navigation in the conformance and sweep gates` |

**Files touched this session**

| Path | Change |
|---|---|
| `shared/sunlogic.css` | hero/section height reservations scoped to `:not(:defined)`; new `@media (max-width: 559px)` footer-centring block |
| `shared/components.js` | comment only — the logo note named files that no longer describe what happens |
| `sites.config.js` | `logoWhite` repointed per site |
| `site-main/images/sl_logo_main_white.svg` | new |
| `site-energy/images/sl_logo_energy_white.svg` | new |
| `site-electrical/images/sl_logo_electrical_white.svg` | new |
| `scripts/page-load.js` | **new** — shared `loadPage()`, owns deadline/attempts/retry announcement |
| `scripts/layout-sweep.js` | uses `loadPage`; `aborted` flag; `SWEEP_CONCURRENCY` |
| `scripts/conformance.js` | uses `loadPage` |

**Still dirty, and none of it mine — do not sweep it into a commit.**
Modified before this session: `site-energy/_headers`, `site-energy/_redirects`,
`site-energy/robots.txt`. Untracked WIP: `Claude outputs/`,
`site-energy/plugins/doc-builder/`, `site-energy/plugins/quote-builder/`,
`site-energy/share/`, `site-energy/tools/`, `tools/`, `workers/doc-share/`.

**Live state verified by response body, not by assumption.** All three domains
serve `sunlogic.css?v=cb7d6876`, each with its own drawer lockup, and all three
new SVGs return 200. All three Pages projects are green on `15de0bf`, and the
gates ran clean inside Cloudflare's builder with **zero** retry lines.

### Next steps

1. **Nothing is required.** The reported defects are closed and live.
2. If `  retry ` lines start appearing in Pages build logs, the builder is
   saying the pool is too big — set `SWEEP_CONCURRENCY` in the Pages dashboard
   rather than editing `scripts/layout-sweep.js`.
3. `tools/doc-builder/harness/api-test.mjs` fails locally on a hardcoded
   `/home/claude/docbuilder/examples/SL-2609-IMY-proposal.json`. It is in
   untracked work so CI never sees it, but it makes local `npm test` 83/84
   instead of green. Worth fixing before that work is committed.
4. The old shared `images/sl_logo_white.svg` is now unreferenced by all three
   sites. `tools/doc-builder` embeds its own base64 copy, so deleting the three
   site copies is safe — not done, not urgent.
5. Playwright browsers were not installed on this machine; `npx playwright
   install chromium` was needed before any gate would run. Expect that on a
   fresh checkout.

### Key decisions, and why

- **`:not(:defined)` rather than re-measuring 964px.** A reservation is a guess
  at a height; the moment the real element mounts, the guess is worse than the
  measurement. Scoping it means the number never has to be re-measured when
  hero copy changes — being wrong now costs a shift, not a permanent gap.
- **Footer centring is `max-width: 559px` only.** At 560 and up the shared left
  edge is what makes the columns read as columns.
- **Per-site white lockups are generated from each site's own `_blue` file**,
  navy wordmark to white. Fill counts confirm it touches only the wordmark
  letters: 8 / 14 / 18 for Sunlogic / +ENERGY / +ELECTRICAL.
- **Only page *loading* is retried, never measuring.** Measurement here is
  deterministic — conformance's "did not expose `window.SL_CHECK`" is a real
  diagnosis, and burying it under "failed 3 attempts" would turn it into noise.
  A flaky load is infrastructure; a failing measurement is a finding.
- **Retries are printed on purpose.** A flake that is silently swallowed is a
  flake nobody ever fixes.
- **The Electrical failure was retried, not patched around.** The identical
  commit passed on retry and on the other two sites, which is what made it
  infrastructure rather than a defect — then the infrastructure was fixed.

---

## Mobile fixes, 2026-10-06 — three defects, all three sites

Reported from a phone: a slab of empty beige under the apex hero, footers
left-aligned down the middle of the screen, and the wrong logo in the menu
drawer. All three fixed and verified at 375px on all three sites.

| What | Where | Fix |
|---|---|---|
| ~400px gap under the apex hero | `shared/sunlogic.css` | The pre-upgrade height reservation on `dl-hero` (964px) never released. Scoped it — and `dl-section`'s 500px — to `:not(:defined)`, so the floor holds space until the element upgrades and then gets out of the way. The number no longer has to be re-measured when hero copy changes. |
| Footer left-aligned on phones | `shared/sunlogic.css` | New `@media (max-width: 559px)` block centres `.sl-footer`, its brand block, its columns, the eyebrow's flex axis and the social row. 560 and up is untouched — the left edge is what makes those read as columns. |
| Drawer showed the shared lockup on all three sites | `sites.config.js`, three new SVGs | `logoWhite` now points at per-site artwork: `sl_logo_{main,energy,electrical}_white.svg`, each generated from that site's `_blue` lockup with the navy wordmark set to white. The old `sl_logo_white.svg` (a different lockup, with a "Solar & Electrical" sub-line) is no longer referenced by the sites — `tools/doc-builder` still embeds its own base64 copy and is unaffected. |

Checks: `conformance` 25/25 pages, 0 fails, 0 warns at both viewports;
`sweep` 575 page/width combinations, 0 findings. `npm test` 83/84 —
the one failure is `tools/doc-builder/harness/api-test.mjs`, which opens a
hardcoded `/home/claude/docbuilder/examples/...` path. Pre-existing, in
untracked doc-builder work, unrelated.

**Deployed and verified.** All three Cloudflare Pages projects serve `6025061`
and later `15de0bf`. `sunlogic-electrical`'s first build failed and was retried
via the Pages API (`.../deployments/<id>/retry`) rather than by pushing an
empty commit — see below.

### The sweep is no longer a coin toss

`sunlogic-electrical` deployment `84926717` failed on this commit. Not the
change: `npm test` 70/70 and `conformance:electrical` 10/10 both passed, then
`sweep:electrical` died on `page.goto: Timeout 30000ms exceeded` navigating to
`blog-3-essential-checks.html` — a page this change does not touch, from a
static server on the builder's own loopback. The retry passed on the identical
commit.

Cause: `scripts/layout-sweep.js` ran six concurrent tabs, each decoding hero
photography, and `waitUntil: 'load'` waits for every one of those images. On a
build container that crosses Playwright's generic 30s default, and one
rejection failed all 575 combinations. Fixed in the same file:

- `NAV_TIMEOUT_MS = 60000` — a deadline chosen for this workload, not inherited
- three attempts on a fresh page, with backoff, before believing a timeout
- retries are **printed**, so a flake that becomes chronic is visible in the
  build log rather than silently absorbed
- an `aborted` flag, so once one combination gives up the other five workers
  stop instead of retrying into a closing browser
- the failure now names the page **and the width**, and the headline comes
  before the stack
- `SWEEP_CONCURRENCY` turns the pool down from the Pages dashboard with no
  code change, if a builder ever needs it

Verified by forcing `NAV_TIMEOUT_MS = 1`: 12 retry lines (six in-flight jobs x
two retries), then a single labelled failure and exit 1 — no screenful of
teardown noise. Full sweep back on 60s: 575 combinations, 0 findings.

`scripts/conformance.js` had the identical unguarded goto. It is sequential,
so it never had the six-way contention and never tripped — but "has not failed
yet" is not a property, so it was fixed in the same pass.

Both gates now load pages through **`scripts/page-load.js`**, which owns the
deadline, the attempts and the retry announcement. One place to tune, and the
two gates cannot drift apart.

**Only loading is retried.** Nothing that measures a page is. Measurement here
is deterministic — when conformance says a page never exposed
`window.SL_CHECK`, that is true and will be true three times, and wrapping it
in "failed 3 attempts" would turn a precise diagnosis into noise. A flaky load
is infrastructure; a failing measurement is a finding. `loadPage` therefore
returns the loaded page and the caller measures it outside the retry loop.

Verified by forcing the deadline to 1ms: sweep gives 12 retry lines (six
in-flight jobs x two retries), one labelled failure naming page **and width**,
exit 1; conformance gives exactly 2, labelled, exit 1. Restored and diffed
byte-identical. On the real deadline: conformance 25/25 pages, 0 fails /
0 warns at both viewports; sweep 575 combinations, 0 findings; `npm test`
unchanged at 83/84, the one failure still the untracked doc-builder harness
opening a hardcoded `/home/claude/` path.

---

## FIRST THING TOMORROW (2026-09-11)

**Confirm the daily digest arrives at 07:00 SAST.** Task 12 Step 4 of the lead
plan calls this "the acceptance test for the whole feature — if it does not
arrive, something is broken and everything else was theatre."

If it does not arrive:
- `cd workers/leads-relay && ../../node_modules/.bin/wrangler tail --env=""`
- The digest is the `0 5 * * *` cron in `wrangler.toml`, handled by
  `sendDailyDigest` in `src/index.js`. It POSTs to n8n, which renders it.
- The Workers Free plan caps cron triggers at five ACROSS the account. A
  deploy that exceeds it uploads the code and silently schedules nothing.

Also still open: **watch the first real lead end to end** (Step 3).

---

## Lead rotation went live 2026-09-10

Three commits, all deployed. Worker version `39910dc7` serving 100%.

| Commit | What |
|---|---|
| `1a71c39` | Removed `MAIL_REDIRECT_TO` from production; excluded our own submissions from the rotation |
| `7c023e1` | Auto-reply to internal test submissions |
| `b58c684` | Recorded the `sales@` decision |

**Test mode is off.** Real notifications now reach whichever director's turn it
is. The TEST MODE banner on every email and the digest's redirect notice were
both conditional on `MAIL_REDIRECT_TO` and disappeared with it. **Staging keeps
its own redirect deliberately** — that is the entire reason that environment
exists. Never set `MAIL_REDIRECT_TO` in production.

**Submissions from `@sunlogic.co.za` are stored but take no turn.** Partners
test the form, and three tests in a row would otherwise hand the next three
real leads to the same director while the 30-day split still looked even.
Nothing would error and nothing would log. The rule is `isInternalSubmission`
in `logic.mjs`, anchored at both ends so `notsunlogic.co.za`,
`evil-sunlogic.co.za` and `sunlogic.co.za.evil.com` all pass through: a false
positive means a real customer's enquiry reaches nobody, which is the worst
thing this system can do.

**`sales@` is not a recipient anywhere** and has not been since Task 9. It
stays as Reply-To on visitor-facing mail, deliberately: a customer replying to
their own estimate should reach the shared mailbox rather than one director.

---

## State: all three divisions are written

Apex, Energy and Electrical are all copy-reviewed, gated and live.

**Electrical, done 2026-09-10.** Three of its four main pages had belonged to
other divisions: the home page was the pre-split apex homepage with the H1
"Solar Power & Certified Electrical Contracting", the Smart page was the Energy
division's smart page selling geyser controllers, and the blog index led on
"what solar costs". All rewritten. The spine is Craig's unanswered first item:
electrical has no built-in motive the way solar does, so the argument is a
deadline somebody else sets — selling, claiming, a lease renewal, adding load,
something already broken.

Also: WhatsApp added to the dock on all three sites (Craig's item 10), and
`<dl-hero lights>` built as Electrical's answer to Energy's sunrise flare.

**Two visible placeholders ship deliberately on Electrical** — the proof
section and the smart capability list. Both are blocked on Craig and both are
in "Open" below.

---

## State: Energy is done

All 12 Energy pages are written, copy-reviewed, gated and pushed. **No visible
placeholder remains on any public Energy page.** Nothing is outstanding that
counts as a defect.

| Check | Result |
|---|---|
| `npm run build` | three sites |
| `npm run conformance` | 25/25 pages, both viewports, **0 fails** |
| `npm run sweep` | 550 page/width combinations, 0 findings |
| `npm test` | 70 passing |

**That gate failure is fixed.** It was `/electrical/electrical.html` mixing
heading cases in one grid; the heading is now "Lighting Pays Back Fastest".
**The gate is green across all 25 pages, both viewports, for the first time.**

---

## Shipped this session

| Commit | What |
|---|---|
| `d74fecf` | Smart Solutions smart-home pillar rewritten around energy management |
| `ffa043d` | All four Worth Knowing posts rewritten, every blog hero replaced |
| `47ae43b` | Preview server serves clean URLs like Cloudflare Pages |
| `49751c7` | Three copy chief reviews saved to `docs/copy/` |
| `e803211` | Rent-to-Own placeholders closed |
| `c9e6e63` | Smart switching priced (on quote, with the reason) |
| `3c917f4` | Privacy policy issued in Sunlogic SA (Pty) Ltd's name |
| `9012549` | Plentify claims corrected against their own pages |

### Two things that were wrong in public and now are not

1. **The Plentify product claims.** The last checkpoint flagged these on
   4 September and they were still live. Every claim on both cards is now
   checked against `plentify.io/non-solar-households` and
   `plentify.io/solar-households` (6 Sep 2026). HotBot does **not** learn a
   household's usage; Plentify's words are "Input your routine and we'll
   optimise your system to suit your needs". SolarBot does **not** read weather
   forecasts, load shedding schedules or household behaviour — none of the
   three appears anywhere on their site. All cut. What survives is theirs
   verbatim.
2. **Cancellation terms**, absent since the page was built because three
   sources disagreed. Found on both Plentify product pages and now quoted with
   a link: "Sign up for your subscription and cancel anytime. After 60 days a
   fee will be charged." **The subscription is Plentify's, not Sunlogic's**,
   so their term is quoted rather than restated. That sentence is genuinely
   ambiguous about whether the fee applies inside sixty days or after, and the
   page deliberately does not pick a reading.

### Corrected in the blog rewrite, worth not reintroducing

Both 2022 solar posts treated **a battery as the thing that makes a system
off-grid**. It is not: off-grid means no utility connection, and a hybrid
grid-tied system stores solar and rides through an outage while staying
connected. Two articles said otherwise and would have sent people to the wrong
quote. Also corrected: "230VA" (volt amps are not voltage), "high-voltage 230V"
(it is low voltage), "four to six hours of sunlight" (that is peak sun hours),
"15-20KW of power a day" (kW is a rate, kWh is a quantity), an unsourced "up to
20%" geyser figure, and a national panel-import figure of "nearly R2.2 million"
that is off by orders of magnitude.

### Archive policy, settled

Three of the four blog posts are 2022 press releases. They are **not**
republished under today's date and **not** rewritten under an unchanged 2022
date. `datePublished` stays 2022, each byline reads "25 August 2022, updated
6 September 2026", `dateModified` matches. **No words were invented for Craig
Lewis.** Quotes still true are verbatim and attributed to when they were said;
the one that had expired was removed rather than edited.

---

## Open, logged, not defects

Neither of these breaks anything and no page promises them. Recorded so they
are not lost, and so they are not raised again as though they were faults.

- **An SME proof job for the Energy home page.** All three cards under "Three
  Systems We Installed" are residential (a school is the closest to a
  business), while the page sells to SMEs. Needs one commercial job: a
  photograph, the suburb or business type, and what was fitted.
- **Saving figures on those three cards.** Currently they state what was
  fitted, which is what the heading promises, so nothing is missing against the
  page's own claim. Adding savings needs real per-job numbers. A "typical"
  figure would break the same sourcing rule enforced everywhere else.

## Open, needs someone other than Claude

- **Information Officer email.** `legal.html` on all three sites tells readers
  to address requests to the Information Officer "via the e-mail address
  mentioned below", and no address appears anywhere in it. POPIA expects that
  contact. Not invented.
- **CTA ground.** The closing CTA sits on `--surface-sunk`. The owner had
  asked for the alt tint; alt collides with an alt section on 11 pages and
  would recreate the same seam. One line plus 11 page edits if the preference
  stands.

---

## Still open on Electrical

The Electrical block is done. These are what survived it, each verified on
2026-09-10 rather than carried forward on trust.

**Blocked on Craig, and no writing fixes them:**
- **Three to five real electrical jobs** for the proof section on
  `site-electrical/index.html`: photograph, the problem, what was done, and the
  outcome. A mix of residential and commercial, at least one DB upgrade. The
  section is currently a visible labelled empty state, which keeps its slot so
  filling it is a copy job rather than a rebuild. Craig's own review calls this
  the highest-value item on his list and the thing every competitor is weakest
  on, and he is right.
- **The full smart capability list.** `energy-management.html` argues "the
  clever part is behind the wall" and can only name load control, sub-metering
  and charging. Craig's document flags this exact gap. Access control,
  intercoms and lighting control are listed there as room to grow into, not as
  current capability, so none of them is claimed.
- **`blog-ev-home-charging.html`** carries `[Hero photography pending: no
  EV/charger photography exists yet]`.
- **The subscription agreement** dates its Initial Term from a "Free Trial" it
  never defines, and says Sunlogic retains ownership of a device the product
  copy elsewhere describes as bought. Both are contract questions.

**One-line fixes: both done in `6491b9a`.** The Electrical privacy statement
now names Sunlogic SA (Pty) Ltd, so all three legal pages agree, and
`main/llms.txt` is clean. Every `llms.txt` on the estate is now free of em
dashes. The one left in each `robots.txt` is inside a `#` comment, which is the
same position taken for those in HTML and CSS comments.

**Fixed, so do not go looking:** the `/electrical/electrical.html` gate failure,
the "Three Recent Jobs" section carrying the Energy division's solar specs,
`electrical/llms.txt`'s em dashes, the Electrical privacy statement's entity
name, and `main/llms.txt`'s em dashes.

**Everything left on Electrical is blocked on Craig.** There is no one-line fix
outstanding.

---

## Standing rules learned or reconfirmed this session

- **Never assume a person's gender**, including in a case study about a
  customer. "This client" over "he".
- **Unresolved facts ship as visible bracketed placeholders**, never as
  plausible inventions and never silently dropped.
- **Do not hedge an unsourced claim.** Hedging keeps the risk and loses the
  force. Cut it.
- **A number inside an image is invisible to the gate.** The tips hero on
  `blog-five-tips-load-shedding.html` has "Savings: 22%" and a 72°F thermostat
  printed on it. The owner was told and chose to ship it.
- **`fetch()` normalises `/../x` before the request leaves the client**, so a
  path-traversal test written with `fetch` tests nothing. Use a raw
  `http.request`. Found by mutation-testing the guards.
- **Check what references a file before deleting it.** Deleting three
  superseded blog images broke five references across `thank-you.html` and
  `ci-guide.html`.
- **Prove a new gate rule by injecting a violation.** Every guard added to
  `static-server.js` was mutation-tested.

## Reference

- Copy reviews: `docs/copy/` (13 files, including `energy-blog-review.html`,
  `energy-smart-home-review.html`, `voltiq-tiers-review.html`)
- Never commit: `.claude/`, `Sunlogic_Feedback_Decisions.*`, `copy/Sunlogic_*`,
  `_incoming/`, `_shot.js`, `_audit.mjs`
- Preview: `node scripts/preview.js 8433`, then
  `http://127.0.0.1:8433/energy/` — clean URLs work, so the `.html` is optional
- Deploys: Cloudflare Pages watching `main`. There are **no GitHub Actions**;
  `.github/` was removed deliberately in `df52882`.
