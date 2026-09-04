/* Day composition for plugin-day-feed — pure, no DOM.
   ------------------------------------------------------------------
   Kept separate from the component for the same reason
   calculator-math.js is kept apart from calculator.js: the part worth
   testing should be testable without a browser rendering anything.
   See test-schedule.html.

   The model is a company calendar. Several crews run in parallel, so
   entries can share a start time. Jobs have a duration, and a long job
   has a span in working days: composeDay looks back over recent working
   days and carries forward anything still running, so a three-day
   install shows as "day 2/3" on the middle day without anything being
   stored between visits.

   Entry point: composeDay(date, pools).                              */

(function (root) {

  const BANDS = {
    open:      [7 * 60, 9 * 60],
    morning:   [9 * 60, 12 * 60],
    midday:    [11 * 60, 14 * 60],
    afternoon: [13 * 60, 16 * 60 + 30],
    close:     [15 * 60 + 30, 17 * 60 + 45],
  };
  const BAND_ORDER = ['open', 'morning', 'midday', 'afternoon', 'close'];
  const DURATIONS = { '30m': 30, '1h': 60, '2h': 120, 'half': 240, 'allday': 615 };
  const DAY_END = 17 * 60 + 45;
  const SAT_END = 12 * 60 + 30;
  const LOOKBACK = 4; /* working days scanned for jobs still running */
  const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday',
                     'Friday', 'Saturday'];

  /* mulberry32 — small, fast, and identical across browsers, which
     matters because a given date must compose the same day everywhere. */
  function rngFor(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const pick = (rand, list) => list[Math.floor(rand() * list.length)];
  const pad = (n) => (n < 10 ? '0' + n : '' + n);
  const hhmm = (mins) => pad(Math.floor(mins / 60)) + ':' + pad(mins % 60);
  const seedForDate = (d) =>
    d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();

  const isSunday = (d) => d.getDay() === 0;
  const isSaturday = (d) => d.getDay() === 6;
  const isWorkingDay = (d) => !isSunday(d);

  /* Picks avoiding values already used in this line, so a template with
     two {suburb} tokens cannot render "Muizenberg and Muizenberg". */
  function pickDistinct(rand, list, seen) {
    for (let i = 0; i < 8; i++) {
      const v = pick(rand, list);
      if (!seen[v]) { seen[v] = true; return v; }
    }
    return pick(rand, list);
  }

  /* System size has to match the time the job was given.
     ------------------------------------------------------------------
     Sizes used to be drawn from the whole pool regardless of the job, so a
     30 kW carport and an 8.2 kW rooftop could both come out of the same
     "1 to 3 days" line. Nobody fits 30 kW in a day, and the panel is only
     worth reading if the numbers on it are the kind of numbers the crews
     actually work to.

     Bands are kW thresholds rather than slices of the array, so they do not
     silently change meaning when an entry is added to the pool or the list
     is reordered. A job with no `size` draws from everything, which is right
     for the office lines where the size is incidental to the task. An empty
     band falls back to the whole pool: a mis-typed size should render a
     plausible number, not nothing. */
  const SIZE_BANDS = { small: [0, 7], mid: [7, 14], large: [14, Infinity] };

  function sizedArrays(arrays, size) {
    const band = SIZE_BANDS[size];
    if (!band) return arrays;
    const out = arrays.filter(function (a) {
      const kw = parseFloat(a.panels);
      return kw >= band[0] && kw < band[1];
    });
    return out.length ? out : arrays;
  }

  function fillTokens(text, rand, pools, size) {
    const seen = Object.create(null);
    const arrays = sizedArrays(pools.arrays, size);
    return text.replace(/\{(\w+)\}/g, function (_, token) {
      if (token === 'suburb') return pickDistinct(rand, pools.suburbs, seen);
      if (token === 'municipality') return pickDistinct(rand, pools.municipalities, seen);
      if (token === 'board') return pickDistinct(rand, pools.boards, seen);
      const a = pick(rand, arrays);
      if (token === 'array') return a.panels + ' + ' + a.battery;
      if (token === 'panels') return a.panels;
      if (token === 'battery') return a.battery;
      return '';
    });
  }

  /* Every job that STARTS on the given day, across all crews.
     Bands are walked in order, at most once each, so a crew's diary
     always reads forwards and a "close" job cannot surface at 08:00.
     Continuations from earlier days are added by composeDay. */
  function buildStarts(seed, pools, saturday) {
    const rand = rngFor(seed);
    const dayEnd = saturday ? SAT_END : DAY_END;
    const bandOrder = saturday ? ['open', 'morning', 'midday'] : BAND_ORDER;

    const available = pools.jobs.filter((j) =>
      bandOrder.indexOf(j.band) !== -1 && (!saturday || j.weekend !== false));

    /* Saturday runs a skeleton: two or three crews, office included. */
    const bag = pools.crews.slice();
    const crewCount = saturday
      ? 2 + Math.floor(rand() * 2)
      : Math.min(bag.length, 4 + Math.floor(rand() * 2));
    const onToday = [];
    for (let i = 0; i < crewCount && bag.length; i++) {
      onToday.push(bag.splice(Math.floor(rand() * bag.length), 1)[0]);
    }

    const usedText = Object.create(null);
    const out = [];

    onToday.forEach(function (crew) {
      const forCrew = available.filter((j) => j.kind === crew.kind);
      if (!forCrew.length) return;
      /* The office turns over more, shorter items than a field crew. */
      const maxJobs = crew.kind === 'admin' ? 5 : 4;
      /* Crews leave the yard within half an hour of each other, which is
         what puts two entries on the same minute. */
      let cursor = (saturday ? 8 * 60 : 7 * 60) + Math.floor(rand() * 7) * 5;
      let placed = 0;

      for (let b = 0; b < bandOrder.length && placed < maxJobs; b++) {
        const band = bandOrder[b];
        const pool = forCrew.filter((j) => j.band === band && !usedText[j.text]);
        if (!pool.length) continue;
        /* Not every crew has something in every band. */
        if (placed && rand() < 0.15) continue;

        const window = BANDS[band];
        const start = Math.max(cursor, window[0]) + Math.floor(rand() * 5) * 5;
        if (start > Math.min(window[1], dayEnd - 15)) continue;

        const job = pick(rand, pool);
        usedText[job.text] = true;
        const length = DURATIONS[job.dur] || 60;
        const span = job.span
          ? job.span[0] + Math.floor(rand() * (job.span[1] - job.span[0] + 1))
          : 1;

        /* An all-day job runs to knock-off; everything else runs its
           length, clamped so nothing overruns the end of the day. */
        const end = job.dur === 'allday' ? dayEnd : Math.min(start + length, dayEnd);

        out.push({
          crew: crew.id,
          kind: job.kind,
          start: start,
          end: end,
          time: hhmm(start),
          dur: job.dur,
          allDay: job.dur === 'allday',
          span: span,
          /* Carried so composeDay can keep a weekday-only job off the
             Saturday board. buildStarts already refuses to START one on a
             Saturday; without this the flag was lost and a multi-day job
             reappeared as a continuation on the very day it says it does
             not run. */
          weekend: job.weekend,
          text: fillTokens(job.text, rand, pools, job.size),
        });
        placed++;

        if (job.dur === 'allday') break; /* that crew is out for the day */
        /* Travel and hand-off, snapped to 5 minutes like a real diary. */
        cursor = start + length + (2 + Math.floor(rand() * 7)) * 5;
      }
    });

    return out;
  }

  /* The day as displayed: jobs starting today, plus anything from the
     last few working days that is still running.

     Days are walked oldest first while tracking when each crew comes
     free, so a crew already on a three-day install cannot also appear
     on a fresh job — the earlier commitment wins, and the later job is
     treated as never having been booked. */
  function composeDay(date, pools) {
    if (isSunday(date)) return [];

    /* Working days only, so a job does not "continue" across a Sunday
       nobody worked on. */
    const back = [];
    const cursor = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    let guard = 0;
    while (back.length < LOOKBACK && guard++ < 20) {
      if (isWorkingDay(cursor)) back.push(new Date(cursor));
      cursor.setDate(cursor.getDate() - 1);
    }

    const freeFrom = Object.create(null); /* crew -> offset it is free again */
    const rows = [];

    /* back[0] is today, so reverse for oldest first. Offset counts back
       in working days: a job at offset O with span S covers O..O-S+1. */
    back.slice().reverse().forEach(function (d, i) {
      const offset = back.length - 1 - i;
      buildStarts(seedForDate(d), pools, isSaturday(d)).forEach(function (job) {
        const free = freeFrom[job.crew];
        if (free !== undefined && offset > free) return; /* crew was busy */
        if (job.span > 1 || job.allDay) freeFrom[job.crew] = offset - job.span;
        if (job.span <= offset) return; /* ran out before today */

        /* A job that does not run weekends does not run this weekend
           either, continuation or not. The crew stays committed to it —
           freeFrom is already set above — so it simply is not on the
           board today and picks up again on Monday. */
        if (isSaturday(date) && job.weekend === false) return;

        const dayEnd = isSaturday(date) ? SAT_END : DAY_END;
        if (offset === 0) {
          rows.push(Object.assign({}, job, { dayIndex: 1 }));
          return;
        }
        /* A continuing job resumes at the start of the day and says
           which day of the run this is. */
        const resume = isSaturday(date) ? 8 * 60 : 7 * 60 + 30;
        const at = job.allDay ? resume : Math.max(job.start, resume);
        const runs = DURATIONS[job.dur] || 60;
        rows.push(Object.assign({}, job, {
          start: at,
          end: job.allDay ? dayEnd : Math.min(at + runs, dayEnd),
          time: hhmm(at),
          dayIndex: offset + 1,
          continued: true,
        }));
      });
    });

    /* Time order, then crew, so simultaneous entries sit together in a
       stable order rather than shuffling between renders. */
    rows.sort((a, b) => (a.start - b.start) || (a.crew < b.crew ? -1 : 1));
    return rows;
  }

  /* A continuous stream across neighbouring working days.

     A single day runs out: by late afternoon there is nothing left below
     the line and the panel shows a void. A calendar does not stop at
     midnight, so the stream carries the previous working day's tail and
     the next working days' heads, each entry stamped with how many
     calendar days away it is and an absolute minute for ordering. */
  function composeStream(date, pools) {
    const today = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const out = [];
    for (let delta = -2; delta <= 4; delta++) {
      const d = new Date(today);
      d.setDate(d.getDate() + delta);
      if (!isWorkingDay(d)) continue;
      composeDay(d, pools).forEach(function (job) {
        out.push(Object.assign({}, job, {
          dayDelta: delta,
          dayName: DAY_NAMES[d.getDay()],
          abs: delta * 1440 + job.start,
          absEnd: delta * 1440 + job.end,
        }));
      });
    }
    out.sort((a, b) => (a.abs - b.abs) || (a.crew < b.crew ? -1 : 1));
    return out;
  }

  root.PLUGIN_DAY_FEED_SCHEDULE = {
    composeDay: composeDay,
    composeStream: composeStream,
    buildStarts: buildStarts,
    seedForDate: seedForDate,
    isWorkingDay: isWorkingDay,
    rngFor: rngFor,
    hhmm: hhmm,
    pad: pad,
  };

})(typeof window !== 'undefined' ? window : globalThis);
