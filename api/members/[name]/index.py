from http.server import BaseHTTPRequestHandler
import os, sys
_p = os.path.dirname(os.path.abspath(__file__))
while not os.path.isdir(os.path.join(_p, "_lib")) and _p != os.path.dirname(_p):
    _p = os.path.dirname(_p)
sys.path.insert(0, _p)

from urllib.parse import urlparse, unquote
from _lib.db import get_conn
from _lib.repository import MemberRepository
from _lib.api import send_json, read_json, current_user, member_dict, load_manager


def _name(path):  # /api/members/<name>
    return unquote(urlparse(path).path).rstrip("/").split("/")[-1]


class handler(BaseHTTPRequestHandler):
    def do_PATCH(self):
        if not current_user(self):
            return send_json(self, 401, {"error": "unauthorized"})
        name, d = _name(self.path), read_json(self)
        conn = get_conn(); repo = MemberRepository(conn); club = load_manager(conn)
        m = club.find_member(name)
        if m is None:
            conn.close(); return send_json(self, 404, {"error": f"'{name}' 회원을 찾을 수 없습니다."})
        if "phone" in d:
            m.update_phone((d["phone"] or "").strip())
        if "position" in d and hasattr(m, "position"):
            m.position = d["position"]
        repo.upsert(m); conn.close()
        send_json(self, 200, {"member": member_dict(m)})

    def do_DELETE(self):
        if not current_user(self):
            return send_json(self, 401, {"error": "unauthorized"})
        name = _name(self.path)
        conn = get_conn(); repo = MemberRepository(conn); club = load_manager(conn)
        try:
            club.remove_member(name)
        except KeyError:
            conn.close(); return send_json(self, 404, {"error": f"'{name}' 회원을 찾을 수 없습니다."})
        repo.delete(name); conn.close()
        send_json(self, 200, {"ok": True})
