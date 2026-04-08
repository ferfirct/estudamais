// Dashboard — KPIs, evolução, temas, histórico com busca, revisão crítica.
import { useState, useMemo } from 'react';
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
} from 'lucide-react';
import { Button, Card, Badge, StatCard, EmptyState, IconButton, Input } from '../ui.jsx';
import {
  formatMinutes,
  formatRelative,
  calcEfficiency,
  scoreColor,
  buildEvolutionSeries,
  exportSessionsJson,
  toast,
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

  // Empty state
  if (sessions.length === 0) {
    return (
      <EmptyState
        icon={GraduationCap}
        title="Nenhuma sessão ainda"
        description="Comece sua primeira sessão de estudos e veja suas métricas de absorção aparecerem aqui."
        action={
          <Button onClick={onStartSession} icon={BookOpen} size="lg">
            Começar a estudar
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
            Dashboard
          </Badge>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-text-primary tracking-tight">
            Suas métricas de absorção
          </h1>
          <p className="text-text-muted mt-2">
            Índice de Eficiência ={' '}
            <span className="font-mono text-accent">nota ÷ horas estudadas</span>
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
          trend={insights.todayMinutes > 0 ? `${insights.todayMinutes}min hoje` : 'Estude hoje para manter'}
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

      {/* Revisão crítica */}
      {insights.criticalThemes.length > 0 && (
        <Card className="p-6 mb-8 border-warning/30 bg-gradient-to-br from-warning-soft to-surface">
          <div className="flex items-start gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-warning-soft border border-warning/30 flex items-center justify-center shrink-0">
              <AlertTriangle size={18} className="text-warning" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-display font-bold text-text-primary">
                Revisão crítica
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
            label: 'Críticas',
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
    </div>
  );
}
