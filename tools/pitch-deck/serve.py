#!/usr/bin/env python3
"""Serve the deck, and turn the Download button into a real PDF.

    python3 serve.py            then open http://localhost:8723/deck.html
    python3 serve.py 9000       on another port

Two jobs, both small:

  GET  anything   the files in this folder, so the deck runs over http
                  rather than file:// and can post to the next route
  POST /pdf       {model, opts, name} -> render.mjs -> WeasyPrint -> the
                  PDF, as a download

Why this exists at all: WeasyPrint cannot run in a browser. The LearnIQ
planner spent a long time proving that WeasyPrint under Pyodide dies on
its C extensions, and no amount of self-hosting or CSP fixes it. So the
button talks to this instead. With it not running, the deck falls back to
the browser's print dialog on its own, so a deck that has been emailed or
hosted still downloads something.

Local only. It binds 127.0.0.1, renders nothing it did not receive, and
is a desk tool, not a service.
"""
import http.server, json, os, pathlib, socketserver, subprocess, sys, tempfile

HERE = pathlib.Path(__file__).resolve().parent
MAX_BODY = 4 * 1024 * 1024          # a deck model is tens of kilobytes


def build_pdf(payload):
    """A model and a selection in, PDF bytes out. Raises on either step so
    the handler can report which one failed rather than a bare 500."""
    with tempfile.TemporaryDirectory() as tmp:
        tmp = pathlib.Path(tmp)
        (tmp / 'model.json').write_text(json.dumps(payload.get('model') or {}), encoding='utf-8')
        (tmp / 'opts.json').write_text(json.dumps(payload.get('opts') or {}), encoding='utf-8')

        r = subprocess.run(
            ['node', str(HERE / 'render.mjs'), str(tmp / 'model.json'), '--opts', str(tmp / 'opts.json')],
            capture_output=True, text=True, timeout=60)
        if r.returncode:
            raise RuntimeError('render.mjs: ' + (r.stderr or 'failed').strip()[:400])
        if r.stderr.strip():
            sys.stderr.write(r.stderr)

        out = tmp / 'deck.pdf'
        try:
            from weasyprint import HTML
            HTML(string=r.stdout, base_url=str(HERE)).write_pdf(out)
        except ImportError:
            import shutil
            exe = shutil.which('weasyprint')
            if not exe:
                raise RuntimeError('WeasyPrint is not installed. pip install weasyprint')
            subprocess.run([exe, '-', str(out), '-u', str(HERE) + '/'],
                           input=r.stdout, text=True, check=True, timeout=120)
        return out.read_bytes()


class Handler(http.server.SimpleHTTPRequestHandler):

    def __init__(self, *a, **kw):
        super().__init__(*a, directory=str(HERE), **kw)

    def end_headers(self):
        # The deck fetches nothing off-origin, so nothing here needs to be open.
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

    def do_POST(self):
        if self.path.rstrip('/') != '/pdf':
            return self.send_error(404)
        try:
            n = int(self.headers.get('Content-Length') or 0)
            if n <= 0 or n > MAX_BODY:
                return self.fail(413, 'body is %d bytes' % n)
            payload = json.loads(self.rfile.read(n))
        except Exception as e:
            return self.fail(400, str(e))

        try:
            pdf = build_pdf(payload)
        except subprocess.TimeoutExpired:
            return self.fail(504, 'rendering took too long')
        except Exception as e:
            return self.fail(500, str(e))

        name = str(payload.get('name') or 'Sunlogic-Pitch')
        name = ''.join(c for c in name if c.isalnum() or c in '-_') or 'Sunlogic-Pitch'
        self.send_response(200)
        self.send_header('Content-Type', 'application/pdf')
        self.send_header('Content-Length', str(len(pdf)))
        self.send_header('Content-Disposition', 'attachment; filename="%s.pdf"' % name)
        self.end_headers()
        self.wfile.write(pdf)

    def fail(self, code, detail):
        """Say what went wrong in the body. The button shows it, which beats
        a silent fall back to the print dialog for a fixable mistake."""
        body = json.dumps({'error': detail}).encode()
        self.send_response(code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, fmt, *args):
        sys.stderr.write('%s  %s\n' % (self.log_date_time_string(), fmt % args))


class Server(socketserver.ThreadingTCPServer):
    allow_reuse_address = True
    daemon_threads = True


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8723
    os.chdir(HERE)
    with Server(('127.0.0.1', port), Handler) as httpd:
        print('deck:  http://localhost:%d/deck.html' % port)
        print('pdf:   POST http://localhost:%d/pdf' % port)
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print('\nstopped')


if __name__ == '__main__':
    main()
