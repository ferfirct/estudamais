// Tela do quiz — loading polido, questões navegáveis, resultado com gap analysis.
import { useEffect, useRef, useState } from 'react';
import {
  Brain,
  ChevronRight,
  ChevronLeft,
  Check,
  AlertTriangle,
  Target,
  Zap,
  RotateCcw,
  BarChart3,
  Trophy,
  Lightbulb,
  Download,
  Share2,
  Copy,
  Award,
} from 'lucide-react';
import { Button, Card, Badge, Skeleton, Textarea } from '../ui.jsx';
import {
  formatMinutes,
  calcEfficiency,
  scoreColor,
  scoreBg,
  fireConfetti,
  toast,
  useKeyboard,
  checkNewRecord,
  loadSessions,
} from '../lib.js';
import { sessionsApi, quizApi, ApiError } from '../api';

export default function QuizView({ sessionData, onComplete, onSkip, sessions = [] }) {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [currentQ, setCurrentQ] = useState(0);
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [showRecord, setShowRecord] = useState(null); // null | record object
  const [recordDismissed, setRecordDismissed] = useState(false);
  const shareCardRef = useRef(null);

  const backendSessionIdRef = useRef(null);
  const backendQuestionsRef = useRef([]);

  useEffect(() => {
    generateQuiz();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function normalizeQuestions(api) {
    return api.map((q, i) => ({
      id: q.id ?? `q${i + 1}`,
      type: q.type === 'open_ended' ? 'open' : 'multiple_choice',
      question: q.question,
      options: q.options,
      correct: q.correctAnswer,
    }));
  }

  async function generateQuiz() {
    setLoading(true);
    setError(null);
    try {
      const session = await sessionsApi.createSession(sessionData.topic);
      backendSessionIdRef.current = session.id;
      await sessionsApi.finishSession(
        session.id,
        Math.max(1, Math.round(sessionData.duration / 60))
      );
      // Gather previous scores for adaptive difficulty
      const previousScores = sessions
        .filter((s) => s.topic === sessionData.topic && s.score != null)
        .map((s) => s.score);
      const { questions: apiQs } = await quizApi.generateQuiz({
        sessionId: session.id,
        theme: sessionData.topic,
        durationMinutes: Math.max(1, Math.round(sessionData.duration / 60)),
        previousScores: previousScores.length > 0 ? previousScores : undefined,
      });
      backendQuestionsRef.current = apiQs;
      setQuestions(normalizeQuestions(apiQs));
    } catch (err) {
      console.error(err);
      const msg =
        err instanceof ApiError && err.status === 0
          ? 'Servidor offline — modo degradado ativo.'
          : err instanceof ApiError
          ? err.message
          : 'Falha ao gerar quiz. Usando perguntas padrão.';
      setError(msg);
      toast({ title: 'Modo offline', description: msg, variant: 'warning' });
      // Fallback local
      setQuestions([
        {
          id: 'q1',
          type: 'open',
          question: `Explique com suas palavras o conceito principal de "${sessionData.topic}".`,
        },
        {
          id: 'q2',
          type: 'open',
          question: `Cite dois exemplos práticos relacionados a "${sessionData.topic}".`,
        },
        {
          id: 'q3',
          type: 'open',
          question: `Qual a importância de "${sessionData.topic}" no contexto da disciplina?`,
        },
      ]);
    }
    setLoading(false);
  }

  async function submitEvaluation() {
    setEvaluating(true);
    setError(null);
    try {
      const sessionId = backendSessionIdRef.current;
      const apiQs = backendQuestionsRef.current;
      if (!sessionId || !apiQs.length) {
        throw new ApiError('Sessão não registrada no servidor.', 0);
      }
      const userAnswers = {};
      questions.forEach((q, i) => {
        const originalId = apiQs[i]?.id ?? q.id;
        userAnswers[originalId] = answers[i] || '(sem resposta)';
      });
      const evalResult = await quizApi.evaluateQuiz({
        sessionId,
        questions: apiQs,
        userAnswers,
      });
      const final = {
        score: evalResult.score,
        gapAnalysis: evalResult.gapAnalysis,
      };
      setResult(final);
      // Check personal record
      const efficiency = calcEfficiency(final.score, sessionData.duration);
      const record = checkNewRecord(sessionData.topic, efficiency, final.score, sessions);
      if (record.isNewRecord) {
        setShowRecord(record);
        fireConfetti();
        toast({
          title: '🏆 Novo recorde pessoal!',
          description: `${record.recordType === 'efficiency' ? 'Eficiência' : 'Score'}: ${record.newBest}${record.unit}`,
          variant: 'success',
          duration: 6000,
        });
      } else if (final.score >= 9) {
        fireConfetti();
        toast({
          title: 'Performance excepcional!',
          description: `Score ${final.score}/10 — mandou bem!`,
          variant: 'success',
        });
      }
    } catch (err) {
      console.error(err);
      const msg =
        err instanceof ApiError && err.status === 0
          ? 'Servidor offline — avaliação estimada.'
          : err instanceof ApiError
          ? err.message
          : 'Falha ao avaliar.';
      setError(msg);
      toast({ title: 'Avaliação offline', description: msg, variant: 'warning' });
      const answered = Object.keys(answers).length;
      const score = Math.min(
        10,
        Math.round((answered / Math.max(1, questions.length)) * 7 + Math.random() * 3)
      );
      setResult({
        score,
        gapAnalysis:
          'Avaliação offline simplificada. Conecte o backend para receber o Gap Analysis detalhado da IA.',
      });
    }
    setEvaluating(false);
  }

  const handleAnswer = (i, v) => setAnswers((prev) => ({ ...prev, [i]: v }));
  const canNext = answers[currentQ] !== undefined && answers[currentQ] !== '';
  const isLast = currentQ === questions.length - 1;
  const allAnswered = questions.every((_, i) => answers[i]);

  useKeyboard(
    {
      ArrowRight: () => {
        if (!loading && !result && canNext && !isLast) setCurrentQ((q) => q + 1);
      },
      ArrowLeft: () => {
        if (!loading && !result && currentQ > 0) setCurrentQ((q) => q - 1);
      },
    },
    [loading, result, canNext, isLast, currentQ]
  );

  // ──────────────────────────────────────────────────────────
  // LOADING
  // ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="animate-in max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <div className="relative inline-flex items-center justify-center mb-6">
            <div className="absolute inset-0 bg-accent/20 blur-2xl rounded-full animate-pulse" />
            <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-br from-accent-soft to-surface-2 border border-accent-border flex items-center justify-center shadow-glow">
              <Brain size={36} className="text-accent animate-pulse" />
            </div>
          </div>
          <h2 className="text-2xl font-display font-bold text-text-primary mb-2">
            Gerando quiz com IA
          </h2>
          <p className="text-text-muted">
            Preparando perguntas sobre{' '}
            <span className="text-accent font-semibold">{sessionData.topic}</span>
          </p>
        </div>

        <Card className="p-6 space-y-5">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-3/4" />
          <div className="space-y-3 pt-3">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        </Card>

        <div className="mt-6 flex justify-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 bg-accent rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────
  // RESULT
  // ──────────────────────────────────────────────────────────
  if (result) {
    const score = result.score;
    const efficiency = calcEfficiency(score, sessionData.duration);
    const scoreCls = scoreColor(score);
    const scoreBgCls = scoreBg(score);
    const record = showRecord || checkNewRecord(sessionData.topic, efficiency, score, sessions);

    // Share card generation
    async function handleDownloadCard() {
      const el = shareCardRef.current;
      if (!el) return;
      try {
        const html2canvas = (await import('html2canvas')).default;
        const canvas = await html2canvas(el, { backgroundColor: null, scale: 2 });
        const link = document.createElement('a');
        link.download = `estudaplus-${sessionData.topic.replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        toast({ title: 'Card baixado!', variant: 'success' });
      } catch {
        toast({ title: 'Erro ao gerar imagem', variant: 'error' });
      }
    }

    async function handleCopyCard() {
      const el = shareCardRef.current;
      if (!el) return;
      try {
        const html2canvas = (await import('html2canvas')).default;
        const canvas = await html2canvas(el, { backgroundColor: null, scale: 2 });
        canvas.toBlob(async (blob) => {
          if (blob) {
            await navigator.clipboard.write([
              new ClipboardItem({ 'image/png': blob }),
            ]);
            toast({ title: 'Card copiado!', variant: 'success' });
          }
        });
      } catch {
        toast({ title: 'Erro ao copiar', variant: 'error' });
      }
    }

    // Record overlay
    if (showRecord && !recordDismissed) {
      return (
        <div className="animate-in max-w-3xl mx-auto text-center">
          <div className="record-reveal">
            <div className="relative inline-flex flex-col items-center py-16">
              <div className="absolute inset-0 bg-warning/10 blur-3xl rounded-full animate-pulse" />
              <div className="relative">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-500 flex items-center justify-center shadow-glow-lg animate-scale-in mb-6">
                  <Trophy size={56} className="text-bg" />
                </div>
              </div>
              <h1 className="text-4xl md:text-5xl font-display font-black text-text-primary mb-3 tracking-tight">
                NOVO RECORDE PESSOAL
              </h1>
              <p className="text-xl text-text-secondary font-semibold mb-2">
                {showRecord.recordType === 'efficiency' ? 'Eficiência' : 'Score'}
              </p>
              <div className="flex items-center gap-4 mt-4">
                <div className="text-center">
                  <span className="block text-2xs uppercase tracking-wider text-text-muted mb-1">Anterior</span>
                  <span className="text-2xl font-mono font-bold text-text-muted line-through">
                    {showRecord.previousBest}{showRecord.unit}
                  </span>
                </div>
                <div className="text-3xl text-accent font-bold">→</div>
                <div className="text-center">
                  <span className="block text-2xs uppercase tracking-wider text-accent mb-1">Novo</span>
                  <span className="text-3xl font-mono font-bold text-accent">
                    {showRecord.newBest}{showRecord.unit}
                  </span>
                </div>
              </div>
              <Button
                onClick={() => setRecordDismissed(true)}
                size="lg"
                className="mt-10"
              >
                Ver resultado completo
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="animate-in max-w-3xl mx-auto">
        {/* Hero score */}
        <div className="text-center mb-10">
          <Badge variant={score >= 7 ? 'success' : score >= 5 ? 'warning' : 'danger'} icon={Trophy}>
            Resultado da avaliação
          </Badge>
          <div className="relative inline-flex flex-col items-center mt-5">
            <div
              className={`relative w-32 h-32 rounded-4xl ${scoreBgCls} border-2 flex items-center justify-center shadow-elevated`}
            >
              <span
                className={`text-6xl font-mono font-bold tabular ${scoreCls}`}
              >
                {score}
              </span>
            </div>
            <span className="text-text-muted mt-4 font-medium">de 10 pontos</span>
          </div>

          {/* Record info */}
          {record.isNewRecord ? (
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-500/30">
              <Award size={16} className="text-yellow-400" />
              <span className="text-sm font-semibold text-yellow-300">Recorde pessoal em {record.recordType === 'efficiency' ? 'eficiência' : 'score'}!</span>
            </div>
          ) : record.gap != null && record.gap > 0 ? (
            <p className="text-text-muted mt-4 text-sm">
              Faltou <span className="font-mono font-semibold text-text-secondary">{record.gap} pts/h</span> para bater seu recorde (<span className="font-mono text-accent">{record.previousBest} pts/h</span>)
            </p>
          ) : null}

          <h2 className="text-3xl font-display font-bold text-text-primary mt-6">
            {score >= 9
              ? 'Performance excepcional!'
              : score >= 7
              ? 'Bom trabalho!'
              : score >= 5
              ? 'Você está no caminho.'
              : 'Oportunidade de evolução neste tema.'}
          </h2>
          <p className="text-text-muted mt-2">
            Tema: <span className="text-text-secondary">{sessionData.topic}</span>
          </p>
        </div>

        {/* Métricas */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Target size={14} className="text-accent" />
              <span className="text-2xs font-semibold uppercase tracking-wider text-text-muted">
                Tempo
              </span>
            </div>
            <div className="text-2xl font-display font-bold text-text-primary tabular">
              {formatMinutes(sessionData.duration)}
            </div>
          </Card>
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Zap size={14} className="text-info" />
              <span className="text-2xs font-semibold uppercase tracking-wider text-text-muted">
                Eficiência
              </span>
            </div>
            <div className="text-2xl font-display font-bold text-text-primary tabular">
              {efficiency}
              <span className="text-sm text-text-muted ml-1">pts/h</span>
            </div>
          </Card>
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Check size={14} className="text-success" />
              <span className="text-2xs font-semibold uppercase tracking-wider text-text-muted">
                Respondidas
              </span>
            </div>
            <div className="text-2xl font-display font-bold text-text-primary tabular">
              {Object.keys(answers).length}
              <span className="text-sm text-text-muted ml-1">/ {questions.length}</span>
            </div>
          </Card>
        </div>

        {/* Shareable card (hidden for capture) */}
        <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
          <div
            ref={shareCardRef}
            style={{
              width: 480,
              padding: 32,
              borderRadius: 20,
              background: 'linear-gradient(135deg, #0f111a 0%, #151826 100%)',
              border: '1px solid #232740',
              fontFamily: "'DM Sans', system-ui, sans-serif",
              color: '#f3f5f9',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.02em' }}>
                Estuda<span style={{ color: '#22d3a7' }}>+</span>
              </span>
              <span style={{ fontSize: 12, color: '#7a8199' }}>
                @{new Date().toLocaleDateString('pt-BR')}
              </span>
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 20, color: '#22d3a7' }}>
              {sessionData.topic}
            </div>
            <div style={{ display: 'flex', gap: 24, marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 11, color: '#7a8199', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Score</div>
                <div style={{ fontSize: 28, fontWeight: 800 }}>{score}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#7a8199', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Tempo</div>
                <div style={{ fontSize: 28, fontWeight: 800 }}>{formatMinutes(sessionData.duration)}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#7a8199', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Eficiência</div>
                <div style={{ fontSize: 28, fontWeight: 800 }}>{efficiency} <span style={{ fontSize: 14, color: '#7a8199' }}>pts/h</span></div>
              </div>
            </div>
            <div style={{ height: 8, borderRadius: 4, background: '#1c2030', overflow: 'hidden', marginBottom: 16 }}>
              <div style={{ height: '100%', width: `${Math.min(100, score * 10)}%`, borderRadius: 4, background: 'linear-gradient(90deg, #22d3a7, #38bdf8)' }} />
            </div>
            <div style={{ fontSize: 13, color: '#7a8199', fontStyle: 'italic' }}>
              "Não apenas conte as horas, meça sua eficiência."
            </div>
          </div>
        </div>

        {/* Share buttons */}
        <div className="flex gap-2 mb-6">
          <Button variant="secondary" icon={Download} onClick={handleDownloadCard} className="flex-1">
            Baixar card
          </Button>
          <Button variant="secondary" icon={Copy} onClick={handleCopyCard} className="flex-1">
            Copiar card
          </Button>
        </div>

        {/* Gap analysis */}
        <Card className="p-6 mb-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-warning-soft border border-warning/30 flex items-center justify-center shrink-0">
              <Lightbulb size={18} className="text-warning" />
            </div>
            <div>
              <h3 className="text-lg font-display font-bold text-text-primary">
                Gap Analysis
              </h3>
              <p className="text-xs text-text-muted">
                O que a IA detectou sobre sua compreensão do tema
              </p>
            </div>
          </div>
          <p className="text-text-secondary leading-relaxed whitespace-pre-wrap">
            {result.gapAnalysis}
          </p>
        </Card>

        {error && (
          <div className="flex items-start gap-3 p-4 rounded-2xl bg-danger-soft border border-danger/30 text-danger text-sm mb-6">
            <AlertTriangle size={18} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={() =>
              onComplete({
                ...sessionData,
                score,
                gaps: result.gapAnalysis,
                strengths: null,
                questions: questions.length,
                answeredAt: new Date().toISOString(),
              })
            }
            icon={BarChart3}
            className="flex-1"
            size="lg"
          >
            Ver perfil
          </Button>
          <Button
            onClick={() =>
              onComplete({
                ...sessionData,
                score,
                gaps: result.gapAnalysis,
                strengths: null,
                questions: questions.length,
                answeredAt: new Date().toISOString(),
                startNew: true,
              })
            }
            variant="secondary"
            icon={RotateCcw}
            size="lg"
          >
            Nova medição
          </Button>
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────
  // QUESTIONS
  // ──────────────────────────────────────────────────────────
  const q = questions[currentQ];
  if (!q) return null;

  return (
    <div className="animate-in max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-xl font-display font-bold text-text-primary">
            Avaliação: {sessionData.topic}
          </h2>
          <p className="text-xs text-text-muted mt-1">
            {formatMinutes(sessionData.duration)} de performance · {questions.length} questões
          </p>
        </div>
        <button
          onClick={onSkip}
          className="text-text-muted text-sm hover:text-text-primary transition-colors"
        >
          Pular quiz →
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-6 flex items-start gap-3 p-4 rounded-2xl bg-warning-soft border border-warning/30 text-warning text-sm">
          <AlertTriangle size={18} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Progress bar segmentada */}
      <div className="flex gap-1.5 mb-8">
        {questions.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
              i < currentQ
                ? 'bg-accent'
                : i === currentQ
                ? 'bg-accent/60'
                : 'bg-border'
            }`}
          />
        ))}
      </div>

      {/* Question card */}
      <Card className="p-6 md:p-8" key={currentQ}>
        <div className="flex items-center gap-2 mb-5">
          <Badge variant={q.type === 'multiple_choice' ? 'info' : 'accent'}>
            {q.type === 'multiple_choice' ? 'Múltipla escolha' : 'Dissertativa'}
          </Badge>
          <span className="text-xs text-text-muted">
            {currentQ + 1} de {questions.length}
          </span>
        </div>

        <p className="text-lg md:text-xl font-display text-text-primary font-semibold leading-relaxed mb-6">
          {q.question}
        </p>

        {q.type === 'multiple_choice' ? (
          <div className="space-y-2.5">
            {q.options?.map((opt, oi) => {
              const letter = String.fromCharCode(65 + oi);
              const selected = answers[currentQ] === letter;
              return (
                <button
                  key={oi}
                  onClick={() => handleAnswer(currentQ, letter)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${
                    selected
                      ? 'bg-accent-soft border-accent shadow-glow'
                      : 'bg-surface-2 border-border hover:border-border-strong'
                  }`}
                  aria-pressed={selected}
                >
                  <div
                    className={`w-8 h-8 shrink-0 rounded-lg flex items-center justify-center font-mono font-bold text-sm ${
                      selected
                        ? 'bg-accent text-bg'
                        : 'bg-surface-3 text-text-muted'
                    }`}
                  >
                    {letter}
                  </div>
                  <span
                    className={`flex-1 ${
                      selected ? 'text-text-primary' : 'text-text-secondary'
                    }`}
                  >
                    {opt}
                  </span>
                  {selected && <Check size={18} className="text-accent" />}
                </button>
              );
            })}
          </div>
        ) : (
          <Textarea
            value={answers[currentQ] || ''}
            onChange={(e) => handleAnswer(currentQ, e.target.value)}
            placeholder="Digite sua resposta..."
            rows={5}
            aria-label={`Resposta da questão ${currentQ + 1}`}
          />
        )}
      </Card>

      {/* Nav */}
      <div className="flex items-center justify-between mt-6">
        <Button
          variant="ghost"
          icon={ChevronLeft}
          onClick={() => setCurrentQ((q) => q - 1)}
          disabled={currentQ === 0}
        >
          Anterior
        </Button>
        {isLast ? (
          <Button
            onClick={submitEvaluation}
            loading={evaluating}
            disabled={!allAnswered}
            size="lg"
          >
            {evaluating ? 'Avaliando...' : 'Finalizar avaliação'}
          </Button>
        ) : (
          <Button
            iconRight={ChevronRight}
            onClick={() => setCurrentQ((q) => q + 1)}
            disabled={!canNext}
          >
            Próxima
          </Button>
        )}
      </div>
    </div>
  );
}
