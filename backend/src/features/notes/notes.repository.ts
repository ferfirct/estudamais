import { randomUUID } from 'node:crypto';
import db from '../../shared/infra/database.js';
import type { Note } from './notes.types.js';

export interface INoteRepository {
  create(userId: string, data: { content: string; sessionId?: string; questionId?: string; theme?: string }): Note;
  findByUser(userId: string): Note[];
  findByTheme(userId: string, theme: string): Note[];
  findBySession(userId: string, sessionId: string): Note[];
  update(id: string, userId: string, content: string): Note | undefined;
  deleteById(id: string, userId: string): void;
}

const stmtCreate = db.prepare(
  'INSERT INTO notes (id, user_id, session_id, question_id, theme, content, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
);
const stmtFindByUser = db.prepare('SELECT * FROM notes WHERE user_id = ? ORDER BY created_at DESC');
const stmtFindByTheme = db.prepare('SELECT * FROM notes WHERE user_id = ? AND theme = ? ORDER BY created_at DESC');
const stmtFindBySession = db.prepare('SELECT * FROM notes WHERE user_id = ? AND session_id = ? ORDER BY created_at DESC');
const stmtFindById = db.prepare('SELECT * FROM notes WHERE id = ? AND user_id = ?');
const stmtUpdate = db.prepare('UPDATE notes SET content = ?, updated_at = ? WHERE id = ? AND user_id = ?');
const stmtDelete = db.prepare('DELETE FROM notes WHERE id = ? AND user_id = ?');

function mapRow(row: Record<string, unknown>): Note {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    sessionId: (row.session_id as string) || undefined,
    questionId: (row.question_id as string) || undefined,
    theme: (row.theme as string) || undefined,
    content: row.content as string,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

class SqliteNoteRepository implements INoteRepository {
  create(userId: string, data: { content: string; sessionId?: string; questionId?: string; theme?: string }): Note {
    const id = randomUUID();
    const now = new Date().toISOString();
    stmtCreate.run(id, userId, data.sessionId ?? null, data.questionId ?? null, data.theme ?? null, data.content, now, now);
    return { id, userId, sessionId: data.sessionId, questionId: data.questionId, theme: data.theme, content: data.content, createdAt: now, updatedAt: now };
  }

  findByUser(userId: string): Note[] {
    return (stmtFindByUser.all(userId) as Record<string, unknown>[]).map(mapRow);
  }

  findByTheme(userId: string, theme: string): Note[] {
    return (stmtFindByTheme.all(userId, theme) as Record<string, unknown>[]).map(mapRow);
  }

  findBySession(userId: string, sessionId: string): Note[] {
    return (stmtFindBySession.all(userId, sessionId) as Record<string, unknown>[]).map(mapRow);
  }

  update(id: string, userId: string, content: string): Note | undefined {
    const now = new Date().toISOString();
    stmtUpdate.run(content, now, id, userId);
    const row = stmtFindById.get(id, userId) as Record<string, unknown> | undefined;
    return row ? mapRow(row) : undefined;
  }

  deleteById(id: string, userId: string): void {
    stmtDelete.run(id, userId);
  }
}

export const noteRepository: INoteRepository = new SqliteNoteRepository();
