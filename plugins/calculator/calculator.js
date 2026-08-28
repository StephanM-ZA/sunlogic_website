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