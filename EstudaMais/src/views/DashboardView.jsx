// Dashboard — KPIs, evolução, temas, histórico com busca, oportunidades de melhora.
import { useState, useMemo, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Area,
  AreaChart,
} from 'recharts';
import {
  BarChart3,
  Clock,
  Target,
  TrendingUp,
  AlertTriangle,
  Flame,
  Trophy,
  Search,
  Trash2,
  Download,
  ArrowUpRight,
  BookOpen,
  Zap,
  Award,
  GraduationCap,
  CalendarClock,
} from 'lucide-react';
import { Button, Card, Badge, StatCard, EmptyState, IconButton, Input, Skeleton } from '../ui.jsx';
import { quizApi } from '../api';
import {
  formatMinutes,
  formatRelative,
  calcEfficiency,
  scoreColor,
  buildEvolutionSeries,
  exportSessionsJson,
  toast,
  getReviewsDue,
} from '../lib.js';

export default function DashboardView({
  sessions,
  insights,
  onClearHistory,
  onStartSession,
  onEditGoal,
}) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all'); // all | critical | good
  const [wrongQuestions, setWrongQuestions] = useState([]);
  const [loadingWrong, setLoadingWrong] = useState(false);
  const [wrongTab, setWrongTab] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sessions
      .filter((s) => (q ? s.topic.toLowerCase().includes(q) : true))
      .filter((s) => {
        if (filter === 'critical') return s.score != null && s.score < 6;
        if (filter === 'good') return s.score != null && s.score >= 7;
        return true;
      })
      .slice()
      .sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt));
  }, [sessions, query, filter]);

  const evolutionData = useMemo(() => buildEvolutionSeries(sessions), [sessions]);
  const reviewsDue = useMemo(() => getReviewsDue(sessions), [sessions]);

  useEffect(() => {
    setLoadingWrong(true);
    quizApi.listWrongQuestions()
      .then(data => setWrongQuestions(data))
      .catch(() => {})
      .finally(() => setLoadingWrong(false));
  }, []);

  const handleMarkRetried = async (id) => {
    await quizApi.markRetried(id);
    setWrongQuestions(prev => prev.filter(w => w.id !== id));
  };

  const handleDeleteWrong = async (id) => {
    await quizApi.deleteWrongQuestion(id);
    setWrongQuestions(prev => prev.filter(w => w.id !== id));
  };

  // Empty state
  if (sessions.length === 0) {
    return (
      <EmptyState
        icon={GraduationCap}
        title="Sem dados de performance ainda"
        description="Inicie sua primeira medição de performance e veja seus índices de eficiência aparecerem aqui."
        action={
          <Button onClick={onStartSession} icon={BookOpen} size="lg">
            Iniciar primeira medição
          </Button>
        }
      />
    );
  }

  return (
    <div className="animate-in max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-8 gap-4">
        <div>
          <Badge variant="accent" icon={BarChart3} className="mb-3">
            Perfil de performance
          </Badge>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-text-primary tracking-tight">
            Seu perfil de performance
          </h1>
          <p className="text-text-muted mt-2">
            Índice de Eficiência ={' '}
            <span className="font-mono text-accent">nota ÷ horas processadas</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            icon={Download}
            onClick={() => {
              exportSessionsJson(sessions);
              toast({ title: 'Histórico exportado', variant: 'success' });
            }}
          >
            Exportar
          </Button>
          <Button variant="danger" icon={Trash2} onClick={onClearHistory}>
            Limpar
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <StatCard
          label="Sessões"
          value={insights.total}
          icon={BookOpen}
          trend={`${formatMinutes(insights.totalSeconds)} no total`}
        />
        <StatCard
          label="Score médio"
          value={insights.avgScore || '—'}
          unit="/10"
          icon={Target}
          variant={insights.avgScore >= 7 ? 'accent' : insights.avgScore < 5 ? 'warning' : 'default'}
        />
        <StatCard
          label="Eficiência"
          value={insights.avgEfficiency || '—'}
          unit="pts/h"
          icon={Zap}
          variant="accent"
        />
        <StatCard
          label="Streak"
          value={insights.streak}
          unit={insights.streak === 1 ? 'dia' : 'dias'}
          icon={Flame}
          trend={insights.todayMinutes > 0 ? `${insights.todayMinutes}min hoje` : 'Meça hoje para manter'}
        />
      </div>

      {/* Charts grid */}
      {evolutionData.length >= 2 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
          {/* Evolução do score */}
          <Card className="lg:col-span-2 p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-display font-bold text-text-primary">
                  Evolução do score
                </h3>
                <p className="text-xs text-text-muted mt-0.5">
                  Notas das últimas {evolutionData.length} sessões avaliadas
                </p>
              </div>
              <Badge variant="accent" icon={TrendingUp}>
                {evolutionData.length} pontos
              </Badge>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={evolutionData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22d3a7" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#22d3a7" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#232740" />
                  <XAxis dataKey="date" stroke="#7a8199" tickLine={false} axisLine={false} />
                  <YAxis
                    domain={[0, 10]}
                    stroke="#7a8199"
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(15, 17, 26, 0.96)',
                      border: '1px solid #232740',
                      borderRadius: 12,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="#22d3a7"
                    strokeWidth={2.5}
                    fill="url(#scoreGradient)"
                    dot={{ fill: '#22d3a7', r: 4 }}
                    activeDot={{ r: 6, fill: '#22d3a7' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Top temas */}
          <Card className="p-6">
            <h3 className="text-lg font-display font-bold text-text-primary mb-1">
              Top temas
            </h3>
            <p className="text-xs text-text-muted mb-5">Por score médio</p>
            <div className="space-y-3">
              {insights.themes
                .filter((t) => t.avgScore != null)
                .sort((a, b) => b.avgScore - a.avgScore)
                .slice(0, 5)
                .map((t) => (
                  <div key={t.theme}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm text-text-secondary truncate pr-2">
                        {t.theme}
                      </span>
                      <span
                        className={`text-sm font-mono font-bold tabular ${scoreColor(t.avgScore)}`}
                      >
                        {t.avgScore}
                      </span>
                    </div>
                    <div className="h-1.5 bg-surface-3 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-accent to-info rounded-full transition-all"
                        style={{ width: `${(t.avgScore / 10) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              {insights.themes.filter((t) => t.avgScore != null).length === 0 && (
                <p className="text-sm text-text-muted text-center py-4">
                  Complete quizzes para ver o ranking
                </p>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Medir hoje — spaced repetition */}
      {reviewsDue.length > 0 && (
        <Card className="p-6 mb-8 border-accent-border bg-gradient-to-br from-accent-soft to-surface">
          <div className="flex items-start gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-accent-soft border border-accent-border flex items-center justify-center shrink-0">
              <CalendarClock size={18} className="text-accent" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-display font-bold text-text-primary">
                Medir hoje
              </h3>
              <p className="text-xs text-text-muted">
                Temas que precisam de uma nova medição para manter sua evolução
              </p>
            </div>
            <Badge variant="accent">{reviewsDue.length}</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {reviewsDue.map((r) => (
              <button
                key={r.theme}
                onClick={() => onStartSession(r.theme)}
                className="group text-left p-4 rounded-xl bg-surface-2 border border-border hover:border-accent-border transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-text-primary">{r.theme}</span>
                  <ArrowUpRight
                    size={14}
                    className="text-text-muted group-hover:text-accent transition-colors"
                  />
                </div>
                <div className="flex items-center gap-3 text-xs text-text-muted">
                  <span className="flex items-center gap-1">
                    <Target size={11} />
                    {r.lastScore}/10
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={11} />
                    {r.daysOverdue > 0 ? `${r.daysOverdue}d atrasado` : 'hoje'}
                  </span>
                  <Badge
                    variant={r.urgency === 'high' ? 'danger' : r.urgency === 'medium' ? 'warning' : 'default'}
                    className="text-2xs"
                  >
                    {r.urgency === 'high' ? 'Urgente' : r.urgency === 'medium' ? 'Importante' : 'Agendado'}
                  </Badge>
                </div>
                <div className="mt-2 text-xs text-accent font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                  Medir agora →
                </div>
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* Oportunidades de melhora */}
      {insights.criticalThemes.length > 0 && (
        <Card className="p-6 mb-8 border-warning/30 bg-gradient-to-br from-warning-soft to-surface">
          <div className="flex items-start gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-warning-soft border border-warning/30 flex items-center justify-center shrink-0">
              <AlertTriangle size={18} className="text-warning" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-display font-bold text-text-primary">
                Oportunidades de melhora
              </h3>
              <p className="text-xs text-text-muted">
                Temas com nota abaixo de 6 — priorize estes
              </p>
            </div>
            <Badge variant="warning">{insights.criticalThemes.length}</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {insights.criticalThemes.map((t) => (
              <button
                key={t.theme}
                onClick={() => onStartSession(t.theme)}
                className="group text-left p-4 rounded-xl bg-surface-2 border border-border hover:border-warning/50 transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-text-primary">{t.theme}</span>
                  <ArrowUpRight
                    size={14}
                    className="text-text-muted group-hover:text-warning transition-colors"
                  />
                </div>
                <div className="flex items-center gap-3 text-xs text-text-muted">
                  <span className="flex items-center gap-1">
                    <Target size={11} />
                    {t.avgScore}/10
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={11} />
                    {t.count} {t.count === 1 ? 'sessão' : 'sessões'}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* Tab toggle */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setWrongTab(false)}
          className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
            !wrongTab
              ? 'bg-accent-soft border-accent-border text-accent'
              : 'bg-surface-2 border-border text-text-muted hover:text-text-secondary'
          }`}
        >
          Histórico completo
        </button>
        <button
          onClick={() => setWrongTab(true)}
          className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all flex items-center gap-2 ${
            wrongTab
              ? 'bg-danger-soft border-danger/40 text-danger'
              : 'bg-surface-2 border-border text-text-muted hover:text-text-secondary'
          }`}
        >
          <AlertTriangle size={14} />
          Para refazer
          {wrongQuestions.length > 0 && (
            <span className="text-2xs font-mono font-bold bg-danger text-white rounded-full px-1.5 min-w-[18px] text-center">
              {wrongQuestions.length}
            </span>
          )}
        </button>
      </div>

      {!wrongTab && (
        <>
      {/* Histórico */}
      <div className="mb-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <h3 className="text-xl font-display font-bold text-text-primary">
          Histórico completo
        </h3>
        <div className="flex gap-2">
          <Input
            icon={Search}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar tema..."
            className="text-sm py-2"
          />
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-4">
        {[
          { key: 'all', label: 'Todas', count: sessions.length },
          {
            key: 'good',
            label: 'Boas',
            count: sessions.filter((s) => s.score >= 7).length,
          },
          {
            key: 'critical',
            label: 'A melhorar',
            count: sessions.filter((s) => s.score != null && s.score < 6).length,
          },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              filter === f.key
                ? 'bg-accent-soft border-accent-border text-accent'
                : 'bg-surface-2 border-border text-text-muted hover:text-text-secondary'
            }`}
          >
            {f.label}{' '}
            <span className="text-text-dim ml-1 font-mono">{f.count}</span>
          </button>
        ))}
      </div>

      {/* Lista */}
      <div className="space-y-2">
        {filtered.map((s, i) => (
          <Card key={i} className="p-4 flex items-center gap-4" interactive>
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border font-mono font-bold tabular ${
                s.score == null
                  ? 'bg-surface-3 border-border text-text-muted'
                  : s.score >= 7
                  ? 'bg-accent-soft border-accent-border text-accent'
                  : s.score >= 5
                  ? 'bg-info-soft border-info/30 text-info'
                  : 'bg-danger-soft border-danger/30 text-danger'
              }`}
            >
              {s.score ?? '—'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-text-primary truncate">{s.topic}</div>
              <div className="flex items-center gap-3 text-xs text-text-muted mt-1">
                <span className="flex items-center gap-1">
                  <Clock size={11} />
                  {formatMinutes(s.duration)}
                </span>
                <span>·</span>
                <span>{formatRelative(s.startedAt)}</span>
                {s.score != null && (
                  <>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Zap size={11} />
                      {calcEfficiency(s.score, s.duration)} pts/h
                    </span>
                  </>
                )}
              </div>
            </div>
            {s.score == null && <Badge variant="default">Sem quiz</Badge>}
          </Card>
        ))}
        {filtered.length === 0 && (
          <p className="text-center text-text-muted py-8 text-sm">
            Nenhum resultado para "{query}".
          </p>
        )}
      </div>
        </>
      )}

      {wrongTab && (
        <div className="space-y-3">
          {loadingWrong && (
            <div className="space-y-2">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          )}
          {!loadingWrong && wrongQuestions.length === 0 && (
            <div className="text-center py-12 text-text-muted text-sm">
              Nenhuma questão para refazer. Continue estudando!
            </div>
          )}
          {wrongQuestions.map((wq) => (
            <Card key={wq.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <Badge variant="danger">
                      {wq.quizType === 'civil_service' ? 'Concurso' : wq.quizType === 'vestibular' ? 'Vestibular' : 'Estudo livre'}
                    </Badge>
                    <Badge variant="default">
                      {wq.difficulty === 'easy' ? 'Fácil' : wq.difficulty === 'medium' ? 'Médio' : 'Difícil'}
                    </Badge>
                    <span className="text-xs text-text-muted">{wq.theme}</span>
                  </div>
                  <p className="text-sm text-text-primary font-medium leading-snug mb-1">
                    {wq.question.question}
                  </p>
                  {wq.question.type === 'multiple_choice' && wq.question.options && (
                    <div className="grid grid-cols-1 gap-1 mt-2">
                      {wq.question.options.map((opt, i) => {
                        const letter = String.fromCharCode(65 + i);
                        const wasSelected = wq.userAnswer === letter;
                        return (
                          <div
                            key={i}
                            className={`text-xs px-3 py-1.5 rounded-lg border ${
                              wasSelected
                                ? 'bg-danger-soft border-danger/40 text-danger'
                                : 'bg-surface-2 border-border text-text-muted'
                            }`}
                          >
                            {letter}) {opt}
                            {wasSelected && <span className="ml-2 font-semibold">(sua resposta)</span>}
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {wq.question.type === 'summation' && wq.question.summationItems && (
                    <div className="mt-2 space-y-1">
                      {wq.question.summationItems.map(item => (
                        <div key={item.value} className="text-xs text-text-muted flex gap-2">
                          <span className="font-mono text-text-dim w-6 shrink-0">{String(item.value).padStart(2, '0')}</span>
                          <span>{item.statement}</span>
                        </div>
                      ))}
                      <p className="text-xs text-danger mt-1">Sua resposta: {wq.userAnswer}</p>
                    </div>
                  )}
                  {wq.question.type === 'open_ended' && (
                    <p className="text-xs text-danger mt-1 italic">
                      Sua resposta: "{wq.userAnswer}"
                    </p>
                  )}
                  <p className="text-2xs text-text-dim mt-2">{formatRelative(wq.savedAt)}</p>
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleMarkRetried(wq.id)}
                  >
                    Marquei como refeita
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteWrong(wq.id)}
                  >
                    Remover
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
