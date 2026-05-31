import json
from _lib.db import get_conn
from _lib.repository import MemberRepository
from _domain.club_manager import ClubManager
from _lib.auth import parse_cookie, verify_token

CLUB_NAME = "우리 동아리"  # Phase 1: single club


def send_json(h, status, body, extra_headers=None):
    payload = json.dumps(body, ensure_ascii=False, default=str).encode()
    h.send_response(status)
    h.send_header("Content-Type", "application/json; charset=utf-8")
    for k, v in (extra_headers or []):
        h.send_header(k, v)
    h.end_headers()
    h.wfile.write(payload)


def read_json(h):
    n = int(h.headers.get("Content-Length") or 0)
    return json.loads(h.rfile.read(n) or b"{}") if n else {}


def current_user(h):
    return verify_token(parse_cookie(h.headers.get("Cookie")) or "")


def member_dict(m):
    return {"name": m.name, "phone": m.phone, "student_id": m.student_id,
            "fee": m.fee, "paid": m.paid, "joined_date": m.joined_date,
            "role": m.role(), "position": getattr(m, "position", None)}


def load_manager(conn):
    return ClubManager(CLUB_NAME, MemberRepository(conn).load_all())
