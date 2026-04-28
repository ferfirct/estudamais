// Estuda+ — utilidades compartilhadas: formatters, storage, hooks, stats.
import { useCallback, useEffect, useRef, useState } from 'react';

/* ═══════════════════════════════════════════════════════════════
   FORMATTERS
   ═══════════════════════════════════════════════════════════════ */

export function formatTime(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n) => String(n).padStart(2, '0');
  if (h > 0) return `${h}:${pad(m)}:${pad(sec)}`;
  return `${pad(m)}:${pad(sec)}`;
}

export function formatMinutes(seconds) {
  const m = Math.floor(seconds / 60);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem > 0 ? `${h}h ${rem}min` : `${h}h`;
}

export function formatDate(iso) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatRelative(iso) {
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'agora mesmo';
  if (minutes < 60) return `${minutes}min atrás`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h atrás`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'ontem';
  if (days < 7) return `${days} dias atrás`;
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

export function calcEfficiency(score, seconds) {
  const hours = seconds / 3600;
  if (hours === 0 || score == null) return 0;
  return Math.round((score / hours) * 10) / 10;
}

export function scoreColor(score) {
  if (score == null) return 'text-text-muted';
  if (score >= 8) return 'text-accent';
  if (score >= 6) return 'text-info';
  if (score >= 4) return 'text-warning';
  return 'text-danger';
}

export function scoreBg(score) {
  if (score == null) return 'bg-surface-3 border-border';
  if (score >= 8) return 'bg-accent-soft border-accent-border';
  if (score >= 6) return 'bg-info-soft border-info/30';
  if (score >= 4) return 'bg-warning-soft border-warning/30';
  return 'bg-danger-soft border-danger/30';
}

/* ═══════════════════════════════════════════════════════════════
   STORAGE
   ═══════════════════════════════════════════════════════════════ */

const STORAGE_KEY = 'estudaplus:sessions:v2';
const GOAL_KEY = 'estudaplus:dailyGoal';

export function loadSessions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveSessions(sessions) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch {
    /* quota exceeded — ignora */
  }
}

export function loadDailyGoal() {
  const v = Number(localStorage.getItem(GOAL_KEY));
  return Number.isFinite(v) && v > 0 ? v : 60;
}

export function saveDailyGoal(minutes) {
  localStorage.setItem(GOAL_KEY, String(minutes));
}

/* ═══════════════════════════════════════════════════════════════
   STATS & INSIGHTS
   ═══════════════════════════════════════════════════════════════ */

export function computeInsights(sessions) {
  const total = sessions.length;
  const scored = sessions.filter((s) => s.score != null);
  const totalSeconds = sessions.reduce((acc, s) => acc + (s.duration || 0), 0);
  const avgScore =
    scored.length > 0
      ? Math.round((scored.reduce((acc, s) => acc + s.score, 0) / scored.length) * 10) / 10
      : 0;
  const avgEfficiency =
    scored.length > 0
      ? Math.round(
          (scored.reduce((acc, s) => acc + calcEfficiency(s.score, s.duration), 0) /
            scored.length) *
            10
        ) / 10
      : 0;

  // Streak — dias consecutivos com ao menos uma sessão
  const daysWithSession = new Set(
    sessions.map((s) => new Date(s.startedAt).toDateString())
  );
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    if (daysWithSession.has(d.toDateString())) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }

  // Hoje
  const todayStr = today.toDateString();
  const todaySessions = sessions.filter(
    (s) => new Date(s.startedAt).toDateString() === todayStr
  );
  const todayMinutes = Math.round(
    todaySessions.reduce((acc, s) => acc + (s.duration || 0), 0) / 60
  );

  // Por tema
  const themeMap = new Map();
  for (const s of sessions) {
    const t = themeMap.get(s.topic) || { theme: s.topic, count: 0, scoreSum: 0, scored: 0, duration: 0 };
    t.count++;
    t.duration += s.duration || 0;
    if (s.score != null) {
      t.scoreSum += s.score;
      t.scored++;
    }
    themeMap.set(s.topic, t);
  }
  const themes = Array.from(themeMap.values()).map((t) => ({
    theme: t.theme,
    count: t.count,
    duration: t.duration,
    avgScore: t.scored > 0 ? Math.round((t.scoreSum / t.scored) * 10) / 10 : null,
  }));

  const bestTheme = themes
    .filter((t) => t.avgScore != null)
    .sort((a, b) => b.avgScore - a.avgScore)[0];
  const worstTheme = themes
    .filter((t) => t.avgScore != null && t.avgScore < 6)
    .sort((a, b) => a.avgScore - b.avgScore)[0];

  const criticalThemes = themes.filter((t) => t.avgScore != null && t.avgScore < 6);

  return {
    total,
    totalSeconds,
    avgScore,
    avgEfficiency,
    streak,
    todayMinutes,
    themes,
    bestTheme,
    worstTheme,
    criticalThemes,
  };
}

export function buildEvolutionSeries(sessions) {
  return sessions
    .filter((s) => s.score != null)
    .slice()
    .sort((a, b) => new Date(a.startedAt) - new Date(b.startedAt))
    .map((s, i) => ({
      index: i + 1,
      date: new Date(s.startedAt).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
      }),
      score: s.score,
      efficiency: calcEfficiency(s.score, s.duration),
      topic: s.topic,
    }));
}

/* ═══════════════════════════════════════════════════════════════
   HOOKS
   ═══════════════════════════════════════════════════════════════ */

export function useTimer() {
  const [elapsed, setElapsed] = useState(0);
  const [status, setStatus] = useState('idle'); // idle | running | paused
  const intervalRef = useRef(null);
  const startRef = useRef(null);

  useEffect(() => {
    if (status === 'running') {
      startRef.current = Date.now() - elapsed * 1000;
      intervalRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
      }, 200);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  return {
    elapsed,
    status,
    start: () => setStatus('running'),
    pause: () => setStatus('paused'),
    resume: () => setStatus('running'),
    reset: () => {
      setStatus('idle');
      setElapsed(0);
    },
    finish: () => {
      setStatus('idle');
      const final = elapsed;
      setElapsed(0);
      return final;
    },
  };
}

export function useKeyboard(handlers, deps = []) {
  useEffect(() => {
    const onKey = (e) => {
      // ignora se estiver digitando
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target.isContentEditable) {
        if (e.key !== 'Escape') return;
      }
      const key = e.key === ' ' ? 'Space' : e.key;
      const handler = handlers[key];
      if (handler) {
        e.preventDefault();
        handler(e);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/* ═══════════════════════════════════════════════════════════════
   TOAST — mini store global
   ═══════════════════════════════════════════════════════════════ */

let toastId = 0;
const toastListeners = new Set();
let toastState = [];

export function toast({ title, description, variant = 'default', duration = 4000 }) {
  const id = ++toastId;
  toastState = [...toastState, { id, title, description, variant }];
  toastListeners.forEach((l) => l(toastState));
  if (duration > 0) {
    setTimeout(() => dismissToast(id), duration);
  }
  return id;
}

export function dismissToast(id) {
  toastState = toastState.filter((t) => t.id !== id);
  toastListeners.forEach((l) => l(toastState));
}

export function useToasts() {
  const [toasts, setToasts] = useState(toastState);
  useEffect(() => {
    toastListeners.add(setToasts);
    return () => toastListeners.delete(setToasts);
  }, []);
  return toasts;
}

/* ═══════════════════════════════════════════════════════════════
   CONFETTI
   ═══════════════════════════════════════════════════════════════ */

export function fireConfetti() {
  const container = document.createElement('div');
  container.className = 'confetti-container';
  document.body.appendChild(container);

  const colors = ['#22d3a7', '#38bdf8', '#f59e0b', '#f43f5e', '#a78bfa', '#22c55e'];
  const pieces = 80;
  for (let i = 0; i < pieces; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.animationDelay = `${Math.random() * 0.4}s`;
    piece.style.animationDuration = `${2.4 + Math.random() * 1.2}s`;
    piece.style.transform = `rotate(${Math.random() * 360}deg)`;
    piece.style.borderRadius = Math.random() > 0.5 ? '2px' : '50%';
    container.appendChild(piece);
  }

  setTimeout(() => container.remove(), 4000);
}

/* ═══════════════════════════════════════════════════════════════
   EXPORT
   ═══════════════════════════════════════════════════════════════ */

export function exportSessionsJson(sessions) {
  const blob = new Blob([JSON.stringify(sessions, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `estudamais-sessions-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/* ═══════════════════════════════════════════════════════════════
   STREAK SYSTEM — loss aversion
   ═══════════════════════════════════════════════════════════════ */

const STREAK_KEY = 'estudaplus:streak:v1';

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function yesterdayISO() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

function daysBetween(a, b) {
  const da = new Date(a);
  const db = new Date(b);
  return Math.floor((db - da) / 86400000);
}

export function loadStreak() {
  try {
    const raw = localStorage.getItem(STREAK_KEY);
    if (!raw) return defaultStreak();
    return JSON.parse(raw);
  } catch {
    return defaultStreak();
  }
}

function defaultStreak() {
  return {
    currentStreak: 0,
    longestStreak: 0,
    lastSessionDate: null,
    streakFrozen: false,
    weeklyFreezeUsed: false,
    weekResetDate: null,
  };
}

export function saveStreak(streak) {
  try {
    localStorage.setItem(STREAK_KEY, JSON.stringify(streak));
  } catch { /* quota */ }
}

export function updateStreak(sessions) {
  const streak = loadStreak();
  const today = todayISO();

  // Reset weekly freeze on Sundays
  const now = new Date();
  if (now.getDay() === 0 && streak.weekResetDate !== today) {
    streak.weeklyFreezeUsed = false;
    streak.weekResetDate = today;
  }

  // Check if user has a session today
  const hasSessionToday = sessions.some(
    (s) => new Date(s.startedAt || s.createdAt).toISOString().slice(0, 10) === today
  );

  if (!hasSessionToday) return streak;

  const yesterday = yesterdayISO();

  if (streak.lastSessionDate === today) {
    // Already counted today
    return streak;
  }

  if (streak.lastSessionDate === yesterday || streak.lastSessionDate === null) {
    // Consecutive or first session ever
    streak.currentStreak += 1;
  } else if (streak.lastSessionDate) {
    const gap = daysBetween(streak.lastSessionDate, today);
    if (gap === 2 && streak.streakFrozen) {
      // Freeze saved us (1 day gap, freeze was active)
      streak.currentStreak += 1;
      streak.streakFrozen = false;
    } else if (gap > 1) {
      // Streak broken
      streak.currentStreak = 1;
    }
  }

  streak.lastSessionDate = today;
  streak.longestStreak = Math.max(streak.longestStreak, streak.currentStreak);
  saveStreak(streak);
  return streak;
}

export function useStreakFreeze() {
  const streak = loadStreak();
  if (streak.weeklyFreezeUsed) return { success: false, message: 'Freeze já usado esta semana.' };
  streak.streakFrozen = true;
  streak.weeklyFreezeUsed = true;
  saveStreak(streak);
  return { success: true, message: 'Freeze ativado! Seu streak está protegido por 1 dia.' };
}

export function isStreakAtRisk(streak) {
  if (!streak.lastSessionDate || streak.currentStreak < 1) return false;
  const today = todayISO();
  if (streak.lastSessionDate === today) return false;
  const yesterday = yesterdayISO();
  return streak.lastSessionDate === yesterday;
}

/* ═══════════════════════════════════════════════════════════════
   PERSONAL RECORDS — PR system (like Strava KOM)
   ═══════════════════════════════════════════════════════════════ */

const RECORDS_KEY = 'estudaplus:records:v1';

export function loadRecords() {
  try {
    const raw = localStorage.getItem(RECORDS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveRecords(records) {
  try {
    localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
  } catch { /* quota */ }
}

export function computeRecords(sessions) {
  const records = {};
  for (const s of sessions) {
    if (s.score == null) continue;
    const e = calcEfficiency(s.score, s.duration);
    const key = s.topic;
    if (!records[key]) {
      records[key] = {
        theme: key,
        bestEfficiency: e,
        bestScore: s.score,
        shortestTimeForGoodScore: s.score >= 7 ? s.duration : null,
        recordDate: s.startedAt || s.answeredAt,
        sessionsCount: 0,
      };
    }
    records[key].sessionsCount += 1;
    if (e > records[key].bestEfficiency) {
      records[key].bestEfficiency = e;
      records[key].recordDate = s.startedAt || s.answeredAt;
    }
    if (s.score > records[key].bestScore) {
      records[key].bestScore = s.score;
    }
    if (s.score >= 7) {
      if (
        records[key].shortestTimeForGoodScore === null ||
        s.duration < records[key].shortestTimeForGoodScore
      ) {
        records[key].shortestTimeForGoodScore = s.duration;
      }
    }
  }
  return records;
}

export function checkNewRecord(topic, efficiency, score, sessions) {
  const records = computeRecords(sessions);
  const existing = records[topic];

  if (!existing || existing.sessionsCount === 0) {
    // First session on this topic — it's a record by default (but only if there's history)
    return { isNewRecord: false, recordType: null, previousBest: null, newBest: null };
  }

  // Check efficiency record
  if (efficiency > existing.bestEfficiency) {
    return {
      isNewRecord: true,
      recordType: 'efficiency',
      previousBest: existing.bestEfficiency,
      newBest: efficiency,
      unit: 'pts/h',
    };
  }

  // Check score record
  if (score > existing.bestScore) {
    return {
      isNewRecord: true,
      recordType: 'score',
      previousBest: existing.bestScore,
      newBest: score,
      unit: '/10',
    };
  }

  return {
    isNewRecord: false,
    recordType: null,
    previousBest: existing.bestEfficiency,
    newBest: efficiency,
    gap: Math.round((existing.bestEfficiency - efficiency) * 10) / 10,
  };
}

/* ═══════════════════════════════════════════════════════════════
   SPACED REPETITION — SM-2 simplified
   ═══════════════════════════════════════════════════════════════ */

const REVIEWS_KEY = 'estudaplus:reviews:v1';

export function calcNextReview(score, lastSessionDate) {
  const intervals = { low: 1, fair: 3, okay: 7, good: 14 };
  let interval;
  if (score <= 3) interval = intervals.low;
  else if (score <= 5) interval = intervals.fair;
  else if (score <= 6) interval = intervals.okay;
  else interval = intervals.good;

  const base = new Date(lastSessionDate);
  base.setDate(base.getDate() + interval);
  return base.toISOString().slice(0, 10);
}

export function getReviewsDue(sessions) {
  const today = todayISO();
  // Group by topic: only latest session per topic matters
  const latestByTopic = {};
  for (const s of sessions) {
    if (s.score == null) continue;
    const date = s.startedAt || s.answeredAt || s.createdAt;
    if (!latestByTopic[s.topic] || date > latestByTopic[s.topic].date) {
      latestByTopic[s.topic] = { ...s, date };
    }
  }

  const due = [];
  for (const [topic, data] of Object.entries(latestByTopic)) {
    const nextReview = calcNextReview(data.score, data.date);
    if (nextReview <= today) {
      due.push({
        theme: topic,
        lastScore: data.score,
        lastDate: data.date,
        dueDate: nextReview,
        daysOverdue: daysBetween(nextReview, today),
        urgency: data.score <= 3 ? 'high' : data.score <= 5 ? 'medium' : 'low',
      });
    }
  }

  return due.sort((a, b) => b.daysOverdue - a.daysOverdue || a.lastScore - b.lastScore);
}

/* ═══════════════════════════════════════════════════════════════
   WEB NOTIFICATIONS — streak risk
   ═══════════════════════════════════════════════════════════════ */

const NOTIF_KEY = 'estudaplus:notif:v1';

export async function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  return Notification.permission === 'granted';
}

export function scheduleStreakCheck(streak) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  if (!streak.lastSessionDate || streak.currentStreak < 2) return;

  // Clear any existing scheduled check
  const existingTimer = Number(localStorage.getItem(NOTIF_KEY));
  if (existingTimer) clearTimeout(existingTimer);

  // Schedule check for 20 hours from now
  const ms = 20 * 60 * 60 * 1000; // 20 hours
  const timerId = setTimeout(() => {
    const currentStreak = loadStreak();
    const today = todayISO();
    if (currentStreak.lastSessionDate !== today && currentStreak.currentStreak > 0) {
      new Notification(`🔥 ${currentStreak.currentStreak} dias em risco`, {
        body: 'Uma sessão rápida para manter seu streak de performance.',
        icon: '/favicon.svg',
        tag: 'streak-risk',
      });
    }
  }, ms);

  try { localStorage.setItem(NOTIF_KEY, String(timerId)); } catch { /* */ }
}
