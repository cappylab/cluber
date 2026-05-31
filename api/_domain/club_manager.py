from _domain.member import Member, Officer


class ClubManager:
    """동호회 관리자 — quản lý nhiều Member trong dict {이름: Member}."""

    def __init__(self, club_name, members=None):
        self.club_name = club_name
        self.members = members or {}

    def add_member(self, member):
        if not isinstance(member, Member):
            raise TypeError("Member 객체만 추가할 수 있습니다.")
        if member.name in self.members:
            raise ValueError(f"'{member.name}'은(는) 이미 등록된 회원입니다.")
        self.members[member.name] = member
        return member

    def find_member(self, name):
        return self.members.get(name)

    def search(self, keyword):
        kw = keyword.strip().lower()
        if not kw:
            return list(self.members.values())
        return [m for m in self.members.values()
                if kw in m.name.lower() or kw in m.phone.lower()]

    def update_phone(self, name, phone):
        m = self.find_member(name)
        if m is None:
            raise KeyError(f"'{name}' 회원을 찾을 수 없습니다.")
        return m.update_phone(phone)

    def remove_member(self, name):
        if name not in self.members:
            raise KeyError(f"'{name}' 회원을 찾을 수 없습니다.")
        del self.members[name]

    def pay_fee(self, name, amount):
        m = self.find_member(name)
        if m is None:
            raise KeyError(f"'{name}' 회원을 찾을 수 없습니다.")
        return m.pay_fee(amount)

    def total_fee(self):
        return sum(m.fee for m in self.members.values())

    def average_fee(self):
        return self.total_fee() / len(self.members) if self.members else 0

    def count_by_role(self):
        officer = sum(1 for m in self.members.values() if isinstance(m, Officer))
        return {"일반회원": len(self.members) - officer, "운영진": officer}

    def ranking(self):
        return sorted(self.members.values(), reverse=True)
