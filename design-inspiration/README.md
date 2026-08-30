# Design inspiration

Reference and historical material only. **Nothing here governs the live site.**

The working contract for `site-daylight/` is `site-daylight/SYSTEM.md`, with
`site-daylight/CLAUDE.md` as the one-page summary and
`site-daylight/ci-guide.html` as the corporate identity document.

| Item | What it is |
|---|---|
| `design/` | Earliest Stitch output — `code.html`, `screen.png`, `DESIGN.md`. |
| `design-system/` | Standalone CI guide (`index.html` + PDF). Superseded by `site-daylight/ci-guide.html`. |
| `design_handoff_sunlogic_blend/` | A design handoff bundle with its own CLAUDE.md, COPY.md and README. |
| `godaylight-design/` | The godaylight design skill (also installed as a Claude skill). |
| `component-library.md` | **Stale.** Documents the old Tailwind `<sl-*>` library in the archived `site/` build. |
| `design-tokens.md` | **Stale.** Documents `site/shared/tokens.js` from the same archived build. |

The two markdown files moved here from `docs/` because both named
`site/shared/*` as their single source of truth. That build is now in
`archive/site-tailwind/`; `site-daylight` uses `<dl-*>` components and
`shared/sunlogic.css` with no Tailwind at all.
