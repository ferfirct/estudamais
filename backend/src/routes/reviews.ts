import { Router, type Response } from 'express';
import { sessionDb } from '../services/database.js';
import { requireAuth, type AuthRequest } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function calcNextReview(score: number, lastDate: string): string {
  let interval: number;
  if (score <= 3) interval = 1;
  else if (score <= 5) interval = 3;
  else if (score <= 6) interval = 7;
  else interval = 14;

  const d = new Date(lastDate);
  d.setDate(d.getDate() + interval);
  return d.toISOString().slice(0, 10);
}

router.get('/due', (req: AuthRequest, res: Response) => {
  const sessions = sessionDb.list(req.userId!);
  const today = todayISO();

  const latestByTheme: Record<string, { score: number; date: string }> = {};
  for (const s of sessions) {
    if (s.score === null) continue;
    const date = s.createdAt;
    if (!latestByTheme[s.theme] || date > latestByTheme[s.theme].date) {
      latestByTheme[s.theme] = { score: s.score, date };
    }
  }

  const due = [];
  for (const [theme, data] of Object.entries(latestByTheme)) {
    const nextReview = calcNextReview(data.score, data.date);
    if (nextReview <= today) {
      const daysOverdue = Math.floor(
        (new Date(today).getTime() - new Date(nextReview).getTime()) / 86400000
      );
      due.push({
        theme,
        lastScore: data.score,
        lastDate: data.date,
        dueDate: nextReview,
        daysOverdue,
        urgency: data.score <= 3 ? 'high' : data.score <= 5 ? 'medium' : 'low',
      });
    }
  }

  due.sort((a, b) => b.daysOverdue - a.daysOverdue || a.lastScore - b.lastScore);
  res.json(due);
});

router.get('/schedule', (req: AuthRequest, res: Response) => {
  const sessions = sessionDb.list(req.userId!);

  const latestByTheme: Record<string, { score: number; date: string }> = {};
  for (const s of sessions) {
    if (s.score === null) continue;
    const date = s.createdAt;
    if (!latestByTheme[s.theme] || date > latestByTheme[s.theme].date) {
      latestByTheme[s.theme] = { score: s.score, date };
    }
  }

  const schedule = Object.entries(latestByTheme).map(([theme, data]) => ({
    theme,
    lastScore: data.score,
    lastDate: data.date,
    nextReview: calcNextReview(data.score, data.date),
    urgency: data.score <= 3 ? 'high' : data.score <= 5 ? 'medium' : 'low',
  }));

  schedule.sort((a, b) => a.nextReview.localeCompare(b.nextReview));
  res.json(schedule);
});

export default router;
