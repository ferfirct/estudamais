import { Router, type Request, type Response } from 'express';
import { db } from '../services/database.js';

const router = Router();

interface ThemeRecord {
  theme: string;
  bestEfficiency: number;
  bestScore: number;
  shortestTimeForGoodScore: number | null;
  recordDate: string;
  sessionsCount: number;
  scores: number[];
}

function computeRecords(): Record<string, ThemeRecord> {
  const sessions = db.listSessions();
  const records: Record<string, ThemeRecord> = {};

  for (const s of sessions) {
    if (s.score === null) continue;
    const efficiency = s.durationMinutes > 0
      ? Number((s.score / (s.durationMinutes / 60)).toFixed(2))
      : 0;

    if (!records[s.theme]) {
      records[s.theme] = {
        theme: s.theme,
        bestEfficiency: efficiency,
        bestScore: s.score,
        shortestTimeForGoodScore: s.score >= 7 ? s.durationMinutes : null,
        recordDate: s.createdAt,
        sessionsCount: 0,
        scores: [],
      };
    }

    const rec = records[s.theme];
    rec.sessionsCount++;
    rec.scores.push(s.score);

    if (efficiency > rec.bestEfficiency) {
      rec.bestEfficiency = efficiency;
      rec.recordDate = s.createdAt;
    }
    if (s.score > rec.bestScore) {
      rec.bestScore = s.score;
    }
    if (s.score >= 7) {
      if (rec.shortestTimeForGoodScore === null || s.durationMinutes < rec.shortestTimeForGoodScore) {
        rec.shortestTimeForGoodScore = s.durationMinutes;
      }
    }
  }

  return records;
}

// GET /api/records — all themes' personal records
router.get('/', (_req: Request, res: Response) => {
  const records = computeRecords();
  const result = Object.values(records).map(({ scores, ...rest }) => ({
    ...rest,
    avgScore: scores.length > 0
      ? Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2))
      : 0,
  }));
  res.json(result);
});

// GET /api/records/:theme — specific theme details
router.get('/:theme', (req: Request, res: Response) => {
  const records = computeRecords();
  const theme = decodeURIComponent(req.params.theme);
  const record = records[theme];

  if (!record) {
    res.status(404).json({ error: 'Tema não encontrado' });
    return;
  }

  // Build history for this theme
  const sessions = db.listSessions()
    .filter((s) => s.theme === theme && s.score !== null)
    .map((s) => ({
      date: s.createdAt,
      score: s.score,
      durationMinutes: s.durationMinutes,
      efficiency: s.durationMinutes > 0
        ? Number(((s.score ?? 0) / (s.durationMinutes / 60)).toFixed(2))
        : 0,
    }));

  res.json({
    ...record,
    avgScore: record.scores.length > 0
      ? Number((record.scores.reduce((a, b) => a + b, 0) / record.scores.length).toFixed(2))
      : 0,
    history: sessions,
  });
});

export default router;
