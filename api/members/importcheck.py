from http.server import BaseHTTPRequestHandler
import os, sys

_p = os.path.dirname(os.path.abspath(__file__))
while not os.path.isdir(os.path.join(_p, "_lib")) and _p != os.path.dirname(_p):
    _p = os.path.dirname(_p)
sys.path.insert(0, _p)

from _lib.hello import msg


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.end_headers()
        self.wfile.write(msg().encode())
