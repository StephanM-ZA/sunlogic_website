(function () {
  if (customElements.get('plugin-calculator')) return;

  let instanceCounter = 0;

  function injectBaseStyles() {
    if (document.getElementById('plugin-calculator-styles')) return;
    const style = document.createElement('style');
    style.id = 'plugin-calculator-styles';
    style.textContent = `
      plugin-calculator { display: contents; }

      :where(:root) {
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
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--plugin-calc-text-color);
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

      .plugin-calc-toggle-row {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .plugin-calc-toggle-row input {
        accent-color: var(--plugin-calc-accent);
        width: 1.1rem;
        height: 1.1rem;
      }

      .plugin-calc-toggle-row label {
        font-weight: 700;
        font-size: 0.875rem;
        margin-bottom: 0;
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

      .plugin-calc-headline-note {
        font-size: 0.8rem;
        color: var(--plugin-calc-text-muted);
        margin: 0.75rem 0 0;
      }

      .plugin-calc-pivot-fallback {
        font-size: 1rem;
        font-weight: 600;
        color: var(--plugin-calc-text-color);
        line-height: 1.5;
      }

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

      .plugin-calc-co2 {
        font-size: 0.875rem;
        color: var(--plugin-calc-text-muted);
        margin: 0 0 1rem;
      }

      .plugin-calc-chart svg {
        width: 100%;
        height: auto;
      }
    `;
    document.head.appendChild(style);
  }

  function formatRand(amount) {
    const rounded = Math.round(amount);
    const withSeparators = rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return 'R' + withSeparators;
  }

  function formatCo2(annualCo2Kg, treesEquivalent) {
    const tons = annualCo2Kg / 1000;
    const tonsText = tons >= 1 ? tons.toFixed(1) + ' tons' : Math.round(annualCo2Kg) + ' kg';
    return `~${tonsText} of CO₂ avoided per year — roughly the same as ${Math.round(treesEquivalent)} trees planted.`;
  }

  /* `payback` draws a break-even line at the system cost, and shades the
     bars before it — the same figure as the headline's "typical payback
     period", so a visitor can see the crossing rather than take the
     number's word for it. Optional so a caller without a cost figure
     (there is none today) still gets the plain chart. */
  function buildChartSvg(cumulativeByYear, payback) {
    const width = 400;
    const height = 160;
    const barGap = 2;
    const barWidth = width / cumulativeByYear.length - barGap;
    const maxValue = Math.max(cumulativeByYear[cumulativeByYear.length - 1], payback || 0);
    const plotHeight = height - 20;
    const toY = (value) => height - (value / maxValue) * plotHeight;

    const bars = cumulativeByYear.map((value, index) => {
      const barHeight = Math.max((value / maxValue) * plotHeight, 0);
      const x = index * (barWidth + barGap);
      const y = height - barHeight;
      const paidOff = payback != null && value >= payback;
      return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${barWidth.toFixed(1)}" height="${barHeight.toFixed(1)}" fill="var(--plugin-calc-accent)" opacity="${paidOff ? 1 : 0.4}"/>`;
    }).join('');

    let breakEven = '';
    let label = `${cumulativeByYear.length}-year cumulative savings projection, reaching approximately ${formatRand(maxValue)} by year ${cumulativeByYear.length}`;
    if (payback != null && payback > 0 && payback <= maxValue) {
      const y = toY(payback).toFixed(1);
      breakEven =
        `<line x1="0" y1="${y}" x2="${width}" y2="${y}" stroke="var(--plugin-calc-text-color, currentColor)" stroke-width="1" stroke-dasharray="4 3" opacity="0.6"/>` +
        `<text x="${width - 4}" y="${(toY(payback) - 5).toFixed(1)}" text-anchor="end" font-size="10" fill="var(--plugin-calc-text-color, currentColor)" opacity="0.7">Estimated system cost</text>`;
      label += `. The dashed line marks the estimated system cost — bars before the crossing are the payback period, shaded lighter. The dip midway is a real inverter-replacement cost, not a data error.`;
    }

    return `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${label}">${bars}${breakEven}</svg>`;
  }

  function batteryToggleHtml(instanceId, checkedByDefault) {
    return `
      <div class="plugin-calc-input-group plugin-calc-toggle-row">
        <input type="checkbox" id="${instanceId}-battery" data-field="battery" ${checkedByDefault ? 'checked' : ''}/>
        <label for="${instanceId}-battery">Include battery storage</label>
      </div>
    `;
  }

  function residentialInputsHtml(instanceId) {
    return `
      <div class="plugin-calc-input-group">
        <label for="${instanceId}-bill">Average monthly electricity bill</label>
        <div class="plugin-calc-slider-row">
          <input type="range" class="plugin-calc-range" data-field="bill" min="300" max="15000" step="50" value="2500"/>
          <input type="number" id="${instanceId}-bill" class="plugin-calc-number" data-field="bill" min="300" max="15000" step="50" value="2500"/>
        </div>
      </div>
      ${batteryToggleHtml(instanceId, true)}
    `;
  }

  function smeInputsHtml(instanceId) {
    return `
      <div class="plugin-calc-input-group">
        <label for="${instanceId}-bill">Average monthly electricity bill</label>
        <div class="plugin-calc-slider-row">
          <input type="range" class="plugin-calc-range" data-field="bill" min="500" max="100000" step="100" value="15000"/>
          <input type="number" id="${instanceId}-bill" class="plugin-calc-number" data-field="bill" min="500" max="100000" step="100" value="15000"/>
        </div>
      </div>
      <div class="plugin-calc-input-group">
        <label for="${instanceId}-hours">Weekly operating hours</label>
        <div class="plugin-calc-slider-row">
          <input type="range" class="plugin-calc-range" data-field="hours" min="0" max="168" step="1" value="63"/>
          <input type="number" id="${instanceId}-hours" class="plugin-calc-number" data-field="hours" min="0" max="168" step="1" value="63"/>
        </div>
      </div>
      ${batteryToggleHtml(instanceId, false)}
    `;
  }

  const DISCLAIMER_TEXT = 'Figures are indicative estimates based on typical Western Cape conditions and standard industry assumptions — not a formal system design or finance offer. Contact us for an accurate, site-specific quote.';

  class PluginCalculator extends HTMLElement {
    connectedCallback() {
      if (this._rendered) return;
      this._rendered = true;
      injectBaseStyles();

      if (!window.PluginCalculatorMath || !window.PLUGIN_CALCULATOR_ASSUMPTIONS) {
        console.warn('[plugin-calculator] Required scripts (assumptions.js, calculator-math.js) not loaded — cannot render.');
        return;
      }

      this._mode = this.getAttribute('mode') === 'sme' ? 'sme' : 'residential';

      this._instanceId = 'plugin-calc-' + (instanceCounter++);

      const inputsHtml = this._mode === 'sme' ? smeInputsHtml(this._instanceId) : residentialInputsHtml(this._instanceId);

      this.innerHTML = `
        <div class="plugin-calc-card">
          <div class="plugin-calc-inputs">${inputsHtml}</div>
          <div class="plugin-calc-headline" aria-live="polite"></div>
          <div class="plugin-calc-detail"></div>
          <div class="plugin-calc-disclaimer">${DISCLAIMER_TEXT}</div>
          <form class="plugin-calc-gate" novalidate>
            <label for="${this._instanceId}-email">Want this estimate emailed to you?</label>
            <div class="plugin-calc-gate-row">
              <input type="email" id="${this._instanceId}-email" class="plugin-calc-email" placeholder="you@example.com" required/>
              <button type="submit" class="plugin-calc-submit"><span>Email me this</span></button>
            </div>
            <span class="plugin-calc-share-status" aria-live="polite" data-email-status></span>
            <div class="plugin-calc-hp" aria-hidden="true">
              <label for="${this._instanceId}-website">Website</label>
              <input type="text" id="${this._instanceId}-website" class="plugin-calc-honeypot" tabindex="-1" autocomplete="off"/>
            </div>
          </form>
        </div>
      `;

      this._wireInputs();
      this._applyUrlParams();
      this._wireGate();
      this._recalculate();
    }

    _wireInputs() {
      const ranges = this.querySelectorAll('.plugin-calc-range');
      const numbers = this.querySelectorAll('.plugin-calc-number');
      const battery = this.querySelector('[data-field="battery"]');

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
          // Mirror the *clamped* value onto the slider so the slider position
          // always matches the value the headline is actually computed from.
          // The number box itself is left alone mid-typing (see 'change').
          if (range) range.value = this._getFieldValue(field, range.value);
          this._recalculate();
        });

        // On commit (blur / Enter / stepper), normalise the visible number box
        // to the same clamped value, so an out-of-range or cleared field can't
        // keep displaying something the headline disagrees with.
        number.addEventListener('change', () => {
          const field = number.dataset.field;
          const clamped = this._getFieldValue(field, number.value);
          number.value = clamped;
          const range = this.querySelector(`.plugin-calc-range[data-field="${field}"]`);
          if (range) range.value = clamped;
          this._recalculate();
        });
      });

      if (battery) {
        battery.addEventListener('change', () => this._recalculate());
      }
    }

    /* A deep link into this calculator's exact scenario: `res-bill` for the
       residential mode, `sme-bill` / `sme-hours` for the SME mode, plus
       `-battery` for the storage toggle — prefixed so two instances on one
       page (as on solar.html) don't collide. Values run through the same
       clamp as manual input, via _getFieldValue at calculation time, so an
       out-of-range query param can't produce a number the headline
       disagrees with. */
    _applyUrlParams() {
      const params = new URLSearchParams(location.search);
      const apply = (field, param) => {
        if (!params.has(param)) return;
        const value = params.get(param);
        const range = this.querySelector(`.plugin-calc-range[data-field="${field}"]`);
        const number = this.querySelector(`.plugin-calc-number[data-field="${field}"]`);
        if (range) range.value = value;
        if (number) number.value = value;
      };
      const prefix = this._mode === 'sme' ? 'sme' : 'res';
      apply('bill', prefix + '-bill');
      if (this._mode === 'sme') apply('hours', 'sme-hours');
      const batteryParam = prefix + '-battery';
      if (params.has(batteryParam)) {
        const battery = this.querySelector('[data-field="battery"]');
        if (battery) battery.checked = params.get(batteryParam) === '1';
      }
    }

    _getBatteryToggle() {
      const battery = this.querySelector('[data-field="battery"]');
      return battery ? battery.checked : false;
    }

    _wireGate() {
      const form = this.querySelector('.plugin-calc-gate');
      const status = this.querySelector('[data-email-status]');
      form.addEventListener('submit', (event) => {
        event.preventDefault();

        const honeypot = this.querySelector('.plugin-calc-honeypot');
        if (honeypot && honeypot.value) {
          console.warn('[plugin-calculator] honeypot triggered — submission ignored');
          return;
        }

        const emailInput = this.querySelector('.plugin-calc-email');
        if (!emailInput.checkValidity()) {
          emailInput.reportValidity();
          return;
        }

        const inputs =
          this._mode === 'sme'
            ? { bill: this._getFieldValue('bill', 15000), operatingHoursPerWeek: this._getFieldValue('hours', 63), includeBattery: this._getBatteryToggle() }
            : { bill: this._getFieldValue('bill', 2500), includeBattery: this._getBatteryToggle() };

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
          }).catch((err) => {
            console.warn('[plugin-calculator] webhook request failed:', err);
          });
        } else {
          console.warn('[plugin-calculator] No webhook configured (or still PENDING_BACKEND) — lead not sent:', payload);
        }

        emailInput.value = '';
        if (status) {
          status.textContent = "Sent — we'll email that report shortly.";
          clearTimeout(this._emailStatusTimer);
          this._emailStatusTimer = setTimeout(() => { status.textContent = ''; }, 5000);
        }
      });
    }

    /* Always visible — the full breakdown used to sit behind an email
       gate, which meant a shared link (and even the calculator's own
       user) couldn't see system size, cost or the chart without handing
       over an email address first. The gate is now just an optional
       "email me this" convenience, not a lock. */
    _renderDetail() {
      const detail = this.querySelector('.plugin-calc-detail');
      const r = this._lastResult;
      const co2Line = `<p class="plugin-calc-co2">${formatCo2(r.annualCo2Kg, r.treesEquivalent)}</p>`;
      const batteryLine = r.includeBattery ? `${r.batteryKwh.toFixed(1)} kWh` : '0 kWh (not included)';

      if (this._mode === 'sme') {
        detail.innerHTML = `
          <div class="plugin-calc-detail-grid">
            <div><div class="plugin-calc-headline-label">Recommended panels</div><div>${r.panelKw.toFixed(1)} kW</div></div>
            <div><div class="plugin-calc-headline-label">Recommended inverter</div><div>${r.inverterKw} kW</div></div>
            <div><div class="plugin-calc-headline-label">Battery storage</div><div>${batteryLine}</div></div>
            <div><div class="plugin-calc-headline-label">Estimated system cost</div><div>${formatRand(r.systemCost)}</div></div>
          </div>
          <div class="plugin-calc-detail-grid">
            <div><div class="plugin-calc-headline-label">Estimated monthly installment</div><div>${formatRand(r.monthlyInstallment)}</div></div>
            <div><div class="plugin-calc-headline-label">Estimated monthly savings</div><div>${formatRand(r.monthlySavings)}</div></div>
            <div><div class="plugin-calc-headline-label">Estimated monthly cash flow</div><div>${formatRand(r.pivot)}</div></div>
            <div><div class="plugin-calc-headline-label">Illustrative finance term</div><div>${window.PLUGIN_CALCULATOR_ASSUMPTIONS.FINANCE_TERM_MONTHS} months @ ${(window.PLUGIN_CALCULATOR_ASSUMPTIONS.FINANCE_ANNUAL_RATE * 100).toFixed(0)}%</div></div>
          </div>
          ${co2Line}
        `;
      } else {
        detail.innerHTML = `
          <div class="plugin-calc-detail-grid">
            <div><div class="plugin-calc-headline-label">Recommended panels</div><div>${r.panelKw.toFixed(1)} kW</div></div>
            <div><div class="plugin-calc-headline-label">Recommended inverter</div><div>${r.inverterKw} kW</div></div>
            <div><div class="plugin-calc-headline-label">Battery storage</div><div>${batteryLine}</div></div>
            <div><div class="plugin-calc-headline-label">Estimated system cost</div><div>${formatRand(r.systemCost)}</div></div>
            <div><div class="plugin-calc-headline-label">First-year savings</div><div>${formatRand(r.firstYearSavings)}</div></div>
          </div>
          ${co2Line}
          <div class="plugin-calc-chart">${buildChartSvg(r.cumulativeByYear, r.systemCost)}</div>
        `;
      }
    }

    _getFieldValue(field, fallback) {
      const input = this.querySelector(`.plugin-calc-number[data-field="${field}"]`);
      if (!input) return fallback;
      const min = parseFloat(input.min);
      const max = parseFloat(input.max);
      const value = parseFloat(input.value);
      if (!Number.isFinite(value)) {
        return Number.isFinite(min) ? min : fallback;
      }
      return Math.min(Math.max(value, min), max);
    }

    _recalculate() {
      const math = window.PluginCalculatorMath;
      const headline = this.querySelector('.plugin-calc-headline');
      const includeBattery = this._getBatteryToggle();
      const batteryNote = includeBattery ? 'With battery storage' : 'Panels only, grid-tied — no backup during an outage';

      if (this._mode === 'sme') {
        const bill = this._getFieldValue('bill', 15000);
        const hours = this._getFieldValue('hours', 63);
        const result = math.calculateSme(bill, hours, includeBattery);
        this._lastResult = result;

        if (result.pivot >= result.monthlyInstallment * 0.1) {
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
            <p class="plugin-calc-headline-note">${batteryNote}</p>
          `;
        } else {
          headline.innerHTML = `
            <p class="plugin-calc-pivot-fallback">At this size, financing may run close to or above your savings — this is where site-specific numbers matter. Let's talk it through.</p>
            <p class="plugin-calc-headline-note">${batteryNote}</p>
          `;
        }
      } else {
        const bill = this._getFieldValue('bill', 2500);
        const result = math.calculateResidential(bill, includeBattery);
        this._lastResult = result;

        headline.innerHTML = `
          <div class="plugin-calc-headline-row">
            <div>
              <div class="plugin-calc-headline-label">Estimated monthly savings</div>
              <div class="plugin-calc-headline-figure">${formatRand(result.firstYearSavings / 12)}</div>
            </div>
            <div>
              <div class="plugin-calc-headline-label">Typical payback period</div>
              <div class="plugin-calc-headline-figure">${result.paybackYearsLow.toFixed(0)}–${result.paybackYearsHigh.toFixed(0)} years</div>
            </div>
          </div>
          <p class="plugin-calc-headline-note">${batteryNote}</p>
        `;
      }

      this._renderDetail();
    }
  }

  customElements.define('plugin-calculator', PluginCalculator);
})();
