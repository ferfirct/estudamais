import { randomUUID } from 'node:crypto';
import db from '../../shared/infra/database.js';
import type { Flashcard } from './flashcards.types.js';

export interface IFlashcardRepository {
  create(userId: string, data: { theme: string; front: string; back: string; difficulty?: 'easy' | 'medium' | 'hard' }): Flashcard;
  createMany(userId: string, cards: Array<{ theme: string; front: string; back: string; difficulty?: 'easy' | 'medium' | 'hard' }>): Flashcard[];
  findByUser(userId: string): Flashcard[];
  findByTheme(userId: string, theme: string): Flashcard[];
  findDueForReview(userId: string): Flashcard[];
  updateReview(id: string, userId: string, remembered: boolean): Flashcard | undefined;
  deleteById(id: string, userId: string): void;
}

const stmtCreate = db.prepare(
  'INSERT INTO flashcards (id, user_id, theme, front, back, difficulty, next_review, review_count, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
);
const stmtFindByUser = db.prepare('SELECT * FROM flashcards WHERE user_id = ? ORDER BY created_at DESC');
const stmtFindByTheme = db.prepare('SELECT * FROM flashcards WHERE user_id = ? AND theme = ? ORDER BY created_at DESC');
const stmtFindDue = db.prepare('SELECT * FROM flashcards WHERE user_id = ? AND next_review <= ? ORDER BY next_review ASC');
const stmtFindById = db.prepare('SELECT * FROM flashcards WHERE id = ? AND user_id = ?');
const stmtUpdateReview = db.prepare('UPDATE flashcards SET next_review = ?, review_count = review_count + 1 WHERE id = ? AND user_id = ?');
const stmtDelete = db.prepare('DELETE FROM flashcards WHERE id = ? AND user_id = ?');

function mapRow(row: Record<string, unknown>): Flashcard {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    theme: row.theme as string,
    front: row.front as string,
    back: row.back as string,
    difficulty: row.difficulty as 'easy' | 'medium' | 'hard',
    nextReview: row.next_review as string,
    reviewCount: row.review_count as number,
    createdAt: row.created_at as string,
  };
}

class SqliteFlashcardRepository implements IFlashcardRepository {
  create(userId: string, data: { theme: string; front: string; back: string; difficulty?: 'easy' | 'medium' | 'hard' }): Flashcard {
    const id = randomUUID();
    const now = new Date().toISOString();
    const diff = data.difficulty ?? 'medium';
    stmtCreate.run(id, userId, data.theme, data.front, data.back, diff, now, 0, now);
    return { id, userId, theme: data.theme, front: data.front, back: data.back, difficulty: diff, nextReview: now, reviewCount: 0, createdAt: now };
  }

  createMany(userId: string, cards: Array<{ theme: string; front: string; back: string; difficulty?: 'easy' | 'medium' | 'hard' }>): Flashcard[] {
    return cards.map(c => this.create(userId, c));
  }

  findByUser(userId: string): Flashcard[] {
    return (stmtFindByUser.all(userId) as Record<string, unknown>[]).map(mapRow);
  }

  findByTheme(userId: string, theme: string): Flashcard[] {
    return (stmtFindByTheme.all(userId, theme) as Record<string, unknown>[]).map(mapRow);
  }

  findDueForReview(userId: string): Flashcard[] {
    const now = new Date().toISOString();
    return (stmtFindDue.all(userId, now) as Record<string, unknown>[]).map(mapRow);
  }

  updateReview(id: string, userId: string, remembered: boolean): Flashcard | undefined {
    const nextDays = remembered ? 3 : 1;
    const nextReview = new Date(Date.now() + nextDays * 24 * 60 * 60 * 1000).toISOString();
    stmtUpdateReview.run(nextReview, id, userId);
    const row = stmtFindById.get(id, userId) as Record<string, unknown> | undefined;
    return row ? mapRow(row) : undefined;
  }

  deleteById(id: string, userId: string): void {
    stmtDelete.run(id, userId);
  }
}

export const flashcardRepository: IFlashcardRepository = new SqliteFlashcardRepository();
