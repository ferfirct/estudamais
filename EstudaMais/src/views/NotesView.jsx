import { useEffect, useState, useMemo } from 'react';
import { NotebookPen, Plus, Trash2, Pencil, Check, X, Tag } from 'lucide-react';
import { Button, Card, Badge, EmptyState, IconButton, Textarea } from '../ui.jsx';
import { notesApi } from '../api';
import { toast } from '../lib.js';

export default function NotesView({ user }) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterTheme, setFilterTheme] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newTheme, setNewTheme] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState('');

  useEffect(() => {
    fetchNotes();
  }, []);

  async function fetchNotes() {
    setLoading(true);
    try {
      const data = await notesApi.listNotes();
      setNotes(data || []);
    } catch (err) {
      toast({ title: 'Erro ao carregar anotações', description: err?.message, variant: 'error' });
    } finally {
      setLoading(false);
    }
  }

  const themes = useMemo(() => {
    const seen = new Set();
    return notes.filter(n => n.theme && !seen.has(n.theme) && seen.add(n.theme)).map(n => n.theme);
  }, [notes]);

  const filtered = useMemo(() => {
    return filterTheme ? notes.filter(n => n.theme === filterTheme) : notes;
  }, [notes, filterTheme]);

  const grouped = useMemo(() => {
    const map = new Map();
    for (const note of filtered) {
      const key = note.theme || '(sem tema)';
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(note);
    }
    return [...map.entries()];
  }, [filtered]);

  async function handleCreate(e) {
    e.preventDefault();
    if (!newContent.trim()) return;
    setSaving(true);
    try {
      const note = await notesApi.createNote({ content: newContent.trim(), theme: newTheme.trim() || undefined });
      setNotes(prev => [note, ...prev]);
      setNewContent('');
      setNewTheme('');
      setShowForm(false);
      toast({ title: 'Anotação salva', variant: 'success' });
    } catch (err) {
      toast({ title: 'Erro ao salvar', description: err?.message, variant: 'error' });
    } finally {
      setSaving(false);
    }
  }

  function startEdit(note) {
    setEditingId(note.id);
    setEditContent(note.content);
  }

  async function saveEdit(id) {
    try {
      const updated = await notesApi.updateNote(id, editContent);
      setNotes(prev => prev.map(n => n.id === id ? updated : n));
      setEditingId(null);
      toast({ title: 'Anotação atualizada', variant: 'success' });
    } catch (err) {
      toast({ title: 'Erro ao atualizar', description: err?.message, variant: 'error' });
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Deletar esta anotação?')) return;
    try {
      await notesApi.deleteNote(id);
      setNotes(prev => prev.filter(n => n.id !== id));
      toast({ title: 'Anotação deletada', variant: 'info' });
    } catch (err) {
      toast({ title: 'Erro ao deletar', description: err?.message, variant: 'error' });
    }
  }

  const formatDate = (s) => new Date(s).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="animate-in max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-8 gap-4">
        <div>
          <Badge variant="accent" icon={NotebookPen} className="mb-3">Anotações</Badge>
          <h1 className="text-3xl font-display font-bold text-text-primary tracking-tight">Suas anotações</h1>
          <p className="text-text-muted mt-1">{notes.length} anotação{notes.length !== 1 ? 'ões' : ''} no total</p>
        </div>
        <Button icon={Plus} onClick={() => setShowForm(v => !v)}>Nova anotação</Button>
      </div>

      {/* Form nova anotação */}
      {showForm && (
        <Card className="p-5 mb-6">
          <form onSubmit={handleCreate} className="space-y-3">
            <input
              type="text"
              placeholder="Tema (opcional)"
              value={newTheme}
              onChange={e => setNewTheme(e.target.value)}
              className="w-full bg-surface-2 border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent"
            />
            <Textarea
              placeholder="Escreva sua anotação..."
              value={newContent}
              onChange={e => setNewContent(e.target.value)}
              rows={4}
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button type="submit" loading={saving} disabled={!newContent.trim()}>Salvar</Button>
            </div>
          </form>
        </Card>
      )}

      {/* Filtro por tema */}
      {themes.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setFilterTheme('')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              !filterTheme ? 'bg-accent-soft border-accent-border text-accent' : 'bg-surface-2 border-border text-text-muted hover:text-text-secondary'
            }`}
          >
            Todos
          </button>
          {themes.map(t => (
            <button
              key={t}
              onClick={() => setFilterTheme(filterTheme === t ? '' : t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                filterTheme === t ? 'bg-accent-soft border-accent-border text-accent' : 'bg-surface-2 border-border text-text-muted hover:text-text-secondary'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && notes.length === 0 && (
        <EmptyState
          icon={NotebookPen}
          title="Nenhuma anotação ainda"
          description="Crie anotações durante o quiz ou diretamente aqui."
          action={<Button icon={Plus} onClick={() => setShowForm(true)}>Criar primeira anotação</Button>}
        />
      )}

      {/* Lista agrupada */}
      <div className="space-y-6">
        {grouped.map(([theme, themeNotes]) => (
          <div key={theme}>
            <div className="flex items-center gap-2 mb-3">
              <Tag size={13} className="text-accent" />
              <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">{theme}</span>
              <span className="text-xs text-text-dim">({themeNotes.length})</span>
            </div>
            <div className="space-y-2">
              {themeNotes.map(note => (
                <Card key={note.id} className="p-4">
                  {editingId === note.id ? (
                    <div className="space-y-2">
                      <Textarea
                        value={editContent}
                        onChange={e => setEditContent(e.target.value)}
                        rows={4}
                        autoFocus
                      />
                      <div className="flex gap-2 justify-end">
                        <IconButton icon={X} label="Cancelar" variant="ghost" size="sm" onClick={() => setEditingId(null)} />
                        <IconButton icon={Check} label="Salvar" variant="accent" size="sm" onClick={() => saveEdit(note.id)} />
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3">
                      <p className="flex-1 text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">{note.content}</p>
                      <div className="flex gap-1 shrink-0">
                        <IconButton icon={Pencil} label="Editar" variant="ghost" size="sm" onClick={() => startEdit(note)} />
                        <IconButton icon={Trash2} label="Deletar" variant="ghost" size="sm" onClick={() => handleDelete(note.id)} />
                      </div>
                    </div>
                  )}
                  <p className="text-2xs text-text-dim mt-2">{formatDate(note.updatedAt || note.createdAt)}</p>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
