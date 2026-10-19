# Gas on the energy site — part 2: draft copy, SEO, compliance guardrails

**Compiled:** 15 October 2026 · **Updated:** 19 October 2026 · **Status:** draft copy, not reviewed against the live page
**Part 1:** [`gas-service-pack-1.md`](gas-service-pack-1.md) — the case, the position, the page map
**Research:** [`research/reports/SA gas installation market pack.md`](research/reports/SA%20gas%20installation%20market%20pack.md) · **Verification pass 2:** [`research/gas-verification-pass-2.md`](research/gas-verification-pass-2.md)

Everything in square brackets is a placeholder or a verification gate. **Do not fill one by
guessing.** `[VERIFY: …]` means the figure exists in the research but only against a superseded
edition of the standard — §5 says how to clear it.

---

## 1. Hero — three variations to choose between

The page only needs one. They lead on different things, so pick the one that matches where we
think the visitor is coming from.

### Variation 1 — The law (recommended)
Leads on the thing the whole position rests on, and nobody else leads on it.

> **Eyebrow:** Sunlogic Gas
> **Heading:** Only an Authorised Person |May Install Your Gas
> **Body:** Regulation 17 lets nobody but an authorised person install or remove a gas appliance, and wants a Certificate of Conformity when it goes in, when it changes, and when the property changes hands. We do the work and we issue the certificate.
> **Primary:** Book Your Free Site Visit → `contact.html`
> **Ghost:** What a Service Covers → `#servicing`

### Variation 2 — The trades
Leads on what makes us different from a gas-only installer.

> **Eyebrow:** Sunlogic Gas
> **Heading:** Solar, Electrical and Gas |From One Contractor
> **Body:** A gas hob needs an isolator above hob level and an oven that isn't on a plug. Most gas installers subcontract that part or leave it. We hold both trades, so one team does the work and one trail of certificates comes out of it.
> **Primary:** Book Your Free Site Visit → `contact.html`
> **Ghost:** See the Numbers Honestly → `#the-numbers`

### Variation 3 — The transfer
Leads on the most reliable demand stream in the market.

> **Eyebrow:** Sunlogic Gas
> **Heading:** A Transfer Needs More |Than One Certificate
> **Body:** Electrical, gas, plumbing, solar. Four separate documents, four separate trades, and usually four separate appointments before the attorney can proceed. We issue [CERTIFICATES WE ISSUE IN-HOUSE] on one site visit.
> **Primary:** Book Your Free Site Visit → `contact.html`
> **Ghost:** Selling or Buying? → `#certificates`

**Hero photograph: stock, placed 19 October 2026.**
[Pexels 4063198, "Black and Blue Gas Stove" by Honye Sanges](https://www.pexels.com/photo/black-and-blue-gas-stove-4063198/) —
four lit burners shot almost black. [Pexels licence](https://www.pexels.com/license/): free for
commercial use, attribution not required, and the restrictions that do exist (no selling
unaltered copies, no use as a trademark) do not bite here.

Source 6000x4000, centre-cropped to 2:1 and emitted at 640 / 1024 / 1440 / 1920 at quality 80,
matching what `scripts/build-site.js` does to every other image. It compresses to **35 KB at
1920** against 264 KB for `solar-hero.webp`, because the frame is nearly all black.

**It is still a flame shot, which the research warned is the competitor cliche.** It earns its
place for now because it is dark enough to carry white hero text without extra scrim, and it is
restrained rather than a macro blue ring close-up. **The brief below stands and should replace
it:** a cylinder bank or bulk tank installed cleanly against a Cape Town house wall, in the dusk
register of `hero-energy.webp`. With a real gas track record behind the business, our own
installation photography would beat any stock image here, and no competitor could copy it.

---

## 2. Trust strip

Three items, all provable, matching the pattern on `index.html`. A supplier's name is not a
credential of ours.

> SAQCC Gas registered practitioner
> Certificate of Conformity on every job
> Electrical, solar and gas from one contractor

**No registration number.** The research argued for publishing one, because only two of seven
competitors do. Overruled on 19 October 2026: Sunlogic does not publish it. Do not reintroduce
a `[REGISTRATION NUMBER]` placeholder here.

---

## 3. Section copy

### 3.1 The legal frame · `bg="page"` · `id="the-certificate"`

> **Eyebrow:** The certificate
> **Heading:** The Certificate Is the Job, |Not the Paperwork
> **Body:** Gas work in South Africa runs on regulation 17 of the Pressure Equipment Regulations, 2009, under the Occupational Health and Safety Act 85 of 1993. It is short, and it is worth reading properly, because the version of it that circulates is subtly wrong — in a way that decides whether the certificate on your installation is worth anything.

Prose:

The regulation prohibits any person from installing or removing a gas appliance, gas system or
gas reticulation system unless that person is an authorised person. It then defines an
authorised person, in its own words, as "a person who is registered as competent within the
scope of work".

SAQCC Gas is not named anywhere in it. The Department of Employment and Labour mandated SAQCC
Gas to do that registration, which is why in practice it means a currently registered SAQCC Gas
practitioner — and why the **category** matters as much as the registration.

"Within the scope of work" is the part people skip. So ask for the number and the category, not
just the word "registered": a practitioner registered for domestic work is not registered for
your restaurant, and a certificate issued outside someone's category is a certificate issued by
someone the regulation does not call an authorised person.

**When a certificate is required**

Four triggers, and they are the regulation's own words: installation, modification, alteration,
or change of user or ownership. The last one is why your conveyancer asks for a gas certificate
when you sell.

**The duty is the user's, not only the contractor's**

Regulation 17(2) puts it on the **user** — that is the regulation's own word, and on a tenanted
property the user and the owner are not the same person. After an installation or
re-installation, and before the installation is used, the user must ensure an external
inspection and a leak test by an authorised person. A contractor who disappears after the
install has not transferred that duty to anybody. It stayed where the regulation put it.

**And one thing almost nobody is told**

The certificate covers the installation, not the appliance. No stove, heater, braai, hob or
geyser is certified by it. The form also records the mass of gas stored on the premises, and
carries a line the person issuing it signs: *"I am aware that I am liable to prosecution in the
case of a false declaration."*

SAQCC Gas announced that paper certificates would stop being valid on 1 April 2023, and gas
certificates are issued electronically now. Worth knowing what the certificate actually is: the
form the regulation prescribes is **a single page** — the authorised person's name and
registration number, where the installation is, who supplies the gas, what type it is, how many
kilograms are stored on the premises, and the declaration. The longer digital certificate the
industry works with is the registrar's own, layered on top of that one.

That kilogram figure is not a formality either. It is the same number that decides whether a
business crosses the City of Cape Town's threshold for a flammable substance certificate — see
further down.

---

### 3.2 Residential scope · `bg="alt"` · `id="at-home"`

> **Eyebrow:** At home
> **Heading:** Flue or No Flue Decides |Most of the Job
> **Body:** The standard draws its own line, and it is not the one people expect. A hob in a properly ventilated kitchen is one kind of job. A bath-size water heater, a shower or a high-output heater has to vent to outside air, and that changes where it can go, what the room needs, and what it costs.

`dl-grid cols="3"` of `dl-card`. Icons: [ICON — pick from `shared/icons.js`; no gas-specific
mark exists in the set, so this needs a decision rather than a guess].

| Card heading | Body |
|---|---|
| Hobs and Stoves | Gas line, isolator and oven circuit as one job rather than two trades on two days. |
| Instant Hot Water | Hot water that doesn't keep a tank warm all night. Internal or external unit, flued where the standard requires it. |
| Fireplaces and Heaters | Flued and vent-free. A vent-free unit brings a room-volume rule with it, and bedrooms and bathrooms have rules of their own. |
| Braais and Patio | Built-in braais and patio heaters, installed to the manufacturer's requirements inside the SANS 10087 framework. |
| Whole-House Reticulation | One supply, several appliances, pipe sized so the furthest burner still works with everything running. |
| Cylinders and Changeover | Sized on what you draw on a cold morning, not on how much gas fits. |

Prose, after the grid:

**Why a cylinder goes cold halfway through a shower**

It is almost never the appliance. A cylinder does not just hold gas, it has to boil it, and how
fast it can do that depends on the size of the cylinder, how much liquid is left in it, and how
cold the morning is. Draw gas faster than the cylinder can vaporise it and the pressure falls,
the cylinder frosts over, and the flame dies — with gas still in the bottle.

That is a sizing fault, not a fault in your geyser, and replacing the geyser will not fix it.
[VERIFY: vaporisation rate by cylinder size, SANS 10087-1:2026 Ed. 7.01, Table 1 in the 2008 edition] [VERIFY: cylinder
count required for a multipoint instantaneous water heater]

The national rule of thumb is written for Highveld winters. Cape Town's are milder, so it runs
conservative here — which is another way of saying we size on what your property actually
draws rather than on a table.

**One more thing worth knowing: Cape Town gas is LPG gas.** There is no reticulated natural gas
anywhere in the Western Cape — the only thing that exists is a provincial pre-feasibility study
on a Saldanha–Cape Town corridor. If you have an appliance set up for natural gas, imported or
moved down from Gauteng, it has to be converted to LPG: smaller injectors, the simmer screw
re-set, the right regulator pressure and a new data plate.

---

### 3.3 Commercial · `bg="page"` · `id="commercial"`

> **Eyebrow:** Commercial
> **Heading:** Commercial Gas Is Risk Management, |Not Bigger Appliances
> **Body:** The difference between a kitchen at home and a kitchen in a restaurant is not the size of the burners. It is that past a certain stored mass the job stops being between you and your installer, and starts involving the City.

Six steps as a numbered sequence, navy on the last card only:

1. **How much is on site.** Indoor mass limits are set by what kind of building it is, and they
   decide whether the supply can be inside at all. For most commercial kitchens, it cannot.
   [VERIFY: indoor mass limits by occupancy class]
2. **Where it goes instead.** Outside, with separation distances from openings, drains and the
   boundary — and relaxations that matter on a tight city plot.
   [VERIFY: every separation distance and relaxation]
3. **More than two cylinders.** That becomes a manifolded bank with limits of its own on how
   many per branch and per installation. A changeover device is not a manifold.
   [VERIFY: manifold limits]
4. **Over 500 litres in one vessel.** The job leaves SANS 10087-1 and falls under Part 3,
   which covers "installations involving storage vessels of individual water capacity exceeding
   500 L" — a different standard and a different scope of work. *(Not Part 2. Part 2 is
   "installation of LPG systems in mobile units, including but not limited to caravans, motor
   homes, park homes and mobile kitchens", whatever you have read elsewhere. Both scopes are
   now verified verbatim against the SABS listing and the gazetted schedule.)*
5. **The City.** In the City of Cape Town, LPG over 100 kg — or under 100 kg where the gas pipe
   is embedded in the concrete floor — needs approved plans and a flammable substance
   certificate application to the Fire and Rescue Service, through Building Development and
   Planning. Requirements vary by municipality, so Stellenbosch, Drakenstein and the rest are
   their own conversation. *(Verified against the City's own requirements document. Note it
   cites the National Building Regulations and Building Standards Act, not the Community Fire
   Safety By-law, and it is a 2016 document — so say "in the City of Cape Town", never "in the
   Western Cape".)*
6. **(navy) The fire department.** The standard's own instruction is that the local fire
   department be consulted at an early stage when LPG storage is planned on a site. Early, not
   at inspection.

Prose:

A restaurant with a wood-fired or commercial oven needs a **second, separate** application under
the Air Quality Management By-law. It is a different department and a different timeline, and it
is the one that catches people out.

*Internal note — judgement call for the client:* the research verified that the City attributed
a September 2022 Woodstock eatery explosion to a by-law contravention involving two 48 kg
bottles against the indoor limit (News24). It is sourced and local and it would land. It also
reads as fear-selling on a service page, and the research warns against extrapolating a general
statistic from one incident. **Recommendation: leave it off the page, keep it for a commercial
compliance guide where the context carries it.**

*Scope warning:* commercial **appliance** specifics — ranges, fryers, grills, combi ovens, wok
burners — have **no South African source** in the research. Sell the compliance framing, which
is verifiable. Do not publish equipment sizing or ratings.

---

### 3.4 The numbers — ~~`bg="alt"`~~ **CUT, 19 October 2026. Do not rebuild.**

> Cut on Stephan's instruction: *"I don't want a gas vs discussion."* The running-cost
> comparison is not on `gas.html` and should not be added. The draft below is kept only as the
> record of what the verified numbers actually say, so that nobody re-derives a weaker version
> of it for an email, a quote or a lead call. **Everything from here to the end of 3.4 is
> internal.** The page's own argument for gas is in 3.2 — flame control, hot water that does
> not run out, and working when the power is off.

This is the section that will either build trust or lose it. Written straight, it is the most
differentiated thing on the page, because no competitor says any of it.

> **Eyebrow:** The numbers
> **Heading:** Gas Wins on Hot Water. |It Loses on Cooking.
> **Body:** We sell heat pumps and solar as well, so we have no reason to tell you gas is cheaper than it is.

Prose:

On our own costing at October 2026 prices, gas beats a City of Cape Town element geyser on the
Domestic tariff by a wide margin. It roughly ties Eskom's Homelight 60A. It loses to Homelight
20A and to the Lifeline tariff outright. And it loses badly to a heat pump, which runs at about
half the cost of gas and goes on doing so for as long as you own it. We will show you the
working at the site visit, for your tariff and your hot-water use. [VERIFY: the per-kWh figures.
The calorific value is now sourced — Afrox Handigas, net 45.8 MJ/kg at 25 °C, so 12.72 kWh/kg,
and say so on the page. **Appliance efficiencies are still entirely unverified**, and the hob
figures are what drive the "cooking costs more" conclusion, so that claim stays gated]

Cooking goes the other way, and we are not going to pretend otherwise. A gas hob costs more to
run than a radiant electric plate, and noticeably more than induction. The amounts are small,
because cooking is a minor share of what a household spends on energy — but if somebody tells
you a gas hob will save you money, they have not done the sum. Buy a gas hob for the flame, the
control, and the fact that it works when the power is off. [VERIFY: hob running-cost comparison]

**So why gas at all**

Because of what the two prices are *doing*, not what they are. Gas is not a cheaper unit of
energy. It is a unit of energy whose price has not moved in three years.

Coastal LPG was 3,457 cents a kilogram in January 2024 and 3,456 cents in October 2026.
Thirty-three months, and no change at all in nominal terms. Over the same period electricity
rose 12.74% in April 2025 and 8.76% in April 2026, and a further 8.83% is already approved for
April 2027 — after NERSA found a R54.7 billion error in its own calculation of what Eskom is
allowed to recover.

Gas is also priced in a way you can audit. The maximum retail price per kilogram is regulated
and published every month, broken out to the refinery gate price, transport, operating costs
and a fixed retail margin. For 7 October to 3 November 2026 the regulated maximum for LPG
imported through Saldanha Bay — which is how the Western Cape is supplied — is R37.08 a
kilogram.

**Three things worth knowing before you commit**

The regulated price resets every month, in both directions. It rose 15.5% in a single
adjustment between April and May 2026, then fell 11.7% between July and August. Electricity
steps once a year on an announced percentage. Gas does not, and you carry that.

Gas reduces your kilowatt-hours, not your fixed charges. A connection charge is payable whether
you draw anything or not, and Eskom has been moving more of the bill into that fixed portion —
so an energy saving is never an equal saving on the bill.

And if you are on Lifeline or Homelight 20A, or a heat pump fits your budget, say so at the site
visit. We will tell you gas is the wrong answer and quote you the right one.

*Copy note:* every rand and percentage in this section except the `[VERIFY]` lines is
primary-sourced — gazetted LPG prices, the Eskom 2026/27 tariff booklet, the NERSA statement.
It is the most defensible section on the page. Keep the dates on the figures; they are what make
it defensible.

---

### 3.5 Servicing · `bg="page"` · `id="servicing"`

The biggest gap in the market. **Zero of seven competitors sells this.**

> **Eyebrow:** Servicing
> **Heading:** A Service Is a Test Sheet, |Not a Look Around
> **Body:** No South African regulation sets a service interval for a gas installation — the words "service" and "maintain" do not appear in regulation 17 at all. What does exist: a standard the installation has to comply with whoever touches it, consumables with defined replacement ages, and a coastline that is hard on all of them.

What a service covers:

- **Staged pressure testing** — high pressure, intermediate where it is used, then low pressure
  on a manometer. Each stage has its own test pressure and its own hold time, and a drop inside
  the hold means a leak. [VERIFY: test pressures and hold times]
- **A regulator performance check** against numeric limits, taken three ways: all burners
  alight, the smallest alight, and everything off. [VERIFY: the three limits]
- **Pipe sizing checked under load**, at the furthest and highest-consumption burner with
  everything running. [VERIFY: minimum working pressure]
- **Corrosion inspection** through pipework, valves, the relief valve, the regulator and the
  cylinder itself.
- **Consumables replaced on age, not on appearance** — hoses and pigtails, the hydrostatic
  relief valve, the regulator. A hose that looks fine and is past its age is still past its age.
  [VERIFY: replacement age for each]
- **Ventilation checked**, including that the vents cannot be blocked. That is the most common
  real-world failure and the easiest one to cause by accident with a shelf.
- **A written record, and the next date.**

**Who is allowed to service it**

Regulation 17 names an authorised person for one thing: installing or removing a gas appliance,
a gas system or a gas reticulation system. It says nothing about servicing, and the words
"service" and "maintain" do not appear in it. Separately, it does require that gas equipment be
handled and used in accordance with the standard — so servicing is regulated as to *how* it is
done, whoever does it.

In practice that distinction rarely survives contact with a real service. Replace a hose, a
regulator or a pigtail and you have removed something and installed something, which is squarely
an authorised person's work. *(That reading is ours, from the text of regulation 17. Present it
as our position, not as a quotation.)*

**Why we shorten the interval at the coast**

The standard sets a maximum and then says, in its own words, that where conditions demand it the
period should be reduced. Its service checklist comes back to corrosion again and again —
pipework, valves, relief valve, regulator, cylinder condition — and its siting rules tell
installers to keep away from corrosive conditions. Salt air off the Atlantic is a condition that
demands it. On a seafront property we service more often than the maximum and we put the reason
in writing. [VERIFY: the maximum interval, and the quoted wording, against SANS 10087-1:2026 Ed. 7.01]

**A certificate is not a service**

A Certificate of Conformity records that an installation conformed on the day it was issued.
Nothing in it maintains your hoses, and it does not come with a date on which your gas becomes
unsafe — there is no validity period, renewal interval or expiry anywhere in regulation 17, and
the certificate form the regulation prescribes has no expiry field and nowhere to put one.
[VERIFY: whether SAQCC Gas as registrar applies an administrative validity of its own. The
regulation does not — that much is now read, not inferred]

**We service installations we did not put in.** Most of the ones we see were not ours.

---

### 3.6 Certificates and property transfer · `bg="alt"` · `id="certificates"`

> **Eyebrow:** Buying or selling
> **Heading:** Four Certificates, |One Site Visit
>
> *Do not ship this heading until decision 3 in part 1 is settled.* If we can only issue two of
> the four ourselves, "Four Certificates, One Site Visit" is a promise the page breaks. The safe
> alternative, which works whatever the answer is: **"The Certificates a Transfer |Actually Needs"**.
> **Body:** A property transfer can need an electrical certificate of compliance, a gas certificate of conformity, a plumbing or water certificate, and where there is solar, a PV GreenCard. Four documents, usually four trades, usually four appointments.

Prose:

[CERTIFICATES WE ISSUE IN-HOUSE — confirm against decision 3 in part 1] we issue ourselves.
[CERTIFICATES WE COORDINATE] we coordinate. One site visit, one set of dates, and one person to
phone when the attorney needs something.

**If you are selling**

The gas certificate is required on change of ownership. That is the regulation's own trigger,
not your attorney's preference — and conveyancers will not proceed to transfer without one. Get
it before the offer rather than during the transfer, because an installation that needs work is
a negotiation when you have time and a problem when you don't.

**If you are buying**

Ask what the certificate covers, because it covers the installation and not the appliances, and
it was true on the day it was signed. If the house has gas and nobody can produce a certificate,
that is a thing to price in.

---

### 3.7 How it runs · `bg="inverse"` · `id="how-it-works"`

Five numbered steps. Navy on the last card only — it is the final step of a numbered sequence,
which is the only place navy is allowed.

1. **Site visit.** We look at where the gas comes in, where it has to get to, and what is in
   between. Free, and it is the only way to size anything honestly.
2. **Design and quote.** Appliance list, cylinder or tank sizing on cold-morning draw, pipe
   route, ventilation, and the electrical work the job carries. In writing, with what is and
   is not included.
3. **Install.** One team. The gas line and the electrical work on the same visit.
4. **Test and certify.** Staged pressure testing and a leak test before anything is
   commissioned, then the Certificate of Conformity, issued electronically in the name of the
   practitioner who did the work.
5. **(navy) Service plan.** A date, an interval set on where you live rather than on the
   maximum allowed, and a reminder when it comes round.

---

### 3.8 FAQ · `bg="page"` · `id="questions"`

> **Heading:** Questions We Get |Before the Quote

The research calls this the highest-leverage content play available in the niche. The market's
most-asked question — how long a gas certificate is valid — has **four mutually incompatible
answers circulating and three different bodies each named as the sole issuer.** Nobody resolves
it against the regulation. A page that *arbitrates* a contradiction with a primary citation is
worth more than one that merely asserts an answer.

Two of these answers cannot be written until §5 is cleared. They are marked.

**Who is allowed to install gas in South Africa?**
Only an authorised person. Regulation 17(1)(c) of the Pressure Equipment Regulations, 2009
prohibits anyone else from installing or removing a gas appliance, gas system or gas
reticulation system, and the regulation defines an authorised person as "a person who is
registered as competent within the scope of work". The Department of Employment and Labour
mandated SAQCC Gas to do that registration, so in practice it means a currently registered
SAQCC Gas practitioner holding the right category for your job.

**Is a "Certificate of Compliance" the same as a "Certificate of Conformity"?**
Yes. People search for both and the industry uses both. The document the regulation prescribes
for gas is a Certificate of Conformity. *(No competitor page in the research explains this, and
both phrasings are real search queries.)*

**Do I need a gas certificate to sell my house?**
Regulation 17(3) requires a Certificate of Conformity to be issued on change of ownership of a
property with a gas installation, and conveyancers will not proceed to transfer without one.
*(Safe wording — do not write that the law prohibits transfer. The regulation imposes a duty to
issue; the transfer bar is conveyancing practice and the sale agreement.)*

**How long is a gas certificate valid?**
There is no statutory expiry date. We have read regulation 17 in full: it contains no validity
period, no renewal interval and no expiry. The certificate form the regulation prescribes has no
expiry field and nowhere to put one. What is true instead is that a fresh certificate is
required on each change of user or ownership, and that the installation should be re-inspected
periodically — which is a different thing from a certificate running out.

*This is the arbiter answer and it is now defensible, which it was not a week ago.* Two things
still gate the full version: the **five-year** re-inspection interval is read from the
superseded 2008 edition of SANS 10087-1 and stays in bucket C until the current edition is in
hand, and whether **SAQCC Gas as registrar** applies an administrative validity of its own is
still unanswered. Publish the two sentences about the regulation; leave the number out until
both are closed. Never publish "valid for five years" or "valid for two years" as law.

**Does the certificate cover my stove?**
No. It covers the installation — the supply, the pipework, the ventilation, the connections —
not the appliances connected to it.

**Will my insurance pay out if I don't have one?**
Insurers have stated that a claim for gas-related damage can be declined where the installation
was not done by a registered installer and there is no certificate of conformity. *(Safe
wording. Never write "insurers will repudiate your claim" — no South African ombudsman
determination, reported judgment or policy wording making a CoC a condition precedent to cover
was found in the research.)*

**Is gas cheaper than electricity?**
For heating water on a City of Cape Town Domestic tariff, yes, by a meaningful margin. On
Lifeline or Eskom Homelight 20A, no. Against a heat pump, no — a heat pump runs at about half
the cost. For cooking, no: a gas hob costs more to run than a radiant plate. The honest argument
for gas is not today's price, it is that the regulated LPG price has been flat for nearly three
years while electricity has risen 22.6% in two. [VERIFY: the per-kWh figures behind this]

**Can I run a gas geyser alongside my existing electric geyser?**
[Answer this. It is a documented gap — a real MyBroadband thread with no competitor page
answering it. Needs our own engineering position, written as ours and not as standards practice.]

**Can I convert my electric geyser to gas?**
[Answer this too. Same situation: documented demand, no competing page found.]

**How often should a gas installation be serviced?**
No South African regulation sets an interval — "service" and "maintain" do not appear in
regulation 17. The standard sets a maximum re-inspection interval and allows it to be shortened
where conditions demand, which on the Cape coast they do. Treat servicing as risk protection,
not as a legal requirement. [VERIFY: the maximum interval figure itself]

**Do you service installations you didn't install?**
Yes, and most of what we service was put in by somebody else. We will tell you what we find
before we touch anything, including if the honest answer is that it needs replacing rather than
servicing.

**Is there natural gas in Cape Town?**
No. There is no reticulated natural gas anywhere in the Western Cape; the only thing in
existence is a provincial pre-feasibility study on a Saldanha–Cape Town corridor. Cape Town gas
work is LPG work. If you have an appliance configured for natural gas, it needs converting.

**Do I need council approval for a restaurant kitchen?**
In the City of Cape Town, LPG over 100 kg — or under 100 kg where the gas pipe is embedded in
the concrete floor — needs approved plans and a flammable substance certificate application to
the Fire and Rescue Service. A wood-fired or commercial oven needs a second, separate
application under the Air Quality Management By-law. Requirements vary by municipality, so
confirm yours before you sign a lease. *(Both thresholds verified against the City's own
requirements document. Keep the wording "in the City of Cape Town".)*

---

### 3.9 Closing CTA

> **Heading:** Find Out What Your Installation |Would Actually Need
> **Body:** A free site visit, a straight answer on whether gas is the right call for your property, and a written quote either way.
> **Action:** Book Your Free Site Visit → `contact.html`

---

## 4. SEO and structured data

### 4.1 Head

- **Title:** `Gas Installation and Servicing Cape Town | Sunlogic Energy`
- **Description:** `SAQCC Gas registered installation, servicing and Certificates of Conformity for homes and businesses in Cape Town. Gas, electrical and solar from one contractor.`
- **Canonical:** `https://energy.sunlogic.co.za/gas`
- **OG/Twitter:** same title and description, `og:image` = [hero image pending]
- Add to `sitemap.xml`, and to `llms.txt`.

### 4.2 Schema — three traps to avoid

The market's best-marked-up page gets this wrong, so there is easy ground here.

1. **`GasInstallationService` does not exist.** It returns HTTP 404 on schema.org, and there is
   **no gas-specific LocalBusiness subtype** in schema.org 30.1. Use
   **`HomeAndConstructionBusiness`** (or `ProfessionalService`) in one consolidated `@graph`,
   with `Service` nodes per offering and `areaServed` as explicit `City` nodes mirroring our
   Google Business Profile service areas.
2. **FAQ rich results are dead.** Google removed them from Search on **7 May 2026** and deleted
   the documentation on 15 June 2026. Both Cape Town competitors with the strongest markup still
   implement `FAQPage`. Keep the markup for machine comprehension, expect no visual gain, and
   treat anyone selling FAQ rich snippets in 2026 as selling a dead feature.
3. **`HowTo` has produced no visible result since 2023.** Cosmetically pointless.

Two things worth adding that **no Cape Town installer does**:
- **`Offer` + `PriceSpecification` on any price we actually publish.** The strongest page in the
  niche (Kandua's cost guide) uses it; no installer does.
- **`AggregateRating` / `Review`** — implemented by **none of the seven competitors**. Clean
  differentiation, but only on genuinely collected reviews.

### 4.3 Keyword clusters and build order

**No search volumes were obtainable** — Keyword Planner needs an authenticated Ads account and
no published South African dataset surfaced. Priorities below are reasoned from supply-side
signals: the headings, slugs and titles Cape Town installers and SA cost-guide publishers have
actually built. **Pull Keyword Planner geo-targeted to Cape Town, Search Console query data, and
dated `google.co.za` SERP screenshots from a Cape Town IP before committing any budget.**

Three demand centres, with suburb geography as a thin but real secondary layer — proven
monetisable by Snupit and Kandua running service-by-suburb URL templates at scale.

| Priority | Cluster | Intent | Gets |
|---|---|---|---|
| 1 | gas installation Cape Town · gas installers near me · gas fitter Cape Town | Local / transactional | The `gas.html` money page |
| 2 | gas certificate of compliance · gas CoC · gas certificate for house sale · SAQCC registered installer | Commercial investigation | Its own page — this is the recurring demand stream |
| 3 | gas geyser installation · gas hob installation · gas stove installation · gas fireplace installation | Transactional | One page per appliance, after the two above |
| 4 | gas installation cost South Africa · is gas cheaper than electricity | Informational | A cost pillar, 3,000+ words |
| 5 | gas appliance service · gas leak repair · gas geyser repair | Transactional | Servicing and emergency repair page |
| 6 | commercial gas installation · restaurant gas installation · commercial kitchen gas compliance | Commercial | Separate commercial page |
| 7 | convert electric geyser to gas · gas geyser alongside electric geyser | Informational | **Two clean structural gaps — documented demand, no competing page found** |
| 8 | suburb variants (Claremont, Southern Suburbs, Somerset West, Durbanville, Atlantic Seaboard…) | Local | Only where real service evidence exists |

### 4.4 Supporting content, in order

The first two are the ones worth writing regardless of anything else.

1. **How long is a gas certificate actually valid?** — the arbiter piece. Four incompatible
   answers circulating, three bodies each named as issuer, nobody resolving it. **Blocked on §5.**
2. **Who may issue a gas certificate in South Africa** — correcting the LPGSA error (see §5.4).
3. Converting an electric geyser to gas — documented gap.
4. Running a gas geyser alongside an electric one — documented gap.
5. What a gas service covers, test by test.
6. What a restaurant needs before it opens: the three-layer municipal stack.
7. Gas, heat pump or solar for hot water — the honest comparison.
8. Why your cylinder freezes in winter.
9. Certificates a property transfer needs.
10. What the certificate does not cover.
11. Gas safety at home, without the scare copy.
12. Cylinder placement and clearances — **blocked on §5**; publishing wrong clearance figures is
    a safety matter.

### 4.5 Local SEO

- GBP categories reported as available: "Gas installation service", "Gas company", "Gas
  engineer" — from third-party scrapes 1–2 years old, and category availability is
  country-dependent. **Confirm in the dashboard.**
- **Review velocity, not review count, is the operative metric.** Hellopeter requires 10+
  reviews in the last 12 months before it scores a business at all — one competitor has 47
  reviews and no TrustIndex because of it.
- Directory tail that actually runs live gas listings in SA: Snupit, Kandua, Local Pros, iVote,
  Yellosa, Bark, GasProLink.
- **Two uncontested channels.** No Western Cape installer claims a supplier referral
  relationship or an "approved installer" badge from any LPG supplier — while Italfire publicly
  states a certified gas installer must do the gas line on its fireplace installs, which is an
  open, stated subcontract need. And the estate-agency and conveyancing handoff for
  sale-triggered certificates is being written about by attorneys while no installer sits at it.

### 4.6 Writing for AI answers

No AI Overview, ChatGPT or Perplexity citation could be observed for any target query, so this
is inferred from which passages propagated into synthesised answers. What travelled was
consistent and easy to copy:

- Short declarative sentences that still make sense lifted out of context.
- The registering body named in full on first use.
- The regulation cited with its number, parent act and date — "regulation 17(3) of the Pressure
  Equipment Regulations under the Occupational Health and Safety Act 85 of 1993" demonstrably
  travels.
- Explicit numeric ranges with the date they were quoted.
- Named, dated credentials, including registration numbers.
- Year-stamped content. A competitor still running a `…-regulations-in-2025` slug reads as stale.

Most useful of all: the synthesised answers **surfaced the certificate-validity contradiction
rather than hiding it**, listing the competing numbers instead of picking one. That is why the
arbiter piece is worth more than anything else on the content list.

---

## 5. The verification gate

> **Updated 19 October 2026 after a second verification pass.** Six of seven targets closed, and
> the Pressure Equipment Regulations were read in full. Full report and the 19-item patch list:
> [`research/gas-verification-pass-2.md`](research/gas-verification-pass-2.md). **All patches are
> applied in this document.** What follows is what is *still* outstanding.

**Two purchases and one email now separate this pack from publishable copy** — down from four
purchases and four calls. The remaining `[VERIFY]` markers are concentrated in one place: the
inside of the paid standard.

### 5.1 Buy — R2,589.80, and it unlocks roughly a third of the page

1. **SANS 10087-1:2026, Edition 7.01 — R1,465.10** from the SABS store. *Note the edition: it is
   **not** "Edition 7 (2024)", which is what the first research pass assumed and what several
   competitors advertise. 7.01 is a 2026 revision, one step further from the 2008 edition every
   figure in this pack is currently read against.* Check first, in this order: the **consumable
   replacement ages and re-inspection interval** (the whole servicing product rests on them),
   the **electrical clearances in clause 9.1** (the whole trades positioning rests on them),
   then distances, ventilation areas, test pressures, vaporisation rates and manifold limits.
2. **SANS 10087-3:2015, Edition 5.00 — R1,124.70** — for commercial. Every bulk-tank distance is
   still a straight blank and no open copy exists. Buy this before any commercial page quotes a
   number.

**Done — do not redo:**
- ~~Part titles and scopes~~ — verified verbatim against the SABS listing. Part 1, 2 and 3 are
  as the pack states. **Part 7 was wrong in the research** and is corrected in bucket A.
- ~~Notice R.262 of 2017~~ — **read in full.** GG 40713, 24 March 2017. It replaced the whole PER
  schedule and lists SANS 10087 Parts 1, 2, 3, 4, 6, 7, 8 and 10 — **stating no edition year for
  any of them.** So no edition is pinned by law, and "the current edition applies" is *our
  reading*, to be published as ours or not at all. It also settles that **SANS 827 is not
  incorporated** (bucket D).

### 5.2 Email — one, and it is no longer a blocker

1. **SAQCC Gas** — a drafted email is in §8 of the verification report. Three questions remain:
   whether the registrar applies an **administrative validity period** to a CoC (the regulation
   does not — that is now read, not inferred); the **category codes** and the
   domestic/commercial/industrial boundary in kg, kW or vessel size; and confirmation that the
   registrar reads the servicing question the way §3.5 now does. **None of these stops the page
   going live** — each one has publishable wording already.

**Done — do not redo:**
- ~~City of Cape Town~~ — both documents opened. Tariffs settled, gas thresholds verified. The
  trick, for next time: `resource.capetown.gov.za` is genuinely unreachable, but every document
  on it is served identically from `https://www.capetown.gov.za/_documents/resource.capetown.gov.za/<same path>`.
- ~~LPG calorific value~~ — **Afrox Handigas: net 45.8 MJ/kg, gross 49.6 MJ/kg at 25 °C.** Use
  **net 45.8 MJ/kg = 12.72 kWh/kg** and state the basis and temperature on the page. The
  "46–50 MJ/kg" in the research was never a range; it was two different measurements.
- ~~Whether servicing needs an authorised person~~ — answered by reading regulation 17. See
  §3.5. The research's working hypothesis was wrong: 17(1)(a), (b) and (d) impose a
  *standard-compliance* duty, and only 17(1)(c) requires an authorised person, limited to
  install and remove.
- ~~The five-page prescribed form~~ — the **gazetted** Annexure 1 form is **one page**. The
  five-page version is the SAQCC Gas digital certificate: registrar practice layered on the
  regulation, not the prescribed form.
- ~~Google Business Profile categories~~ — not verifiable from outside the account by anyone,
  ever. It is a two-minute dashboard task, not a research item.

### 5.2a What is still genuinely blocked

| Item | Why |
|---|---|
| **Every** SANS 10087 distance, clearance, ventilation area, test pressure, hold time, consumable age, vaporisation rate, manifold and roof-mount limit, and indoor mass limit | Inside the paid standard. The second pass read **no clause** of it. The City's own requirements drawing corroborates **five** outdoor separation figures — but it is a 2016 municipal document referencing the old SABS 087 drawing set, so that is corroboration, not clearance |
| **All bulk-tank distances** (>500 L) | §5.1 item 2. Publish nothing |
| **All appliance efficiencies** — gas heater 78–88%, geyser 90%, heat pump COP 3.0, hob 40 / 70 / 84% | Entirely unverified, and **the hob figures are what drive the "gas cooking costs more" conclusion**, so that claim stays gated even though the calorific value is now sourced |
| SAQCC Gas **category codes** and the numeric trade boundary | §5.2. The six category *names* may now be stated |
| Whether a **lease** or a **single-appliance replacement** triggers a CoC | Needs legal input, not a lookup. Note that 17(3) says "change of **user** or ownership" in terms, so the textual case for a lease is better than the pack originally allowed |
| Any SAQCC **administrative** CoC validity period | §5.2 |

### 5.3 The writer's four buckets

*Revised 19 October 2026. Items the second pass moved are marked **new**.*

| Bucket | Rule |
|---|---|
| **A — Say it** | Regulation 17 and its four triggers — "a gas installation, modification, alteration or change of user or ownership" · the "authorised person" definition verbatim · **new:** 17(2) places the pre-commissioning inspection and leak-test duty on the **user**, not the owner · **new:** only 17(1)(c) requires an authorised person, and it covers install and remove only · **new:** the gazetted Annexure 1 certificate is **one page** and has no expiry field · the false-declaration line, verbatim · **new:** SAQCC Gas *announced* the end of paper CoCs from 1 April 2023 (administrative, citing no gazette) · SAQCC Gas mandated by DEL across four gas industries · **new:** the six LPG category *names* — Domestic, Commercial, Industrial, Rail or Road Tanker, Auto-gas conversion, and a specialised category · **new:** R.262 of 2017 lists SANS 10087 Parts 1, 2, 3, 4, 6, 7, 8 and 10 and pins **no edition year** · **new:** Part 1, 2, 3 and 7 scopes verbatim — and Part 7 is "storage and filling **premises** for refillable LPG containers of gas capacity not exceeding 19 kg", **not** filling ratios · **new:** MHI qualifying quantities for LPG and natural gas, UN 1075 — **20 / 50 / 200 tonnes** for low / medium / high hazard, below 20 t the regulations do not apply · **new:** City of Cape Town — over 100 kg, or under 100 kg with pipe embedded in the concrete floor, needs plans and a flammable substance certificate application · **new:** City of Cape Town Domestic 2026/27 — **413.79 c/kWh** to 600 kWh, **493.90** above, incl. VAT, plus **R74.77/month** credit or **R2.46/day** prepaid · **new:** Afrox Handigas net **45.8 MJ/kg** (12.72 kWh/kg) at 25 °C · R37.08/kg Saldanha regulated maximum, 7 Oct–3 Nov 2026 · LPG 3,457 → 3,456 c/kg, Jan 2024 → Oct 2026 · Eskom +12.74%, +8.76%, +8.83% approved · the NERSA R54.7bn error · 46.0% of Western Cape households use gas · no reticulated natural gas in the Western Cape · FAQ rich results removed 7 May 2026 · `GasInstallationService` is a 404 |
| **B — Only with the hedge** | CoC validity → **new, and stronger:** "no validity period, renewal interval or expiry appears in regulation 17, and the prescribed form has no expiry field" — then the re-inspection interval **without the number** until §5.1 is done · insurance → "a claim **can be** declined", never "will be repudiated" · transfer → "regulation 17(3) requires issuance on change of user or ownership and conveyancers will not proceed without one", never "the law prohibits transfer" · servicing → **new:** regulated as to *how*, not *who*, and in practice almost any service involves install-or-remove — **publish as our reading of reg 17** · which edition of a standard applies → **new:** R.262 pins none, so "the current edition" is our reading · City thresholds → "in the City of Cape Town", never "in the Western Cape"; cite it as a 2016 City document under the National Building Regulations Act · cost and payback → a dated, conditional range with the failure cases stated and the calorific value and efficiencies declared · prices → "as at October 2026" with scope stated · solar-plus-gas hybrids and fault diagnosis → **our own engineering position**, never "according to SANS" |
| **C — Verify first** | **Every** SANS 10087 distance, clearance, ventilation area, test pressure, hold time, consumable age, vaporisation rate, manifold and roof-mount limit, and indoor mass limit — still read only against the **2008 Edition 5**, and the current edition is now known to be **7.01 (2026)**, one revision further away than the pack first assumed. **All bulk-tank distances: no source at all, publish nothing.** Plus: **all appliance efficiencies** (these alone still gate the cooking-cost claim) · SAQCC category codes and the numeric trade boundary · any SAQCC administrative CoC validity · whether a lease or a single-appliance replacement triggers a CoC |
| **D — Never** | "The CoC must be issued by someone registered with the LP Gas Safety Association" — **wrong body, it is SAQCC Gas** · "commercial gas is done to SANS 10087-2" — **now primary-sourced as false: Part 2 is mobile units, commercial is Part 3** · "a CoC is valid for five years" or "two years" as law · "the law prohibits transfer without a CoC" · "no cylinders in cupboards" — the standard sets out cupboard *requirements* · **new:** "SANS 827 is legally mandated" — it is **not in the R.262 schedule**, so there is no live incorporation via the PER · **revised:** the MHI figures are no longer forbidden — **20/50/200 t are the real South African quantities**; what was Australian was the *two-tier* 200 t / 20 t framing with no 50 t middle band · **new:** "1 May 2023" as an electronic-CoC date — not in the SAQCC notice, drop it · "SANS 10087-1 Edition 7 (2024)" — **that is not what SABS sells**; it is 7.01, 2026 · UK gas-interlock rules (BS 6173, IGEM/UP/19) as SA law · any count of SA gas deaths, injuries or fires — **no SA statistics exist** · any claim of SA enforcement action in 2025–26 — none confirmed · any SANS clause number we have not read in the current edition · load-shedding in the present tense |

### 5.4 One error to correct everywhere, including in our own source material

**"A gas CoC must be issued by a person registered with the LP Gas Safety Association" is
wrong.** The registrar mandated by the Department of Employment and Labour is **SAQCC Gas**.
LPGSA runs a *product*-side regime — appliance, hose, regulator and cylinder verification
permits. This error propagates through conveyancing blogs, estate-agency pages, CPD listings
**and through two of the secondary sources quoted inside our own research notes.** Anything we
publish says SAQCC Gas.

---

## 6. Still open — flag, never guess

- ~~The SAQCC registration number.~~ **Decided: never published.** The trust strip is final.
- **Which certificates we issue in-house** vs coordinate. Blocks §3.6 entirely.
- **Icons.** There is no gas-specific mark in `shared/icons.js`. Needs a decision, not a guess.
- **Photography.** Hero and section images. Brief in §1.
- **Two FAQ answers** — gas alongside an electric geyser, and electric-to-gas conversion. Both
  are documented market gaps with no competing page, so they are worth writing properly, and
  both need our own engineering position.
- **Prices**, if we decide to publish a rate card. Ours, not Gauteng's.
- **Whether the commercial section launches with the page** or follows once Part 3 is in hand.
- **Who owns the monthly LPG price on the page** — the regulated maximum is re-gazetted every
  month and moved 22.9% peak-to-trough inside seven months. Either it gets a named owner and a
  monthly update, or the rand figure comes off the page and the section runs on the trajectory
  argument alone, which needs no maintenance. See §7.2, issue 1.
- **An orientation block before the legal section?** `copychief` flagged that the page opens
  cold — regulation before orientation. Three lines on what we install, for whom and where,
  between the trust strip and §3.1. It changes the page map in part 1 §6, so it is a decision.

---

*Checks run on this pack: `copychief` and `compliance-checker`. Findings and the fixes applied
are in §7 below.*

---

## 7. Review record

Both reviews were run on the §1–§3 draft on 15 October 2026. **The fixes below are already
applied in this document** — this section is the record of what changed and why, so the next
person does not undo it.

### 7.1 `copychief`

**Classification.** Long-form service page · organic local and direct traffic, not paid ·
Western Cape homeowners and business owners · mostly problem-aware and solution-aware (they
know they want gas, or know they need a certificate; they do not know the compliance frame) ·
mechanism: *one contractor, one certificate trail*.

**Big picture.** The big idea holds and is genuinely differentiated — a market selling savings,
answered with a page about the certificate. The lead is a proclamation lead and it earns the
position. The honest-economics section is the strongest thing on the page and the single hardest
thing for a competitor to copy, because saying it requires selling the alternative.

**The strategic weakness, not yet fixed: the page opens cold.** Sections 3.1 and 3.2 put
regulation before orientation. The reader's question on arrival is "can I trust these people and
what will this cost me", not "what does regulation 17 say". The regulation is the differentiator,
so it should stay high — but consider a short orientation block between the trust strip and
§3.1: three lines on what we install, for whom, where. **Flagged rather than written, because it
changes the page map in part 1 §6 and that is a decision, not an edit.**

| # | Issue | Fix applied |
|---|---|---|
| 1 | Hero V1 heading "Only an Authorised Person May Touch It" — "It" has no antecedent in the heading; the reader has to parse the body to decode the headline | Changed to **"Only an Authorised Person \|May Install Your Gas"**. Same proclamation, resolves on its own, and "Your" puts the reader in it |
| 2 | "the version that circulates in this industry is subtly wrong" — opens a loop and closes it on a definitional nicety. Writer-interest, not reader-interest | Payoff rewritten to reader stakes: the wrong version decides "whether the certificate on your installation is worth anything" |
| 3 | "the scope is the part people skip" — clever but abstract, gives the reader nothing to do | Rewritten to an instruction with a concrete consequence: ask for the number *and the category*; domestic registration does not cover your restaurant |
| 4 | "Three things we will tell you that nobody else will" — an unprovable claim about competitors, and slightly smug in a voice that is otherwise plain | Changed to "Three things worth knowing before you commit". Same three things, no claim |
| 5 | The economics section had no single line a skimmer could grab | Added: "Gas is not a cheaper unit of energy. It is a unit of energy whose price has not moved in three years." |
| 6 | "Do you service installations you didn't install? — Yes." A one-word answer on the page's best trust moment | Expanded to include that most of what we service is someone else's, and that we will say when replacement beats servicing |
| 7 | "Four Certificates, One Site Visit" is a promise the page cannot keep if we can only issue two | Gated on decision 3, with a safe alternative heading supplied that works whatever the answer is |

**Kill list.** Nothing to cut. The one thing to keep *out* of the page: the Woodstock explosion
reference in §3.3. It is sourced and local and it would land, and it is still fear-selling on a
service page. It belongs in a commercial compliance guide where the context carries it.

**What is working.** The disqualification line — *"if you are on Lifeline or Homelight 20A, or a
heat pump fits your budget, say so at the site visit and we will tell you gas is the wrong
answer"* — is the best line in the pack. It is the brand's existing "Straight Numbers, and
Someone to Call" voice, it is true, and no competitor can run it. The cylinder-vaporisation
explanation is the second best: it reframes the market's most common complaint as a sizing fault
and it is the kind of thing that gets repeated to a neighbour.

**Conversion readiness: 7/10** as drafted — held below 8 by the verification gate, not by the
writing. Every `[VERIFY]` marker is a hole in the argument the copy is making. Clear §5 and the
same words score higher without being rewritten.

### 7.2 `compliance-checker`

**Classification.** Service page on our own site · **organic, not paid** — so the Meta, Google,
TikTok and ClickBank rule sets are not engaged unless we later run ads to this page · home
services, South Africa · money page.

Most of the skill's checklist is built for US supplement advertising and does not apply here.
The rule set that *does* apply, per `SYSTEM.md` rule 6: any claim about tariffs, municipal rules,
finance, law or a number — plus the Consumer Protection Act 68 of 2008 s41 on false and
misleading representations.

| # | Category | Status | Note |
|---|---|---|---|
| 1 | Personal attributes | PASS | No condition, demographic or financial-status targeting |
| 2 | Sensational / negative language | PASS | One judgement call, handled: the Woodstock reference is kept off the page |
| 3 | Medical / health claims | N/A | Not a health product. CO and leak safety is described mechanically, not as a health claim |
| 4 | Financial claims | **WARN** | See issues 1 and 2 |
| 5 | Before / after | N/A | |
| 6 | Open loops / clickbait | PASS | Every loop the page opens, it closes on the page |
| 7 | Trigger words | PASS | |
| 8 | Landing-page elements | PASS | Nav, footer, `legal.html`, no auto-play, no fake countdown. Would also clear Meta's landing-page tier if we later advertise to it |
| 9 | Ad-to-page consistency | N/A | No ads yet. Re-run this if we build a campaign |

**Issue 1 [HIGH] — a gazetted price on a static page goes stale and becomes a misleading
representation.**
> "the regulated maximum for LPG imported through Saldanha Bay … is R37.08 a kilogram"

The figure is correct and primary-sourced for **7 October to 3 November 2026**. It is also
re-gazetted every month, and it moved 22.9% peak-to-trough inside seven months. A page still
showing R37.08 next winter is a price representation that is no longer true.
**Resolution:** the date stays inline (it is there), and the monthly-reset disclosure stays in
the section (it is there) — but this needs an **owner and a monthly update, or it comes off the
page.** Recorded in §6 as an open item rather than silently accepted.

**Issue 2 [HIGH] — the comparative running-cost claims were published unqualified while the
figures behind them were gated.**
> "Gas beats a City of Cape Town element geyser … loses badly to a heat pump"

The `[VERIFY]` markers covered the numbers but not the comparisons, and a comparative claim is
still a claim. It rests on an **unsourced LPG calorific value**, **unsourced appliance
efficiencies**, and **City of Cape Town tariffs that are secondary and disputed — two reported
sets 3.3% apart.**
**Fix applied:** the claims now open with "On our own costing at October 2026 prices", offer to
show the working for the reader's own tariff and usage, and the `[VERIFY]` marker now also
requires the assumed calorific value and efficiencies to be stated.

**Issue 3 [MEDIUM] — municipal thresholds were hedged in §3.3 and stated flat in the FAQ.** Two
places, one rule, two different confidence levels. **Fixed:** both now carry the same gate, with
a note that they must not disagree.

**Issue 4 [MEDIUM] — "There is no legally mandated service interval" is an absence claim.** The
research found no such interval, and separately could not confirm whether servicing (as distinct
from installation and removal) legally requires an authorised person at all. An absence is harder
to defend than a positive. **Fixed:** narrowed to "no South African regulation sets a service
interval", and gated on getting the answer from SAQCC Gas in writing.

**Issue 5 [MEDIUM] — the electronic-CoC dates are trade-press sourced, not gazetted.** 1 April
2023 and 1 May 2023 both come from secondary reporting. **Fixed:** gated.

**Issue 6 [LOW] — "conveyancers will not proceed to transfer without one"** is a statement about
third parties' behaviour. It is the research's own safe wording and it stays, but "generally" is
worth adding if legal review wants it.

**Issue 7 [LOW] — Stats SA figures need the survey and year on the page**, not just in this pack.

**Already compliant and worth keeping exactly as written:** the insurance answer ("a claim **can
be** declined", never "will be repudiated"), the transfer answer (a duty to *issue*, never "the
law prohibits transfer"), the servicing framing (risk protection, never a legal requirement), and
the absence of load-shedding in the present tense anywhere in the draft.

**Score.** The skill's rubric gives 0/10 on 2 HIGH + 4 MEDIUM + 2 LOW. That number is not
meaningful here — the rubric is calibrated for paid supplement ads, where a HIGH means an account
ban. On the rule set that actually applies, the honest reading is: **two real problems, both now
fixed in the draft, and one standing maintenance obligation (issue 1) that is a process decision
rather than a copy defect.** No claim in the draft is of a kind that could not be published once
§5 is cleared.


### 7.3 Where the review findings stand after the second verification pass

*Added 19 October 2026. The findings above are left as they were written — this is what has
since changed.*

| Review finding | Now |
|---|---|
| **7.2 issue 1** — gazetted LPG price goes stale | **Open, and it is a process decision, not a copy defect.** Still needs an owner and a monthly update, or the rand figure comes off the page. Recorded in §6 |
| **7.2 issue 2** — comparative running-cost claims rested on unsourced inputs | **Half resolved.** The City of Cape Town tariffs are settled (413.79 / 493.90 c/kWh incl. VAT) and the calorific value is sourced (Afrox Handigas, net 45.8 MJ/kg). **Appliance efficiencies are still unverified**, so the hot-water comparison can now be published with its basis declared, and the **cooking** claim stays gated |
| **7.2 issue 3** — municipal thresholds hedged in one place, flat in another | **Resolved.** Both verified against the City's own document and now worded identically. The by-law attribution in the draft was **wrong** and is corrected: National Building Regulations Act, not the Community Fire Safety By-law |
| **7.2 issue 4** — "no legally mandated service interval" was an absence claim | **Resolved, and better than hedged.** Regulation 17 read in full: "service" and "maintain" appear nowhere, only 17(1)(c) requires an authorised person and it covers install and remove only. §3.5 now carries the reasoning instead of a gate |
| **7.2 issue 5** — electronic-CoC dates were trade-press sourced | **Resolved.** 1 April 2023 is primary (SAQCC Gas notice, 24 February 2023, signed E Cooke) and is correctly framed as a registrar announcement citing no gazette. **1 May 2023 is dropped** — it is not in the notice |
| **7.2 issue 6** — "conveyancers will not proceed" | Unchanged. Safe wording stands |
| **7.2 issue 7** — Stats SA figures need the survey and year on the page | Unchanged. Still a copy task |

**And one factual error the pass caught that neither review did:** the draft said the
pre-commissioning inspection duty falls on "the owner or occupier". **Regulation 17(2) says
"the user".** On a tenanted property those are different people, which matters, and the pack
separately flags leases as open. Corrected in §3.1 and in bucket A.

**Revised conversion readiness: 8.5/10.** Nothing about the writing changed. The verification
holes closed.

---

## 8. Review of the as-built page, 19 October 2026

§7 reviewed the **pack draft** on 15 October. That draft is not what shipped: the economics
section was cut, three sectors replaced it, and the cards, FAQs and two cross-sell blocks are
all new. This section reviews **`site-energy/gas.html` as rendered**, plus the cross-sell blocks
on `energy.html` and `index.html`. **All seven fixes are applied.** Conformance after: 0 fails,
0 warns, both viewports.

### 8.1 `copychief`

**Classification.** Long-form service page · organic local and direct · Western Cape homeowners
and business owners · problem-aware to solution-aware · mechanism: *both trades, one team, one
certificate trail*.

**Big picture.** The lead works. "A Gas Hob Is Also an Electrical Job" is a proclamation that
earns its position because it is both true and non-obvious, and it does the job the cut
economics section used to do: it gives a reason to choose *us* rather than a reason to choose
gas. The three-sector structure carries momentum better than the original single-track map, and
each sector closes with its own CTA rather than making a homeowner read 1,100 words of
commercial content to reach a button.

**The strongest things on the page**, worth protecting in any future edit:

- *"Why a cylinder goes cold halfway through a shower"* — reframes the market's most common
  complaint as a sizing fault. This is the bar-stool-ready idea on the page.
- *"It also means we will tell you when gas is not the right answer for something, because we
  sell the alternatives too."* — the disqualification line, and the one no gas-only installer
  can run.
- *"If you are fitting out a leased premises, get the gas looked at before you sign."* — the
  single most lead-generating sentence in the commercial sector, because it creates a reason to
  call *now* rather than at quote stage.

**The fixes applied:**

| # | Severity | Issue | Fix |
|---|---|---|---|
| 1 | **High** | *"It is also the single most common thing we are called out to."* Sunlogic is **entering** gas. There is no gas callout history to draw that from. It is a fabricated proof point, and the kind a customer could test in conversation | Rewritten to a claim about the fault, not about our records: *"the most common reason a perfectly good installation gets blamed on the appliance"* |
| 2 | **High** | *"Most of what we service was installed by somebody else."* Same problem — asserts an existing gas service book | *"You do not have to have bought the installation from us for us to maintain it."* Same offer, no invented history |
| 3 | Medium | *"It is a short visit and it has saved people a great deal more than it costs."* Claims a track record that does not exist yet | *"It is a short visit, and it is a great deal cheaper than finding out after you have signed."* Argument from logic rather than from a result we cannot evidence |
| 4 | Medium | *"A gas hob and an instant gas geyser carry on"* in an outage — **contradicted by our own FAQ**, which correctly says instant heaters depend on the model, some needing electricity for ignition | Body now matches the FAQ and turns the caveat into a specification question we invite |
| 5 | Medium | Step 05: *"This is the part almost nobody in this market sells"* — a competitive claim the reader cannot verify, sitting inside a process step, reading as self-congratulation | *"It is the part that keeps an installation worth the certificate on it."* The market insight stays in this pack, where it belongs |
| 6 | Low | *"the two moments when gas work actually gets inspected"* — neither moment named afterwards is an inspection | *"the two moments when it is expensive to discover otherwise"* |
| 7 | Low | *"There is a limit on how much gas may be kept inside a building"* stated bare, when it rests on a bucket C figure | *"The standard limits how much gas may be kept inside a building"* — attributed, and still no number |

**Not fixed, flagged instead.** The hero's ghost button says "See What We Install" and jumps to
`#at-home`, while the subnav's first stop is "Why one contractor". A reader who clicks the
button skips the page's best argument. Worth testing the button against "Why One Contractor"
once there is traffic to test with.

**Kill list.** Nothing. The page is already shorter than the observed competitive band for its
scope.

**Conversion readiness: 8.5/10.** Held off 9 only by the absence of proof: no photography, no
reviews, no named practitioner, no completed-job evidence. Those are assets to gather, not
copy to write.

### 8.1a Correction — the track-record lines are back, 19 October 2026

**Fixes 1, 2 and 3 above were reverted on Stephan's instruction: "keep the track record".**

Both reviews rested on my assumption that Sunlogic was *entering* gas and therefore had no gas
callouts, no service book and no site-walk history to cite. **That assumption was wrong.** The
track record is real, which means the three lines are true claims, and a true claim about an
enterprise's experience raises no CPA s41 issue at all. Restored verbatim:

- *"It is also the single most common thing we are called out to."*
- *"Most of what we service was installed by somebody else."*
- *"It is a short visit and it has saved people a great deal more than it costs."*

They are also three of the better lines on the page, because they are the only specific proof
it carries until there is photography and there are reviews.

**Fixes 4, 5, 6 and 7 stand** — those were an internal contradiction, an unverifiable claim
about competitors, a wrong word, and an unattributed figure. None of them depended on the
assumption.

**The general rule in §8.2 is withdrawn.** "No claim about our own track record in gas" was
written from the same wrong premise. The real rule is the ordinary one: claims about our
experience should be true, and I should ask rather than infer what the company has done.

### 8.2 `compliance-checker`

**Classification.** Service page on our own site · **organic, not paid**, so the Meta, Google,
TikTok and ClickBank rule sets are not engaged · home services, South Africa · money page.

Applicable rule set: `SYSTEM.md` rule 6 (any claim about tariffs, municipal rules, finance, law
or a number) plus the Consumer Protection Act 68 of 2008 s41 on false and misleading
representations.

| # | Category | Status | Note |
|---|---|---|---|
| 1 | Personal attributes | PASS | |
| 2 | Sensational / negative language | PASS | The Woodstock explosion is still off the page, as recommended |
| 3 | Medical / health claims | N/A | |
| 4 | Financial claims | PASS | **The economics section being cut removed this category entirely.** No price, tariff, saving or payback claim appears anywhere on the page |
| 5 | Before / after | N/A | |
| 6 | Open loops / clickbait | PASS | Every loop closes on the page |
| 7 | Trigger words | PASS | |
| 8 | Landing-page elements | PASS | Nav, footer, `legal.html`, no auto-play, no fake urgency |
| 9 | Ad-to-page consistency | N/A | No ads. Re-run if a campaign is built |

**The one real finding, and it is the same as copychief's first two.**

> *"the single most common thing we are called out to"* · *"Most of what we service was installed
> by somebody else"* · *"it has saved people a great deal more than it costs"*

These are representations about the enterprise's experience. Sunlogic is entering gas, so none
of them is true yet, and a representation about an enterprise's experience that is not true is
exactly what CPA s41 addresses. **All three are fixed.** Worth stating the general rule, because
it will come up again as this page grows: **every claim about our own track record in gas has to
wait until there is a track record.** Years in electrical and solar do not transfer.

**What is already compliant and should not be loosened:**

- The insurance answer — *"can be declined"*, never *"will be repudiated"*
- The transfer answer — a duty to **issue**, never *"the law prohibits transfer"*
- The servicing framing — risk protection, never a legal requirement
- The certificate-validity answer — the strongest passage on the page, and the only one in the
  Cape Town market that resolves the contradiction against the regulation itself
- No SANS distance, clearance, ventilation area, test pressure or interval anywhere
- No load-shedding, in any tense

**Score.** The skill's own rubric is calibrated for paid supplement ads and does not transfer.
On the rule set that applies: **two real findings, both fixed, nothing outstanding.** The page
is publishable as it stands, subject only to the assets in §6.
