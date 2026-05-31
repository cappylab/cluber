from _domain.member import Member, Officer

def test_officer_is_member():
    assert isinstance(Officer("김총무", "010-2", position="회장"), Member)

def test_officer_role_override():
    assert Officer("김", "1").role() == "운영진"

def test_officer_str_includes_position():
    o = Officer("김", "1", position="총무")
    assert "총무" in str(o) and "운영진" in str(o)

def test_officer_inherits_pay_fee():
    o = Officer("김", "1"); o.pay_fee(3000)
    assert o.fee == 3000 and o.paid is True
