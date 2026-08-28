# Sunlogic SA — Website Build Brief

**Status:** Consolidated working brief · **Compiled:** 26 August 2026 · **Research refreshed:** 26 August 2026
**Supersedes:** `archive/architecture.md`, `archive/website_strat.md`, `archive/GEMINI.md`

---

## How to read this document

This is the single source of truth for the Sunlogic SA website rebuild. It merges the
November 2025 strategy and architecture documents into one deduplicated brief and adds
recommendations where the source material left gaps.

Two conventions are used throughout:

> **▶ RECOMMENDATION** — Added in this consolidation. Not from the original documents.
> These are proposals to react to, not decisions already made.

> **⚠ DECISION NEEDED** — A gap the original documents left open that only Sunlogic can fill.
> Every one of these is collected in §12 for convenience.

**Note on freshness:** §2.1 (market context) and §3 (competitors) were re-researched against
live sources on 26 August 2026. Two caveats carry through the whole document:

- **Review counts and star ratings could not be independently verified.** Google Maps and the
  social platforms block automated access, so those figures come from third-party aggregators or
  companies' own site widgets. Treat them as indicative. A manual Google Maps check of the top
  six competitors is worth 20 minutes before acting on them.
- **The refresh changed the conclusions, not just the data.** Load-shedding has effectively ended
  and the positioning recommendation in the previous version of this brief has been revised. See
  §2.1 and §2.2 — do not build from the November 2025 assumptions.

---

## 1. Objectives

The rebuild exists to do four things, in priority order:

1. **Generate qualified leads.** Move beyond a single "Get a Quote" button to a layered
   capture system with multiple entry points at different commitment levels.
2. **Establish credibility.** Make expertise, certifications and completed work visible and
   verifiable rather than asserted.
3. **Differentiate.** Give prospects a concrete reason to choose Sunlogic over the fifteen-plus
   credible competitors in the Western Cape.
4. **Support organic growth.** Build an SEO and content foundation that compounds.

### What is wrong with the current site

Assessed against www.sunlogic.co.za:

**Working:** The headline "Leaders in Solar and Electrical" communicates expertise immediately.
Both residential and commercial segments are addressed. "Get a Quote" is a clear, direct CTA.
Content emphasis on quality, reliability and expertise builds baseline trust.

**Not working:**

| Weakness | Consequence |
| :--- | :--- |
| Static design, no interactive elements | Low engagement, short sessions |
| Single conversion path ("Get a Quote") | Only captures prospects already ready to buy |
| No content programme | No organic search growth, no nurture path |
| Social proof thin or absent | Trust must be taken on faith |
| No stated differentiator | Prospect defaults to price or to whoever is most visible |
| No Google Business Profile found | Invisible where local prospects actually look |

The last two rows are the most damaging and are addressed in §2.2. Note also that this
assessment was written in November 2025, when load-shedding was still the industry's main sales
driver. It no longer is — see §2.1 before reusing any of this framing.

---

## 2. Market context and positioning

### 2.1 What changed in the South African market

*Researched 26 August 2026. This section is new — the source documents predate all of it.*

**Load-shedding has effectively ended, and with it the industry's main sales driver.**
South Africa passed **441 consecutive days without load-shedding** on 4 August 2026 (streak
running from 16 May 2025). Eskom's Energy Availability Factor reached 82.04% in July 2026, its
highest since 2017, with diesel usage down 85% year on year. Roughly 6.9% of customers still see
localised outages, but these come from illegal connections and infrastructure faults, not
systemic shortfall.

This is the single most important finding of the refresh. Every "keep your lights on" message
in the November 2025 material is now selling against a problem most customers no longer have.

**What replaces it as the buying motive:**

| Driver | Detail |
| :--- | :--- |
| **Tariff increases** | NERSA approved 8.76% for direct Eskom customers (from 1 Apr 2026) and 9.01% for municipal distributors (from 1 Jul 2026). Cape Town rates reported around R4.94/unit plus a ~R424 basic charge. |
| **Long-run cost control** | Solar is now an investment-return argument, not an insurance-against-blackouts argument. |
| **Business tax treatment** | Section 12B still allows a 100% first-year deduction for PV up to 1MW. |
| **Residual outage risk** | Real but secondary — backup, not headline. |

**Incentives — get these right or create a liability:**

- **Residential rebate is dead.** The 25%-of-panel-cost, R15,000-maximum individual rebate
  **expired 29 February 2024** and was not replaced. Any site claiming a current residential
  solar tax rebate is publishing something false.
- **Section 12B (business) is alive** — 100% first-year deduction, PV up to 1MW.
- **Section 12BA (the enhanced 125% allowance) expired 28 February 2025** and was not extended.
  A "125%" claim is now wrong. Competitors are likely still making it.

**City of Cape Town SSEG — a time-limited hook:**

- Feed-in tariff was **cut roughly 30%, from R2.24/kWh to R1.56/kWh** in 2026. Payback periods
  lengthen accordingly; quote honestly.
- Registration is **mandatory** — the City has treated all new solar and battery systems as
  grid-tied since October 2023 regardless of stated intent. Requires an NRS 097-2-1 approved
  inverter, single-line diagram, COC, and owner consent. Roughly 2–6 weeks via the City's portal.
  Unauthorised systems risk a R6,000+ fee, disconnection, and invalidated insurance.
- **Registration, connection and AMI meter-upgrade fees are waived until 30 September 2026.**
  That is a genuine, dated, expiring reason to act — the strongest CTA hook available right now,
  and it lands roughly five weeks from today.

**Compliance and sign-off:**

- A COC must be issued by a registered electrical contractor holding a valid Department of
  Employment & Labour wireman's licence (Single-Phase, Three-Phase, or Master Installation
  Electrician).
- Above certain sizes an **ECSA-registered engineer must also sign off**. Current working
  thresholds: ≤30kW COC alone; 30–350kW COC plus ECSA sign-off; 350kW–1MW COC plus Pr Eng.
  City of Cape Town brackets similarly: <13.8kVA electrician plus COC; 13.8–50kVA adds municipal
  sign-off; >50kVA requires an ECSA professional engineer.
- ⚠ These thresholds come from a 2024 AMEU/NRS interim recommendation and mid-2025 industry
  commentary, and were explicitly framed as interim pending new SANS guidance. **Verify against
  the current standard before publishing exact numbers on the site.**
- Relevant standards and bodies a customer may look for: SANS 10142-1 (latest edition
  SANS 10142-1:2026), NRS 097-2-1 and NRS 097-2-3, ECSA, DoEL, SAPVIA, PV GreenCard.

> **▶ RECOMMENDATION — Build a genuinely accurate compliance and incentives page.**
> The rules above are confusing, recently changed, and most competitor sites will carry stale
> claims (expired rebates, the 125% allowance, pre-cut feed-in rates). Being demonstrably correct
> here is a cheap, defensible trust advantage, it feeds the SEO cluster in §8, and it is the one
> piece of content that gets easier the more expert you actually are.

### 2.2 What the refresh did to the positioning recommendation

The previous version of this brief recommended leading with *"solar installed by electricians,
not salespeople"*. **That recommendation is materially weakened and should not be adopted as
stated.** Three findings undercut it:

1. **It is a legal requirement, not a differentiator.** Under South African law PV installations
   are ordinary electrical installations. It is illegal to install PV without being a registered
   electrical contractor, and only an IE or MIE can issue the COC. Every legitimately operating
   solar installer in the country already meets this bar. Claiming it as an advantage invites the
   response "so does everyone else" — or worse, implies the competition is operating illegally.
2. **The exact phrasing is already taken.** Fuesse Solar markets itself as "led by accomplished
   and accredited PV GreenCard Installers and qualified Electricians with 25 years' experience in
   the electrical and solar industries," and handles COC and SSEG processing. That is nearly
   word-for-word the recommended position. Line & Light Electrical brands as "Electrical and
   Solar Experts"; Imperial Power advertises compliance certificates alongside solar.
3. **The electrical side is already occupied.** W.G Dixon and Voltec both advertise solar plus
   COC today. Voltec's solar directory listing dates to January 2025 — before the original
   research — so this is an overlap the November baseline missed, not a new incursion.

> **▶ REVISED RECOMMENDATION — Keep the electrical competence, but make the claim about
> *evidence*, not *category*.**
>
> "We're electricians" is table stakes. What is not table stakes is proof, and the proof is
> specific and checkable:
>
> - **Named, numbered credentials.** The DoEL wireman's licence category and number, ECSA
>   registration where held, PV GreenCard status, years registered as an electrical contractor.
>   Almost nobody publishes these. Doing so is instantly verifiable and instantly differentiating.
> - **In-house versus subcontracted.** If the electrician who signs the COC is on staff rather
>   than a subcontractor, say so and explain why it matters — that is a real operational
>   difference behind the same legal baseline.
> - **COC turnaround time, stated as a number.** "COC issued within X days of commissioning,
>   or we handle the SSEG registration free" is a promise competitors making the same generic
>   claim cannot match without changing how they operate.
> - **SSEG registration handled end to end.** Mandatory, confusing, ~2–6 weeks, and currently
>   free to register until 30 September 2026. Owning this administrative burden is a concrete
>   service, not a slogan.
>
> The shape of the claim moves from *"we are a category of installer"* to *"here is the number,
> go check it."* That survives a competitor copying the sentence.

> **⚠ DECISION NEEDED — Is Sunlogic a B2C installer, a B2B distributor, or both?**
> This was not visible in the source documents and it changes the entire site. The live site
> carries a `/renewable-energy/` page positioning Sunlogic as a **supplier and distributor** of
> panels, hybrid inverters and battery packs with "Featured Brands" and "Featured Products"
> sections, a `/distribution/` page, and a **`/register/` "Register as an Installer"** page
> implying an installer-network arm. The brief as written assumes a pure B2C installer. If both
> lines are real, they need clearly separated paths — arguably separate sections or subdomains —
> because a homeowner and a prospective trade installer want opposite things from the homepage.
> **Nothing else in the architecture can be finalised until this is settled.**

> **⚠ DECISION NEEDED — The 3-month workmanship guarantee.**
> The site's `/policy-terms-warranty/` page states a **3-month workmanship guarantee**. Competitor
> messaging in this market runs to 3 years (Winelands) and 10 years (First Energy). Three months
> is short enough that publishing it prominently would cost sales, and short enough that hiding it
> is worse. Either extend it to something defensible or be prepared for it to be found.

> **⚠ DECISION NEEDED — Sunlogic has no discoverable Google Business Profile.**
> Extensive searching found no ratings-bearing Google Business Profile for the business — the
> Procompare listing is unclaimed with zero reviews. Competitors sit on review counts in the tens
> to low hundreds. This is not a website problem and the rebuild will not fix it. It is the
> highest-return action available and it can start today, independently of everything else here.

> **▶ RECOMMENDATION — Positioning angles deliberately NOT recommended:** cheapest price (a race
> to the bottom, and the subscription players own affordability); fastest installation (Winelands
> owns one-day installs); biggest projects (SOLA and NSE own the utility and C&I tier);
> load-shedding protection (the problem has receded — see §2.1).

> **⚠ DECISION NEEDED — Supporting proof points.** Still outstanding, and now more urgent because
> the credential-led positioning above depends entirely on them: year founded · installations
> completed · total kWp installed · workmanship warranty period · DoEL licence category and number
> · ECSA registration if held · PV GreenCard status · service areas covered.

---

## 3. Competitive landscape

**Refreshed 26 August 2026.** Sixteen Western Cape competitors originally researched November 2025,
re-verified against live sites this month, plus new entrants found during the refresh.

> **⚠ IMPORTANT DATA CAVEAT — review counts could not be independently verified.**
> Google Maps, Facebook, Instagram and LinkedIn all block automated access. Every rating below
> comes from a third-party aggregator or the company's own website widget, and in several cases
> two aggregators disagree. **Treat all star ratings and review counts as indicative only.**
> Checking the top six competitors manually on Google Maps is a 20-minute job and worth doing
> before any of this informs a real decision.

### 3.1 Direct competitors — residential and light commercial solar

| Competitor | Site status (Aug 2026) | Rating (indicative) | Positioning today | Notable |
| :--- | :--- | :--- | :--- | :--- |
| **Treetops Solar** | Live, unchanged, content-rich | ~4.9★, count grown from 90+ to possibly 100+ | Turnkey; leans on Tesla and SolarEdge service awards | Tesla Powerwall certified. **Residential financing explicitly NOT available** — stated as "actively pursuing". Their `/reviews/` page currently returns a 502 error. |
| **Winelands Solar** | Live, actively maintained (blog post May 2026, "2020–2026" footer) | Unverifiable — no source found | Loadshedding independence, up to 70% savings, 1-day installation | **Warranty language changed: now a 3-year workmanship guarantee, not the 10-year cited in the baseline.** Added Instagram and ooba Solar financing. Marketing a 10th anniversary in 2026. |
| **First Energy** | Live, professional (though footer copyright still reads 2019) | Unverifiable | Engineering-led credibility via MAC Engineers and BravoScan partnerships | **The biggest single competitive shift found.** Five tiered rent-to-own packages (R69k–R268k, 3/4/5-year terms), bank financing via Standard Bank and Nedbank, 10-year warranty, BYD batteries, EV charging, HVAC cross-sell. Solar Savings Report still running, now free. |
| **SomeWatt Solar** | Live, Muizenberg-based | ~4.8★, possibly 40–50 reviews | Affordability and environmental framing | Extensive brand roster. Possible new EV charging page (title only, unconfirmed). More socially discoverable than baseline — Facebook and YouTube found. |
| **Lunar Solar** | Live, 2026 footer | ~4.7–4.8★, possibly ~150 reviews | Family-led (Francois and Charina Joubert), bespoke solutions | Solar Compliance service confirmed still running. **New since baseline:** e-mobility and home automation service lines, ooba financing, Sigenergy and Sungrow partnerships. Now active on Facebook (June 2026 Decorex post) — baseline said undiscoverable. |
| **Versofy** | **Rebranded — versofy.com now redirects to versofy.energy** | Unverifiable. Hellopeter TrustIndex 4/10 vs GoSolr's 6.7; a visible complaint thread exists | "Solar as a Service" subscription | Published tiers: R1,799 to R4,199/month incl. VAT. Live promo to 30 Sep 2026 (2 extra panels plus an air fryer). Versofy HOME app still live. No funding or expansion news found. |
| **CapeTown.Solar** | Live, now with a full e-commerce shop | Unverifiable | "Domestic & Commercial Solar Specialist" | Expanded well beyond the "simple" baseline. Added SolarBot/HotBot smart energy devices with a **quarterly maintenance subscription** — a recurring-revenue play. No financing or EV. Panel cleaning still offered. |
| **Max Yield Energy** | Live, unchanged | Unverifiable | 5-step consultative process, 9+ years | **No material change.** Pure upfront-purchase model, no financing or subscription. Now publishes price bands: residential off-grid R105k–R175k, commercial R480k–R4.25M. |
| **AWPower** | Live, unchanged character | Unverifiable | Engineering-led, est. 2015 | Water engineering, EV charging, SANTAM-approved all confirmed. Nedbank and ooba financing — pre-existing since 2022–23, simply missed in the baseline. No subscription offering. |

**New names surfaced during the refresh** (not in the original sixteen, worth watching):

- **GoSolr** — Motsepe-backed, ~R10bn national expansion announced 2024, subscription model,
  active in Cape Town. Materially better capitalised than Versofy. Predates the baseline but was
  missed by it, and is the most serious structural threat in the market.
- **Fuesse Solar** — markets almost exactly the electrician-plus-COC position this brief
  previously recommended. See §2.2.
- **Wetility, SunSwitch, Hohm Energy** — national rental/PPA models; Western Cape depth unverified.
- **Line & Light Electrical**, **Cape Electrical**, **R&R Solar and Electrical** — further
  electrician-plus-solar combination businesses in the Western Cape.

### 3.2 Electrical contractors

| Competitor | Site status | Rating (indicative) | Notable |
| :--- | :--- | :--- | :--- |
| **W.G Dixon** | Live, Elementor-built, well maintained | 4.8★ / 114 reviews — identical to baseline, so possibly a static widget rather than a live figure | Now claims "in excess of 74 years". **Advertises inverter and solar installation, and explains that solar installs require a COC** — already running a version of the electrician-led position. Facebook and Instagram now linked on-site. |
| **Voltec Electrical** | Live, **apparently redesigned** — now reads as modern and professional rather than "simple" | ~4.6★ (Procompare, low confidence) | **Markets solar installation plus COC for residential, commercial and industrial**, plus infrared thermal imaging. Solar directory listing dates to Jan 2025, so this predates the original research. |
| **Brackenfell Electrical** | Live but could not be fetched this pass | ~3.5★ (Procompare, unclaimed listing, low confidence) | No evidence of a move into solar. Details unverified this cycle. |
| **Absol Technologies** | Live | None found, matching baseline | Page title still says "Solar Sys, CCTV, Networks" but on-page copy emphasises CCTV, DSTV, networking and security — solar may be a stale meta tag. Claims 10+ years. |

### 3.3 Commercial & industrial — context only

| Competitor | Status | Notable |
| :--- | :--- | :--- |
| **SOLA Group** | Live, momentum clearly upward | ~600MW private wheeling, 275MW operational. New since baseline: financial close on the 300MW Naos-1 hybrid solar-plus-battery project (Feb 2026), and a Sasol/Air Liquide hybrid project. Clients include Amazon and Tronox. |
| **New Southern Energy** | Live, **now presenting as "NSE Africa" at nse.africa** | Legal entity still New Southern Energy (Pty) Ltd per D&B. Turnkey 1–20MW, solar, storage, private networks, wheeling. Rebrand status unconfirmed. |
| **Imperial Power** | Live | **Self-describes as an electrical contractor first**, with solar, BESS, generators and home automation as service lines, and states it assists with compliance certificates — the same soft pitch again. Clients: Okja, Vida e Caffe, 2U, Ninety One, Luno, DigiOutsource. Still no reviews, no social. |

### 3.4 What the landscape implies

- **Financing and subscription have gone from differentiator to expectation.** In November 2025
  three competitors offered financing. Today: First Energy has five rent-to-own tiers with two
  named banks; Winelands, Lunar and AWPower all carry ooba Solar; Versofy and GoSolr run full
  subscription models. Treetops explicitly does *not* offer residential financing and flags it as
  a gap they are working on. **⚠ Not offering a financing route is now a visible disadvantage.**
- **Recurring revenue is the emerging pattern.** Subscriptions (Versofy, GoSolr), maintenance
  plans (CapeTown.Solar's quarterly SolarBot service), monitoring. The market is drifting from
  one-off installation sales toward ongoing relationships.
- **Adjacent service lines are expanding fast.** EV charging (First Energy, AWPower, Lunar,
  possibly SomeWatt), home automation (Lunar, Imperial), heat pumps and HVAC (First Energy),
  water engineering (AWPower). Pure-play solar installation is narrowing as a category.
- **Google reviews remain the battleground** — and Sunlogic is not on the field at all (§2.2).
  Competitors run from roughly 24 to 159 reviews. This gap is not closable at launch and the
  work should start immediately, in parallel with the build.
- **Social media is no longer as weak as the baseline claimed.** Several competitors previously
  described as undiscoverable (Lunar, SomeWatt, W.G Dixon, Absol) have findable and in some cases
  demonstrably active accounts. The easy opening the November analysis identified has narrowed.
- **The electrician-plus-solar space is populated**, not vacant. See §2.2.

> **⚠ DECISION NEEDED — Does Sunlogic offer, or intend to offer, a financing route?**
> Escalated from "worth considering" in the previous version to a competitive necessity. At
> minimum an ooba Solar referral link — used by three competitors and trivial to add. If the
> answer is no, the quote page needs to handle the objection explicitly.

---

## 4. Site map

```
sunlogic.co.za/
│
├── Home (/)
│
├── Services (/services/)
│   ├── Residential Solar (/services/residential-solar/)
│   ├── Electrical Contracting (/services/electrical-contracting/)   ◀ moved up — see §2
│   ├── Commercial Solar (/services/commercial-solar/)
│   └── Solar Maintenance (/services/solar-maintenance/)
│
├── Projects (/projects/)
│   ├── Residential Projects (/projects/residential/)
│   ├── Commercial Projects (/projects/commercial/)
│   └── [Individual project pages] (/projects/[slug]/)
│
├── Resources (/resources/)
│   ├── Blog (/blog/)
│   │   └── [Blog posts] (/blog/[slug]/)
│   ├── Solar Calculator (/resources/solar-calculator/)
│   ├── FAQs (/resources/faqs/)
│   └── Guides & Downloads (/resources/guides/)
│
├── About Us (/about/)
│   ├── Our Story (/about/our-story/)
│   ├── Our Team (/about/team/)
│   └── Certifications (/about/certifications/)
│
├── Contact (/contact/)
├── Get a Quote (/get-a-quote/)
│
└── Legal
    ├── Privacy Policy (/privacy-policy/)
    └── Terms & Conditions (/terms-conditions/)
```

### 4.1 Primary navigation

```
[Logo]  Home | Services ▾ | Projects | Resources ▾ | About ▾ | Contact | [Get a Quote]
```

**Services ▾** Residential Solar · Electrical Contracting · Commercial Solar · Solar Maintenance
**Resources ▾** Blog · Solar Calculator · FAQs · Guides & Downloads
**About ▾** Our Story · Our Team · Certifications

The header is sticky, with the "Get a Quote" button styled as the sole high-contrast element.

### 4.2 Footer

| Column 1 — Services | Column 2 — Company | Column 3 — Resources | Column 4 — Contact |
| :--- | :--- | :--- | :--- |
| All service links | About Us | FAQs | Phone |
| | Projects | Solar Calculator | Email |
| | Blog | Guides & Downloads | Address |
| | Contact | Privacy Policy | Social icons |
| | | Terms & Conditions | Business hours |

> **▶ RECOMMENDATION** — Add certification logos and registration numbers as a full-width strip
> immediately above the footer columns, sitewide. If compliance is the positioning, the proof
> should be on every page rather than buried on /about/certifications/.

---

## 5. Page specifications

### 5.1 Homepage

**Purpose:** convert visitors into leads, establish credibility, route users to relevant content.
**Template:** custom front page.

1. **Hero** — background image or video of a real Sunlogic installation (not stock).
   H1: "Leaders in Solar and Electrical". Subheading carrying the value proposition
   (e.g. "Powering Western Cape homes and businesses since ____").
   Primary CTA "Get Your Free Solar Assessment"; secondary CTA "View Our Projects".
   Trust badges inline.
2. **Services overview** — four-column grid, icon + title + short description + "Learn More".
3. **Why Choose Sunlogic** — three to four differentiators with icons.
   ⚠ Requires the §2 decision and the supporting numbers before it can be written.
4. **Featured projects** — three to four project cards showing type, location, system size;
   link through to the full portfolio.
5. **Social proof** — testimonial carousel, Google Reviews rating and count, commercial client
   logos where permitted.
6. **Lead magnet** — solar-themed band offering *The Western Cape Homeowner's Guide to Solar*,
   with email capture.
7. **Blog preview** — three latest posts with title, excerpt and featured image; "View All Posts".
8. **Final CTA** — "Ready to Go Solar?" with an inline form or quote button, phone number
   displayed prominently.

> **▶ RECOMMENDATION** — Insert an eighth section between 5 and 6: a short compliance, COC and
> SSEG-registration explainer linking to the electrical service page and the compliance content
> in §2.1. It makes the revised positioning concrete and addresses a real buyer anxiety. Note the
> refresh found Lunar Solar, Fuesse Solar, Imperial Power, W.G Dixon and Voltec all touching this
> ground — the differentiator is accuracy and specifics, not the topic itself.

> **▶ RECOMMENDATION — Rewrite the hero around cost, not blackouts.** Any "keep the lights on"
> framing is now selling against a problem most customers no longer have (§2.1). The live hooks
> are the 8.76–9.01% tariff increases, long-run cost control, and — until 30 September 2026 —
> the City of Cape Town's waived SSEG registration and meter-upgrade fees. That last one is a
> dated, expiring, genuinely useful reason to act now, and it is the strongest CTA available.
> It also expires roughly five weeks from this brief's date, so either use it immediately or
> plan the hero without it.

> **⚠ DECISION NEEDED — Is the H1 staying as "Leaders in Solar and Electrical"?** It is
> serviceable but claims leadership without evidence. The §2.2 revision points toward a headline
> built on a checkable fact rather than a category claim — a licence number, a years-registered
> figure, or a COC turnaround promise — but the wording cannot be settled until decision items
> 1, 3 and 4 in §12 are answered.

### 5.2 Service page template

**Purpose:** educate, build trust, convert. **Template:** custom service single.

1. **Hero banner** — service-specific image, H1, intro paragraph, CTA "Get a Free Quote".
2. **Service overview** — 300–500 words, bulleted benefits, two-column layout with image.
3. **Our process** — numbered timeline, four to six steps, icon per step.
4. **Products & technology** — brand logos, product highlights, collapsible technical specs.
5. **Related projects** — four to six thumbnails, filterable, link to full portfolio.
6. **FAQs** — five to eight service-specific questions in an accordion, with FAQ schema markup.
7. **Testimonials** — two or three specific to this service, with name, location, project type.
8. **CTA** — "Ready for [service]?" with an inline quote form.

> **▶ RECOMMENDATION** — Add an indicative price range or a "typical project from R___" band to
> each service page. SomeWatt and First Energy both build trust through transparency, and
> price-anxious visitors who bounce for lack of any number are the largest silent loss on a
> site like this. A range with clear caveats qualifies leads before they reach the form.

### 5.3 Projects / portfolio

**Archive template:** filter bar (residential / commercial / electrical; system size; location)
over a masonry or uniform grid, with hover detail and quick view.

**Single project template:** hero image gallery, details sidebar (location, system size,
installation date, products used), project description, before/after where applicable, client
testimonial, related projects.

> **▶ RECOMMENDATION** — Add two fields to every project: **the problem solved** and **the
> outcome in rands or kWh**. "8kW system, Durbanville" is a specification; "cut a R4,200 monthly
> bill to R680, with the system paying for itself in year six against the 2026 tariff increases"
> is a sales argument. Frame outcomes as cost, not as blackout survival (§2.1). This is also what
> makes projects rank in search and worth sharing.

### 5.4 Blog

**Categories:** Solar Energy Basics · Residential Solar · Commercial Solar ·
Electrical Safety & Compliance · Industry News · Case Studies · Tips & Guides.

**Single post template:** featured image; title, date, category, reading time; content; author
bio; related posts; sticky CTA sidebar with quote button and lead magnet; social share buttons;
comments optional.

### 5.5 About section

- **Our Story** — company history timeline, mission and values, why we do this.
- **Our Team** — grid with photos, name, role, short bio, per-person certifications.
- **Certifications** — full accreditation list with logos and, for each, what it means for
  the customer in plain language.

### 5.6 Contact

Contact form (name, email, phone, service interest, message) · direct phone, email and address ·
business hours · Google Maps embed · social links.

### 5.7 Get a Quote — primary conversion page

**Fields:** Name\* · Email\* · Phone\* · Service type (dropdown) · Property type
(residential/commercial) · Estimated monthly electricity bill (range) · Preferred contact method ·
Additional notes.

**Supporting elements:** a "what happens next" explanation, a response-time commitment, a phone
number for immediate contact, and a privacy assurance.

> **▶ RECOMMENDATION** — Build this as a multi-step form (three steps: what you need → your
> property → your details), asking for contact details last. Multi-step forms consistently
> outperform single long forms, and the monthly-bill range is the field that separates a hot
> lead from a browser — it should be step two, before the visitor has committed anything personal.

> **⚠ DECISION NEEDED — What is the response-time commitment?** "We respond within one business
> day" is only worth publishing if operations can hold it.

---

## 6. Lead generation

### 6.1 Lead magnets

1. **Free solar assessment** — the primary offer, carried throughout the site, with a detailed
   form on a dedicated landing page.
2. **Downloadable guides**, gated behind email capture:
   - *The Homeowner's Guide to Solar Energy in the Western Cape*
   - *The Business Owner's Guide to Commercial Solar*
   - *Understanding Electrical Compliance (COCs)*
3. **Solar savings calculator** — interactive, with an "email me my results" option that
   captures the lead at the point of highest intent.

> **▶ RECOMMENDATION — Build the calculator in Phase 1, not Phase 3.** The original plan defers
> it to "ongoing". It is the highest-intent capture point on the site, First Energy already
> competes with a Solar Savings Report, and it produces a lead qualified by their own numbers.
> Everything else in Phase 3 can wait; this cannot.

### 6.2 CTA placement

| Location | CTA type | Priority |
| :--- | :--- | :--- |
| Header (sticky) | "Get a Quote" button | High |
| Hero sections | Primary action button | High |
| Service pages | Inline form | High |
| Floating button (mobile) | Phone / WhatsApp | High |
| Blog sidebar | Lead magnet | Medium |
| Footer | Contact info + button | Medium |
| Exit-intent popup | Special offer | Medium |

### 6.3 Form strategy

- **Short** (3–4 fields) — initial contact, newsletter
- **Medium** (5–7 fields) — quote requests
- **Long** (8+ fields) — detailed assessments
- Use multi-step forms wherever the field count exceeds four.

### 6.4 Social proof

- **Testimonials** — prominent on the homepage and every service page; mix text, image and video.
- **Case studies** — challenge, solution, result, with high-quality images.
- **Certifications** — logos displayed sitewide (see §4.2).

> **▶ RECOMMENDATION — Google reviews are step zero, and the first step is claiming a profile.**
> The refresh found **no discoverable Google Business Profile for Sunlogic at all** (§2.2) — the
> only listing found was an unclaimed Procompare entry with zero reviews. Competitors run from
> roughly 24 to 159 reviews. Before any review-generation tactic can work there has to be
> somewhere for reviews to land, so: claim and verify the profile this week, add one per service
> area (§12 #8), then run the mechanism — a post-installation WhatsApp or SMS with a direct
> review link, sent by the installer while goodwill is highest. Target 25 reviews before launch
> and 50 within six months. **This is the single highest-return action in this document and it
> does not depend on the website at all.**

---

## 7. Content strategy

**Cadence:** one post per week, each optimised for a target keyword and linking to a relevant
service page.

**Opening set:**

- The Ultimate Guide to Going Solar in the Western Cape
- How to Choose the Right Solar Installer for Your Home
- The Benefits of Solar Energy for Businesses
- Understanding Electrical Compliance Certificates (COCs)
- Case studies of Sunlogic installations

> **▶ RECOMMENDATION** — Weight the opening set toward compliance and installer-selection topics.
> "How to choose an installer" and "what a COC actually covers" are searched by people who are
> already buying and are still deciding who from — and both let Sunlogic's positioning answer the
> question honestly. Generic "benefits of solar" content attracts traffic that is months from a
> decision and is already well covered by competitors.

> **⚠ DECISION NEEDED — Who writes the weekly post?** One post per week is roughly 3–4 hours of
> someone's time, indefinitely. If there is no owner, plan for a fortnightly cadence rather than
> letting a weekly commitment fail publicly.

---

## 8. SEO architecture

**URLs:** clean, keyword-rich, logically hierarchical, no dates in blog URLs.

| Page | Primary keywords |
| :--- | :--- |
| Home | solar installers western cape · sunlogic |
| Residential Solar | residential solar installation cape town |
| Commercial Solar | commercial solar panels western cape |
| Electrical Contracting | electrical contractor cape town |
| Blog | long-tail, per post |

**Internal linking:** service pages → related projects; blog posts → relevant services;
projects → back to services; breadcrumbs sitewide.

> **▶ RECOMMENDATION** — Add compliance-intent keywords as a distinct cluster:
> *electrical certificate of compliance cape town*, *solar COC western cape*,
> *solar installation compliance*, *SSEG registration cape town*, *NRS 097-2-1 approved inverter*,
> *section 12B solar deduction*. Lower volume, far higher intent, and much thinner competition
> than "solar installers cape town" — where Treetops, Versofy and CapeTown.Solar are entrenched.
> Also register and verify a Google Business Profile per service area if Sunlogic operates
> across more than one; local pack visibility will outperform organic ranking for these terms.

---

## 9. Technical implementation

### 9.1 Platform

**Theme:** Astra Pro or GeneratePress Premium, built with Elementor Pro or Beaver Builder.
Flexible, maintainable, good performance.

*(Alternative considered: a purpose-built solar theme such as Flavor or Industrial — faster to
stand up, but harder to customise and to maintain long-term. The page-builder route is the
recommendation.)*

### 9.2 Plugins

| Category | Plugin | Purpose |
| :--- | :--- | :--- |
| SEO | Yoast SEO or RankMath | On-page optimisation |
| Forms | WPForms or Gravity Forms | Lead capture |
| Performance | WP Rocket | Speed optimisation |
| Security | Wordfence | Security hardening |
| Backup | UpdraftPlus | Automated backups |
| Analytics | MonsterInsights | GA4 integration |
| Schema | Schema Pro | Rich snippets |
| Reviews | WP Business Reviews | Google Reviews display |
| Gallery | Envira Gallery | Project portfolios |
| Calculator | Cost Calculator Builder | Solar savings calculator |

> **▶ RECOMMENDATION** — Gravity Forms over WPForms if the multi-step quote form in §5.7 is
> adopted; its conditional logic and multi-step handling are materially better and it integrates
> with more CRMs. RankMath over Yoast — the free tier covers schema that Yoast paywalls.

### 9.3 Custom post types

| CPT | Taxonomies | Custom fields |
| :--- | :--- | :--- |
| **Projects** | Project type, location, system size | Technical specs, client name, testimonial, problem solved, outcome |
| **Testimonials** | — | Client name, location, service type, rating, quote |
| **Team Members** | — | Name, role, bio, certifications, photo |

### 9.4 Hosting and infrastructure

Managed WordPress hosting (WP Engine, Cloudways or a comparable SA-based host) · HTTPS ·
CloudFlare or similar CDN · page and browser caching · WebP images with lazy loading ·
regular database optimisation · PHP 8.0+ · daily automated backups · uptime monitoring
against a 99.9% target.

> **▶ RECOMMENDATION** — Choose a host with a South African or at minimum a European edge
> presence. The audience is entirely Western Cape; a US-origin server adds latency that no
> amount of caching fully removes, and page speed is both a ranking factor and a mobile
> conversion factor here.

### 9.5 Mobile

Mobile-first design · sticky header with hamburger menu · prominent click-to-call ·
WhatsApp integration · simplified forms · touch-friendly galleries and sliders ·
sub-3-second load target.

> **▶ RECOMMENDATION** — Treat WhatsApp as a first-class conversion channel, not an add-on.
> In the South African market it will likely outperform the contact form for residential
> enquiries. Give it a persistent floating button on mobile and track taps as a conversion
> event alongside form submissions.

---

## 10. Measurement

**Goals to track:** quote form submissions · phone clicks · email clicks · guide downloads ·
calculator completions · contact form submissions · WhatsApp taps.

**Implementation:** GA4 events via Google Tag Manager · Meta Pixel if running paid ads ·
form submission tracking · heatmaps via Hotjar or Microsoft Clarity (Clarity is free and
sufficient).

> **▶ RECOMMENDATION** — Define what a "hot" lead means numerically before launch, then report
> against that rather than against total form fills. A workable definition given the fields in
> §5.7: monthly electricity bill above R2,000, property type captured, and contactable by phone.
> Without this the analytics will measure traffic rather than business.

---

## 11. Roadmap

### Phase 1 — Launch

Homepage · all four service pages · Contact · Get a Quote · About (main page) ·
5–10 projects · **solar savings calculator** (moved up from Phase 3) ·
**compliance and incentives page** (§2.1 — accuracy here is a cheap trust advantage) ·
tracking and analytics configured.

> **▶ RECOMMENDATION — Two things should not wait for Phase 1.** Claiming the Google Business
> Profile (§12 #2) and starting review collection have nothing to do with the build and a long
> lead time. And if the City of Cape Town SSEG fee waiver is to be used as a campaign hook, it
> ends 30 September 2026 — well before any realistic launch date, so treat it as a reason to run
> something on the current site now rather than as launch content.

### Phase 2 — Months 1–2

Team page · Certifications page · FAQs · first five blog posts · additional projects ·
first downloadable guide.

### Phase 3 — Ongoing

Weekly (or fortnightly) blog posts · monthly project additions · remaining guides ·
continuous testimonial and review collection.

**Running in parallel from day one:** Google review generation (see §6.4). It is the longest
lead-time item and is not dependent on the website.

### 11.1 Indicative budget

> **▶ RECOMMENDATION — Rough order-of-magnitude only.** No budget appeared in the source
> documents. These are planning estimates in ZAR to react to, not quotes, and they exclude VAT.
> Get three actual quotes before committing.

| Item | DIY / in-house | Freelancer | Agency |
| :--- | :--- | :--- | :--- |
| Design & build | — | R25,000 – R60,000 | R60,000 – R150,000 |
| Premium theme + plugin licences (yr 1) | R8,000 – R15,000 | included or billed | included |
| Photography (real installations & team) | R5,000 – R15,000 | R5,000 – R15,000 | R5,000 – R15,000 |
| Copywriting (9 pages + 5 posts) | — | R12,000 – R30,000 | included |
| Managed hosting (annual) | R3,000 – R12,000 | R3,000 – R12,000 | R3,000 – R12,000 |
| **Indicative first-year total** | **R16,000 – R42,000** | **R45,000 – R117,000** | **R68,000 – R177,000** |
| Ongoing content (per month) | — | R4,000 – R10,000 | R8,000 – R20,000 |

**On photography:** it is the line most often cut and the one that most visibly separates the
strong competitor sites from the weak ones. A site selling roof-mounted installations on stock
imagery undermines its own credibility. Do not cut it.

> **⚠ DECISION NEEDED — Build route and budget.** DIY, freelancer or agency? This determines
> timeline, the realistic scope of Phase 1, and who owns the site afterwards.

---

## 12. Open decisions

Everything still unanswered, in the order it blocks work. Reordered after the 26 August 2026
research refresh — items 1 and 2 are new and now outrank what was previously first.

| # | Decision | Blocks | Urgency |
| :--- | :--- | :--- | :--- |
| 1 | **B2C installer, B2B distributor, or both?** The live site carries `/distribution/` and a "Register as an Installer" page alongside consumer content (§2.2) | The entire architecture — homepage, navigation, everything downstream | Blocks all design work |
| 2 | **Claim a Google Business Profile.** None found (§2.2, §6.4) | Nothing — which is the point, it can start today | Do this week |
| 3 | **Proof points** — year founded, installations completed, total kWp, DoEL licence category and number, ECSA registration, PV GreenCard status, service areas (§2.2) | "Why Choose Us", trust badges, About, and the whole revised positioning | Blocks homepage copy |
| 4 | **The differentiator**, given that "we're electricians" is a legal baseline rather than an advantage (§2.2) | All messaging, service page order | Blocks homepage copy |
| 5 | **Workmanship guarantee** — the site currently states 3 months against competitors' 3 and 10 years (§2.2) | Trust content, service pages, possibly operations | High |
| 6 | **Financing route** — now a competitive necessity, not an option (§3.4) | Service pages, quote page | High |
| 7 | **Build route and budget** — DIY, freelancer or agency (§11.1) | Timeline, Phase 1 scope | Blocks scheduling |
| 8 | **Service areas** — which towns and suburbs, for local SEO and one Google profile per area (§8) | Local SEO, Contact page, item 2 above | Medium |
| 9 | **Verify compliance thresholds** before publishing exact kW figures — the numbers in §2.1 come from an interim recommendation and may have been superseded | Compliance page and content | Before publishing §2.1 numbers |
| 10 | **Response-time commitment** — what can operations actually hold? (§5.7) | Quote page copy | Medium |
| 11 | **Content owner** — who writes weekly? (§7) | Blog cadence commitment | Medium |
| 12 | **H1** — keep "Leaders in Solar and Electrical" or replace? (§5.1) | Homepage, SEO titles | Medium |
| 13 | **Brand direction** — colours, typography, reference sites | Design phase | Medium |
| 14 | **Manual Google Maps check** of the top six competitors' review counts (§3) | Confidence in §3 numbers | 20 minutes, do before relying on §3 |

**Items 1–4 block everything else.** Nothing on the homepage can be written until they are
answered, and item 1 blocks even the sitemap.

### 12.1 What the refresh changed

For anyone who read the previous version of this brief:

- **Load-shedding has effectively ended** (441 days clear as of 4 Aug 2026). The primary sales
  driver assumed throughout the November 2025 material is gone. §2.1 is new and replaces it.
- **The "solar installed by electricians" positioning is withdrawn as stated.** It describes a
  legal requirement every compliant installer meets, and Fuesse Solar already markets nearly the
  same sentence. §2.2 replaces it with a credential-and-proof version.
- **Financing moved from optional to expected** — most direct competitors now offer it, and
  First Energy has built five rent-to-own tiers with two named banks.
- **Sunlogic appears to have no Google Business Profile**, and may be running two business models
  the brief did not account for. Both are now items 1 and 2 above.
- **Three live incentive facts** the site must get right: the residential rebate is dead, Section
  12BA's 125% allowance expired, and Cape Town's SSEG fee waiver ends 30 September 2026.

---

## Appendix — Provenance

| Section | Source |
| :--- | :--- |
| §1 objectives, current-site assessment | `website_strat.md` §1 |
| §3 competitor analysis | `website_strat.md` §2 (regrouped by threat tier) |
| §4 site map and navigation | `architecture.md` §1, §5 |
| §5 page specifications | `architecture.md` §2 |
| §6 lead generation | `architecture.md` §4; `website_strat.md` §3.3, §3.4 |
| §7 content strategy | `architecture.md` §2.4; `website_strat.md` §3.2 |
| §8 SEO | `architecture.md` §7 |
| §9 technical | `architecture.md` §3, §6, §10 |
| §10 measurement | `architecture.md` §8 |
| §11 roadmap | `architecture.md` §9 |
| §11.1 budget, §12 open decisions | **New in this consolidation** |
| §2.1 market context, §2.2 positioning | **New — from the 26 Aug 2026 research refresh** |
| §3 competitor data (Aug 2026 column) | **Re-researched 26 Aug 2026 against live sources** |

All ▶ RECOMMENDATION and ⚠ DECISION NEEDED blocks are new. Everything else is carried from the
source documents, which remain in `archive/`.

**Refresh method and limits (26 Aug 2026).** Competitor sites were fetched live; market,
incentive and compliance facts were sourced from NERSA, Eskom reporting, City of Cape Town SSEG
guidance, ECASA and SARS-related commentary. Google Maps, Facebook, Instagram and LinkedIn block
automated access, so **no review count or star rating in §3 is independently verified** and
social-media activity levels could not be confirmed. The Wayback Machine was also unreachable,
so where a competitor's site differs from the baseline it is not always possible to say whether
it changed recently or the November 2025 research simply missed it — this is flagged inline
where it matters.

Duplication resolved: `website_strat.md` §3.1 and `architecture.md` §1–2 described the same
structure in different formats; the architecture version was the more detailed and was kept.
`GEMINI.md` was a session changelog with no unique content and is superseded entirely.
