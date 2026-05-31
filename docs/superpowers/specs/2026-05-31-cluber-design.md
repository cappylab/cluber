# Cluber — Design Spec (Phase 1)

- **Project:** Cluber (동호회 관리 프로그램) · repo `cappylab/cluber`
- **Student:** 20266126 하민하오 · 과목 프로그래밍입문(2040) 13주차
- **Date:** 2026-05-31 · **Status:** for review (pre writing-plans)
- **Design system:** see `DESIGN.md` (Soft-Clay = Clay palette/personality + Neum depth-physics)

## 1. Mục tiêu & phạm vi

Web app quản lý hội viên & hội phí câu lạc bộ, **deploy online**, nhưng **lõi nghiệp vụ là class Python** (phần chấm điểm chính của môn). GUI tự do (giáo sư cho phép), backend bắt buộc Python.

**Phase 1 (MVP deploy được) — trong spec này:**
- 1 câu lạc bộ, đăng nhập admin.
- Hội viên: thêm / xem / sửa(연락처) / xóa / **tìm kiếm**.
- Hội phí: nộp (cộng dồn) / thống kê (tổng·trung bình·đếm theo loại) / **xếp hạng**.
- 2 loại hội viên qua **kế thừa** (일반회원 / 운영진).
- Lưu bền (Postgres), UI theo DESIGN.md.

**Phase 2+ (backlog, ngoài spec):** nhiều CLB, hội viên tự đăng nhập, điểm danh/lịch sử, báo cáo.

## 2. Kiến trúc hệ thống (4 lớp)

```
Next.js + Tailwind (Vercel) ── fetch /api/* (JSON + cookie JWT)
        │
Python serverless /api/*.py (Vercel)
   ├─ API mỏng (auth check → gọi domain → JSON)
   ├─ ★ Domain class Python: Member / Officer / ClubManager
   └─ Repository (object ⇄ SQL)
        │
   Postgres cloud (Neon free)
```

- **Domain** thuần Python, không phụ thuộc web/DB → test độc lập.
- **Repository** dịch object ⇄ bảng (thay cho file I/O tuần 11).
- **API** serverless stateless: mỗi request `repo.load_all()` → dựng `ClubManager` → gọi method → lưu → JSON.
- Cùng domain Vercel → cookie same-site, không CORS.
- Quy mô nhỏ (vài chục~trăm member) → load-all chấp nhận được (ghi chú khi thuyết trình).

## 3. Domain class Python (lõi chấm điểm)

```python
class Member:                       # 회원
    def __init__(self, name, phone, student_id="", joined_date=None):
        self.name=name; self.phone=phone; self.student_id=student_id
        self.fee=0; self.paid=False
        self.joined_date = joined_date or date.today()
    def pay_fee(self, amount): ...   # validate ≥0; fee += amount; paid=True
    def update_phone(self, phone): ...
    def role(self): return "일반회원"
    def __str__(self): ...
    def __eq__/__lt__/__gt__(self, o): ...   # so sánh theo fee (comment: == là fee, không phải identity)

class Officer(Member):              # 운영진 — 상속
    def __init__(self,...,position="총무"): super().__init__(...); self.position=position
    def role(self): return "운영진"

class ClubManager:                  # 관리자
    def __init__(self, club_name, members=None): self.club_name=...; self.members=members or {}  # {이름: Member}
    add_member (isinstance + chống trùng) · find_member · search(이름/연락처)
    update_phone · remove_member · pay_fee
    total_fee · average_fee · count_by_role (isinstance) · ranking (sorted, magic method)
```

**Map khái niệm:** `__init__`/self·method·`__str__`·dict nhiều object·상속+super+override·`isinstance`·연산자 오버로딩(`__eq__/__lt__/__gt__`→ranking). `__eq__` làm Member unhashable — OK vì chỉ lưu làm value, tra cứu qua tên.

## 4. API · DB · Auth

**DB (Postgres):**
```
members(id, name UNIQUE, phone, student_id, fee int=0, paid bool=false,
        joined_date date, type 'member'|'officer', position null)
admin(username, password_hash)   -- bcrypt; seed từ env
```
Repository: `load_all()` (type→Member/Officer), `upsert(member)`, `delete(name)`.

**API (JSON; tất cả cần đăng nhập trừ login):**
```
POST /api/login · POST /api/logout
GET  /api/members?q= · POST /api/members
PATCH /api/members/{name} (partial: phone?/position?...) · DELETE /api/members/{name}
POST /api/members/{name}/pay · GET /api/stats · GET /api/ranking
```
**Auth:** bcrypt(passlib) + JWT trong cookie **httpOnly + Secure + SameSite=Lax**; expiry 24h, không refresh token.

## 5. UX/UI

- Theo `DESIGN.md` (token tập trung → Tailwind theme). Lucide icons, **no emoji**, Pretendard cho Hangul.
- 4 màn: 로그인 / 대시보드 / 회원 목록 / 회비 랭킹. Mockup reference: `docs/mockups/cluber-dashboard.html`.
- Nested depth (orb trong well lõm), convex bulge cho CTA/orb.

## 6. Deferred / polish (ghi nhận, làm lúc code)

- **Login + Ranking chưa mock** → dựng lúc implement, dùng dashboard làm chuẩn visual.
- `.btn.primary:active` cần **clay-pressed tím riêng** (đừng để inset lavender đè gradient).
- **Pin version Pretendard** (thay `@latest`).
- `name` UNIQUE là khóa demo; production dùng ID (câu trả lời thuyết trình).

## 7. Contracts & open questions (chốt trước writing-plans)

1. **Hợp đồng lưu (persistence).** Method mutating của domain **trả về Member bị ảnh hưởng** (`add_member` / `pay_fee` / `update_phone` → return member); API gọi `repo.upsert(member)`. `remove_member` → API gọi `repo.delete(name)`. KHÔNG re-save cả dict; **KHÔNG** nhét repo vào domain (giữ lớp tách bạch — chính là điểm khoe của môn).
2. **Seed admin.** Bằng **script local chạy 1 lần** (`scripts/seed_admin.py`, dùng đúng hàm bcrypt của app) ghi vào Neon. Không mở endpoint `/api/seed`.
3. **Schema.** `schema.sql` chạy tay 1 lần lên Neon (đủ Phase 1), chung bước với seed admin.

**Pin version (plan chốt):** Next.js App Router + **Tailwind v4** (cú pháp theme khác v3 → ảnh hưởng port token từ DESIGN.md); **pin Pretendard** (bỏ `@latest`).
**Mutation key:** **PATCH/DELETE/pay dùng `{name}`** (frontend `encodeURIComponent`, framework tự decode — Hangul không phá path); `name` UNIQUE và Phase 1 không cho sửa `name` (chỉ sửa 연락처) → khóa ổn định, đồng bộ 100% với dict-theo-tên + domain methods theo name.
**Rủi ro tích hợp (verify sớm):** Next.js route handlers và Python `/api/*.py` cùng trên Vercel có thể đụng route → **dựng skeleton + deploy thử ngay bước đầu plan**, đừng để cuối mới lộ.

## 8. Tiêu chí thành công (Phase 1)

- Domain class test độc lập pass (TDD).
- CRUD + tìm + nộp phí + thống kê + ranking chạy end-to-end qua web.
- Đăng nhập admin an toàn (hash + JWT cookie).
- Deploy Vercel chạy được, dữ liệu bền (Postgres).
- UI khớp DESIGN.md; giải thích được class khi thuyết trình.
