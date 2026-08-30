/* Content pools for plugin-day-feed.
   ------------------------------------------------------------------
   This is a company calendar, not one person's list: several crews run
   in parallel, so two entries can share a start time. Jobs carry a
   duration, and the longer ones carry a span in working days — a job
   that starts on Tuesday with span 3 appears again on Wednesday and
   Thursday marked "day 2/3".

   The plugin composes each day from these pools seeded by the date, so
   a given day always looks the same to a returning visitor while no two
   days match. Plain data on purpose — no code.

   Tokens usable inside a job's `text`:
     {suburb}        one of `suburbs`
     {municipality}  one of `municipalities`
     {array}         "8.2 kW + 13.5 kWh"
     {panels}        "8.2 kW"
     {battery}       "13.5 kWh"
     {board}         one of `boards`
   Repeated tokens in one line resolve to different values.

   Job fields:
     kind    solar | electrical | admin — must match a crew's kind
     band    open (07:00-09:00) · morning (09:00-12:00)
             midday (11:00-14:00) · afternoon (13:00-16:30)
             close (15:30-17:45)
     dur     "30m" | "1h" | "2h" | "half" | "allday"
     span    [min, max] working days. Omit for a single day.
     weekend false keeps a job off the Saturday half-day.           */

window.PLUGIN_DAY_FEED = {

  /* Who is out on a given day. `kind` decides which jobs they can take.
     Weekdays run most of these; Saturday runs a couple. */
  crews: [
    { id: "Solar 1", kind: "solar" },
    { id: "Solar 2", kind: "solar" },
    { id: "Elec 1", kind: "electrical" },
    { id: "Elec 2", kind: "electrical" },
    { id: "Office", kind: "admin" },
  ],

  /* Cape Town metro and near surrounds, worked from the Claremont
     workshop. Add or remove freely — the generator just picks. */
  suburbs: [
    "Durbanville", "Parow", "Bellville", "Brackenfell", "Kuils River",
    "Somerset West", "Table View", "Milnerton", "Goodwood", "Kraaifontein",
    "Plattekloof", "Panorama", "Edgemead", "Melkbosstrand", "Muizenberg",
    "Fish Hoek", "Constantia", "Claremont", "Rondebosch", "Kenilworth",
    "Pinelands", "Blouberg", "Strand", "Gordon's Bay", "Tokai",
    "Bergvliet", "Newlands", "Observatory", "Woodstock", "Diep River",
  ],

  municipalities: [
    "City of Cape Town", "City of Cape Town", "City of Cape Town",
    "City of Cape Town", "Stellenbosch", "Drakenstein", "Overstrand",
  ],

  /* Paired so a quoted system always reads as a sensible combination. */
  arrays: [
    { panels: "3.6 kW", battery: "5.1 kWh" },
    { panels: "4.4 kW", battery: "5.1 kWh" },
    { panels: "5.0 kW", battery: "10.2 kWh" },
    { panels: "6.0 kW", battery: "10.2 kWh" },
    { panels: "8.2 kW", battery: "13.5 kWh" },
    { panels: "10.4 kW", battery: "13.5 kWh" },
    { panels: "12.0 kW", battery: "16.4 kWh" },
    { panels: "15.6 kW", battery: "20.5 kWh" },
    { panels: "22.0 kW", battery: "32.8 kWh" },
    { panels: "30.0 kW", battery: "40.9 kWh" },
  ],

  boards: ["single-phase board", "three-phase board", "sub-board"],

  jobs: [

    /* --- solar: the long ones, which is where multi-day comes from -- */
    { kind: "solar", band: "open", dur: "allday", span: [2, 4], text: "{array} install · {suburb}" },
    { kind: "solar", band: "open", dur: "allday", span: [2, 3], text: "{panels} rooftop install · {suburb}" },
    { kind: "solar", band: "open", dur: "allday", span: [1, 2], weekend: false, text: "{panels} carport array · {suburb}" },
    { kind: "solar", band: "open", dur: "half", text: "panel mounting · {panels} · {suburb}" },
    { kind: "solar", band: "open", dur: "allday", span: [2, 3], weekend: false, text: "{panels} ground mount · {suburb}" },
    { kind: "solar", band: "morning", dur: "half", span: [1, 2], text: "cable runs and DC isolators · {suburb}" },
    { kind: "solar", band: "morning", dur: "half", text: "inverter and battery fit · {battery}" },
    { kind: "solar", band: "open", dur: "2h", text: "roof survey · {suburb}" },
    { kind: "solar", band: "morning", dur: "2h", text: "site assessment · {suburb}" },
    { kind: "solar", band: "midday", dur: "1h", text: "second site visit · {suburb}" },
    { kind: "solar", band: "afternoon", dur: "1h", text: "commissioning · {array}" },
    { kind: "solar", band: "afternoon", dur: "1h", text: "changeover tested · {suburb}" },
    { kind: "solar", band: "afternoon", dur: "30m", text: "monitoring brought online · {array}" },
    { kind: "solar", band: "close", dur: "1h", text: "handover walkthrough · {suburb}" },
    { kind: "solar", band: "morning", dur: "2h", text: "scaffold and safety set-up · {suburb}" },

    /* --- electrical ------------------------------------------------ */
    { kind: "electrical", band: "open", dur: "half", span: [1, 2], text: "{board} upgrade · {suburb}" },
    { kind: "electrical", band: "open", dur: "allday", span: [2, 3], weekend: false, text: "full rewire · {suburb}" },
    { kind: "electrical", band: "open", dur: "allday", span: [2, 2], weekend: false, text: "distribution board rebuild · {suburb}" },
    { kind: "electrical", band: "open", dur: "half", span: [1, 2], text: "generator changeover wiring · {suburb}" },
    { kind: "electrical", band: "morning", dur: "2h", text: "fault call · {suburb}" },
    { kind: "electrical", band: "morning", dur: "1h", text: "earth leakage traced and cleared · {suburb}" },
    { kind: "electrical", band: "midday", dur: "1h", text: "geyser element replaced · {suburb}" },
    { kind: "electrical", band: "midday", dur: "2h", text: "circuits relabelled · {board}" },
    { kind: "electrical", band: "afternoon", dur: "1h", text: "surge protection fitted · {suburb}" },
    { kind: "electrical", band: "afternoon", dur: "2h", text: "compliance inspection · {suburb}" },
    { kind: "electrical", band: "afternoon", dur: "30m", text: "COC issued · {suburb}" },
    { kind: "electrical", band: "close", dur: "1h", text: "snag list cleared · {suburb}" },
    { kind: "electrical", band: "morning", dur: "half", text: "DB board replacement · {suburb}" },

    /* --- office and paperwork -------------------------------------- */
    { kind: "admin", band: "open", dur: "30m", text: "crews dispatched · {suburb} and {suburb}" },
    { kind: "admin", band: "morning", dur: "30m", text: "SSEG application submitted · {municipality}" },
    { kind: "admin", band: "morning", dur: "30m", text: "quote issued · {suburb}" },
    { kind: "admin", band: "morning", dur: "30m", text: "bill analysis returned · {suburb}" },
    { kind: "admin", band: "midday", dur: "30m", text: "SSEG approval received · {municipality}" },
    { kind: "admin", band: "midday", dur: "30m", text: "council registration lodged · {municipality}" },
    { kind: "admin", band: "midday", dur: "1h", text: "design approved · {array}" },
    { kind: "admin", band: "afternoon", dur: "30m", text: "revised proposal sent · {panels}" },
    { kind: "admin", band: "afternoon", dur: "30m", text: "certificate of compliance issued" },
    { kind: "admin", band: "afternoon", dur: "1h", text: "materials ordered · {panels} array" },
    { kind: "admin", band: "close", dur: "30m", text: "commissioning record filed · {suburb}" },
    { kind: "admin", band: "close", dur: "30m", weekend: false, text: "tomorrow's runs planned" },
    { kind: "admin", band: "close", dur: "30m", weekend: false, text: "stock check · workshop" },
  ],

  /* Shown outside working hours. {next} resolves to "tomorrow",
     "on Monday" or "in the week ahead". */
  rest: {
    evening: "Tools down for the day. Resting up, so we can manage your requirements better {next}.",
    sunday: "Sunday. Resting up, so we can manage your requirements better {next}.",
  },
};
