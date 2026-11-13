import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils';

export function Logo({ className, markClassName, compact = false, to = '/', siteName = 'Calvary Chapel Iloilo' }) {
  const content = (
    <>
      <span
        className={cn(
          'relative grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[#3d316e] via-[#251c47] to-[#120d24] text-[#e3c178] shadow-[0_12px_28px_-14px_rgba(28,19,67,0.7)] ring-1 ring-white/10 transition-transform duration-500 group-hover:-rotate-3',
          markClassName
        )}
      >
        <img
          src="/images/cci-white.png"
          alt=""
          className="h-8 w-8 object-contain"
          draggable={false}
        />
        <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-accent ring-2 ring-[#171129]" />
      </span>
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className="text-[0.55rem] font-semibold uppercase tracking-[0.3em] opacity-55">
            Calvary Chapel
          </span>
          <span className="mt-1 font-display text-[1.3rem] font-semibold leading-none tracking-wide">
            Iloilo
          </span>
        </span>
      )}
      <span className="sr-only">{siteName}</span>
    </>
  );

  if (!to) return <div className={cn('flex items-center gap-3', className)}>{content}</div>;

  return (
    <Link to={to} className={cn('group flex items-center gap-3', className)} aria-label={`${siteName} — home`}>
      {content}
    </Link>
  );
}
