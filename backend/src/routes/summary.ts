import { Router, type Response } from 'express';
import { sessionDb } from '../services/database.js';
import { requireAuth, type AuthRequest } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

function getWeekBounds(weeksAgo = 0): { start: Date; end: Date } {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - dayOfWeek - weeksAgo * 7);
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);
  return { start: startOfWeek, end: endOfWeek };
}

router.get('/weekly', (req: AuthRequest, res: Response) => {
  const sessions = sessionDb.list(req.userId!);
  const thisWeek = getWeekBounds(0);
  const lastWeek = getWeekBounds(1);

  function weekStats(start: Date, end: Date) {
    const weekSessions = sessions.filter((s) => {
      const d = new Date(s.createdAt);
      return d >= start && d < end;
    });

    const totalSessions = weekSessions.length;
    const totalMinutes = weekSessions.reduce((acc, s) => acc + s.durationMinutes, 0);
    const scored = weekSessions.filter((s) => s.score !== null);
    const avgScore = scored.length > 0
      ? Number((scored.reduce((acc, s) => acc + (s.score ?? 0), 0) / scored.length).toFixed(2))
      : 0;
    const withEfficiency = weekSessions.filter((s) => s.efficiencyIndex !== null);
    const avgEfficiency = withEfficiency.length > 0
      ? Number((withEfficiency.reduce((acc, s) => acc + (s.efficiencyIndex ?? 0), 0) / withEfficiency.length).toFixed(2))
      : 0;

    const byTheme: Record<string, { scoreSum: number; count: number }> = {};
    for (const s of scored) {
      const t = byTheme[s.theme] ?? { scoreSum: 0, count: 0 };
      t.scoreSum += s.score ?? 0;
      t.count++;
      byTheme[s.theme] = t;
    }
    let bestTheme: string | null = null;
    let bestThemeScore = 0;
    for (const [theme, data] of Object.entries(byTheme)) {
      const avg = data.scoreSum / data.count;
      if (avg > bestThemeScore) { bestThemeScore = avg; bestTheme = theme; }
    }

    const activity: boolean[] = Array(7).fill(false);
    for (const s of weekSessions) {
      activity[new Date(s.createdAt).getDay()] = true;
    }

    return {
      totalSessions,
      totalMinutes,
      hoursProcessed: Number((totalMinutes / 60).toFixed(1)),
      avgScore,
      avgEfficiency,
      bestTheme,
      bestThemeScore: Number(bestThemeScore.toFixed(2)),
      activity,
    };
  }

  const current = weekStats(thisWeek.start, thisWeek.end);
  const previous = weekStats(lastWeek.start, lastWeek.end);

  const variation = {
    sessions: current.totalSessions - previous.totalSessions,
    hours: Number((current.hoursProcessed - previous.hoursProcessed).toFixed(1)),
    avgScore: Number((current.avgScore - previous.avgScore).toFixed(2)),
    avgEfficiency: Number((current.avgEfficiency - previous.avgEfficiency).toFixed(2)),
  };

  res.json({
    ...current,
    variation,
    weekStart: thisWeek.start.toISOString().slice(0, 10),
    weekEnd: thisWeek.end.toISOString().slice(0, 10),
  });
});

export default router;
