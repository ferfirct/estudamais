// Estuda+ — App shell. Navegação, estado global e toaster.
import { useEffect, useMemo, useState } from 'react';
import { GraduationCap, Timer, BarChart3, Flame } from 'lucide-react';
import SessionView from './views/SessionView.jsx';
import QuizView from './views/QuizView.jsx';
import DashboardView from './views/DashboardView.jsx';
import { Toaster } from './ui.jsx';
import {
  loadSessions,
  saveSessions,
  loadDailyGoal,
  saveDailyGoal,
  computeInsights,
  toast,
  loadStreak,
  updateStreak,
  isStreakAtRisk,
  scheduleStreakCheck,
  requestNotificationPermission,
} from './lib.js';

export default function App() {
  const [view, setView] = useState('session'); // session | quiz | dashboard
  const [sessions, setSessions] = useState(() => loadSessions());
  const [pendingSession, setPendingSession] = useState(null);
  const [dailyGoal, setDailyGoal] = useState(() => loadDailyGoal());
  const [streak, setStreak] = useState(() => loadStreak());

  useEffect(() => saveSessions(sessions), [sessions]);
  useEffect(() => saveDailyGoal(dailyGoal), [dailyGoal]);
  useEffect(() => {
    const s = updateStreak(sessions);
    setStreak(s);
  }, [sessions]);

  const insights = useMemo(() => computeInsights(sessions), [sessions]);
  const recentThemes = useMemo(() => {
    const seen = new Set();
    const out = [];
    for (const s of [...sessions].reverse()) {
      if (!seen.has(s.topic)) {
        seen.add(s.topic);
        out.push(s.topic);
      }
    }
    return out;
  }, [sessions]);

  const handleSessionFinish = (data) => {
    setPendingSession(data);
    setView('quiz');
  };

  const handleQuizComplete = (full) => {
    setSessions((prev) => [...prev, full]);
    setPendingSession(null);
    if (full.startNew) {
      setView('session');
    } else {
      setView('dashboard');
    }
    toast({
      title: 'Sessão salva',
      description: `${full.topic} · score ${full.score ?? '—'}`,
      variant: 'success',
    });
    // Update streak
    const newStreak = updateStreak([...sessions, full]);
    setStreak(newStreak);
    // Streak toast
    if (newStreak.currentStreak > 0 && full.score != null) {
      const prev = streak.currentStreak;
      if (newStreak.currentStreak > prev) {
        toast({
          title: `🔥 Streak: ${newStreak.currentStreak} ${newStreak.currentStreak === 1 ? 'dia' : 'dias'}!`,
          description: newStreak.currentStreak === newStreak.longestStreak && newStreak.currentStreak > 1
            ? 'Novo recorde de streak!'
            : 'Continue medindo para manter seu streak.',
          variant: 'success',
          duration: 5000,
        });
      }
    }
    // Schedule notification + request permission after 2nd session
    scheduleStreakCheck(newStreak);
    if (sessions.length >= 1) requestNotificationPermission();
  };

  const handleSkipQuiz = () => {
    if (pendingSession) {
      setSessions((prev) => [
        ...prev,
        { ...pendingSession, score: null, gaps: null, strengths: null },
      ]);
    }
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
      // preset vira pré-preenchimento — simples por enquanto
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

  const navItems = [
    { key: 'session', label: 'Medir', icon: Timer },
    { key: 'dashboard', label: 'Perfil', icon: BarChart3, badge: sessions.length },
  ];

  return (
    <>
      {/* Header */}
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
              <span className="block text-2xs text-text-muted mt-0.5">
                Meça sua eficiência cognitiva
              </span>
            </div>
          </button>

          {/* Streak badge */}
          {streak.currentStreak > 0 && (
            <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-sm font-semibold transition-all ${
              isStreakAtRisk(streak)
                ? 'bg-warning-soft border border-warning/30 text-warning animate-pulse'
                : 'bg-surface-2 border border-border text-text-secondary'
            }`}>
              <Flame size={14} className={isStreakAtRisk(streak) ? 'text-warning' : 'text-warning'} />
              <span className="tabular font-mono">{streak.currentStreak}</span>
              {isStreakAtRisk(streak) && (
                <span className="text-2xs ml-0.5">em risco</span>
              )}
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
                  onClick={() => {
                    if (disabled) return;
                    setView(item.key);
                  }}
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

      {/* Main */}
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
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-auto">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-2xs text-text-dim">
            Estuda+ · <span className="font-mono">E = nota ÷ horas</span>
          </p>
          <p className="text-2xs text-text-dim">
            Feito com <span className="text-accent">React</span> +{' '}
            <span className="text-accent">Tailwind</span> +{' '}
            <span className="text-accent">Claude</span>
          </p>
        </div>
      </footer>

      <Toaster />
    </>
  );
}
