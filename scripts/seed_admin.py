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
