import { cn } from '../../lib/utils';

const shortDay = (day) => {
  if (!day) return '';
  return new Date(`${day}T00:00:00`).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
};

/**
 * A plain bar chart of daily page views. It is built from divs rather than a
 * charting library so it stays sharp at every width and costs nothing to load.
 */
export function VisitsChart({ days = [], className }) {
  if (!days.length) {
    return (
      <div className={cn('grid h-32 place-items-center rounded-2xl border border-dashed border-line text-xs text-faint', className)}>
        No visits recorded yet.
      </div>
    );
  }

  const peak = Math.max(...days.map((day) => day.views), 0);
  const max = Math.max(peak, 1);
  const first = days[0];
  const last = days[days.length - 1];
  const middle = days[Math.floor(days.length / 2)];

  return (
    <div className={cn('w-full', className)}>
      <div className="relative">
        {/* Three quiet guides give the eye something to measure against. */}
        <div className="pointer-events-none absolute inset-x-0 top-0 flex h-32 flex-col justify-between">
          {[0, 1, 2].map((line) => (
            <span key={line} className="h-px w-full bg-line/60" />
          ))}
        </div>

        <div className="relative flex h-32 items-end gap-[3px]">
          {days.map((day) => {
            const isPeak = peak > 0 && day.views === peak;
            const height = day.views === 0 ? 2 : Math.max(6, Math.round((day.views / max) * 100));
            return (
              <div key={day.day} className="group relative flex h-full flex-1 items-end">
                <div
                  title={`${shortDay(day.day)} · ${day.views} ${day.views === 1 ? 'view' : 'views'}${
                    day.visitors ? ` · ${day.visitors} ${day.visitors === 1 ? 'visitor' : 'visitors'}` : ''
                  }`}
                  className={cn(
                    'w-full cursor-default rounded-t-[3px] transition-colors',
                    day.views === 0
                      ? 'bg-ink/[0.06]'
                      : isPeak
                        ? 'bg-accent'
                        : 'bg-accent/35 group-hover:bg-accent/70'
                  )}
                  style={{ height: `${height}%` }}
                />
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-2.5 flex items-center justify-between text-[0.6rem] uppercase tracking-[0.12em] text-faint">
        <span>{shortDay(first.day)}</span>
        {days.length > 2 && <span className="hidden sm:inline">{shortDay(middle.day)}</span>}
        <span>{shortDay(last.day)}</span>
      </div>
    </div>
  );
}
