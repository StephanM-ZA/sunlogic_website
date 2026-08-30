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
  PAYBACK_RANGE_SPREAD: 0.2,             // ±20% band around the point estimate, standing in for
                                          // site-specific variance (orientation, shading, exact
                                          // installed cost) this simplified model can't capture — estimate
};
