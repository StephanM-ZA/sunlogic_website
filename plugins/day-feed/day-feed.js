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
        height: var(--plugin-day-feed-row-h);
        font-size: var(--plugin-day-feed-size);
        letter-spacing: 0.05em;
        text-transform: uppercase;
        white-space: nowrap;
      }
      .plugin-day-feed__time {
        flex: 0 0 58px;
        color: var(--plugin-day-feed-faint);
        font-variant-numeric: tabular-nums;
      }
      /* Which crew, so the panel reads as a company diary rather than
         one person's list. */
      .plugin-day-feed__crew {
        flex: 0 0 52px;
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

      /* Distance from the current moment reads as distance in tone. */
      .plugin-day-feed__row[data-depth="0"] { opacity: 1; }
      .plugin-day-feed__row[data-depth="1"] { opacity: 0.7; }
      .plugin-day-feed__row[data-depth="2"] { opacity: 0.48; }
      .plugin-day-feed__row[data-depth="3"] { opacity: 0.3; }
      .plugin-day-feed__row[data-depth="4"] { opacity: 0.18; }

      .plugin-day-feed__now {
        display: flex; gap: 10px; align-items: baseline;
        flex: 0 0 auto;
        margin: 6px 0; padding: 8px 0;
        border-top: 1px solid var(--plugin-day-feed-rule);
        border-bottom: 1px solid var(--plugin-day-feed-rule);
        color: var(--plugin-day-feed-accent);
        font-size: 17px; font-weight: 600;
      }
      .plugin-day-feed__now-time { font-variant-numeric: tabular-nums; }
      .plugin-day-feed__now-secs {
        font-size: var(--plugin-day-feed-size);
        font-variant-numeric: tabular-nums;
        opacity: 0.65;
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
      this._pastN = Math.max(1, parseInt(this.getAttribute('past'), 10) || 4);
      this._nextN = Math.max(1, parseInt(this.getAttribute('next'), 10) || 4);
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
      const title = this.getAttribute('title') || 'Today';
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
        this._rows = this._sched.composeDay(now, this._pools);
        this._boundary = null;
        this._mode = null;
      }

      let boundary = 0;
      while (boundary < this._rows.length && this._rows[boundary].start <= minutes) boundary++;

      /* Nothing has crossed — only the clock needs repainting, so the
         list is left alone and its animation is not restarted. */
      if (this._mode === 'day' && this._boundary === boundary) {
        return this._paintClock(now);
      }
      const advanced = this._mode === 'day' && this._boundary !== null && boundary > this._boundary;
      this._mode = 'day';
      this._boundary = boundary;
      this._renderDay(now, boundary);
      if (advanced) this._playAdvance();
    }

    _playAdvance() {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      this._panel.classList.remove('is-advancing');
      void this._panel.offsetWidth; /* forces the animation to restart */
      this._panel.classList.add('is-advancing');
    }

    _row(entry, depth) {
      /* An all-day job shows the label instead of a start time — it has
         no meaningful hour to give. */
      const when = entry.allDay ? 'All day' : entry.time;
      const span = entry.span > 1
        ? '<span class="plugin-day-feed__span">day ' + entry.dayIndex + '/' + entry.span + '</span>'
        : '';
      return '<div class="plugin-day-feed__row" data-depth="' + depth + '">' +
        '<span class="plugin-day-feed__time">' + esc(when) + '</span>' +
        '<span class="plugin-day-feed__crew">' + esc(entry.crew) + '</span>' +
        '<span class="plugin-day-feed__text">' + esc(entry.text) + '</span>' +
        span + '</div>';
    }

    _nowMarkup(now) {
      return '<div class="plugin-day-feed__now">' +
        '<span class="plugin-day-feed__now-time" data-clock>' +
          pad(now.getHours()) + ':' + pad(now.getMinutes()) + '</span>' +
        '<span class="plugin-day-feed__now-secs" data-secs>' + pad(now.getSeconds()) + '</span>' +
        '<span class="plugin-day-feed__now-label">now</span></div>';
    }

    _paintClock(now) {
      const c = this.querySelector('[data-clock]');
      const s = this.querySelector('[data-secs]');
      if (c) c.textContent = pad(now.getHours()) + ':' + pad(now.getMinutes());
      if (s) s.textContent = pad(now.getSeconds());
    }

    _renderDay(now, boundary) {
      /* Depth 0 is the row touching the line on either side. */
      const past = this._rows.slice(Math.max(0, boundary - this._pastN), boundary);
      const next = this._rows.slice(boundary, boundary + this._nextN);
      this._body.innerHTML =
        '<div class="plugin-day-feed__past">' +
          past.map((e, i) => this._row(e, past.length - 1 - i)).join('') +
        '</div>' +
        this._nowMarkup(now) +
        '<div class="plugin-day-feed__next">' +
          next.map((e, i) => this._row(e, i)).join('') +
        '</div>';
    }

    /* "Tomorrow" reads wrong on a Saturday night, when the next working
       day is Monday, and wrong again all day Sunday. */
    _nextWorkingDay(day) {
      if (day === 0) return 'in the week ahead';
      if (day === 6) return 'on Monday';
      return 'tomorrow';
    }

    _renderRest(now, day) {
      if (this._mode === 'rest') return this._paintClock(now);
      this._mode = 'rest';
      this._boundary = null;
      const rest = this._pools.rest || {};
      const template = day === 0 ? (rest.sunday || rest.evening || '') : (rest.evening || '');
      const text = template.replace('{next}', this._nextWorkingDay(day));
      this._body.innerHTML =
        this._nowMarkup(now) +
        '<div class="plugin-day-feed__rest">' +
          '<span class="plugin-day-feed__rest-text">' + esc(text) + '</span>' +
        '</div>';
    }
  }

  customElements.define('plugin-day-feed', DayFeed);
})();
