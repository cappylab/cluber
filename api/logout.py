from http.server import BaseHTTPRequestHandler
import os, sys
_p = os.path.dirname(os.path.abspath(__file__))
while not os.path.isdir(os.path.join(_p, "_lib")) and _p != os.path.dirname(_p):
    _p = os.path.dirname(_p)
sys.path.insert(0, _p)

from _lib.auth import clear_cookie_header
from _lib.api import send_json


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        send_json(self, 200, {"ok": True}, [("Set-Cookie", clear_cookie_header())])
