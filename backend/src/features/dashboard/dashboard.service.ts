import type { StudySession } from '../session/session.types.js';
import { isSessionScoreCritical } from '../session/session.domain.js';
import type { DashboardStats, ThemeStat } from './dashboard.types.js';

function calculateAverageScore(sessions: StudySession[]): number {
  const scored = sessions.filter((s) => s.score !== null);
  if (scored.length === 0) return 0;
  return Number((scored.reduce((acc, s) => acc + (s.score ?? 0), 0) / scored.length).toFixed(2));
}

function calculateAverageEfficiency(sessions: StudySession[]): number {
  const withEfficiency = sessions.filter((s) => s.efficiencyIndex !== null);
  if (withEfficiency.length === 0) return 0;
  return Number(
    (withEfficiency.reduce((acc, s) => acc + (s.efficiencyIndex ?? 0), 0) / withEfficiency.length).toFixed(2)
  );
}

function groupByTheme(sessions: StudySession[]): ThemeStat[] {
  const grouped = new Map<string, { count: number; scoreSum: number; scored: number }>();
  for (const s of sessions) {
    const entry = grouped.get(s.theme) ?? { count: 0, scoreSum: 0, scored: 0 };
    entry.count += 1;
    if (s.score !== null) { entry.scoreSum += s.score; entry.scored += 1; }
    grouped.set(s.theme, entry);
  }
  return Array.from(grouped.entries()).map(([theme, v]) => ({
    theme,
    count: v.count,
    avgScore: v.scored > 0 ? Number((v.scoreSum / v.scored).toFixed(2)) : 0,
  }));
}

export function buildDashboardStats(sessions: StudySession[]): DashboardStats {
  return {
    totalSessions: sessions.length,
    averageScore: calculateAverageScore(sessions),
    averageEfficiency: calculateAverageEfficiency(sessions),
    sessionsByTheme: groupByTheme(sessions),
    criticalThemes: sessions.filter((s) => s.score !== null && isSessionScoreCritical(s.score!)),
  };
}
