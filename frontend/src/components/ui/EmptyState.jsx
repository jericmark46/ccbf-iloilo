import { cn } from '../../lib/utils';

export function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-3xl border border-dashed border-line bg-elevated/50 px-6 py-16 text-center',
        className
      )}
    >
      {Icon && (
        <span className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-accent/10 text-accent">
          <Icon className="h-6 w-6" />
        </span>
      )}
      <h3 className="font-display text-lg font-semibold text-ink">{title}</h3>
      {description && <p className="mt-2 max-w-sm text-sm leading-relaxed text-soft">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
