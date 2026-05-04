import { useCallback, useEffect, useState } from 'react';
import { Moon, Sun, Monitor, Bell, BellOff, LogOut, Target } from 'lucide-react';
import { getSettings, updateSettings } from '../api/settings.js';
import { setToken } from '../api/client.js';

function debounce(fn, ms) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

export default function SettingsView({ user, onLogout, onThemeChange }) {
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getSettings()
      .then(setSettings)
      .catch(() => setError('Não foi possível carregar as configurações.'));
  }, []);

  const save = useCallback(
    debounce(async (patch) => {
      setSaving(true);
      try {
        const updated = await updateSettings(patch);
        setSettings(updated);
        if (patch.theme) onThemeChange?.(patch.theme);
      } catch {
        setError('Erro ao salvar. Tente novamente.');
      } finally {
        setSaving(false);
      }
    }, 600),
    []
  );

  function patch(field, value) {
    setSettings((prev) => ({ ...prev, [field]: value }));
    save({ [field]: value });
  }

  function handleLogout() {
    setToken(null);
    onLogout();
  }

  if (!settings) {
    return (
      <div className="flex items-center justify-center py-24 text-text-muted">
        {error || 'Carregando configurações…'}
      </div>
    );
  }

  const themeOptions = [
    { key: 'dark', label: 'Escuro', icon: Moon },
    { key: 'light', label: 'Claro', icon: Sun },
    { key: 'system', label: 'Sistema', icon: Monitor },
  ];

  return (
    <div className="max-w-xl mx-auto space-y-6 animate-in">
      <div>
        <h1 className="font-display font-bold text-2xl text-text-primary">Configurações</h1>
        <p className="text-text-muted text-sm mt-1">Personalize sua experiência no Estuda+</p>
      </div>

      {/* Perfil */}
      <section className="bg-surface border border-border rounded-3xl p-6 shadow-card">
        <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">Perfil</h2>
        <div className="space-y-3">
          <div className="flex justify-between items-center py-2">
            <span className="text-sm text-text-secondary">Nome</span>
            <span className="text-sm font-semibold text-text-primary">{user?.name}</span>
          </div>
          <div className="h-px bg-border" />
          <div className="flex justify-between items-center py-2">
            <span className="text-sm text-text-secondary">Email</span>
            <span className="text-sm font-mono text-text-muted">{user?.email}</span>
          </div>
        </div>
      </section>

      {/* Tema */}
      <section className="bg-surface border border-border rounded-3xl p-6 shadow-card">
        <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">Aparência</h2>
        <div className="flex gap-2">
          {themeOptions.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => patch('theme', key)}
              className={`flex-1 flex flex-col items-center gap-2 py-3 px-2 rounded-2xl border text-sm font-semibold transition-all ${
                settings.theme === key
                  ? 'bg-accent-soft border-accent-border text-accent'
                  : 'border-border text-text-muted hover:text-text-primary hover:bg-surface-2'
              }`}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </div>
      </section>

      {/* Meta diária */}
      <section className="bg-surface border border-border rounded-3xl p-6 shadow-card">
        <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">Metas</h2>
        <div className="flex items-center gap-4">
          <Target size={18} className="text-accent shrink-0" />
          <div className="flex-1">
            <div className="flex justify-between mb-2">
              <span className="text-sm text-text-secondary">Meta diária de estudo</span>
              <span className="text-sm font-bold text-accent font-mono">
                {settings.dailyGoal >= 60
                  ? `${Math.floor(settings.dailyGoal / 60)}h${settings.dailyGoal % 60 > 0 ? ` ${settings.dailyGoal % 60}min` : ''}`
                  : `${settings.dailyGoal}min`}
              </span>
            </div>
            <input
              type="range"
              min={15}
              max={240}
              step={15}
              value={settings.dailyGoal}
              onChange={(e) => patch('dailyGoal', Number(e.target.value))}
              className="w-full accent-accent"
            />
            <div className="flex justify-between text-2xs text-text-dim mt-1">
              <span>15min</span>
              <span>4h</span>
            </div>
          </div>
        </div>
      </section>

      {/* Notificações */}
      <section className="bg-surface border border-border rounded-3xl p-6 shadow-card">
        <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">Notificações</h2>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {settings.notifications
              ? <Bell size={18} className="text-accent" />
              : <BellOff size={18} className="text-text-muted" />}
            <div>
              <p className="text-sm font-medium text-text-primary">Lembretes de streak</p>
              <p className="text-2xs text-text-muted">Aviso quando seu streak está em risco</p>
            </div>
          </div>
          <button
            onClick={() => patch('notifications', !settings.notifications)}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              settings.notifications ? 'bg-accent' : 'bg-surface-3 border border-border'
            }`}
          >
            <span
              className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                settings.notifications ? 'translate-x-6' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>
      </section>

      {/* Conta */}
      <section className="bg-surface border border-border rounded-3xl p-6 shadow-card">
        <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">Conta</h2>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-danger/30 bg-danger-soft text-danger font-semibold text-sm hover:bg-danger/20 transition-all"
        >
          <LogOut size={16} />
          Sair da conta
        </button>
      </section>

      {saving && (
        <p className="text-center text-2xs text-text-dim">Salvando…</p>
      )}
      {error && (
        <p className="text-center text-2xs text-danger">{error}</p>
      )}
    </div>
  );
}
