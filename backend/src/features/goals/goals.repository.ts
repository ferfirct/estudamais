import { randomUUID } from 'node:crypto';
import db from '../../shared/infra/database.js';
import type { ThemeGoal } from './goals.types.js';

export interface IGoalRepository {
  upsert(userId: string, theme: string, targetScore: number): ThemeGoal;
  findByUser(userId: string): ThemeGoal[];
  findByTheme(userId: string, theme: string): ThemeGoal | undefined;
  deleteByTheme(userId: string, theme: string): void;
}

const stmtUpsert = db.prepare(`
  INSERT INTO theme_goals (id, user_id, theme, target_score, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?)
  ON CONFLICT(user_id, theme) DO UPDATE SET
    target_score = excluded.target_score,
    updated_at = excluded.updated_at
`);

const stmtFindByUser = db.prepare(
  'SELECT * FROM theme_goals WHERE user_id = ? ORDER BY theme ASC'
);

const stmtFindByTheme = db.prepare(
  'SELECT * FROM theme_goals WHERE user_id = ? AND theme = ?'
);

const stmtDelete = db.prepare(
  'DELETE FROM theme_goals WHERE user_id = ? AND theme = ?'
);

function mapRow(row: Record<string, unknown>): ThemeGoal {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    theme: row.theme as string,
    targetScore: row.target_score as number,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

class SqliteGoalRepository implements IGoalRepository {
  upsert(userId: string, theme: string, targetScore: number): ThemeGoal {
    const id = randomUUID();
    const now = new Date().toISOString();
    stmtUpsert.run(id, userId, theme, targetScore, now, now);
    return this.findByTheme(userId, theme)!;
  }

  findByUser(userId: string): ThemeGoal[] {
    const rows = stmtFindByUser.all(userId) as Array<Record<string, unknown>>;
    return rows.map(mapRow);
  }

  findByTheme(userId: string, theme: string): ThemeGoal | undefined {
    const row = stmtFindByTheme.get(userId, theme) as Record<string, unknown> | undefined;
    return row ? mapRow(row) : undefined;
  }

  deleteByTheme(userId: string, theme: string): void {
    stmtDelete.run(userId, theme);
  }
}

export const goalRepository: IGoalRepository = new SqliteGoalRepository();
