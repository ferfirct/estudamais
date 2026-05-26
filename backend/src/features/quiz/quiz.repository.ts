import { randomUUID } from 'node:crypto';
import db from '../../shared/infra/database.js';
import type { WrongQuestion } from './quiz.types.js';

export interface IWrongQuestionRepository {
  list(userId: string): WrongQuestion[];
  save(userId: string, input: Omit<WrongQuestion, 'id' | 'savedAt' | 'retried'>): WrongQuestion;
  markRetried(id: string, userId: string): void;
  delete(id: string, userId: string): void;
}

const stmtInsert = db.prepare(`
  INSERT INTO wrong_questions (id, user_id, session_id, theme, question, user_answer, quiz_type, difficulty, saved_at, retried, retried_at)
  VALUES (@id, @userId, @sessionId, @theme, @question, @userAnswer, @quizType, @difficulty, @savedAt, 0, NULL)
`);

const stmtListPending = db.prepare(
  'SELECT * FROM wrong_questions WHERE user_id = ? AND retried = 0 ORDER BY saved_at DESC',
);

const stmtFindDuplicate = db.prepare(
  "SELECT id FROM wrong_questions WHERE user_id = ? AND theme = ? AND json_extract(question, '$.question') = ? AND retried = 0",
);

const stmtMarkRetried = db.prepare(
  'UPDATE wrong_questions SET retried = 1, retried_at = ? WHERE id = ? AND user_id = ?',
);

const stmtDelete = db.prepare('DELETE FROM wrong_questions WHERE id = ? AND user_id = ?');

function mapRow(row: Record<string, unknown>): WrongQuestion {
  return {
    id: row.id as string,
    sessionId: row.session_id as string,
    theme: row.theme as string,
    question: JSON.parse(row.question as string) as WrongQuestion['question'],
    userAnswer: row.user_answer as string,
    quizType: row.quiz_type as WrongQuestion['quizType'],
    difficulty: row.difficulty as WrongQuestion['difficulty'],
    savedAt: row.saved_at as string,
    retried: row.retried === 1,
    retriedAt: (row.retried_at as string | null) ?? undefined,
  };
}

class SqliteWrongQuestionRepository implements IWrongQuestionRepository {
  list(userId: string): WrongQuestion[] {
    const rows = stmtListPending.all(userId);
    return (rows as Record<string, unknown>[]).map(mapRow);
  }

  save(userId: string, input: Omit<WrongQuestion, 'id' | 'savedAt' | 'retried'>): WrongQuestion {
    const dup = stmtFindDuplicate.get(userId, input.theme, input.question.question) as
      | { id: string }
      | undefined;
    if (dup) {
      return { ...input, id: dup.id, savedAt: new Date().toISOString(), retried: false };
    }

    const id = randomUUID();
    const savedAt = new Date().toISOString();
    stmtInsert.run({
      id,
      userId,
      sessionId: input.sessionId,
      theme: input.theme,
      question: JSON.stringify(input.question),
      userAnswer: input.userAnswer,
      quizType: input.quizType,
      difficulty: input.difficulty,
      savedAt,
    });
    return { ...input, id, savedAt, retried: false };
  }

  markRetried(id: string, userId: string): void {
    stmtMarkRetried.run(new Date().toISOString(), id, userId);
  }

  delete(id: string, userId: string): void {
    stmtDelete.run(id, userId);
  }
}

export const wrongQuestionRepository: IWrongQuestionRepository =
  new SqliteWrongQuestionRepository();
