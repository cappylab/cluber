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


def _name(path):  # /api/members/<name>/pay
    return unquote(urlparse(path).path).rstrip("/").split("/")[-2]


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        if not current_user(self):
            return send_json(self, 401, {"error": "unauthorized"})
        name = _name(self.path)
        try:
            amount = int(read_json(self).get("amount", 0))
        except (TypeError, ValueError):
            return send_json(self, 400, {"error": "금액은 숫자여야 합니다."})
        conn = get_conn(); repo = MemberRepository(conn); club = load_manager(conn)
        try:
            m = club.pay_fee(name, amount)
        except KeyError:
            conn.close(); return send_json(self, 404, {"error": f"'{name}' 회원을 찾을 수 없습니다."})
        except ValueError as e:
            conn.close(); return send_json(self, 400, {"error": str(e)})
        repo.upsert(m); conn.close()
        send_json(self, 200, {"member": member_dict(m)})
