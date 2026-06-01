# Plan — Cluber Onboarding (Club + 목표 + 첫 회원)

Date: 2026-06-01
Spec gốc: docs/superpowers/specs/2026-05-31-cluber-design.md

## Mục tiêu
Đăng nhập xong, nếu **chưa có club** → wizard `/setup` **3 bước, mỗi bước 1 màn thoáng (game-style)**:
1. Tên club (동아리 이름)
2. Mục tiêu hội phí tháng (목표 회비) — chip gợi ý + ô tự nhập
3. Thêm thành viên đầu tiên (dùng API add member sẵn có; có thể bỏ qua)
→ Dashboard dùng **goal + name của club** thay cho `monthlyGoal` hardcode.

## Vì sao (chấm điểm)
Thêm class `Club` → bộ class Python mạnh hơn: 상속(Officer) + 집합(ClubManager) + 캡슐화/메서드(`Club.progress/remaining`) + `__str__`.

## Quyết định thiết kế
- **1 club** (1 admin), 1 dòng trong bảng `club`.
- Trường: `name` (text), `goal` (bigint). (Bỏ emoji — giữ tối giản.)
- Wizard = **3 màn riêng** (không dồn 1 trang), rộng rãi, có chấm tiến trình 1·2·3 + mascot.
- Bước 3 tái dùng `POST /api/members`; cho phép bỏ qua.
- Sửa mục tiêu sau: mở lại `/setup` từ dashboard.

## Các Phase
### P1 — Domain + DB
- `api/_domain/club.py`: `Club(name, goal)`; `progress(total_fee)`, `remaining(total_fee)`, `__str__`. TDD `tests/test_club.py`.
- DB: bảng `club (id serial pk, name text not null, goal bigint not null, created_at timestamptz default now())`. Migrate bằng node+pg (Temp/cluberdb).
- `api/_lib/repository.py`: `ClubRepository.get() -> Club|None`; `save(name, goal)` upsert 1 dòng (id=1).

### P2 — API
- `api/club.py`: `GET` (auth) → `{exists, name, goal}`; `POST` (auth) `{name, goal}` → lưu. Import bootstrap như các endpoint khác.

### P3 — Frontend
- `app/setup/page.tsx`: wizard client, state `step` 1–3, card rộng rãi, tái dùng token. Lưu club qua `POST /api/club` ở bước 2→3; thêm member ở bước 3; xong → `/`.
- `app/login/page.tsx`: sau `res.ok` → `GET /api/club`; chưa có → `/setup`, có → `/`.
- `app/page.tsx`: fetch `/api/club`; chưa có → redirect `/setup`; hiện `club.name` ở nav/hero; dùng `club.goal` cho thẻ mục tiêu (bỏ `monthlyGoal` cứng).
- `globals.css`: style `.setup-*` rộng rãi + chấm bước.

### P4 — Verify + deploy
- pytest (domain) xanh; `npm run build`; push (auto-deploy); test thật trên Vercel (login → setup → dashboard).

## Contracts
- `GET /api/club` chưa có club → `{"exists": false}`. Có → `{"exists": true, "name", "goal"}`.
- `POST /api/club` body `{name:str, goal:int>=0}` → `{ok:true}`. Cần auth (401 nếu không cookie).
