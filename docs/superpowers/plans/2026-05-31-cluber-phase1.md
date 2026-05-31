# Cluber Phase 1 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a deployable Cluber MVP — admin-auth club member & fee manager — where all business logic lives in Python classes (`Member`/`Officer`/`ClubManager`) behind serverless APIs, fronted by a Next.js + Tailwind UI.

**Architecture:** 4 layers (per spec): Next.js (Vercel) UI → Python serverless `/api/*.py` (thin) → Python domain classes (pure) → Repository → Postgres (Neon). Each request: verify JWT cookie → `repo.load_all()` → build `ClubManager` → call method → mutating method returns the affected `Member` → `repo.upsert(member)` / `repo.delete(name)` → JSON.

**Tech Stack:** Next.js (App Router) + Tailwind v4 + TypeScript · Python 3.12 serverless (Vercel `@vercel/python`) · `psycopg` (Postgres driver), `bcrypt` (direct; passlib dropped — bcrypt 4.x incompat), `PyJWT` · Neon Postgres · deploy Vercel.

**Conventions (from spec §7 contracts):** domain is pure (no DB import); mutating methods return the affected `Member`; mutation key is `{name}` (URL-encoded); admin seeded by local script; schema applied manually once.

---

## File Structure

```
cluber/
├── app/                       # Next.js App Router (frontend)
│   ├── globals.css            # Tailwind v4 + Soft-Clay tokens (port DESIGN.md)
│   ├── layout.tsx             # fonts (Nunito/DM Sans/Pretendard), shell
│   ├── login/page.tsx         # 로그인
│   ├── page.tsx               # 대시보드 (stats + member list)
│   └── ranking/page.tsx       # 회비 랭킹
├── api/                       # Python serverless functions (backend)
│   ├── _domain/               # PURE python domain (no web/DB)
│   │   ├── member.py          # Member, Officer
│   │   └── club_manager.py    # ClubManager
│   ├── _lib/                  # infra helpers
│   │   ├── db.py              # psycopg connection (Neon)
│   │   ├── repository.py      # MemberRepository (object ⇄ SQL)
│   │   └── auth.py            # bcrypt verify + JWT issue/verify (cookie)
│   ├── ping.py                # health check (Task 1)
│   ├── login.py  logout.py
│   ├── members/index.py       # GET list+search, POST add
│   ├── members/[name].py      # PATCH, DELETE
│   ├── members/[name]/pay.py  # POST pay
│   ├── stats.py  ranking.py
├── scripts/
│   ├── schema.sql             # tables (run once on Neon)
│   └── seed_admin.py          # local one-shot admin seed (bcrypt)
├── tests/                     # pytest for domain + repo
│   ├── test_member.py  test_officer.py  test_club_manager.py
├── requirements.txt           # python deps
├── vercel.json                # route config (Next + python)
└── .env.local / Vercel env    # DATABASE_URL, JWT_SECRET, ADMIN_*
```

Tests target the **pure domain** (zero infra) — that is the graded core and must pass standalone.

---

## Task 1: Deploy skeleton (catch Next↔Python route risk first)

**Goal:** Next.js app + one Python `/api/ping.py` + Neon reachable, deployed to Vercel — prove the hybrid routing works before building features.

**Files:**
- Create: `package.json`, `app/*` (via scaffold), `api/ping.py`, `requirements.txt`, `vercel.json`, `.gitignore`

- [ ] **Step 1: Scaffold Next.js via temp subdir (avoids create-next-app abort)**

`create-next-app .` **aborts** (no prompt) when non-allowlisted files exist (`DESIGN.md`, `AGENTS.md`). Scaffold into a temp subdir, then merge up:
```powershell
cd "C:\Users\jeong\project\수업\2026-1\프로그래밍입문-2040\cluber"
npx create-next-app@latest .scaffold --ts --tailwind --app --eslint --no-src-dir --import-alias "@/*" --yes
Get-ChildItem -Force .scaffold -Exclude .git | Move-Item -Destination .
Remove-Item -Recurse -Force .scaffold
```
Expected: `app/`, `package.json`, `next.config.*`, Tailwind v4, Next's `.gitignore` merged into repo root; cluber's `.git` and `docs/` untouched.

- [ ] **Step 2: Add Python health-check function**

Create `api/ping.py`:
```python
from http.server import BaseHTTPRequestHandler
import json, os

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        body = {"ok": True, "service": "cluber-api", "has_db_url": bool(os.environ.get("DATABASE_URL"))}
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps(body).encode())
```

- [ ] **Step 3: Declare Python deps + Vercel config**

Create `requirements.txt`:
```
psycopg[binary]==3.2.3
bcrypt==4.2.1
PyJWT==2.9.0
```
Create `vercel.json`:
```json
{ "functions": { "api/**/*.py": { "runtime": "@vercel/python@4.3.0" } } }
```

- [ ] **Step 4: Verify Next route + Python route locally do not collide**

Run: `npm run dev` then in another shell `curl http://localhost:3000/api/ping`
Expected: Next dev serves `/` (page) AND `/api/ping` returns the JSON above. (If Next tries to own `/api`, note it: Python `/api/*.py` is resolved by Vercel, not `next dev` — use `vercel dev` instead.)

Run: `npx vercel dev` then `curl http://localhost:3000/api/ping`
Expected: `{"ok": true, ...}` — confirms `@vercel/python` runs the function.

- [ ] **Step 5: Create Neon DB + set env, deploy to Vercel**

```bash
# create a free Neon project in console, copy the pooled connection string
npx vercel link
npx vercel env add DATABASE_URL    # paste Neon URL (production+preview+dev)
npx vercel env add JWT_SECRET       # random 32+ char
npx vercel deploy
```
Expected: deployment URL; visit `/` (Next page renders) and `/api/ping` → `{"ok":true,"has_db_url":true}`. **This proves the hybrid works.**

- [ ] **Step 6: Prove shared-module imports on Vercel (spike — BLOCKS Tasks 5–8)**

`conftest.py` only fixes imports for local pytest; deployed functions don't have it, and nested functions can't `from _lib...`. **Canonical fix (do NOT improvise):** every file in `api/` except `_lib`/`_domain` begins with this depth-independent bootstrap:

```python
import os, sys
_p = os.path.dirname(os.path.abspath(__file__))
while not os.path.isdir(os.path.join(_p, "_lib")) and _p != os.path.dirname(_p):
    _p = os.path.dirname(_p)
sys.path.insert(0, _p)
```

Spike it now (nested route mirrors real depth): create `api/_lib/hello.py` → `def msg(): return "import-ok"`; create `api/members/importcheck.py`:
```python
from http.server import BaseHTTPRequestHandler
import os, sys
_p = os.path.dirname(os.path.abspath(__file__))
while not os.path.isdir(os.path.join(_p, "_lib")) and _p != os.path.dirname(_p):
    _p = os.path.dirname(_p)
sys.path.insert(0, _p)
from _lib.hello import msg

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200); self.end_headers(); self.wfile.write(msg().encode())
```
Run: `npx vercel deploy` then `curl .../api/members/importcheck`
Expected: `import-ok`. If it fails, fix the bootstrap HERE before any Task 5–8 code. Then delete `importcheck.py` (keep `_lib/hello.py` or remove). **All Task 7–8 functions start with this bootstrap.**

- [ ] **Step 7: .gitignore secrets + commit**

Verify `.gitignore` includes `.env*.local` and `.vercel` (create-next-app adds them — confirm before `git add -A` to avoid committing `DATABASE_URL`/`JWT_SECRET`).
```bash
git add -A
git commit -m "chore: deploy skeleton (Next + /api/ping + Neon) + verified shared imports"
```

---


## Task 2: Domain — `Member` (TDD)

**Files:**
- Create: `api/_domain/member.py`, `tests/conftest.py`, `tests/test_member.py`

- [ ] **Step 1: Test path bootstrap**

Create `tests/conftest.py`:
```python
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "api"))
```

- [ ] **Step 2: Write failing tests**

Create `tests/test_member.py`:
```python
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
```

- [ ] **Step 3: Run tests, verify they fail**

Run: `python -m pytest tests/test_member.py -v`
Expected: FAIL — `ModuleNotFoundError: _domain.member`.

- [ ] **Step 4: Implement `Member`**

Create `api/_domain/member.py`:
```python
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
```

- [ ] **Step 5: Run tests, verify they pass**

Run: `python -m pytest tests/test_member.py -v`
Expected: 5 passed.

- [ ] **Step 6: Commit**

```bash
git add api/_domain/member.py tests/conftest.py tests/test_member.py
git commit -m "feat(domain): Member class with fee/pay_fee/__str__/comparisons (TDD)"
```

---

## Task 3: Domain — `Officer` inheritance (TDD)

**Files:**
- Modify: `api/_domain/member.py` (append `Officer`)
- Create: `tests/test_officer.py`

- [ ] **Step 1: Write failing tests**

Create `tests/test_officer.py`:
```python
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
```

- [ ] **Step 2: Run tests, verify they fail**

Run: `python -m pytest tests/test_officer.py -v`
Expected: FAIL — `ImportError: cannot import name 'Officer'`.

- [ ] **Step 3: Append `Officer` to `api/_domain/member.py`**

```python
class Officer(Member):
    """운영진 — 상속 + override (직책 추가)."""

    def __init__(self, name, phone, student_id="", joined_date=None, position="총무"):
        super().__init__(name, phone, student_id, joined_date)
        self.position = position

    def role(self):
        return "운영진"

    def __str__(self):
        return f"{super().__str__()} (직책: {self.position})"
```

- [ ] **Step 4: Run tests, verify they pass**

Run: `python -m pytest tests/ -v`
Expected: 9 passed (Member + Officer).

- [ ] **Step 5: Commit**

```bash
git add api/_domain/member.py tests/test_officer.py
git commit -m "feat(domain): Officer(Member) inheritance + override (TDD)"
```

---


## Task 4: Domain — `ClubManager` (TDD)

**Files:**
- Create: `api/_domain/club_manager.py`, `tests/test_club_manager.py`

- [ ] **Step 1: Write failing tests**

Create `tests/test_club_manager.py`:
```python
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
```

- [ ] **Step 2: Run tests, verify they fail**

Run: `python -m pytest tests/test_club_manager.py -v`
Expected: FAIL — `ModuleNotFoundError: _domain.club_manager`.

- [ ] **Step 3: Implement `ClubManager`**

Create `api/_domain/club_manager.py`:
```python
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
```

- [ ] **Step 4: Run all domain tests, verify pass**

Run: `python -m pytest tests/ -v`
Expected: 16 passed (Member 5 + Officer 4 + ClubManager 7).

- [ ] **Step 5: Commit**

```bash
git add api/_domain/club_manager.py tests/test_club_manager.py
git commit -m "feat(domain): ClubManager (CRUD/search/isinstance stats/ranking, TDD)"
```

---


## Task 5: Persistence — schema + `MemberRepository`

**Files:**
- Create: `scripts/schema.sql`, `api/_lib/db.py`, `api/_lib/repository.py`, `tests/test_repository.py`

- [ ] **Step 1: Schema (run once on Neon)**

Create `scripts/schema.sql`:
```sql
CREATE TABLE IF NOT EXISTS members (
  id          SERIAL PRIMARY KEY,
  name        TEXT UNIQUE NOT NULL,
  phone       TEXT NOT NULL,
  student_id  TEXT NOT NULL DEFAULT '',
  fee         INTEGER NOT NULL DEFAULT 0,
  paid        BOOLEAN NOT NULL DEFAULT FALSE,
  joined_date DATE NOT NULL DEFAULT CURRENT_DATE,
  type        TEXT NOT NULL DEFAULT 'member',  -- 'member' | 'officer'
  position    TEXT
);
CREATE TABLE IF NOT EXISTS admin (
  username      TEXT PRIMARY KEY,
  password_hash TEXT NOT NULL
);
```

- [ ] **Step 2: Write failing test for the pure mapper**

Create `tests/test_repository.py`:
```python
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
```

- [ ] **Step 3: Run test, verify it fails**

Run: `python -m pytest tests/test_repository.py -v`
Expected: FAIL — `ModuleNotFoundError: _lib.repository`.

- [ ] **Step 4: Implement db + repository**

Create `api/_lib/db.py`:
```python
import os
import psycopg

def get_conn():
    return psycopg.connect(os.environ["DATABASE_URL"])
```

Create `api/_lib/repository.py`:
```python
from psycopg.rows import dict_row
from _domain.member import Member, Officer


def row_to_member(row):
    """row dict → Member/Officer (reconstruct subtype from `type`)."""
    if row["type"] == "officer":
        m = Officer(row["name"], row["phone"], row["student_id"],
                    row["joined_date"], row["position"] or "총무")
    else:
        m = Member(row["name"], row["phone"], row["student_id"], row["joined_date"])
    m.fee = row["fee"]
    m.paid = row["paid"]
    return m


class MemberRepository:
    def __init__(self, conn):
        self.conn = conn

    def load_all(self):
        with self.conn.cursor(row_factory=dict_row) as cur:
            cur.execute("SELECT * FROM members ORDER BY id")
            return {r["name"]: row_to_member(r) for r in cur.fetchall()}

    def upsert(self, m):
        is_officer = isinstance(m, Officer)
        with self.conn.cursor() as cur:
            cur.execute(
                """INSERT INTO members
                     (name, phone, student_id, fee, paid, joined_date, type, position)
                   VALUES (%s,%s,%s,%s,%s,%s,%s,%s)
                   ON CONFLICT (name) DO UPDATE SET
                     phone=EXCLUDED.phone, student_id=EXCLUDED.student_id,
                     fee=EXCLUDED.fee, paid=EXCLUDED.paid,
                     type=EXCLUDED.type, position=EXCLUDED.position""",
                (m.name, m.phone, m.student_id, m.fee, m.paid, m.joined_date,
                 "officer" if is_officer else "member",
                 m.position if is_officer else None),
            )
        self.conn.commit()

    def delete(self, name):
        with self.conn.cursor() as cur:
            cur.execute("DELETE FROM members WHERE name=%s", (name,))
        self.conn.commit()
```

- [ ] **Step 5: Run test, verify pass**

Run: `python -m pytest tests/test_repository.py -v`
Expected: 2 passed.

- [ ] **Step 6: Apply schema to Neon (once) + smoke check**

Run: `psql "$DATABASE_URL" -f scripts/schema.sql`
Expected: `CREATE TABLE` ×2. (Verify: `psql "$DATABASE_URL" -c "\dt"` lists `members`, `admin`.)

- [ ] **Step 7: Commit**

```bash
git add scripts/schema.sql api/_lib/db.py api/_lib/repository.py tests/test_repository.py
git commit -m "feat(repo): schema + MemberRepository with type-reconstructing mapper (TDD)"
```

---


## Task 6: Auth helpers + admin seed

**Files:**
- Create: `api/_lib/auth.py`, `tests/test_auth.py`, `scripts/seed_admin.py`

- [ ] **Step 1: Write failing tests**

Create `tests/test_auth.py`:
```python
import os
os.environ.setdefault("JWT_SECRET", "test-secret")
from _lib.auth import (issue_token, verify_token, hash_password,
                       verify_password, parse_cookie)

def test_jwt_roundtrip():
    assert verify_token(issue_token("admin")) == "admin"

def test_jwt_bad_returns_none():
    assert verify_token("garbage.token") is None

def test_password_hash_verify():
    h = hash_password("pw123")
    assert verify_password("pw123", h) and not verify_password("nope", h)

def test_parse_cookie():
    assert parse_cookie("a=1; cluber_token=abc; b=2") == "abc"
    assert parse_cookie("") is None
```

- [ ] **Step 2: Run test, verify it fails**

Run: `python -m pytest tests/test_auth.py -v`
Expected: FAIL — `ModuleNotFoundError: _lib.auth`.

- [ ] **Step 3: Implement `api/_lib/auth.py`**

```python
import os, datetime
import jwt
import bcrypt

JWT_ALG = "HS256"
COOKIE = "cluber_token"

def hash_password(pw): return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()
def verify_password(pw, h): return bcrypt.checkpw(pw.encode(), h.encode())

def issue_token(username):
    exp = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=24)
    return jwt.encode({"sub": username, "exp": exp}, os.environ["JWT_SECRET"], algorithm=JWT_ALG)

def verify_token(token):
    try:
        return jwt.decode(token, os.environ["JWT_SECRET"], algorithms=[JWT_ALG])["sub"]
    except Exception:
        return None

def parse_cookie(cookie_header, key=COOKIE):
    if not cookie_header: return None
    for part in cookie_header.split(";"):
        k, _, v = part.strip().partition("=")
        if k == key: return v
    return None

def set_cookie_header(token, max_age=86400):
    return f"{COOKIE}={token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age={max_age}"

def clear_cookie_header():
    return f"{COOKIE}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0"
```

- [ ] **Step 4: Run test, verify pass**

Run: `python -m pytest tests/test_auth.py -v`
Expected: 4 passed.

- [ ] **Step 5: Implement local seed script**

Create `scripts/seed_admin.py`:
```python
"""One-shot local admin seed. Run: python scripts/seed_admin.py
Env: ADMIN_USERNAME, ADMIN_PASSWORD, DATABASE_URL."""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "api"))
from _lib.db import get_conn
from _lib.auth import hash_password

def main():
    u, pw = os.environ["ADMIN_USERNAME"], os.environ["ADMIN_PASSWORD"]
    conn = get_conn()
    with conn.cursor() as cur:
        cur.execute(
            "INSERT INTO admin (username, password_hash) VALUES (%s,%s) "
            "ON CONFLICT (username) DO UPDATE SET password_hash=EXCLUDED.password_hash",
            (u, hash_password(pw)))
    conn.commit(); conn.close()
    print(f"seeded admin '{u}'")

if __name__ == "__main__":
    main()
```

- [ ] **Step 6: Seed admin on Neon (once)**

Run: `ADMIN_USERNAME=admin ADMIN_PASSWORD='<strong-pw>' DATABASE_URL='<neon>' python scripts/seed_admin.py`
Expected: `seeded admin 'admin'`.

- [ ] **Step 7: Commit**

```bash
git add api/_lib/auth.py tests/test_auth.py scripts/seed_admin.py
git commit -m "feat(auth): bcrypt + JWT cookie helpers (TDD) + local admin seed script"
```

---


## Task 7: API — helpers + login/logout + members collection

> **MANDATORY:** every `api/*.py` function below begins with the import bootstrap from Task 1 Step 6 (prepend verbatim above `from http.server...`). Shown once there; omitted below for brevity but required.

**Files:**
- Create: `api/_lib/api.py`, `api/login.py`, `api/logout.py`, `api/members/index.py`

- [ ] **Step 1: Shared API helpers**

Create `api/_lib/api.py`:
```python
import json
from _lib.db import get_conn
from _lib.repository import MemberRepository
from _domain.club_manager import ClubManager
from _lib.auth import parse_cookie, verify_token

CLUB_NAME = "우리 동아리"  # Phase 1: single club

def send_json(h, status, body, extra_headers=None):
    payload = json.dumps(body, ensure_ascii=False, default=str).encode()
    h.send_response(status)
    h.send_header("Content-Type", "application/json; charset=utf-8")
    for k, v in (extra_headers or []):
        h.send_header(k, v)
    h.end_headers()
    h.wfile.write(payload)

def read_json(h):
    n = int(h.headers.get("Content-Length") or 0)
    return json.loads(h.rfile.read(n) or b"{}") if n else {}

def current_user(h):
    return verify_token(parse_cookie(h.headers.get("Cookie")) or "")

def member_dict(m):
    return {"name": m.name, "phone": m.phone, "student_id": m.student_id,
            "fee": m.fee, "paid": m.paid, "joined_date": m.joined_date,
            "role": m.role(), "position": getattr(m, "position", None)}

def load_manager(conn):
    return ClubManager(CLUB_NAME, MemberRepository(conn).load_all())
```

- [ ] **Step 2: Login**

Create `api/login.py`:
```python
from http.server import BaseHTTPRequestHandler
from psycopg.rows import dict_row
from _lib.db import get_conn
from _lib.auth import verify_password, issue_token, set_cookie_header
from _lib.api import send_json, read_json

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        d = read_json(self)
        u, pw = d.get("username", ""), d.get("password", "")
        conn = get_conn()
        with conn.cursor(row_factory=dict_row) as cur:
            cur.execute("SELECT password_hash FROM admin WHERE username=%s", (u,))
            row = cur.fetchone()
        conn.close()
        if not row or not verify_password(pw, row["password_hash"]):
            return send_json(self, 401, {"error": "아이디 또는 비밀번호가 올바르지 않습니다."})
        send_json(self, 200, {"ok": True},
                  [("Set-Cookie", set_cookie_header(issue_token(u)))])
```

- [ ] **Step 3: Logout**

Create `api/logout.py`:
```python
from http.server import BaseHTTPRequestHandler
from _lib.auth import clear_cookie_header
from _lib.api import send_json

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        send_json(self, 200, {"ok": True}, [("Set-Cookie", clear_cookie_header())])
```

- [ ] **Step 4: Members collection (GET list+search, POST add)**

Create `api/members/index.py`:
```python
from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
from _lib.db import get_conn
from _lib.repository import MemberRepository
from _lib.api import send_json, read_json, current_user, member_dict, load_manager
from _domain.member import Member, Officer

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        if not current_user(self):
            return send_json(self, 401, {"error": "unauthorized"})
        q = parse_qs(urlparse(self.path).query).get("q", [""])[0]
        conn = get_conn(); club = load_manager(conn); conn.close()
        send_json(self, 200, {"members": [member_dict(m) for m in club.search(q)]})

    def do_POST(self):
        if not current_user(self):
            return send_json(self, 401, {"error": "unauthorized"})
        d = read_json(self)
        name, phone = (d.get("name") or "").strip(), (d.get("phone") or "").strip()
        if not name or not phone:
            return send_json(self, 400, {"error": "이름과 연락처는 필수입니다."})
        conn = get_conn(); repo = MemberRepository(conn); club = load_manager(conn)
        if d.get("type") == "officer":
            m = Officer(name, phone, d.get("student_id", ""), None, d.get("position") or "총무")
        else:
            m = Member(name, phone, d.get("student_id", ""))
        try:
            club.add_member(m)            # may raise ValueError(dup)/TypeError
        except (ValueError, TypeError) as e:
            conn.close(); return send_json(self, 400, {"error": str(e)})
        repo.upsert(m); conn.close()       # contract: persist affected member
        send_json(self, 201, {"member": member_dict(m)})
```

- [ ] **Step 5: Commit**

```bash
git add api/_lib/api.py api/login.py api/logout.py api/members/index.py
git commit -m "feat(api): helpers + login/logout + members collection (list/search/add)"
```

---


## Task 8: API — member item + pay + stats + ranking

> **MANDATORY:** prepend the Task 1 Step 6 import bootstrap to every function below.
> **Structure fix:** use `api/members/[name]/index.py` for PATCH/DELETE (a file `[name].py` and folder `[name]/` at the same level confuse the builder). `_name()` = last path segment still resolves `<name>`.

**Files:**
- Create: `api/members/[name]/index.py`, `api/members/[name]/pay.py`, `api/stats.py`, `api/ranking.py`

- [ ] **Step 1: Member item (PATCH partial, DELETE)**

Create `api/members/[name]/index.py`:
```python
from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse, unquote
from _lib.db import get_conn
from _lib.repository import MemberRepository
from _lib.api import send_json, read_json, current_user, member_dict, load_manager

def _name(path):  # /api/members/<name>
    return unquote(urlparse(path).path).rstrip("/").split("/")[-1]

class handler(BaseHTTPRequestHandler):
    def do_PATCH(self):
        if not current_user(self): return send_json(self, 401, {"error": "unauthorized"})
        name, d = _name(self.path), read_json(self)
        conn = get_conn(); repo = MemberRepository(conn); club = load_manager(conn)
        m = club.find_member(name)
        if m is None:
            conn.close(); return send_json(self, 404, {"error": f"'{name}' 회원을 찾을 수 없습니다."})
        if "phone" in d: m.update_phone((d["phone"] or "").strip())
        if "position" in d and hasattr(m, "position"): m.position = d["position"]
        repo.upsert(m); conn.close()
        send_json(self, 200, {"member": member_dict(m)})

    def do_DELETE(self):
        if not current_user(self): return send_json(self, 401, {"error": "unauthorized"})
        name = _name(self.path)
        conn = get_conn(); repo = MemberRepository(conn); club = load_manager(conn)
        try:
            club.remove_member(name)
        except KeyError:
            conn.close(); return send_json(self, 404, {"error": f"'{name}' 회원을 찾을 수 없습니다."})
        repo.delete(name); conn.close()
        send_json(self, 200, {"ok": True})
```

- [ ] **Step 2: Pay fee**

Create `api/members/[name]/pay.py`:
```python
from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse, unquote
from _lib.db import get_conn
from _lib.repository import MemberRepository
from _lib.api import send_json, read_json, current_user, member_dict, load_manager

def _name(path):  # /api/members/<name>/pay
    return unquote(urlparse(path).path).rstrip("/").split("/")[-2]

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        if not current_user(self): return send_json(self, 401, {"error": "unauthorized"})
        name = _name(self.path)
        try:
            amount = int(read_json(self).get("amount", 0))
        except (TypeError, ValueError):
            return send_json(self, 400, {"error": "금액은 숫자여야 합니다."})
        conn = get_conn(); repo = MemberRepository(conn); club = load_manager(conn)
        try:
            m = club.pay_fee(name, amount)
        except KeyError:
            conn.close(); return send_json(self, 404, {"error": f"'{name}' 회원을 찾을 수 없습니다."})
        except ValueError as e:
            conn.close(); return send_json(self, 400, {"error": str(e)})
        repo.upsert(m); conn.close()
        send_json(self, 200, {"member": member_dict(m)})
```

- [ ] **Step 3: Stats**

Create `api/stats.py`:
```python
from http.server import BaseHTTPRequestHandler
from _lib.db import get_conn
from _lib.api import send_json, current_user, load_manager

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        if not current_user(self): return send_json(self, 401, {"error": "unauthorized"})
        conn = get_conn(); club = load_manager(conn); conn.close()
        send_json(self, 200, {
            "count": len(club.members),
            "total_fee": club.total_fee(),
            "average_fee": round(club.average_fee()),
            "unpaid": sum(1 for m in club.members.values() if not m.paid),
            "roles": club.count_by_role(),
        })
```

- [ ] **Step 4: Ranking**

Create `api/ranking.py`:
```python
from http.server import BaseHTTPRequestHandler
from _lib.db import get_conn
from _lib.api import send_json, current_user, member_dict, load_manager

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        if not current_user(self): return send_json(self, 401, {"error": "unauthorized"})
        conn = get_conn(); club = load_manager(conn); conn.close()
        send_json(self, 200, {"ranking": [member_dict(m) for m in club.ranking()]})
```

- [ ] **Step 5: Verify API end-to-end (after `vercel dev` or deploy)**

```bash
# login (save cookie), then exercise endpoints
curl -c cj -X POST .../api/login -d '{"username":"admin","password":"<pw>"}'
curl -b cj -X POST .../api/members -d '{"name":"홍길동","phone":"010-1","type":"officer","position":"회장"}'
curl -b cj ".../api/members?q=홍"
curl -b cj -X POST ".../api/members/%ED%99%8D%EA%B8%B8%EB%8F%99/pay" -d '{"amount":10000}'
curl -b cj .../api/stats
curl -b cj .../api/ranking
```
Expected: 401 without cookie; 201/200 with cookie; stats/ranking reflect changes; Hangul name works URL-encoded.

- [ ] **Step 6: Commit**

```bash
git add api/members api/stats.py api/ranking.py
git commit -m "feat(api): member patch/delete, pay, stats, ranking (persist affected member)"
```

---


## Task 9: Frontend — theme + layout + login

**Files:**
- Replace: `app/globals.css`
- Replace: `app/layout.tsx`
- Create: `app/login/page.tsx`

- [ ] **Step 1: Port DESIGN.md tokens → `app/globals.css`**

```css
@import "tailwindcss";

:root{
  --canvas:#F4F1FA; --fg:#332F3A; --muted:#635F69;
  --violet:#7C3AED; --pink:#DB2777; --teal:#10B981; --amber:#F59E0B; --danger:#EF4444;
  --grad:linear-gradient(135deg,#A78BFA,#7C3AED);
  --r-card:28px; --r-btn:18px;
  --sh-out:8px 8px 18px rgba(174,167,193,.55),-8px -8px 18px rgba(255,255,255,.9);
  --sh-hover:11px 11px 24px rgba(174,167,193,.6),-11px -11px 24px rgba(255,255,255,.95);
  --sh-sm:5px 5px 11px rgba(174,167,193,.5),-5px -5px 11px rgba(255,255,255,.9);
  --sh-in:inset 5px 5px 10px rgba(174,167,193,.5),inset -5px -5px 10px rgba(255,255,255,.9);
  --sh-in-deep:inset 10px 10px 20px rgba(174,167,193,.7),inset -10px -10px 20px rgba(255,255,255,.6);
  --sh-clay:12px 12px 24px rgba(124,58,237,.30),-8px -8px 16px rgba(255,255,255,.85),inset 4px 4px 8px rgba(255,255,255,.45),inset -5px -5px 10px rgba(91,33,182,.18);
  --sh-clay-pressed:inset 6px 6px 12px rgba(91,33,182,.30),inset -4px -4px 8px rgba(255,255,255,.25);
}
body{background:var(--canvas);color:var(--fg);font-family:"DM Sans","Pretendard Variable",Pretendard,system-ui,sans-serif;}
.font-display{font-family:"Nunito","Pretendard Variable",Pretendard,sans-serif;}
.clay-card{background:var(--canvas);border-radius:var(--r-card);box-shadow:var(--sh-out);}
.well{box-shadow:var(--sh-in-deep);border-radius:18px;}
.orb{border-radius:9999px;color:#fff;box-shadow:var(--sh-clay);display:grid;place-items:center;}
.clay-btn{border-radius:var(--r-btn);background:var(--canvas);box-shadow:var(--sh-out);transition:all .2s ease-out;font-weight:700;cursor:pointer;border:0;color:var(--fg);}
.clay-btn:hover{transform:translateY(-2px);box-shadow:var(--sh-hover);}
.clay-btn:active{transform:scale(.96);box-shadow:var(--sh-in);}
.clay-btn-primary{background:var(--grad);color:#fff;box-shadow:var(--sh-clay);}
/* deferred polish: clay-pressed tím, KHÔNG để inset lavender đè gradient */
.clay-btn-primary:active{transform:scale(.96);box-shadow:var(--sh-clay-pressed);}
.clay-input{border-radius:var(--r-btn);background:var(--canvas);box-shadow:var(--sh-in-deep);outline:0;border:0;color:var(--fg);}
.clay-input::placeholder{color:#8B7FA8;}
.icon-btn{border-radius:14px;background:var(--canvas);box-shadow:var(--sh-in-deep);display:grid;place-items:center;transition:all .2s ease-out;cursor:pointer;border:0;color:var(--fg);}
.icon-btn:hover{transform:translateY(-1px);box-shadow:var(--sh-out);}
.icon-btn:active{transform:scale(.92);box-shadow:var(--sh-in-deep);}
.icon-btn.danger{color:var(--danger);}
.badge{border-radius:9999px;font-size:12px;font-weight:700;padding:6px 13px;color:#fff;display:inline-block;}
.badge-officer{background:var(--grad);}
.badge-general{background:var(--canvas);color:var(--muted);box-shadow:var(--sh-in);}
.badge-paid{background:linear-gradient(135deg,#34D399,#10B981);}
.badge-unpaid{background:linear-gradient(135deg,#FCD34D,#F59E0B);}
*:focus-visible{outline:2px solid var(--violet);outline-offset:2px;}
@media (prefers-reduced-motion: reduce){*{transition:none!important;}}
```

- [ ] **Step 2: Layout with pinned fonts → `app/layout.tsx`**

```tsx
import "./globals.css";

export const metadata = { title: "Cluber", description: "동호회 관리 프로그램" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Nunito:wght@700;800;900&display=swap" rel="stylesheet" />
        {/* pinned (not @latest) per spec §6 */}
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.css" />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 3: Login page → `app/login/page.tsx`**

```tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Login() {
  const [u, setU] = useState(""); const [p, setP] = useState(""); const [err, setErr] = useState("");
  const router = useRouter();
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr("");
    const res = await fetch("/api/login", { method: "POST", body: JSON.stringify({ username: u, password: p }) });
    if (res.ok) router.push("/");
    else setErr((await res.json()).error || "로그인 실패");
  }
  return (
    <main className="min-h-screen grid place-items-center p-6">
      <form onSubmit={submit} className="clay-card w-full max-w-sm p-8 grid gap-4">
        <h1 className="font-display text-3xl font-black text-center"
            style={{ background: "var(--grad)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>Cluber</h1>
        <input className="clay-input px-4 py-3" placeholder="아이디" value={u} onChange={e => setU(e.target.value)} aria-label="아이디" />
        <input className="clay-input px-4 py-3" type="password" placeholder="비밀번호" value={p} onChange={e => setP(e.target.value)} aria-label="비밀번호" />
        {err && <p className="text-sm" style={{ color: "var(--danger)" }}>{err}</p>}
        <button className="clay-btn clay-btn-primary px-4 py-3" type="submit">로그인</button>
      </form>
    </main>
  );
}
```

- [ ] **Step 4: Verify login screen renders**

Run: `npm run dev` (or `vercel dev`), open `/login`.
Expected: Soft-Clay login card, gradient "Cluber" title, recessed inputs, gradient button that presses purple (not lavender). Wrong creds → danger error text.

- [ ] **Step 5: Commit**

```bash
git add app/globals.css app/layout.tsx app/login/page.tsx
git commit -m "feat(ui): Soft-Clay theme + layout fonts (pinned) + login page"
```

---


## Task 10: Frontend — dashboard

**Files:**
- Create: `app/api.ts`, `app/page.tsx`
- Install: `lucide-react`

- [ ] **Step 1: Install icons**

Run: `npm install lucide-react`
Expected: added to `package.json`.

- [ ] **Step 2: Fetch helper → `app/api.ts`**

```ts
export async function api(path: string, init?: RequestInit) {
  const res = await fetch(path, init);
  if (res.status === 401) { window.location.href = "/login"; throw new Error("unauthorized"); }
  return res.json();
}
export type Member = {
  name: string; phone: string; student_id: string; fee: number; paid: boolean;
  joined_date: string; role: string; position: string | null;
};
```

- [ ] **Step 3: Dashboard → `app/page.tsx`**

```tsx
"use client";
import { useEffect, useState, useCallback } from "react";
import { Users, Wallet, ChartColumn, Clock, Search, Plus, CreditCard, Pencil, Trash2, LogOut, Trophy } from "lucide-react";
import { api, type Member } from "./api";

type Stats = { count: number; total_fee: number; average_fee: number; unpaid: number; roles: Record<string, number> };
const won = (n: number) => n.toLocaleString("ko-KR") + "원";

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [q, setQ] = useState("");
  const [form, setForm] = useState({ name: "", phone: "", student_id: "", type: "member", position: "" });

  const load = useCallback(async (query = "") => {
    const [s, m] = await Promise.all([api("/api/stats"), api(`/api/members?q=${encodeURIComponent(query)}`)]);
    setStats(s); setMembers(m.members);
  }, []);
  useEffect(() => { load(); }, [load]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.phone) return;
    const r = await api("/api/members", { method: "POST", body: JSON.stringify(form) });
    if (r.error) return alert(r.error);
    setForm({ name: "", phone: "", student_id: "", type: "member", position: "" }); load(q);
  }
  async function pay(n: string) {
    const a = prompt(`${n} 회비 납부 금액?`); if (a === null) return;
    const r = await api(`/api/members/${encodeURIComponent(n)}/pay`, { method: "POST", body: JSON.stringify({ amount: Number(a) }) });
    if (r.error) alert(r.error); load(q);
  }
  async function edit(n: string) {
    const p = prompt(`${n} 새 연락처?`); if (!p) return;
    await api(`/api/members/${encodeURIComponent(n)}`, { method: "PATCH", body: JSON.stringify({ phone: p }) }); load(q);
  }
  async function del(n: string) {
    if (!confirm(`${n} 회원을 삭제할까요?`)) return;
    await api(`/api/members/${encodeURIComponent(n)}`, { method: "DELETE" }); load(q);
  }
  async function logout() { await fetch("/api/logout", { method: "POST" }); window.location.href = "/login"; }

  const orbs = stats ? [
    { I: Users, g: "from-violet-400 to-violet-600", l: "전체 회원", v: `${stats.count}명` },
    { I: Wallet, g: "from-pink-400 to-pink-600", l: "총 회비", v: won(stats.total_fee) },
    { I: ChartColumn, g: "from-sky-400 to-sky-600", l: "평균 회비", v: won(stats.average_fee) },
    { I: Clock, g: "from-amber-300 to-amber-500", l: "미납 회원", v: `${stats.unpaid}명` },
  ] : [];

  return (
    <main className="max-w-5xl mx-auto p-5 md:p-7">
      <header className="clay-card flex items-center justify-between gap-4 px-5 py-3 mb-7">
        <span className="font-display text-2xl font-black" style={{ background: "var(--grad)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>Cluber</span>
        <nav className="flex gap-2 text-sm font-bold text-[var(--muted)]">
          <a href="/" className="px-3 py-2 rounded-xl" style={{ color: "var(--violet)", boxShadow: "var(--sh-in)" }}>대시보드</a>
          <a href="/ranking" className="px-3 py-2 rounded-xl flex items-center gap-1"><Trophy size={16} />회비 랭킹</a>
        </nav>
        <button className="clay-btn px-4 py-2 flex items-center gap-2" onClick={logout}><LogOut size={18} />로그아웃</button>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-7">
        {orbs.map(({ I, g, l, v }) => (
          <div key={l} className="clay-card p-5">
            <div className="well w-[62px] h-[62px] mb-3"><div className={`orb w-11 h-11 bg-linear-to-br ${g}`}><I size={22} /></div></div>
            <div className="text-[13px] text-[var(--muted)]">{l}</div>
            <div className="font-display text-2xl font-black">{v}</div>
          </div>
        ))}
      </section>

      <form onSubmit={(e) => { e.preventDefault(); load(q); }} className="flex gap-3 mb-4">
        <div className="clay-input flex-1 flex items-center gap-2 px-4 py-3"><Search size={18} color="var(--muted)" />
          <input className="bg-transparent outline-none w-full" placeholder="이름 또는 연락처 검색" value={q} onChange={e => setQ(e.target.value)} aria-label="회원 검색" /></div>
        <button className="clay-btn px-5">검색</button>
      </form>

      <form onSubmit={add} className="clay-card p-4 mb-5 flex flex-wrap gap-3 items-center">
        <input className="clay-input px-3 py-2" placeholder="이름" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} aria-label="이름" />
        <input className="clay-input px-3 py-2" placeholder="연락처" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} aria-label="연락처" />
        <input className="clay-input px-3 py-2" placeholder="학번(선택)" value={form.student_id} onChange={e => setForm({ ...form, student_id: e.target.value })} aria-label="학번" />
        <select className="clay-input px-3 py-2" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} aria-label="구분">
          <option value="member">일반회원</option><option value="officer">운영진</option>
        </select>
        {form.type === "officer" && <input className="clay-input px-3 py-2" placeholder="직책" value={form.position} onChange={e => setForm({ ...form, position: e.target.value })} aria-label="직책" />}
        <button className="clay-btn clay-btn-primary px-4 py-2 flex items-center gap-2" type="submit"><Plus size={18} />회원 추가</button>
      </form>

      <div className="clay-card p-3">
        {members.map(m => (
          <div key={m.name} className="grid grid-cols-[1.4fr_1fr_1.2fr_auto] items-center gap-3 px-4 py-3 rounded-2xl">
            <div><div className="font-bold">{m.name}</div><div className="text-xs text-[var(--muted)]">학번 {m.student_id || "-"} · 가입 {m.joined_date}</div></div>
            <div>{m.role === "운영진" ? <span className="badge badge-officer">운영진 · {m.position}</span> : <span className="badge badge-general">일반회원</span>}</div>
            <div className="flex items-center gap-2"><span className="font-display font-extrabold">{won(m.fee)}</span>{m.paid ? <span className="badge badge-paid">납부</span> : <span className="badge badge-unpaid">미납</span>}</div>
            <div className="flex gap-2">
              <button className="icon-btn w-10 h-10" aria-label="회비 납부" onClick={() => pay(m.name)}><CreditCard size={18} /></button>
              <button className="icon-btn w-10 h-10" aria-label="회원 수정" onClick={() => edit(m.name)}><Pencil size={18} /></button>
              <button className="icon-btn danger w-10 h-10" aria-label="회원 삭제" onClick={() => del(m.name)}><Trash2 size={18} /></button>
            </div>
          </div>
        ))}
        {members.length === 0 && <div className="px-4 py-6 text-[var(--muted)]">등록된 회원이 없습니다.</div>}
      </div>
    </main>
  );
}
```

- [ ] **Step 4: Verify dashboard end-to-end**

Run: `vercel dev`, login, then open `/`.
Expected: stat orbs in wells, add member → row appears, search filters, pay updates fee+납부 badge, edit/delete work, logout → `/login`.

- [ ] **Step 5: Commit**

```bash
git add app/api.ts app/page.tsx package.json package-lock.json
git commit -m "feat(ui): dashboard — stats orbs, member CRUD/search/pay (Lucide)"
```

---


## Task 11: Frontend — ranking + production verify

**Files:**
- Create: `app/ranking/page.tsx`

- [ ] **Step 1: Ranking page → `app/ranking/page.tsx`**

```tsx
"use client";
import { useEffect, useState } from "react";
import { ArrowLeft, Trophy } from "lucide-react";
import { api, type Member } from "../api";
const won = (n: number) => n.toLocaleString("ko-KR") + "원";

export default function Ranking() {
  const [rows, setRows] = useState<Member[]>([]);
  useEffect(() => { api("/api/ranking").then(r => setRows(r.ranking)); }, []);
  return (
    <main className="max-w-3xl mx-auto p-5 md:p-7">
      <header className="clay-card flex items-center gap-3 px-5 py-3 mb-6">
        <a href="/" className="icon-btn w-10 h-10" aria-label="대시보드로"><ArrowLeft size={18} /></a>
        <h1 className="font-display text-xl font-extrabold flex items-center gap-2"><Trophy size={20} color="var(--amber)" />회비 랭킹</h1>
      </header>
      <div className="clay-card p-3">
        {rows.map((m, i) => (
          <div key={m.name} className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-3 px-4 py-3 rounded-2xl">
            <span className="font-display font-black w-7 text-center">{i + 1}</span>
            <span className="font-bold">{m.name}</span>
            <span className="text-sm text-[var(--muted)]">{m.role}</span>
            <span className="font-display font-extrabold">{won(m.fee)}</span>
          </div>
        ))}
        {rows.length === 0 && <div className="px-4 py-6 text-[var(--muted)]">등록된 회원이 없습니다.</div>}
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Build (catch type errors before deploy)**

Run: `npm run build`
Expected: build succeeds, no TS errors.

- [ ] **Step 3: Deploy to production**

Run: `npx vercel deploy --prod`
Expected: production URL.

- [ ] **Step 4: Full end-to-end verification on prod**

- [ ] Visit `/` unauthenticated → redirected to `/login`.
- [ ] Login with seeded admin → dashboard loads (stats + members).
- [ ] Add 일반회원 + 운영진 → rows appear with correct badges.
- [ ] Search by Hangul name and by phone → filters correctly.
- [ ] Pay fee → fee accumulates, 납부 badge turns teal, stats update.
- [ ] Edit phone, delete member → reflected after reload.
- [ ] `/ranking` → sorted by fee desc (운영진/일반 mixed).
- [ ] Logout → `/login`; protected APIs return 401 without cookie.

- [ ] **Step 5: Commit**

```bash
git add app/ranking/page.tsx
git commit -m "feat(ui): ranking page + production deploy verified"
```

---

## Plan Self-Review

- **Spec coverage:** §2 architecture → Tasks 1,5,7,8. §3 domain classes → Tasks 2,3,4. §4 API/DB/Auth → Tasks 5,6,7,8. §5 UX/UI (DESIGN.md) → Tasks 9,10,11. §6 deferred (login/ranking mock→built in 9/11; clay-pressed active→Task 9 Step1; pin Pretendard→Task 9 Step2). §7 contracts: return-affected-member+upsert (Tasks 2,4,7,8); seed script (Task 6); schema manual (Task 5 Step6); `{name}` mutation (Tasks 8,10 use `encodeURIComponent`). ✓ no gaps.
- **Placeholder scan:** every code step has full code; no TBD/TODO. ✓
- **Type consistency:** `member_dict` shape ↔ `Member` TS type (name/phone/student_id/fee/paid/joined_date/role/position); `pay_fee`/`update_phone`/`add_member` return Member used by API upsert; `_name()` parses `{name}`/`{name}/pay`. ✓

## Revision notes (from plan review)

- **Verify with `vercel dev` or the deployed HTTPS URL — NOT `npm run dev`.** `next dev` does not serve Python `/api/*`. Cookie is `Secure`, so curl over plain `http://localhost` won't send it → run auth-protected checks against the deployed HTTPS URL.
- **Deferred (MVP-acceptable):** `prompt()/confirm()/alert()` in dashboard pay/edit/delete break the Soft-Clay aesthetic → replace with a clay modal/toast in a later pass (tracked alongside login/ranking polish).
