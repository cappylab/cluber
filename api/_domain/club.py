class Club:
    """동아리 — 이름 + 목표 회비 (pure domain, no web/DB)."""

    def __init__(self, name, goal):
        self.name = name
        self.goal = goal

    def progress(self, total_fee):
        """목표 대비 달성률(%) 0~100."""
        if self.goal <= 0:
            return 0
        return min(100, round(total_fee / self.goal * 100))

    def remaining(self, total_fee):
        """남은 금액 (음수 방지)."""
        return max(0, self.goal - total_fee)

    def __str__(self):
        return f"{self.name} (목표 {self.goal:,}원)"
