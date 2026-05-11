import type { StudySession } from '../session/session.types.js';

export interface ThemeStat {
  theme: string;
  count: number;
  avgScore: number;
}

export interface DashboardStats {
  totalSessions: number;
  averageScore: number;
  averageEfficiency: number;
  sessionsByTheme: ThemeStat[];
  criticalThemes: StudySession[];
}
