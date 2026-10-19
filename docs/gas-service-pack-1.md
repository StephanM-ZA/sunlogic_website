# Gas on the energy site — part 1: the case, the position, the page map

**Compiled:** 15 October 2026 · **Updated:** 19 October 2026 · **Status:** working pack, not approved copy
**Part 2:** [`gas-service-pack-2.md`](gas-service-pack-2.md) — draft copy, FAQs, SEO, compliance guardrails
**Research behind it:** [`research/reports/SA gas installation market pack.md`](research/reports/SA%20gas%20installation%20market%20pack.md) (12,600 words, five researcher notes under `research/research_notes/`)
**Verification:** [`research/gas-verification-pass-2.md`](research/gas-verification-pass-2.md) — second pass, 19 October 2026. Six of seven targets closed, regulation 17 read in full, 19 patches, all applied

Read this part to decide *what* we sell and *where it lives*. Read part 2 to write it.

---

## Built — 19 October 2026

**`site-energy/gas.html` is written, built and passing.** Conformance: 0 fails, 0 warns at both
412x823 and 1440x900, and the same on the apex after the division-list change. The in-browser
check script reports all checks pass, with **no unresolved placeholders left on the page**.

**Direction change, on Stephan's instruction:** *"I don't want a gas vs discussion. I want a
residential and commercial gas page and solution."* So **the running-cost comparison is not on
the page and should not be added to it.** The page sells what gas is good at and what the job
involves, in three sectors mirroring `energy.html`:

| | Sector | Covers |
|---|---|---|
| 01 | At home | Hobs, instant hot water, fireplaces, braais, reticulation, cylinder sizing, conversions |
| 02 | For business | Restaurants, guesthouses, bakeries, laundries, bulk supply, the municipal stack |
| 03 | Servicing and certificates | The service as a test sheet, the CoC, property transfer, how a job runs |

The economics research in §2 below **stays in this pack as internal guidance**, because it is
what stops us making a running-cost claim we cannot defend. It is not page content.

**What shipped alongside it:** a `Gas` column entry in the energy site footer
(`sites.config.js`), `gas.html` in `site-energy/sitemap.xml`, and a Gas service entry in
`site-energy/llms.txt`. **Nav is unchanged** — see §5, which was written against a nav that has
since been renamed.

**Decided since:** the SAQCC registration number is **never published** — Stephan's
instruction, 19 October. The trust strip reads "SAQCC Gas registered practitioner" and carries
no number. Cross-sell blocks are **in** on `energy.html` and `index.html`, and gas is noted on
the apex in the Sunlogic Energy division's service list and in `site-main/llms.txt`.

**Still open on the page itself:** gas photography (`og:image` points at `energy-hero.webp`
meanwhile, because the build refuses a reference to an image the site does not ship), and the
nav question in §5.

---

## 0. The authorised person — **sorted, 19 October 2026**

Regulation 17(1)(c) of the Pressure Equipment Regulations, 2009 prohibits any person from
installing or removing a gas appliance, gas system or gas reticulation system unless that
person is an "authorised person". **Stephan confirmed this is handled on 19 October 2026**, so
the blocker on the rest of this pack is lifted.

**The registration number is never published** (Stephan, 19 October 2026). The research
argued for publishing it, on the basis that only two of seven competitors do and it is cheap
differentiation. That argument is noted and overruled; the page says "SAQCC Gas registered
practitioner" and carries no number. Nothing else in the pack depends on it.

One thing that still matters internally: the registration is **category-bound**. *"Registered
as competent within the scope of work"* is the regulation's own phrase, so a Domestic
registration does not cover a restaurant. The commercial section of the page is live, so the
category has to cover commercial work. And the SAQCC card is valid three years, so the claim
needs re-checking when it is renewed.

---

## 1. Why gas, in one paragraph

The Western Cape is **the most gas-penetrated province in South Africa — 46.0% of households
use LPG or gas, against 29.0% nationally** (Stats SA GHS). Gas as a primary cooking fuel rose
from 2.2% to 6.8% of South African households across the survey series. And the field serving
that demand is small and technically weak: of **seven Western Cape competitor sites read in
full in October 2026, not one sells a scheduled servicing product, not one publishes a
Certificate of Conformity price, five publish no SAQCC registration number, and not one frames
"one contractor, one certificate trail"** — which is a message this site is already half-way
into.

---

## 2. Internal only: the economics, and why they stay off the page

**None of this section goes on the website.** It is here so that nobody writing copy, answering
a lead or quoting a job makes a running-cost claim the numbers do not support. The page sells
flame control, hot water that does not run out, working through an outage, and a job that
passes. It does not sell a saving.

The industry sells gas as a savings product. At Cape Town prices it mostly is not one.
Here is the honest picture, and the page must carry it:

| | Verdict |
|---|---|
| Gas instant water heating vs a City of Cape Town **Domestic**-tariff element geyser | **Gas wins, roughly 25–40% per useful kWh** |
| Gas vs **Eskom Homelight 20A** or **CoCT Lifeline** | **Gas loses** |
| Gas vs **Eskom Homelight 60A** | Roughly a tie |
| Gas vs a **heat pump** | **Gas loses badly** — about half the running cost |
| Gas vs **solar water heating** | Gas loses |
| Gas **cooking** vs radiant electric | **Gas costs 17–27% more.** Against induction, 25–50% more |
| Electric hob → gas hob | **No energy payback at all** |

*(Percentages are the researcher's arithmetic on gazetted LPG prices and the Eskom 2026/27
tariff booklet. They rest on an unsourced LPG calorific value and unsourced appliance
efficiencies — see part 2, bucket C. The direction of each comparison is robust; the exact
figures are not publishable yet.)*

So the savings argument is narrow, conditional, and loses outright to the heat pump we could
also sell. What is left is stronger and almost nobody is using it:

**1. The certificate.** Regulation 17(3) requires a Certificate of Conformity on installation,
modification, alteration **or change of user or ownership**. Conveyancers enforce that last
trigger on every property transfer. It is the most reliable demand stream in the market, it
recurs forever, and it is the same handoff we already work for electrical CoCs.

**2. Price trajectory, not price level.** Coastal LPG went from **3,457 c/kg in January 2024 to
3,456 c/kg in October 2026 — a nominal change of −0.03% over 33 months.** Over the same window
electricity rose 12.74% (April 2025) and 8.76% (April 2026), **+22.6% compounded**, with
**8.83% already approved for 1 April 2027** after NERSA admitted a **R54.7 billion** error in
depreciation and the Regulatory Asset Base. That is a documented, named reason to expect more
above-inflation increases. It is a far better argument than any claim about outages.

**3. Performance, not cost.** Instant unlimited hot water. Flame control. Works when the power
is off. A professional kitchen's preference. These are why people actually want gas cooking,
and they are true.

**And the discipline that overrides all of it: do not write "load-shedding" in the present
tense.** South Africa passed **504 consecutive days without Eskom load-shedding** by early
October 2026, came through winter 2026 clear, and lifted EAF to 67.79%, the highest since 2020.
The honest resilience line is *"gas keeps working during a power outage"* — true for faults,
storms and planned municipal maintenance. It is not a load-shedding claim.

---

## 3. The position

> **One contractor. One certificate trail.**

Nobody in the research occupies it. Electrical CoC, PV GreenCard, plumbing/water CoC and gas
CoC are four separate statutory documents, a property transfer needs several of them, and not
one Western Cape competitor sells "we issue all of them". Thermoelectrics headlines
"compliance" without gas. Core Services Group splits gas, electrical, solar and leak detection
across sibling brands whose gas pages do not cross-sell. Gas Line Solutions asserts the bundle
and has an empty category icon behind it.

Meanwhile the "one team, electrical and solar" message is **already proven and widely used** in
this province — Cape Electrical & Solar Solutions, Powerhour Solar, Direct Energy Solutions,
Rescon Solar, Kenwin Electrical, Green Cape Energy, Herholdt's — and **none of them mentions
gas**. Adding gas extends a message this market already responds to rather than inventing one.

*Honest caveat for internal use:* that bundling converts **for gas specifically** is inferred
from the electrical-plus-solar precedent, not demonstrated.

### Three advantages that are structurally ours and not available to a gas-only installer

1. **There is electrical work inside every gas hob job.** SANS 10087-1 requires an isolator
   switch above hob level, prohibits a three-point plug for an electric oven under a gas hob,
   bars any electrical connection below the hob, and sets clearances between gas and electrical
   services. Gas-only installers subcontract this or do it informally. We do both trades.
   *(Clause numbers and the millimetre figures are bucket C — verify before publishing them.)*
2. **One visit, several certificates** on a property transfer.
3. **Honest comparative advice a gas-only installer structurally cannot give** — that a heat
   pump beats gas on running cost, that gas loses on Homelight 20A and Lifeline, that gas pairs
   more naturally with solar PV than with solar thermal. We can afford to say it because we
   sell the alternative too. That is a trust asset, and it is the most Sunlogic thing in this
   whole pack.

---

## 4. The offer: four products, not one

The market sells installation. These four are what the research says is actually available.

### 4.1 Installation — residential
The organising idea is **flue or no flue**, because that is where the standard draws its own
line. Hobs, stoves and sink water heaters in a ventilated kitchen are one kind of job;
multipoint and bath-size water heaters, showers and high-output space heaters must be flued to
outside air and are another. Vent-free heaters trigger a room-volume calculation, always need
permanent ventilation in a bedroom, and may not go in an enclosed bathroom.

Line items: gas hobs and cooktops · freestanding stoves and ovens · instant water heating,
internal and external · fireplaces and space heaters · built-in braais and patio heaters ·
whole-house reticulation · cylinder and changeover sizing · LPG conversion of
natural-gas-configured appliances.

### 4.2 Installation — commercial
Sell it as **risk management, not bigger appliances** — the research found commercial gas
presented as bigger appliances everywhere, and the City attributed a September 2022 Woodstock
eatery explosion to a by-law contravention. The decision tree a contractor can walk a client
through: indoor mass limit → supply moves outside → more than two cylinders means a manifold →
an individual vessel over 500 L leaves SANS 10087-1 for Part 3 → City of Cape Town Flammable
Substance Certificate and approved plans → the standard's own instruction that the local fire
department be consulted early.

Two things to get right before any commercial page goes out:
- **"Commercial gas work is done to SANS 10087-2" is false.** Part 2 is *mobile units* —
  caravans, motor homes, mobile kitchens. Commercial and industrial above 500 L individual
  water capacity is **Part 3**. The wrong claim is already circulating.
- **Do not present UK extraction-interlock rules (BS 6173, IGEM/UP/19) as South African law.**
  No SA requirement was found.

### 4.3 Servicing — the gap worth the most
**Zero of seven competitors sells a named maintenance plan, annual service or service contract.
Nobody publishes a servicing price.** We already sell O&M and monitoring on solar, so this is
the same muscle.

It has real content, which is what makes it sellable rather than a line item: staged pressure
testing (high, intermediate, low), a regulator performance check against numeric limits, pipe
sizing adequacy under full load, a corrosion-centred inspection, and consumables with hard
replacement ages — hoses and pigtails, hydrostatic relief valve, regulator.

And the Cape Town angle is sourced rather than invented: the standard permits a shorter
re-inspection interval where *"conditions demand"*, and its service checklist centres corrosion
throughout. **For a seafront or coastal property that is a real argument for a shorter interval
than the maximum.** Every number in this paragraph is bucket C.

### 4.4 Compliance — CoC and inspection, sold on its own
Nobody publishes a CoC price, a turnaround time, or a re-inspection reminder. An out-of-province
operator (Be Gasified, Pretoria) and a risk-management firm recruiting a Western Cape SAQCC
subcontractor are both already reaching into this gap. A clean rate card with a CoC-only price
and a service price would be a first in this market.

### 4.5 Two more that are vacant and cheap to own
- **Appliance warranty handling.** Not one of the seven sites explains what happens to the
  manufacturer's warranty, who registers it, or how a claim is handled after their install. It
  is exactly the question someone buying an expensive hob actually has.
- **Estates and bodies corporate.** No competitor markets reticulation to estates, bodies
  corporate or HOAs. We already work with bodies corporate on solar. *But the regulatory basis
  for a body corporate reselling gas is unverified — check before pitching it.*

---

## 5a. Settled, 19 October 2026: Energy is the parent, solar and gas sit under it

Stephan: *"gas should go under energy. so solar and gas."* So the information architecture is
**not** a fourth nav slot, and §5 below is superseded on that point.

- `energy.html` opens with a routing section, `#solar-and-gas`, immediately under the subnav:
  **"Energy Covers Solar and Gas"**, two cards, and a button through to `gas.html`.
- `Solar and gas` is the first item in that page's subnav.
- The "Also from Sunlogic" cross-sell that sat just above the closing CTA has been **removed** —
  one route per page, high up, beats two.
- Nav is unchanged at four: Home · Energy · Smart Solutions · Electrical. Gas is reached
  through Energy, which is what the instruction asks for.
- `energy.html`'s meta description now covers both trades. **Its `<title>` and hero are still
  solar-only** ("Solar Sized On What You Use", "Sized On What You Use, Not What You Fear").
  Those are client copy and were left alone — worth a decision, since the page is now the
  parent of two trades but still introduces itself as the solar page.

---

## 5. Where it lives on the site — and the one decision only you can make

> **Stale as written, 19 October 2026.** The energy site was renamed between 15 and 19 October:
> `solar.html` is now `energy.html`, and the nav is **Home · Energy · Smart Solutions ·
> Electrical** rather than Home · Solar · Electrical · Energy. The four-link cap is real and
> enforced — `shared/sunlogic-check.js` fails a nav with more than four, "because a fifth turns
> a route into a menu". So Gas can only enter the nav by displacing something, and **Smart
> Solutions is the one to displace**: Gas is a trade people search for by name, Smart Solutions
> is a product they discover once they are already on the site. Until that is decided, gas.html
> is reachable from the footer, the sitemap and llms.txt. Read the rest of this section with
> those name changes in mind.

`dl-nav-bar` is capped at **four links plus the CTA** by the system. The energy site currently
spends all four: Home · Solar · Electrical · Energy. Gas is a fourth trade with nowhere to go.

**Option A — Gas takes the fourth slot (recommended).**
Nav becomes Home · Solar · Electrical · **Gas**. `energy-management.html` moves to the footer
and keeps its inbound links from Solar and the blog. Rationale: Gas is a *trade* people search
for by name; Energy Management is a *product* they discover once they are already here. Trades
belong in nav.

**Option B — Gas stays out of nav.**
A new `gas.html` reachable from a section on `index.html`, the footer, and a cross-sell block on
`solar.html`. Respects the current nav exactly and costs nothing, but a trade with no nav entry
reads as a sideline.

**Option C — Section only, no page.** Not recommended. It forfeits the compliance and
appliance search clusters entirely, and those are the demand.

Either way the build is the same three things:

1. **`site-energy/gas.html`** — the money page. Map in §6.
2. **A section on `site-energy/index.html`** — the energy home currently says "Three Kinds of
   Property, Three Different Sums" and nothing about gas. One section, linking through.
3. **Footer column entry** in `sites.config.js` for the energy site, plus `sitemap.xml`,
   `robots.txt` and `llms.txt`.

**Already in place, no work needed:** `site-main/project-brief.html` carries a **Gas** job
category with its own branch (address, building type, proposed date, photos, comments), and
`job_category` is free text in the leads relay, so Gas submissions already land without a
migration. The brief even asks for photos of "the bottle or tank position, the appliances being
fed, and the route between them". The intake end of this is done.

---

## 6. Page map for `gas.html`

Section backgrounds alternate `page` → `alt` → `inverse` and never repeat in a row. One
`variant="emphasis"` button in view at a time, plus the closing CTA. Draft copy for every
section is in part 2.

| # | Component | `bg` | Working heading | Job of the section |
|---|---|---|---|---|
| 1 | `dl-hero` | — | "Only an Authorised Person \|May Touch It" | Name the law, name the certificate, book the visit |
| 2 | `.sl-trust` | — | — | Three provable items: SAQCC number, CoC on every job, three trades one contractor |
| 3 | `dl-section` | `page` | "The Certificate Is the Job, \|Not the Paperwork" | The legal frame, correctly stated. Owner's duty. The certificate covers the installation, not the appliance |
| 4 | `dl-section` | `alt` | "Flue or No Flue Decides \|Most of the Job" | Residential scope as cards + the cylinder-sizing explanation |
| 5 | `dl-section` | `page` | "Commercial Gas Is Risk Management, \|Not Bigger Appliances" | The decision tree, the municipal stack, restaurants |
| 6 | `dl-section` | `alt` | "Gas Wins on Hot Water. \|It Loses on Cooking." | The honest economics. Trajectory, not level |
| 7 | `dl-section` | `page` | "A Service Is a Test Sheet, \|Not a Look Around" | The servicing product nobody sells |
| 8 | `dl-section` | `alt` | "Four Certificates, \|One Site Visit" | Property transfer. The position, made concrete |
| 9 | `dl-section` | `inverse` | "How a Gas Job \|Actually Runs" | Five numbered steps, navy on the last one only |
| 10 | `dl-section` | `page` | "Questions We Get \|Before the Quote" | FAQ — and the arbiter play |
| 11 | `dl-cta` | — | "Find Out What Your Installation \|Would Actually Need" | Close |
| 12 | `dl-footer` | — | — | — |

Observed competitive band for a commercial service page in this niche is roughly
**1,300–2,500 words**; a cost pillar runs 3,000+. This map lands in the upper half of that
band, which is where it should be given the compliance content.

---

## 7. What this pack deliberately does not do

- **No price list.** All installer pricing found in the research is Gauteng-weighted; no Cape
  Town installer pricing was located. A rate card is a strong play *once we have our own
  numbers* — publish ours, not a competitor's.
- **No SANS distances, clearances, ventilation areas or bulk-tank figures.** Every one of them
  is verified only against the **superseded 2008 Edition 5** of SANS 10087-1. The current
  edition is **7.01, a 2026 revision** — one step further away than this pack originally
  assumed — and it is paywalled. Part 2 marks each insertion point. Publishing wrong clearance
  figures is a safety and liability problem, not an SEO one, and it is exactly what several
  competitors have already done. *(A second verification pass on 19 October 2026 corroborated
  five outdoor separation figures from a City of Cape Town drawing, but that drawing is from
  2016 and references the old SABS 087 set — corroboration, not clearance.)*
- **No Afrikaans page.** A targeted search for `"gasinstallasie" OR "gas installateur"
  Kaapstad` returned no Afrikaans gas installer pages at all. In a heavily Afrikaans province
  that reads as a genuine demand signal — Afrikaans speakers search in English for trades — not
  as a universal oversight. Use Afrikaans naturally inside Paarl, Stellenbosch and Durbanville
  copy if we build suburb pages, and revisit only if Search Console shows Afrikaans impressions.
- **No complaint claims about competitors.** Hellopeter's gas category shows **0 reviews and is
  unclaimed**; the review base is far too thin to evidence the usual patterns. Absence of
  complaints there is a data gap, not a clean record.

---

## 8. Decisions needed

| # | Decision | Why it blocks |
|---|---|---|
| 1 | ~~**Do we have, hire, or register an SAQCC Gas authorised person?**~~ | **Sorted 19 Oct 2026.** Still need the name, number and category for the placeholders. §0 |
| 2 | **Nav: Option A or B?** | Decides whether `energy-management.html` leaves the nav |
| 3 | **Which certificates can we actually issue in-house** — electrical CoC yes, gas CoC once §0 is solved, plumbing/water CoC needs a PIRB-registered plumber, PV GreenCard | §4.5 and the "Four Certificates" section are only writable once we know |
| 4 | **Do we publish a rate card?** | First in this market if yes. Needs our own Cape Town costings |
| 5 | **Residential, commercial, or both at launch?** | Commercial appliance specifics have **no South African source** — the compliance framing is credible, the equipment detail is not |
| 6 | **Do we buy SANS 10087-1:2026 (Ed. 7.01, R1,465.10) and Part 3:2015 (Ed. 5.00, R1,124.70)?** | **R2,589.80, and it is now the main thing standing between this pack and a live page.** Note the edition — it is not the "Edition 7 (2024)" the first research pass assumed. Part 2 §5.1 |

---

*Next: [`gas-service-pack-2.md`](gas-service-pack-2.md) — draft copy section by section, FAQs,
title/meta/schema, the four compliance buckets as a writer's table, and the verification list.*
