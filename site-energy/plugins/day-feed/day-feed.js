/* plugin-day-feed
   ------------------------------------------------------------------
   A day's job feed anchored to the visitor's clock. The current time
   sits in the middle, larger; what has already happened is above it,
   what is still to come is below. As real time passes, entries cross
   the line from below to above, one step at a time.

   The day itself is composed by day-feed-schedule.js from the pools in
   schedule.data.js, seeded by the date — so a returning visitor sees
   the same day, and no two days match.

   Outside working hours the panel rests rather than inventing activity.

   Usage — all three files, in this order:
     <script src="path/to/schedule.data.js"></script>
     <script src="path/to/day-feed-schedule.js"></script>
     <script src="path/to/day-feed.js" defer></script>
     <plugin-day-feed></plugin-day-feed>

   Attributes (all optional):
     title       panel heading                       default "Today"
     past        rows shown above the line           default 4
     next        rows shown below the line           default 4
     rest-from   hour tools go down, 0-23            default 18
     rest-until  hour the day starts, 0-23           default 7
     tone        "glass" for the dark, blurred fill  default solid     */

(function () {
  if (customElements.get('plugin-day-feed')) return;

  function injectBaseStyles() {
    if (document.getElementById('plugin-day-feed-styles')) return;
    const style = document.createElement('style');
    style.id = 'plugin-day-feed-styles';
    style.textContent = `
      plugin-day-feed { display: contents; }

      :where(:root) {
        --plugin-day-feed-bg: #ffffff;
        --plugin-day-feed-border: rgba(0, 0, 0, 0.12);
        --plugin-day-feed-radius: 0.75rem;
        --plugin-day-feed-height: 320px;
        --plugin-day-feed-accent: #ff8000;
        --plugin-day-feed-text: #1a1a1a;
        --plugin-day-feed-muted: rgba(26, 26, 26, 0.45);
        --plugin-day-feed-faint: rgba(26, 26, 26, 0.28);
        --plugin-day-feed-rule: rgba(0, 0, 0, 0.12);
        --plugin-day-feed-font: ui-monospace, SFMono-Regular, Menlo, monospace;
        --plugin-day-feed-size: 12px;
        --plugin-day-feed-row-h: 24px;
        --plugin-day-feed-slide: 400ms;
      }

      .plugin-day-feed {
        display: flex;
        flex-direction: column;
        overflow: hidden;
        height: var(--plugin-day-feed-height);
        border: 1px solid var(--plugin-day-feed-border);
        border-radius: var(--plugin-day-feed-radius);
        background: var(--plugin-day-feed-bg);
        color: var(--plugin-day-feed-text);
        font-family: var(--plugin-day-feed-font);
      }

      .plugin-day-feed__head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 16px;
        border-bottom: 1px solid var(--plugin-day-feed-border);
        font-size: var(--plugin-day-feed-size);
        font-weight: 600;
        letter-spacing: 0.05em;
        text-transform: uppercase;
      }
      .plugin-day-feed__live { display: inline-flex; align-items: center; gap: 6px; }
      .plugin-day-feed__live::before {
        content: "";
        width: 6px; height: 6px;
        border-radius: 999px;
        background: var(--plugin-day-feed-accent);
        animation: plugin-day-feed-pulse 1.6s infinite;
      }

      .plugin-day-feed__body {
        flex: 1; min-height: 0;
        display: flex; flex-direction: column;
        padding: 10px 16px;
        overflow: hidden;
      }

      /* Past presses down against the line, upcoming hangs below it, so
         the most recent and the most imminent both sit against "now". */
      .plugin-day-feed__past,
      .plugin-day-feed__next {
        flex: 1 1 0; min-height: 0;
        display: flex; flex-direction: column;
        overflow: hidden;
      }
      .plugin-day-feed__past { justify-content: flex-end; }
      .plugin-day-feed__next { justify-content: flex-start; }

      .plugin-day-feed__row {
        display: flex; gap: 12px; align-items: baseline;
        letter-spacing: 0.05em;
        text-transform: uppercase;
        white-space: nowrap;
        transition: font-size 200ms ease-out, opacity 200ms ease-out;
      }
      .plugin-day-feed__time {
        flex: 0 0 5.2em;
        color: var(--plugin-day-feed-faint);
        font-variant-numeric: tabular-nums;
      }
      /* Which crew, so the panel reads as a company diary rather than
         one person's list. */
      .plugin-day-feed__crew {
        flex: 0 0 5.2em;
        color: var(--plugin-day-feed-accent);
        opacity: 0.85;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .plugin-day-feed__text { flex: 1 1 auto; overflow: hidden; text-overflow: ellipsis; }
      /* "day 2/3" on a job that runs over more than one day. */
      .plugin-day-feed__span {
        flex: 0 0 auto;
        padding-left: 8px;
        color: var(--plugin-day-feed-faint);
      }

      /* Distance from the current moment reads as size and tone: the rows
         touching the line are the largest and brightest, and each step
         away is smaller and fainter, so the panel reads as a wheel with
         now at the top of it. */
      .plugin-day-feed__row[data-depth="0"] { height: 24px; font-size: 12px; opacity: 0.6; }
      .plugin-day-feed__row[data-depth="1"] { height: 22px; font-size: 11px; opacity: 0.38; }
      .plugin-day-feed__row[data-depth="2"] { height: 20px; font-size: 10px; opacity: 0.22; }
      .plugin-day-feed__row[data-depth="3"] { height: 18px; font-size: 9px; opacity: 0.14; }
      .plugin-day-feed__row[data-depth="4"] { height: 17px; font-size: 9px; opacity: 0.08; }

      /* Dividers keep the depth's height so the layout budget still adds
         up, but not its fade: a day label is structure, not content. At
         07:00 the whole top wing is yesterday, and a label at 0.14 left
         those times looking simply out of order. */
      .plugin-day-feed__divider[data-depth="0"] { height: 24px; }
      .plugin-day-feed__divider[data-depth="1"] { height: 22px; }
      .plugin-day-feed__divider[data-depth="2"] { height: 20px; }
      .plugin-day-feed__divider[data-depth="3"] { height: 18px; }
      .plugin-day-feed__divider[data-depth="4"] { height: 17px; }
      .plugin-day-feed__divider[data-depth] { font-size: 10px; opacity: 0.8; }

      /* Where the stream crosses into another day. */
      .plugin-day-feed__divider {
        display: flex; align-items: center; gap: 10px;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: var(--plugin-day-feed-accent);
        white-space: nowrap;
      }
      .plugin-day-feed__divider::after {
        content: ""; flex: 1 1 auto; height: 1px;
        background: var(--plugin-day-feed-rule);
      }

      /* The band holds the clock and whatever is actually running at
         that moment — a job counts as current from its start until its
         end, so a two-hour inspection stays here for two hours. */
      .plugin-day-feed__now {
        flex: 0 0 auto;
        display: flex; flex-direction: column; gap: 4px;
        margin: 5px 0; padding: 7px 0;
        border-top: 1px solid var(--plugin-day-feed-rule);
        border-bottom: 1px solid var(--plugin-day-feed-rule);
      }
      .plugin-day-feed__clock {
        display: flex; gap: 10px; align-items: baseline;
        color: var(--plugin-day-feed-accent);
        font-size: 17px; font-weight: 600;
      }
      .plugin-day-feed__current { display: flex; flex-direction: column; }
      /* Whatever is on site right now is the brightest thing in the panel. */
      .plugin-day-feed__row--current { height: 24px; font-size: 13px; opacity: 1; }
      .plugin-day-feed__more {
        height: 22px; font-size: 11px; letter-spacing: 0.05em;
        text-transform: uppercase; color: var(--plugin-day-feed-muted);
      }
      .plugin-day-feed__now-time { font-variant-numeric: tabular-nums; }
      .plugin-day-feed__now-secs {
        font-size: var(--plugin-day-feed-size);
        font-variant-numeric: tabular-nums;
        opacity: 0.6;
        margin-left: -6px;
      }
      .plugin-day-feed__now-label {
        margin-left: auto;
        font-size: var(--plugin-day-feed-size);
        letter-spacing: 0.05em;
        text-transform: uppercase;
        color: var(--plugin-day-feed-muted);
      }

      /* One step of the slot machine, run when an entry crosses. */
      .plugin-day-feed.is-advancing .plugin-day-feed__past,
      .plugin-day-feed.is-advancing .plugin-day-feed__next {
        animation: plugin-day-feed-advance var(--plugin-day-feed-slide) cubic-bezier(0.16, 1, 0.3, 1);
      }

      .plugin-day-feed__rest {
        flex: 1;
        display: flex; flex-direction: column; justify-content: center;
        padding: 0 2px;
      }
      .plugin-day-feed__rest-text {
        font-size: var(--plugin-day-feed-size);
        line-height: 1.7;
        letter-spacing: 0.05em;
        text-transform: uppercase;
        color: var(--plugin-day-feed-muted);
        white-space: normal;
      }

      @keyframes plugin-day-feed-pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.35; }
      }
      @keyframes plugin-day-feed-advance {
        from { transform: translateY(var(--plugin-day-feed-row-h)); }
        to { transform: translateY(0); }
      }

      @media (prefers-reduced-motion: reduce) {
        .plugin-day-feed__live::before { animation: none; opacity: 1; }
        .plugin-day-feed.is-advancing .plugin-day-feed__past,
        .plugin-day-feed.is-advancing .plugin-day-feed__next { animation: none; }
      }
    `;
    document.head.appendChild(style);
  }

  const pad = (n) => (n < 10 ? '0' + n : '' + n);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  class DayFeed extends HTMLElement {
    connectedCallback() {
      if (this._mounted) return;
      this._mounted = true;
      injectBaseStyles();
      this._pools = window.PLUGIN_DAY_FEED;
      this._sched = window.PLUGIN_DAY_FEED_SCHEDULE;
      this._sideN = Math.max(1, parseInt(this.getAttribute('rows'), 10) || 3);
      this._restFrom = this._hourAttr('rest-from', 18);
      this._restUntil = this._hourAttr('rest-until', 7);
      this._shell();
      this._tick();
      this._timer = setInterval(() => this._tick(), 1000);
    }

    disconnectedCallback() {
      clearInterval(this._timer);
      this._mounted = false;
    }

    _hourAttr(name, fallback) {
      const v = parseInt(this.getAttribute(name), 10);
      return v >= 0 && v <= 23 ? v : fallback;
    }

    _shell() {
      const tone = this.getAttribute('tone') === 'glass' ? ' plugin-day-feed--glass' : '';
      /* `title` on any element makes the browser draw a native tooltip over
         the panel, so the heading is its own attribute. A `title` left on
         the host is honoured once and then removed. */
      let title = this.getAttribute('heading');
      if (!title && this.hasAttribute('title')) {
        title = this.getAttribute('title');
        this.removeAttribute('title');
      }
      title = title || 'Today';
      this.innerHTML =
        '<div class="plugin-day-feed' + tone + '">' +
          '<div class="plugin-day-feed__head">' +
            '<span>' + esc(title) + '</span>' +
            '<span class="plugin-day-feed__live">Live</span>' +
          '</div>' +
          '<div class="plugin-day-feed__body" data-body></div>' +
        '</div>';
      this._panel = this.querySelector('.plugin-day-feed');
      this._body = this.querySelector('[data-body]');
    }

    /* Time source, isolated so the test harness can drive the clock. */
    _now() {
      return typeof this.clock === 'function' ? this.clock() : new Date();
    }

    _tick() {
      if (!this._pools || !this._sched) {
        this._body.innerHTML = '<div class="plugin-day-feed__rest">' +
          '<span class="plugin-day-feed__rest-text">Schedule data not loaded.</span></div>';
        clearInterval(this._timer);
        return;
      }
      const now = this._now();
      const day = now.getDay();
      const hour = now.getHours();
      const minutes = hour * 60 + now.getMinutes();
      const resting = day === 0 || hour >= this._restFrom || hour < this._restUntil;

      if (resting) return this._renderRest(now, day, hour);

      const seed = this._sched.seedForDate(now);
      if (this._seed !== seed) {
        this._seed = seed;
        this._rows = this._sched.composeStream(now, this._pools);
        this._sig = null;
        this._mode = null;
      }

      /* A working day can legitimately compose to nothing: on a Saturday
         where every crew on shift is committed to weekday-only work that
         started midweek, there is no board to show. Rare, but a bare panel
         reads as broken rather than quiet, and this component's whole
         stance is that it rests rather than inventing activity. So it
         rests. */
      if (!this._rows.length) return this._renderRest(now, day, hour, true);

      /* Three buckets, split on when a job ends rather than only when it
         starts: finished above, running now in the band, not yet started
         below. A two-hour inspection therefore stays in the band for two
         hours instead of dropping into the past the minute it begins. */
      const past = [], current = [], next = [];
      this._rows.forEach(function (r) {
        if (r.absEnd <= minutes) past.push(r);
        else if (r.abs <= minutes) current.push(r);
        else next.push(r);
      });

      /* Re-render only when the make-up of the band actually changes;
         otherwise the clock alone is repainted and the step animation is
         not restarted. */
      const sig = past.length + '|' + next.length + '|' +
        current.map((r) => r.abs + r.crew).join(',');
      if (this._mode === 'day' && this._sig === sig) {
        return this._paintClock(now);
      }
      const advanced = this._mode === 'day' && this._sig != null;
      this._mode = 'day';
      this._sig = sig;
      this._renderDay(now, past, current, next);
      if (advanced) this._playAdvance();
    }

    _playAdvance() {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      this._panel.classList.remove('is-advancing');
      void this._panel.offsetWidth; /* forces the animation to restart */
      this._panel.classList.add('is-advancing');
    }

    _row(entry, depth, extra) {
      /* An all-day job shows the label instead of a start time — it has
         no meaningful hour to give. */
      const when = entry.allDay ? 'All day' : entry.time;
      const span = entry.span > 1
        ? '<span class="plugin-day-feed__span">day ' + entry.dayIndex + '/' + entry.span + '</span>'
        : '';
      return '<div class="plugin-day-feed__row' + (extra ? ' ' + extra : '') + '"' +
        (depth === null ? '' : ' data-depth="' + depth + '"') + '>' +
        '<span class="plugin-day-feed__time">' + esc(when) + '</span>' +
        '<span class="plugin-day-feed__crew">' + esc(entry.crew) + '</span>' +
        '<span class="plugin-day-feed__text">' + esc(entry.text) + '</span>' +
        span + '</div>';
    }

    _nowMarkup(now) {
      return '<div class="plugin-day-feed__clock">' +
        '<span class="plugin-day-feed__now-time" data-clock>' +
          pad(now.getHours()) + ':' + pad(now.getMinutes()) + '</span>' +
        '<span class="plugin-day-feed__now-label">now</span></div>';
    }

    _paintClock(now) {
      const c = this.querySelector('[data-clock]');
      if (c) c.textContent = pad(now.getHours()) + ':' + pad(now.getMinutes());
    }

    /* "Wednesday" is only useful once it is not obvious which day is
       meant; next to the panel's own "Today" heading it reads as noise. */
    _dayLabel(entry) {
      if (entry.dayDelta === 0) return 'Today';
      if (entry.dayDelta === 1) return 'Tomorrow';
      if (entry.dayDelta === -1) return 'Yesterday';
      return entry.dayName;
    }

    /* Turns a slice of the stream into display items, inserting a
       divider wherever the stream crosses into another day. `before` is
       the entry immediately preceding the slice, so a crossing at the
       slice edge is not dropped.

       A slice that opens on some other day is labelled too — without it
       the topmost group carries yesterday's times under no heading and
       reads as today's list out of order. */
    _items(slice, before) {
      if (!slice.length) return [];
      const items = [];
      let prevDay = before ? before.dayDelta : slice[0].dayDelta;
      if (slice[0].dayDelta !== 0 && prevDay === slice[0].dayDelta) {
        items.push({ divider: true, label: this._dayLabel(slice[0]) });
      }
      slice.forEach((entry) => {
        if (entry.dayDelta !== prevDay) {
          items.push({ divider: true, label: this._dayLabel(entry) });
          prevDay = entry.dayDelta;
        }
        items.push(entry);
      });
      return items;
    }

    /* Trimming the past side to its row budget can cut the divider off
       the top, leaving that group's times sitting under no heading. The
       topmost row is the faintest and smallest, so spending it on the
       label it needs is the cheaper loss. */
    _labelHead(items) {
      const head = items[0];
      if (head && !head.divider && head.dayDelta !== 0) {
        return [{ divider: true, label: this._dayLabel(head) }].concat(items.slice(1));
      }
      return items;
    }

    _renderItems(items, fromNow) {
      /* Depth 0 is the item touching the line, whichever side it is on. */
      const n = items.length;
      return items.map((it, i) => {
        const depth = fromNow ? i : n - 1 - i;
        return it.divider
          ? '<div class="plugin-day-feed__divider" data-depth="' + depth + '">' +
              '<span>' + esc(it.label) + '</span></div>'
          : this._row(it, depth);
      }).join('');
    }

    _renderDay(now, past, current, next) {
      /* The band is the focus, so it gets the rows it needs and the two
         wings give way. Beyond four on site at once the list is capped
         and counted, rather than squeezing the panel. */
      const CAP = 4;
      const shown = current.slice(0, current.length > CAP ? CAP - 1 : CAP);
      const hidden = current.length - shown.length;
      /* The wings take back whatever the band is not using, so a quiet
         moment shows more of the day either side instead of slack. */
      const side = Math.min(this._sideN + 1,
        shown.length >= 4 ? 2 : shown.length >= 2 ? 3 : 4);

      const pastSlice = past.slice(Math.max(0, past.length - side - 1));
      const pastItems = this._labelHead(
        this._items(pastSlice, past[past.length - side - 2]).slice(-side));

      const nextSlice = next.slice(0, side + 1);
      const before = current[current.length - 1] || past[past.length - 1];
      const nextItems = this._items(nextSlice, before).slice(0, side);

      const currentHtml = shown.map((e) =>
        this._row(e, null, 'plugin-day-feed__row--current')).join('') +
        (hidden > 0
          ? '<div class="plugin-day-feed__more">+ ' + hidden + ' more on site</div>'
          : '');

      this._body.innerHTML =
        '<div class="plugin-day-feed__past">' + this._renderItems(pastItems, false) + '</div>' +
        '<div class="plugin-day-feed__now">' +
          this._nowMarkup(now) +
          (currentHtml ? '<div class="plugin-day-feed__current">' + currentHtml + '</div>' : '') +
        '</div>' +
        '<div class="plugin-day-feed__next">' + this._renderItems(nextItems, true) + '</div>';
    }

    /* "Tomorrow" reads wrong on a Saturday night, when the next working
       day is Monday, and wrong again all day Sunday. */
    _nextWorkingDay(day) {
      if (day === 0) return 'in the week ahead';
      if (day === 6) return 'on Monday';
      return 'tomorrow';
    }

    _renderRest(now, day, hour, quiet) {
      if (this._mode === 'rest') return this._paintClock(now);
      this._mode = 'rest';
      this._sig = null;
      const rest = this._pools.rest || {};
      /* Before the day starts is not the same as after it ends — the
         evening wording ("tools down", "tomorrow") is plainly wrong at
         06:00, when the crews roll out within the hour. `quiet` is a third
         case again: it is the middle of a working day and the crews are
         simply all out on longer jobs, so neither wording fits. */
      const template = quiet
        ? (rest.quiet || rest.evening || '')
        : day === 0
        ? (rest.sunday || rest.evening || '')
        : (hour < this._restUntil ? (rest.morning || rest.evening || '') : (rest.evening || ''));
      const text = template
        .replace('{next}', this._nextWorkingDay(day))
        .replace('{start}', pad(this._restUntil) + ':00');
      this._body.innerHTML =
        '<div class="plugin-day-feed__now">' + this._nowMarkup(now) + '</div>' +
        '<div class="plugin-day-feed__rest">' +
          '<span class="plugin-day-feed__rest-text">' + esc(text) + '</span>' +
        '</div>';
    }
  }

  customElements.define('plugin-day-feed', DayFeed);
})();
