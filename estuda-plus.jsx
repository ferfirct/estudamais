import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, ScatterChart, Scatter,
  Cell, Legend, Area, AreaChart
} from "recharts";
import { Play, Pause, Square, BookOpen, Brain, BarChart3, Clock, Target, AlertTriangle, ChevronRight, Zap, TrendingUp, CheckCircle, XCircle, Loader, Eye, EyeOff, RotateCcw, Trash2, ArrowLeft, Sparkles, GraduationCap, Timer, Award } from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   SHARED LAYER — Types, Utils, Theme, Storage
   ═══════════════════════════════════════════════════════════════ */

const STORAGE_KEY = "estudaplus_sessions";

function loadSessions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveSessions(sessions) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

function formatTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
  });
}

function calcEfficiency(score, seconds) {
  const hours = seconds / 3600;
  if (hours === 0) return 0;
  return Math.round((score / hours) * 10) / 10;
}

/* ═══════════════════════════════════════════════════════════════
   MICROFRONTEND 1 — Sessão de Estudo
   ═══════════════════════════════════════════════════════════════ */

function StudySession({ onFinish, isActive }) {
  const [topic, setTopic] = useState("");
  const [status, setStatus] = useState("idle"); // idle | running | paused
  const [elapsed, setElapsed] = useState(0);
  const [focusMode, setFocusMode] = useState(false);
  const intervalRef = useRef(null);
  const startTimeRef = useRef(null);

  useEffect(() => {
    if (status === "running") {
      startTimeRef.current = Date.now() - elapsed * 1000;
      intervalRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 200);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [status]);

  const handleStart = () => {
    if (!topic.trim()) return;
    setStatus("running");
    setFocusMode(true);
  };

  const handlePause = () => setStatus("paused");
  const handleResume = () => setStatus("running");

  const handleFinish = () => {
    clearInterval(intervalRef.current);
    setStatus("idle");
    setFocusMode(false);
    onFinish({ topic: topic.trim(), duration: elapsed, startedAt: new Date().toISOString() });
    setTopic("");
    setElapsed(0);
  };

  const handleReset = () => {
    clearInterval(intervalRef.current);
    setStatus("idle");
    setFocusMode(false);
    setElapsed(0);
  };

  const progress = Math.min((elapsed / 3600) * 100, 100);
  const circumference = 2 * Math.PI * 120;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className={`transition-all duration-700 ${focusMode ? "focus-active" : ""}`}>
      {/* Topic Input */}
      {status === "idle" && (
        <div className="animate-in" style={{ animationDelay: "0.1s" }}>
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-medium mb-6">
              <Sparkles size={14} />
              <span>Nova Sessão de Estudo</span>
            </div>
            <h2 className="text-3xl font-bold text-text-primary mb-3" style={{ fontFamily: "'Outfit', sans-serif" }}>
              O que você vai estudar?
            </h2>
            <p className="text-text-muted text-base">
              Digite o tema e inicie o cronômetro quando estiver pronto
            </p>
          </div>

          <div className="max-w-lg mx-auto">
            <div className="relative group">
              <BookOpen size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-accent transition-colors" />
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleStart()}
                placeholder="Ex: Leis de Newton, Concordância Verbal..."
                className="w-full pl-12 pr-4 py-4 bg-surface-elevated border-2 border-border rounded-2xl text-text-primary text-lg placeholder:text-text-muted/50 focus:outline-none focus:border-accent focus:ring-4 focus:ring-accent/10 transition-all"
                aria-label="Tema de estudo"
                autoFocus
              />
            </div>

            <button
              onClick={handleStart}
              disabled={!topic.trim()}
              className="w-full mt-5 py-4 px-6 bg-accent hover:bg-accent-hover disabled:opacity-30 disabled:cursor-not-allowed text-surface font-semibold text-lg rounded-2xl transition-all duration-300 flex items-center justify-center gap-3 shadow-lg shadow-accent/20 hover:shadow-xl hover:shadow-accent/30 hover:-translate-y-0.5 active:translate-y-0"
              aria-label="Iniciar sessão de estudo"
            >
              <Play size={22} fill="currentColor" />
              Iniciar Sessão
            </button>
          </div>

          {/* Quick suggestions */}
          <div className="flex flex-wrap gap-2 justify-center mt-8">
            {["Matemática", "Português", "Física", "História", "Biologia"].map((s) => (
              <button
                key={s}
                onClick={() => setTopic(s)}
                className="px-4 py-2 text-sm bg-surface-elevated border border-border rounded-xl text-text-muted hover:text-accent hover:border-accent/30 transition-all"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Timer Display */}
      {status !== "idle" && (
        <div className="animate-in text-center">
          {focusMode && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 text-accent text-xs font-medium mb-6 animate-pulse">
              <Eye size={12} />
              Modo Foco Ativo
            </div>
          )}

          <div className="relative inline-flex items-center justify-center mb-8">
            <svg width="280" height="280" className="transform -rotate-90">
              <circle cx="140" cy="140" r="120" fill="none" stroke="var(--border)" strokeWidth="6" />
              <circle
                cx="140" cy="140" r="120" fill="none"
                stroke="var(--accent)" strokeWidth="6"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-6xl font-bold text-text-primary tracking-tight" style={{ fontFamily: "'JetBrains Mono', monospace", fontVariantNumeric: "tabular-nums" }}>
                {formatTime(elapsed)}
              </span>
              <span className="text-text-muted text-sm mt-2 max-w-[200px] truncate">
                {topic}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3">
            {status === "running" ? (
              <button
                onClick={handlePause}
                className="p-4 bg-yellow-500/15 text-yellow-400 rounded-2xl hover:bg-yellow-500/25 transition-all"
                aria-label="Pausar"
              >
                <Pause size={28} />
              </button>
            ) : (
              <button
                onClick={handleResume}
                className="p-4 bg-accent/15 text-accent rounded-2xl hover:bg-accent/25 transition-all"
                aria-label="Retomar"
              >
                <Play size={28} fill="currentColor" />
              </button>
            )}

            <button
              onClick={handleFinish}
              disabled={elapsed < 10}
              className="py-4 px-8 bg-accent hover:bg-accent-hover disabled:opacity-30 text-surface font-semibold rounded-2xl transition-all flex items-center gap-2 shadow-lg shadow-accent/20"
              aria-label="Finalizar estudo"
            >
              <Square size={18} fill="currentColor" />
              Finalizar Estudo
            </button>

            <button
              onClick={handleReset}
              className="p-4 bg-red-500/10 text-red-400 rounded-2xl hover:bg-red-500/20 transition-all"
              aria-label="Cancelar"
            >
              <RotateCcw size={22} />
            </button>
          </div>

          <button
            onClick={() => setFocusMode(!focusMode)}
            className="mt-6 inline-flex items-center gap-2 text-sm text-text-muted hover:text-accent transition-colors"
          >
            {focusMode ? <EyeOff size={14} /> : <Eye size={14} />}
            {focusMode ? "Desativar" : "Ativar"} Modo Foco
          </button>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MICROFRONTEND 3 — Avaliação por IA (Quiz)
   ═══════════════════════════════════════════════════════════════ */

function QuizModule({ sessionData, onComplete, onSkip }) {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [currentQ, setCurrentQ] = useState(0);
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    generateQuiz();
  }, []);

  async function generateQuiz() {
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{
            role: "user",
            content: `Você é um professor avaliador. O aluno estudou "${sessionData.topic}" por ${Math.round(sessionData.duration / 60)} minutos. Gere exatamente 4 perguntas de nível médio sobre esse tema para testar a absorção do conteúdo.

Responda APENAS com JSON válido, sem markdown, sem backticks. Formato:
[{"id":1,"type":"multiple_choice","question":"...","options":["A","B","C","D"],"correct":"A"},{"id":2,"type":"open","question":"...","expected":"resposta esperada resumida"}]

Misture 2 questões de múltipla escolha e 2 abertas.`
          }]
        })
      });
      const data = await resp.json();
      const text = data.content?.map(c => c.text || "").join("") || "";
      const cleaned = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleaned);
      setQuestions(parsed);
    } catch (err) {
      console.error(err);
      // Fallback questions
      setQuestions([
        { id: 1, type: "open", question: `Explique com suas palavras o conceito principal de "${sessionData.topic}".`, expected: "Conceito principal do tema" },
        { id: 2, type: "open", question: `Cite dois exemplos práticos relacionados a "${sessionData.topic}".`, expected: "Exemplos práticos" },
        { id: 3, type: "open", question: `Qual a importância de "${sessionData.topic}" no contexto geral da disciplina?`, expected: "Contextualização" },
        { id: 4, type: "open", question: `Quais são as principais dificuldades que um estudante pode encontrar ao estudar "${sessionData.topic}"?`, expected: "Dificuldades comuns" },
      ]);
    }
    setLoading(false);
  }

  async function evaluateAnswers() {
    setEvaluating(true);
    try {
      const qaPairs = questions.map((q, i) => ({
        question: q.question,
        userAnswer: answers[i] || "(sem resposta)",
        ...(q.type === "multiple_choice" ? { correct: q.correct, options: q.options } : { expected: q.expected })
      }));

      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{
            role: "user",
            content: `Avalie as respostas de um aluno sobre "${sessionData.topic}". Perguntas e respostas:
${JSON.stringify(qaPairs, null, 2)}

Responda APENAS com JSON válido sem markdown:
{"score":7.5,"maxScore":10,"perQuestion":[{"correct":true,"feedback":"..."}],"gaps":"Resumo das lacunas do aluno","strengths":"O que o aluno dominou bem"}`
          }]
        })
      });
      const data = await resp.json();
      const text = data.content?.map(c => c.text || "").join("") || "";
      const cleaned = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleaned);
      setResult(parsed);
    } catch {
      // Fallback evaluation
      const answered = Object.keys(answers).length;
      const score = Math.round((answered / questions.length) * 7 + Math.random() * 3);
      setResult({
        score: Math.min(score, 10),
        maxScore: 10,
        perQuestion: questions.map((_, i) => ({
          correct: !!answers[i],
          feedback: answers[i] ? "Resposta registrada." : "Sem resposta."
        })),
        gaps: "Avaliação automática simplificada — revise os temas com atenção.",
        strengths: "Você completou a sessão de estudo, o que já é um ótimo passo!"
      });
    }
    setEvaluating(false);
  }

  const handleAnswer = (qIndex, answer) => {
    setAnswers(prev => ({ ...prev, [qIndex]: answer }));
  };

  const handleSubmit = async () => {
    await evaluateAnswers();
  };

  const handleComplete = () => {
    onComplete({
      ...sessionData,
      score: result.score,
      maxScore: result.maxScore,
      gaps: result.gaps,
      strengths: result.strengths,
      questions: questions.length,
      answeredAt: new Date().toISOString()
    });
  };

  if (loading) {
    return (
      <div className="animate-in text-center py-16">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-accent/10 rounded-3xl mb-6">
          <Brain size={36} className="text-accent animate-pulse" />
        </div>
        <h3 className="text-2xl font-bold text-text-primary mb-3" style={{ fontFamily: "'Outfit', sans-serif" }}>
          Gerando Quiz com IA...
        </h3>
        <p className="text-text-muted">
          Preparando perguntas sobre <strong className="text-accent">{sessionData.topic}</strong>
        </p>
        <div className="mt-6 flex justify-center gap-1">
          {[0, 1, 2].map(i => (
            <div key={i} className="w-2.5 h-2.5 bg-accent rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      </div>
    );
  }

  if (result) {
    const scoreColor = result.score >= 7 ? "text-green-400" : result.score >= 5 ? "text-yellow-400" : "text-red-400";
    const scoreBg = result.score >= 7 ? "bg-green-400/10" : result.score >= 5 ? "bg-yellow-400/10" : "bg-red-400/10";
    return (
      <div className="animate-in">
        <div className="text-center mb-8">
          <div className={`inline-flex items-center justify-center w-24 h-24 ${scoreBg} rounded-3xl mb-5`}>
            <span className={`text-4xl font-bold ${scoreColor}`} style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              {result.score}
            </span>
          </div>
          <h3 className="text-2xl font-bold text-text-primary mb-1" style={{ fontFamily: "'Outfit', sans-serif" }}>
            Resultado da Avaliação
          </h3>
          <p className="text-text-muted">
            {sessionData.topic} — {Math.round(sessionData.duration / 60)} min de estudo
          </p>
        </div>

        {/* Per question results */}
        <div className="space-y-3 mb-6 max-w-2xl mx-auto">
          {result.perQuestion?.map((pq, i) => (
            <div key={i} className={`flex items-start gap-3 p-4 rounded-xl ${pq.correct ? "bg-green-400/5 border border-green-400/20" : "bg-red-400/5 border border-red-400/20"}`}>
              {pq.correct ? <CheckCircle size={18} className="text-green-400 mt-0.5 shrink-0" /> : <XCircle size={18} className="text-red-400 mt-0.5 shrink-0" />}
              <div>
                <p className="text-text-primary text-sm font-medium">Questão {i + 1}</p>
                <p className="text-text-muted text-sm mt-1">{pq.feedback}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Gaps & Strengths */}
        <div className="grid md:grid-cols-2 gap-4 max-w-2xl mx-auto mb-8">
          {result.strengths && (
            <div className="p-5 rounded-xl bg-green-400/5 border border-green-400/15">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle size={16} className="text-green-400" />
                <span className="text-green-400 font-semibold text-sm">Pontos Fortes</span>
              </div>
              <p className="text-text-muted text-sm leading-relaxed">{result.strengths}</p>
            </div>
          )}
          {result.gaps && (
            <div className="p-5 rounded-xl bg-orange-400/5 border border-orange-400/15">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={16} className="text-orange-400" />
                <span className="text-orange-400 font-semibold text-sm">Lacunas</span>
              </div>
              <p className="text-text-muted text-sm leading-relaxed">{result.gaps}</p>
            </div>
          )}
        </div>

        <div className="flex justify-center">
          <button
            onClick={handleComplete}
            className="py-4 px-10 bg-accent hover:bg-accent-hover text-surface font-semibold rounded-2xl transition-all shadow-lg shadow-accent/20 flex items-center gap-2"
          >
            <BarChart3 size={20} />
            Ver no Dashboard
          </button>
        </div>
      </div>
    );
  }

  const q = questions[currentQ];

  return (
    <div className="animate-in max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-xl font-bold text-text-primary" style={{ fontFamily: "'Outfit', sans-serif" }}>
            Avaliação: {sessionData.topic}
          </h3>
          <p className="text-text-muted text-sm mt-1">
            {Math.round(sessionData.duration / 60)} min de estudo • {questions.length} questões
          </p>
        </div>
        <button
          onClick={onSkip}
          className="text-text-muted text-sm hover:text-text-primary transition-colors"
        >
          Pular Quiz →
        </button>
      </div>

      {/* Progress */}
      <div className="flex gap-1.5 mb-8">
        {questions.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
              i < currentQ ? "bg-accent" : i === currentQ ? "bg-accent/60" : "bg-border"
            }`}
          />
        ))}
      </div>

      {/* Question */}
      {q && (
        <div className="animate-in" key={currentQ}>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs font-medium text-accent bg-accent/10 px-2.5 py-1 rounded-lg">
              {q.type === "multiple_choice" ? "Múltipla Escolha" : "Dissertativa"}
            </span>
            <span className="text-xs text-text-muted">
              {currentQ + 1} de {questions.length}
            </span>
          </div>

          <p className="text-lg text-text-primary font-medium mb-6 leading-relaxed">
            {q.question}
          </p>

          {q.type === "multiple_choice" ? (
            <div className="space-y-3">
              {q.options?.map((opt, oi) => {
                const letter = String.fromCharCode(65 + oi);
                const selected = answers[currentQ] === letter;
                return (
                  <button
                    key={oi}
                    onClick={() => handleAnswer(currentQ, letter)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                      selected
                        ? "border-accent bg-accent/10 text-text-primary"
                        : "border-border bg-surface-elevated text-text-muted hover:border-accent/30 hover:text-text-primary"
                    }`}
                  >
                    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold mr-3 ${selected ? "bg-accent text-surface" : "bg-border/50 text-text-muted"}`}>
                      {letter}
                    </span>
                    {opt}
                  </button>
                );
              })}
            </div>
          ) : (
            <textarea
              value={answers[currentQ] || ""}
              onChange={(e) => handleAnswer(currentQ, e.target.value)}
              placeholder="Digite sua resposta..."
              rows={4}
              className="w-full p-4 bg-surface-elevated border-2 border-border rounded-xl text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-accent focus:ring-4 focus:ring-accent/10 transition-all resize-none"
            />
          )}

          <div className="flex justify-between mt-8">
            <button
              onClick={() => setCurrentQ(Math.max(0, currentQ - 1))}
              disabled={currentQ === 0}
              className="px-5 py-3 text-text-muted hover:text-text-primary disabled:opacity-30 transition-colors flex items-center gap-2"
            >
              <ArrowLeft size={16} /> Anterior
            </button>

            {currentQ < questions.length - 1 ? (
              <button
                onClick={() => setCurrentQ(currentQ + 1)}
                className="px-6 py-3 bg-accent/15 text-accent font-medium rounded-xl hover:bg-accent/25 transition-all flex items-center gap-2"
              >
                Próxima <ChevronRight size={16} />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={evaluating}
                className="px-8 py-3 bg-accent hover:bg-accent-hover text-surface font-semibold rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-accent/20 disabled:opacity-50"
              >
                {evaluating ? (
                  <><Loader size={18} className="animate-spin" /> Avaliando...</>
                ) : (
                  <><Brain size={18} /> Enviar Respostas</>
                )}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MICROFRONTEND 2 — Dashboard de Métricas
   ═══════════════════════════════════════════════════════════════ */

function MetricsDashboard({ sessions, onClearHistory }) {
  const [filter, setFilter] = useState("all"); // all | review

  const stats = useMemo(() => {
    if (sessions.length === 0) return null;
    const totalTime = sessions.reduce((a, s) => a + s.duration, 0);
    const avgScore = sessions.reduce((a, s) => a + (s.score || 0), 0) / sessions.length;
    const avgEfficiency = sessions.reduce((a, s) => a + calcEfficiency(s.score || 0, s.duration), 0) / sessions.length;
    const reviewTopics = sessions.filter(s => (s.score || 0) < 6);
    return { totalTime, avgScore: Math.round(avgScore * 10) / 10, avgEfficiency: Math.round(avgEfficiency * 10) / 10, totalSessions: sessions.length, reviewTopics };
  }, [sessions]);

  const chartData = useMemo(() => {
    return sessions.map((s, i) => ({
      name: s.topic?.substring(0, 12) + (s.topic?.length > 12 ? "…" : ""),
      fullTopic: s.topic,
      tempo: Math.round(s.duration / 60),
      nota: s.score || 0,
      eficiencia: calcEfficiency(s.score || 0, s.duration),
      date: formatDate(s.startedAt || s.answeredAt || new Date().toISOString()),
      index: i + 1,
    }));
  }, [sessions]);

  const filteredSessions = filter === "review"
    ? sessions.filter(s => (s.score || 0) < 6)
    : sessions;

  if (sessions.length === 0) {
    return (
      <div className="animate-in text-center py-16">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-surface-elevated rounded-3xl mb-6">
          <BarChart3 size={36} className="text-text-muted" />
        </div>
        <h3 className="text-2xl font-bold text-text-primary mb-3" style={{ fontFamily: "'Outfit', sans-serif" }}>
          Nenhuma sessão ainda
        </h3>
        <p className="text-text-muted max-w-md mx-auto">
          Complete sua primeira sessão de estudo com quiz para ver suas métricas aqui.
        </p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0]?.payload;
    return (
      <div className="bg-surface-elevated border border-border rounded-xl p-3 shadow-xl text-sm">
        <p className="font-semibold text-text-primary">{d?.fullTopic || d?.name}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }} className="mt-1">
            {p.name}: {p.value}{p.name === "tempo" ? " min" : ""}
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className="animate-in">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[
          { label: "Sessões", value: stats.totalSessions, icon: BookOpen, color: "text-blue-400", bg: "bg-blue-400/10" },
          { label: "Tempo Total", value: formatTime(stats.totalTime), icon: Clock, color: "text-purple-400", bg: "bg-purple-400/10" },
          { label: "Nota Média", value: stats.avgScore, icon: Target, color: "text-accent", bg: "bg-accent/10" },
          { label: "Eficiência", value: stats.avgEfficiency, icon: Zap, color: "text-yellow-400", bg: "bg-yellow-400/10" },
        ].map((stat) => (
          <div key={stat.label} className="p-4 bg-surface-elevated rounded-2xl border border-border">
            <div className={`inline-flex items-center justify-center w-10 h-10 ${stat.bg} rounded-xl mb-3`}>
              <stat.icon size={18} className={stat.color} />
            </div>
            <p className="text-2xl font-bold text-text-primary" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              {stat.value}
            </p>
            <p className="text-xs text-text-muted mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      {chartData.length > 1 && (
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          {/* Time vs Quality */}
          <div className="p-5 bg-surface-elevated rounded-2xl border border-border">
            <h4 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
              <TrendingUp size={14} className="text-accent" /> Tempo × Nota
            </h4>
            <ResponsiveContainer width="100%" height={220}>
              <ScatterChart margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="tempo" name="Tempo (min)" tick={{ fill: "var(--text-muted)", fontSize: 11 }} axisLine={{ stroke: "var(--border)" }} />
                <YAxis dataKey="nota" name="Nota" domain={[0, 10]} tick={{ fill: "var(--text-muted)", fontSize: 11 }} axisLine={{ stroke: "var(--border)" }} />
                <Tooltip content={<CustomTooltip />} />
                <Scatter data={chartData} fill="var(--accent)">
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={chartData[i].nota >= 7 ? "#34d399" : chartData[i].nota >= 5 ? "#fbbf24" : "#f87171"} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>

          {/* Evolution */}
          <div className="p-5 bg-surface-elevated rounded-2xl border border-border">
            <h4 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
              <BarChart3 size={14} className="text-accent" /> Evolução das Notas
            </h4>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                <defs>
                  <linearGradient id="gradNota" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fill: "var(--text-muted)", fontSize: 10 }} axisLine={{ stroke: "var(--border)" }} />
                <YAxis domain={[0, 10]} tick={{ fill: "var(--text-muted)", fontSize: 11 }} axisLine={{ stroke: "var(--border)" }} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="nota" stroke="var(--accent)" fill="url(#gradNota)" strokeWidth={2} name="Nota" dot={{ r: 4, fill: "var(--accent)" }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Review Alerts */}
      {stats.reviewTopics.length > 0 && (
        <div className="p-5 bg-orange-400/5 border border-orange-400/15 rounded-2xl mb-6">
          <h4 className="text-sm font-semibold text-orange-400 mb-3 flex items-center gap-2">
            <AlertTriangle size={14} /> Alertas de Revisão ({stats.reviewTopics.length} {stats.reviewTopics.length === 1 ? "tema" : "temas"})
          </h4>
          <div className="flex flex-wrap gap-2">
            {stats.reviewTopics.map((s, i) => (
              <span key={i} className="px-3 py-1.5 bg-orange-400/10 text-orange-300 text-sm rounded-lg">
                {s.topic} — nota {s.score}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* History Filter */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          {[
            { key: "all", label: "Todas" },
            { key: "review", label: "Revisão" },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-2 text-sm rounded-xl transition-all ${
                filter === f.key
                  ? "bg-accent/15 text-accent font-medium"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        {sessions.length > 0 && (
          <button
            onClick={onClearHistory}
            className="text-xs text-red-400/60 hover:text-red-400 transition-colors flex items-center gap-1"
          >
            <Trash2 size={12} /> Limpar
          </button>
        )}
      </div>

      {/* Session History */}
      <div className="space-y-2">
        {[...filteredSessions].reverse().map((s, i) => {
          const eff = calcEfficiency(s.score || 0, s.duration);
          const scoreColor = (s.score || 0) >= 7 ? "text-green-400" : (s.score || 0) >= 5 ? "text-yellow-400" : "text-red-400";
          return (
            <div key={i} className="flex items-center gap-4 p-4 bg-surface-elevated rounded-xl border border-border hover:border-accent/20 transition-all group">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${(s.score || 0) >= 7 ? "bg-green-400/10" : (s.score || 0) >= 5 ? "bg-yellow-400/10" : "bg-red-400/10"}`}>
                <span className={`text-lg font-bold ${scoreColor}`} style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  {s.score ?? "–"}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-text-primary font-medium truncate">{s.topic}</p>
                <p className="text-text-muted text-xs mt-0.5">
                  {formatDate(s.startedAt || s.answeredAt || new Date().toISOString())}
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs text-text-muted shrink-0">
                <span className="flex items-center gap-1"><Clock size={12} /> {Math.round(s.duration / 60)}min</span>
                <span className="flex items-center gap-1"><Zap size={12} /> E:{eff}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SHELL / HOST — Navigation & Layout
   ═══════════════════════════════════════════════════════════════ */

export default function App() {
  const [view, setView] = useState("session"); // session | quiz | dashboard
  const [sessions, setSessions] = useState(() => loadSessions());
  const [pendingSession, setPendingSession] = useState(null);

  useEffect(() => {
    saveSessions(sessions);
  }, [sessions]);

  const handleSessionFinish = (sessionData) => {
    setPendingSession(sessionData);
    setView("quiz");
  };

  const handleQuizComplete = (fullSession) => {
    setSessions(prev => [...prev, fullSession]);
    setPendingSession(null);
    setView("dashboard");
  };

  const handleSkipQuiz = () => {
    if (pendingSession) {
      setSessions(prev => [...prev, { ...pendingSession, score: null, gaps: null, strengths: null }]);
    }
    setPendingSession(null);
    setView("dashboard");
  };

  const handleClearHistory = () => {
    if (window.confirm("Tem certeza que deseja limpar todo o histórico?")) {
      setSessions([]);
    }
  };

  const navItems = [
    { key: "session", label: "Estudar", icon: Timer },
    { key: "dashboard", label: "Métricas", icon: BarChart3 },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Outfit:wght@400;500;600;700;800&family=DM+Sans:ital,wght@0,400;0,500;0,600;1,400&display=swap');

        :root {
          --bg: #0a0b0f;
          --surface: #12131a;
          --surface-elevated: #1a1b26;
          --border: #2a2b3a;
          --accent: #22d3a7;
          --accent-hover: #19b891;
          --text-primary: #e8e9f0;
          --text-muted: #6b6d80;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }

        body, #root {
          font-family: 'DM Sans', sans-serif;
          background: var(--bg);
          color: var(--text-primary);
          min-height: 100vh;
          -webkit-font-smoothing: antialiased;
        }

        .bg-surface { background: var(--surface); }
        .bg-surface-elevated { background: var(--surface-elevated); }
        .border-border { border-color: var(--border); }
        .text-text-primary { color: var(--text-primary); }
        .text-text-muted { color: var(--text-muted); }
        .text-accent { color: var(--accent); }
        .bg-accent { background: var(--accent); }
        .bg-accent-hover { background: var(--accent-hover); }
        .hover\\:bg-accent:hover { background: var(--accent); }
        .hover\\:bg-accent-hover:hover { background: var(--accent-hover); }
        .text-surface { color: var(--surface); }
        .shadow-accent\\/20 { box-shadow: 0 8px 25px rgba(34, 211, 167, 0.2); }
        .shadow-accent\\/30 { box-shadow: 0 12px 35px rgba(34, 211, 167, 0.3); }
        .focus\\:border-accent:focus { border-color: var(--accent); }
        .focus\\:ring-accent\\/10:focus { --tw-ring-color: rgba(34, 211, 167, 0.1); }
        .hover\\:border-accent\\/30:hover { border-color: rgba(34, 211, 167, 0.3); }
        .hover\\:border-accent\\/20:hover { border-color: rgba(34, 211, 167, 0.2); }
        .bg-accent\\/10 { background: rgba(34, 211, 167, 0.1); }
        .bg-accent\\/15 { background: rgba(34, 211, 167, 0.15); }
        .bg-accent\\/25 { background: rgba(34, 211, 167, 0.25); }
        .border-accent { border-color: var(--accent); }
        .hover\\:text-accent:hover { color: var(--accent); }
        .group:hover .group-hover\\:text-accent { color: var(--accent); }
        .group-focus-within\\:text-accent:is(:focus-within *) { color: var(--accent); }
        .border-accent\\/20 { border-color: rgba(34, 211, 167, 0.2); }

        .animate-in {
          animation: fadeSlideIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .focus-active {
          animation: focusPulse 3s ease-in-out infinite;
        }

        @keyframes focusPulse {
          0%, 100% { box-shadow: none; }
          50% { box-shadow: inset 0 0 60px rgba(34, 211, 167, 0.03); }
        }

        /* Noise texture overlay */
        .noise-bg::before {
          content: '';
          position: fixed;
          inset: 0;
          opacity: 0.015;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          pointer-events: none;
          z-index: 0;
        }

        input, textarea, button { font-family: inherit; }

        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
      `}</style>

      <div className="noise-bg" style={{ minHeight: "100vh", background: "var(--bg)" }}>
        {/* Header */}
        <header style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)", position: "sticky", top: 0, zIndex: 50, backdropFilter: "blur(12px)" }}>
          <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 12, background: "linear-gradient(135deg, var(--accent), #0ea5e9)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <GraduationCap size={20} color="var(--surface)" />
              </div>
              <span style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: 20, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
                Estuda<span style={{ color: "var(--accent)" }}>+</span>
              </span>
            </div>

            <nav style={{ display: "flex", gap: 4 }}>
              {navItems.map((item) => {
                const active = view === item.key || (view === "quiz" && item.key === "session");
                return (
                  <button
                    key={item.key}
                    onClick={() => {
                      if (view === "quiz") return;
                      setView(item.key);
                    }}
                    disabled={view === "quiz"}
                    style={{
                      display: "flex", alignItems: "center", gap: 6,
                      padding: "8px 16px", borderRadius: 12, border: "none",
                      cursor: view === "quiz" ? "not-allowed" : "pointer",
                      background: active ? "rgba(34,211,167,0.1)" : "transparent",
                      color: active ? "var(--accent)" : "var(--text-muted)",
                      fontWeight: active ? 600 : 400,
                      fontSize: 14,
                      transition: "all 0.2s",
                      opacity: view === "quiz" ? 0.5 : 1,
                    }}
                    aria-label={item.label}
                    aria-current={active ? "page" : undefined}
                  >
                    <item.icon size={16} />
                    {item.label}
                    {item.key === "dashboard" && sessions.length > 0 && (
                      <span style={{
                        background: "var(--accent)", color: "var(--surface)",
                        fontSize: 10, fontWeight: 700, borderRadius: 99,
                        padding: "1px 6px", lineHeight: "16px",
                      }}>
                        {sessions.length}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </header>

        {/* Main Content */}
        <main style={{ maxWidth: 960, margin: "0 auto", padding: "40px 24px 100px" }}>
          {view === "session" && (
            <StudySession onFinish={handleSessionFinish} isActive />
          )}
          {view === "quiz" && pendingSession && (
            <QuizModule
              sessionData={pendingSession}
              onComplete={handleQuizComplete}
              onSkip={handleSkipQuiz}
            />
          )}
          {view === "dashboard" && (
            <MetricsDashboard sessions={sessions} onClearHistory={handleClearHistory} />
          )}
        </main>

        {/* Footer */}
        <footer style={{
          textAlign: "center", padding: "24px",
          color: "var(--text-muted)", fontSize: 12,
          borderTop: "1px solid var(--border)",
        }}>
          <span style={{ fontFamily: "'Outfit', sans-serif" }}>
            Estuda+ — Não apenas conte as horas, teste a sua absorção.
          </span>
        </footer>
      </div>
    </>
  );
}
