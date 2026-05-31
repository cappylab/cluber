from _domain.member import Member, Officer
from _domain.club_manager import ClubManager

def make():
    c = ClubManager("테스트")
    c.add_member(Member("홍길동", "010-1", "1"))
    c.add_member(Officer("김총무", "010-2", position="총무"))
    return c

def test_add_rejects_non_member_and_dup():
    c = ClubManager("c")
    try: c.add_member("x"); assert False
    except TypeError: pass
    c.add_member(Member("중복", "1"))
    try: c.add_member(Member("중복", "2")); assert False
    except ValueError: pass

def test_search_by_name_and_phone():
    c = make()
    assert len(c.search("홍")) == 1
    assert len(c.search("010")) == 2
    assert len(c.search("")) == 2

def test_pay_and_update_return_member():
    c = make()
    assert c.pay_fee("홍길동", 10000).fee == 10000
    assert c.update_phone("홍길동", "010-9").phone == "010-9"

def test_missing_raises_keyerror():
    c = make()
    try: c.pay_fee("없음", 1); assert False
    except KeyError: pass

def test_stats_and_count_by_role():
    c = make()
    c.pay_fee("홍길동", 10000); c.pay_fee("김총무", 30000)
    assert c.total_fee() == 40000
    assert c.average_fee() == 20000
    assert c.count_by_role() == {"일반회원": 1, "운영진": 1}

def test_ranking_desc_by_fee():
    c = make()
    c.pay_fee("홍길동", 10000); c.pay_fee("김총무", 30000)
    assert [m.name for m in c.ranking()] == ["김총무", "홍길동"]

def test_remove():
    c = make(); c.remove_member("홍길동")
    assert c.find_member("홍길동") is None
