from http.server import BaseHTTPRequestHandler
import json, os, sys
_p = os.path.dirname(os.path.abspath(__file__))
while not os.path.isdir(os.path.join(_p, "_domain")) and _p != os.path.dirname(_p):
    _p = os.path.dirname(_p)
sys.path.insert(0, _p)

from _domain.member import Member, Officer
from _domain.club_manager import ClubManager
from _domain.club import Club


def build(d):
    if d.get("type") == "officer":
        m = Officer(d.get("name", ""), d.get("phone", ""), d.get("student_id", ""),
                    d.get("joined_date"), d.get("position") or "총무")
    else:
        m = Member(d.get("name", ""), d.get("phone", ""), d.get("student_id", ""), d.get("joined_date"))
    m.fee = d.get("fee") or 0
    m.paid = bool(d.get("paid"))
    return m


def member_dict(m):
    return {"name": m.name, "phone": m.phone, "student_id": m.student_id,
            "fee": m.fee, "paid": m.paid, "joined_date": m.joined_date,
            "role": m.role(), "position": getattr(m, "position", None)}


def compute(body):
    members = [build(d) for d in body.get("members", [])]
    mgr = ClubManager(body.get("name") or "우리 동아리", {m.name: m for m in members})
    total = mgr.total_fee()
    club = Club(mgr.club_name, int(body.get("goal") or 0))
    return {
        "stats": {
            "count": len(mgr.members),
            "total_fee": total,
            "average_fee": round(mgr.average_fee()),
            "unpaid": sum(1 for m in mgr.members.values() if not m.paid),
            "roles": mgr.count_by_role(),
        },
        "ranking": [member_dict(m) for m in mgr.ranking()],
        "club": {"name": club.name, "goal": club.goal,
                 "progress": club.progress(total), "remaining": club.remaining(total)},
    }


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        n = int(self.headers.get("Content-Length") or 0)
        body = json.loads(self.rfile.read(n) or b"{}") if n else {}
        payload = json.dumps(compute(body), ensure_ascii=False, default=str).encode()
        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.end_headers()
        self.wfile.write(payload)
