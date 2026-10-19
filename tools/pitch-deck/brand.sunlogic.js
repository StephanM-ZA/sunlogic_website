/* ============================================================
   SUNLOGIC DECK BRAND
   The swappable part. Colour, type and the mark live here and
   nowhere else, so a second business becomes a second file of
   this shape rather than an edit to the renderer.

   Tokens are the same names doc-builder uses, lifted from
   doc-style.css, so a deck and a proposal cannot drift apart.
   ============================================================ */
(function () {

  function assets() { return window.SL_DECK_ASSETS || {}; }

  function lockup(key) {
    var src = assets()[key];
    return src ? '<img class="sl-mark" src="' + src + '" alt="Sunlogic Energy">' : '';
  }

  window.SL_DECK_BRAND = {

  id:   'sunlogic',
  name: 'Sunlogic Energy',

  /* Rendered into :root by deck-render.js, for the screen and for
     the print document both, so there is one source of colour. */
  tokens: {
    'color-orange':      '#F66F00',
    'color-orange-text': '#B85300',
    'color-navy':        '#0D2028',
    'color-navy-deep':   '#081619',
    'color-beige':       '#FFF7E9',
    'color-beige-1':     '#F7EED9',
    'color-beige-2':     '#F0E5CF',
    'color-dark-beige':  '#DACAB6',
    'color-white':       '#fff',
    'color-grey':        '#A09B93',
    'color-grey-strong': '#5A544B',

    'surface-page':      'var(--color-beige)',
    'surface-page-alt':  'var(--color-beige-1)',
    'surface-card':      'var(--color-white)',
    'surface-sunk':      'var(--color-beige-2)',
    'surface-inverse':   'var(--color-navy)',
    'surface-highlight': '#FEEDD9',
    'border-highlight':  '#F5D6AE',
    'accent-highlight':  '#F0A050',

    'text-primary':      'var(--color-navy)',
    'text-secondary':    'var(--color-grey-strong)',
    'text-inverse':      '#fff',

    'border-hairline':   'rgba(13,32,40,.12)',
    'border-warm':       'var(--color-dark-beige)',
    'border-inverse':    'rgba(255,255,255,.18)',

    'gradient-dawn':     'linear-gradient(96deg,#4C2806 0%,#F66F00 45%,#FCCC3C 100%)',

    'font-display':      '"Hanken Grotesk","Helvetica Neue",sans-serif',
    'font-body':         '"Hanken Grotesk","Helvetica Neue",sans-serif',
    'font-mono':         '"JetBrains Mono",ui-monospace,monospace',

    'radius-sm':         '4px',
    'radius-md':         '8px',
    'radius-lg':         '16px',
    'radius-pill':       '999px'
  },

  /* The alternation. A slide that carries its own colour (cover,
     statement, cta) sits outside this and is never counted. */
  bands: ['surface-page', 'surface-page-alt'],

  /* The lockup is the site's own file, not an approximation of it. Two
     colours, because WeasyPrint does not style the inside of an SVG from
     CSS: a white lockup on a white sheet is an empty space, so it has to
     be a different file rather than a rule pointed at the same one.

     Drawn from deck-assets.js, which is generated from the built energy
     site, so the deck and the site cannot end up with different marks. */
  mark:      lockup('logo'),
  markLight: lockup('logoWhite'),

  /* The hero photograph the site opens on. The cover is the one slide
     that carries it; everything after is type on a band. */
  cover: (assets().hero || '')
  };
}());
