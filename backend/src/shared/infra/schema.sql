PRAGMA journal_mode=WAL;
PRAGMA foreign_keys=ON;

CREATE TABLE IF NOT EXISTS users (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  email       TEXT UNIQUE NOT NULL,
  password    TEXT NOT NULL,
  role        TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('user', 'admin')),
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

CREATE TABLE IF NOT EXISTS wrong_questions (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id  TEXT NOT NULL,
  theme       TEXT NOT NULL,
  question    TEXT NOT NULL,
  user_answer TEXT NOT NULL,
  quiz_type   TEXT NOT NULL DEFAULT 'free',
  difficulty  TEXT NOT NULL DEFAULT 'medium',
  saved_at    TEXT NOT NULL,
  retried     INTEGER NOT NULL DEFAULT 0,
  retried_at  TEXT
);

CREATE INDEX IF NOT EXISTS idx_wrong_questions_user_id ON wrong_questions(user_id);

CREATE TABLE IF NOT EXISTS notes (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id  TEXT,
  question_id TEXT,
  theme       TEXT,
  content     TEXT NOT NULL,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_theme ON notes(theme);

CREATE TABLE IF NOT EXISTS flashcards (
  id            TEXT PRIMARY KEY,
  user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  theme         TEXT NOT NULL,
  front         TEXT NOT NULL,
  back          TEXT NOT NULL,
  difficulty    TEXT NOT NULL DEFAULT 'medium',
  next_review   TEXT NOT NULL DEFAULT (datetime('now')),
  review_count  INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_flashcards_user_id ON flashcards(user_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_theme ON flashcards(theme);
CREATE INDEX IF NOT EXISTS idx_flashcards_next_review ON flashcards(next_review);

CREATE TABLE IF NOT EXISTS theme_goals (
  id           TEXT PRIMARY KEY,
  user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  theme        TEXT NOT NULL,
  target_score REAL NOT NULL CHECK(target_score >= 0 AND target_score <= 10),
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id, theme)
);
CREATE INDEX IF NOT EXISTS idx_theme_goals_user_id ON theme_goals(user_id);
