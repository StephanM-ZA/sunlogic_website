# plugin-day-feed

A company calendar that runs on the visitor's clock. The current time sits
in the middle of the panel, larger; what has already happened is above it,
what is still to come is below. As real time passes, entries cross the line
from below to above one step at a time.

No build step, no framework, no dependency on any host project's design
tokens.

## Usage

Three files, in this order — the data and the generator must both be
present before the component runs.

```html
<script src="path/to/schedule.data.js"></script>
<script src="path/to/day-feed-schedule.js"></script>
<script src="path/to/day-feed.js" defer></script>
```

Then place the element anywhere in your page:

```html
<plugin-day-feed></plugin-day-feed>
<plugin-day-feed title="Today" tone="glass" past="4" next="4"></plugin-day-feed>
```

| Attribute | Default | Notes |
|---|---|---|
| `title` | `Today` | Panel heading. |
| `past` | `4` | Rows shown above the current-time line. |
| `next` | `4` | Rows shown below it. |
| `rest-from` | `18` | Hour (0–23) the working day ends. |
| `rest-until` | `7` | Hour the working day starts. |
| `tone` | — | `glass` for the translucent fill used on dark grounds. |

## What it generates

The panel models a **company** calendar, not one person's list:

- **Several crews run in parallel.** `Solar 1`, `Solar 2`, `Elec 1`, `Elec 2`
  and `Office` are on the board; four or five of them work a given weekday.
  Because crews leave the yard within half an hour of each other, two
  entries often share a start time.
- **Jobs have durations** — 30 minutes, an hour, two hours, a half day, or
  all day. An all-day job shows `All day` instead of a start time and takes
  that crew off the board for the rest of the day.
- **Long jobs span days.** A job that starts on Tuesday with a span of three
  runs Wednesday and Thursday too, marked `day 2/3` and `day 3/3`. Spans
  count working days, so a job never "continues" over a Sunday.
- **A crew can only be in one place.** Days are composed oldest-first while
  tracking when each crew comes free, so a crew already on a three-day
  install cannot also appear on a fresh job that morning.
- **Solar, electrical and office work are mixed**, including SSEG
  submissions, approvals, COCs and commissioning records.

## Working hours

Saturday runs a half day — two or three crews, mornings only. Sunday, and
any time from `rest-from` to `rest-until`, shows the rest message from
`schedule.data.js` instead of inventing activity. The wording resolves
`{next}` to "tomorrow", "on Monday" or "in the week ahead" so it reads
correctly on a Saturday night and on a Sunday.

## How the day is chosen

Each day is composed from the pools in `schedule.data.js`, seeded by the
date with a mulberry32 PRNG. Two consequences worth knowing:

- **A returning visitor sees the same day.** Refreshing does not reshuffle
  the board, which is what a real schedule would do.
- **Days do not repeat.** The seed is the date, and the pools combine to far
  more permutations than there are days, so there is no cycle length to run
  out of. Verified over 342 consecutive working days with no repeated day.

## Editing the content

Everything shown comes from `schedule.data.js`, which is plain data — no
code. Add a suburb, a system size or a job and the feed picks it up.

Tokens usable inside a job's `text`: `{suburb}`, `{municipality}`,
`{array}`, `{panels}`, `{battery}`, `{board}`. Repeated tokens in one line
resolve to different values, so `{suburb} and {suburb}` cannot render the
same suburb twice.

Job fields:

| Field | Notes |
|---|---|
| `kind` | `solar`, `electrical` or `admin` — must match a crew's kind. |
| `band` | `open` 07:00–09:00 · `morning` 09:00–12:00 · `midday` 11:00–14:00 · `afternoon` 13:00–16:30 · `close` 15:30–17:45 |
| `dur` | `30m`, `1h`, `2h`, `half`, `allday` |
| `span` | `[min, max]` working days. Omit for a single-day job. |
| `weekend` | `false` keeps it off the Saturday half-day. |

## Theming

The component declares its defaults behind `:where(:root)`, so a host page
claims them by setting the same custom properties at `:root` — no class
overriding, and host values always win.

```css
:root {
  --plugin-day-feed-bg: #FFF7E9;
  --plugin-day-feed-accent: #F66F00;
  --plugin-day-feed-font: "JetBrains Mono", monospace;
  --plugin-day-feed-height: 320px;
}
```

Full list: `-bg`, `-border`, `-radius`, `-height`, `-accent`, `-text`,
`-muted`, `-faint`, `-rule`, `-font`, `-size`, `-row-h`, `-slide`.

The `glass` tone is a variant rather than a token, so a host that wants it
styles `.plugin-day-feed--glass` directly.

## Motion

The slot-machine step runs only when an entry actually crosses the line —
the clock repaints every second without touching the list. Under
`prefers-reduced-motion: reduce` the step and the pulsing live dot are both
switched off.

## Testing

`test.html` drives the component's clock (it reads `el.clock()` when that is
set), so you can scrub to any date and time, run a whole day at 120×, and
jump to the rest state, a Saturday or a Sunday. It also runs checks over 200
working days for repeated days, out-of-order times and crew double-bookings.

`day-feed-schedule.js` is pure and has no DOM dependency, so it can also be
exercised straight from Node.

## Honesty note

The entries are invented. They are composed from the pools in
`schedule.data.js` and describe no real job, customer or site. If the panel
is presented as live activity, that is a decision the host page is making —
this plugin does not claim the events are real, and `title` and the `Live`
label are the host's to set.
