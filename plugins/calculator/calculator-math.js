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
