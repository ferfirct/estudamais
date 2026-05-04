import { Router, type Response } from 'express';
import { sessionDb, streakFreezeDb } from '../services/database.js';
import { requireAuth, type AuthRequest } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

router.get('/', (req: AuthRequest, res: Response) => {
  const sessions = sessionDb.list(req.userId!);
  const today = todayISO();

  const daysWithSession = new Set<string>();
  for (const s of sessions) {
    if (s.quizCompleted) {
      daysWithSession.add(s.createdAt.slice(0, 10));
    }
  }

  let currentStreak = 0;
  const d = new Date();
  for (let i = 0; i < 365; i++) {
    const dateStr = d.toISOString().slice(0, 10);
    if (daysWithSession.has(dateStr)) {
      currentStreak++;
    } else if (i > 0) {
      break;
    }
    d.setDate(d.getDate() - 1);
  }

  const sortedDays = Array.from(daysWithSession).sort();
  let longestStreak = 0;
  let tempStreak = 0;
  let prevDate: Date | null = null;
  for (const day of sortedDays) {
    const curr = new Date(day);
    if (prevDate) {
      const diff = Math.floor((curr.getTime() - prevDate.getTime()) / 86400000);
      tempStreak = diff === 1 ? tempStreak + 1 : 1;
    } else {
      tempStreak = 1;
    }
    longestStreak = Math.max(longestStreak, tempStreak);
    prevDate = curr;
  }

  const lastSession = sessions[0];
  const freeze = streakFreezeDb.get(req.userId!);

  res.json({
    currentStreak,
    longestStreak,
    lastSessionDate: lastSession?.createdAt?.slice(0, 10) ?? null,
    streakFrozen: freeze.streakFrozen,
    weeklyFreezeUsed: freeze.weeklyFreezeUsed,
    todayCompleted: daysWithSession.has(today),
  });
});

router.patch('/freeze', (req: AuthRequest, res: Response) => {
  const today = todayISO();
  const now = new Date();
  const freeze = streakFreezeDb.get(req.userId!);

  if (now.getDay() === 0 && freeze.weekResetDate !== today) {
    freeze.weeklyFreezeUsed = false;
    freeze.weekResetDate = today;
  }

  if (freeze.weeklyFreezeUsed) {
    res.status(409).json({ error: 'Freeze já usado esta semana.' });
    return;
  }

  freeze.streakFrozen = true;
  freeze.weeklyFreezeUsed = true;
  streakFreezeDb.save(req.userId!, freeze);

  res.json({ success: true, message: 'Freeze ativado! Seu streak está protegido por 1 dia.' });
});

export default router;
