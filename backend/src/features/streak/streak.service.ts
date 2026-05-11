import type { StudySession } from '../session/session.types.js';
import type { FreezeState, StreakInfo } from './streak.types.js';

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function buildDaysWithSession(sessions: StudySession[]): Set<string> {
  const days = new Set<string>();
  for (const s of sessions) {
    if (s.quizCompleted) days.add(s.createdAt.slice(0, 10));
  }
  return days;
}

function calculateCurrentStreak(daysWithSession: Set<string>): number {
  let streak = 0;
  const d = new Date();
  for (let i = 0; i < 365; i++) {
    const dateStr = d.toISOString().slice(0, 10);
    if (daysWithSession.has(dateStr)) {
      streak++;
    } else if (i > 0) {
      break;
    }
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

function calculateLongestStreak(daysWithSession: Set<string>): number {
  const sortedDays = Array.from(daysWithSession).sort();
  let longest = 0;
  let temp = 0;
  let prev: Date | null = null;

  for (const day of sortedDays) {
    const curr = new Date(day);
    if (prev) {
      const diff = Math.floor((curr.getTime() - prev.getTime()) / 86400000);
      temp = diff === 1 ? temp + 1 : 1;
    } else {
      temp = 1;
    }
    longest = Math.max(longest, temp);
    prev = curr;
  }
  return longest;
}

export function calculateStreakInfo(sessions: StudySession[], freeze: FreezeState): StreakInfo {
  const today = todayISO();
  const daysWithSession = buildDaysWithSession(sessions);
  return {
    currentStreak: calculateCurrentStreak(daysWithSession),
    longestStreak: calculateLongestStreak(daysWithSession),
    lastSessionDate: sessions[0]?.createdAt?.slice(0, 10) ?? null,
    streakFrozen: freeze.streakFrozen,
    weeklyFreezeUsed: freeze.weeklyFreezeUsed,
    todayCompleted: daysWithSession.has(today),
  };
}

export function activateFreeze(
  freeze: FreezeState
): { ok: true; updated: FreezeState } | { ok: false; error: string } {
  const today = todayISO();
  const current = { ...freeze };

  if (new Date().getDay() === 0 && current.weekResetDate !== today) {
    current.weeklyFreezeUsed = false;
    current.weekResetDate = today;
  }

  if (current.weeklyFreezeUsed) {
    return { ok: false, error: 'Freeze já usado esta semana.' };
  }

  current.streakFrozen = true;
  current.weeklyFreezeUsed = true;
  return { ok: true, updated: current };
}
