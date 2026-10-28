# Static server for the planner that tells the browser not to cache, so edits show on reload.
import functools
import http.server
import pathlib
import sys


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()


port = int(sys.argv[1]) if len(sys.argv) > 1 else 8765
public = pathlib.Path(__file__).parent / 'public'
handler = functools.partial(NoCacheHandler, directory=str(public))
http.server.ThreadingHTTPServer(('', port), handler).serve_forever()
