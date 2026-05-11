export interface FreezeState {
  streakFrozen: boolean;
  weeklyFreezeUsed: boolean;
  weekResetDate: string | null;
}

export interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  lastSessionDate: string | null;
  streakFrozen: boolean;
  weeklyFreezeUsed: boolean;
  todayCompleted: boolean;
}
