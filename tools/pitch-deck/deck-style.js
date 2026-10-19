/* ============================================================
   DECK STYLES
   Held as strings rather than as .css files on purpose. A deck
   has to work from file://, from an email attachment, and fed to
   WeasyPrint on stdin, and in none of those can a script fetch a
   stylesheet beside it. doc-assets.js bakes the document CSS in
   for the same reason.

   SCREEN is fluid: a slide is a 16:9 box and everything inside it
   is sized in em off one slide font-size, so a slide is the same
   slide at any width with no JavaScript measuring anything.

   PRINT is the same markup at A4. Landscape for the deck, portrait
   for the one-pager, and the geometry is the only difference.
   ============================================================ */
window.SL_DECK_CSS = {

  /* --------------------------------------------------- shared */
  /* Everything that is about the deck rather than about the
     medium. Loaded by the screen and by print both. */
  core: [
'*,*::before,*::after{box-sizing:border-box}',
'html,body{margin:0}',
'body{background:var(--surface-page);color:var(--text-primary);',
' font-family:var(--font-body);line-height:1.45}',
'svg{display:block}',

/* ---- the slide box ---- */
'.sl-d-slide{position:relative;display:flex;flex-direction:column;overflow:hidden;',
' background:var(--band,var(--surface-page));color:var(--text-primary)}',
'.sl-d-slide--b1{--band:var(--surface-page-alt)}',
'.sl-d-slide--cover,.sl-d-slide--statement,.sl-d-slide--cta{',
' --band:var(--surface-inverse);color:var(--text-inverse)}',
'.sl-d-slide--cover .sl-d-em,.sl-d-slide--statement .sl-d-em,.sl-d-slide--cta .sl-d-em{color:var(--color-orange)}',
'.sl-d-em{font-style:normal;color:var(--color-orange-text)}',

/* ---- head stack ---- */
/* Measured off the live site: JetBrains Mono 14px, weight 600, 0.05em,
   --text-secondary on a light band and white at 70% on a dark one. */
'.sl-d-eyebrow{margin:0 0 .9em;font-family:var(--font-mono);font-size:.78em;',
' font-weight:600;letter-spacing:.05em;text-transform:uppercase;',
' color:var(--text-secondary)}',
'.sl-d-slide--cover .sl-d-eyebrow,.sl-d-slide--statement .sl-d-eyebrow,',
'.sl-d-slide--cta .sl-d-eyebrow{color:rgba(255,255,255,.7)}',
/* Section heading 48px/800, line-height 1.166, tracking -0.01em, and the
   hero 72px/900 at 1.111 and -0.02em. The site's own numbers. */
'.sl-d-h{margin:0;font-family:var(--font-display);font-size:2.66em;font-weight:800;',
' line-height:1.166;letter-spacing:-.01em;max-width:21em}',
'.sl-d-slide--cover .sl-d-h{font-size:4em;font-weight:900;line-height:1.111;',
' letter-spacing:-.02em;max-width:13em}',
'.sl-d-lead{margin:.8em 0 0;font-size:1em;line-height:1.555;',
' color:var(--text-secondary);max-width:36em}',
'.sl-d-slide--cover .sl-d-lead,.sl-d-slide--statement .sl-d-lead,',
'.sl-d-slide--cta .sl-d-lead{color:rgba(255,255,255,.78)}',
'.sl-d-slide--cover .sl-d-lead{max-width:30em}',
'.sl-d-head{flex:0 0 auto}',
'.sl-d-body{flex:1 1 auto;display:flex;flex-direction:column;justify-content:center;',
' min-height:0;padding-top:1.8em}',
/* A statement, a quote and the closing CTA are the whole slide, so they
   have no head above them to clear. */
'.sl-d-slide--statement .sl-d-body,.sl-d-slide--quote .sl-d-body,',
'.sl-d-slide--cta .sl-d-body{padding-top:0}',

/* ---- cover ---- */
/* The cover is navy, not the dawn gradient. The gradient IS orange, and
   the orange half of a heading laid over it cannot be read. The gradient
   earns its place as a rule above the facts instead. */
/* The site opens on a photograph with the copy held in the dark side of
   a scrim, so the deck does too. The gradient is listed first, which is
   what puts it over the image rather than under it. */
'.sl-d-slide--cover{justify-content:space-between;background-color:var(--color-navy);',
' background-image:linear-gradient(to top,rgba(13,32,40,.92) 0%,rgba(13,32,40,.45) 22%,',
' rgba(13,32,40,0) 42%),linear-gradient(100deg,rgba(13,32,40,.95) 0%,',
' rgba(13,32,40,.8) 40%,rgba(13,32,40,.3) 74%,rgba(13,32,40,.22) 100%),',
' var(--cover-photo,none);',
' background-size:cover;background-position:center}',
'.sl-d-kv{position:relative}',
'.sl-d-kv::before{content:"";position:absolute;left:0;top:-1px;width:7.5em;height:3px;',
' background:var(--gradient-dawn)}',
'.sl-d-cover-top{display:flex;align-items:flex-start;justify-content:space-between;gap:2em}',
'.sl-d-cover-mid{padding:1.2em 0}',
'.sl-d-kv{display:grid;grid-template-columns:repeat(4,1fr);gap:1.4em;',
' border-top:1px solid var(--border-inverse);padding-top:1.1em}',
'.sl-d-kv>div>dt{margin:0 0 .3em;font-family:var(--font-mono);font-size:.66em;',
' letter-spacing:.12em;text-transform:uppercase;color:rgba(255,255,255,.62)}',
'.sl-d-kv>div>dd{margin:0;font-size:.98em;font-weight:600;color:#fff}',

/* ---- statement ---- */

'.sl-d-statement{margin:0;font-family:var(--font-display);font-size:3.1em;font-weight:800;',
' line-height:1.1;letter-spacing:-.02em;max-width:26em}',

/* ---- cards ---- */
'.sl-d-cards{display:grid;gap:1.1em}',
'.sl-d-cards--2{grid-template-columns:repeat(2,1fr)}',
'.sl-d-cards--3{grid-template-columns:repeat(3,1fr)}',
'.sl-d-card{background:var(--surface-card);border:1px solid var(--border-hairline);',
' border-radius:var(--radius-md);padding:1.55em}',
'.sl-d-card__icon{width:1.33em;height:1.55em;margin-bottom:.9em;color:var(--color-orange)}',
'.sl-d-card h3{margin:0 0 .35em;font-family:var(--font-display);font-size:1.33em;',
' font-weight:700;line-height:1.2;letter-spacing:-.01em}',
'.sl-d-card p{margin:0;line-height:1.555;color:var(--text-secondary)}',

/* ---- label and paragraph ---- */
'.sl-d-kvlist{display:grid;grid-template-columns:repeat(2,1fr);gap:1.1em 1.8em}',
'.sl-d-kvlist>div{border-top:2px solid var(--color-orange);padding-top:.7em}',
'.sl-d-kvlist dt{margin:0 0 .3em;font-family:var(--font-display);font-size:1.02em;font-weight:700}',
'.sl-d-kvlist dd{margin:0;font-size:.92em;color:var(--text-secondary)}',

/* ---- bullets ---- */
'.sl-d-bullets{display:grid;gap:.7em 1.8em;margin:0;padding:0;list-style:none}',
'.sl-d-bullets--2{grid-template-columns:repeat(2,1fr)}',
'.sl-d-bullets li{display:flex;gap:.7em;align-items:flex-start;font-size:1em;',
' border-bottom:1px solid var(--border-hairline);padding-bottom:.7em}',
'.sl-d-bullets li::before{content:"";flex:0 0 auto;width:.46em;height:.46em;margin-top:.52em;',
' border-radius:50%;background:var(--color-orange)}',

/* ---- metrics ---- */
'.sl-d-metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:1.2em}',
'.sl-d-metric{border-top:2px solid var(--color-orange);padding-top:.8em}',
'.sl-d-metric b{display:block;font-family:var(--font-display);font-size:2.7em;',
' font-weight:900;line-height:1;letter-spacing:-.03em}',
'.sl-d-metric span{display:block;margin-top:.5em;font-size:.92em;font-weight:600}',
'.sl-d-metric em{display:block;margin-top:.25em;font-style:normal;font-size:.78em;',
' color:var(--text-secondary)}',

/* ---- quote ---- */

'.sl-d-quote{margin:0;font-family:var(--font-display);font-size:2em;font-weight:600;',
' line-height:1.26;letter-spacing:-.01em;max-width:30em}',
'.sl-d-quote::before{content:"";display:block;width:2.4em;height:3px;',
' background:var(--color-orange);margin-bottom:1em}',
'.sl-d-cite{margin:1.3em 0 0;font-size:.95em}',
'.sl-d-cite b{display:block;font-weight:700}',
'.sl-d-cite span{color:var(--text-secondary)}',

/* ---- timeline ---- */
'.sl-d-timeline{display:grid;grid-template-columns:repeat(4,1fr);gap:1.3em}',
'.sl-d-step{position:relative;border-top:1px solid var(--border-warm);padding-top:1.1em}',
'.sl-d-step::before{content:"";position:absolute;top:-.36em;left:0;width:.72em;height:.72em;',
' border-radius:50%;background:var(--color-orange)}',
'.sl-d-step dt{margin:0 0 .45em;font-family:var(--font-mono);font-size:.7em;',
' letter-spacing:.1em;text-transform:uppercase;color:var(--color-orange-text)}',
'.sl-d-step h3{margin:0 0 .35em;font-family:var(--font-display);font-size:1.05em;font-weight:700}',
'.sl-d-step p{margin:0;font-size:.88em;color:var(--text-secondary)}',

/* ---- table ---- */
'.sl-d-table{width:100%;border-collapse:collapse;font-size:.95em}',
'.sl-d-table th{text-align:left;padding:.55em .8em;font-family:var(--font-mono);',
' font-size:.76em;font-weight:400;letter-spacing:.1em;text-transform:uppercase;',
' color:var(--text-inverse);',
' background:var(--surface-inverse)}',
'.sl-d-table th:last-child,.sl-d-table td:last-child{text-align:right;',
' font-variant-numeric:tabular-nums}',
'.sl-d-table td{padding:.62em .8em;border-bottom:1px solid var(--border-hairline);',
' background:var(--surface-card)}',
'.sl-d-table tr:nth-child(even) td{background:var(--surface-sunk)}',
'.sl-d-note{margin:1em 0 0;font-size:.85em;color:var(--text-secondary)}',

/* ---- cta ---- */

'.sl-d-actions{display:flex;flex-wrap:wrap;gap:1em;margin-top:1.8em}',
'.sl-d-action{flex:1 1 14em;background:rgba(255,255,255,.07);',
' border:1px solid var(--border-inverse);border-radius:var(--radius-md);padding:1.1em 1.3em}',
'.sl-d-action b{display:block;font-family:var(--font-display);font-size:1.1em;',
' font-weight:700;color:#fff}',
'.sl-d-action span{display:block;margin-top:.35em;font-size:.88em;color:rgba(255,255,255,.72)}',
'.sl-d-action:first-child{background:var(--color-orange);border-color:var(--color-orange)}',
'.sl-d-action:first-child span{color:rgba(255,255,255,.88)}',

/* ---- contact ---- */
'.sl-d-contact{display:grid;grid-template-columns:1.2fr 1fr;gap:2em}',
'.sl-d-contact dl{margin:0;display:grid;gap:.75em}',
'.sl-d-contact dt{font-family:var(--font-mono);font-size:.68em;letter-spacing:.12em;',
' text-transform:uppercase;color:var(--text-secondary)}',
'.sl-d-contact dd{margin:.15em 0 0;font-size:1em;font-weight:600}',
'.sl-d-who{background:var(--surface-card);border:1px solid var(--border-hairline);',
' border-radius:var(--radius-md);padding:1.3em 1.4em;align-self:start}',
'.sl-d-who b{display:block;font-family:var(--font-display);font-size:1.3em;font-weight:800}',
'.sl-d-who span{display:block;margin-top:.2em;color:var(--text-secondary);font-size:.92em}',
'.sl-d-who a{display:block;margin-top:.7em;color:var(--color-orange-text);text-decoration:none;font-weight:600}',

/* ---- slide furniture ---- */
'.sl-d-foot{flex:0 0 auto;display:flex;align-items:flex-end;justify-content:space-between;',
' gap:1.5em;padding-top:1.4em;font-family:var(--font-mono);font-size:.68em;',
' letter-spacing:.08em;text-transform:uppercase;color:var(--color-grey-strong)}',
'.sl-d-slide--cover .sl-d-foot,.sl-d-slide--statement .sl-d-foot,',
'.sl-d-slide--cta .sl-d-foot{color:rgba(255,255,255,.55)}',
'.sl-mark{height:2.4em;width:auto;display:block}',
/* The lockup belongs on the cover. In a slide foot it is a signature,
   not a masthead, so it runs at about half. */
'.sl-d-foot .sl-mark{height:1.45em}'
  ].join('\n'),

  /* --------------------------------------------------- screen */
  screen: [
'body{padding:0 0 6rem;text-wrap:pretty}',
'.sl-d-deck{display:flex;flex-direction:column;align-items:center;gap:2rem;padding:2rem 1rem 0}',
/* A slide is a 16:9 box, and one font-size drives everything in it. */
'.sl-d-slide{width:100%;max-width:1280px;aspect-ratio:16/9;padding:3.1em 3.5em;',
' font-size:clamp(9px,1.32vw,17px);border-radius:var(--radius-lg);',
' box-shadow:0 1px 2px rgba(13,32,40,.06),0 18px 44px -24px rgba(13,32,40,.3)}',
/* Below a tablet the 16:9 box starves the copy, so let it grow. */
'@media(max-width:700px){.sl-d-slide{aspect-ratio:auto;min-height:72vw;font-size:12px}',
' .sl-d-cards--3,.sl-d-cards--2,.sl-d-kvlist,.sl-d-bullets--2,.sl-d-metrics,',
' .sl-d-timeline,.sl-d-kv,.sl-d-contact{grid-template-columns:1fr}}',

/* the bar */
'.sl-d-bar{position:sticky;top:0;z-index:40;display:flex;align-items:center;gap:.75rem;',
' padding:.6rem 1rem;background:rgba(255,247,233,.86);backdrop-filter:blur(10px);',
' border-bottom:1px solid var(--border-hairline);font-family:var(--font-mono);font-size:12px}',
'.sl-d-bar .sl-mark{height:22px;margin-right:.25rem}',
'.sl-d-bar__gap{flex:1 1 auto}',
'.sl-d-btn{font:inherit;font-family:var(--font-mono);font-size:12px;letter-spacing:.06em;',
' text-transform:uppercase;padding:.5rem .85rem;border-radius:var(--radius-pill);',
' border:1px solid var(--border-hairline);background:var(--surface-card);',
' color:var(--text-primary);cursor:pointer}',
'.sl-d-btn:hover{border-color:var(--color-orange)}',
'.sl-d-btn--go{background:var(--color-orange);border-color:var(--color-orange);color:#fff}',
'.sl-d-btn[disabled]{opacity:.45;cursor:default}',
'.sl-d-count{color:var(--text-secondary)}',

/* the rail */
'.sl-d-rail{display:flex;flex-wrap:wrap;gap:.4rem;justify-content:center;',
' padding:1.2rem 1rem 0;max-width:1280px;margin:0 auto}',
'.sl-d-rail button{font:inherit;font-family:var(--font-mono);font-size:11px;',
' letter-spacing:.06em;padding:.35rem .7rem;border-radius:var(--radius-pill);',
' border:1px solid var(--border-hairline);background:transparent;cursor:pointer;',
' color:var(--text-secondary)}',
'.sl-d-rail button[aria-current="true"]{background:var(--surface-inverse);',
' border-color:var(--surface-inverse);color:#fff}',

/* The section tab is for the one-pager, where a reader needs to know
   which part they are on. On screen each slide already carries the
   section name as its eyebrow, so showing it twice is just repetition. */
'.sl-d-sec{display:none}',

/* print-only furniture never shows on screen */
'.sl-d-pageno{display:none}',
'@media print{.sl-d-bar,.sl-d-rail,.sl-d-sec,.sl-d-edit{display:none!important}}'
  ].join('\n'),

  /* ---------------------------------------------------- print
     The deck at A4 landscape: one slide per page, edge to edge,
     because a slide already carries its own margin. */
  print: [
'@page{size:A4 landscape;margin:0}',
'body{background:#fff}',
'.sl-d-deck{display:block}',
'.sl-d-slide{width:297mm;height:209.7mm;padding:15mm 17mm;font-size:11.4pt;',
' break-after:page;break-inside:avoid}',
'.sl-d-slide:last-child{break-after:auto}',
'.sl-d-bar,.sl-d-rail,.sl-d-sec,.sl-d-edit{display:none}',
/* WeasyPrint lays a grid out differently from a browser, so the
   grids that matter become table rows, which it does agree about. */
/* border-spacing puts a gap before the first cell as well as between
   them, which insets every grid from the edge and leaves it out of line
   with the heading above. Pulling the table out by one gap each side
   puts the first and last cells back on the margin. */
'.sl-d-cards,.sl-d-metrics,.sl-d-timeline,.sl-d-kvlist,.sl-d-kv,.sl-d-contact{',
' display:table;width:calc(100% + 18pt);margin:0 -9pt;border-spacing:9pt 0;',
' table-layout:fixed}',
'.sl-d-cards>*,.sl-d-metrics>*,.sl-d-timeline>*,.sl-d-kvlist>*,.sl-d-kv>*,',
'.sl-d-contact>*{display:table-cell;vertical-align:top}',
'.sl-d-bullets{display:block;column-count:2;column-gap:14pt}',
'.sl-d-bullets--1{column-count:1}',
'.sl-d-bullets li{break-inside:avoid}',
'.sl-d-actions{display:table;width:calc(100% + 18pt);margin:0 -9pt;border-spacing:9pt 0}',
'.sl-d-action{display:table-cell;vertical-align:top}',
'.sl-d-pageno{display:block;font-variant-numeric:tabular-nums}'
  ].join('\n'),

  /* ------------------------------------------------ one-pager
     The same slides at A4 portrait, flowing, so five sections
     land on one or two sides of paper instead of five. */
  onePager: [
'@page{size:A4 portrait;margin:12mm 12mm 14mm;',
' @bottom-center{content:counter(page) " of " counter(pages);',
'  font-family:monospace;font-size:7.5pt;color:#5A544B}}',
'body{background:#fff}',
'.sl-d-deck{display:block}',
'.sl-d-slide{width:auto;height:auto;padding:0 0 5mm;font-size:8.3pt;',
' background:#fff!important;color:var(--text-primary)!important;',
' break-inside:avoid;break-after:auto}',
/* A one-pager is one voice on white. The dark bands become a rule
   and a colour, because five inverted blocks on one page is a mess. */
'.sl-d-slide--cover{background-image:none!important;background-color:#fff!important}',
'.sl-d-slide--cover .sl-d-kv::before{display:none}',
'.sl-d-slide--cover .sl-d-lead,.sl-d-slide--statement .sl-d-lead,',
'.sl-d-slide--cta .sl-d-lead{color:var(--text-secondary)!important}',
'.sl-d-slide--cover .sl-d-eyebrow,.sl-d-slide--statement .sl-d-eyebrow,',
'.sl-d-slide--cta .sl-d-eyebrow,.sl-d-slide--cover .sl-d-foot,',
'.sl-d-slide--statement .sl-d-foot,.sl-d-slide--cta .sl-d-foot{color:var(--color-orange-text)!important}',
'.sl-d-slide--cover .sl-d-em,.sl-d-slide--statement .sl-d-em,',
'.sl-d-slide--cta .sl-d-em{color:var(--color-orange-text)!important}',
'.sl-d-slide--cover{border-bottom:2.2pt solid var(--color-navy);margin-bottom:4mm;padding-bottom:3mm}',
'.sl-d-slide--cover .sl-d-h{font-size:1.75em;margin-top:0}',
'.sl-d-slide--cover .sl-d-lead{margin-top:.5em}',
'.sl-d-h{font-size:1.32em}',
'.sl-d-statement{font-size:1.4em}',
'.sl-d-lead{margin-top:.5em}',
'.sl-d-card{padding:.8em .9em}',
'.sl-d-kvlist{gap:.7em 1.2em}',
'.sl-d-bullets li{padding-bottom:.45em}',
'.sl-d-cover-top{margin-bottom:2mm}',
'.sl-d-kv{padding-top:.6em;margin-top:2mm}',
'.sl-d-kv>div>dt,.sl-d-kv>div>dd{color:var(--text-primary)}',
'.sl-d-kv>div>dt{color:var(--text-secondary)}',
'.sl-d-kv{border-top:.5pt solid var(--border-warm)}',
'.sl-d-body{padding-top:.8em;display:block}',
'.sl-d-metric b{font-size:1.7em}',
'.sl-d-metric span{margin-top:.3em}',
'.sl-d-sec{padding:0 0 1mm;margin-bottom:2mm}',
'.sl-d-foot{display:none}',
'.sl-d-bar,.sl-d-rail,.sl-d-edit{display:none}',
'.sl-d-sec{display:block;width:auto;padding:0 0 1.5mm;border-bottom:.5pt solid var(--border-warm);',
' margin-bottom:3mm;font-family:var(--font-mono);font-size:7.4pt;letter-spacing:.12em;',
' text-transform:uppercase;color:var(--color-orange-text)}',
'.sl-d-sec span{display:none}',
/* A tab reading COVER above a cover, or CONTACT above a ruled contact
   strip, is a line of furniture saying what is already plain. */
'.sl-d-sec--cover,.sl-d-sec--contact{display:none}',
/* The section tab already names the part, so the slide's own eyebrow is
   the same words twice. On a sheet that is 8mm a section, and five
   sections of it is the difference between one side and two. */
'.sl-d-slide:not(.sl-d-slide--cover) .sl-d-eyebrow{display:none}',
'.sl-d-slide--cover .sl-d-eyebrow{margin-bottom:.5em}',
'.sl-d-cards,.sl-d-metrics,.sl-d-timeline,.sl-d-kvlist,.sl-d-kv,.sl-d-contact,',
'.sl-d-actions{display:table;width:calc(100% + 14pt);margin:0 -7pt;',
' border-spacing:7pt 0;table-layout:fixed}',
'.sl-d-cards>*,.sl-d-metrics>*,.sl-d-timeline>*,.sl-d-kvlist>*,.sl-d-kv>*,',
'.sl-d-contact>*,.sl-d-action{display:table-cell;vertical-align:top}',
'.sl-d-bullets{display:block;column-count:2;column-gap:12pt}',
'.sl-d-bullets li{break-inside:avoid}',
'.sl-d-action:first-child{background:none;border-color:var(--border-warm)}',
'.sl-d-action b,.sl-d-action span{color:var(--text-primary)!important}',
'.sl-d-action{background:var(--surface-highlight);border-color:var(--border-highlight)}',
/* On a sheet the contact is a footer strip, not a panel: it was a
   quarter of the page, which is what pushed the standard one-pager onto
   a second side. Same fields, laid along the bottom. */
'.sl-d-slide--contact .sl-d-h,.sl-d-slide--contact .sl-d-lead{display:none}',
'.sl-d-slide--contact{border-top:1.6pt solid var(--color-navy);padding-top:2.5mm}',
'.sl-d-contact{display:table;width:100%;table-layout:fixed;border-spacing:6pt 0}',
'.sl-d-contact dl{display:block;font-size:.92em}',
'.sl-d-contact>*:first-child{width:63%}',
'.sl-d-contact dl>div{display:inline;margin-right:.9em}',
'.sl-d-contact dt,.sl-d-contact dd{display:inline;margin:0;font-size:1em}',
'.sl-d-contact dt::after{content:" "}',
'.sl-d-contact dd{font-weight:600}',
'.sl-d-who{background:none;border:0;padding:0;font-size:.92em}',
'.sl-d-who b{font-size:1.05em}',
'.sl-d-who span{display:inline;margin-left:.4em}',
'.sl-d-who a{display:inline;margin:0 .6em 0 .5em;color:var(--color-orange-text)}',
'.sl-d-pageno{display:none}'
  ].join('\n')
};
