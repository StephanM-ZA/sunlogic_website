# Fonts — self-hosted

Both typefaces are bundled here as `.woff2`, latin + latin-ext subsets, so the system renders identically offline, in air-gapped environments, and inside embedded contexts with no outbound network. There is **no CDN request at render time** and no licensed-font blocker.

| Role | Family | Weights | Files |
| --- | --- | --- | --- |
| Display / body / UI | **Hanken Grotesk** | 400, 500, 700, 800, 900 | `HankenGrotesk-{weight}-{subset}.woff2` |
| Labels / data / mono | **JetBrains Mono** | 400, 500, 700 | `JetBrainsMono-{weight}-{subset}.woff2` |

16 files: 8 weights × 2 subsets (`latin`, `latin-ext`). The `@font-face` rules, including the `unicode-range` for each subset, are in `../../tokens/fonts.css` — paths there are relative to that file, so linking `styles.css` from any depth works.

## Licence

Both families are licensed under the **SIL Open Font License 1.1**, which permits redistribution, embedding and use in commercial work.

- **Hanken Grotesk** — Alfredo Marco Pradil. https://fonts.google.com/specimen/Hanken+Grotesk
- **JetBrains Mono** — JetBrains. https://www.jetbrains.com/lp/mono/

**This notice must travel with the font files.** The OFL requires the licence and copyright notice to accompany redistribution. Do not rename the files in a way that obscures which family they are, and do not sell the fonts on their own.

## Other subsets
Only latin and latin-ext are bundled — enough for South African English, Afrikaans, and the other Latin-script South African languages. If you need Cyrillic, Greek or Vietnamese, pull those subsets from Google Fonts with the same naming convention and add the matching `@font-face` blocks.

## Adding a weight
Don't, without a reason. The type scale uses exactly these weights: 400 body, 500 (available, largely unused), 700 titles and UI, 800 section headings, 900 hero and numerals. A new weight is a token change — see `../../guidelines/contributing.md`.
