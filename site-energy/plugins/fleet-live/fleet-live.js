/* ============================================================
   SUNLOGIC FLEET LIVE
   The two live hero cards: PV output and battery state of charge.

   Lives here rather than in shared/components.js, which is the design
   system. Polling an n8n webhook for VoltIQ fleet telemetry is an
   application concern, and the design system had no business knowing
   about either. It also shipped to all 31 pages to be used on two.

   Deliberately NOT a plugin. Every plugin in plugins/ renders its own
   markup and is independent of the host's design tokens; this renders
   nothing. Its whole job is to update the .sl-stat cards that dl-stat
   draws, so making it a plugin would force a second copy of the glass
   stat-card styling to live outside the design system — two definitions
   of one card, which is the drift this codebase keeps getting bitten by.
   One definition stays in components.js; this only writes into it.

   Load it after components.js, on pages carrying <dl-stat data-live>.
   ============================================================ */
/* Live fleet stats — polls a small public JSON snapshot for the two
   hero <dl-stat data-live="pv"|"soc"> cards, refreshed every 15 minutes.
   ------------------------------------------------------------------
   This reads a public, unauthenticated URL only — no API key lives
   here, and none should ever be added to this file, since anything
   here ships to every visitor's browser. VoltIQ's own API requires a
   key on every route, so it cannot be called directly from here.
   Instead this hits a small n8n webhook (n8n/voltiq-fleet-live-webhook.json
   in the VoltIQ repo) that holds the key server-side, calls VoltIQ's
   authenticated /report/{id}/fleet-live route, and returns just the
   three public numbers with CORS open. That workflow is live and
   answering (verified 2026-09-04). Whenever a fetch fails for any
   reason the cards keep whatever fallback text is in the page's own
   HTML — "Live feed coming soon". Never fabricate a number here if the
   feed is unreachable: degrading to a placeholder is honest, inventing
   a reading on a page that says "Live PV output" is not.

   Worth stating plainly: this makes the hero of the energy site depend
   on the office iMac being up. It fails safe, but it does fail.

   Expected feed shape (adjust the parsing below if the real one differs):
   { "updated_at": "2026-08-30T12:15:00Z", "pv_kw": 42.7,
     "pv_kwh_today": 612.4, "battery_soc_pct": 63, "battery_discharging": true }

   Battery SOC is always defined for a live plant — a battery always has
   *some* state of charge — so that feed field should never be null;
   the card only falls to its "coming soon" text while there's no feed
   connection at all, never once one exists. SOC has no day/night mode —
   it's just whatever the fleet's current SOC is, always.

   PV is different: it's genuinely zero once the day's production is
   done (or before it's started), and showing "0.0 kW" then reads as
   broken rather than as "production's done for today". So once current
   pv_kw is 0 (or missing), the card switches — both its label AND its
   value — from "Live PV output" / kW to "Produced today" / kWh, using
   pv_kwh_today (the fleet's running daily energy total, which VoltIQ
   already tracks per system). Still a real, sourced number either way,
   never invented, and it switches back to live kW the moment pv_kw is
   positive again. */
/* hooks., not n8n. — the two hostnames are aliases for the same n8n
   instance (identical payloads, identical updated_at), and hooks. is the
   one this estate standardised on; the leads Worker already uses it.
   n8n. remains correct for the admin UI, which is a different thing from
   a webhook endpoint. */
const SL_FLEET_LIVE_URL = 'https://hooks.digitaloperations.co.za/webhook/fleet-live';
/* This is the SITE's own poll of the (cheap, already-collected) webhook —
   independent of how often n8n itself polls the fleet (currently every 15
   min during daylight, see VoltIQ/docs/n8n-workflows.md). Two unsynced
   15-minute clocks stack worst-case, so a visitor could see a reading up
   to ~30 min stale even though n8n itself never lags more than 15. This
   webhook only reads VoltIQ's own DB (no inverter-provider API calls), so
   polling it far more often than the backend poll carries no rate-limit
   risk — 2 minutes caps the worst case at ~17 min instead. */
const SL_FLEET_POLL_MS = 2 * 60 * 1000;

function slUpdateLiveStats(data) {
  const pv = document.querySelector('[data-live="pv"]');
  const soc = document.querySelector('[data-live="soc"]');
  const ageMin = data && data.updated_at
    ? Math.round((Date.now() - new Date(data.updated_at).getTime()) / 60000)
    : null;
  const freshness = ageMin === null ? 'Live' : ageMin <= 1 ? 'Updated just now' : 'Updated ' + ageMin + 'm ago';
  const formatPower = (kw, unit) => kw >= 1000 ? (kw / 1000).toFixed(1) + ' M' + unit : kw.toFixed(1) + ' k' + unit;
  if (pv && data) {
    if (typeof data.pv_kw === 'number' && data.pv_kw > 0) {
      pv.querySelector('.sl-stat__label').textContent = 'Live PV output';
      pv.querySelector('.sl-stat__value').textContent = formatPower(data.pv_kw, 'W');
      pv.querySelector('.sl-stat__sub').textContent = freshness;
    } else if (typeof data.pv_kwh_today === 'number') {
      pv.querySelector('.sl-stat__label').textContent = 'Produced today';
      pv.querySelector('.sl-stat__value').textContent = formatPower(data.pv_kwh_today, 'Wh');
      pv.querySelector('.sl-stat__sub').textContent = freshness;
    }
  }
  if (soc && data && typeof data.battery_soc_pct === 'number') {
    const state = typeof data.battery_discharging === 'boolean'
      ? (data.battery_discharging ? 'Discharging' : 'Charging') + ' · ' + freshness
      : freshness;
    soc.querySelector('.sl-stat__value').textContent = Math.round(data.battery_soc_pct) + '%';
    soc.querySelector('.sl-stat__sub').textContent = state;
  }
}

function slPollFleetLive() {
  if (!document.querySelector('[data-live="pv"], [data-live="soc"]')) return;
  fetch(SL_FLEET_LIVE_URL, { cache: 'no-store' })
    .then((r) => { if (!r.ok) throw new Error('fleet-live ' + r.status); return r.json(); })
    .then(slUpdateLiveStats)
    .catch(() => {}); // feed isn't live yet (or is down) — cards keep their fallback text
}
slPollFleetLive();
setInterval(slPollFleetLive, SL_FLEET_POLL_MS);
