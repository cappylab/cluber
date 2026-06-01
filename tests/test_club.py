from _domain.club import Club

def test_init():
    c = Club("코딩 동아리", 4_500_000)
    assert c.name == "코딩 동아리" and c.goal == 4_500_000

def test_progress_ratio():
    assert Club("C", 1_000_000).progress(250_000) == 25

def test_progress_caps_at_100():
    assert Club("C", 1_000_000).progress(2_000_000) == 100

def test_progress_zero_goal_is_safe():
    assert Club("C", 0).progress(100) == 0

def test_remaining():
    c = Club("C", 1_000_000)
    assert c.remaining(300_000) == 700_000
    assert c.remaining(2_000_000) == 0  # 음수 방지

def test_str_has_name_and_goal():
    s = str(Club("코딩 동아리", 4_500_000))
    assert "코딩 동아리" in s and "4,500,000" in s
