export const CRITICAL_SCORE_THRESHOLD = 6;

export function calculateEfficiencyIndex(score: number, durationMinutes: number): number {
  if (durationMinutes <= 0) return 0;
  return Number((score / (durationMinutes / 60)).toFixed(2));
}

export function isSessionScoreCritical(score: number): boolean {
  return score < CRITICAL_SCORE_THRESHOLD;
}
