# plugin-calculator

A portable solar/SME savings calculator. No build step, no framework, no
dependency on any host project's Tailwind config or design tokens.

## Usage

Drop all three script files into your project (keep them together), then add:

```html
<script src="path/to/assumptions.js"></script>
<script src="path/to/calculator-math.js"></script>
<script src="path/to/calculator.js" defer></script>
```

Then place the element anywhere in your page:

```html
<plugin-calculator mode="residential" webhook="https://your-webhook-url"></plugin-calculator>
<plugin-calculator mode="sme" webhook="https://your-webhook-url"></plugin-calculator>
```

- `mode` — `"residential"` (default) or `"sme"`.
- `webhook` — where the lead payload is POSTed on gate-unlock. If omitted or
  set to the literal string `"PENDING_BACKEND"`, the payload is logged to
  the console instead of sent — useful during development before a real
  webhook exists.

## How it works

- Both modes show a live-updating headline as the visitor adjusts a
  slider/number input for their monthly bill (and, for SME, weekly
  operating hours).
- A permanent disclaimer is always visible: these are estimates, not a
  formal design or finance offer.
- Submitting an email in the "Unlock your full savings report" gate POSTs
  a JSON payload — `{ mode, inputs, results, email, timestamp }` — to the
  `webhook` attribute, then reveals a fuller breakdown (system size, cost,
  and for residential mode, a 20-year savings chart) in place.
- SME mode can produce a negative "pivot" (financing costs more than
  savings) for businesses with very short operating hours — this shows an
  honest fallback message instead of a discouraging raw number, but still
  offers the same email-gate CTA.
- A honeypot field guards the gate form against basic spam bots.

## Editing the assumptions

Every number the calculator relies on — tariff rates, sun-hours,
cost-per-kW, escalation rate, finance term/rate — lives in
`assumptions.js` as a single labeled config object, separate from the
calculation logic in `calculator-math.js`. Edit values there; no other
file needs to change.

## Theming

Override any of these CSS custom properties to match your project's brand:

| Variable | Default | Purpose |
|---|---|---|
| `--plugin-calc-accent` | `#ff8000` | Headline figures, slider accent, submit button, chart bars |
| `--plugin-calc-bg` | `#ffffff` | Card background |
| `--plugin-calc-text-color` | `#1a1a1a` | Body text |
| `--plugin-calc-text-muted` | `#6b7280` | Labels, disclaimer, borders |
| `--plugin-calc-radius` | `1rem` | Card and headline corner radius |
| `--plugin-calc-font` | `inherit` | Font-family |

## Known limitations

- No PDF export yet — "download report" is a future feature once a
  backend exists to render one.
- No live tariff/finance-rate lookups — all assumptions are static and
  editable, not fetched from any API.
- Assumes Western Cape sun-hours; there's no region input.
