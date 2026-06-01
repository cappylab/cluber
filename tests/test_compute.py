from compute import compute


def _m(name, fee=0, paid=False, type="member", position=""):
    return {"name": name, "phone": "010", "student_id": "", "type": type,
            "position": position, "fee": fee, "paid": paid, "joined_date": "2026-06-01"}


def test_empty():
    r = compute({"members": [], "goal": 1000})
    assert r["stats"]["count"] == 0
    assert r["stats"]["total_fee"] == 0
    assert r["ranking"] == []
    assert r["club"]["progress"] == 0


def test_stats_and_roles():
    r = compute({"members": [_m("A", 5000, True, "officer", "회장"), _m("B", 3000, True), _m("C", 0, False)], "goal": 10000})
    s = r["stats"]
    assert s["count"] == 3
    assert s["total_fee"] == 8000
    assert s["average_fee"] == round(8000 / 3)
    assert s["unpaid"] == 1
    assert s["roles"] == {"일반회원": 2, "운영진": 1}


def test_ranking_desc():
    r = compute({"members": [_m("A", 1000), _m("B", 9000), _m("C", 5000)], "goal": 1})
    assert [m["name"] for m in r["ranking"]] == ["B", "C", "A"]


def test_club_progress_and_remaining():
    r = compute({"members": [_m("A", 2500, True)], "goal": 10000})
    assert r["club"]["progress"] == 25
    assert r["club"]["remaining"] == 7500
