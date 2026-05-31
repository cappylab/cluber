from http.server import BaseHTTPRequestHandler
import os, sys
_p = os.path.dirname(os.path.abspath(__file__))
while not os.path.isdir(os.path.join(_p, "_lib")) and _p != os.path.dirname(_p):
    _p = os.path.dirname(_p)
sys.path.insert(0, _p)

from urllib.parse import urlparse, parse_qs
from _lib.db import get_conn
from _lib.repository import MemberRepository
from _lib.api import send_json, read_json, current_user, member_dict, load_manager
from _domain.member import Member, Officer


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        if not current_user(self):
            return send_json(self, 401, {"error": "unauthorized"})
        q = parse_qs(urlparse(self.path).query).get("q", [""])[0]
        conn = get_conn(); club = load_manager(conn); conn.close()
        send_json(self, 200, {"members": [member_dict(m) for m in club.search(q)]})

    def do_POST(self):
        if not current_user(self):
            return send_json(self, 401, {"error": "unauthorized"})
        d = read_json(self)
        name, phone = (d.get("name") or "").strip(), (d.get("phone") or "").strip()
        if not name or not phone:
            return send_json(self, 400, {"error": "이름과 연락처는 필수입니다."})
        conn = get_conn(); repo = MemberRepository(conn); club = load_manager(conn)
        if d.get("type") == "officer":
            m = Officer(name, phone, d.get("student_id", ""), None, d.get("position") or "총무")
        else:
            m = Member(name, phone, d.get("student_id", ""))
        try:
            club.add_member(m)
        except (ValueError, TypeError) as e:
            conn.close(); return send_json(self, 400, {"error": str(e)})
        repo.upsert(m); conn.close()
        send_json(self, 201, {"member": member_dict(m)})
