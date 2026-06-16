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
  Info,
  CalendarClock,
  X,
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

export default function SessionView({ onFinish, insights, dailyGoal, recentThemes, reviewsDue = [] }) {
  const [topic, setTopic] = useState('');
  const [targetMinutes, setTargetMinutes] = useState(25);
  const [questionCount, setQuestionCount] = useState(5);
  const [questionDistribution, setQuestionDistribution] = useState({ multipleChoice: 5, summation: 0, discursive: 0 });
  const [difficulty, setDifficulty] = useState('medium');
  const [learningMode, setLearningMode] = useState(false);
  const [quizType, setQuizType] = useState('free');
  const [quizSubtype, setQuizSubtype] = useState('');
  const [explainAfterAnswer, setExplainAfterAnswer] = useState(true);
  const [distributionError, setDistributionError] = useState('');
  const [simulatedMode, setSimulatedMode] = useState(false);
  const [timePerQuestion, setTimePerQuestion] = useState(60);
  const [reviewsDismissed, setReviewsDismissed] = useState(false);
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
    if (distributionError) {
      toast({ title: 'Corrija a distribuição de questões', variant: 'warning' });
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
      questionCount,
      questionDistribution,
      difficulty,
      learningMode,
      quizType,
      quizSubtype: quizSubtype || undefined,
      explainAfterAnswer,
      simulatedMode,
      timePerQuestion,
    });
    setTopic('');
  };

  // ──────────────────────────────────────────────────────────
  // TELA 1: Configuração da sessão
  // ──────────────────────────────────────────────────────────
  if (timer.status === 'idle') {
    return (
      <div className="animate-in max-w-4xl mx-auto">
        {/* Widget revisão programada */}
        {reviewsDue.length > 0 && !reviewsDismissed && (
          <div className="mb-6 p-4 rounded-2xl border border-accent-border bg-accent-soft flex items-start gap-3">
            <CalendarClock size={18} className="text-accent shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-text-primary mb-2">
                {reviewsDue.length === 1 ? 'Um tema pede revisão' : `${reviewsDue.length} temas pedem revisão`}
              </p>
              <div className="flex flex-wrap gap-2">
                {reviewsDue.slice(0, 3).map(r => (
                  <button
                    key={r.theme}
                    onClick={() => { setTopic(r.theme); setReviewsDismissed(true); }}
                    className="px-3 py-1.5 text-xs bg-surface border border-border rounded-lg text-text-secondary hover:text-accent hover:border-accent-border transition-all flex items-center gap-1.5"
                  >
                    {r.theme}
                    <span className="text-text-dim font-mono">{r.lastScore}/10</span>
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={() => setReviewsDismissed(true)}
              className="text-text-dim hover:text-text-muted transition-colors shrink-0"
              aria-label="Dispensar"
            >
              <X size={14} />
            </button>
          </div>
        )}

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

          {/* Seção A — Questões */}
          <div className="mt-8">
            <p className="text-2xs font-semibold uppercase tracking-wider text-text-muted mb-3">
              Questões
            </p>
            <div className="grid grid-cols-4 gap-2">
              {[3, 5, 8, 10].map((num) => (
                <button
                  key={num}
                  onClick={() => {
                    setQuestionCount(num);
                    setQuestionDistribution({ multipleChoice: num, summation: 0, discursive: 0 });
                    setDistributionError('');
                  }}
                  className={`p-3 rounded-xl border transition-all text-left ${
                    questionCount === num
                      ? 'bg-accent-soft border-accent-border shadow-glow'
                      : 'bg-surface-2 border-border hover:border-border-strong'
                  }`}
                  aria-pressed={questionCount === num}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs font-semibold ${
                        questionCount === num ? 'text-accent' : 'text-text-secondary'
                      }`}
                    >
                      {num}
                    </span>
                  </div>
                  <p className="text-2xs text-text-muted">{num === 3 ? 'Rápido' : num === 5 ? 'Recomendado' : num === 8 ? 'Profundo' : 'Extenso'}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Seção B — Distribuição */}
          <div className="mt-8">
            <p className="text-2xs font-semibold uppercase tracking-wider text-text-muted mb-3">
              Distribuição de tipos
            </p>
            <Card className="p-4">
              <div className="grid grid-cols-3 gap-3 mb-3">
                <div>
                  <label className="text-xs font-semibold text-text-secondary block mb-2">
                    Múltipla escolha
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={questionCount}
                    value={questionDistribution.multipleChoice}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      setQuestionDistribution({ ...questionDistribution, multipleChoice: val });
                      const total = val + questionDistribution.summation + questionDistribution.discursive;
                      if (total !== questionCount) {
                        setDistributionError(`A soma deve ser igual a ${questionCount}`);
                      } else {
                        setDistributionError('');
                      }
                    }}
                    className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2 text-sm text-text-primary text-center focus:outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-text-secondary block mb-2">
                    Somatória
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={questionCount}
                    value={questionDistribution.summation}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      setQuestionDistribution({ ...questionDistribution, summation: val });
                      const total = questionDistribution.multipleChoice + val + questionDistribution.discursive;
                      if (total !== questionCount) {
                        setDistributionError(`A soma deve ser igual a ${questionCount}`);
                      } else {
                        setDistributionError('');
                      }
                    }}
                    className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2 text-sm text-text-primary text-center focus:outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-text-secondary block mb-2">
                    Discursiva
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={questionCount}
                    value={questionDistribution.discursive}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      setQuestionDistribution({ ...questionDistribution, discursive: val });
                      const total = questionDistribution.multipleChoice + questionDistribution.summation + val;
                      if (total !== questionCount) {
                        setDistributionError(`A soma deve ser igual a ${questionCount}`);
                      } else {
                        setDistributionError('');
                      }
                    }}
                    className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2 text-sm text-text-primary text-center focus:outline-none focus:border-accent"
                  />
                </div>
              </div>
              {distributionError ? (
                <p className="text-xs text-danger mt-2">{distributionError}</p>
              ) : (
                <p className="text-xs text-accent mt-2">
                  {questionDistribution.multipleChoice} + {questionDistribution.summation} + {questionDistribution.discursive} = {questionCount} ✓
                </p>
              )}
            </Card>
          </div>

          {/* Seção C — Dificuldade */}
          <div className="mt-8">
            <p className="text-2xs font-semibold uppercase tracking-wider text-text-muted mb-3">
              Dificuldade
            </p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Fácil', value: 'easy', detail: 'básico' },
                { label: 'Médio', value: 'medium', detail: 'aplicação' },
                { label: 'Difícil', value: 'hard', detail: 'análise crítica' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setDifficulty(opt.value)}
                  className={`p-3 rounded-xl border transition-all text-left ${
                    difficulty === opt.value
                      ? 'bg-accent-soft border-accent-border shadow-glow'
                      : 'bg-surface-2 border-border hover:border-border-strong'
                  }`}
                  aria-pressed={difficulty === opt.value}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs font-semibold ${
                        difficulty === opt.value ? 'text-accent' : 'text-text-secondary'
                      }`}
                    >
                      {opt.label}
                    </span>
                    <span className="text-xs font-mono text-text-muted">{opt.detail}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Seção D — Tipo de questão */}
          <div className="mt-8">
            <p className="text-2xs font-semibold uppercase tracking-wider text-text-muted mb-3">
              Tipo de questão
            </p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Estudo livre', value: 'free' },
                { label: 'Concurso público', value: 'civil_service' },
                { label: 'Vestibular', value: 'vestibular' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => { setQuizType(opt.value); setQuizSubtype(''); }}
                  className={`p-3 rounded-xl border transition-all text-left ${
                    quizType === opt.value
                      ? 'bg-accent-soft border-accent-border shadow-glow'
                      : 'bg-surface-2 border-border hover:border-border-strong'
                  }`}
                  aria-pressed={quizType === opt.value}
                >
                  <span
                    className={`text-xs font-semibold ${
                      quizType === opt.value ? 'text-accent' : 'text-text-secondary'
                    }`}
                  >
                    {opt.label}
                  </span>
                </button>
              ))}
            </div>

            {quizType === 'civil_service' && (
              <div className="mt-4">
                <p className="text-2xs font-semibold uppercase tracking-wider text-text-muted mb-3">
                  Banca / Concurso específico
                </p>
                <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                  {['', 'CESPE/CEBRASPE', 'FCC', 'FGV', 'VUNESP', 'IDECAN', 'IBFC', 'PF', 'PRF', 'TRF', 'TCU', 'INSS'].map((sub) => (
                    <button
                      key={sub || '__any__'}
                      onClick={() => setQuizSubtype(sub)}
                      className={`p-2.5 rounded-xl border transition-all text-center ${
                        quizSubtype === sub
                          ? 'bg-accent-soft border-accent-border shadow-glow'
                          : 'bg-surface-2 border-border hover:border-border-strong'
                      }`}
                      aria-pressed={quizSubtype === sub}
                    >
                      <span className={`text-xs font-semibold ${quizSubtype === sub ? 'text-accent' : 'text-text-secondary'}`}>
                        {sub || 'Qualquer banca'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {quizType === 'vestibular' && (
              <div className="mt-4">
                <p className="text-2xs font-semibold uppercase tracking-wider text-text-muted mb-3">
                  Vestibular específico
                </p>
                <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                  {['', 'ENEM', 'FUVEST', 'UNICAMP', 'UNESP', 'UFPR', 'USP', 'UFMG', 'UEL', 'UFRGS', 'PUC-PR'].map((sub) => (
                    <button
                      key={sub || '__any__'}
                      onClick={() => setQuizSubtype(sub)}
                      className={`p-2.5 rounded-xl border transition-all text-center ${
                        quizSubtype === sub
                          ? 'bg-accent-soft border-accent-border shadow-glow'
                          : 'bg-surface-2 border-border hover:border-border-strong'
                      }`}
                      aria-pressed={quizSubtype === sub}
                    >
                      <span className={`text-xs font-semibold ${quizSubtype === sub ? 'text-accent' : 'text-text-secondary'}`}>
                        {sub || 'Qualquer vestibular'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {(quizType === 'civil_service' || quizType === 'vestibular') && (
              <p className="text-2xs text-text-muted mt-3 flex items-center gap-1">
                <Info size={11} />
                A IA se baseia em questões reais deste tipo de prova.
              </p>
            )}
          </div>

          {/* Seção E — Toggles */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-3">
            <Card className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-text-primary">Modo aprendizado</p>
                <p className="text-2xs text-text-muted">A IA traz uma dica teórica antes de cada pergunta, sem revelar a resposta</p>
              </div>
              <button
                role="switch"
                aria-checked={learningMode}
                onClick={() => setLearningMode(!learningMode)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ml-4 ${
                  learningMode ? 'bg-accent' : 'bg-surface-3 border border-border'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    learningMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </Card>

            <Card className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-text-primary">Explicar após cada resposta</p>
                <p className="text-2xs text-text-muted">A IA explica por que cada alternativa está certa ou errada antes de avançar</p>
              </div>
              <button
                role="switch"
                aria-checked={explainAfterAnswer}
                onClick={() => setExplainAfterAnswer(!explainAfterAnswer)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ml-4 ${
                  explainAfterAnswer ? 'bg-accent' : 'bg-surface-3 border border-border'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    explainAfterAnswer ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </Card>

            <Card className="p-4 md:col-span-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-text-primary">Modo Simulado</p>
                  <p className="text-2xs text-text-muted">Cada questão tem um timer regressivo. Simula a pressão de prova real.</p>
                </div>
                <button
                  role="switch"
                  aria-checked={simulatedMode}
                  onClick={() => setSimulatedMode(!simulatedMode)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ml-4 ${
                    simulatedMode ? 'bg-accent' : 'bg-surface-3 border border-border'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      simulatedMode ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              {simulatedMode && (
                <div className="mt-4">
                  <p className="text-2xs font-semibold uppercase tracking-wider text-text-muted mb-2">
                    Tempo por questão
                  </p>
                  <div className="flex gap-2">
                    {[30, 60, 90].map(t => (
                      <button
                        key={t}
                        onClick={() => setTimePerQuestion(t)}
                        className={`flex-1 py-2 rounded-xl border text-xs font-semibold transition-all ${
                          timePerQuestion === t
                            ? 'bg-accent-soft border-accent-border text-accent'
                            : 'bg-surface-2 border-border text-text-muted hover:border-border-strong'
                        }`}
                        aria-pressed={timePerQuestion === t}
                      >
                        {t}s
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </Card>
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
