from http.server import BaseHTTPRequestHandler
import os, sys, traceback
_p = os.path.dirname(os.path.abspath(__file__))
while not os.path.isdir(os.path.join(_p, "_lib")) and _p != os.path.dirname(_p):
    _p = os.path.dirname(_p)
sys.path.insert(0, _p)

from psycopg.rows import dict_row
from _lib.db import get_conn
from _lib.auth import verify_password, issue_token, set_cookie_header
from _lib.api import send_json, read_json


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            d = read_json(self)
            u, pw = d.get("username", ""), d.get("password", "")
            conn = get_conn()
            with conn.cursor(row_factory=dict_row) as cur:
                cur.execute("SELECT password_hash FROM admin WHERE username=%s", (u,))
                row = cur.fetchone()
            conn.close()
            if not row or not verify_password(pw, row["password_hash"]):
                return send_json(self, 401, {"error": "아이디 또는 비밀번호가 올바르지 않습니다."})
            send_json(self, 200, {"ok": True}, [("Set-Cookie", set_cookie_header(issue_token(u)))])
        except Exception as e:
            send_json(self, 500, {"debug_error": repr(e)[:300], "has_jwt": bool(os.environ.get("JWT_SECRET"))})
