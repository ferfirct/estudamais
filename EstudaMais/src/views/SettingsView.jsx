import { useCallback, useEffect, useState } from 'react';
import { Moon, Sun, Monitor, Bell, BellOff, LogOut, Target, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { getSettings, updateSettings } from '../api/settings.js';
import { updateProfile, changePassword } from '../api/auth.js';
import { setToken } from '../api/client.js';
import { toast } from '../lib.js';

function debounce(fn, ms) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

export default function SettingsView({ user, onLogout, onThemeChange, onUserUpdate }) {
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [nameInput, setNameInput] = useState(user?.name ?? '');
  const [emailInput, setEmailInput] = useState(user?.email ?? '');
  const [nameSaving, setNameSaving] = useState(false);
  const [emailSaving, setEmailSaving] = useState(false);
  const [nameSuccess, setNameSuccess] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState(false);

  const [pwOpen, setPwOpen] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState('');

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

  async function handleSaveName() {
    if (nameInput.trim() === user?.name || !nameInput.trim()) return;
    setNameSaving(true);
    try {
      const updated = await updateProfile({ name: nameInput.trim() });
      onUserUpdate?.(prev => ({ ...prev, ...updated }));
      setNameSuccess(true);
      setTimeout(() => setNameSuccess(false), 2000);
    } catch (e) {
      toast({ title: e.message || 'Erro ao salvar nome', variant: 'error' });
    } finally {
      setNameSaving(false);
    }
  }

  async function handleSaveEmail() {
    if (emailInput.trim() === user?.email || !emailInput.trim()) return;
    setEmailSaving(true);
    try {
      const updated = await updateProfile({ email: emailInput.trim() });
      onUserUpdate?.(prev => ({ ...prev, ...updated }));
      setEmailSuccess(true);
      setTimeout(() => setEmailSuccess(false), 2000);
    } catch (e) {
      toast({ title: e.message || 'Erro ao salvar email', variant: 'error' });
    } finally {
      setEmailSaving(false);
    }
  }

  async function handleChangePassword() {
    if (!currentPw || !newPw || newPw !== confirmPw) {
      setPwError(newPw !== confirmPw ? 'As senhas não coincidem.' : 'Preencha todos os campos.');
      return;
    }
    setPwError('');
    setPwSaving(true);
    try {
      await changePassword({ currentPassword: currentPw, newPassword: newPw });
      toast({ title: 'Senha alterada com sucesso', variant: 'success' });
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
      setPwOpen(false);
    } catch (e) {
      setPwError(e.message || 'Erro ao alterar senha.');
    } finally {
      setPwSaving(false);
    }
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

      {/* Minha conta */}
      <section className="bg-surface border border-border rounded-3xl p-6 shadow-card">
        <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">Minha conta</h2>
        <div className="space-y-4">
          {/* Nome */}
          <div>
            <label className="text-xs font-semibold text-text-muted block mb-1.5">Nome</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                className="flex-1 bg-surface-2 border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent transition-colors"
              />
              {nameInput.trim() !== user?.name && nameInput.trim() && (
                <button
                  onClick={handleSaveName}
                  disabled={nameSaving}
                  className="px-3 py-2 rounded-xl bg-accent text-bg text-xs font-semibold hover:bg-accent-hover transition-colors disabled:opacity-60"
                >
                  {nameSuccess ? <Check size={14} /> : nameSaving ? '…' : 'Salvar'}
                </button>
              )}
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="text-xs font-semibold text-text-muted block mb-1.5">Email</label>
            <div className="flex gap-2">
              <input
                type="email"
                value={emailInput}
                onChange={e => setEmailInput(e.target.value)}
                className="flex-1 bg-surface-2 border border-border rounded-xl px-3 py-2 text-sm text-text-primary font-mono focus:outline-none focus:border-accent transition-colors"
              />
              {emailInput.trim() !== user?.email && emailInput.trim() && (
                <button
                  onClick={handleSaveEmail}
                  disabled={emailSaving}
                  className="px-3 py-2 rounded-xl bg-accent text-bg text-xs font-semibold hover:bg-accent-hover transition-colors disabled:opacity-60"
                >
                  {emailSuccess ? <Check size={14} /> : emailSaving ? '…' : 'Salvar'}
                </button>
              )}
            </div>
          </div>

          {/* Alterar senha */}
          <div>
            <button
              onClick={() => setPwOpen(!pwOpen)}
              className="flex items-center gap-2 text-xs font-semibold text-text-muted hover:text-text-secondary transition-colors"
            >
              {pwOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              Alterar senha
            </button>
            {pwOpen && (
              <div className="mt-3 space-y-2">
                <input
                  type="password"
                  value={currentPw}
                  onChange={e => setCurrentPw(e.target.value)}
                  placeholder="Senha atual"
                  className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent transition-colors"
                />
                <input
                  type="password"
                  value={newPw}
                  onChange={e => setNewPw(e.target.value)}
                  placeholder="Nova senha"
                  className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent transition-colors"
                />
                <input
                  type="password"
                  value={confirmPw}
                  onChange={e => setConfirmPw(e.target.value)}
                  placeholder="Confirmar nova senha"
                  className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent transition-colors"
                />
                {pwError && <p className="text-xs text-danger">{pwError}</p>}
                <button
                  onClick={handleChangePassword}
                  disabled={pwSaving || !currentPw || !newPw || !confirmPw}
                  className="w-full py-2 rounded-xl bg-accent text-bg text-sm font-semibold hover:bg-accent-hover transition-colors disabled:opacity-60"
                >
                  {pwSaving ? 'Salvando…' : 'Confirmar'}
                </button>
              </div>
            )}
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
