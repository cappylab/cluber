from http.server import BaseHTTPRequestHandler
import os, sys
_p = os.path.dirname(os.path.abspath(__file__))
while not os.path.isdir(os.path.join(_p, "_lib")) and _p != os.path.dirname(_p):
    _p = os.path.dirname(_p)
sys.path.insert(0, _p)

from _lib.db import get_conn
from _lib.api import send_json, current_user, load_manager


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        if not current_user(self):
            return send_json(self, 401, {"error": "unauthorized"})
        conn = get_conn(); club = load_manager(conn); conn.close()
        send_json(self, 200, {
            "count": len(club.members),
            "total_fee": club.total_fee(),
            "average_fee": round(club.average_fee()),
            "unpaid": sum(1 for m in club.members.values() if not m.paid),
            "roles": club.count_by_role(),
        })
