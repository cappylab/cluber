from datetime import date


class Member:
    """회원 — pure domain (no web/DB)."""

    def __init__(self, name, phone, student_id="", joined_date=None):
        self.name = name
        self.phone = phone
        self.student_id = student_id
        self.fee = 0
        self.paid = False
        self.joined_date = joined_date or date.today()

    def pay_fee(self, amount):
        if amount < 0:
            raise ValueError("회비는 0원 이상이어야 합니다.")
        self.fee += amount
        self.paid = True
        return self  # affected Member → API upserts it

    def update_phone(self, phone):
        self.phone = phone
        return self

    def role(self):
        return "일반회원"

    def __str__(self):
        status = "납부" if self.paid else "미납"
        return f"[{self.role()}] {self.name} | {self.phone} | {self.fee:,}원 | {status}"

    # 회비 기준 비교 (== so sánh fee, KHÔNG phải identity; Member chỉ là dict value)
    def __eq__(self, other):
        return isinstance(other, Member) and self.fee == other.fee

    def __lt__(self, other):
        return self.fee < other.fee

    def __gt__(self, other):
        return self.fee > other.fee
