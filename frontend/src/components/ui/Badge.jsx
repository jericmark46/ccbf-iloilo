import { cn } from '../../lib/utils';

const variants = {
  default: 'border-line bg-ink/[0.04] text-soft',
  accent: 'border-accent/25 bg-accent/10 text-accent',
  success: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300',
  warning: 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-300',
  danger: 'border-red-500/25 bg-red-500/10 text-red-600 dark:text-red-300',
  dark: 'border-white/15 bg-white/10 text-white/85',
};

export function Badge({ children, variant = 'default', className }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.67rem] font-semibold uppercase tracking-[0.12em]',
        variants[variant] || variants.default,
        className
      )}
    >
      {children}
    </span>
  );
}
