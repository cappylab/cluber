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
