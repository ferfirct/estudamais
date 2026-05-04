import { Router, type Response } from 'express';
import { sessionDb } from '../services/database.js';
import { requireAuth, type AuthRequest } from '../middleware/auth.js';
import type { DashboardStats } from '../types/index.js';

const router = Router();
router.use(requireAuth);

router.get('/stats', (req: AuthRequest, res: Response) => {
  const sessions = sessionDb.list(req.userId!);
  const scored = sessions.filter((s) => s.score !== null);

  const averageScore =
    scored.length > 0
      ? Number((scored.reduce((acc, s) => acc + (s.score ?? 0), 0) / scored.length).toFixed(2))
      : 0;

  const efficiencySessions = sessions.filter((s) => s.efficiencyIndex !== null);
  const averageEfficiency =
    efficiencySessions.length > 0
      ? Number(
          (
            efficiencySessions.reduce((acc, s) => acc + (s.efficiencyIndex ?? 0), 0) /
            efficiencySessions.length
          ).toFixed(2)
        )
      : 0;

  const grouped = new Map<string, { count: number; scoreSum: number; scored: number }>();
  for (const s of sessions) {
    const entry = grouped.get(s.theme) ?? { count: 0, scoreSum: 0, scored: 0 };
    entry.count += 1;
    if (s.score !== null) {
      entry.scoreSum += s.score;
      entry.scored += 1;
    }
    grouped.set(s.theme, entry);
  }
  const sessionsByTheme = Array.from(grouped.entries()).map(([theme, v]) => ({
    theme,
    count: v.count,
    avgScore: v.scored > 0 ? Number((v.scoreSum / v.scored).toFixed(2)) : 0,
  }));

  const criticalThemes = sessions.filter((s) => s.score !== null && s.score < 6);

  const stats: DashboardStats = {
    totalSessions: sessions.length,
    averageScore,
    averageEfficiency,
    sessionsByTheme,
    criticalThemes,
  };
  res.json(stats);
});

export default router;
