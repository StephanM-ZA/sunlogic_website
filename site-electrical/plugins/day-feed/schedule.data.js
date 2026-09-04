/* Content pools for plugin-day-feed — ELECTRICAL division.
   ------------------------------------------------------------------
   This file is per site. The generator (day-feed-schedule.js) and the
   component (day-feed.js) are byte-identical across all three sites and
   stay that way; only this data differs, which is exactly the seam the
   plugin was built with ("everything shown comes from schedule.data.js,
   which is plain data — no code").

   electrical.sunlogic.co.za shows the two divisions this site sells:
   Electrical (contracting, compliance, EV charging) and Smart Solutions
   (the Plentify controllers). No solar crews and no solar jobs — that
   work is real, it just belongs to the other site, and a visitor reading
   this panel should see the division they came for.

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
     kind    electrical | smart | admin — must match a crew's kind
     band    open (07:00-09:00) · morning (09:00-12:00)
             midday (11:00-14:00) · afternoon (13:00-16:30)
             close (15:30-17:45)
     dur     "30m" | "1h" | "2h" | "half" | "allday"
     span    [min, max] working days. Omit for a single day.
     weekend false keeps a job off the Saturday half-day.           */

window.PLUGIN_DAY_FEED = {

  /* Who is out on a given day. `kind` decides which jobs they can take.
     Five crews, so four or five run a weekday and Saturday runs two or
     three — see buildStarts, which takes min(crews, 4 or 5).

     Four field crews to one smart crew and one office on purpose. The
     division's own work is mostly all-day and half-day, so a field crew
     posts one or two entries where the smart crew posts four short ones;
     with fewer field crews the panel on a division's own site reads as
     mostly Smart Solutions and paperwork.

     Measured over 343 working days, this shapes the panel to roughly
     48% division / 29% smart / 23% office on Energy and 46/30/24 on
     Electrical. Change the crew list and that mix moves — re-measure
     rather than assuming. */
  crews: [
    { id: "Elec 1", kind: "electrical" },
    { id: "Elec 2", kind: "electrical" },
    { id: "Elec 3", kind: "electrical" },
    { id: "Elec 4", kind: "electrical" },
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

  /* Only the smart controllers reference a battery on this site, but the
     pool stays whole: the token resolver reads pools.arrays directly and
     would throw on a missing one, so a future {array} or {panels} line
     cannot break the panel with no error to show for it. */
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

    /* --- electrical: the long ones, which is where multi-day comes from */
    { kind: "electrical", band: "open", dur: "half", span: [1, 2], text: "{board} upgrade · {suburb}" },
    { kind: "electrical", band: "open", dur: "allday", span: [2, 3], weekend: false, text: "full rewire · {suburb}" },
    { kind: "electrical", band: "open", dur: "allday", span: [2, 2], weekend: false, text: "distribution board rebuild · {suburb}" },
    { kind: "electrical", band: "open", dur: "half", span: [1, 2], text: "generator changeover wiring · {suburb}" },
    { kind: "electrical", band: "open", dur: "allday", span: [2, 3], weekend: false, text: "shopfit first fix · {suburb}" },
    { kind: "electrical", band: "morning", dur: "2h", text: "fault call · {suburb}" },
    { kind: "electrical", band: "morning", dur: "1h", text: "earth leakage traced and cleared · {suburb}" },
    { kind: "electrical", band: "morning", dur: "half", text: "DB board replacement · {suburb}" },
    { kind: "electrical", band: "morning", dur: "2h", text: "emergency lighting tested · {suburb}" },
    { kind: "electrical", band: "midday", dur: "1h", text: "geyser element replaced · {suburb}" },
    { kind: "electrical", band: "midday", dur: "2h", text: "circuits relabelled · {board}" },
    { kind: "electrical", band: "midday", dur: "half", text: "EV charger installed · {suburb}" },
    { kind: "electrical", band: "afternoon", dur: "1h", text: "surge protection fitted · {suburb}" },
    { kind: "electrical", band: "afternoon", dur: "2h", text: "compliance inspection · {suburb}" },
    { kind: "electrical", band: "afternoon", dur: "30m", text: "COC issued · {suburb}" },
    { kind: "electrical", band: "afternoon", dur: "2h", text: "load checked before EV charger · {board}" },
    { kind: "electrical", band: "close", dur: "1h", text: "snag list cleared · {suburb}" },

    /* --- smart solutions, seen from Electrical ----------------------
       Smart Solutions is sold on both division sites, but it is not the
       same work on each and these pools must not drift back into being
       copies of one another. Here it is the install side: the controller
       is an appliance on a geyser circuit, so it means isolators, board
       capacity, testing and a certificate. What the controllers then do
       with solar and storage lives in site-energy's copy of this file. */
    { kind: "smart", band: "open", dur: "2h", text: "HotBot fitted to geyser · {suburb}" },
    { kind: "smart", band: "morning", dur: "2h", text: "geyser isolator and wiring replaced before fit · {suburb}" },
    { kind: "smart", band: "morning", dur: "1h", text: "second geyser controller fitted · {suburb}" },
    { kind: "smart", band: "morning", dur: "1h", text: "controller wired into {board}" },
    { kind: "smart", band: "midday", dur: "1h", text: "element and thermostat checked before fit · {suburb}" },
    { kind: "smart", band: "midday", dur: "1h", text: "leak alert investigated on site · {suburb}" },
    { kind: "smart", band: "afternoon", dur: "1h", text: "geyser circuit tested after fit · {suburb}" },
    { kind: "smart", band: "afternoon", dur: "30m", text: "COC issued for controller install · {suburb}" },
    { kind: "smart", band: "afternoon", dur: "2h", text: "board capacity checked for a second geyser · {board}" },
    { kind: "smart", band: "close", dur: "30m", text: "app set up and handed over · {suburb}" },
    { kind: "smart", band: "open", dur: "half", weekend: false, text: "complex rollout: geyser circuits fitted unit by unit · {suburb}" },

    /* --- office and paperwork -------------------------------------- */
    /* No admin job sits in the `open` band, and that is deliberate rather
       than an omission. Bands are walked in order and at most once each, so
       an office entry at 07:00 lets the office run a fifth item and pushes
       its share of the panel up by about five points — enough to make the
       day read as paperwork. Adding one back moves the whole mix. */
    { kind: "admin", band: "morning", dur: "30m", text: "quote issued · {suburb}" },
    { kind: "admin", band: "morning", dur: "30m", text: "fault call logged and booked · {suburb}" },
    { kind: "admin", band: "morning", dur: "30m", text: "test results written up · {board}" },
    { kind: "admin", band: "midday", dur: "30m", text: "council registration lodged · {municipality}" },
    { kind: "admin", band: "midday", dur: "1h", text: "compliance paperwork checked · {suburb}" },
    { kind: "admin", band: "afternoon", dur: "30m", text: "revised proposal sent · {suburb}" },
    { kind: "admin", band: "afternoon", dur: "30m", text: "certificate of compliance issued" },
    { kind: "admin", band: "afternoon", dur: "30m", text: "controller subscription activated · {suburb}" },
    { kind: "admin", band: "afternoon", dur: "1h", text: "materials ordered · {board}" },
    { kind: "admin", band: "close", dur: "30m", text: "job sheet filed · {suburb}" },
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
  },
};
