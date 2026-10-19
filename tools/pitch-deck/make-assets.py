#!/usr/bin/env python3
"""Bake the deck's fonts into deck-assets.js.

    python3 make-assets.py            from the repo's shared/fonts
    python3 make-assets.py <dir>      from somewhere else

A deck is set in heavy display weights, and a PDF engine that is handed
only a 400 face has to fake the rest, which on a 3em heading is obvious.
So the deck carries the weights it actually sets type in, as data, and
every @font-face it declares names one real file at one real weight.

That is also why this exists separately from doc-builder's make-assets.py:
a proposal is body copy at 400 and does not need 800 or 900.

The icons come from doc-builder's icons.json, which stays the one source
for them. They are baked in here rather than reached for across folders,
because a deck served over http cannot load a file above its own root,
and a deck emailed as one file cannot load anything at all.

Run it again when a font file or an icon changes, and commit the result.
"""
import base64, json, pathlib, sys

HERE = pathlib.Path(__file__).resolve().parent
FONTS = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else HERE.parents[1] / 'shared' / 'fonts'

# family, weight -> file. The weight in the key is the weight declared in
# the @font-face, so nothing is ever synthesized.
WANT = {
    'body400': 'HankenGrotesk-400-latin.woff2',
    'body500': 'HankenGrotesk-500-latin.woff2',
    'body700': 'HankenGrotesk-700-latin.woff2',
    'body800': 'HankenGrotesk-800-latin.woff2',
    'body900': 'HankenGrotesk-900-latin.woff2',
    'mono400': 'JetBrainsMono-400-latin.woff2',
}

ICONS = pathlib.Path(__file__).resolve().parent.parent / 'doc-builder' / 'icons.json'

# The site's own lockup and hero, from the built energy site. A deck that
# draws its own approximation of the mark is a deck that looks like
# somebody else's. Two colours of lockup because a white one on a white
# sheet is an empty space, and CSS cannot recolour an SVG for WeasyPrint.
IMAGES = {
    'logo':      ('dist/energy/images/sl_logo_energy_blue.svg',  'image/svg+xml'),
    'logoWhite': ('dist/energy/images/sl_logo_energy_white.svg', 'image/svg+xml'),
    'hero':      ('dist/energy/images/hero-energy-1440w.webp',   'image/webp'),
}


def main():
    if not FONTS.is_dir():
        sys.exit('no font directory at %s' % FONTS)
    out, missing = {}, []
    for key, name in WANT.items():
        f = FONTS / name
        if not f.is_file():
            missing.append(name)
            continue
        out[key] = base64.b64encode(f.read_bytes()).decode()
    if missing:
        sys.exit('missing: ' + ', '.join(missing))

    repo = HERE.parents[1]
    for key, (rel, mime) in IMAGES.items():
        f = repo / rel
        if not f.is_file():
            sys.exit('missing image: %s' % f)
        out[key] = 'data:%s;base64,%s' % (mime, base64.b64encode(f.read_bytes()).decode())

    if not ICONS.is_file():
        sys.exit('no icons.json at %s' % ICONS)
    icons = json.loads(ICONS.read_text(encoding='utf-8'))

    body = ['/* ============================================================',
            '   DECK ASSETS  (generated, do not hand edit)',
            '   Regenerate with:  python3 make-assets.py',
            '   Fonts: one real file per weight, so no engine fakes a bold.',
            '   Icons: from doc-builder/icons.json, the one source for them.',
            '   Logo and hero: the built energy site\'s own files.',
            '   ============================================================ */',
            'window.SL_DECK_ASSETS = {']
    body += ['  %s: "%s",' % (k, out[k]) for k in WANT if k in out]
    body += ['  %s: "%s",' % (k, out[k]) for k in IMAGES if k in out]
    body += ['  icons: ' + json.dumps(icons, indent=2, sort_keys=True) + ',']
    body += ['};', '']
    (HERE / 'deck-assets.js').write_text('\n'.join(body), encoding='utf-8')
    print('deck-assets.js  %d fonts  %d images  %d icons  %.0f kB'
          % (len(WANT), len(IMAGES), len(icons),
             (HERE / 'deck-assets.js').stat().st_size / 1024))


if __name__ == '__main__':
    main()
