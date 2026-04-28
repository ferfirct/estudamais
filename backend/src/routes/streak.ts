import { Router, type Request, type Response, type NextFunction } from 'express';
import { db } from '../services/database.js';
import fs from 'node:fs';
import path from 'node:path';

const router = Router();

// Freeze state is stored alongside db.json
const FREEZE_PATH = path.resolve(process.cwd(), 'streak-freeze.json');

interface FreezeState {
  streakFrozen: boolean;
  weeklyFreezeUsed: boolean;
  weekResetDate: string | null;
}

function loadFreezeState(): FreezeState {
  try {
    if (fs.existsSync(FREEZE_PATH)) {
      return JSON.parse(fs.readFileSync(FREEZE_PATH, 'utf-8'));
    }
  } catch { /* ignore */ }
  return { streakFrozen: false, weeklyFreezeUsed: false, weekResetDate: null };
}

function saveFreezeState(state: FreezeState): void {
  fs.writeFileSync(FREEZE_PATH, JSON.stringify(state, null, 2));
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

// GET /api/streak — calculates streak from session history
router.get('/', (_req: Request, res: Response) => {
  const sessions = db.listSessions();
  const today = todayISO();

  // Build set of days with at least 1 completed quiz
  const daysWithSession = new Set<string>();
  for (const s of sessions) {
    if (s.quizCompleted) {
      daysWithSession.add(s.createdAt.slice(0, 10));
    }
  }

  // Count consecutive days from today backwards
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

  // Find longest streak ever
  const sortedDays = Array.from(daysWithSession).sort();
  let longestStreak = 0;
  let tempStreak = 0;
  let prevDate: Date | null = null;
  for (const day of sortedDays) {
    const curr = new Date(day);
    if (prevDate) {
      const diff = Math.floor((curr.getTime() - prevDate.getTime()) / 86400000);
      if (diff === 1) {
        tempStreak++;
      } else {
        tempStreak = 1;
      }
    } else {
      tempStreak = 1;
    }
    longestStreak = Math.max(longestStreak, tempStreak);
    prevDate = curr;
  }

  const lastSession = sessions[0]; // already sorted by createdAt desc
  const freeze = loadFreezeState();

  res.json({
    currentStreak,
    longestStreak,
    lastSessionDate: lastSession?.createdAt?.slice(0, 10) ?? null,
    streakFrozen: freeze.streakFrozen,
    weeklyFreezeUsed: freeze.weeklyFreezeUsed,
    todayCompleted: daysWithSession.has(today),
  });
});

// PATCH /api/streak/freeze — activate weekly freeze
router.patch('/freeze', (_req: Request, res: Response) => {
  const today = todayISO();
  const now = new Date();
  const freeze = loadFreezeState();

  // Reset on Sundays
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
  saveFreezeState(freeze);

  res.json({
    success: true,
    message: 'Freeze ativado! Seu streak está protegido por 1 dia.',
  });
});

export default router;
