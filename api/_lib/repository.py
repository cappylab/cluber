from _domain.member import Member, Officer
from _domain.club import Club


def row_to_member(row):
    """row dict -> Member/Officer (reconstruct subtype from `type`). Pure (no DB)."""
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
        from psycopg.rows import dict_row
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



class ClubRepository:
    def __init__(self, conn):
        self.conn = conn

    def get(self):
        from psycopg.rows import dict_row
        with self.conn.cursor(row_factory=dict_row) as cur:
            cur.execute("SELECT name, goal FROM club ORDER BY id LIMIT 1")
            r = cur.fetchone()
            return Club(r["name"], r["goal"]) if r else None

    def save(self, name, goal):
        with self.conn.cursor() as cur:
            cur.execute(
                """INSERT INTO club (id, name, goal) VALUES (1, %s, %s)
                   ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, goal=EXCLUDED.goal""",
                (name, goal),
            )
        self.conn.commit()