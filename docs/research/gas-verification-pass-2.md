# Gas verification pass 2 — browser re-attempt of the blocked lookups

**Date of this pass: 15 October 2026.** All URLs below were read on that date unless stated otherwise.

This is a **fact-closing pass**, not research and not copy. It re-attempts only the lookups that
failed for *environmental* reasons during the October 2026 gas research — servers that refused
WebFetch and curl — using a real browser. It does not revisit anything the researchers
successfully sourced, and it does not touch the pack's argument.

Verdict vocabulary, per the pack's four-bucket discipline:

- **PRIMARY-VERIFIED** — read in the issuing body's own document, with the URL and the date read.
- **UNVERIFIED** — still not obtainable; stays in bucket (c).
- **CONTRADICTED** — a primary source disagrees with what the pack currently has. Both figures given.

**Headline result.** Six of the seven targets are closed, including both the research called most
important. The City of Cape Town tariff conflict is **settled** — the pack's figures are wrong, and
*why* they are wrong turns out to explain three further errors. Notice **R.262 of 2017 has been read
in full**: it names SANS 10087 Parts 1, 2, 3, 4, 6, 7, 8 and 10 **with no edition years at all**,
and it does **not** name SANS 827. The **MHI LPG threshold** is 20 / 50 / 200 tonnes. The **LPG
calorific value** is sourced to Afrox, net and gross separately. The **SABS store opened**, and the
current standard is **SANS 10087-1:2026 (Ed. 7.01)** — not the Edition 7 (2024) the pack assumes.

Two things beyond the brief are worth knowing before reading on. **§11** is a late addition: the
Pressure Equipment Regulations themselves opened on the same site that served R.262, so
**regulation 17 and the gazetted CoC form have been read verbatim**, which closes two more blocked
items and corrects one of the pack's bucket (a) statements. And **§10** records the four source
routes that made the difference — one of them, a single URL substitution, unblocks every City of
Cape Town document the research could not reach.

**Thirteen `[VERIFY]` markers can be cleared, nineteen patches are listed in §9 and §11.4, and ten
items stay blocked.** Nothing was purchased and nothing in the pack was edited.

---

## 1. City of Cape Town

### 1.1 The gas / LPG requirements document — **PRIMARY-VERIFIED**

`resource.capetown.gov.za` still refuses direct connections, and the browser pane is blocked from
that host. **The working route is the City's own mirror under `www.capetown.gov.za/_documents/`**,
which serves the identical file. Record this route — it unblocks every City PDF the research
could not reach.

- **URL read:** `https://www.capetown.gov.za/_documents/resource.capetown.gov.za/documentcentre/Documents/Procedures,%20guidelines%20and%20regulations/Gas_requirements.pdf`
- **Date read:** 15 October 2026
- **Document:** "APPLICATION FOR APPROVAL OF LP GAS MANIFOLD/STORAGE/FILLING SITES", one page, no
  revision number printed. **PDF metadata: created 4 January 2016, last modified 9 September 2016,
  author Gerard Langenhoven.** So this is a **2016 document** — date it as such in any citation.

**The threshold, verbatim:**

> "Any person intending to install or use LP gas in excess of 100kg or use/install LP gas less than
> 100kg where the gas pipe is to be embedded in the concrete floor shall submit the following plans
> as prescribed in the National Building Regulations and Building Standards Act, together with the
> application form for a flammable substance certificate to the Fire and Rescue Service via the
> Building Development and Planning department."

And again at item 8:

> "Where LP gas used/stored exceeds 100kg, applicant must apply for a flammable substance
> certificate."

**This confirms the pack's threshold wording exactly, including the concrete-floor condition.**
Note what the document does *not* say: it cites the **National Building Regulations and Building
Standards Act** as the source of the plan-submission duty, and does not cite the Community Fire
Safety By-law 2002 by name anywhere. The by-law is the source of the *certificate* regime, but
this particular document does not say so. Do not attribute this document to the by-law.

**Also verbatim, and useful:**

> "LP gas installations, storage and filling sites must conform to SANS 10087 and all work must be
> undertaken by an approved LP gas installer"

Note "**approved LP gas installer**" — the City's own phrase. It is not "SAQCC Gas registered
practitioner". The City does not name a registrar in this document.

**Fire extinguisher sizing** (item 5, verbatim): "The position of all fire appliances (4,5kg DCP
< 100kg gas > 9kg DCP fire extinguisher)" — i.e. 4,5 kg DCP below 100 kg, 9 kg DCP above. This
**corroborates the pack's "9 kg extinguisher above 100 kg"** figure from a municipal source,
independently of SANS 10087:2008 clause 8.3.3.

**Distances, from the document's own "TYPICAL INSTALLATION — MINIMUM SAFETY DISTANCES" drawing
(Drg.15115), read off the rendered page:**

| Measured to | Distance on the City's drawing |
|---|---|
| Door | 1 m |
| Window / opening, horizontally | 1 m |
| Window directly above | 3 m |
| Window directly above, **with a non-combustible roof installed between the containers and the window** | **300 mm** |
| Property boundary | 3 m min. |
| Air-conditioner inlet | 2 m |
| Electrical source | 5 m |
| Manhole or drain | 2 m |

This **corroborates five of the pack's outdoor separation figures** — 1 m to openings at or below
valve level, 2 m to drains/manholes, 3 m to boundary, 3 m to openings directly above, and the
300 mm non-combustible-roof relaxation — from a City of Cape Town published document rather than
from a blog. **It does not move them out of bucket (c)**: the City drawing is dated 2016 and the
companion drawing is captioned "SABS 087-7", an old SABS numbering, so this is corroboration
against pre-Edition-7 material, not against current SANS 10087-1. Two figures here are **new** and
not in the pack at all: **2 m to an air-conditioner inlet** and **5 m from an electrical source**.
The 5 m figure is worth noting against the pack's electrical-clearance set, which it does not
contradict but does not match either (different measurement, different thing).

**The second drawing (storage/filling sites, captioned "SABS 087-7, Drg.14147aEC/00-03")** carries:
3 000 / 2 000 / 1 000 (min.) / 2 000 mm setbacks from the site boundary; a surrounding setback
"Not to be less than that of filling site"; **"Total mass of gas in filling area not to exceed
500 kg"**; **"2 x 9 kg dry chemical powder fire extinguishers"**; "Window sill at least 1,2 m above
ground"; Zone 1 and Zone 2 electrical areas; 5 m and 2 m hazardous-area radii; "No vehicles inside
this line"; and symbolic safety signs per SABS 1186-1 PV1, PV2, PV3. This is a **commercial
filling-site** drawing, not a domestic one — do not mix these numbers into domestic copy.

A local copy of the PDF has been kept at
`/private/tmp/.../scratchpad/ct_gas_requirements.pdf` for this session only; re-download from the
`_documents` URL above if it is needed again.

### 1.2 The 2026/27 electricity tariffs — **CONTRADICTED. Settled.**

- **URL read:** `https://www.capetown.gov.za/_documents/resource.capetown.gov.za/documentcentre/Documents/Financial%20documents/Budget-2026-27_Ann06-25-ElectricityGenerationandDistribution-ConsumptionandGeneration.pdf`
- **Date read:** 15 October 2026
- **Document header, verbatim:** "City of Cape Town - 2026/27 Budget (June 2026) / Annexure 6 -
  Tariffs, fees and charges book", section "25 - Electricity Generation and Distribution -
  Consumption and Generation", page 25.1. **This is the adopted June 2026 budget, not the March
  2026 draft** — the filename is the same for both, so cite the header line, not the filename.

**The Domestic row, as printed (all figures c/kWh except where marked):**

| | 2025/26 R(reg) | 2025/26 R(unreg) | 2025/26 incl. VAT | 2026/27 R(reg) | 2026/27 R(unreg) | 2026/27 excl. VAT | **2026/27 incl. 15% VAT** | % increase |
|---|---|---|---|---|---|---|---|---|
| Energy charge Block 1 (0–600 kWh) | 320.92 | 19.03 | 390.94 | 348.37 | 11.45 | 359.82 | **413.79** | 5.84% |
| Energy charge Block 2 (600.1+ kWh) | 385.10 | 19.03 | 464.75 | 418.03 | 11.45 | 429.48 | **493.90** | 6.27% |
| Service and Wires Charge, R/month (credit) | 59.90 | 0.00 | 68.89 | 65.02 | 0.00 | 65.02 | **74.77** | 8.54% |
| Service and Wires Charge, R/day (prepaid) | 1.97 | 0.00 | 2.27 | 2.14 | 0.00 | 2.14 | **2.46** | 8.59% |

**Verdict: 413.79 / 493.90 c/kWh is correct. 400.63 / 480.73 c/kWh is wrong.** The pack currently
carries both as a live conflict and leans on the wrong one ("NERSA-approved, reconciling to the
budget annexure at ×1.15"). Delete that conflict.

**And here is exactly why the wrong set exists, which matters because the same error runs through
three more of the pack's City figures.** The annexure splits each energy charge into a
**regulated** component and an **unregulated** component. For 2026/27 Domestic that is
348.37 + 11.45 = 359.82 c/kWh excl. VAT, and 359.82 × 1.15 = **413.79**. The 400.63 figure is
348.37 × 1.15 — **the regulated component alone, with the 11.45 c/kWh unregulated charge dropped.**
Likewise 418.03 × 1.15 = 480.73. Whoever produced the 400.63/480.73 set reconciled only the
left-hand column. The customer pays the sum of both.

**The same arithmetic error appears in three further pack figures:**

| Figure | Pack has | Annexure, incl. 15% VAT | Verdict |
|---|---|---|---|
| Small Power User 2, energy charge | 640.31 | **653.48** (556.79 reg + 11.45 unreg = 568.24 × 1.15) | **CONTRADICTED** |
| Small Power User 3, energy charge | 781.46 | **794.63** (679.53 reg + 11.45 unreg = 690.98 × 1.15) | **CONTRADICTED** |
| Residential TOU, high-demand (June–August) peak | 898.23 | **898.23** (769.62 + 11.45 = 781.07 × 1.15) | **PRIMARY-VERIFIED** — correct |

**Confirmed unchanged:** fixed charge **R74.77/month** (Domestic, credit meter) and **R424.30/month**
(Home User) are both correct as the pack has them.

**Other rows read at the same time, for completeness:** Lifeline energy charge 283.04 c/kWh both
blocks (+8.65%); Home User 355.95 / 469.06 c/kWh; Residential TOU is **new for 2026/27** (all
2025/26 cells read "NEW"), opt-in, AMI meters only, with an administration charge of R396.16/month
and a capacity charge of R288.48/month on top — **a page that compares gas against a TOU tariff
has to carry those two fixed charges or the comparison is not honest.** Residential TOU
low-demand (September–May) peak is 418.54 c/kWh, standard 355.60, off-peak 300.94; high-demand
standard 369.29, off-peak 300.94.

---

## 2. SAQCC Gas

The research's 404 was a **URL typo, not a missing page**: the path segment is
`gas-practioners` (sic — the site misspells "practitioners"). The page is live.

### 2.1 LPG registration categories — **PARTIALLY VERIFIED. The codes do not exist on the site.**

- **URL read:** `https://saqccgas.co.za/gas-practioners/registration-categories-per-assoc/lpgsasa-assoc/registration-category-lpgsasa/`
  (reached from `https://saqccgas.co.za/gas-practioners/registration-categories-per-assoc/`)
- **Date read:** 15 October 2026

**Verbatim, the whole of what SAQCC Gas publishes on LPG categories:**

> "LP Gas Association of South Africa Registration Categories:
>
> Conditions of registration:
>
> The requirements for issuing of registration for Practitioners who wish to work in the LP Gas
> (LPG) environment, are as follows:
>
> 1. Completed SAQCC Gas registration form
>
> 2. Relevant training Certificate for either:
>
>     2.1. Domestic,
>     2.2. Commercial,
>     2.3. Industrial,
>     2.4. Rail or Road Tanker,
>     2.5. Auto-gas conversion,
>     2.6. Relevant specialised Training Certificate
>
> 3. Portfolio of Evidence for practical work completed, with temporary number under mentorship.
>
> 4. Attached documentation, including CoC's signed by Mentor.
>
> 5. Requirements are detailed in the SAQCC Gas Practitioner Application Form."

Registration contact published on the same page: Joy Matabane, (011) 886 9702, fax (011) 886 9770,
`registration@lpgas.co.za`.

**What this settles:** the **six LPG registration category names** are now primary-sourced —
Domestic, Commercial, Industrial, Rail or Road Tanker, Auto-gas conversion, and a specialised
category. The pack may name these.

**What it does not settle, and cannot:** there are **no category codes on the page at all**, and
**no kg, kW or vessel-size boundary** between Domestic, Commercial and Industrial. The pack's
item "the authoritative list of SAQCC Gas LPG registration category codes" **stays UNVERIFIED**,
and so does the numeric domestic/commercial/industrial boundary. Both need the email in §8.

### 2.2 "Gas Practitioner" definition — **PRIMARY-VERIFIED**

- **URL read:** `https://saqccgas.co.za/gas-practioners/definition-of/` · **Date read:** 15 October 2026

> "A 'Gas Practitioner' means a person who is registered as competent within the scope of work for
> which SAQCC Gas, has registered that person. SAQCC Gas is an approved authority under mandate of
> the Chief Inspector of the Department of Employment and Labour."

> "Practitioners working in one or more of the areas listed below on the domestic, commercial or
> industrial level could qualify to be registered as an authorised gas practitioner"

Two things worth having in copy: the registration is **scope-limited** ("within the scope of work
for which SAQCC Gas has registered that person"), and the mandate runs from the **Chief Inspector
of the Department of Employment and Labour** — which is the same office that signed R.262 (§3).
This independently supports the pack's §5.4 correction that SAQCC Gas, not LPGSA, is the registrar.

### 2.3 End of paper CoCs — **PRIMARY-VERIFIED, and it is administrative, not gazetted**

- **URL read:** `https://saqccgas.co.za/wp-content/uploads/2023/04/End-of-Paper-CoC-Notice-1-1.pdf`
- **Date read:** 15 October 2026. **Notice dated 24/02/2023**; PDF created 28 February 2023.
- **Issuer:** SAQCC Gas, signed **E Cooke, Communication Manager**, on SAQCC Gas letterhead
  (Block G Hurlingham Office Park, Woodlands Manor, 2196; Reg. No. 2008/027203/08).

**Verbatim:**

> "RE: End of the Road for Paper CoC's Announced     24/02/2023
>
> As of the 1st of April 2023, any Certificate of Conformity (CoC) issued by paper will not be
> considered valid."

> "SAQCC Gas would like to encourage the end-user to not accept paper CoCs after the 1st of April
> 2023 and confirm the validity of a gas practitioner's registration by visiting
> www.saqccgas.co.za."

> "The digital CoC was launched in 2021 and is in line with South African standards"

**This closes §7.2 issue 5 for the 1 April 2023 date**, which moves from trade-press secondary to
primary. Three qualifications:

1. **The notice cites no Government Gazette number.** It is a **SAQCC Gas administrative
   announcement**, signed by a communications manager. Say "SAQCC Gas announced", never "the law
   changed on 1 April 2023".
2. **The second date in the pack, 1 May 2023, is not in this notice** and remains **UNVERIFIED**.
3. SAQCC Gas's own term is "**Certificate of Conformity**", not "Certificate of Compliance". The
   market uses both. Worth matching the registrar's word at least once on the page.

### 2.4 CoC validity period — **STILL UNVERIFIED**

Nothing on saqccgas.co.za states a validity period. The site's `legislation/standards/` page
(`https://saqccgas.co.za/legislation/standards/`, read 15 October 2026) is **an empty shell** — it
renders a heading and nothing else: no standards list, no tables, no documents. So SAQCC Gas does
not publish a standards register either. **The pack's hedged wording in bucket (b) stands
unchanged**, and the email in §8 is still required.

---

## 3. Notice R.262 of 2017 — **PRIMARY-VERIFIED IN FULL.** The single biggest result of this pass.

- **URL read:** `https://www.acts.co.za/occupational-health-/per_nr262_notice_no__r_l_262_of`
- **Date read:** 15 October 2026
- **Source quality:** Acts Online reproduces the gazette text verbatim behind a partial paywall;
  the full schedule rendered. This is a **recognised legal publisher's reproduction of the
  gazetted text**, not the Government Printing Works PDF itself. Treat it as reliable for the
  content and, if a lawyer is ever going to rely on it, buy the GPW copy of **GG 40713 of
  24 March 2017** to match. The research's earlier 404 on this mirror did not recur.

**The enacting words, verbatim:**

> "Notice No. R. 262
>
> 24 March 2017
>
> Department of Labour
>
> I, Mr Tibor Szana, appointed as the chief inspector in terms of section 27(1) of the said Act,
> and by virtue of the powers delegated to me by the Minister of Labour in terms of section 42(1)
> of the Act, after consultation with the Advisory Council for Occupational Health and Safety,
> hereby, under section 44 of the Occupational Health and Safety ( Act No. 85 of 1993), as
> amended, amend the schedule in the Pressure Equipment Regulations , 2009, by replacing the
> current schedule with the new schedule as gazetted.
>
> Tibor Szana
> Chief Inspector"

### 3.1 The answer to "which editions have legal force"

**None are specified. The schedule names standards without edition years — every single one of
them, South African and international alike.** The schedule is a two-column table, "1" and "2",
grouped by country/body (American, Australian, British, European, French, German, ISO, South
African standards); column 1 is the standard number and column 2 is the title. There is no edition
column, no year, no "as amended", no "latest edition" formula.

**So the pack's framing of this question has no answer because the notice does not pin editions.**
The practical consequence, which is what the page actually needs: an undated incorporation by
reference means the standard as it stands, so **SANS 10087-1 Edition 7 is the operative edition
from the date it superseded Edition 6** — but that conclusion is *ours*, drawn from the absence of
a year in the notice, not something the notice says. **Publish it as our reading, or not at all.**
It is not a "according to the regulations" claim.

### 3.2 SANS 10087 as listed — part titles and scopes, verbatim

> "**SANS 10087** — The handling, storage, distribution and maintenance of liquefied petroleum gas
> in domestic, commercial and industrial installations:
>
> **Part 1:** Liquefied petroleum gas installations involving gas storage containers of individual
> water capacity not exceeding 500 ℓ and a combined water capacity not exceeding 3 000 ℓ per
> installation
>
> **Part 2:** Installation in mobile units and small non-permanent buildings
>
> **Part 3:** Liquefied petroleum gas installations involving storage vessels of individual water
> capacity exceeding 500 ℓ
>
> **Part 4:** Transportation of LPG in bulk by road
>
> **Part 6:** The application of liquefied petroleum and compressed natural gases as engine fuels
> for internal combustion engines
>
> **Part 7:** Storage and filling sites for refillable liquefied petroleum gas (LPG) containers of
> capacity not exceeding 9 kg
>
> **Part 8:** The fuelling of fork-lift trucks and other LP gas operated vehicles
>
> **Part 10:** Mobile filling stations for refillable liquefied petroleum gas (LPG) containers of
> capacity not exceeding 9 kg."

(The source renders the litre sign as "f" and "t" in Parts 1 and 3 — an OCR artefact of "ℓ".
Parts 5 and 9 are not listed, in this notice or in the 2009 one.)

**What this resolves:**

| Pack item | Verdict |
|---|---|
| Part 1 scope "≤500 ℓ individual / ≤3 000 ℓ combined" | **PRIMARY-VERIFIED**, exactly as the pack has it |
| Part 2 is **mobile units** — and the market's "commercial gas is SANS 10087-2" is false | **PRIMARY-VERIFIED.** The pack's bucket (d) correction is right. The full title is slightly broader than the pack states: "mobile units **and small non-permanent buildings**" |
| Part 3 is commercial/industrial, **>500 ℓ individual water capacity** | **PRIMARY-VERIFIED.** The research's "Part 3's actual title and scope could not be verified from any source" is now closed |
| Part 7 is "filling ratios" — flagged in the pack as an assumption | **CONTRADICTED.** Part 7 is "**Storage and filling sites for refillable LPG containers of capacity not exceeding 9 kg**". Nothing to do with filling ratios |
| The 2009 list of Parts 1, 2, 3, 4, 6, 7, 8, 10 | **PRIMARY-VERIFIED as unchanged by R.262** — the 2017 replacement schedule carries the identical part list |

**Caveat the pack must keep:** R.262 verifies the **part titles and scope boundaries**. It verifies
**nothing inside** any part — no distance, clearance, ventilation area, test pressure, consumable
age or vaporisation rate. Everything in bucket (c) that depends on reading the standard itself
stays in bucket (c).

### 3.3 SANS 827 — **resolved: it is NOT incorporated**

**SANS 827 does not appear anywhere in the R.262 schedule.** The South African block lists
SANS 347, 151, 10228, 10254, 10227, 10019, 1475-1, 10087, 10147, 1539, 1237, 329, 10105-1, 1910,
1567, 1518, 1668, 1748, 7396-1, 10252-1, 10260, 10377-1 — and no SANS 827. Since R.262 **replaced**
the whole schedule, and whatever R.79 of 2012 did was replaced along with it, **there is no live
incorporation of SANS 827 through the Pressure Equipment Regulations schedule.** The pack's open
item "whether SANS 827 is legally incorporated" is now answered: **not by this route.** Do not
claim SANS 827 is legally mandated. (Low practical impact for Cape Town — no natural gas network.)

### 3.4 Other listings in the schedule worth knowing

The schedule also incorporates **SANS 1539** (LPG portable and mobile appliances — safety aspects),
**SANS 1237** (single-stage low-pressure regulators for LPG), **SANS 10019** (transportable gas
containers — basic design, manufacture, use and maintenance), **SANS 10105-1** and **SANS 1910**
(fire extinguishers), **SANS 10260** (industrial gas pipelines), and **SANS 347** (categorization
and conformity assessment criteria for all pressure equipment). The note at the foot of the
international block reads: "In addition to the above mentioned health and safety standards any
standard which results in pressure equipment being CE or Pi marked is deemed approved."

**Known quirk, flagged so nobody mistakes it for a finding:** the SANS block repeats SANS 10147,
SANS 1539, SANS 1237 and SANS 10019 twice, with SANS 10019 given two slightly different titles.
That is how the schedule is printed. Do not read significance into it.

---

## 4. SABS store — **REACHABLE. Part scopes PRIMARY-VERIFIED. The current edition is not what the pack assumes.**

`store.sabs.co.za` opened without difficulty. All pages read **15 October 2026**.
Search used: `https://store.sabs.co.za/catalogsearch/result/?q=10087`

### 4.1 The current edition of SANS 10087-1 — **CONTRADICTED**

**The pack treats "Edition 7, approved August 2024" as probable. The SABS store sells
`SANS 10087-1:2026 (Ed. 7.01)`.**

- **Product page:** `https://store.sabs.co.za/sans-10087-1-ed-7-01.html`
- **Price: R1,465.10** (PDF, download on purchase; hardcopies collection-only from
  1 Dr Lategan Rd, Groenkloof, Pretoria). **Nothing was bought.**
- **Full title as listed, verbatim:** "The handling, storage, distribution and maintenance of
  liquefied petroleum gas in domestic, commercial, and industrial installations Part 1: Liquefied
  petroleum gas installations involving gas storage containers of individual water capacity not
  exceeding 500 L and a combined water capacity not exceeding 3 000 L per installation"

The designation `:2026 (Ed. 7.01)` means the operative document is a **2026 revision of
Edition 7**, not the August 2024 Edition 7 the research expected. The store does not say what
changed, and no free preview is available without an account (the PREVIEW control requires
sign-in). **Do not describe the current standard as "Edition 7 (2024)" anywhere.** If a page names
an edition at all, it is **SANS 10087-1:2026, Edition 7.01**. If a figure is ever confirmed against
Edition 7 (2024) rather than 7.01 (2026), say which — that distinction is now live.

**Consequence for §5.1 of the pack:** the purchase instruction "SANS 10087-1 Edition 7 (approved
August 2024)" should read **SANS 10087-1:2026 (Ed. 7.01), R1,465.10**.

### 4.2 Part scopes — **PRIMARY-VERIFIED, and the pack's bucket (d) correction is right**

Titles below are verbatim from each product page, read 15 October 2026. All share the stem
"The handling, storage, distribution and maintenance of liquefied petroleum gas in domestic,
commercial, and industrial installations".

| Part | Edition sold | Price | Scope, verbatim from the SABS listing | Product page |
|---|---|---|---|---|
| **1** | **2026 (Ed. 7.01)** | **R1,465.10** | "Part 1: Liquefied petroleum gas installations involving gas storage containers of individual water capacity not exceeding 500 L and a combined water capacity not exceeding 3 000 L per installation" | `/sans-10087-1-ed-7-01.html` |
| **2** | 2011 (Ed. 3.00) | R876.30 | "Part 2: **Installation of LPG systems in mobile units, including but not limited to caravans, motor homes, park homes and mobile kitchens**" | `/sans-10087-2-2011-ed-3-00.html` |
| **3** | 2015 (Ed. 5.00) | **R1,124.70** | "Part 3: Liquefied petroleum gas installations involving storage vessels of individual water capacity exceeding 500 L" | `/sans-10087-3-ed-5-00-2131418.html` |
| 4 | 2011 (Ed. 3.00) | R915.40 | (transport of LPG in bulk by road) | `/sans-10087-4-2011-ed-3-00.html` |
| 6 | 2023 (Ed. 5.00) | R798.10 | (LPG and CNG as engine fuels) | `/sans-10087-6-2023-ed-5-00.html` |
| **7** | 2014 (Ed. 4.00) | R837.20 | "Part 7: **Storage and filling premises for refillable liquefied petroleum gas (LPG) containers of gas capacity not exceeding 19 kg and the storage of individual gas containers not exceeding 48 kg**" | `/sans-10087-7-2014-ed-4-00-2126846.html` |
| 8 | 2010 (Ed. 2.00) | R484.15 | (fuelling of fork-lift trucks and other LP gas operated vehicles) | `/sans-10087-8-2010-ed-2-00.html` |
| 10 | 2022 (Ed. 1.03) | R379.50 | (mobile filling stations, ≤9 kg containers) | `/sans-10087-10-ed-1-03.html` |

**Parts 5 and 9 do not exist** — neither in the SABS catalogue nor in the R.262 schedule.

**Verdicts:**

- **"Part 2 is mobile units, not commercial" — PRIMARY-VERIFIED twice over**, by R.262 and by the
  SABS listing, and the SABS title is the stronger one for copy because it enumerates the units:
  *caravans, motor homes, park homes and mobile kitchens*. The pack's bucket (d) entry is correct
  and can be stated with confidence. **The mobile-kitchen item is worth noting commercially** — a
  food truck is Part 2, which is a real distinction a competitor is likely to get wrong.
- **"Part 3 is commercial above 500 L" — PRIMARY-VERIFIED.** "Storage vessels of individual water
  capacity exceeding 500 L". Note it is **water capacity**, not gas mass, and **individual**, not
  combined. Do not paraphrase it as "above 500 litres of gas".
- **Part 7 — CONTRADICTED, twice, and the two sources disagree with each other.** The pack guessed
  "filling ratios": wrong. But the SABS title (**"≤19 kg … and individual containers ≤48 kg"**) and
  the R.262 schedule title (**"≤9 kg"**) are **not the same**. R.262 was gazetted in 2017 and the
  current Part 7 is the 2014 edition, so the gazette reproduces an **older title than the edition
  that was already current when it was gazetted.** Use the **SABS title** for anything about what
  Part 7 covers. Keep this discrepancy in mind generally: **R.262's part titles are not reliably
  current**, even though its part *list* is.

### 4.3 What this does and does not unlock

It unlocks nothing in bucket (c) that depends on the standard's contents. **No clause, distance,
clearance, ventilation area, test pressure, hold time, consumable age, vaporisation rate or
manifold limit was obtained** — those are inside the paid documents. The research's judgement that
roughly a third of the page is gated on buying SANS 10087-1 stands, at a now-known price.

**Purchase decision, for Stephan:** SANS 10087-1:2026 (Ed. 7.01) at **R1,465.10** and
SANS 10087-3:2015 (Ed. 5.00) at **R1,124.70** — **R2,589.80** for the two the pack asks for.
Part 2 (R876.30) is only worth buying if a mobile-kitchen or food-truck service line is ever
planned. Nothing was purchased in this pass.

---

## 5. LPG calorific value — **PRIMARY-VERIFIED (manufacturer's technical manual), with one caveat on hosting**

- **Document:** Afrox, *Product Reference Manual — Section 5: Liquefied Petroleum Gas*. The
  running footer on every page reads "Product Reference Manual - Section 5 - Liquefied Petroleum
  Gas"; the text is Afrox's own ("Afrox is the leading supplier of Liquefied Petroleum Gas in South
  Africa under the brand name Handigas"), and the physical-properties table's third column is
  headed **Handigas**, Afrox's commercial propane/butane mix.
- **URL read:** `http://www.awsgroup.co.za/data/L.P.G.pdf` · **Date read:** 15 October 2026
- **Caveat on the source:** this is **Afrox-authored content mirrored on a third-party reseller's
  site** (AWS Group). The PDF carries no edition statement and its file metadata dates to 2006–2009.
  **No copy on afrox.co.za could be found**; Afrox's own current public document is the safety data
  sheet `AFX-SDS-0028 v01` (review date 30/03/2022), **which does not carry a calorific value** —
  SDSs generally do not. So: the figure is the manufacturer's, the hosting is third-party, and the
  edition is undated. That is better than the pack's current position (no source at all), but it is
  **not** a current, first-party, dated data sheet.

**The physical-properties table, verbatim, for the three columns Propane / Butane / Handigas:**

| Property | Propane | Butane | **Handigas** |
|---|---|---|---|
| **Net calorific value at 25 ºC (MJ/kg)** | 46,0 | 45,6 | **45,8** |
| **Gross calorific value at 25 ºC (MJ/kg)** | 49,8 | 49,4 | **49,6** |
| Density of liquid at 15 ºC (kg/l) | 0,510 | 0,575 | 0,536 |
| Volume of gas from 1 kg liquid at STP (l) | 537 | 405 | 484 |
| Limits of flammability in air (vol% gas) | 2,2 – 10 | 1,8 – 9 | 1,8 – 10 |

And in the body text at §3.2:

> "The total amount of heat liberated by burning a substance is known as its Calorific Value or CV.
> It is usually expressed in megajoules per kg (MJ/kg). For LPG, it is 49,6 MJ/kg."

**Verdict on the pack's 46–50 MJ/kg range: broadly right, but it is the wrong shape for a costing
input.** The range is not a range at all — it is **two different measurements of the same gas**:
net **45,8 MJ/kg** and gross **49,6 MJ/kg** for the commercial mix at 25 ºC. Quoting "46–50" hides
that, and the 8% spread between the two is enough to flip a close cost comparison.

**For a cost-per-useful-kWh calculation the net figure is the one to use** — 45,8 MJ/kg =
**12,72 kWh/kg** — because published appliance efficiencies are conventionally stated against the
net (lower) heating value. **State the figure, the basis (net), the temperature (25 ºC) and the
source on the page**, exactly as §7.2 issue 2 now requires. Gross 49,6 MJ/kg = 13,78 kWh/kg; using
it against a net-basis efficiency would overstate gas by about 8%.

**Independent corroboration:** the research's own cross-check — a 2018 forum calculation of 115 kWh
from a 9 kg bottle, i.e. 12,8 kWh/kg — matches the **net** value (12,72 kWh/kg) almost exactly, and
not the gross. That is a second reason to use net.

**What is still open:** the **appliance efficiencies** (instant gas heater 78–88%, electric geyser
90%, heat pump COP 3.0, hob pan efficiency gas 40% / radiant 70% / induction 84%) are untouched by
this pass and **remain entirely unverified**. They were not in scope here. The research is right
that the hob figures drive the "gas cooking is more expensive" conclusion, so that conclusion is
still gated even now that the calorific value is sourced.

---

## 6. The MHI LPG qualifying quantity — **PRIMARY-VERIFIED**

- **Document:** Major Hazard Installation Regulations, 2022, **Notice No. R. 2989 of 31 January
  2023**, Government Gazette **47970**, made by Thembelani Waltermade Nxesi, Minister of Employment
  and Labour, under the Occupational Health and Safety Act, 1993. Repeals the 2001 regulations
  (Notice No. R. 692 of 30 July 2001).
- **URL read:** `https://cer.org.za/wp-content/uploads/2023/02/occupational-health-and-safety-act-1993-as-amended-promulgation-of-major-hazard-installation-regu.pdf`
  — the Centre for Environmental Rights' copy of the gazette, carrying the Sabinet reproduction
  notice. 61 pages, text layer intact. **Date read:** 15 October 2026.
- **Location in the document:** **Annexure A, Chapter 1 — Named Dangerous Substances.**

**The row, verbatim:**

> | Named substances | UN NUMBER | Column 1 — Low Hazard | Column 2 — Medium Hazard | Column 3 — High Hazard |
> |---|---|---|---|---|
> | "Liquefied extremely flammable gases (including LPG) and natural gas (whether liquefied or not)" | 1075 | **20** | **50** | **200** |

Quantities are **in tonnes**, per the table heading "Quantities in tonnes".

**The bands, from the definitions in the regulations:**

> "'low hazard establishment' means an establishment where Chapter 1 or 2 dangerous substances are
> present and the quantity is equal to or exceeds the quantity in column 1 but is less than
> quantities listed in column 2"

> "'medium hazard establishment' means an establishment where Chapter 1 or 2 dangerous substances
> are present and the quantity is equal to or exceeds the quantity in column 2, but is less than
> the quantity in column 3"

> "'high hazard establishment' means … an establishment where Chapter 1 or 2 dangerous substances
> are present in quantities equal to or in excess of the quantities listed in column 3"

So: **below 20 t of LPG, the MHI Regulations do not apply at all.** 20 t to under 50 t is low
hazard; 50 t to under 200 t is medium; 200 t and above is high.

**On the pack's "200 t / 20 t are Australian" warning — amend it.** The warning was sound as
written (the research had no SA source and a search had surfaced SafeWork SA figures). But the
South African figures **are** 20 t and 200 t, with 50 t between them. The bucket (d) entry should
no longer say those numbers are Australian and must not be used; it should say the SA set is
**20 / 50 / 200 tonnes** from Annexure A Chapter 1, and that a two-number "200 t / 20 t" framing
without the 50 t middle band is the Australian two-tier structure, not the South African
three-tier one.

**Scale check for the page, if it is ever useful:** 20 tonnes is the low-hazard floor. A domestic
installation at the City of Cape Town's 100 kg flammable-substance-certificate threshold is
**0,5% of it**. These regimes are four orders of magnitude apart and should not be mentioned in
the same breath on a domestic page.

**Also found in Annexure A Chapter 1, and worth not confusing with the above:** "Petroleum
products: gasolines, naphthas, kerosenes (including jet fuels), gas oils (including diesel fuels,
home heating oils and gas oil blending streams)", UN Gas (1075) / Crude (1275) — **250 / 2 500 /
25 000 tonnes.** That row is **not** the LPG row despite also carrying UN 1075. Use the
"Liquefied extremely flammable gases (including LPG)" row.

---

## 7. Google Business Profile and Hellopeter

### 7.1 Google Business Profile categories — **STILL UNVERIFIED, and not verifiable from outside**

Category availability is per-country and is only authoritative inside the GBP dashboard for the
actual listing. That needs a signed-in session on Sunlogic's own Google account, which this pass
did not and should not do on its own initiative. Every public "category list" is a third-party
scrape of unknown vintage — which is exactly what the research already had.

**This one stays a task for Stephan, not a lookup.** It takes about two minutes: GBP → the
Sunlogic listing → Edit profile → Business category → type "gas" and read what the picker offers.
Record the exact strings it returns, because that is the only authoritative answer. The three the
research wants tested are "Gas installation service", "Gas company" and "Gas engineer".

### 7.2 Hellopeter — **PRIMARY-VERIFIED: there is no gas category**

- **URLs read, all 15 October 2026:** `https://www.hellopeter.com/industries`,
  `/industries/home-services`, `/industries/utilities`, and
  `/search?q=gas%20installation`

Hellopeter's full industry list is: Automotive, Banking, Electronics & Technology, Financial
Services, Health & Medical, Insurance, Internet & Telecoms, Retail, Business & Legal Services,
Construction & Hardware, Education & Training, Entertainment & Gaming, Funeral Services,
Government Services, Home Services, Media & Publishing, Real Estate, Restaurants & Food, Security,
Software & Apps, Transportation & Logistics, Travel & Vacation, Utilities, Wellness & Beauty.

- **Home Services** sub-categories: All, **Renovations & Interiors**, **Cleaning**, **Solar &
  Energy**.
- **Utilities** sub-categories: All, **Electricity & Energy**, **Fuel & Petrol**, **Prepaid
  Services**.

**There is no gas industry and no gas sub-category anywhere on the platform.** A gas installer
listing on Hellopeter would sit under **Home Services → Solar & Energy**, which is where Sunlogic
would already be.

**Competitor presence is thin and mostly abandoned.** A search for "gas installation" returns
**20 businesses**, of which only one is **Claimed**; the rest are **Unclaimed**, and the handful
that carry any rating carry **one review each** (e.g. "DK gas installation — Unclaimed — 5 | 1
reviews"; "JLB Gas Installations — Unclaimed"). **Review counts are readable directly off the
listing pages**, so competitor review counts can be tracked without any special access — the
research's inability to read them was the tool, not the site.

The commercial read, for whatever it is worth: Hellopeter is **not a channel to compete on** for
gas, because nobody is on it. One claimed profile with a handful of real reviews would top the
category outright. That is an observation, not a recommendation, and it is outside this pass's
scope.

---

## 8. The SAQCC Gas email — drafted, not sent

The research asked for this in §5.2. Four of its questions are now answered from the website
(§2 above). **Three are not on the site at all and genuinely need the registrar in writing.**
Drafted below; **not sent** — sending is Stephan's call.

**To:** `info@saqccgas.co.za` · **Cc:** `registration@lpgas.co.za` (the LPG registration contact
SAQCC Gas publishes)
**Subject:** Written confirmation requested — LPG registration categories, CoC validity, and scope of "install or remove"

> Good day
>
> We are a Cape Town electrical and solar contractor preparing public-facing material on LP gas
> compliance for homeowners, and we would rather publish nothing than publish something wrong. We
> have read the SAQCC Gas site, including the LPGSA registration-categories page and the gas
> practitioner definition, and three questions remain that we cannot answer from published material.
> We would be grateful for an answer in writing, which we will attribute to SAQCC Gas.
>
> 1. **Registration category codes and boundaries.** Your site lists the LPG training categories as
>    Domestic, Commercial, Industrial, Rail or Road Tanker, Auto-gas conversion, and specialised. Do
>    these categories carry formal codes on a practitioner's registration card, and if so what are
>    they? And is there a defined boundary between Domestic, Commercial and Industrial — expressed
>    in kilograms of installed gas, kW of appliance load, or vessel water capacity — or is the
>    distinction a matter of the training completed?
>
> 2. **Certificate of Conformity validity.** Does any validity period or expiry attach to a CoC
>    issued by a registered practitioner? We are aware that SANS 10087-1 requires re-inspection at
>    intervals not exceeding five years, and that the Pressure Equipment Regulations require a
>    certificate on change of user or ownership. We want to be clear whether the certificate itself
>    expires, or whether it simply ceases to describe the installation once the installation
>    changes. The market currently circulates "two years", "five years" and "no expiry" as if all
>    three were law.
>
> 3. **Servicing and maintenance.** Regulation 17(1)(c) of the Pressure Equipment Regulations refers
>    to a person who may "install or remove" a gas appliance or installation. Does *servicing or
>    maintaining* an existing installation — without installing or removing anything — also require
>    an authorised person registered with SAQCC Gas? If so, which provision is the hook?
>
> We would also be glad to know whether the 1 April 2023 end of paper CoCs, announced in your notice
> of 24 February 2023, was accompanied by any gazette notice, or whether it was an administrative
> decision of SAQCC Gas.
>
> Thank you for your time.

**Why each question still matters:** (1) gates naming any category or numeric boundary in copy;
(2) gates the bucket (b) hedged wording, which currently has to carry three qualifications in one
sentence; (3) gates **how the servicing product can be described at all** — §7.2 issue 4 — and is
the most commercially load-bearing of the three.

---

## 9. Patch list for `docs/gas-service-pack-2.md`

**Not applied.** Listed for review. Line references are to the pack as it stands on 15 October 2026.

### 9.1 Can be cleared now

| # | Where | Current | Replace with |
|---|---|---|---|
| **P1** | §5.2 item 2, and the City-tariff `[VERIFY]` wherever it appears; §7.2 issue 2 | "City of Cape Town tariffs that are secondary and disputed — two reported sets 3.3% apart" | **Cleared.** "City of Cape Town Domestic energy charge, 2026/27: **413.79 c/kWh** on the first 600 kWh and **493.90 c/kWh** above it, including VAT, plus a fixed service and wires charge of **R74.77 a month** on a credit meter or **R2.46 a day** on prepaid. Adopted June 2026 budget, Annexure 6, section 25." The 400.63 / 480.73 set is **wrong** and the conflict should be deleted, not hedged |
| **P2** | The research report §(c), City tariffs row | "Two conflicting reported sets … SPU 2 640.31; SPU 3 781.46" | Replace with **SPU 2 653.48** and **SPU 3 794.63** incl. VAT. Residential TOU winter peak **898.23** and the fixed charges **R74.77** / **R424.30** were already right. Add the explanation: every wrong figure is the regulated component × 1.15 with the 11.45 c/kWh unregulated component omitted |
| **P3** | §3.3 and the matching FAQ, City thresholds (§7.2 issue 3) | Gated on opening the City's document | **Cleared for the threshold itself.** The City's wording is verifiable: over 100 kg, **or** under 100 kg where the gas pipe is embedded in the concrete floor, requires plans and a flammable substance certificate application to the Fire and Rescue Service via Building Development and Planning. Keep the bucket (b) hedge "**in the City of Cape Town**", never "in the Western Cape" — this is a City document and says nothing about other municipalities. Cite it as a **2016** City document, and note it cites the **National Building Regulations and Building Standards Act**, not the Community Fire Safety By-law |
| **P4** | §5.3 bucket (d), "commercial gas is done to SANS 10087-2" | Correct, but sourced to reasoning | **Now primary.** Cite both R.262's schedule and the SABS listing. Upgrade the wording: Part 2 is "**Installation of LPG systems in mobile units, including but not limited to caravans, motor homes, park homes and mobile kitchens**"; Part 3 is "**installations involving storage vessels of individual water capacity exceeding 500 L**" |
| **P5** | §(c), "Part scopes" row | "Part 3's actual title and scope could not be verified from any source, and Part 7's 'storage and filling' is an assumption" | **Cleared.** Part 1 and Part 3 scopes verified verbatim (§4.2). **Part 7 is CONTRADICTED**: it is "Storage and filling **premises** for refillable LPG containers of gas capacity **not exceeding 19 kg** and the storage of individual gas containers **not exceeding 48 kg**" — not filling ratios, and not the "≤9 kg" that R.262 reproduces |
| **P6** | §5.1 item 4 and §(c), "which SANS 10087 editions currently have legal force" | "The most important unverified item in the regulatory research" | **Cleared, with a nuance the pack must keep.** R.262 of 2017 (GG 40713, 24 March 2017, Chief Inspector Tibor Szana) replaced the PER schedule and lists SANS 10087 Parts 1, 2, 3, 4, 6, 7, 8 and 10 — **stating no edition year for any standard in the schedule**. So no edition is pinned by law. The inference that the current edition therefore applies is **our reading**, and must be published as ours or not at all |
| **P7** | §(c), "Whether SANS 827 is legally incorporated" | "Not in the 2009 incorporation list; may have been added by R.79 of 2012 or R.262 of 2017, both unretrievable" | **Cleared: SANS 827 is NOT in the R.262 schedule.** R.262 replaced the whole schedule, so there is no live incorporation of SANS 827 via the PER. Move to bucket (d): do not claim SANS 827 is legally mandated |
| **P8** | §(c), "The MHI tonnage threshold"; §5.3 bucket (d), "any MHI tonnage, especially 200 t / 20 t, which are Australian" | "Do not publish a tonnage figure" | **Cleared.** Annexure A Chapter 1 of the MHI Regulations 2022 (R. 2989, GG 47970, 31 Jan 2023): "Liquefied extremely flammable gases (including LPG) and natural gas (whether liquefied or not)", UN 1075 — **20 / 50 / 200 tonnes** for low / medium / high hazard; below 20 t the regulations do not apply. **Amend the bucket (d) entry**: 20 t and 200 t are the real SA figures, and what is Australian is the *two-tier* framing without the 50 t middle band |
| **P9** | §(c), "LPG calorific value in MJ/kg"; §7.2 issue 2 | "46–50 MJ/kg used, from the brief" — unsourced | **Cleared, with the basis stated.** Afrox *Product Reference Manual, Section 5*: Handigas (the commercial propane/butane mix) **net 45,8 MJ/kg** and **gross 49,6 MJ/kg at 25 ºC**. Use **net 45,8 MJ/kg = 12,72 kWh/kg** for cost-per-useful-kWh, and **say so on the page**, with the basis and temperature. Delete the "46–50" range — it was two different measurements, not a range. Flag the source caveat: Afrox-authored, mirrored on a reseller's site, undated edition |
| **P10** | §7.2 issue 5, electronic-CoC dates | "1 April 2023 and 1 May 2023 both come from secondary reporting" | **Half cleared.** 1 April 2023 is now primary: SAQCC Gas notice "End of the Road for Paper CoC's Announced", dated 24 February 2023, signed E Cooke. **1 May 2023 is still unverified and should be dropped** unless a source turns up. Add the qualification that this was a **SAQCC Gas administrative announcement citing no gazette** — "SAQCC Gas announced", never "the law changed" |
| **P11** | §(c), "SAQCC category codes" (partial) | "Do not name a category or state a numeric boundary" | **Half cleared.** The six LPG category *names* may now be stated — Domestic, Commercial, Industrial, Rail or Road Tanker, Auto-gas conversion, and a specialised category — citing the SAQCC Gas LPGSA registration-categories page. **The codes and the numeric boundary stay blocked** |
| **P12** | §5.1 item 1, the purchase instruction | "SANS 10087-1 Edition 7 (approved August 2024) from the SABS store" | **Correct the edition and add the price.** It is **SANS 10087-1:2026 (Ed. 7.01), R1,465.10**. Add Part 3: **SANS 10087-3:2015 (Ed. 5.00), R1,124.70**. Total **R2,589.80**. Delete "Edition 7 (2024)" from the pack's language entirely — it is not what SABS sells |
| **P13** | §(c), "Google Business Profile categories" | Unchanged | Leave gated, but **reframe it as a two-minute dashboard task rather than a research item** — it is not verifiable from outside the account by anyone, ever |
| **P14** | New, if the pack tracks it | — | **Hellopeter has no gas category.** Home Services → Solar & Energy is the only fit. 20 "gas installation" businesses, 19 unclaimed, one review each where rated. Competitor review counts **are** readable directly; the research's inability to read them was the tool |

### 9.2 Cannot be cleared

| # | Item | Why it is still blocked |
|---|---|---|
| **B1** | **Every SANS 10087 distance, clearance, ventilation area, test pressure, hold time, consumable age, vaporisation rate, manifold limit, roof-mount limit and indoor mass limit** | Inside the paid standard. **Nothing in this pass read a single clause.** The 2008 Edition 5 provenance is unchanged, and the current edition is now known to be 7.01 (2026), one revision further from it than the pack assumed. The City of Cape Town drawing (§1.1) corroborates **five** outdoor separation figures from a municipal source, but it is dated 2016 and references the old SABS 087 drawing set — **corroboration, not clearance.** Bucket (c), unchanged |
| **B2** | **All bulk-tank siting and separation distances (>500 L)** | Still a straight blank. SANS 10087-3:2015 is paywalled at R1,124.70 and no open copy exists. **Publish nothing** |
| **B3** | **CoC validity period** | Not on the SAQCC Gas site; the site's own `legislation/standards/` page is an empty shell. Needs the §8 email. Bucket (b) hedged wording stands verbatim |
| **B4** | **Whether servicing (as distinct from installing or removing) requires an authorised person** | §7.2 issue 4. The PER text could not be read in this pass — `saflii.org` returned **HTTP 403** to every attempt. Needs the §8 email, and ideally a direct read of regulation 17. **The narrowed wording "no South African regulation sets a service interval" stays gated** |
| **B5** | **SAQCC Gas category codes, and the kg/kW/vessel-size domestic–commercial–industrial boundary** | Not published anywhere on saqccgas.co.za. Needs the §8 email |
| **B6** | **All appliance efficiencies** — gas heater 78–88%, geyser 90%, heat pump COP 3.0, hob 40 / 70 / 84% | Out of scope for this pass; entirely unverified. **The "gas cooking is more expensive" conclusion is still gated even now that the calorific value is sourced**, because the hob figures drive it |
| **B7** | **The five-page prescribed CoC form** — gazetted or administrative, and its contents | No source found. Unchanged |
| **B8** | **Whether a CoC is required on single-appliance replacement, and whether a lease triggers one** | Unchanged. Needs legal input, not a lookup |
| **B9** | **1 May 2023** as an electronic-CoC date | Not in the SAQCC Gas notice. Drop it rather than gate it |
| **B10** | **Google Business Profile gas categories** | Dashboard-only. See P13 |

### 9.3 One thing this pass did not do, and someone should

**`saflii.org` returned HTTP 403** on the consolidated Pressure Equipment Regulations, so the
**text of regulation 17, the "authorised person" definition and the question of whether any
validity period appears in the PER were not re-read in this pass.** The research already has
reg 17 from elsewhere and nothing here contradicts it — but B4 in particular would be much better
answered by reading reg 17 in a browser than by waiting on an email. Acts Online carries the PER
alongside R.262 at the same site that worked today, and is the obvious next try.

---

## 10. Source route notes, for whoever does the next pass

Three of these cost real time and are worth writing down:

1. **`resource.capetown.gov.za` is genuinely unreachable** — it refuses connections and the browser
   is blocked from the host. **Every one of its documents is served identically from
   `https://www.capetown.gov.za/_documents/resource.capetown.gov.za/<same path>`.** That mirror
   works. This single substitution unblocked both City documents the research could not open.
2. **The SAQCC Gas 404 was a typo in the path**, not a missing page: the site spells it
   **`gas-practioners`**, not `gas-practitioners`.
3. **Fetching a PDF and reading it are different problems.** Every PDF in this pass came back as
   undecoded binary to the fetching tool and was readable only after local text extraction. The
   researchers' "could not retrieve" on several of these items may in some cases have been "could
   not *read*". Worth assuming, on the next pass, that a PDF which "failed" is actually sitting
   there in need of extraction.
4. **`saflii.org` returns HTTP 403.** Use `acts.co.za` for South African regulations — it rendered
   the full R.262 schedule despite showing subscription prompts.

---

## 11. Late addition — the Pressure Equipment Regulations themselves, read in full

**This section was added after §9 was written and supersedes entries B3 (in part), B4 and B7 in
§9.2.** `saflii.org` returned HTTP 403, but `acts.co.za` — the site that worked for R.262 — carries
the Pressure Equipment Regulations too. Both pages read **15 October 2026**.

### 11.1 Regulation 17, verbatim — **PRIMARY-VERIFIED**

`https://www.acts.co.za/occupational-health-/per_nr734_17_gas_reticulation_equipment_and_systems.php`

> **17. Gas reticulation equipment and systems**
>
> (1) No person shall—
>
> (a) handle, store or distribute any gas in any manner, which includes the filling of a container,
> other than in accordance with the relevant health and safety standard incorporated into these
> Regulations under section 44 of the Act;
>
> (b) install or remove an appliance, pressure equipment or system for gas in any manner other than
> in accordance with the relevant safety standard incorporated into these Regulations under
> section 44 of the Act;
>
> (c) install or remove a gas appliance, or a gas system or a gas reticulation system, unless such
> person is an authorised person; or
>
> (d) use pressure equipment or systems for gas in any manner other than in accordance with the
> relevant safety standard incorporated into these Regulations under section 44 of the Act.
>
> (2) After installation or re-installation, and before commissioning a gas system, the user shall
> ensure that an external inspection and a leak test are performed by an authorised person or an
> approved inspection authority as applicable in terms of subregulation (1)(c).
>
> (3) An authorised person or an approved inspection authority shall issue a certificate of
> conformity after completion of a gas installation, modification, alteration or change of user or
> ownership in the form of Annexure 1.

**This is the whole of regulation 17. There is no subregulation (4) and nothing further.**

### 11.2 What it settles

**B4 — does servicing require an authorised person? Largely answered, and the research's working
hypothesis was wrong.**

The research guessed that 17(1)(a) and (d), covering "handling" and "using", were "the likely hook"
for requiring an authorised person on servicing work. **They are not.** Read the four paragraphs
against each other: **(a), (b) and (d) impose a *standard-compliance* duty** — they say the work
must be done in accordance with the incorporated standard. **Only (c) imposes an *authorised
person* requirement**, and (c) is confined to "**install or remove** a gas appliance, or a gas
system or a gas reticulation system".

**The words "service", "servicing" and "maintain" appear nowhere in regulation 17.** Confirmed by
direct reading of the full text, not by absence in an extract.

So the honest position, which is stronger than what the pack currently has:

- **Servicing an existing installation, without installing or removing anything, is not on its face
  caught by the authorised-person requirement in 17(1)(c).**
- **But it is still caught by 17(1)(a) and (d)**: handling and using gas equipment must comply with
  the incorporated standard — which, for LPG, is SANS 10087. So servicing is regulated as to *how*
  it is done, just not as to *who* does it.
- And in practice almost any real service **does** involve removing and replacing a component — a
  hose, a regulator, a pigtail — which is "install or remove" and does require an authorised person.

**That last point is the publishable one, and it is our reasoning, not a quotation.** §7.2 issue 4
can be resolved better than by hedging: say that the regulation names an authorised person for
installation and removal, that servicing almost always involves both, and that the work must comply
with SANS 10087 whoever does it. The SAQCC Gas email (§8, question 3) is still worth sending to
confirm the registrar reads it the same way, but **the page no longer has to wait on it**.

**B3 — CoC validity. Half settled.** **No validity period, expiry, or renewal interval appears
anywhere in regulation 17 or in the Annexure 1 form.** The pack's bucket (b) wording — "no
statutory expiry" — is now verified against the regulation text rather than inferred. What remains
unverified is only whether **SAQCC Gas as registrar** applies an administrative validity period of
its own. That part still needs the email.

**Two further details worth correcting in the pack:**

1. **17(2) says "the *user* shall ensure"**, not the owner. The pack's bucket (a) calls this "the
   owner's pre-commissioning duty". It is the **user's** duty. On a tenanted property those are
   different people, and the pack separately flags leases as an open question.
2. **17(3) lists four triggers: "a gas installation, modification, alteration or change of user or
   ownership."** The pack's "four triggers" are right in number. Note "modification" and
   "alteration" are both there as separate words, and that "change of **user** or ownership" puts
   the lease question textually closer to yes than the pack assumes.

### 11.3 Annexure 1, the prescribed CoC form — **B7 RESOLVED**

`https://www.acts.co.za/occupational-health-/per_nr734_annexure_1_certificate_of_conformity_for_gas_installations.php`

The gazetted form, headed "CERTIFICATE OF CONFORMITY FOR GAS INSTALLATIONS / OCCUPATIONAL HEALTH
AND SAFETY ACT, 1993 / Regulation 17(3) of the Pressure Equipment Regulations, 2009", is **a single
page**. It captures: the authorised person's name, **registration number** and ID number, address
and telephone; the installation's street, stand number, building name, farm name and number,
township/municipality/district; the **name of the gas supplier**, **type of gas**, and **amount of
gas stored on premises in kg**; then the declaration and signature.

The declaration, verbatim:

> "and that, in terms of regulation 17(3), the installation complies with the provisions of 17(2)
> and that the installation is safe.
>
> I am aware that I am liable to prosecution in the case of a false declaration."

**This answers the pack's open item on the five-page form.** The **gazetted** form is this one-page
declaration. The **five-page** form the market knows is the **SAQCC Gas digital CoC** — i.e.
**registrar practice layered on top of the regulation, not the prescribed form itself.** The pack
can now say that cleanly instead of flagging it as unknown.

**Two things to carry into copy:**

- The form has **no expiry field, no "valid until", and no renewal date.** That is the strongest
  single piece of evidence for "no statutory expiry" — the prescribed form has nowhere to put one.
- The pack's bucket (a) item "the false-declaration line" is **verified verbatim** above, and it is
  a one-line sentence worth quoting exactly as it stands.
- The form requires the **amount of gas stored on premises in kg** — which is the figure that
  decides whether the City of Cape Town's 100 kg flammable-substance-certificate threshold (§1.1)
  is crossed. The two documents interlock, and that is a genuinely useful thing to explain on a
  page.

### 11.4 Revised patch entries

| # | Supersedes | Verdict |
|---|---|---|
| **P15** | §9.2 **B4** | **Mostly cleared.** Regulation 17 read in full. "Service" and "maintain" do not appear; only 17(1)(c) requires an authorised person and it is limited to install/remove; (a), (b) and (d) require compliance with the standard. §7.2 issue 4 can be resolved by reasoning rather than hedged. The email question stays as confirmation, not as a blocker |
| **P16** | §9.2 **B3** | **Half cleared.** "No statutory expiry" is now verified against the regulation text and the prescribed form, which has no expiry field. Only the question of a SAQCC Gas *administrative* validity period remains open |
| **P17** | §9.2 **B7** | **Cleared.** The gazetted Annexure 1 CoC form is **one page**. The five-page form is the SAQCC Gas digital CoC — registrar practice, not the prescribed form |
| **P18** | §5.3 bucket (a), "the owner's pre-commissioning duty" | **Correction.** 17(2) places the duty on the **user**, not the owner. Change the wording |
| **P19** | §(c), "whether a lease triggers a CoC" | Still open, but note that 17(3) says "change of **user** or ownership" in terms — the textual case for a lease triggering one is better than the pack allows |

**B1, B2, B5, B6, B8, B9 and B10 in §9.2 are unchanged and remain blocked.**
