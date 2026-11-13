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
      <div className="relative grid h-16 w-16 place-items-center rounded-3xl bg-gradient-to-br from-[#3d316e] via-[#251c47] to-[#120d24] text-[#e3c178] shadow-lift">
        <img src="/images/cci-white.png" alt="" className="h-10 w-10 object-contain" draggable={false} />
      </div>
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
