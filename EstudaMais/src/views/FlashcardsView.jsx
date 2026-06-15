import { useEffect, useState, useMemo } from 'react';
import { Layers, Plus, Sparkles, RotateCcw, Check, X, Trash2, Brain, BookOpen } from 'lucide-react';
import { Button, Card, Badge, EmptyState, IconButton, Skeleton } from '../ui.jsx';
import { flashcardsApi } from '../api';
import { toast } from '../lib.js';

function FlipCard({ front, back }) {
  const [revealed, setRevealed] = useState(false);

  return (
    <div style={{ perspective: '1000px' }} className="w-full">
      <div
        style={{
          position: 'relative',
          transformStyle: 'preserve-3d',
          transition: 'transform 0.5s',
          transform: revealed ? 'rotateY(180deg)' : 'rotateY(0deg)',
          minHeight: 220,
        }}
      >
        {/* Frente */}
        <div
          style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
          className="absolute inset-0 flex flex-col items-center justify-center p-8 bg-surface border border-border rounded-2xl"
        >
          <span className="text-2xs font-semibold uppercase tracking-wider text-text-muted mb-4">Conceito</span>
          <p className="text-xl font-display font-bold text-text-primary text-center leading-snug">{front}</p>
          {!revealed && (
            <button
              onClick={() => setRevealed(true)}
              className="mt-8 px-6 py-2.5 rounded-xl bg-accent text-bg text-sm font-semibold hover:bg-accent-hover transition-colors"
            >
              Revelar resposta
            </button>
          )}
        </div>
        {/* Verso */}
        <div
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
          className="absolute inset-0 flex flex-col items-center justify-center p-8 bg-accent-soft border border-accent-border rounded-2xl"
        >
          <span className="text-2xs font-semibold uppercase tracking-wider text-accent mb-4">Resposta</span>
          <p className="text-lg text-text-primary text-center leading-relaxed">{back}</p>
        </div>
      </div>
    </div>
  );
}

function ReviewSession({ cards, onFinish }) {
  const [idx, setIdx] = useState(0);
  const [results, setResults] = useState({ remembered: 0, forgot: 0 });
  const [done, setDone] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const card = cards[idx];

  async function handleAnswer(remembered) {
    setSubmitting(true);
    try {
      await flashcardsApi.reviewFlashcard(card.id, remembered);
      const newResults = { ...results, [remembered ? 'remembered' : 'forgot']: results[remembered ? 'remembered' : 'forgot'] + 1 };
      setResults(newResults);
      if (idx + 1 >= cards.length) {
        setDone(true);
      } else {
        setIdx(i => i + 1);
        setRevealed(false);
      }
    } catch (err) {
      toast({ title: 'Erro ao registrar revisão', description: err?.message, variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="text-center py-12 animate-in">
        <div className="w-20 h-20 rounded-3xl bg-accent-soft border border-accent-border flex items-center justify-center mx-auto mb-6">
          <Brain size={36} className="text-accent" />
        </div>
        <h2 className="text-2xl font-display font-bold text-text-primary mb-2">Revisão concluída!</h2>
        <div className="flex justify-center gap-6 mt-6 mb-8">
          <div className="text-center">
            <div className="text-3xl font-mono font-bold text-success">{results.remembered}</div>
            <div className="text-xs text-text-muted mt-1">Lembrou</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-mono font-bold text-danger">{results.forgot}</div>
            <div className="text-xs text-text-muted mt-1">Não lembrou</div>
          </div>
        </div>
        <Button onClick={onFinish} icon={RotateCcw}>Voltar à biblioteca</Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto animate-in">
      <div className="flex items-center justify-between mb-6">
        <span className="text-sm text-text-muted">{idx + 1} de {cards.length}</span>
        <Button variant="ghost" size="sm" onClick={onFinish}>Encerrar</Button>
      </div>

      <div className="flex gap-1.5 mb-8">
        {cards.map((_, i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i < idx ? 'bg-accent' : i === idx ? 'bg-accent/50' : 'bg-border'}`} />
        ))}
      </div>

      <div style={{ perspective: '1000px', minHeight: 260 }} className="w-full mb-6">
        <div
          style={{
            position: 'relative',
            transformStyle: 'preserve-3d',
            transition: 'transform 0.5s',
            transform: revealed ? 'rotateY(180deg)' : 'rotateY(0deg)',
            minHeight: 260,
          }}
        >
          <div
            style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
            className="absolute inset-0 flex flex-col items-center justify-center p-8 bg-surface border border-border rounded-2xl"
          >
            <span className="text-2xs font-semibold uppercase tracking-wider text-text-muted mb-4">Conceito</span>
            <p className="text-xl font-display font-bold text-text-primary text-center leading-snug">{card.front}</p>
            {!revealed && (
              <button
                onClick={() => setRevealed(true)}
                className="mt-8 px-6 py-2.5 rounded-xl bg-accent text-bg text-sm font-semibold hover:bg-accent-hover transition-colors"
              >
                Revelar resposta
              </button>
            )}
          </div>
          <div
            style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
            className="absolute inset-0 flex flex-col items-center justify-center p-8 bg-accent-soft border border-accent-border rounded-2xl"
          >
            <span className="text-2xs font-semibold uppercase tracking-wider text-accent mb-4">Resposta</span>
            <p className="text-lg text-text-primary text-center leading-relaxed">{card.back}</p>
          </div>
        </div>
      </div>

      {revealed && (
        <div className="flex gap-3 justify-center animate-in">
          <Button
            variant="danger"
            icon={X}
            size="lg"
            onClick={() => handleAnswer(false)}
            loading={submitting}
            className="flex-1 max-w-[200px]"
          >
            Não lembrei
          </Button>
          <Button
            icon={Check}
            size="lg"
            onClick={() => handleAnswer(true)}
            loading={submitting}
            className="flex-1 max-w-[200px]"
          >
            Lembrei
          </Button>
        </div>
      )}
    </div>
  );
}

export default function FlashcardsView() {
  const [flashcards, setFlashcards] = useState([]);
  const [dueCards, setDueCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewTheme, setReviewTheme] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [genForm, setGenForm] = useState({ theme: '', count: 10, difficulty: 'medium' });
  const [showGenForm, setShowGenForm] = useState(false);

  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    setLoading(true);
    try {
      const [all, due] = await Promise.all([
        flashcardsApi.listFlashcards(),
        flashcardsApi.listFlashcards({ dueOnly: true }),
      ]);
      setFlashcards(all || []);
      setDueCards(due || []);
    } catch (err) {
      toast({ title: 'Erro ao carregar flashcards', description: err?.message, variant: 'error' });
    } finally {
      setLoading(false);
    }
  }

  const themes = useMemo(() => {
    const map = new Map();
    for (const f of flashcards) {
      if (!map.has(f.theme)) map.set(f.theme, { total: 0, due: 0 });
      map.get(f.theme).total++;
    }
    for (const f of dueCards) {
      if (map.has(f.theme)) map.get(f.theme).due++;
    }
    return [...map.entries()].map(([theme, stats]) => ({ theme, ...stats }));
  }, [flashcards, dueCards]);

  async function handleGenerate(e) {
    e.preventDefault();
    if (!genForm.theme.trim()) return;
    setGenerating(true);
    try {
      const cards = await flashcardsApi.generateFlashcards(genForm.theme.trim(), genForm.count, genForm.difficulty);
      setFlashcards(prev => [...cards, ...prev]);
      setDueCards(prev => [...cards, ...prev]);
      setShowGenForm(false);
      setGenForm({ theme: '', count: 10, difficulty: 'medium' });
      toast({ title: `${cards.length} flashcards gerados!`, variant: 'success' });
    } catch (err) {
      toast({ title: 'Erro ao gerar flashcards', description: err?.message, variant: 'error' });
    } finally {
      setGenerating(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Deletar este flashcard?')) return;
    try {
      await flashcardsApi.deleteFlashcard(id);
      setFlashcards(prev => prev.filter(f => f.id !== id));
      setDueCards(prev => prev.filter(f => f.id !== id));
      toast({ title: 'Flashcard deletado', variant: 'info' });
    } catch (err) {
      toast({ title: 'Erro ao deletar', description: err?.message, variant: 'error' });
    }
  }

  if (reviewTheme !== null) {
    const cards = reviewTheme === '__due__'
      ? dueCards
      : flashcards.filter(f => f.theme === reviewTheme);
    return (
      <ReviewSession
        cards={cards}
        onFinish={() => { setReviewTheme(null); fetchAll(); }}
      />
    );
  }

  return (
    <div className="animate-in max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-8 gap-4">
        <div>
          <Badge variant="accent" icon={Layers} className="mb-3">Flashcards</Badge>
          <h1 className="text-3xl font-display font-bold text-text-primary tracking-tight">Biblioteca de flashcards</h1>
          <p className="text-text-muted mt-1">{flashcards.length} cards · {dueCards.length} para revisar hoje</p>
        </div>
        <div className="flex gap-2">
          {dueCards.length > 0 && (
            <Button variant="secondary" icon={RotateCcw} onClick={() => setReviewTheme('__due__')}>
              Revisar todos ({dueCards.length})
            </Button>
          )}
          <Button icon={Sparkles} onClick={() => setShowGenForm(v => !v)}>Gerar com IA</Button>
        </div>
      </div>

      {/* Form geração */}
      {showGenForm && (
        <Card className="p-5 mb-6">
          <h3 className="text-sm font-semibold text-text-primary mb-4">Gerar flashcards com IA</h3>
          <form onSubmit={handleGenerate} className="space-y-4">
            <input
              type="text"
              placeholder="Tema"
              value={genForm.theme}
              onChange={e => setGenForm({ ...genForm, theme: e.target.value })}
              className="w-full bg-surface-2 border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent"
              autoFocus
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-text-muted block mb-2">Quantidade</label>
                <div className="flex gap-2">
                  {[5, 10, 20].map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setGenForm({ ...genForm, count: n })}
                      className={`flex-1 py-2 rounded-xl border text-xs font-semibold transition-all ${
                        genForm.count === n ? 'bg-accent-soft border-accent-border text-accent' : 'bg-surface-2 border-border text-text-secondary'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-text-muted block mb-2">Dificuldade</label>
                <div className="flex gap-2">
                  {[['easy', 'Fácil'], ['medium', 'Médio'], ['hard', 'Difícil']].map(([v, l]) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setGenForm({ ...genForm, difficulty: v })}
                      className={`flex-1 py-2 rounded-xl border text-xs font-semibold transition-all ${
                        genForm.difficulty === v ? 'bg-accent-soft border-accent-border text-accent' : 'bg-surface-2 border-border text-text-secondary'
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="ghost" onClick={() => setShowGenForm(false)}>Cancelar</Button>
              <Button type="submit" loading={generating} disabled={!genForm.theme.trim()} icon={Sparkles}>
                {generating ? 'Gerando...' : 'Gerar'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Empty state */}
      {!loading && flashcards.length === 0 && (
        <EmptyState
          icon={Layers}
          title="Nenhum flashcard ainda"
          description="Gere flashcards com IA para um tema e comece a revisar."
          action={<Button icon={Sparkles} onClick={() => setShowGenForm(true)}>Gerar com IA</Button>}
        />
      )}

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      )}

      {/* Temas */}
      <div className="space-y-4">
        {themes.map(({ theme, total, due }) => (
          <Card key={theme} className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-display font-bold text-text-primary truncate">{theme}</h3>
                  {due > 0 && (
                    <Badge variant="warning" className="text-2xs shrink-0">{due} para revisar</Badge>
                  )}
                </div>
                <p className="text-xs text-text-muted">{total} flashcard{total !== 1 ? 's' : ''}</p>
              </div>
              <div className="flex gap-2 shrink-0 ml-4">
                <Button
                  variant="secondary"
                  size="sm"
                  icon={RotateCcw}
                  onClick={() => setReviewTheme(theme)}
                >
                  Revisar
                </Button>
              </div>
            </div>

            {/* Preview cards */}
            <div className="mt-4 space-y-2 max-h-48 overflow-hidden">
              {flashcards.filter(f => f.theme === theme).slice(0, 3).map(f => (
                <div key={f.id} className="flex items-start gap-3 p-3 bg-surface-2 rounded-xl">
                  <BookOpen size={14} className="text-text-muted shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-text-primary truncate">{f.front}</p>
                    <p className="text-xs text-text-muted truncate mt-0.5">{f.back}</p>
                  </div>
                  <IconButton icon={Trash2} label="Deletar" variant="ghost" size="sm" onClick={() => handleDelete(f.id)} />
                </div>
              ))}
              {total > 3 && (
                <p className="text-xs text-text-dim text-center pt-1">+{total - 3} mais</p>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
