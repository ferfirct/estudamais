// Tela de sessão de performance — topic picker + cronômetro circular + modo foco.
import { useState, useMemo } from 'react';
import {
  Play,
  Pause,
  Square,
  BookOpen,
  Sparkles,
  Eye,
  Timer,
  Target,
  Flame,
  TrendingUp,
  RotateCcw,
  Zap,
} from 'lucide-react';
import { Button, IconButton, Card, Input, Badge, ProgressBar } from '../ui.jsx';
import { formatTime, formatMinutes, useTimer, useKeyboard, toast } from '../lib.js';

const QUICK_SUGGESTIONS = [
  'Matemática',
  'Português',
  'Física',
  'História',
  'Biologia',
  'Química',
  'Geografia',
  'Filosofia',
];

const POMODORO_PRESETS = [
  { label: 'Rápido', minutes: 15, description: 'Medição rápida' },
  { label: 'Pomodoro', minutes: 25, description: 'Clássico' },
  { label: 'Foco', minutes: 45, description: 'Deep work' },
  { label: 'Maratona', minutes: 90, description: 'Tópicos densos' },
];

export default function SessionView({ onFinish, insights, dailyGoal, recentThemes }) {
  const [topic, setTopic] = useState('');
  const [targetMinutes, setTargetMinutes] = useState(25);
  const timer = useTimer();

  const progress = useMemo(() => {
    const targetSec = targetMinutes * 60;
    return Math.min(100, (timer.elapsed / targetSec) * 100);
  }, [timer.elapsed, targetMinutes]);

  const circumference = 2 * Math.PI * 130;
  const dashOffset = circumference - (progress / 100) * circumference;

  const dailyProgress = Math.min(100, (insights.todayMinutes / dailyGoal) * 100);

  useKeyboard(
    {
      Space: () => {
        if (timer.status === 'idle' && topic.trim()) handleStart();
        else if (timer.status === 'running') timer.pause();
        else if (timer.status === 'paused') timer.resume();
      },
      Escape: () => {
        if (timer.status !== 'idle') {
          if (window.confirm('Cancelar a sessão atual?')) {
            timer.reset();
            toast({ title: 'Sessão cancelada', variant: 'info' });
          }
        }
      },
    },
    [timer.status, topic]
  );

  const handleStart = () => {
    if (!topic.trim()) {
      toast({ title: 'Digite um tema primeiro', variant: 'warning' });
      return;
    }
    timer.start();
  };

  const handleFinish = () => {
    const final = timer.finish();
    if (final < 10) {
      toast({
        title: 'Sessão muito curta',
        description: 'Processe por pelo menos 10 segundos.',
        variant: 'warning',
      });
      return;
    }
    onFinish({
      topic: topic.trim(),
      duration: final,
      targetMinutes,
      startedAt: new Date().toISOString(),
    });
    setTopic('');
  };

  // ──────────────────────────────────────────────────────────
  // TELA 1: Configuração da sessão
  // ──────────────────────────────────────────────────────────
  if (timer.status === 'idle') {
    return (
      <div className="animate-in max-w-4xl mx-auto">
        {/* KPIs do dia */}
        <div className="grid grid-cols-3 gap-3 mb-10">
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Flame size={14} className="text-warning" />
              <span className="text-2xs font-semibold uppercase tracking-wider text-text-muted">
                Streak
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-display font-bold text-text-primary tabular">
                {insights.streak}
              </span>
              <span className="text-xs text-text-muted">
                {insights.streak === 1 ? 'dia' : 'dias'}
              </span>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target size={14} className="text-accent" />
              <span className="text-2xs font-semibold uppercase tracking-wider text-text-muted">
                Meta hoje
              </span>
            </div>
            <div className="flex items-baseline gap-1 mb-2">
              <span className="text-2xl font-display font-bold text-text-primary tabular">
                {insights.todayMinutes}
              </span>
              <span className="text-xs text-text-muted">/ {dailyGoal} min</span>
            </div>
            <ProgressBar value={dailyProgress} />
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={14} className="text-info" />
              <span className="text-2xs font-semibold uppercase tracking-wider text-text-muted">
                Eficiência
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-display font-bold text-text-primary tabular">
                {insights.avgEfficiency || '—'}
              </span>
              <span className="text-xs text-text-muted">pts/h</span>
            </div>
          </Card>
        </div>

        {/* Hero */}
        <div className="text-center mb-8">
          <Badge variant="accent" icon={Sparkles} className="mb-5">
            Nova sessão de performance
          </Badge>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-text-primary mb-3 tracking-tight">
            O que você vai{' '}
            <span className="bg-gradient-to-r from-accent to-info bg-clip-text text-transparent">
              processar
            </span>{' '}
            hoje?
          </h1>
          <p className="text-text-muted text-lg">
            Escolha um tema, ajuste o tempo e a IA mede sua retenção no final.
          </p>
        </div>

        {/* Input */}
        <div className="max-w-2xl mx-auto">
          <Input
            icon={BookOpen}
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleStart()}
            placeholder="Ex: Leis de Newton, Concordância verbal, Revolução Francesa..."
            aria-label="Tema de performance"
            autoFocus
            className="text-lg py-4"
          />

          {/* Presets pomodoro */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-5">
            {POMODORO_PRESETS.map((p) => (
              <button
                key={p.minutes}
                onClick={() => setTargetMinutes(p.minutes)}
                className={`p-3 rounded-xl border transition-all text-left ${
                  targetMinutes === p.minutes
                    ? 'bg-accent-soft border-accent-border shadow-glow'
                    : 'bg-surface-2 border-border hover:border-border-strong'
                }`}
                aria-pressed={targetMinutes === p.minutes}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`text-xs font-semibold ${
                      targetMinutes === p.minutes ? 'text-accent' : 'text-text-secondary'
                    }`}
                  >
                    {p.label}
                  </span>
                  <span className="text-xs font-mono text-text-muted">{p.minutes}m</span>
                </div>
                <p className="text-2xs text-text-muted">{p.description}</p>
              </button>
            ))}
          </div>

          <Button
            onClick={handleStart}
            disabled={!topic.trim()}
            size="xl"
            icon={Play}
            className="w-full mt-5"
          >
            Medir minha performance agora
          </Button>

          <p className="text-center text-2xs text-text-dim mt-3">
            Dica: pressione <kbd className="font-mono px-1.5 py-0.5 bg-surface-2 border border-border rounded text-text-secondary">Space</kbd> para iniciar/pausar
          </p>

          {/* Sugestões + recentes */}
          {recentThemes.length > 0 && (
            <div className="mt-8">
              <p className="text-2xs font-semibold uppercase tracking-wider text-text-muted mb-3">
                Temas recentes
              </p>
              <div className="flex flex-wrap gap-2">
                {recentThemes.slice(0, 6).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTopic(t)}
                    className="px-3 py-1.5 text-xs bg-surface-2 border border-border rounded-lg text-text-secondary hover:text-accent hover:border-accent-border transition-all"
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6">
            <p className="text-2xs font-semibold uppercase tracking-wider text-text-muted mb-3">
              Sugestões
            </p>
            <div className="flex flex-wrap gap-2">
              {QUICK_SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => setTopic(s)}
                  className="px-3 py-1.5 text-xs bg-transparent border border-border rounded-lg text-text-muted hover:text-accent hover:border-accent-border hover:bg-accent-soft transition-all"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────
  // TELA 2: Cronômetro em execução
  // ──────────────────────────────────────────────────────────
  const isOvertime = timer.elapsed >= targetMinutes * 60;
  return (
    <div className={`animate-in text-center focus-active`}>
      {/* Pill de status */}
      <div className="inline-flex items-center gap-2 mb-8">
        <Badge variant={isOvertime ? 'warning' : 'accent'} icon={isOvertime ? Zap : Eye}>
          {isOvertime ? 'Além da meta' : 'Modo foco ativo'}
        </Badge>
      </div>

      {/* Timer circular */}
      <div
        className="relative inline-flex items-center justify-center mb-10"
        role="timer"
        aria-label="Cronômetro"
      >
        <div className="absolute inset-0 bg-accent/5 blur-3xl rounded-full animate-pulse-slow" />

        <svg width="320" height="320" className="-rotate-90 relative">
          <defs>
            <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#22d3a7" />
              <stop offset="100%" stopColor="#38bdf8" />
            </linearGradient>
          </defs>
          <circle
            cx="160"
            cy="160"
            r="130"
            fill="none"
            stroke="#1c2030"
            strokeWidth="8"
          />
          <circle
            cx="160"
            cy="160"
            r="130"
            fill="none"
            stroke="url(#timerGradient)"
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1s ease-out' }}
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="text-6xl md:text-7xl font-mono font-bold text-text-primary tabular tracking-tight"
            aria-live="polite"
          >
            {formatTime(timer.elapsed)}
          </span>
          <span className="text-text-muted text-sm mt-3 max-w-[240px] truncate font-medium">
            {topic}
          </span>
          <span className="text-2xs text-text-dim mt-1">
            meta {formatMinutes(targetMinutes * 60)}
          </span>
        </div>
      </div>

      {/* Controles */}
      <div className="flex items-center justify-center gap-3">
        {timer.status === 'running' ? (
          <IconButton icon={Pause} label="Pausar" variant="solid" size="lg" onClick={timer.pause} />
        ) : (
          <IconButton icon={Play} label="Retomar" variant="accent" size="lg" onClick={timer.resume} />
        )}
        <Button
          onClick={handleFinish}
          variant="primary"
          size="lg"
          icon={Square}
        >
          Finalizar e medir
        </Button>
        <IconButton
          icon={RotateCcw}
          label="Cancelar sessão"
          variant="ghost"
          size="lg"
          onClick={() => {
            if (window.confirm('Cancelar a sessão atual?')) {
              timer.reset();
              toast({ title: 'Sessão cancelada', variant: 'info' });
            }
          }}
        />
      </div>

      <p className="text-2xs text-text-dim mt-8">
        <kbd className="font-mono px-1.5 py-0.5 bg-surface-2 border border-border rounded text-text-secondary">Space</kbd>{' '}
        pausar/retomar · <kbd className="font-mono px-1.5 py-0.5 bg-surface-2 border border-border rounded text-text-secondary">Esc</kbd> cancelar
      </p>
    </div>
  );
}
