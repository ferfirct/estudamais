import { Router, type Request, type Response } from 'express';
import { db } from '../services/database.js';

const router = Router();

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

// GET /api/reviews/due — themes needing review today or overdue
router.get('/due', (_req: Request, res: Response) => {
  const sessions = db.listSessions();
  const today = todayISO();

  // Group by theme: only latest scored session matters
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

// GET /api/reviews/schedule — full review calendar
router.get('/schedule', (_req: Request, res: Response) => {
  const sessions = db.listSessions();

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
