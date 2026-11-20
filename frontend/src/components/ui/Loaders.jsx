import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export function Spinner({ className }) {
  return <Loader2 className={cn('h-5 w-5 animate-spin text-accent', className)} aria-hidden />;
}

export function InlineLoader({ label = 'Loading…', className }) {
  return (
    <div className={cn('flex items-center justify-center gap-3 py-16 text-sm text-soft', className)}>
      <Spinner />
      <span>{label}</span>
    </div>
  );
}

export function FullPageLoader({ label = 'Preparing your visit…' }) {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-6 bg-surface px-6">
      <span className="relative h-28 w-28">
        <span className="logo-trace-mask absolute inset-0" aria-hidden="true">
          <span className="absolute -inset-1/2 animate-spin-reverse bg-[conic-gradient(from_0deg,transparent_0deg_272deg,#ffffff_283deg,#ffffff_289deg,rgba(255,255,255,0.85)_305deg,rgba(255,255,255,0.45)_325deg,rgba(255,255,255,0.12)_344deg,transparent_354deg_360deg)]" />
        </span>
      </span>
      <div className="text-center">
        <p className="font-display text-lg text-ink">Calvary Chapel Iloilo</p>
        <p className="mt-1 text-sm text-soft">{label}</p>
      </div>
    </div>
  );
}

export function Skeleton({ className }) {
  return (
    <div
      className={cn(
        'animate-shimmer rounded-2xl bg-[linear-gradient(90deg,rgb(var(--c-line)/0.4)_25%,rgb(var(--c-line)/0.75)_50%,rgb(var(--c-line)/0.4)_75%)] bg-[length:200%_100%]',
        className
      )}
    />
  );
}
