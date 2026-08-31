// Every value below is a labeled estimate for lead-generation purposes,
// not a verified current fact — Sunlogic should review and can edit any
// of these without touching calculator-math.js or calculator.js.
window.PLUGIN_CALCULATOR_ASSUMPTIONS = {
  SUN_HOURS_PER_DAY: 4.5,               // avg peak sun hours, Western Cape — estimate
  TARIFF_RATE: 2.80,                     // R/kWh, blended residential Cape Town — estimate
  SME_TARIFF_RATE: 2.50,                 // R/kWh, blended commercial — estimate
  /* A defensible middle of Sunlogic's own cited, sourced NERSA/City of
     Cape Town increases (blog-why-your-bill-went-up.html): Eskom direct
     12.74% (2025) then 8.76% (2026), municipal bulk 11.32% then 9.01%,
     Cape Town's own residential categories 5.92%-8.65% for 2026/27. Only
     used in the residential 20-year chart — the headline payback figure
     and the whole SME calculator both use year-one numbers only, so this
     doesn't touch those. */
  ANNUAL_TARIFF_ESCALATION: 0.07,        // 7%/yr — estimate, see comment

  /* A real bill is part usage (R/kWh) and part flat network/service charge
     that solar can never offset — this site's own blog covers the real
     NERSA-driven shift toward fixed charges. Subtracting this before sizing
     and savings math is what makes payback respond to bill size at all: a
     small bill has this as a bigger share of the total, so proportionally
     less of it is actually offsettable. */
  FIXED_CHARGE_PORTION: 150,             // R/month, residential — estimate
  SME_FIXED_CHARGE_PORTION: 800,         // R/month, commercial (bigger demand/service charges) — estimate

  /* Offset factor depends on whether a battery is included: without one, a
     Western Cape municipal customer generally has no meaningful export
     credit, so only real-time self-consumption counts — a much lower
     ceiling than with storage. */
  RESIDENTIAL_OFFSET_FACTOR_WITH_BATTERY: 0.85,   // estimate
  RESIDENTIAL_OFFSET_FACTOR_PANELS_ONLY: 0.55,    // estimate
  SME_OFFSET_FACTOR_WITH_BATTERY: 0.90,           // base, before operating-hours scaling — estimate
  SME_OFFSET_FACTOR_PANELS_ONLY: 0.65,            // base, before operating-hours scaling — estimate

  /* Panel/inverter/labour cost only — battery priced separately below so a
     panels-only estimate isn't paying for storage it doesn't have. */
  PANEL_COST_PER_KW: 13000,              // R/kW, residential, excl. battery — estimate
  SME_PANEL_COST_PER_KW: 9500,           // R/kW, commercial, excl. battery — estimate
  BATTERY_COST_PER_KWH: 6000,            // R/kWh, installed — estimate

  /* A flat commissioning/DB-work/callout cost that doesn't shrink with
     system size — this is what makes a bigger system's payback genuinely
     better (diluted across more panels), not just "the model can't help
     it." A tiny system pays this same flat cost, which is real: a
     R5,000 job and a R500,000 job both need a site visit, a DB upgrade
     check and commissioning. */
  FIXED_INSTALL_COST: 8000,              // R, residential — estimate
  SME_FIXED_INSTALL_COST: 12000,         // R, commercial (bigger jobs, more electrical work) — estimate

  BATTERY_KWH_PER_DAILY_KWH: 0.5,        // battery sized to ~half a day's usage — estimate
  FINANCE_TERM_MONTHS: 84,               // 7yr illustrative commercial asset finance — not a finance offer
  FINANCE_ANNUAL_RATE: 0.12,             // 12% illustrative — not a finance offer
  DAYLIGHT_HOURS_ASSUMPTION: 9,          // assumed daylight generation window, hours/day
  MIN_OVERLAP_FLOOR: 0.5,                // minimum offset-scaling floor for low-overlap businesses
  PROJECTION_YEARS: 20,
  PAYBACK_RANGE_SPREAD: 0.2,             // ±20% band around the point estimate, standing in for
                                          // site-specific variance (orientation, shading, exact
                                          // installed cost) this simplified model can't capture — estimate

  /* Inverters don't last the panels' full lifespan — most residential/
     commercial inverters are rated for roughly a decade of continuous
     duty. Without this, the 20-year chart implies a smooth, ever-growing
     saving that never needs a cent of further spend, which overstates the
     real net benefit. */
  INVERTER_LIFESPAN_YEARS: 12,           // typical residential/commercial inverter service life — estimate
  INVERTER_REPLACEMENT_COST_FACTOR: 0.18, // share of original system cost — estimate

  /* South Africa's grid is coal-heavy, so displaced grid kWh carries a
     comparatively high emissions factor. Both figures below are
     illustrative, commonly-cited ballparks (Eskom's own published
     emissions-factor range, and the standard tree-equivalent heuristic
     used in most consumer carbon calculators) — not a scientific claim
     about any specific property. */
  GRID_EMISSIONS_KG_CO2_PER_KWH: 0.9,    // kg CO2/kWh, South African grid — illustrative estimate
  CO2_KG_OFFSET_PER_TREE_PER_YEAR: 21,   // rough mature-tree equivalent — illustrative estimate
};
