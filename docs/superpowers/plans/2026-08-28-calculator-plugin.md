# Solar Calculator Plugin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a portable `<plugin-calculator>` Web Component with two modes (residential energy-payback, SME cash-flow) that computes live estimates from a monthly bill, gates a fuller breakdown behind an email capture, and POSTs the lead to a webhook.

**Architecture:** Pure calculation logic (`calculator-math.js`) is isolated from rendering/DOM logic (`calculator.js`) so the math — already found to contain real bugs during design (see the spec's §11) — can be verified independently, against exact worked examples, before any UI work happens. The component itself follows the same light-DOM, `display: contents`, CSS-custom-property-themed pattern as `plugins/review-carousel/`.

**Tech Stack:** Vanilla JS (native Custom Elements), plain CSS injected at runtime, no build step, no bundler. This repo has no automated test framework — every task's verification step is manual, either in-browser or by reading numbers off a plain HTML harness page and comparing them to worked-example values computed by hand in this plan.

**Spec:** `docs/superpowers/specs/2026-08-28-calculator-plugin-design.md`

## Global Constraints

- No Tailwind class dependency — all styling via the component's own injected `<style>` block using CSS custom properties (spec §1, §2).
- No live tariff/finance-rate API calls, no CRM integration beyond POSTing to the existing placeholder-webhook convention, no PDF generation this round, no charting library dependency (spec §3).
- No region/location input — sun-hours/tariff assumptions are hardcoded for the Western Cape (spec §3).
- Every numeric assumption lives in `plugins/calculator/assumptions.js`, not hardcoded inline in logic (spec §2, §6).
- The permanent disclaimer text (spec §9) must be visible directly beneath the headline in both modes, not in a footnote or tooltip.
- SME mode must handle a negative pivot gracefully (spec §8) — never display a raw negative "extra profit" number.
- Webhook payload shape is fixed (spec §10): `{ mode, inputs, results, email, timestamp }`, sent as JSON POST to the value of a `webhook` attribute on the host element. If that attribute is missing or equals the literal string `"PENDING_BACKEND"`, log a console warning with the payload instead of sending it — do not throw, do not block the UI (mirrors the existing `data-webhook="PENDING_BACKEND"` placeholder convention already used by the homepage's assessment form).
- A honeypot field is built into the plugin's own gate form — do not depend on `site/shared/forms.js`.
- **Git commits are never run directly by an implementer subagent or via raw `git commit`.** Every commit routes through the `commit-specialist` agent, dispatched by the controlling session after each task's review passes. Each task below ends with "leave changes uncommitted, report DONE" — the controller handles committing.
- Local dev server note: use a server rooted at the repo root (`python3 -m http.server 8010` from the repo root) so `plugins/calculator/*.html` harnesses can be loaded directly at `http://localhost:8010/plugins/calculator/test.html` (and `test-math.html`).

---

### Task 1: Calculation assumptions and pure math functions

**Files:**
- Create: `plugins/calculator/assumptions.js`
- Create: `plugins/calculator/calculator-math.js`
- Create: `plugins/calculator/test-math.html`

**Interfaces:**
- Consumes: nothing (first task).
- Produces:
  - `window.PLUGIN_CALCULATOR_ASSUMPTIONS` — a plain object with the constants listed below.
  - `window.PluginCalculatorMath.calculateResidential(bill)` → `{ panelKw, batteryKwh, inverterKw, systemCost, firstYearSavings, paybackYears, cumulativeByYear }` (`cumulativeByYear` is an array of 20 numbers, index 0 = year 1, index 19 = year 20).
  - `window.PluginCalculatorMath.calculateSme(bill, weeklyOperatingHours)` → `{ panelKw, batteryKwh, inverterKw, systemCost, overlapFraction, effectiveOffsetFactor, monthlySavings, monthlyInstallment, pivot }`.
  - `window.PluginCalculatorMath.clamp(value, min, max)` and `window.PluginCalculatorMath.amortizedPayment(principal, monthlyRate, numMonths)` — exposed as named properties on the same object, used internally and available for later tasks if needed.

- [ ] **Step 1: Create the assumptions file**

Create `plugins/calculator/assumptions.js` with this exact content:

```js
// Every value below is a labeled estimate for lead-generation purposes,
// not a verified current fact — Sunlogic should review and can edit any
// of these without touching calculator-math.js or calculator.js.
window.PLUGIN_CALCULATOR_ASSUMPTIONS = {
  SUN_HOURS_PER_DAY: 4.5,               // avg peak sun hours, Western Cape — estimate
  TARIFF_RATE: 2.80,                     // R/kWh, blended residential Cape Town — estimate
  SME_TARIFF_RATE: 2.50,                 // R/kWh, blended commercial — estimate
  ANNUAL_TARIFF_ESCALATION: 0.05,        // 5%/yr, conservative historical-trend framing — estimate
  RESIDENTIAL_OFFSET_FACTOR: 0.85,       // share of usage offset by solar+battery — estimate
  SME_OFFSET_FACTOR: 0.90,               // base offset before operating-hours scaling — estimate
  COST_PER_KW_INSTALLED: 18000,          // R/kW, residential blended all-in — estimate
  SME_COST_PER_KW_INSTALLED: 14000,      // R/kW, commercial blended all-in — estimate
  BATTERY_KWH_PER_DAILY_KWH: 0.5,        // battery sized to ~half a day's usage — estimate
  FINANCE_TERM_MONTHS: 84,               // 7yr illustrative commercial asset finance — not a finance offer
  FINANCE_ANNUAL_RATE: 0.12,             // 12% illustrative — not a finance offer
  DAYLIGHT_HOURS_ASSUMPTION: 9,          // assumed daylight generation window, hours/day
  MIN_OVERLAP_FLOOR: 0.5,                // minimum offset-scaling floor for low-overlap businesses
  PROJECTION_YEARS: 20,
};
```

- [ ] **Step 2: Create the math module**

Create `plugins/calculator/calculator-math.js` with this exact content:

```js
(function () {
  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function amortizedPayment(principal, monthlyRate, numMonths) {
    if (monthlyRate === 0) return principal / numMonths;
    const factor = Math.pow(1 + monthlyRate, numMonths);
    return (principal * monthlyRate * factor) / (factor - 1);
  }

  function calculateResidential(bill) {
    const A = window.PLUGIN_CALCULATOR_ASSUMPTIONS;
    const monthlyKwh = bill / A.TARIFF_RATE;
    const dailyKwh = monthlyKwh / 30;
    const panelKw = dailyKwh / A.SUN_HOURS_PER_DAY;
    const batteryKwh = dailyKwh * A.BATTERY_KWH_PER_DAILY_KWH;
    const inverterKw = Math.ceil(panelKw);
    const systemCost = panelKw * A.COST_PER_KW_INSTALLED;
    const firstYearSavings = bill * 12 * A.RESIDENTIAL_OFFSET_FACTOR;
    const paybackYears = systemCost / firstYearSavings;

    const cumulativeByYear = [];
    for (let y = 1; y <= A.PROJECTION_YEARS; y++) {
      const value =
        firstYearSavings *
        ((Math.pow(1 + A.ANNUAL_TARIFF_ESCALATION, y) - 1) / A.ANNUAL_TARIFF_ESCALATION);
      cumulativeByYear.push(value);
    }

    return {
      panelKw,
      batteryKwh,
      inverterKw,
      systemCost,
      firstYearSavings,
      paybackYears,
      cumulativeByYear,
    };
  }

  function calculateSme(bill, weeklyOperatingHours) {
    const A = window.PLUGIN_CALCULATOR_ASSUMPTIONS;
    const monthlyKwh = bill / A.SME_TARIFF_RATE;
    const dailyKwh = monthlyKwh / 30;
    const panelKw = dailyKwh / A.SUN_HOURS_PER_DAY;
    const batteryKwh = dailyKwh * A.BATTERY_KWH_PER_DAILY_KWH;
    const inverterKw = Math.ceil(panelKw);
    const systemCost = panelKw * A.SME_COST_PER_KW_INSTALLED;

    const operatingHoursPerDay = weeklyOperatingHours / 7;
    const overlapFraction = clamp(
      operatingHoursPerDay / A.DAYLIGHT_HOURS_ASSUMPTION,
      A.MIN_OVERLAP_FLOOR,
      1.0
    );
    const effectiveOffsetFactor = A.SME_OFFSET_FACTOR * overlapFraction;

    const monthlySavings = bill * effectiveOffsetFactor;
    const monthlyRate = A.FINANCE_ANNUAL_RATE / 12;
    const monthlyInstallment = amortizedPayment(systemCost, monthlyRate, A.FINANCE_TERM_MONTHS);
    const pivot = monthlySavings - monthlyInstallment;

    return {
      panelKw,
      batteryKwh,
      inverterKw,
      systemCost,
      overlapFraction,
      effectiveOffsetFactor,
      monthlySavings,
      monthlyInstallment,
      pivot,
    };
  }

  window.PluginCalculatorMath = {
    clamp,
    amortizedPayment,
    calculateResidential,
    calculateSme,
  };
})();
```

- [ ] **Step 3: Create the math test harness**

Create `plugins/calculator/test-math.html` with this exact content:

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Calculator Math — Test Harness</title>
<style>
  body { margin: 0; padding: 3rem 2rem; background: #f3f4f6; font-family: system-ui, sans-serif; }
  .wrap { max-width: 700px; margin: 0 auto; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 2rem; background: #fff; }
  th, td { text-align: left; padding: 0.5rem 0.75rem; border-bottom: 1px solid #e5e7eb; font-size: 0.9rem; }
  th { background: #f9fafb; }
</style>
</head>
<body>
<div class="wrap">
  <h1>plugin-calculator math — test harness</h1>
  <div id="output"></div>
</div>
<script src="assumptions.js"></script>
<script src="calculator-math.js"></script>
<script>
  function renderCase(title, result) {
    const rows = Object.entries(result)
      .filter(([key]) => key !== 'cumulativeByYear')
      .map(([key, value]) => `<tr><td>${key}</td><td>${typeof value === 'number' ? value.toFixed(2) : value}</td></tr>`)
      .join('');
    const yearRows = result.cumulativeByYear
      ? `<tr><td>cumulativeByYear[0] (year 1)</td><td>${result.cumulativeByYear[0].toFixed(2)}</td></tr>
         <tr><td>cumulativeByYear[19] (year 20)</td><td>${result.cumulativeByYear[19].toFixed(2)}</td></tr>`
      : '';
    document.getElementById('output').insertAdjacentHTML('beforeend', `
      <h2>${title}</h2>
      <table>${rows}${yearRows}</table>
    `);
  }

  renderCase('Residential @ R2,500/month', window.PluginCalculatorMath.calculateResidential(2500));
  renderCase('SME @ R15,000/month, 63 hrs/week', window.PluginCalculatorMath.calculateSme(15000, 63));
  renderCase('SME @ R15,000/month, 10 hrs/week', window.PluginCalculatorMath.calculateSme(15000, 10));
</script>
</body>
</html>
```

- [ ] **Step 4: Verify against hand-computed worked examples**

With a server rooted at the repo root running, open
`http://localhost:8010/plugins/calculator/test-math.html` and compare the
displayed table values against these expected values (small floating-point
rounding of a few cents/Rand is fine; anything off by more than ~0.5% is a
real bug):

**Residential @ R2,500/month:**
- `panelKw` ≈ 6.61
- `batteryKwh` ≈ 14.88
- `inverterKw` = 7
- `systemCost` ≈ 119047.62
- `firstYearSavings` = 25500.00
- `paybackYears` ≈ 4.67
- `cumulativeByYear[0]` (year 1) = 25500.00
- `cumulativeByYear[19]` (year 20) ≈ 843181.83

**SME @ R15,000/month, 63 hrs/week** (full daylight overlap: `operatingHoursPerDay` = 9, `overlapFraction` = 1):
- `panelKw` ≈ 44.44
- `batteryKwh` ≈ 100.00
- `inverterKw` = 45
- `systemCost` ≈ 622222.22
- `overlapFraction` = 1.00
- `effectiveOffsetFactor` = 0.90
- `monthlySavings` = 13500.00
- `monthlyInstallment` ≈ 10984.50 (accept anywhere in 10980–10990 — this depends only on `Math.pow`, so it should be very close to this value every run)
- `pivot` ≈ +2515.50 (must be positive)

**SME @ R15,000/month, 10 hrs/week** (short hours: `operatingHoursPerDay` ≈ 1.43, `overlapFraction` floors at 0.5):
- `panelKw`, `batteryKwh`, `inverterKw`, `systemCost` — identical to the 63-hrs case above (system sizing depends only on bill, not hours)
- `overlapFraction` = 0.50
- `effectiveOffsetFactor` = 0.45
- `monthlySavings` = 6750.00
- `monthlyInstallment` ≈ 10984.50 (same as above — financing doesn't depend on hours)
- `pivot` ≈ -4234.50 (**must be negative** — this is the expected, intentional behavior from spec §8, not a bug)

- [ ] **Step 5: Report**

Leave all three files as created (do not commit — the controlling session commits via `commit-specialist` after task review). Report DONE with the actual values you observed for all three cases, explicitly confirming whether the third case's `pivot` came out negative as expected.

---

### Task 2: The `<plugin-calculator>` component — inputs and live headline

**Files:**
- Create: `plugins/calculator/calculator.js`
- Create: `plugins/calculator/test.html`

**Interfaces:**
- Consumes: `window.PLUGIN_CALCULATOR_ASSUMPTIONS` and `window.PluginCalculatorMath.{calculateResidential,calculateSme}` from Task 1 — exact names, do not rename.
- Produces:
  - Custom element `<plugin-calculator mode="residential">` / `<plugin-calculator mode="sme">` (defaults to `"residential"` if `mode` is missing or any other value).
  - CSS custom properties: `--plugin-calc-accent`, `--plugin-calc-bg`, `--plugin-calc-text-color`, `--plugin-calc-text-muted`, `--plugin-calc-radius`, `--plugin-calc-font`.
  - Internal instance state `this._mode` and `this._lastResult` (the most recent calculation result object) — Task 3 reads `this._lastResult` and `this._mode` when building the gated detail view and the webhook payload. Do not rename these two properties.
  - A `.plugin-calc-headline` element inside the component's markup — Task 3 finds the gate/detail sections relative to this element.

This task deliberately does NOT include the email gate or the gated detail view (system size, cost, chart) — those are Task 3. Task 2's scope is: inputs render correctly, the headline updates live and matches Task 1's verified math, and the disclaimer is always visible.

- [ ] **Step 1: Create the component file**

Create `plugins/calculator/calculator.js` with this exact content:

```js
(function () {
  if (customElements.get('plugin-calculator')) return;

  function injectBaseStyles() {
    if (document.getElementById('plugin-calculator-styles')) return;
    const style = document.createElement('style');
    style.id = 'plugin-calculator-styles';
    style.textContent = `
      plugin-calculator { display: contents; }

      :root {
        --plugin-calc-accent: #ff8000;
        --plugin-calc-bg: #ffffff;
        --plugin-calc-text-color: #1a1a1a;
        --plugin-calc-text-muted: #6b7280;
        --plugin-calc-radius: 1rem;
        --plugin-calc-font: inherit;
      }

      .plugin-calc-card {
        font-family: var(--plugin-calc-font);
        background: var(--plugin-calc-bg);
        color: var(--plugin-calc-text-color);
        border-radius: var(--plugin-calc-radius);
        padding: 1.5rem;
        max-width: 32rem;
      }

      .plugin-calc-disclaimer {
        font-size: 0.75rem;
        color: var(--plugin-calc-text-muted);
        margin-top: 0.75rem;
        line-height: 1.4;
      }

      .plugin-calc-input-group {
        margin-bottom: 1.25rem;
      }

      .plugin-calc-input-group label {
        display: block;
        font-weight: 700;
        font-size: 0.875rem;
        margin-bottom: 0.5rem;
      }

      .plugin-calc-slider-row {
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }

      .plugin-calc-range {
        flex: 1;
        accent-color: var(--plugin-calc-accent);
      }

      .plugin-calc-number {
        width: 6.5rem;
        padding: 0.375rem 0.5rem;
        border: 1px solid var(--plugin-calc-text-muted);
        border-radius: 0.5rem;
        font-size: 0.875rem;
      }

      .plugin-calc-headline {
        background: color-mix(in srgb, var(--plugin-calc-accent) 8%, var(--plugin-calc-bg));
        border-radius: var(--plugin-calc-radius);
        padding: 1.25rem;
        margin-top: 1rem;
      }

      .plugin-calc-headline-figure {
        font-size: 1.75rem;
        font-weight: 800;
        color: var(--plugin-calc-accent);
        line-height: 1.2;
      }

      .plugin-calc-headline-label {
        font-size: 0.8rem;
        color: var(--plugin-calc-text-muted);
        margin-bottom: 0.25rem;
      }

      .plugin-calc-headline-row {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        flex-wrap: wrap;
      }

      .plugin-calc-pivot-fallback {
        font-size: 1rem;
        font-weight: 600;
        color: var(--plugin-calc-text-color);
        line-height: 1.5;
      }
    `;
    document.head.appendChild(style);
  }

  function formatRand(amount) {
    const rounded = Math.round(amount);
    const withSeparators = rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return 'R' + withSeparators;
  }

  function residentialInputsHtml() {
    return `
      <div class="plugin-calc-input-group">
        <label>Average monthly electricity bill</label>
        <div class="plugin-calc-slider-row">
          <input type="range" class="plugin-calc-range" data-field="bill" min="300" max="15000" step="50" value="2500"/>
          <input type="number" class="plugin-calc-number" data-field="bill" min="300" max="15000" step="50" value="2500"/>
        </div>
      </div>
    `;
  }

  function smeInputsHtml() {
    return `
      <div class="plugin-calc-input-group">
        <label>Average monthly electricity bill</label>
        <div class="plugin-calc-slider-row">
          <input type="range" class="plugin-calc-range" data-field="bill" min="500" max="100000" step="100" value="15000"/>
          <input type="number" class="plugin-calc-number" data-field="bill" min="500" max="100000" step="100" value="15000"/>
        </div>
      </div>
      <div class="plugin-calc-input-group">
        <label>Weekly operating hours</label>
        <div class="plugin-calc-slider-row">
          <input type="range" class="plugin-calc-range" data-field="hours" min="0" max="168" step="1" value="63"/>
          <input type="number" class="plugin-calc-number" data-field="hours" min="0" max="168" step="1" value="63"/>
        </div>
      </div>
    `;
  }

  const DISCLAIMER_TEXT = 'Figures are indicative estimates based on typical Western Cape conditions and standard industry assumptions — not a formal system design or finance offer. Contact us for an accurate, site-specific quote.';

  class PluginCalculator extends HTMLElement {
    connectedCallback() {
      if (this._rendered) return;
      this._rendered = true;
      injectBaseStyles();

      this._mode = this.getAttribute('mode') === 'sme' ? 'sme' : 'residential';
      const inputsHtml = this._mode === 'sme' ? smeInputsHtml() : residentialInputsHtml();

      this.innerHTML = `
        <div class="plugin-calc-card">
          <div class="plugin-calc-inputs">${inputsHtml}</div>
          <div class="plugin-calc-headline"></div>
          <div class="plugin-calc-disclaimer">${DISCLAIMER_TEXT}</div>
        </div>
      `;

      this._wireInputs();
      this._recalculate();
    }

    _wireInputs() {
      const ranges = this.querySelectorAll('.plugin-calc-range');
      const numbers = this.querySelectorAll('.plugin-calc-number');

      ranges.forEach((range) => {
        range.addEventListener('input', () => {
          const field = range.dataset.field;
          const number = this.querySelector(`.plugin-calc-number[data-field="${field}"]`);
          if (number) number.value = range.value;
          this._recalculate();
        });
      });

      numbers.forEach((number) => {
        number.addEventListener('input', () => {
          const field = number.dataset.field;
          const range = this.querySelector(`.plugin-calc-range[data-field="${field}"]`);
          if (range) range.value = number.value;
          this._recalculate();
        });
      });
    }

    _getFieldValue(field, fallback) {
      const input = this.querySelector(`.plugin-calc-number[data-field="${field}"]`);
      const value = input ? parseFloat(input.value) : NaN;
      return Number.isFinite(value) && value > 0 ? value : fallback;
    }

    _recalculate() {
      const math = window.PluginCalculatorMath;
      const headline = this.querySelector('.plugin-calc-headline');

      if (this._mode === 'sme') {
        const bill = this._getFieldValue('bill', 15000);
        const hours = this._getFieldValue('hours', 63);
        const result = math.calculateSme(bill, hours);
        this._lastResult = result;

        if (result.pivot >= 0) {
          headline.innerHTML = `
            <div class="plugin-calc-headline-row">
              <div>
                <div class="plugin-calc-headline-label">Estimated monthly installment</div>
                <div class="plugin-calc-headline-figure">${formatRand(result.monthlyInstallment)}</div>
              </div>
              <div>
                <div class="plugin-calc-headline-label">Estimated monthly savings</div>
                <div class="plugin-calc-headline-figure">${formatRand(result.monthlySavings)}</div>
              </div>
            </div>
            <p class="plugin-calc-pivot-fallback">That's an estimated ${formatRand(result.pivot)}/month back in your pocket, from day one.</p>
          `;
        } else {
          headline.innerHTML = `
            <p class="plugin-calc-pivot-fallback">At this size, financing may run close to or above your savings — this is where site-specific numbers matter. Let's talk it through.</p>
          `;
        }
      } else {
        const bill = this._getFieldValue('bill', 2500);
        const result = math.calculateResidential(bill);
        this._lastResult = result;

        headline.innerHTML = `
          <div class="plugin-calc-headline-row">
            <div>
              <div class="plugin-calc-headline-label">Estimated monthly savings</div>
              <div class="plugin-calc-headline-figure">${formatRand(result.firstYearSavings / 12)}</div>
            </div>
            <div>
              <div class="plugin-calc-headline-label">Estimated payback period</div>
              <div class="plugin-calc-headline-figure">${result.paybackYears.toFixed(1)} years</div>
            </div>
          </div>
        `;
      }
    }
  }

  customElements.define('plugin-calculator', PluginCalculator);
})();
```

- [ ] **Step 2: Create the component test harness**

Create `plugins/calculator/test.html` with this exact content:

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Calculator — Test Harness</title>
<style>
  body { margin: 0; padding: 3rem 2rem; background: #f3f4f6; font-family: system-ui, sans-serif; }
  .wrap { max-width: 700px; margin: 0 auto; display: flex; flex-direction: column; gap: 3rem; }
</style>
</head>
<body>
<div class="wrap">
  <div>
    <h1>Residential mode</h1>
    <plugin-calculator mode="residential" webhook="PENDING_BACKEND"></plugin-calculator>
  </div>
  <div>
    <h1>SME mode</h1>
    <plugin-calculator mode="sme" webhook="PENDING_BACKEND"></plugin-calculator>
  </div>
</div>
<script src="assumptions.js"></script>
<script src="calculator-math.js"></script>
<script src="calculator.js" defer></script>
</body>
</html>
```

- [ ] **Step 3: Verify in browser**

Open `http://localhost:8010/plugins/calculator/test.html` and verify:

1. Residential instance: default bill is R2,500. Headline shows "Estimated monthly savings" ≈ R2,125 (R25,500 ÷ 12) and "Estimated payback period" ≈ 4.7 years, matching Task 1's verified `firstYearSavings`/`paybackYears` for this bill.
2. Dragging the residential slider updates both the number input and the headline figures live, with no lag or flicker.
3. SME instance: default bill R15,000, default hours 63. Headline shows the positive pivot line ("...R2,516/month back in your pocket..." or similarly close, matching Task 1's verified SME-63hrs case) — not the fallback message.
4. Lower the SME hours slider to around 10. The headline should switch to the fallback message ("At this size, financing may run close to or above your savings...") instead of showing a negative Rand figure — confirming the negative-pivot branch works.
5. The disclaimer text is visible under both instances' headlines at all times, without needing to scroll or hover.
6. No console errors on page load or while interacting with either instance.

- [ ] **Step 4: Report**

Leave both files as created (do not commit). Report DONE with the results of all 6 checks.

---

### Task 3: Email gate, webhook submission, and gated detail view

**Files:**
- Modify: `plugins/calculator/calculator.js` (add gate form, honeypot, webhook POST, detail view, SVG chart)

**Interfaces:**
- Consumes: `this._mode` and `this._lastResult`, set by Task 2's `_recalculate()` — do not change how or when those are set.
- Produces: no new interface for later tasks — this is the last functional task; Task 4 is documentation + final QA only.

- [ ] **Step 1: Add a module-level instance counter**

In `plugins/calculator/calculator.js`, immediately after the opening `(function () {` line and the `if (customElements.get(...)) return;` guard, add:

```js
  let instanceCounter = 0;
```

- [ ] **Step 2: Add gate/detail markup and CSS**

In the same file, inside the `injectBaseStyles` function's template string, add these rules immediately before the closing `` ` `` of `style.textContent`:

```css
      .plugin-calc-gate {
        margin-top: 1rem;
      }

      .plugin-calc-gate label {
        display: block;
        font-weight: 700;
        font-size: 0.875rem;
        margin-bottom: 0.5rem;
      }

      .plugin-calc-gate-row {
        display: flex;
        gap: 0.5rem;
      }

      .plugin-calc-email {
        flex: 1;
        padding: 0.5rem 0.75rem;
        border: 1px solid var(--plugin-calc-text-muted);
        border-radius: 0.5rem;
        font-size: 0.875rem;
      }

      .plugin-calc-submit {
        background: var(--plugin-calc-accent);
        color: #ffffff;
        border: none;
        border-radius: 0.5rem;
        padding: 0.5rem 1.25rem;
        font-weight: 700;
        font-size: 0.875rem;
        cursor: pointer;
      }

      .plugin-calc-hp {
        position: absolute;
        left: -9999px;
      }

      .plugin-calc-detail {
        margin-top: 1.5rem;
        padding-top: 1.5rem;
        border-top: 1px solid var(--plugin-calc-text-muted);
      }

      .plugin-calc-detail-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 1rem;
        margin-bottom: 1rem;
      }

      .plugin-calc-chart svg {
        width: 100%;
        height: auto;
      }
```

- [ ] **Step 3: Add the chart-building helper function**

In the same file, add this function after `formatRand` and before `residentialInputsHtml`:

```js
  function buildChartSvg(cumulativeByYear) {
    const width = 400;
    const height = 160;
    const barGap = 2;
    const barWidth = width / cumulativeByYear.length - barGap;
    const maxValue = cumulativeByYear[cumulativeByYear.length - 1];

    const bars = cumulativeByYear.map((value, index) => {
      const barHeight = (value / maxValue) * (height - 20);
      const x = index * (barWidth + barGap);
      const y = height - barHeight;
      return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${barWidth.toFixed(1)}" height="${barHeight.toFixed(1)}" fill="var(--plugin-calc-accent)"/>`;
    }).join('');

    return `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="20-year cumulative savings projection, reaching approximately ${formatRand(maxValue)} by year 20">${bars}</svg>`;
  }
```

- [ ] **Step 4: Update `connectedCallback` to render the gate and detail sections**

Replace the `this.innerHTML = ...` assignment inside `connectedCallback` (the block that currently ends with the `.plugin-calc-disclaimer` div) with:

```js
      this._instanceId = 'plugin-calc-' + (instanceCounter++);

      this.innerHTML = `
        <div class="plugin-calc-card">
          <div class="plugin-calc-inputs">${inputsHtml}</div>
          <div class="plugin-calc-headline"></div>
          <div class="plugin-calc-disclaimer">${DISCLAIMER_TEXT}</div>
          <form class="plugin-calc-gate" novalidate>
            <label for="${this._instanceId}-email">Unlock your full savings report</label>
            <div class="plugin-calc-gate-row">
              <input type="email" id="${this._instanceId}-email" class="plugin-calc-email" placeholder="you@example.com" required/>
              <button type="submit" class="plugin-calc-submit">Unlock</button>
            </div>
            <div class="plugin-calc-hp" aria-hidden="true">
              <label for="${this._instanceId}-website">Website</label>
              <input type="text" id="${this._instanceId}-website" class="plugin-calc-honeypot" tabindex="-1" autocomplete="off"/>
            </div>
          </form>
          <div class="plugin-calc-detail" hidden></div>
        </div>
      `;

      this._wireInputs();
      this._wireGate();
      this._recalculate();
```

(This replaces the previous three lines `this.innerHTML = ...`, `this._wireInputs();`, `this._recalculate();` — the new version adds the gate/detail markup and a new `this._wireGate();` call between them.)

- [ ] **Step 5: Add the `_wireGate` and `_revealDetail` methods**

In the same file, add these two methods to the `PluginCalculator` class, immediately after `_wireInputs()`:

```js
    _wireGate() {
      const form = this.querySelector('.plugin-calc-gate');
      form.addEventListener('submit', (event) => {
        event.preventDefault();

        const honeypot = this.querySelector('.plugin-calc-honeypot');
        if (honeypot && honeypot.value) return;

        const emailInput = this.querySelector('.plugin-calc-email');
        if (!emailInput.checkValidity()) {
          emailInput.reportValidity();
          return;
        }

        const inputs =
          this._mode === 'sme'
            ? { bill: this._getFieldValue('bill', 15000), operatingHoursPerWeek: this._getFieldValue('hours', 63) }
            : { bill: this._getFieldValue('bill', 2500) };

        const payload = {
          mode: this._mode,
          inputs,
          results: this._lastResult,
          email: emailInput.value,
          timestamp: new Date().toISOString(),
        };

        const webhookUrl = this.getAttribute('webhook');
        if (webhookUrl && webhookUrl !== 'PENDING_BACKEND') {
          fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          }).catch(() => {});
        } else {
          console.warn('[plugin-calculator] No webhook configured (or still PENDING_BACKEND) — lead not sent:', payload);
        }

        form.hidden = true;
        this._revealDetail();
      });
    }

    _revealDetail() {
      const detail = this.querySelector('.plugin-calc-detail');
      const r = this._lastResult;

      if (this._mode === 'sme') {
        detail.innerHTML = `
          <div class="plugin-calc-detail-grid">
            <div><div class="plugin-calc-headline-label">Recommended panels</div><div>${r.panelKw.toFixed(1)} kW</div></div>
            <div><div class="plugin-calc-headline-label">Recommended inverter</div><div>${r.inverterKw} kW</div></div>
            <div><div class="plugin-calc-headline-label">Recommended battery</div><div>${r.batteryKwh.toFixed(1)} kWh</div></div>
            <div><div class="plugin-calc-headline-label">Estimated system cost</div><div>${formatRand(r.systemCost)}</div></div>
          </div>
        `;
      } else {
        detail.innerHTML = `
          <div class="plugin-calc-detail-grid">
            <div><div class="plugin-calc-headline-label">Recommended panels</div><div>${r.panelKw.toFixed(1)} kW</div></div>
            <div><div class="plugin-calc-headline-label">Recommended inverter</div><div>${r.inverterKw} kW</div></div>
            <div><div class="plugin-calc-headline-label">Recommended battery</div><div>${r.batteryKwh.toFixed(1)} kWh</div></div>
            <div><div class="plugin-calc-headline-label">Estimated system cost</div><div>${formatRand(r.systemCost)}</div></div>
            <div><div class="plugin-calc-headline-label">First-year savings</div><div>${formatRand(r.firstYearSavings)}</div></div>
          </div>
          <div class="plugin-calc-chart">${buildChartSvg(r.cumulativeByYear)}</div>
        `;
      }
      detail.hidden = false;
    }
```

- [ ] **Step 6: Verify in browser**

Reload `http://localhost:8010/plugins/calculator/test.html` (existing file
from Task 2, unchanged) and verify, for BOTH the residential and SME
instances:

1. Typing text into the honeypot field (use browser devtools to set
   `document.querySelectorAll('.plugin-calc-honeypot')[0].value = 'spam'`
   in the console, then submit) — the form should NOT reveal the detail
   view and should NOT log the "No webhook configured" warning. Reset the
   honeypot value afterward and re-test normally.
2. Submitting with an invalid or empty email shows the browser's native
   validation message and does not reveal the detail view.
3. Submitting with a valid email: the gate form disappears, the detail
   view appears in its place (no page navigation/redirect), and the
   browser console shows `[plugin-calculator] No webhook configured (or
   still PENDING_BACKEND) — lead not sent:` followed by a payload object
   matching the shape `{ mode, inputs, results, email, timestamp }` from
   spec §10.
4. Residential detail view shows panel/inverter/battery/cost/first-year-savings
   figures matching Task 1's verified numbers for the current bill, plus an
   SVG bar chart with 20 bars of increasing height.
5. SME detail view (with hours set back to 63 for a positive pivot) shows
   the same style of breakdown, without a chart (SME has no 20-year
   projection per spec §5).
6. Change `webhook="PENDING_BACKEND"` to `webhook="https://example.com/test"`
   directly in the HTML (temporarily, for this check only), reload, and
   resubmit — confirm via the Network tab that a POST request fires to that
   URL with the expected JSON body (the request will fail since the URL
   isn't real — that's expected; you're only confirming the request shape,
   not a successful response). Revert the attribute back to
   `webhook="PENDING_BACKEND"` before finishing.

- [ ] **Step 7: Report**

Leave `calculator.js` modified (do not commit). Report DONE with the results of all 6 checks, and confirm the `webhook` attribute in `test.html` was reverted to `"PENDING_BACKEND"` after check 6.

---

### Task 4: README and final verification pass

**Files:**
- Create: `plugins/calculator/README.md`

**Interfaces:**
- Consumes: the exact custom element name, attributes (`mode`, `webhook`), CSS variable names, and payload shape from Tasks 1-3 — do not invent different names.
- Produces: documentation only — terminal task, nothing downstream.

- [ ] **Step 1: Create the README**

Create `plugins/calculator/README.md` with this exact content:

````markdown
# plugin-calculator

A portable solar/SME savings calculator. No build step, no framework, no
dependency on any host project's Tailwind config or design tokens.

## Usage

Drop all four files into your project (keep them together), then add:

```html
<script src="path/to/assumptions.js"></script>
<script src="path/to/calculator-math.js"></script>
<script src="path/to/calculator.js" defer></script>
```

Then place the element anywhere in your page:

```html
<plugin-calculator mode="residential" webhook="https://your-webhook-url"></plugin-calculator>
<plugin-calculator mode="sme" webhook="https://your-webhook-url"></plugin-calculator>
```

- `mode` — `"residential"` (default) or `"sme"`.
- `webhook` — where the lead payload is POSTed on gate-unlock. If omitted or
  set to the literal string `"PENDING_BACKEND"`, the payload is logged to
  the console instead of sent — useful during development before a real
  webhook exists.

## How it works

- Both modes show a live-updating headline as the visitor adjusts a
  slider/number input for their monthly bill (and, for SME, weekly
  operating hours).
- A permanent disclaimer is always visible: these are estimates, not a
  formal design or finance offer.
- Submitting an email in the "Unlock your full savings report" gate POSTs
  a JSON payload — `{ mode, inputs, results, email, timestamp }` — to the
  `webhook` attribute, then reveals a fuller breakdown (system size, cost,
  and for residential mode, a 20-year savings chart) in place.
- SME mode can produce a negative "pivot" (financing costs more than
  savings) for businesses with very short operating hours — this shows an
  honest fallback message instead of a discouraging raw number, but still
  offers the same email-gate CTA.
- A honeypot field guards the gate form against basic spam bots.

## Editing the assumptions

Every number the calculator relies on — tariff rates, sun-hours,
cost-per-kW, escalation rate, finance term/rate — lives in
`assumptions.js` as a single labeled config object, separate from the
calculation logic in `calculator-math.js`. Edit values there; no other
file needs to change.

## Theming

Override any of these CSS custom properties to match your project's brand:

| Variable | Default | Purpose |
|---|---|---|
| `--plugin-calc-accent` | `#ff8000` | Headline figures, slider accent, submit button, chart bars |
| `--plugin-calc-bg` | `#ffffff` | Card background |
| `--plugin-calc-text-color` | `#1a1a1a` | Body text |
| `--plugin-calc-text-muted` | `#6b7280` | Labels, disclaimer, borders |
| `--plugin-calc-radius` | `1rem` | Card and headline corner radius |
| `--plugin-calc-font` | `inherit` | Font-family |

## Known limitations

- No PDF export yet — "download report" is a future feature once a
  backend exists to render one.
- No live tariff/finance-rate lookups — all assumptions are static and
  editable, not fetched from any API.
- Assumes Western Cape sun-hours; there's no region input.
````

- [ ] **Step 2: Final verification pass**

Re-run every check from Task 1 Step 4, Task 2 Step 3, and Task 3 Step 6 in
one pass, on both `test-math.html` and `test.html`, to confirm nothing
regressed across the three tasks. Also verify:

1. Overriding `--plugin-calc-accent` (e.g. via a `<style>` block in
   `test.html` setting `:root { --plugin-calc-accent: #2563eb; }`) changes
   the slider color, headline figures, submit button, and chart bars all
   at once, with no code changes needed.
2. Both `<plugin-calculator>` instances on the same page (residential + SME
   in `test.html`) have independently working gates — unlocking one does
   not affect the other, and their honeypot/email field `id` attributes do
   not collide (confirm via devtools that each instance's `_instanceId` is
   unique).

- [ ] **Step 3: Report**

Leave `README.md` as created (do not commit). Report DONE with confirmation
that the full re-verification pass found no regressions, explicitly listing
the result of both new checks in this step.

---

### Task 5: Wire both calculators into the Sunlogic solar page

**Files:**
- Modify: `site/solar.html:23-25` (add plugin script tags)
- Modify: `site/solar.html:58-59` (insert residential calculator)
- Modify: `site/solar.html:68-69` (insert SME calculator)

**Interfaces:**
- Consumes: `<plugin-calculator>` custom element, `mode`/`webhook` attributes, and the exact file paths `plugins/calculator/{assumptions.js,calculator-math.js,calculator.js}` — all produced by Tasks 1-3. Do not rename or move those files.
- Produces: a live section on `site/solar.html` — terminal task, nothing downstream consumes new interfaces from this task.

`site/solar.html` already has a "Residential / Small Business / Commercial"
section (spec §13 asked for placement to be decided during planning): the
residential calculator fits naturally next to the existing "Residential
Solar" pitch, and the SME calculator fits next to "Commercial Solar" (the
card that already talks about cost-control decisions and payback — the
same framing as the SME calculator's cash-flow pivot).

- [ ] **Step 1: Add the plugin script tags**

In `site/solar.html`, find this block (currently lines 23-25):

```html
<script src="shared/tokens.js?v=2"></script>
<script src="shared/icons.js?v=2"></script>
<script src="shared/components.js?v=2" defer></script>
```

Add three new lines immediately after it, so the block reads:

```html
<script src="shared/tokens.js?v=2"></script>
<script src="shared/icons.js?v=2"></script>
<script src="shared/components.js?v=2" defer></script>
<script src="../plugins/calculator/assumptions.js?v=1"></script>
<script src="../plugins/calculator/calculator-math.js?v=1"></script>
<script src="../plugins/calculator/calculator.js?v=1" defer></script>
```

The `../` is required: `plugins/` is a sibling of `site/`, not a subfolder
of it (same pattern already used for `review-carousel` on the homepage).
`assumptions.js` and `calculator-math.js` are NOT deferred — they must set
their globals synchronously before `calculator.js` (deferred) reads them,
matching the same non-deferred-then-deferred ordering already used for
`tokens.js`/`icons.js` → `components.js` on every page.

- [ ] **Step 2: Insert the residential calculator**

In `site/solar.html`, find this block (currently lines 56-59):

```html
<h2 class="font-headline-sm text-headline-sm text-primary-container mb-4">Residential Solar</h2>
<p class="font-body-md text-body-md text-on-surface-variant leading-relaxed">A residential system is designed around how your household uses electricity — panels, an inverter, and battery storage if you want it, sized and quoted honestly rather than sold as a standard package. What it costs, what it saves, and roughly when it pays for itself are all set out before you commit to anything. [Workmanship warranty length — BRIEF.md §12 #5, currently 3 months against competitors' 3–10 years, worth resolving before this goes live.]</p>
</div>
<div id="small-business" class="bg-surface-container-lowest p-8 md:p-10 rounded-2xl shadow-card">
```

Insert the residential calculator as a new sibling element between the
closing `</div>` of the residential card and the opening `<div
id="small-business" ...>`, so the block reads:

```html
<h2 class="font-headline-sm text-headline-sm text-primary-container mb-4">Residential Solar</h2>
<p class="font-body-md text-body-md text-on-surface-variant leading-relaxed">A residential system is designed around how your household uses electricity — panels, an inverter, and battery storage if you want it, sized and quoted honestly rather than sold as a standard package. What it costs, what it saves, and roughly when it pays for itself are all set out before you commit to anything. [Workmanship warranty length — BRIEF.md §12 #5, currently 3 months against competitors' 3–10 years, worth resolving before this goes live.]</p>
</div>
<plugin-calculator mode="residential" webhook="PENDING_BACKEND"></plugin-calculator>
<div id="small-business" class="bg-surface-container-lowest p-8 md:p-10 rounded-2xl shadow-card">
```

- [ ] **Step 3: Insert the SME calculator**

In `site/solar.html`, find this block (currently lines 66-70):

```html
<h2 class="font-headline-sm text-headline-sm text-primary-container mb-4">Commercial Solar</h2>
<p class="font-body-md text-body-md text-on-surface-variant leading-relaxed">For a commercial site, solar is a cost-control decision, sized to the actual load profile rather than a generic package. The payback is worked through properly, including the Section 12B first-year tax deduction, which still applies to commercial PV up to 1MW. [Whether the electrical work is fully in-house or includes subcontractors needs confirming — BRIEF.md §2.2 — before stating "one team throughout" as fact.]</p>
</div>
</div>
</sl-section>
```

Insert the SME calculator as a new sibling element between the closing
`</div>` of the commercial card and the closing `</div>` of the
flex-column wrapper, so the block reads:

```html
<h2 class="font-headline-sm text-headline-sm text-primary-container mb-4">Commercial Solar</h2>
<p class="font-body-md text-body-md text-on-surface-variant leading-relaxed">For a commercial site, solar is a cost-control decision, sized to the actual load profile rather than a generic package. The payback is worked through properly, including the Section 12B first-year tax deduction, which still applies to commercial PV up to 1MW. [Whether the electrical work is fully in-house or includes subcontractors needs confirming — BRIEF.md §2.2 — before stating "one team throughout" as fact.]</p>
</div>
<plugin-calculator mode="sme" webhook="PENDING_BACKEND"></plugin-calculator>
</div>
</sl-section>
```

- [ ] **Step 4: Verify in browser**

With a server rooted at the repo root running (`python3 -m http.server
8010` from the repo root), open `http://localhost:8010/site/solar.html`
(not port 8000 — the `../plugins/...` paths require the repo-root server).
Scroll to the "Residential / Small Business / Commercial" section and
verify:

1. The residential calculator renders directly under the "Residential
   Solar" text, and the SME calculator renders directly under the
   "Commercial Solar" text — both fully functional (live headline, gate,
   detail view) exactly as verified in Tasks 2-3's standalone harness.
2. No visual collision or awkward spacing between the plugin's own card
   styling and the surrounding `sl-section`/Tailwind layout — the plugin
   card should read as a distinct, self-contained block, not squeezed
   inside the existing white "For Your Home"/"For Commercial Sites" cards.
3. No console errors on page load.
4. The residential and SME calculator instances on this page operate
   fully independently (same multi-instance check as Task 4 Step 2, now
   confirmed in a real page context, not just the test harness).

- [ ] **Step 5: Report**

Leave `site/solar.html` modified (do not commit). Report DONE with
confirmation of all 4 verification checks.
