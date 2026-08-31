(function () {
  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function amortizedPayment(principal, monthlyRate, numMonths) {
    if (monthlyRate === 0) return principal / numMonths;
    const factor = Math.pow(1 + monthlyRate, numMonths);
    return (principal * monthlyRate * factor) / (factor - 1);
  }

  /* Both calculators size and cost a system off the bill's usage-based
     portion only — a flat network/service charge doesn't reflect kWh
     consumed, so solar can't touch it, and it never disappears once you
     go solar. See FIXED_CHARGE_PORTION in assumptions.js. */
  function usageBill(bill, fixedCharge) {
    return Math.max(bill - fixedCharge, 0);
  }

  function co2Estimate(annualKwhOffset, A) {
    const annualCo2Kg = annualKwhOffset * A.GRID_EMISSIONS_KG_CO2_PER_KWH;
    return {
      annualCo2Kg,
      treesEquivalent: annualCo2Kg / A.CO2_KG_OFFSET_PER_TREE_PER_YEAR,
    };
  }

  /* The 20-year cumulative-savings projection as a running total (rather
     than the closed-form geometric sum) so a one-time cost — the inverter
     replacement — can be subtracted at the year it actually happens and
     carry forward, instead of pretending the savings curve never needs
     another cent spent on it. */
  function cumulativeSavingsByYear(firstYearSavings, systemCost, A) {
    const replacementCost = systemCost * A.INVERTER_REPLACEMENT_COST_FACTOR;
    const cumulativeByYear = [];
    let cumulative = 0;
    for (let y = 1; y <= A.PROJECTION_YEARS; y++) {
      const yearSavings = firstYearSavings * Math.pow(1 + A.ANNUAL_TARIFF_ESCALATION, y - 1);
      cumulative += yearSavings;
      if (y === A.INVERTER_LIFESPAN_YEARS) cumulative -= replacementCost;
      cumulativeByYear.push(Math.max(cumulative, 0));
    }
    return cumulativeByYear;
  }

  function calculateResidential(bill, includeBattery) {
    const A = window.PLUGIN_CALCULATOR_ASSUMPTIONS;
    const billForSizing = usageBill(bill, A.FIXED_CHARGE_PORTION);
    const monthlyKwh = billForSizing / A.TARIFF_RATE;
    const dailyKwh = monthlyKwh / 30;
    const panelKw = dailyKwh / A.SUN_HOURS_PER_DAY;
    const batteryKwh = includeBattery ? dailyKwh * A.BATTERY_KWH_PER_DAILY_KWH : 0;
    const inverterKw = Math.ceil(panelKw);
    /* A flat install-cost floor (site visit, DB work, commissioning) that
       doesn't shrink with system size is what makes payback genuinely
       respond to bill size — see FIXED_INSTALL_COST in assumptions.js.
       Panel and battery cost are priced separately so a panels-only
       estimate isn't paying for storage it doesn't have. */
    const systemCost =
      A.FIXED_INSTALL_COST +
      panelKw * A.PANEL_COST_PER_KW +
      (includeBattery ? batteryKwh * A.BATTERY_COST_PER_KWH : 0);
    const offsetFactor = includeBattery
      ? A.RESIDENTIAL_OFFSET_FACTOR_WITH_BATTERY
      : A.RESIDENTIAL_OFFSET_FACTOR_PANELS_ONLY;
    const firstYearSavings = billForSizing * 12 * offsetFactor;

    const paybackYears = systemCost / firstYearSavings;
    const paybackYearsLow = paybackYears * (1 - A.PAYBACK_RANGE_SPREAD);
    const paybackYearsHigh = paybackYears * (1 + A.PAYBACK_RANGE_SPREAD);

    const annualKwhOffset = monthlyKwh * 12 * offsetFactor;
    const co2 = co2Estimate(annualKwhOffset, A);

    return {
      includeBattery,
      panelKw,
      batteryKwh,
      inverterKw,
      systemCost,
      firstYearSavings,
      paybackYears,
      paybackYearsLow,
      paybackYearsHigh,
      annualCo2Kg: co2.annualCo2Kg,
      treesEquivalent: co2.treesEquivalent,
      cumulativeByYear: cumulativeSavingsByYear(firstYearSavings, systemCost, A),
    };
  }

  function calculateSme(bill, weeklyOperatingHours, includeBattery) {
    const A = window.PLUGIN_CALCULATOR_ASSUMPTIONS;
    const billForSizing = usageBill(bill, A.SME_FIXED_CHARGE_PORTION);
    const monthlyKwh = billForSizing / A.SME_TARIFF_RATE;
    const dailyKwh = monthlyKwh / 30;
    const panelKw = dailyKwh / A.SUN_HOURS_PER_DAY;
    const batteryKwh = includeBattery ? dailyKwh * A.BATTERY_KWH_PER_DAILY_KWH : 0;
    const inverterKw = Math.ceil(panelKw);
    const systemCost =
      A.SME_FIXED_INSTALL_COST +
      panelKw * A.SME_PANEL_COST_PER_KW +
      (includeBattery ? batteryKwh * A.BATTERY_COST_PER_KWH : 0);

    const operatingHoursPerDay = weeklyOperatingHours / 7;
    const overlapFraction = clamp(
      operatingHoursPerDay / A.DAYLIGHT_HOURS_ASSUMPTION,
      A.MIN_OVERLAP_FLOOR,
      1.0
    );
    const baseOffsetFactor = includeBattery
      ? A.SME_OFFSET_FACTOR_WITH_BATTERY
      : A.SME_OFFSET_FACTOR_PANELS_ONLY;
    const effectiveOffsetFactor = baseOffsetFactor * overlapFraction;

    const monthlySavings = billForSizing * effectiveOffsetFactor;
    const monthlyRate = A.FINANCE_ANNUAL_RATE / 12;
    const monthlyInstallment = amortizedPayment(systemCost, monthlyRate, A.FINANCE_TERM_MONTHS);
    const pivot = monthlySavings - monthlyInstallment;

    const annualKwhOffset = monthlyKwh * 12 * effectiveOffsetFactor;
    const co2 = co2Estimate(annualKwhOffset, A);

    return {
      includeBattery,
      panelKw,
      batteryKwh,
      inverterKw,
      systemCost,
      overlapFraction,
      effectiveOffsetFactor,
      monthlySavings,
      monthlyInstallment,
      pivot,
      annualCo2Kg: co2.annualCo2Kg,
      treesEquivalent: co2.treesEquivalent,
    };
  }

  window.PluginCalculatorMath = {
    clamp,
    amortizedPayment,
    calculateResidential,
    calculateSme,
  };
})();
