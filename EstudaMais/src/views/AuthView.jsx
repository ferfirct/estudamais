import { useState } from 'react';
import { GraduationCap, Mail, Lock, User, LogIn, UserPlus } from 'lucide-react';
import { login, register } from '../api/auth.js';
import { setToken } from '../api/client.js';

export default function AuthView({ onAuth }) {
  const [mode, setMode] = useState('login'); // login | register
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      let result;
      if (mode === 'register') {
        result = await register(name, email, password);
      } else {
        result = await login(email, password);
      }
      setToken(result.token);
      onAuth(result.user);
    } catch (err) {
      setError(err.message || 'Ocorreu um erro. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-svh flex items-center justify-center px-4">
      <div className="w-full max-w-md animate-in">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent via-accent-hover to-info flex items-center justify-center shadow-glow mb-4">
            <GraduationCap size={28} className="text-bg" strokeWidth={2.5} />
          </div>
          <h1 className="font-display font-extrabold text-3xl text-text-primary tracking-tight">
            Estuda<span className="text-accent">+</span>
          </h1>
          <p className="text-text-muted text-sm mt-1">Meça sua eficiência cognitiva</p>
        </div>

        {/* Card */}
        <div className="bg-surface border border-border rounded-3xl p-8 shadow-card">
          {/* Toggle */}
          <div className="flex gap-1 p-1 bg-surface-2 rounded-2xl mb-6">
            {[
              { key: 'login', label: 'Entrar', icon: LogIn },
              { key: 'register', label: 'Criar conta', icon: UserPlus },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => { setMode(key); setError(''); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  mode === key
                    ? 'bg-accent-soft text-accent border border-accent-border'
                    : 'text-text-muted hover:text-text-primary'
                }`}
              >
                <Icon size={14} />
                {label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">Nome</label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    minLength={2}
                    placeholder="Seu nome"
                    className="w-full bg-surface-2 border border-border rounded-xl pl-10 pr-4 py-3 text-text-primary placeholder-text-dim focus:outline-none focus:border-accent-border focus:bg-surface-3 transition-all"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="seu@email.com"
                  className="w-full bg-surface-2 border border-border rounded-xl pl-10 pr-4 py-3 text-text-primary placeholder-text-dim focus:outline-none focus:border-accent-border focus:bg-surface-3 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Senha</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full bg-surface-2 border border-border rounded-xl pl-10 pr-4 py-3 text-text-primary placeholder-text-dim focus:outline-none focus:border-accent-border focus:bg-surface-3 transition-all"
                />
              </div>
            </div>

            {error && (
              <div className="bg-danger-soft border border-danger/30 rounded-xl px-4 py-3 text-danger text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-accent hover:bg-accent-hover text-bg font-bold text-sm transition-all shadow-glow hover:shadow-glow-lg disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading
                ? 'Aguarde...'
                : mode === 'login'
                ? 'Entrar'
                : 'Criar conta'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
