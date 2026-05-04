import { useCallback, useEffect, useMemo, useState } from 'react';
import { GraduationCap, Timer, BarChart3, Flame, Settings } from 'lucide-react';
import SessionView from './views/SessionView.jsx';
import QuizView from './views/QuizView.jsx';
import DashboardView from './views/DashboardView.jsx';
import AuthView from './views/AuthView.jsx';
import SettingsView from './views/SettingsView.jsx';
import { Toaster } from './ui.jsx';
import { useTheme } from './hooks/useTheme.js';
import { getMe } from './api/auth.js';
import { getSettings } from './api/settings.js';
import { listSessions } from './api/sessions.js';
import { setToken } from './api/client.js';
import {
  computeInsights,
  toast,
  isStreakAtRisk,
  scheduleStreakCheck,
  requestNotificationPermission,
} from './lib.js';

function mapForInsights(s) {
  return {
    ...s,
    topic: s.theme,
    duration: s.durationMinutes * 60,
    startedAt: s.startTime,
  };
}

export default function App() {
  const [authReady, setAuthReady] = useState(false);
  const [user, setUser] = useState(null);
  const [view, setView] = useState('session');
  const [sessions, setSessions] = useState([]);
  const [pendingSession, setPendingSession] = useState(null);
  const [dailyGoal, setDailyGoal] = useState(60);
  const [streak, setStreak] = useState({ currentStreak: 0, longestStreak: 0 });

  const { theme, setTheme } = useTheme('dark');

  // On mount: check auth
  useEffect(() => {
    getMe()
      .then((u) => {
        setUser(u);
        return Promise.all([
          getSettings().catch(() => null),
          listSessions().catch(() => []),
        ]);
      })
      .then(([settings, apiSessions]) => {
        if (settings) {
          setDailyGoal(settings.dailyGoal ?? 60);
          setTheme(settings.theme ?? 'dark');
        }
        if (apiSessions) setSessions(apiSessions);
      })
      .catch(() => { /* not authenticated */ })
      .finally(() => setAuthReady(true));
  }, []);

  // Listen for 401 logout event
  useEffect(() => {
    function onLogout() {
      setUser(null);
      setSessions([]);
    }
    window.addEventListener('auth:logout', onLogout);
    return () => window.removeEventListener('auth:logout', onLogout);
  }, []);

  const refreshSessions = useCallback(async () => {
    try {
      const data = await listSessions();
      setSessions(data);
    } catch { /* offline */ }
  }, []);

  const insights = useMemo(
    () => computeInsights(sessions.map(mapForInsights)),
    [sessions]
  );

  const recentThemes = useMemo(() => {
    const seen = new Set();
    const out = [];
    for (const s of [...sessions].reverse()) {
      const key = s.theme;
      if (key && !seen.has(key)) {
        seen.add(key);
        out.push(key);
      }
    }
    return out;
  }, [sessions]);

  const handleAuth = (u) => {
    setUser(u);
    Promise.all([getSettings().catch(() => null), listSessions().catch(() => [])])
      .then(([settings, apiSessions]) => {
        if (settings) {
          setDailyGoal(settings.dailyGoal ?? 60);
          setTheme(settings.theme ?? 'dark');
        }
        if (apiSessions) setSessions(apiSessions);
      });
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    setSessions([]);
    setView('session');
  };

  const handleSessionFinish = (data) => {
    setPendingSession(data);
    setView('quiz');
  };

  const handleQuizComplete = async (full) => {
    await refreshSessions();
    setPendingSession(null);
    if (full.startNew) {
      setView('session');
    } else {
      setView('dashboard');
    }
    const theme = full.theme ?? full.topic ?? '';
    toast({
      title: 'Sessão salva',
      description: `${theme} · score ${full.score ?? '—'}`,
      variant: 'success',
    });
    if (full.score != null) {
      const newStreak = { ...streak };
      newStreak.currentStreak = Math.max(streak.currentStreak, 1);
      if (newStreak.currentStreak > streak.currentStreak) {
        toast({
          title: `🔥 Streak: ${newStreak.currentStreak} ${newStreak.currentStreak === 1 ? 'dia' : 'dias'}!`,
          description: 'Continue medindo para manter seu streak.',
          variant: 'success',
          duration: 5000,
        });
      }
      scheduleStreakCheck(newStreak);
    }
    if (sessions.length >= 1) requestNotificationPermission();
  };

  const handleSkipQuiz = async () => {
    await refreshSessions();
    setPendingSession(null);
    setView('dashboard');
  };

  const handleClearHistory = () => {
    if (window.confirm('Tem certeza que deseja limpar todo o histórico?')) {
      setSessions([]);
      toast({ title: 'Histórico limpo', variant: 'info' });
    }
  };

  const handleStartSession = (preset) => {
    setView('session');
    if (preset && typeof preset === 'string') {
      setTimeout(() => {
        const input = document.querySelector('input[aria-label="Tema de performance"]');
        if (input) {
          const nativeSetter = Object.getOwnPropertyDescriptor(
            window.HTMLInputElement.prototype,
            'value'
          ).set;
          nativeSetter.call(input, preset);
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.focus();
        }
      }, 50);
    }
  };

  // Not ready yet — blank screen during auth check
  if (!authReady) return null;

  // Not authenticated — show auth screen
  if (!user) return <AuthView onAuth={handleAuth} />;

  const navItems = [
    { key: 'session', label: 'Medir', icon: Timer },
    { key: 'dashboard', label: 'Perfil', icon: BarChart3, badge: sessions.length },
    { key: 'settings', label: 'Config', icon: Settings },
  ];

  const streakAtRisk = isStreakAtRisk(streak);

  return (
    <>
      <header className="sticky top-0 z-40 glass border-b border-border">
        <div className="max-w-6xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <button
            onClick={() => setView('session')}
            className="flex items-center gap-2.5 group"
            aria-label="Voltar ao início"
          >
            <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-accent via-accent-hover to-info flex items-center justify-center shadow-glow group-hover:shadow-glow-lg transition-shadow">
              <GraduationCap size={18} className="text-bg" strokeWidth={2.5} />
            </div>
            <div className="text-left">
              <span className="block text-lg font-display font-extrabold text-text-primary tracking-tight leading-none">
                Estuda<span className="text-accent">+</span>
              </span>
              <span className="block text-2xs text-text-muted mt-0.5 hidden sm:block">
                Olá, {user.name.split(' ')[0]}
              </span>
            </div>
          </button>

          {streak.currentStreak > 0 && (
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-sm font-semibold transition-all ${
                streakAtRisk
                  ? 'bg-warning-soft border border-warning/30 text-warning animate-pulse'
                  : 'bg-surface-2 border border-border text-text-secondary'
              }`}
            >
              <Flame size={14} className="text-warning" />
              <span className="tabular font-mono">{streak.currentStreak}</span>
              {streakAtRisk && <span className="text-2xs ml-0.5">em risco</span>}
            </div>
          )}

          <nav className="flex items-center gap-1" aria-label="Navegação principal">
            {navItems.map((item) => {
              const active =
                view === item.key || (view === 'quiz' && item.key === 'session');
              const disabled = view === 'quiz';
              return (
                <button
                  key={item.key}
                  onClick={() => { if (!disabled) setView(item.key); }}
                  disabled={disabled}
                  aria-current={active ? 'page' : undefined}
                  className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                    active
                      ? 'bg-accent-soft text-accent border border-accent-border'
                      : 'text-text-muted hover:text-text-primary hover:bg-surface-2 border border-transparent'
                  } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                >
                  <item.icon size={16} />
                  <span className="hidden sm:inline">{item.label}</span>
                  {item.badge > 0 && (
                    <span
                      className={`text-2xs font-mono font-bold rounded-full px-1.5 min-w-[18px] text-center ${
                        active ? 'bg-accent text-bg' : 'bg-surface-3 text-text-secondary'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 md:px-6 py-10 md:py-16 relative z-10">
        {view === 'session' && (
          <SessionView
            onFinish={handleSessionFinish}
            insights={insights}
            dailyGoal={dailyGoal}
            recentThemes={recentThemes}
          />
        )}
        {view === 'quiz' && pendingSession && (
          <QuizView
            sessionData={pendingSession}
            onComplete={handleQuizComplete}
            onSkip={handleSkipQuiz}
            sessions={sessions}
          />
        )}
        {view === 'dashboard' && (
          <DashboardView
            sessions={sessions}
            insights={insights}
            onClearHistory={handleClearHistory}
            onStartSession={handleStartSession}
            onEditGoal={setDailyGoal}
          />
        )}
        {view === 'settings' && (
          <SettingsView
            user={user}
            onLogout={handleLogout}
            onThemeChange={setTheme}
          />
        )}
      </main>

      <footer className="border-t border-border mt-auto">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-2xs text-text-dim">
            Estuda+ · <span className="font-mono">E = nota ÷ horas</span>
          </p>
          <p className="text-2xs text-text-dim">
            Feito com <span className="text-accent">React</span> +{' '}
            <span className="text-accent">Tailwind</span> +{' '}
            <span className="text-accent">Groq</span>
          </p>
        </div>
      </footer>

      <Toaster />
    </>
  );
}
