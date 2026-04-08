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
