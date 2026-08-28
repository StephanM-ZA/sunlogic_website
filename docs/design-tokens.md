# Sunlogic Design Tokens

**Status:** Living reference — update whenever `site/shared/tokens.js` changes.
**Single source of truth:** `site/shared/tokens.js` (this document describes it; it never overrides it — if the two disagree, the file is correct and this doc is stale).
**Related:** [[component-library.md]] (how these tokens get consumed by the `<sl-*>` components), [[../docs/superpowers/specs/2026-08-28-component-library-design.md]] (original architecture decision).

## Typography

Two font families, loaded via Google Fonts in every page's `<head>`:

| Family | Used for | Weights loaded |
|---|---|---|
| Hanken Grotesk | everything except nav-link/label text | 400, 500, 700, 800, 900 |
| Jetbrains Mono | `label` scale only (eyebrows, uppercase tags, nav links) | 400, 500, 700 |

### Type scale

Each row is a paired `font-*`/`text-*` Tailwind class (e.g. `font-headline-lg text-headline-lg`) — always use both together, the font-family utility alone doesn't carry size/line-height/weight.

| Token | Size | Line height | Letter spacing | Weight | Typical use |
|---|---|---|---|---|---|
| `display-lg` | 72px | 80px | -0.02em | 900 | Hero H1 (desktop) |
| `headline-lg` | 48px | 56px | -0.01em | 800 | Section H2 (desktop) |
| `headline-lg-mobile` | 32px | 40px | normal | 800 | Section H2 (mobile, via `max-md:font-headline-lg-mobile max-md:text-headline-lg-mobile`) |
| `headline-md` | 36px | 44px | normal | 800 | *(defined, not currently used on the homepage)* |
| `headline-sm` | 24px | 32px | normal | 700 | Card headings, panel/step headings |
| `body-lg` | 18px | 28px | normal | 400 | Hero subtext, section subtext |
| `body-md` | 16px | 24px | normal | 400 | Default body copy everywhere else |
| `label-md` | 14px | 20px | normal | 600 | Eyebrows, nav links, footer headings — always paired with `uppercase tracking-wide` or `tracking-widest` |

No hero H1 mobile override exists in the type scale — it inherits `display-lg` unless a page overrides it manually (none currently do).

## Color Palette

Full palette lives in `tokens.js` as flat Tailwind color names (`bg-primary-container`, `text-on-surface`, etc.) — never write a raw hex value in a component; if a token you need doesn't exist, add it to `tokens.js` first.

### Brand

| Token | Hex | Role |
|---|---|---|
| `secondary-container` | `#ff8000` | **The** brand orange — CTAs, active states, accent bars, icons |
| `secondary` | `#964900` | *(defined; avoid — see "known quirks" below)* |
| `primary-container` | `#0d2028` | Deep navy — dark section backgrounds, nav/footer, dark button fill |
| `primary` | `#000508` | Near-black — barely distinguishable from `primary-container`, avoid for anything meant to visibly differ from it |
| `solar-sky` | `#F0F7FF` | Very pale blue — service card icon-box fill only |

### Surfaces (light backgrounds, lightest → most muted)

| Token | Hex | Role |
|---|---|---|
| `surface-container-lowest` | `#ffffff` | Pure white — the "pop forward" surface: cards, inputs |
| `surface` / `background` | `#fbf9f9` | Off-white — reserved for translucent glass contexts (`sl-panel`, hero badge), not flat card fills |
| `surface-container-low` | `#f5f3f3` | *(defined, not currently used)* |
| `surface-container` | `#efedee` | The "tray" a card sits on — page-section backgrounds |
| `surface-container-high` | `#e9e8e8` | *(defined, not currently used)* |
| `surface-container-highest` | `#e4e2e2` | *(defined, not currently used)* |
| `surface-variant` | `#e4e2e2` | Borders/dividers on light backgrounds (`border-surface-variant/50`) |
| `surface-dim` | `#dbd9da` | *(defined, not currently used)* |
| `surface-bright` | `#fbf9f9` | *(duplicate of `surface` — defined, not currently used)* |

**Rule of thumb (established 2026-08-28):** a card/input never sits on a background of the *same* surface token — pair `surface-container-lowest` (card) with `surface-container` (the section around it), never `surface-container-lowest` on `surface-container-lowest`. The two are close enough in luminance that a shadow alone won't read as separation.

### Text-on-color pairs

| Background token | Matching text token | Hex |
|---|---|---|
| `primary-container` (dark) | `on-primary` | `#ffffff` |
| `surface`/`surface-container-*` (light) | `on-surface` | `#1b1c1c` |
| light, secondary emphasis | `on-surface-variant` | `#42474a` |
| `secondary-container` (orange) | `on-secondary` | `#ffffff` |

### Status

| Token | Hex | Role |
|---|---|---|
| `error` | `#ba1a1a` | *(defined, not currently used — no error states built yet)* |
| `error-container` | `#ffdad6` | *(defined, not currently used)* |

## Border Radius

```
DEFAULT: 0.125rem (2px)
lg:      0.25rem  (4px)
xl:      0.5rem   (8px)
full:    0.75rem  (12px)
```

**Known quirk:** `full` is redefined here to `0.75rem` — it does **not** mean "pill/circle" like stock Tailwind's `rounded-full` (`9999px`). Components mostly write this value as the arbitrary literal `rounded-[0.75rem]` rather than the `rounded-full` utility class that resolves to the same number — functionally identical today, but if this token's value ever changes, only usages of the `rounded-full` *class* would pick it up automatically; arbitrary `rounded-[0.75rem]` literals would silently drift out of sync. Prefer `rounded-full` over `rounded-[0.75rem]` in new work.

Beyond the token scale, components also use stock Tailwind radii directly: `rounded-xl` (cards' icon boxes), `rounded-2xl` (cards, panels, images) — these are intentional, not a mistake, just outside the custom token set.

## Shadows

| Token | Value | Role |
|---|---|---|
| `shadow-card` | `0 4px 16px -2px rgba(13, 32, 40, 0.08)` | Card resting shadow |
| `shadow-ambient` | `0 12px 32px -4px rgba(13, 32, 40, 0.12)` | Card/panel hover shadow, elevated panels |

The nav bar's shadow is **not** a token — it's a one-off arbitrary value combining a depth shadow with a faint brand-orange glow: `shadow-[0_10px_25px_-5px_rgba(0,0,0,0.3),0_0_20px_rgba(255,128,0,0.12)]`. Single-use derived value, not duplicated elsewhere, so it wasn't promoted to a token.

## Spacing

| Token | Value | Role |
|---|---|---|
| `section-gap-desktop` | 120px | Vertical section padding, ≥768px (`md:py-section-gap-desktop`) |
| `section-gap-mobile` | 64px | Vertical section padding, <768px (`py-section-gap-mobile`) |
| `gutter` | 24px | Horizontal section padding, ≥768px (`md:px-gutter`) |
| `margin-mobile` | 16px | Horizontal section padding, <768px (`px-margin-mobile`) |
| `container-max` | 1280px | *(defined; pages currently use Tailwind's stock `max-w-6xl` = 1152px instead — a discrepancy worth resolving if a wider layout is ever needed)* |
| `unit` | 8px | Base spacing unit — not consumed directly as a class; documents the rhythm the fixed `gap-*`/`p-*`/`mb-*` values across components already follow |

**Fixed as of 2026-08-28:** `section-gap-mobile` and `margin-mobile` existed in this file since the library's creation but were never actually applied anywhere — every section used the desktop value unconditionally, even on mobile. All page sections now go through the `<sl-section>` component (or, for the hero/footer which predate it, matching responsive classes applied directly), so the mobile tokens are live everywhere.

## Icons

Not a Tailwind token, but part of the same "one definition, every consumer" system: `site/shared/icons.js` holds a hand-picked subset of [Heroicons](https://heroicons.com) (outline, 24px, MIT license) as inline SVG path data, exposed via `slIcon(name, classes)`. No icon font, no external request at runtime — every icon a component needs is in that one file.

Current registry (19): `bolt`, `sun`, `arrow-right`, `clipboard-document-check`, `archive-box`, `wrench-screwdriver`, `wrench`, `chart-bar`, `check-circle`, `shield-check`, `map-pin`, `cog-6-tooth`, `scale`, `bars-3`, `x-mark`, `share`, `chat-bubble-left-right`, `pencil-square`, `lifebuoy`.

Sizing convention (width/height classes, since SVGs don't scale off `font-size` the way the old icon font did):

| Class | Pixels | Context |
|---|---|---|
| `w-5 h-5` | 20px | Inline with text/buttons, checklist bullets, footer share icon |
| `w-6 h-6` | 24px | Nav hamburger/close, `sl-step` icon boxes |
| `w-7 h-7` | 28px | Brand logo (`slBrand()`) |
| `w-8 h-8` | 32px | `sl-card` icon boxes (bumped up from the original 30px — deliberately "slightly bigger" per design review) |

Color always comes from the icon's own `text-*` class (via `stroke="currentColor"`) — never hardcode an icon's color inside `icons.js` itself.
