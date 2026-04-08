// Estuda+ — Design system primitives.
// Componentes base reutilizáveis com aparência consistente.
import { useToasts, dismissToast } from './lib.js';
import { CheckCircle2, AlertTriangle, Info, X, Loader2 } from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════
   BUTTON
   ═══════════════════════════════════════════════════════════════ */

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconRight: IconRight,
  loading = false,
  disabled = false,
  className = '',
  ...props
}) {
  const base =
    'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]';

  const variants = {
    primary:
      'bg-accent text-bg hover:bg-accent-hover shadow-glow hover:shadow-glow-lg',
    secondary:
      'bg-surface-2 text-text-primary hover:bg-surface-3 border border-border hover:border-border-strong',
    ghost:
      'bg-transparent text-text-secondary hover:bg-surface-2 hover:text-text-primary',
    danger:
      'bg-danger-soft text-danger border border-danger/30 hover:bg-danger/20',
    outline:
      'bg-transparent text-accent border border-accent-border hover:bg-accent-soft',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3.5 text-base',
    xl: 'px-8 py-4 text-lg',
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Loader2 size={16} className="animate-spin" />
      ) : Icon ? (
        <Icon size={size === 'lg' || size === 'xl' ? 20 : 16} />
      ) : null}
      {children}
      {IconRight && !loading && (
        <IconRight size={size === 'lg' || size === 'xl' ? 20 : 16} />
      )}
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ICON BUTTON
   ═══════════════════════════════════════════════════════════════ */

export function IconButton({ icon: Icon, label, variant = 'ghost', size = 'md', ...props }) {
  const sizes = { sm: 'w-8 h-8', md: 'w-10 h-10', lg: 'w-12 h-12' };
  const iconSizes = { sm: 14, md: 18, lg: 22 };
  const variants = {
    ghost: 'bg-transparent text-text-muted hover:bg-surface-2 hover:text-text-primary',
    solid: 'bg-surface-2 text-text-primary hover:bg-surface-3 border border-border',
    accent: 'bg-accent-soft text-accent hover:bg-accent/20 border border-accent-border',
  };
  return (
    <button
      aria-label={label}
      title={label}
      className={`${sizes[size]} ${variants[variant]} inline-flex items-center justify-center rounded-xl transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-accent`}
      {...props}
    >
      <Icon size={iconSizes[size]} />
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CARD
   ═══════════════════════════════════════════════════════════════ */

export function Card({ children, className = '', interactive = false, ...props }) {
  return (
    <div
      className={`bg-surface border border-border rounded-2xl shadow-card ${
        interactive
          ? 'transition-all hover:border-border-strong hover:-translate-y-0.5 cursor-pointer'
          : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   INPUT
   ═══════════════════════════════════════════════════════════════ */

export function Input({ icon: Icon, className = '', ...props }) {
  return (
    <div className="relative group">
      {Icon && (
        <Icon
          size={18}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-accent transition-colors"
        />
      )}
      <input
        className={`w-full ${
          Icon ? 'pl-11' : 'pl-4'
        } pr-4 py-3.5 bg-surface-2 border border-border rounded-xl text-text-primary placeholder:text-text-dim focus:outline-none focus:border-accent focus:ring-4 focus:ring-accent/10 transition-all ${className}`}
        {...props}
      />
    </div>
  );
}

export function Textarea({ className = '', ...props }) {
  return (
    <textarea
      className={`w-full px-4 py-3 bg-surface-2 border border-border rounded-xl text-text-primary placeholder:text-text-dim focus:outline-none focus:border-accent focus:ring-4 focus:ring-accent/10 transition-all resize-none ${className}`}
      {...props}
    />
  );
}

/* ═══════════════════════════════════════════════════════════════
   BADGE
   ═══════════════════════════════════════════════════════════════ */

export function Badge({ children, variant = 'default', icon: Icon, className = '' }) {
  const variants = {
    default: 'bg-surface-3 text-text-secondary border-border',
    accent: 'bg-accent-soft text-accent border-accent-border',
    success: 'bg-success-soft text-success border-success/30',
    warning: 'bg-warning-soft text-warning border-warning/30',
    danger: 'bg-danger-soft text-danger border-danger/30',
    info: 'bg-info-soft text-info border-info/30',
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${variants[variant]} ${className}`}
    >
      {Icon && <Icon size={12} />}
      {children}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SKELETON
   ═══════════════════════════════════════════════════════════════ */

export function Skeleton({ className = '' }) {
  return (
    <div
      className={`rounded-lg ${className}`}
      style={{
        background:
          'linear-gradient(90deg, #151826 0%, #1c2030 50%, #151826 100%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.6s linear infinite',
      }}
    />
  );
}

/* ═══════════════════════════════════════════════════════════════
   EMPTY STATE
   ═══════════════════════════════════════════════════════════════ */

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6 animate-in">
      {Icon && (
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-accent/10 blur-3xl rounded-full" />
          <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-br from-surface-2 to-surface-3 border border-border flex items-center justify-center shadow-card">
            <Icon size={36} className="text-accent" />
          </div>
        </div>
      )}
      <h3 className="text-xl font-display font-bold text-text-primary mb-2">{title}</h3>
      {description && (
        <p className="text-text-muted max-w-md mb-6">{description}</p>
      )}
      {action}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PROGRESS BAR
   ═══════════════════════════════════════════════════════════════ */

export function ProgressBar({ value, max = 100, variant = 'accent', className = '' }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const colors = {
    accent: 'from-accent to-accent-hover',
    warning: 'from-warning to-amber-500',
    danger: 'from-danger to-red-600',
  };
  return (
    <div className={`w-full h-2 bg-surface-3 rounded-full overflow-hidden ${className}`}>
      <div
        className={`h-full bg-gradient-to-r ${colors[variant]} transition-all duration-700 ease-out rounded-full`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   STAT CARD
   ═══════════════════════════════════════════════════════════════ */

export function StatCard({ label, value, unit, icon: Icon, trend, variant = 'default', className = '' }) {
  const variants = {
    default: 'from-surface-2 to-surface',
    accent: 'from-accent-soft to-surface',
    warning: 'from-warning-soft to-surface',
    danger: 'from-danger-soft to-surface',
  };
  return (
    <div
      className={`relative overflow-hidden bg-gradient-to-br ${variants[variant]} border border-border rounded-2xl p-5 shadow-card ${className}`}
    >
      <div className="flex items-start justify-between mb-4">
        <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
          {label}
        </span>
        {Icon && (
          <div className="w-9 h-9 rounded-xl bg-surface-3 border border-border flex items-center justify-center">
            <Icon size={16} className="text-accent" />
          </div>
        )}
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-3xl font-display font-bold text-text-primary tabular">
          {value}
        </span>
        {unit && <span className="text-sm text-text-muted font-medium">{unit}</span>}
      </div>
      {trend && <p className="text-xs text-text-muted mt-2">{trend}</p>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TOASTER
   ═══════════════════════════════════════════════════════════════ */

const toastVariants = {
  default: { icon: Info, cls: 'bg-surface-2 border-border text-text-primary' },
  success: { icon: CheckCircle2, cls: 'bg-success-soft border-success/40 text-success' },
  error: { icon: AlertTriangle, cls: 'bg-danger-soft border-danger/40 text-danger' },
  warning: { icon: AlertTriangle, cls: 'bg-warning-soft border-warning/40 text-warning' },
  info: { icon: Info, cls: 'bg-info-soft border-info/40 text-info' },
};

export function Toaster() {
  const toasts = useToasts();
  return (
    <div
      className="fixed bottom-6 right-6 z-[200] flex flex-col gap-3 w-[340px] max-w-[calc(100vw-3rem)]"
      role="region"
      aria-label="Notificações"
    >
      {toasts.map((t) => {
        const v = toastVariants[t.variant] || toastVariants.default;
        const Icon = v.icon;
        return (
          <div
            key={t.id}
            className={`toast-enter glass border ${v.cls} rounded-2xl p-4 shadow-elevated flex items-start gap-3`}
            role="status"
          >
            <Icon size={18} className="shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              {t.title && (
                <p className="font-semibold text-sm text-text-primary">{t.title}</p>
              )}
              {t.description && (
                <p className="text-xs text-text-secondary mt-0.5">{t.description}</p>
              )}
            </div>
            <button
              onClick={() => dismissToast(t.id)}
              className="shrink-0 text-text-muted hover:text-text-primary transition-colors"
              aria-label="Fechar notificação"
            >
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   KBD — keyboard shortcut visual
   ═══════════════════════════════════════════════════════════════ */

export function Kbd({ children }) {
  return (
    <kbd className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-md bg-surface-3 border border-border text-2xs font-mono font-semibold text-text-secondary">
      {children}
    </kbd>
  );
}
