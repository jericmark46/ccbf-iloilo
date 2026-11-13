import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { cn } from '../../lib/utils';

export function PageHeader({ kicker, title, description, actions, className }) {
  return (
    <div
      className={cn(
        'flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between',
        className
      )}
    >
      <div className="min-w-0">
        {kicker && (
          <p className="text-[0.6rem] font-semibold uppercase tracking-[0.26em] text-accent">
            {kicker}
          </p>
        )}
        <h1 className="mt-2 font-display text-[1.85rem] font-semibold leading-tight tracking-tight text-ink sm:text-[2.25rem]">
          {title}
        </h1>
        {description && (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-soft">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2.5">{actions}</div>}
    </div>
  );
}

export function Panel({ children, className }) {
  return (
    <div className={cn('overflow-hidden rounded-3xl border border-line bg-elevated', className)}>
      {children}
    </div>
  );
}

export function PanelHeader({ title, description, actions, className }) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 border-b border-line/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6',
        className
      )}
    >
      <div>
        <h2 className="font-display text-base font-semibold text-ink">{title}</h2>
        {description && <p className="mt-0.5 text-xs leading-relaxed text-soft">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

const tones = {
  accent: 'bg-accent/10 text-accent',
  emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300',
  sky: 'bg-sky-500/10 text-sky-600 dark:text-sky-300',
  violet: 'bg-violet-500/10 text-violet-600 dark:text-violet-300',
  amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-300',
  rose: 'bg-rose-500/10 text-rose-600 dark:text-rose-300',
};

export function StatCard({ icon: Icon, label, value, hint, tone = 'accent', to }) {
  const content = (
    <>
      <span className={cn('grid h-11 w-11 shrink-0 place-items-center rounded-2xl', tones[tone])}>
        {Icon && <Icon className="h-5 w-5" />}
      </span>
      <span className="min-w-0">
        <span className="block text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-faint">
          {label}
        </span>
        <span className="mt-1 block font-display text-2xl font-semibold leading-none text-ink">
          {value ?? '—'}
        </span>
        {hint && <span className="mt-1.5 block truncate text-xs text-soft">{hint}</span>}
      </span>
    </>
  );
  const classes =
    'group flex items-start gap-4 rounded-3xl border border-line bg-elevated p-5 transition hover:border-accent/35';
  if (to) {
    return (
      <Link to={to} className={classes}>
        {content}
      </Link>
    );
  }
  return <div className={classes}>{content}</div>;
}

export function Toolbar({ children, className }) {
  return (
    <div className={cn('flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center', className)}>
      {children}
    </div>
  );
}

export function SearchInput({ value, onChange, placeholder = 'Search…', className }) {
  return (
    <div className={cn('relative min-w-[13rem] flex-1', className)}>
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="field py-2.5 pl-10"
      />
    </div>
  );
}

export function FilterChips({ options, value, onChange, className }) {
  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {options.map((option) => {
        const id = typeof option === 'string' ? option : option.id;
        const label = typeof option === 'string' ? option : option.label;
        const active = value === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={cn(
              'rounded-full border px-3.5 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.12em] transition',
              active
                ? 'border-accent/40 bg-accent/10 text-accent'
                : 'border-line bg-elevated text-soft hover:border-accent/30 hover:text-ink'
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

export function Switch({ checked, onChange, label, description, disabled = false, className }) {
  return (
    <label
      className={cn(
        'flex cursor-pointer items-start gap-3 rounded-2xl border border-line bg-surface/60 px-4 py-3 transition',
        disabled && 'cursor-not-allowed opacity-60',
        className
      )}
    >
      <span className="relative mt-0.5 inline-flex">
        <input
          type="checkbox"
          className="peer sr-only"
          checked={Boolean(checked)}
          onChange={(event) => onChange?.(event.target.checked)}
          disabled={disabled}
        />
        <span className="h-6 w-10 rounded-full bg-ink/15 transition peer-checked:bg-accent peer-focus-visible:ring-4 peer-focus-visible:ring-accent/20" />
        <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition peer-checked:translate-x-4" />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-medium text-ink">{label}</span>
        {description && <span className="mt-0.5 block text-xs leading-relaxed text-soft">{description}</span>}
      </span>
    </label>
  );
}

export function AdminNotice({ children, tone = 'accent', className }) {
  const map = {
    accent: 'border-accent/25 bg-accent/[0.06] text-soft',
    warning: 'border-amber-500/30 bg-amber-500/[0.08] text-soft',
    danger: 'border-red-500/25 bg-red-500/[0.06] text-soft',
  };
  return (
    <div className={cn('rounded-2xl border px-4 py-3 text-xs leading-relaxed', map[tone], className)}>
      {children}
    </div>
  );
}
