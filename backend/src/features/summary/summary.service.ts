import type { StudySession } from '../session/session.types.js';
import type { WeekStats, WeekSummary } from './summary.types.js';

function getWeekBounds(weeksAgo = 0): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay() - weeksAgo * 7);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 7);
  return { start, end };
}

function findBestTheme(scored: StudySession[]): { theme: string | null; score: number } {
  const byTheme: Record<string, { scoreSum: number; count: number }> = {};
  for (const s of scored) {
    const t = byTheme[s.theme] ?? { scoreSum: 0, count: 0 };
    t.scoreSum += s.score ?? 0;
    t.count++;
    byTheme[s.theme] = t;
  }
  let bestTheme: string | null = null;
  let bestScore = 0;
  for (const [theme, data] of Object.entries(byTheme)) {
    const avg = data.scoreSum / data.count;
    if (avg > bestScore) { bestScore = avg; bestTheme = theme; }
  }
  return { theme: bestTheme, score: Number(bestScore.toFixed(2)) };
}

function calculateWeekStats(sessions: StudySession[], start: Date, end: Date): WeekStats {
  const week = sessions.filter((s) => { const d = new Date(s.createdAt); return d >= start && d < end; });
  const scored = week.filter((s) => s.score !== null);
  const withEfficiency = week.filter((s) => s.efficiencyIndex !== null);
  const totalMinutes = week.reduce((acc, s) => acc + s.durationMinutes, 0);
  const avgScore = scored.length > 0
    ? Number((scored.reduce((acc, s) => acc + (s.score ?? 0), 0) / scored.length).toFixed(2))
    : 0;
  const avgEfficiency = withEfficiency.length > 0
    ? Number((withEfficiency.reduce((acc, s) => acc + (s.efficiencyIndex ?? 0), 0) / withEfficiency.length).toFixed(2))
    : 0;
  const { theme: bestTheme, score: bestThemeScore } = findBestTheme(scored);
  const activity: boolean[] = Array(7).fill(false);
  for (const s of week) activity[new Date(s.createdAt).getDay()] = true;

  return {
    totalSessions: week.length,
    totalMinutes,
    hoursProcessed: Number((totalMinutes / 60).toFixed(1)),
    avgScore,
    avgEfficiency,
    bestTheme,
    bestThemeScore,
    activity,
  };
}

export function buildWeeklySummary(sessions: StudySession[]): WeekSummary {
  const thisWeek = getWeekBounds(0);
  const lastWeek = getWeekBounds(1);
  const current = calculateWeekStats(sessions, thisWeek.start, thisWeek.end);
  const previous = calculateWeekStats(sessions, lastWeek.start, lastWeek.end);

  return {
    ...current,
    variation: {
      sessions: current.totalSessions - previous.totalSessions,
      hours: Number((current.hoursProcessed - previous.hoursProcessed).toFixed(1)),
      avgScore: Number((current.avgScore - previous.avgScore).toFixed(2)),
      avgEfficiency: Number((current.avgEfficiency - previous.avgEfficiency).toFixed(2)),
    },
    weekStart: thisWeek.start.toISOString().slice(0, 10),
    weekEnd: thisWeek.end.toISOString().slice(0, 10),
  };
}
