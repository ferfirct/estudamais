import Database from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';
import { randomUUID } from 'node:crypto';
import type { StudySession, User, UserSettings } from '../types/index.js';

const DB_PATH = process.env.DB_PATH
  ? path.resolve(process.env.DB_PATH)
  : path.resolve(process.cwd(), 'estuda.db');

const SCHEMA_PATH = path.resolve(__dirname, 'schema.sql');

const db = new Database(DB_PATH);
db.exec(fs.readFileSync(SCHEMA_PATH, 'utf-8'));

// ── Statements ───────────────────────────────────────────────────────────────

const stmtCreateUser = db.prepare(
  'INSERT INTO users (id, name, email, password, created_at) VALUES (?, ?, ?, ?, ?)'
);
const stmtGetUserById = db.prepare('SELECT * FROM users WHERE id = ?');
const stmtGetUserByEmail = db.prepare('SELECT * FROM users WHERE email = ?');
const stmtCreateSettings = db.prepare('INSERT INTO user_settings (user_id) VALUES (?)');
const stmtGetSettings = db.prepare('SELECT * FROM user_settings WHERE user_id = ?');
const stmtUpdateSettings = db.prepare(`
  UPDATE user_settings SET
    theme = COALESCE(@theme, theme),
    daily_goal = COALESCE(@dailyGoal, daily_goal),
    language = COALESCE(@language, language),
    notifications = COALESCE(@notifications, notifications),
    updated_at = datetime('now')
  WHERE user_id = @userId
`);

const stmtCreateSession = db.prepare(`
  INSERT INTO sessions (id, user_id, theme, start_time, end_time, duration_minutes, score, efficiency_index, quiz_completed, created_at)
  VALUES (@id, @userId, @theme, @startTime, @endTime, @durationMinutes, @score, @efficiencyIndex, @quizCompleted, @createdAt)
`);
const stmtGetSession = db.prepare('SELECT * FROM sessions WHERE id = ? AND user_id = ?');
const stmtUpdateSession = db.prepare(`
  UPDATE sessions SET
    end_time = COALESCE(@endTime, end_time),
    duration_minutes = COALESCE(@durationMinutes, duration_minutes),
    score = COALESCE(@score, score),
    efficiency_index = COALESCE(@efficiencyIndex, efficiency_index),
    quiz_completed = COALESCE(@quizCompleted, quiz_completed)
  WHERE id = @id AND user_id = @userId
`);
const stmtListSessions = db.prepare(
  'SELECT * FROM sessions WHERE user_id = ? ORDER BY created_at DESC'
);
const stmtListSessionsNeedsReview = db.prepare(
  'SELECT * FROM sessions WHERE user_id = ? AND score IS NOT NULL AND score < 6 ORDER BY created_at DESC'
);

const stmtGetFreeze = db.prepare('SELECT * FROM streak_freeze WHERE user_id = ?');
const stmtUpsertFreeze = db.prepare(`
  INSERT INTO streak_freeze (user_id, streak_frozen, weekly_freeze_used, week_reset_date)
  VALUES (@userId, @streakFrozen, @weeklyFreezeUsed, @weekResetDate)
  ON CONFLICT(user_id) DO UPDATE SET
    streak_frozen = excluded.streak_frozen,
    weekly_freeze_used = excluded.weekly_freeze_used,
    week_reset_date = excluded.week_reset_date
`);

// ── Mappers ──────────────────────────────────────────────────────────────────

function mapSession(row: Record<string, unknown>): StudySession {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    theme: row.theme as string,
    startTime: row.start_time as string,
    endTime: (row.end_time as string) ?? '',
    durationMinutes: row.duration_minutes as number,
    score: row.score !== null ? (row.score as number) : null,
    efficiencyIndex: row.efficiency_index !== null ? (row.efficiency_index as number) : null,
    quizCompleted: row.quiz_completed === 1,
    createdAt: row.created_at as string,
  };
}

function mapUser(row: Record<string, unknown>): User & { password: string } {
  return {
    id: row.id as string,
    name: row.name as string,
    email: row.email as string,
    password: row.password as string,
    createdAt: row.created_at as string,
  };
}

function mapSettings(row: Record<string, unknown>): UserSettings {
  return {
    userId: row.user_id as string,
    theme: row.theme as 'dark' | 'light' | 'system',
    dailyGoal: row.daily_goal as number,
    language: row.language as string,
    notifications: row.notifications === 1,
    updatedAt: row.updated_at as string,
  };
}

// ── DAOs ──────────────────────────────────────────────────────────────────────

export const userDb = {
  create(name: string, email: string, hashedPassword: string): User {
    const id = randomUUID();
    const now = new Date().toISOString();
    stmtCreateUser.run(id, name, email, hashedPassword, now);
    stmtCreateSettings.run(id);
    return { id, name, email, createdAt: now };
  },
  findById(id: string): (User & { password: string }) | undefined {
    const row = stmtGetUserById.get(id) as Record<string, unknown> | undefined;
    return row ? mapUser(row) : undefined;
  },
  findByEmail(email: string): (User & { password: string }) | undefined {
    const row = stmtGetUserByEmail.get(email) as Record<string, unknown> | undefined;
    return row ? mapUser(row) : undefined;
  },
};

export const settingsDb = {
  get(userId: string): UserSettings | undefined {
    const row = stmtGetSettings.get(userId) as Record<string, unknown> | undefined;
    return row ? mapSettings(row) : undefined;
  },
  update(
    userId: string,
    patch: Partial<Omit<UserSettings, 'userId' | 'updatedAt'>>
  ): UserSettings | undefined {
    stmtUpdateSettings.run({
      userId,
      theme: patch.theme ?? null,
      dailyGoal: patch.dailyGoal ?? null,
      language: patch.language ?? null,
      notifications:
        patch.notifications === undefined ? null : patch.notifications ? 1 : 0,
    });
    return this.get(userId);
  },
};

export const sessionDb = {
  create(userId: string, data: { theme: string; startTime: string }): StudySession {
    const id = randomUUID();
    const createdAt = new Date().toISOString();
    stmtCreateSession.run({
      id,
      userId,
      theme: data.theme,
      startTime: data.startTime,
      endTime: null,
      durationMinutes: 0,
      score: null,
      efficiencyIndex: null,
      quizCompleted: 0,
      createdAt,
    });
    return {
      id,
      userId,
      theme: data.theme,
      startTime: data.startTime,
      endTime: '',
      durationMinutes: 0,
      score: null,
      efficiencyIndex: null,
      quizCompleted: false,
      createdAt,
    };
  },
  get(id: string, userId: string): StudySession | undefined {
    const row = stmtGetSession.get(id, userId) as Record<string, unknown> | undefined;
    return row ? mapSession(row) : undefined;
  },
  update(id: string, userId: string, patch: Partial<StudySession>): StudySession | undefined {
    stmtUpdateSession.run({
      id,
      userId,
      endTime: patch.endTime ?? null,
      durationMinutes: patch.durationMinutes ?? null,
      score: patch.score ?? null,
      efficiencyIndex: patch.efficiencyIndex ?? null,
      quizCompleted:
        patch.quizCompleted === undefined ? null : patch.quizCompleted ? 1 : 0,
    });
    return this.get(id, userId);
  },
  list(userId: string, needsReview = false): StudySession[] {
    const rows = needsReview
      ? stmtListSessionsNeedsReview.all(userId)
      : stmtListSessions.all(userId);
    return (rows as Record<string, unknown>[]).map(mapSession);
  },
};

export interface FreezeState {
  streakFrozen: boolean;
  weeklyFreezeUsed: boolean;
  weekResetDate: string | null;
}

export const streakFreezeDb = {
  get(userId: string): FreezeState {
    const row = stmtGetFreeze.get(userId) as Record<string, unknown> | undefined;
    if (!row) return { streakFrozen: false, weeklyFreezeUsed: false, weekResetDate: null };
    return {
      streakFrozen: row.streak_frozen === 1,
      weeklyFreezeUsed: row.weekly_freeze_used === 1,
      weekResetDate: (row.week_reset_date as string) ?? null,
    };
  },
  save(userId: string, state: FreezeState): void {
    stmtUpsertFreeze.run({
      userId,
      streakFrozen: state.streakFrozen ? 1 : 0,
      weeklyFreezeUsed: state.weeklyFreezeUsed ? 1 : 0,
      weekResetDate: state.weekResetDate,
    });
  },
};
