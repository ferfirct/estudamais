export interface ThemeRecord {
  theme: string;
  bestEfficiency: number;
  bestScore: number;
  shortestTimeForGoodScore: number | null;
  recordDate: string;
  sessionsCount: number;
  avgScore: number;
}

export interface ThemeRecordDetail extends ThemeRecord {
  history: Array<{
    date: string;
    score: number | null;
    durationMinutes: number;
    efficiency: number;
  }>;
}
