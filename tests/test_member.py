from datetime import date
from _domain.member import Member

def test_init_defaults():
    m = Member("홍길동", "010-1", "20266126")
    assert m.fee == 0 and m.paid is False
    assert m.joined_date == date.today()

def test_pay_fee_accumulates_and_returns_self():
    m = Member("홍길동", "010-1")
    r = m.pay_fee(10000)
    assert m.fee == 10000 and m.paid is True
    assert r is m  # contract: mutating method returns affected Member

def test_pay_fee_rejects_negative():
    m = Member("A", "1")
    try:
        m.pay_fee(-1)
        assert False
    except ValueError:
        pass

def test_str_contains_name_and_status():
    m = Member("홍길동", "010-1"); m.pay_fee(5000)
    assert "홍길동" in str(m) and "납부" in str(m)

def test_comparison_by_fee():
    a = Member("A", "1"); a.pay_fee(5000)
    b = Member("B", "2"); b.pay_fee(8000)
    assert b > a and a < b and not (a == b)
