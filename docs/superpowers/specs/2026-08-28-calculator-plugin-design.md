# Solar Calculator Plugin — Design Spec

**Status:** Approved by user in chat (design sections), pending written-spec review.
**Author:** Claude (session), for Stephan Marais.
**Source:** `docs/calculator_strategy_guide.md` (strategy menu of 6 possible calculators — this spec covers 2 of them, selected in chat).

## 1. Overview

The second entry in the `plugins/` library (after `plugins/review-carousel/`):
a single portable Web Component, `<plugin-calculator>`, offering two modes —
a residential "Energy Independence & Payback" calculator and an SME "Cash
Flow & Overhead Offset" calculator, both drawn from
`docs/calculator_strategy_guide.md`. Same portability rules as
`review-carousel`: no Tailwind dependency, no build step, CSS custom
properties for theming, self-contained data submission (no dependency on
`site/shared/forms.js`).

## 2. Goals

- Turn a visitor's monthly electricity bill (and, for SME, weekly operating
  hours) into an instant, live-updating headline number, then gate a fuller
  breakdown behind an email capture — per the strategy guide's "smart
  gating" pattern.
- Residential mode: estimated monthly savings + payback period (headline),
  system size + system cost + first-year savings + a 20-year cumulative
  savings projection (gated).
- SME mode: the "cash-flow pivot" line — estimated monthly savings vs.
  estimated finance installment, framed as immediate monthly profit
  (headline) — plus system size + system cost + full breakdown (gated).
- Every numeric assumption (tariff rates, sun-hours, cost-per-kW, escalation
  rate, finance terms) is a labeled, editable constant in one config file,
  not a hardcoded "fact" — Sunlogic can revise any of them without touching
  calculation logic.
- A permanent, visible on-page disclaimer that all figures are estimates,
  not a formal system design or finance offer.
- Captures the lead (inputs + results + email) via the same
  placeholder-webhook pattern already used by the contact form, but with
  its own self-contained POST logic.

## 3. Non-goals

- No PDF generation this round — "download PDF" is a labeled "coming soon"
  until a backend exists to render one properly (confirmed in chat).
- No live tariff/finance-rate API lookups — all assumptions are static,
  editable constants (consistent with the review-carousel's no-live-API
  decision).
- No CRM integration beyond POSTing to the existing placeholder webhook —
  no CRM exists yet to route into.
- No charting library dependency — the 20-year projection renders via a
  small hand-built inline SVG bar chart, not an external library.
- No region/location input — Sunlogic serves only the Western Cape, so
  sun-hours/tariff assumptions are hardcoded rather than adding an input
  the strategy guide otherwise suggests.
- Only two of the six calculators in the strategy guide are in scope for
  this plan. The other four (Loadshedding/Outage Cost, Bill-to-System
  Reverse, Business Continuity/Uptime, Tax Shield/Section 12B) are future
  work, not part of this spec.

## 4. File Structure

```
plugins/calculator/
  calculator.js      — defines <plugin-calculator>, both modes, injects scoped CSS
  assumptions.js       — labeled constants (see §6), separate from logic
  test.html             — standalone harness, one instance per mode
  README.md
```

## 5. Modes, Inputs, and UI Flow

`<plugin-calculator mode="residential">` or `<plugin-calculator
mode="sme">`. Both modes share one UI chassis:

1. **Inputs** (live-updating on every change, no submit button needed to see headline numbers):
   - Residential: monthly electricity bill (Rand) — a slider and a number input kept in sync.
   - SME: monthly electricity bill (Rand, slider + number input) and weekly operating hours (slider).
2. **Headline** (always visible once an amount is entered):
   - Residential: "Estimated Monthly Savings" (Rand) and "Estimated Payback Period" (years).
   - SME: the cash-flow pivot line — *"Your estimated installment is R{X}/month — but you'd save an estimated R{Y}/month. That's R{Y−X}/month back in your pocket."* If `Y − X` is negative, see §8 (Negative-Pivot Fallback).
   - Both: the permanent disclaimer text (§9) directly beneath the headline, not in fine print.
3. **Gate**: an email field, "Unlock your full savings report," appears once headline numbers are showing. Submitting:
   - Sends the webhook payload (§10).
   - Reveals the gated detail view in place — no page redirect (this differs deliberately from the contact form's redirect-to-thank-you pattern, since the value proposition here is showing the visitor their report immediately).
4. **Gated detail view**:
   - Recommended system size: panel kW, inverter kW, battery kWh.
   - Estimated system cost (Rand).
   - First-year savings (Rand).
   - Residential only: a hand-built inline SVG bar chart of the 20-year cumulative savings projection (§7).
   - SME only: the full monthly cash-flow breakdown over the finance term.

## 6. Assumptions (`assumptions.js`)

Every value below is a labeled estimate, not a verified current fact — each
constant carries an inline comment saying so, and the file exists
specifically so Sunlogic can revise these without touching `calculator.js`.

| Constant | Value | Basis |
|---|---|---|
| `SUN_HOURS_PER_DAY` | 4.5 | Commonly-cited average peak sun hours, Western Cape |
| `TARIFF_RATE` | R2.80/kWh | Rough blended municipal/Eskom residential rate, Cape Town — estimate |
| `SME_TARIFF_RATE` | R2.50/kWh | Rough blended commercial rate — estimate |
| `ANNUAL_TARIFF_ESCALATION` | 5%/yr | Conservative framing of historical SA tariff trend (revised down from an initial 10%/yr draft — see §11) |
| `RESIDENTIAL_OFFSET_FACTOR` | 85% | Share of usage a typical solar+battery system offsets — estimate |
| `SME_OFFSET_FACTOR` (base) | 90% | Businesses skew toward daylight-hours usage — estimate, scaled per §6.1 |
| `COST_PER_KW_INSTALLED` (residential) | R18,000/kW | Blended all-in ballpark (panels+inverter+battery+install) — estimate |
| `SME_COST_PER_KW_INSTALLED` | R14,000/kW | Blended commercial ballpark, revised down from an initial R16,000/kW draft after the cash-flow math check in §11 found the higher figure made the SME pivot mathematically always negative |
| `BATTERY_KWH_PER_DAILY_KWH` | 0.5 | Battery sized to cover ~half a day's usage — estimate |
| `FINANCE_TERM_MONTHS` | 84 (7 years) | Illustrative commercial asset-finance term, revised up from an initial 60-month draft (see §11) — explicitly labeled "illustrative, not a financing offer" |
| `FINANCE_ANNUAL_RATE` | 12% | Illustrative commercial asset-finance rate, revised down from an initial 14% draft (see §11) — explicitly labeled "illustrative, not a financing offer" |
| `DAYLIGHT_HOURS_ASSUMPTION` | 9 hours/day | Assumed daylight generation window (e.g. 8am-5pm) used to scale SME offset by operating-hours overlap (§6.1) |
| `MIN_OVERLAP_FLOOR` | 0.5 | Minimum offset-scaling floor even for businesses with little daylight-hours overlap (battery still provides some benefit) |
| `PROJECTION_YEARS` | 20 | Residential cumulative-savings projection horizon |

### 6.1 SME operating-hours scaling

The SME calculator's `SME_OFFSET_FACTOR` is not applied flat — it scales by
how much of a business's operating day overlaps the assumed daylight
window, so the "weekly operating hours" input actually affects the result
(an earlier draft of this spec omitted this and the input went unused — see
§11):

```
operating_hours_per_day = weekly_operating_hours / 7
overlap_fraction = clamp(operating_hours_per_day / DAYLIGHT_HOURS_ASSUMPTION, MIN_OVERLAP_FLOOR, 1.0)
effective_sme_offset_factor = SME_OFFSET_FACTOR * overlap_fraction
```

A business operating mostly during daylight hours (e.g. a shop, 9-5) gets
close to the full base offset factor. A business with very short operating
hours gets a reduced offset (floored at 50% of the base factor, since
battery storage still provides some benefit even with limited daylight
overlap).

## 7. Formulas

**Residential:**

```
monthly_kwh        = bill / TARIFF_RATE
daily_kwh          = monthly_kwh / 30
panel_kw           = daily_kwh / SUN_HOURS_PER_DAY
battery_kwh        = daily_kwh * BATTERY_KWH_PER_DAILY_KWH
inverter_kw        = ceil(panel_kw)
system_cost        = panel_kw * COST_PER_KW_INSTALLED
first_year_savings = bill * 12 * RESIDENTIAL_OFFSET_FACTOR
payback_years       = system_cost / first_year_savings
```

20-year cumulative savings (compounding `first_year_savings` by
`ANNUAL_TARIFF_ESCALATION` each year):

```
cumulative_savings(Y) = first_year_savings * ((1 + ANNUAL_TARIFF_ESCALATION)^Y - 1) / ANNUAL_TARIFF_ESCALATION
```

Worked example (bill = R2,500/month): `panel_kw ≈ 6.61 kW`,
`battery_kwh ≈ 14.88 kWh`, `inverter_kw = 7 kW`, `system_cost ≈ R118,980`,
`first_year_savings ≈ R25,500`, `payback_years ≈ 4.66`,
`cumulative_savings(20) ≈ R843,000` at the now-agreed 5% escalation rate.

**SME:**

```
monthly_kwh          = bill / SME_TARIFF_RATE
daily_kwh            = monthly_kwh / 30
panel_kw             = daily_kwh / SUN_HOURS_PER_DAY
battery_kwh          = daily_kwh * BATTERY_KWH_PER_DAILY_KWH
inverter_kw          = ceil(panel_kw)
system_cost          = panel_kw * SME_COST_PER_KW_INSTALLED
effective_offset      = SME_OFFSET_FACTOR * overlap_fraction   (§6.1)
monthly_savings       = bill * effective_offset
monthly_installment   = amortized_payment(system_cost, FINANCE_ANNUAL_RATE / 12, FINANCE_TERM_MONTHS)
pivot                 = monthly_savings - monthly_installment
```

Where `amortized_payment(P, r, n) = P * r * (1+r)^n / ((1+r)^n - 1)` is the
standard loan-payment formula (`P` = principal, `r` = monthly rate, `n` =
number of months).

Worked example (bill = R15,000/month, `overlap_fraction = 1`, i.e.
operating hours at or above `DAYLIGHT_HOURS_ASSUMPTION` × 7 = 63 hrs/week —
e.g. a business open ~9 hours/day, 7 days/week): `system_cost ≈ R711,000`
(at the corrected R14,000/kW),
`monthly_installment ≈ R10,988`, `monthly_savings ≈ R13,500`,
`pivot ≈ +R2,512/month`. Because both `monthly_savings` and
`monthly_installment` scale linearly with `bill` when `overlap_fraction =
1`, the pivot's sign is independent of bill size at full daylight overlap —
it only turns negative when `overlap_fraction` drops (short operating
hours), which is the intended, honest behavior (§8).

## 8. Negative-Pivot Fallback (SME)

If `pivot < 0` (short operating hours pulling `overlap_fraction` down),
the headline does not show a discouraging raw negative number. Instead it
swaps to: *"At this size, financing may run close to or above your
savings — this is where site-specific numbers matter. Let's talk it
through."* — with the same email-gate CTA, so the lead is still captured.

## 9. Disclaimer

Both modes display, permanently and directly beneath the headline (not in
a footnote or tooltip): *"Figures are indicative estimates based on typical
Western Cape conditions and standard industry assumptions — not a formal
system design or finance offer. Contact us for an accurate, site-specific
quote."*

## 10. Data Flow / Webhook Payload

On gate-unlock (email submitted), the plugin POSTs JSON to a `webhook`
attribute on the host element (mirroring the contact form's
`data-webhook` placeholder convention, but read as a plain attribute since
this is a self-contained plugin, not a `data-sl-form` element):

```js
{
  mode: "residential" | "sme",
  inputs: { bill: number, operatingHoursPerWeek?: number },
  results: { /* all calculated outputs for that mode */ },
  email: string,
  timestamp: string, // ISO 8601, generated at submit time
}
```

A honeypot field (mirroring `forms.js`'s spam-trap pattern) is built into
the plugin's own email-gate form, not borrowed from `site/shared/forms.js`
— keeping the plugin dependency-free per the portability goal.

## 11. Math Review Notes (for the historical record)

Three real issues were found and corrected during design, before any code
was written:

1. **SME pivot was structurally always negative.** The initial draft used
   R16,000/kW and a 60-month/14% finance assumption; the amortized
   installment scaled to ~1.10× the monthly bill while savings only reached
   0.90× the bill, meaning `savings − installment` was negative for any
   input, not just an edge case (both terms scale linearly with bill).
   Fixed by revising to R14,000/kW and 84 months/12%, making the pivot
   positive at full daylight overlap for any bill amount.
2. **Weekly operating hours was an unused input.** The initial draft
   listed it as an SME input (per the strategy guide) but no formula
   referenced it. Fixed via the overlap-fraction scaling in §6.1.
3. **20-year escalation at 10%/year produced an implausibly large number**
   (~12× the system cost on the worked example). Revised down to 5%/year
   after review (~7.1× the system cost on the same example) — see the
   worked example in §7.

## 12. Testing Plan

Same manual, in-browser approach as `review-carousel` (no automated test
framework in this repo):

1. Residential mode: enter several bill amounts (e.g. R1,000, R2,500,
   R10,000) and confirm headline numbers update live, matching the §7
   formulas by hand-calculation.
2. SME mode: enter a bill + near-full-daylight operating hours (e.g.
   60hrs/week, `overlap_fraction ≈ 0.95`) and confirm a positive pivot;
   then enter very short operating hours
   (e.g. 5hrs/week) and confirm the pivot goes negative and the fallback
   message (§8) appears instead of a raw negative number.
3. Submitting the email gate reveals the detail view in place (no
   redirect) and POSTs the exact payload shape from §10 (verify via
   browser devtools network tab or a temporary console.log).
4. The 20-year SVG bar chart (residential, gated view) renders with 20
   bars of increasing height, matching the compounding formula in §7.
5. The permanent disclaimer text is visible without scrolling or hovering,
   directly beneath the headline, in both modes.
6. No Tailwind classes anywhere in the injected styles; overriding any
   `--plugin-calc-*` custom property changes the corresponding visual
   element without touching the component's own code.

## 13. Open Items For User

- Exact homepage/site placement for the two calculator instances is not
  yet decided — to be resolved during implementation planning.
- Real assumption values (§6) are Sunlogic's to review/replace whenever
  convenient — they are not blocking implementation, since they live in a
  single editable config file.
