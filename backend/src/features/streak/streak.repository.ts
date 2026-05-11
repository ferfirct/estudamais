import db from '../../shared/infra/database.js';
import type { FreezeState } from './streak.types.js';

export interface IStreakRepository {
  getFreezeState(userId: string): FreezeState;
  saveFreezeState(userId: string, state: FreezeState): void;
}

const stmtGet = db.prepare('SELECT * FROM streak_freeze WHERE user_id = ?');
const stmtUpsert = db.prepare(`
  INSERT INTO streak_freeze (user_id, streak_frozen, weekly_freeze_used, week_reset_date)
  VALUES (@userId, @streakFrozen, @weeklyFreezeUsed, @weekResetDate)
  ON CONFLICT(user_id) DO UPDATE SET
    streak_frozen = excluded.streak_frozen,
    weekly_freeze_used = excluded.weekly_freeze_used,
    week_reset_date = excluded.week_reset_date
`);

class SqliteStreakRepository implements IStreakRepository {
  getFreezeState(userId: string): FreezeState {
    const row = stmtGet.get(userId) as Record<string, unknown> | undefined;
    if (!row) return { streakFrozen: false, weeklyFreezeUsed: false, weekResetDate: null };
    return {
      streakFrozen: row.streak_frozen === 1,
      weeklyFreezeUsed: row.weekly_freeze_used === 1,
      weekResetDate: (row.week_reset_date as string) ?? null,
    };
  }

  saveFreezeState(userId: string, state: FreezeState): void {
    stmtUpsert.run({
      userId,
      streakFrozen: state.streakFrozen ? 1 : 0,
      weeklyFreezeUsed: state.weeklyFreezeUsed ? 1 : 0,
      weekResetDate: state.weekResetDate,
    });
  }
}

export const streakRepository: IStreakRepository = new SqliteStreakRepository();
