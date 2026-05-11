export interface WeekStats {
  totalSessions: number;
  totalMinutes: number;
  hoursProcessed: number;
  avgScore: number;
  avgEfficiency: number;
  bestTheme: string | null;
  bestThemeScore: number;
  activity: boolean[];
}

export interface WeekSummary extends WeekStats {
  variation: {
    sessions: number;
    hours: number;
    avgScore: number;
    avgEfficiency: number;
  };
  weekStart: string;
  weekEnd: string;
}
