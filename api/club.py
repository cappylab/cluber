from http.server import BaseHTTPRequestHandler
import os, sys
_p = os.path.dirname(os.path.abspath(__file__))
while not os.path.isdir(os.path.join(_p, "_lib")) and _p != os.path.dirname(_p):
    _p = os.path.dirname(_p)
sys.path.insert(0, _p)

from _lib.db import get_conn
from _lib.repository import ClubRepository
from _lib.api import send_json, read_json, current_user


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        if not current_user(self):
            return send_json(self, 401, {"error": "unauthorized"})
        conn = get_conn(); club = ClubRepository(conn).get(); conn.close()
        if not club:
            return send_json(self, 200, {"exists": False})
        send_json(self, 200, {"exists": True, "name": club.name, "goal": club.goal})

    def do_POST(self):
        if not current_user(self):
            return send_json(self, 401, {"error": "unauthorized"})
        d = read_json(self)
        name = (d.get("name") or "").strip()
        try:
            goal = int(d.get("goal"))
        except (TypeError, ValueError):
            goal = -1
        if not name or goal < 0:
            return send_json(self, 400, {"error": "이름과 0 이상 목표가 필요합니다."})
        conn = get_conn(); ClubRepository(conn).save(name, goal); conn.close()
        send_json(self, 200, {"ok": True})
