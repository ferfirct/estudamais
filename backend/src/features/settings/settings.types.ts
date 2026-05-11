export interface UserSettings {
  userId: string;
  theme: 'dark' | 'light' | 'system';
  dailyGoal: number;
  language: string;
  notifications: boolean;
  updatedAt: string;
}

export type UpdateSettingsPatch = Partial<Omit<UserSettings, 'userId' | 'updatedAt'>>;
