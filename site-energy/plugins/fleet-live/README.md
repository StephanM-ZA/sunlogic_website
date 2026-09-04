# plugin-fleet-live

The two live hero cards on the Energy home page: current PV output across the
fleet, and battery state of charge. Real telemetry, polled every two minutes.

Energy only. It was in `shared/` and loaded on all 31 pages to be used on two,
which is what `shared/` is for — things all three sites use. This is not one of
those.

## It reads one URL and holds no key

```
https://hooks.digitaloperations.co.za/webhook/fleet-live
```

Public, unauthenticated, CORS open. **No API key belongs in this file** — it
ships to every visitor's browser. VoltIQ's own API needs a key on every route,
so it cannot be called from here at all. An n8n workflow holds the key
server-side, calls VoltIQ's authenticated `/report/{id}/fleet-live`, and
returns only these three numbers:

```json
{ "updated_at": "2026-09-04T13:02:01+00:00", "pv_kw": 96.3,
  "pv_kwh_today": 1170.1, "battery_soc_pct": 93, "battery_discharging": false }
```

`hooks.` and not `n8n.` — both hostnames are aliases for the same instance and
return identical payloads, but `hooks.` is the one this estate standardised on
and the leads Worker already uses it. `n8n.` stays correct for the admin UI,
which is a different thing from a webhook endpoint.

## Usage

Needs two things in the host page: the cards, and this script after
`components.js`.

```html
<dl-stat tone="glass" label="Live PV output" value="—"
         sub="Live feed coming soon" data-live="pv" aria-live="polite"></dl-stat>
<dl-stat tone="glass" label="Battery SOC" value="—"
         sub="Live feed coming soon" data-live="soc" aria-live="polite"></dl-stat>

<script src="plugins/fleet-live/fleet-live.js?v=1" defer></script>
```

The `?v=` is replaced at build time with a hash of the file's contents, so
there is no version number to remember here — unlike the other plugins, whose
READMEs still ask you to bump one by hand.

## It decorates; it does not render

**This breaks the one rule the other plugins keep**, and the exception is
deliberate rather than an oversight.

`day-feed`, `review-carousel` and `calculator` all draw their own markup and
avoid the host's design tokens, which is what makes them portable. This one
draws nothing. It finds `.sl-stat` cards that `dl-stat` already rendered and
writes into them.

It could have rendered its own cards and been properly self-contained. That
would mean a second copy of the glass stat-card styling living outside the
design system — two definitions of one card, drifting the first time the hero
changes. This codebase has been bitten by exactly that often enough to prefer
the coupling: one card definition in `components.js`, and this only writes
values into it.

The cost is real and worth knowing: **change `.sl-stat`'s internals and this
breaks silently.** It queries `.sl-stat__label`, `.sl-stat__value` and
`.sl-stat__sub`.

## What it will not do

- **Never invents a number.** If the fetch fails for any reason the cards keep
  whatever fallback text the page shipped with — "Live feed coming soon".
  Degrading to a placeholder is honest; inventing a reading under a label
  reading "Live PV output" is not.

- **Never shows `0.0 kW`.** PV is genuinely zero before sunrise and after
  sunset, and zero under a "Live PV output" label reads as broken rather than
  as "production is done for today". When `pv_kw` is 0 or missing, both the
  label and the value switch to "Produced today" in kWh, using the fleet's
  running daily total. It switches back the moment PV is positive again. Still
  a real, sourced number either way.

  Battery SOC has no equivalent mode: a battery always has *some* state of
  charge, so that field should never be null once a feed exists.

## Staleness

Two unsynchronised clocks stack. n8n polls the fleet every 15 minutes during
daylight; this polls n8n every 2 minutes. Worst case a visitor sees a reading
about 17 minutes old. The card says which — "Updated 12m ago" — computed from
`updated_at` rather than from when the page happened to load.

Polling the webhook often is cheap: it reads VoltIQ's own database and makes no
inverter-provider API calls, so there is no rate limit to respect here.

## The dependency worth stating

This is the only part of the Energy site that depends on the office iMac being
up. It fails safe — placeholder text, no error, no invented figure — but it
does fail, and the hero is where it shows.
