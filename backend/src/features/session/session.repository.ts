import { randomUUID } from 'node:crypto';
import db from '../../shared/infra/database.js';
import type { StudySession, CreateSessionInput, UpdateSessionPatch } from './session.types.js';

export interface ISessionRepository {
  create(userId: string, input: CreateSessionInput): StudySession;
  findById(id: string, userId: string): StudySession | undefined;
  update(id: string, userId: string, patch: UpdateSessionPatch): StudySession | undefined;
  list(userId: string, needsReview?: boolean): StudySession[];
}

const stmtCreate = db.prepare(`
  INSERT INTO sessions (id, user_id, theme, start_time, end_time, duration_minutes, score, efficiency_index, quiz_completed, created_at)
  VALUES (@id, @userId, @theme, @startTime, @endTime, @durationMinutes, @score, @efficiencyIndex, @quizCompleted, @createdAt)
`);
const stmtFindById = db.prepare('SELECT * FROM sessions WHERE id = ? AND user_id = ?');
const stmtUpdate = db.prepare(`
  UPDATE sessions SET
    end_time = COALESCE(@endTime, end_time),
    duration_minutes = COALESCE(@durationMinutes, duration_minutes),
    score = COALESCE(@score, score),
    efficiency_index = COALESCE(@efficiencyIndex, efficiency_index),
    quiz_completed = COALESCE(@quizCompleted, quiz_completed)
  WHERE id = @id AND user_id = @userId
`);
const stmtList = db.prepare('SELECT * FROM sessions WHERE user_id = ? ORDER BY created_at DESC');
const stmtListNeedsReview = db.prepare(
  'SELECT * FROM sessions WHERE user_id = ? AND score IS NOT NULL AND score < 6 ORDER BY created_at DESC'
);

function mapRow(row: Record<string, unknown>): StudySession {
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

class SqliteSessionRepository implements ISessionRepository {
  create(userId: string, input: CreateSessionInput): StudySession {
    const id = randomUUID();
    const createdAt = new Date().toISOString();
    stmtCreate.run({
      id, userId, theme: input.theme, startTime: input.startTime,
      endTime: null, durationMinutes: 0, score: null,
      efficiencyIndex: null, quizCompleted: 0, createdAt,
    });
    return {
      id, userId, theme: input.theme, startTime: input.startTime,
      endTime: '', durationMinutes: 0, score: null,
      efficiencyIndex: null, quizCompleted: false, createdAt,
    };
  }

  findById(id: string, userId: string): StudySession | undefined {
    const row = stmtFindById.get(id, userId) as Record<string, unknown> | undefined;
    return row ? mapRow(row) : undefined;
  }

  update(id: string, userId: string, patch: UpdateSessionPatch): StudySession | undefined {
    stmtUpdate.run({
      id,
      userId,
      endTime: patch.endTime ?? null,
      durationMinutes: patch.durationMinutes ?? null,
      score: patch.score ?? null,
      efficiencyIndex: patch.efficiencyIndex ?? null,
      quizCompleted: patch.quizCompleted === undefined ? null : patch.quizCompleted ? 1 : 0,
    });
    return this.findById(id, userId);
  }

  list(userId: string, needsReview = false): StudySession[] {
    const rows = needsReview
      ? stmtListNeedsReview.all(userId)
      : stmtList.all(userId);
    return (rows as Record<string, unknown>[]).map(mapRow);
  }
}

export const sessionRepository: ISessionRepository = new SqliteSessionRepository();
