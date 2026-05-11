PRAGMA journal_mode=WAL;
PRAGMA foreign_keys=ON;

CREATE TABLE IF NOT EXISTS users (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  email       TEXT UNIQUE NOT NULL,
  password    TEXT NOT NULL,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS user_settings (
  user_id       TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  theme         TEXT NOT NULL DEFAULT 'dark',
  daily_goal    INTEGER NOT NULL DEFAULT 60,
  language      TEXT NOT NULL DEFAULT 'pt-BR',
  notifications INTEGER NOT NULL DEFAULT 1,
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sessions (
  id               TEXT PRIMARY KEY,
  user_id          TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  theme            TEXT NOT NULL,
  start_time       TEXT NOT NULL,
  end_time         TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 0,
  score            REAL,
  efficiency_index REAL,
  quiz_completed   INTEGER NOT NULL DEFAULT 0,
  created_at       TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS streak_freeze (
  user_id            TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  streak_frozen      INTEGER NOT NULL DEFAULT 0,
  weekly_freeze_used INTEGER NOT NULL DEFAULT 0,
  week_reset_date    TEXT
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_theme ON sessions(theme);
