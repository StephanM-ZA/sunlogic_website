#!/usr/bin/env python3
"""Make the PDF of a pitch deck with WeasyPrint.

    python3 make-pdf.py                           the whole deck, landscape A4
    python3 make-pdf.py deck.json                 a saved model instead
    python3 make-pdf.py --only cover,offer,next   some sections
    python3 make-pdf.py --one-pager               A4 portrait, condensed
    python3 make-pdf.py --opts opts.json          the picker's own selection
    python3 make-pdf.py -o Sunlogic-Pitch.pdf     where it goes

Renders through render.mjs, which loads the browser's own renderer under
node, so this and the Download button produce the same document. Section
keys are the `k` fields in deck.data.js, and `--only` takes them in any
order: the deck's own order is kept.

Works with either install:
  pip install weasyprint     ->  imported directly
  brew install weasyprint    ->  the weasyprint command, fed on stdin
"""
import pathlib, shutil, subprocess, sys

HERE = pathlib.Path(__file__).resolve().parent


def render(argv):
    """The print HTML, from the one renderer. Node's stderr is the model
    check, which is worth seeing, so it is passed straight through."""
    node = shutil.which('node')
    if not node:
        sys.exit('node not found, and render.mjs needs it. Install node, or use the browser button.')
    r = subprocess.run([node, str(HERE / 'render.mjs')] + argv,
                       capture_output=True, text=True)
    if r.stderr:
        sys.stderr.write(r.stderr)
    if r.returncode:
        sys.exit(r.returncode)
    return r.stdout


def to_pdf(html, out):
    try:
        from weasyprint import HTML
        HTML(string=html, base_url=str(HERE)).write_pdf(out)
    except ImportError:
        exe = shutil.which('weasyprint')
        if not exe:
            sys.exit("WeasyPrint not found. Either 'pip install weasyprint' or 'brew install weasyprint'.")
        subprocess.run([exe, '-', str(out), '-u', str(HERE) + '/'],
                       input=html, text=True, check=True)


def main():
    argv = sys.argv[1:]
    if '-h' in argv or '--help' in argv:
        sys.exit(__doc__)

    out = None
    if '-o' in argv:
        i = argv.index('-o')
        out = pathlib.Path(argv[i + 1]).resolve()
        argv = argv[:i] + argv[i + 2:]

    if out is None:
        # Name it after what was asked for, so three section PDFs in a
        # downloads folder are still tellable apart.
        stem = 'Sunlogic-Pitch'
        if '--one-pager' in argv:
            stem += '-one-pager'
        if '--only' in argv:
            stem += '-' + argv[argv.index('--only') + 1].replace(',', '-')
        out = HERE / (stem + '.pdf')

    to_pdf(render(argv), out)
    print(out)


if __name__ == '__main__':
    main()
