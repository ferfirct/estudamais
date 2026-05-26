import { useState, useEffect } from 'react';
import {
  BookOpen, Sparkles, ChevronRight,
  Dumbbell, History, Info
} from 'lucide-react';
import { Button, Card, Badge, Input } from '../ui.jsx';
import { quizApi } from '../api';
import { toast } from '../lib.js';

const DIFFICULTY_OPTIONS = [
  { value: 'easy', label: 'Fácil', detail: 'básico' },
  { value: 'medium', label: 'Médio', detail: 'aplicação' },
  { value: 'hard', label: 'Difícil', detail: 'análise crítica' },
];

const QUIZ_TYPE_OPTIONS = [
  { value: 'free', label: 'Estudo livre', detail: 'tema livre' },
  { value: 'civil_service', label: 'Concurso', detail: 'bancas reais' },
  { value: 'vestibular', label: 'Vestibular', detail: 'ENEM/FUVEST' },
];

const COUNT_OPTIONS = [3, 5, 8, 10];

export default function PracticeView({ onStartPractice, onStartWrongPractice }) {
  const [mode, setMode] = useState('free');

  const [topic, setTopic] = useState('');
  const [practicedThemes, setPracticedThemes] = useState([]);
  const [questionCount, setQuestionCount] = useState(5);
  const [questionDistribution, setQuestionDistribution] = useState({
    multipleChoice: 5, summation: 0, discursive: 0,
  });
  const [difficulty, setDifficulty] = useState('medium');
  const [quizType, setQuizType] = useState('free');
  const [learningMode, setLearningMode] = useState(false);
  const [explainAfterAnswer, setExplainAfterAnswer] = useState(true);
  const [distributionError, setDistributionError] = useState('');
  const [loading, setLoading] = useState(false);

  const [wrongQuestions, setWrongQuestions] = useState([]);
  const [loadingWrong, setLoadingWrong] = useState(false);
  const [selectedWrong, setSelectedWrong] = useState(new Set());

  useEffect(() => {
    quizApi.getPracticedThemes()
      .then(({ themes }) => setPracticedThemes(themes))
      .catch(() => {});

    setLoadingWrong(true);
    quizApi.listWrongQuestions()
      .then(data => setWrongQuestions(data))
      .catch(() => {})
      .finally(() => setLoadingWrong(false));
  }, []);

  useEffect(() => {
    const sum = questionDistribution.multipleChoice
      + questionDistribution.summation
      + questionDistribution.discursive;
    if (sum !== questionCount) {
      setDistributionError(`A soma deve ser igual a ${questionCount} (atual: ${sum})`);
    } else {
      setDistributionError('');
    }
  }, [questionDistribution, questionCount]);

  function handleCountChange(count) {
    setQuestionCount(count);
    setQuestionDistribution({ multipleChoice: count, summation: 0, discursive: 0 });
  }

  function handleDistChange(field, value) {
    const num = Math.max(0, Math.min(questionCount, Number(value) || 0));
    setQuestionDistribution(prev => ({ ...prev, [field]: num }));
  }

  async function handleStartFree() {
    if (!topic.trim()) {
      toast({ title: 'Digite um tema', variant: 'warning' });
      return;
    }
    if (distributionError) {
      toast({ title: 'Corrija a distribuição de questões', variant: 'warning' });
      return;
    }
    setLoading(true);
    try {
      const result = await quizApi.startPractice({
        theme: topic.trim(),
        questionCount,
        questionDistribution,
        difficulty,
        learningMode,
        quizType,
      });
      onStartPractice({
        sessionId: result.sessionId,
        questions: result.questions,
        topic: topic.trim(),
        duration: 0,
        targetMinutes: 0,
        startedAt: new Date().toISOString(),
        questionCount,
        questionDistribution,
        difficulty,
        learningMode,
        quizType,
        explainAfterAnswer,
        practiceMode: true,
      });
    } catch (err) {
      toast({ title: 'Erro ao gerar questões', description: err.message, variant: 'error' });
    }
    setLoading(false);
  }

  async function handleStartWrong() {
    if (selectedWrong.size === 0) {
      toast({ title: 'Selecione ao menos uma questão', variant: 'warning' });
      return;
    }
    setLoading(true);
    try {
      const ids = [...selectedWrong];
      const firstWq = wrongQuestions.find(w => ids.includes(w.id));
      const result = await quizApi.startPractice({
        theme: firstWq?.theme ?? 'Revisão',
        wrongQuestionIds: ids,
      });
      onStartWrongPractice({
        sessionId: result.sessionId,
        questions: result.questions,
        topic: 'Revisão de erros',
        duration: 0,
        targetMinutes: 0,
        startedAt: new Date().toISOString(),
        difficulty: 'medium',
        learningMode: false,
        quizType: 'free',
        explainAfterAnswer: true,
        practiceMode: true,
        wrongQuestionIds: ids,
      });
    } catch (err) {
      toast({ title: 'Erro ao carregar questões', description: err.message, variant: 'error' });
    }
    setLoading(false);
  }

  function Toggle({ value, onChange }) {
    return (
      <button
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          value ? 'bg-accent' : 'bg-surface-3 border border-border'
        }`}
      >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          value ? 'translate-x-6' : 'translate-x-1'
        }`} />
      </button>
    );
  }

  return (
    <div className="animate-in max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <Badge variant="accent" icon={Dumbbell} className="mb-4">
          Prática de questões
        </Badge>
        <h1 className="text-3xl md:text-4xl font-display font-bold text-text-primary tracking-tight mb-2">
          Pratique sem cronômetro
        </h1>
        <p className="text-text-muted">
          Resolva questões avulsas ou refaça seus erros
        </p>
      </div>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setMode('free')}
          className={`flex-1 py-3 rounded-xl text-sm font-semibold border transition-all flex items-center justify-center gap-2 ${
            mode === 'free'
              ? 'bg-accent-soft border-accent-border text-accent'
              : 'bg-surface-2 border-border text-text-muted hover:text-text-secondary'
          }`}
        >
          <Sparkles size={15} />
          Prática livre
        </button>
        <button
          onClick={() => setMode('wrong')}
          className={`flex-1 py-3 rounded-xl text-sm font-semibold border transition-all flex items-center justify-center gap-2 ${
            mode === 'wrong'
              ? 'bg-danger-soft border-danger/40 text-danger'
              : 'bg-surface-2 border-border text-text-muted hover:text-text-secondary'
          }`}
        >
          <History size={15} />
          Refazer erros
          {wrongQuestions.length > 0 && (
            <span className={`text-2xs font-mono font-bold rounded-full px-1.5 min-w-[18px] text-center ${
              mode === 'wrong' ? 'bg-danger text-white' : 'bg-surface-3 text-text-secondary'
            }`}>
              {wrongQuestions.length}
            </span>
          )}
        </button>
      </div>

      {mode === 'free' && (
        <div className="space-y-5">
          <div>
            <p className="text-2xs font-semibold uppercase tracking-wider text-text-muted mb-3">
              Tema
            </p>
            <Input
              icon={BookOpen}
              value={topic}
              onChange={e => setTopic(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleStartFree()}
              placeholder="Ex: Física ondulatória, Revolução Francesa..."
              autoFocus
            />
            {practicedThemes.length > 0 && (
              <div className="mt-3">
                <p className="text-2xs text-text-dim mb-2">Temas já estudados:</p>
                <div className="flex flex-wrap gap-2">
                  {practicedThemes.slice(0, 8).map(t => (
                    <button
                      key={t}
                      onClick={() => setTopic(t)}
                      className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${
                        topic === t
                          ? 'bg-accent-soft border-accent-border text-accent'
                          : 'bg-surface-2 border-border text-text-muted hover:text-accent hover:border-accent-border'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div>
            <p className="text-2xs font-semibold uppercase tracking-wider text-text-muted mb-3">
              Questões
            </p>
            <div className="grid grid-cols-4 gap-2">
              {COUNT_OPTIONS.map(n => (
                <button
                  key={n}
                  onClick={() => handleCountChange(n)}
                  className={`p-3 rounded-xl border transition-all text-center ${
                    questionCount === n
                      ? 'bg-accent-soft border-accent-border shadow-glow'
                      : 'bg-surface-2 border-border hover:border-border-strong'
                  }`}
                  aria-pressed={questionCount === n}
                >
                  <span className={`text-lg font-display font-bold ${
                    questionCount === n ? 'text-accent' : 'text-text-primary'
                  }`}>{n}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-2xs font-semibold uppercase tracking-wider text-text-muted mb-3">
              Distribuição de tipos
            </p>
            <Card className="p-4">
              <div className="grid grid-cols-3 gap-3">
                {[
                  { key: 'multipleChoice', label: 'Múltipla escolha' },
                  { key: 'summation', label: 'Somatória' },
                  { key: 'discursive', label: 'Discursiva' },
                ].map(({ key, label }) => (
                  <div key={key} className="text-center">
                    <p className="text-2xs text-text-muted mb-2">{label}</p>
                    <input
                      type="number"
                      min={0}
                      max={questionCount}
                      value={questionDistribution[key]}
                      onChange={e => handleDistChange(key, e.target.value)}
                      className="bg-surface-2 border border-border rounded-xl px-2 py-2 text-sm text-text-primary text-center w-full focus:outline-none focus:border-accent"
                    />
                  </div>
                ))}
              </div>
              {distributionError
                ? <p className="text-xs text-danger mt-3">{distributionError}</p>
                : <p className="text-xs text-accent mt-3">
                    {questionDistribution.multipleChoice} + {questionDistribution.summation} + {questionDistribution.discursive} = {questionCount} ✓
                  </p>
              }
            </Card>
          </div>

          <div>
            <p className="text-2xs font-semibold uppercase tracking-wider text-text-muted mb-3">
              Dificuldade
            </p>
            <div className="grid grid-cols-3 gap-2">
              {DIFFICULTY_OPTIONS.map(opt => (
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
                    <span className={`text-xs font-semibold ${
                      difficulty === opt.value ? 'text-accent' : 'text-text-secondary'
                    }`}>{opt.label}</span>
                    <span className="text-xs font-mono text-text-muted">{opt.detail}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-2xs font-semibold uppercase tracking-wider text-text-muted mb-3">
              Tipo de questão
            </p>
            <div className="grid grid-cols-3 gap-2">
              {QUIZ_TYPE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setQuizType(opt.value)}
                  className={`p-3 rounded-xl border transition-all text-left ${
                    quizType === opt.value
                      ? 'bg-accent-soft border-accent-border shadow-glow'
                      : 'bg-surface-2 border-border hover:border-border-strong'
                  }`}
                  aria-pressed={quizType === opt.value}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-semibold ${
                      quizType === opt.value ? 'text-accent' : 'text-text-secondary'
                    }`}>{opt.label}</span>
                  </div>
                  <p className="text-2xs text-text-muted">{opt.detail}</p>
                </button>
              ))}
            </div>
            {(quizType === 'civil_service' || quizType === 'vestibular') && (
              <p className="text-2xs text-text-muted mt-2 flex items-center gap-1">
                <Info size={11} />
                A IA se baseia em questões reais deste tipo de prova.
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Card className="p-4 flex items-center justify-between gap-3">
              <div className="flex-1">
                <p className="text-sm font-semibold text-text-primary">Modo aprendizado</p>
                <p className="text-2xs text-text-muted mt-0.5">
                  Dica teórica antes de cada pergunta
                </p>
              </div>
              <Toggle value={learningMode} onChange={setLearningMode} />
            </Card>
            <Card className="p-4 flex items-center justify-between gap-3">
              <div className="flex-1">
                <p className="text-sm font-semibold text-text-primary">Explicar após resposta</p>
                <p className="text-2xs text-text-muted mt-0.5">
                  IA explica cada alternativa
                </p>
              </div>
              <Toggle value={explainAfterAnswer} onChange={setExplainAfterAnswer} />
            </Card>
          </div>

          <Button
            onClick={handleStartFree}
            loading={loading}
            disabled={!topic.trim() || !!distributionError}
            size="xl"
            icon={ChevronRight}
            className="w-full"
          >
            Gerar questões
          </Button>
        </div>
      )}

      {mode === 'wrong' && (
        <div className="space-y-4">
          {loadingWrong && (
            <p className="text-sm text-text-muted text-center py-8">Carregando...</p>
          )}

          {!loadingWrong && wrongQuestions.length === 0 && (
            <div className="text-center py-12">
              <p className="text-text-muted text-sm">
                Nenhuma questão para refazer ainda.
              </p>
              <p className="text-text-dim text-xs mt-1">
                Questões erradas aparecem aqui automaticamente após os quizzes.
              </p>
            </div>
          )}

          {wrongQuestions.length > 0 && (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm text-text-muted">
                  Selecione as questões que quer refazer
                </p>
                <button
                  onClick={() => {
                    if (selectedWrong.size === wrongQuestions.length) {
                      setSelectedWrong(new Set());
                    } else {
                      setSelectedWrong(new Set(wrongQuestions.map(w => w.id)));
                    }
                  }}
                  className="text-xs text-accent hover:underline"
                >
                  {selectedWrong.size === wrongQuestions.length ? 'Desmarcar todos' : 'Selecionar todos'}
                </button>
              </div>

              <div className="space-y-2">
                {wrongQuestions.map(wq => {
                  const selected = selectedWrong.has(wq.id);
                  return (
                    <button
                      key={wq.id}
                      onClick={() => {
                        setSelectedWrong(prev => {
                          const next = new Set(prev);
                          if (next.has(wq.id)) next.delete(wq.id);
                          else next.add(wq.id);
                          return next;
                        });
                      }}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                        selected
                          ? 'bg-danger-soft border-danger/50'
                          : 'bg-surface-2 border-border hover:border-border-strong'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-5 h-5 rounded-md border-2 shrink-0 mt-0.5 flex items-center justify-center transition-all ${
                          selected ? 'bg-danger border-danger' : 'border-border'
                        }`}>
                          {selected && (
                            <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                              <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-xs font-semibold text-text-secondary">{wq.theme}</span>
                            <Badge variant="default" className="text-2xs">
                              {wq.quizType === 'civil_service' ? 'Concurso' : wq.quizType === 'vestibular' ? 'Vestibular' : 'Livre'}
                            </Badge>
                            <Badge variant={wq.difficulty === 'hard' ? 'danger' : wq.difficulty === 'medium' ? 'warning' : 'default'} className="text-2xs">
                              {wq.difficulty === 'easy' ? 'Fácil' : wq.difficulty === 'medium' ? 'Médio' : 'Difícil'}
                            </Badge>
                          </div>
                          <p className="text-sm text-text-primary leading-snug line-clamp-2">
                            {wq.question.question}
                          </p>
                          <p className="text-2xs text-text-dim mt-1">
                            Sua resposta anterior: <span className="text-danger">{wq.userAnswer || '(sem resposta)'}</span>
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <Button
                onClick={handleStartWrong}
                loading={loading}
                disabled={selectedWrong.size === 0}
                size="xl"
                icon={ChevronRight}
                className="w-full"
              >
                Refazer {selectedWrong.size > 0 ? `${selectedWrong.size} questão(ões)` : 'selecionadas'}
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
