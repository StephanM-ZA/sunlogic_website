/* Content pools for plugin-day-feed — ENERGY division.
   ------------------------------------------------------------------
   This file is per site. The generator (day-feed-schedule.js) and the
   component (day-feed.js) are byte-identical across all three sites and
   stay that way; only this data differs, which is exactly the seam the
   plugin was built with ("everything shown comes from schedule.data.js,
   which is plain data — no code").

   energy.sunlogic.co.za shows the three things this site sells: Energy
   (solar, batteries, backup), Gas (installation, servicing, certificates)
   and Smart Solutions (the Plentify controllers). No electrical crews and
   no electrical jobs — that work is real, it just belongs to the other
   site, and a visitor reading this panel should see the division they
   came for.

   Gas jobs use {suburb} and {municipality} only. There is no cylinder or
   appliance token: the resolver's token list is fixed in
   day-feed-schedule.js, and adding one means touching the generator,
   which is byte-identical across all three sites and meant to stay that
   way. Write the size into the text instead.

   This is a company calendar, not one person's list: several crews run in
   parallel, so two entries can share a start time. Jobs carry a duration,
   and the longer ones carry a span in working days — a job that starts on
   Tuesday with span 3 appears again on Wednesday and Thursday marked
   "day 2/3".

   The plugin composes each day from these pools seeded by the date, so a
   given day always looks the same to a returning visitor while no two days
   match. Plain data on purpose — no code.

   Tokens usable inside a job's `text`:
     {suburb}        one of `suburbs`
     {municipality}  one of `municipalities`
     {array}         "8.2 kW + 13.5 kWh"
     {panels}        "8.2 kW"
     {battery}       "13.5 kWh"
     {board}         one of `boards`
   Repeated tokens in one line resolve to different values.

   Job fields:
     kind    energy | smart | admin — must match a crew's kind
     band    open (07:00-09:00) · morning (09:00-12:00)
             midday (11:00-14:00) · afternoon (13:00-16:30)
             close (15:30-17:45)
     dur     "30m" | "1h" | "2h" | "half" | "allday"
     span    [min, max] working days. Omit for a single day.
     size    small (<7 kW) | mid (7-14 kW) | large (14 kW+) — restricts
             which entries in `arrays` the {array}/{panels}/{battery}
             tokens may draw, so a job's quoted system fits the days it
             was given. Omit where the size is incidental (office lines).
     weekend false keeps a job off the Saturday half-day.           */

window.PLUGIN_DAY_FEED = {

  /* Who is out on a given day. `kind` decides which jobs they can take.
     Several crews run a weekday and Saturday runs fewer — see
     buildStarts, which takes min(crews, 4 or 5).

     Four solar crews to one gas, one smart and one office on purpose.
     Solar work is mostly all-day and half-day, so a solar crew posts one
     or two entries where the smart crew posts four short ones; with fewer
     solar crews the panel on a division's own site reads as mostly Smart
     Solutions and paperwork.

     Measured over 343 working days from 1 January 2026, composing every
     working day and counting entries by kind:

         solar 41.3%  ·  smart 25.7%  ·  office 19.9%  ·  gas 13.0%
         9.17 entries a day

     Gas was added on 20 October 2026. The same measurement immediately
     before it gave solar 44.7 / smart 31.1 / office 24.3 at 8.85 entries
     a day, so one gas crew plus three gas office lines cost solar about
     three points and smart about five, and lifted the day by a third of
     an entry.

     Note those pre-gas figures do not match the 48/29/23 this comment
     used to quote, so the original was measured some other way. The
     numbers above are all from one method and are comparable with each
     other; treat them as a baseline to re-measure against rather than as
     agreeing with the old ones. Change the crew list and the mix moves —
     re-measure rather than assuming. */
  crews: [
    { id: "Energy 1", kind: "energy" },
    { id: "Energy 2", kind: "energy" },
    { id: "Energy 3", kind: "energy" },
    { id: "Energy 4", kind: "energy" },
    { id: "Gas 1", kind: "gas" },
    { id: "Smart 1", kind: "smart" },
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

  /* No job below uses {board} on this site, but the pool stays: the token
     resolver reads pools.boards directly and would throw on a missing one,
     so leaving it in place keeps a future {board} line from breaking the
     panel with no error to show for it. */
  boards: ["single-phase board", "three-phase board", "sub-board"],

  jobs: [

    /* --- energy: the long ones, which is where multi-day comes from -- */
    { kind: "energy", band: "open", dur: "allday", span: [2, 4], size: "mid", text: "{array} install · {suburb}" },
    { kind: "energy", band: "open", dur: "allday", span: [2, 3], size: "mid", text: "{panels} rooftop install · {suburb}" },
    { kind: "energy", band: "open", dur: "allday", span: [1, 2], size: "small", weekend: false, text: "{panels} carport array · {suburb}" },
    { kind: "energy", band: "open", dur: "half", size: "small", text: "panel mounting · {panels} · {suburb}" },
    { kind: "energy", band: "open", dur: "allday", span: [3, 4], size: "large", weekend: false, text: "{panels} ground mount · {suburb}" },
    { kind: "energy", band: "open", dur: "allday", span: [4, 5], size: "large", weekend: false, text: "{panels} commercial install · {suburb}" },
    { kind: "energy", band: "morning", dur: "half", span: [1, 2], text: "cable runs and DC isolators · {suburb}" },
    { kind: "energy", band: "morning", dur: "half", size: "small", text: "inverter and battery fit · {battery}" },
    { kind: "energy", band: "open", dur: "2h", text: "roof survey · {suburb}" },
    { kind: "energy", band: "morning", dur: "2h", text: "site assessment · {suburb}" },
    { kind: "energy", band: "midday", dur: "1h", text: "second site visit · {suburb}" },
    { kind: "energy", band: "afternoon", dur: "1h", size: "mid", text: "commissioning · {array}" },
    { kind: "energy", band: "afternoon", dur: "1h", text: "changeover tested · {suburb}" },
    { kind: "energy", band: "afternoon", dur: "30m", text: "monitoring brought online · {array}" },
    { kind: "energy", band: "close", dur: "1h", text: "handover walkthrough · {suburb}" },
    { kind: "energy", band: "morning", dur: "2h", text: "scaffold and safety set-up · {suburb}" },
    { kind: "energy", band: "midday", dur: "2h", size: "small", text: "battery added to existing array · {battery}" },
    { kind: "energy", band: "afternoon", dur: "2h", text: "backup circuits split to essentials board · {suburb}" },

    /* --- gas ---------------------------------------------------------
       One crew, and a pool weighted toward the short jobs: a gas day is
       mostly appliances, services and certificates rather than the
       multi-day installs that make up the solar side.

       Nothing here quotes a clearance, a test pressure or a service
       interval. Those figures are verified only against the superseded
       2008 edition of SANS 10087-1 and are not published anywhere on
       these sites — see docs/gas-service-pack-2.md section 5. Cylinder
       sizes are product names, not standards claims, so they are fine. */
    { kind: "gas", band: "open", dur: "allday", span: [2, 3], weekend: false, text: "restaurant kitchen gas installation · {suburb}" },
    { kind: "gas", band: "open", dur: "allday", span: [1, 2], text: "whole-house gas reticulation · {suburb}" },
    { kind: "gas", band: "open", dur: "half", text: "twin 48 kg changeover installed · {suburb}" },
    { kind: "gas", band: "open", dur: "2h", text: "site visit for a gas installation · {suburb}" },
    { kind: "gas", band: "morning", dur: "2h", text: "gas hob and isolator fitted · {suburb}" },
    { kind: "gas", band: "morning", dur: "half", text: "instant gas water heater fitted · {suburb}" },
    { kind: "gas", band: "morning", dur: "2h", text: "gas fireplace installed and flued · {suburb}" },
    { kind: "gas", band: "morning", dur: "2h", text: "appliance converted from natural gas to LPG · {suburb}" },
    { kind: "gas", band: "midday", dur: "1h", text: "cylinder bank re-sited to meet clearances · {suburb}" },
    { kind: "gas", band: "midday", dur: "2h", text: "built-in braai connected · {suburb}" },
    { kind: "gas", band: "midday", dur: "1h", text: "ventilation checked and freed · {suburb}" },
    { kind: "gas", band: "afternoon", dur: "1h", text: "leak test and pressure hold · {suburb}" },
    { kind: "gas", band: "afternoon", dur: "1h", text: "regulator and hoses replaced on age · {suburb}" },
    { kind: "gas", band: "afternoon", dur: "2h", text: "gas geyser swapped and re-certified · {suburb}" },
    { kind: "gas", band: "afternoon", dur: "30m", text: "Certificate of Conformity issued · {suburb}" },
    { kind: "gas", band: "close", dur: "1h", text: "gas service · readings written up · {suburb}" },
    { kind: "gas", band: "close", dur: "30m", text: "pre-sale gas inspection · {suburb}" },

    /* --- smart solutions, seen from Energy --------------------------
       Smart Solutions is sold on both division sites, but it is not the
       same work on each and these pools must not drift back into being
       copies of one another. Here it is the SolarBot side: what the
       controllers do with generation, storage and self-consumption once
       an array exists. The wiring-and-circuit side of the same product
       lives in site-electrical's copy of this file. */
    { kind: "smart", band: "open", dur: "2h", text: "SolarBot fitted and paired to inverter · {suburb}" },
    { kind: "smart", band: "morning", dur: "2h", text: "SolarBot commissioned · {battery}" },
    { kind: "smart", band: "morning", dur: "1h", text: "battery charge windows tuned · {battery}" },
    { kind: "smart", band: "morning", dur: "1h", text: "water heating shifted onto solar · {suburb}" },
    { kind: "smart", band: "midday", dur: "1h", text: "grid draw checked against solar output · {suburb}" },
    { kind: "smart", band: "midday", dur: "1h", text: "HotBot added to a solar geyser · {suburb}" },
    { kind: "smart", band: "afternoon", dur: "1h", text: "self-consumption reviewed after month one · {suburb}" },
    { kind: "smart", band: "afternoon", dur: "30m", text: "monitoring linked to the app · {suburb}" },
    { kind: "smart", band: "afternoon", dur: "2h", size: "small", text: "controllers set up alongside a new array · {panels}" },
    { kind: "smart", band: "close", dur: "30m", text: "first month's savings walked through · {suburb}" },
    { kind: "smart", band: "open", dur: "half", weekend: false, text: "complex rollout: scheduling set per unit · {suburb}" },

    /* --- office and paperwork -------------------------------------- */
    /* No admin job sits in the `open` band, and that is deliberate rather
       than an omission. Bands are walked in order and at most once each, so
       an office entry at 07:00 lets the office run a fifth item and pushes
       its share of the panel up by about five points — enough to make the
       day read as paperwork. Adding one back moves the whole mix. */
    { kind: "admin", band: "morning", dur: "30m", text: "SSEG application submitted · {municipality}" },
    { kind: "admin", band: "morning", dur: "30m", text: "quote issued · {suburb}" },
    { kind: "admin", band: "morning", dur: "30m", text: "bill analysis returned · {suburb}" },
    { kind: "admin", band: "midday", dur: "30m", text: "SSEG approval received · {municipality}" },
    { kind: "admin", band: "midday", dur: "30m", text: "council registration lodged · {municipality}" },
    { kind: "admin", band: "midday", dur: "1h", text: "design approved · {array}" },
    { kind: "admin", band: "afternoon", dur: "30m", text: "revised proposal sent · {panels}" },
    { kind: "admin", band: "afternoon", dur: "30m", text: "controller subscription activated · {suburb}" },
    { kind: "admin", band: "afternoon", dur: "1h", text: "materials ordered · {panels} array" },
    { kind: "admin", band: "midday", dur: "30m", text: "gas Certificate of Conformity filed · {suburb}" },
    { kind: "admin", band: "afternoon", dur: "30m", text: "flammable substance application lodged · {municipality}" },
    { kind: "admin", band: "close", dur: "30m", text: "gas service reminder sent · {suburb}" },
    { kind: "admin", band: "close", dur: "30m", text: "commissioning record filed · {suburb}" },
    { kind: "admin", band: "close", dur: "30m", weekend: false, text: "tomorrow's runs planned" },
    { kind: "admin", band: "close", dur: "30m", weekend: false, text: "stock check · workshop" },
  ],

  /* Shown outside working hours. {next} resolves to "tomorrow",
     "on Monday" or "in the week ahead"; {start} to the hour the day
     begins. `morning` covers the hours before the day starts, where the
     evening wording would read wrongly. */
  rest: {
    evening: "Tools down for the day. Resting up, so we can manage your requirements better {next}.",
    morning: "Still resting up, so we can manage your requirements better. Crews roll out at {start}.",
    sunday: "Sunday. Resting up, so we can manage your requirements better {next}.",
    /* Shown on a working day that composes to nothing — every crew on
       shift already committed to a job that runs through the week. See
       _renderRest in day-feed.js. */
    quiet: "Every crew is out on work that started earlier in the week. Back to a full board on Monday.",
  },
};
