from datetime import date
from _domain.member import Member, Officer
from _lib.repository import row_to_member

def test_row_to_member_general():
    row = {"name":"홍","phone":"010-1","student_id":"1","fee":5000,"paid":True,
           "joined_date":date(2024,3,1),"type":"member","position":None}
    m = row_to_member(row)
    assert isinstance(m, Member) and not isinstance(m, Officer)
    assert m.fee == 5000 and m.paid is True

def test_row_to_member_officer():
    row = {"name":"김","phone":"010-2","student_id":"","fee":0,"paid":False,
           "joined_date":date(2024,5,1),"type":"officer","position":"회장"}
    m = row_to_member(row)
    assert isinstance(m, Officer) and m.position == "회장" and m.role() == "운영진"
