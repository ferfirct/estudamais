import db from '../../shared/infra/database.js';
import type { UserSettings, UpdateSettingsPatch } from './settings.types.js';

export interface ISettingsRepository {
  findByUserId(userId: string): UserSettings | undefined;
  update(userId: string, patch: UpdateSettingsPatch): UserSettings | undefined;
}

const stmtGet = db.prepare('SELECT * FROM user_settings WHERE user_id = ?');
const stmtUpdate = db.prepare(`
  UPDATE user_settings SET
    theme = COALESCE(@theme, theme),
    daily_goal = COALESCE(@dailyGoal, daily_goal),
    language = COALESCE(@language, language),
    notifications = COALESCE(@notifications, notifications),
    updated_at = datetime('now')
  WHERE user_id = @userId
`);

function mapRow(row: Record<string, unknown>): UserSettings {
  return {
    userId: row.user_id as string,
    theme: row.theme as 'dark' | 'light' | 'system',
    dailyGoal: row.daily_goal as number,
    language: row.language as string,
    notifications: row.notifications === 1,
    updatedAt: row.updated_at as string,
  };
}

class SqliteSettingsRepository implements ISettingsRepository {
  findByUserId(userId: string): UserSettings | undefined {
    const row = stmtGet.get(userId) as Record<string, unknown> | undefined;
    return row ? mapRow(row) : undefined;
  }

  update(userId: string, patch: UpdateSettingsPatch): UserSettings | undefined {
    stmtUpdate.run({
      userId,
      theme: patch.theme ?? null,
      dailyGoal: patch.dailyGoal ?? null,
      language: patch.language ?? null,
      notifications: patch.notifications === undefined ? null : patch.notifications ? 1 : 0,
    });
    return this.findByUserId(userId);
  }
}

export const settingsRepository: ISettingsRepository = new SqliteSettingsRepository();
