import { Link } from 'react-router-dom';
import { ArrowUpRight, Clock, MapPin } from 'lucide-react';
import { ImageWithFallback } from '../ui/ImageWithFallback';
import { dateParts, formatTime, isUpcoming } from '../../lib/dates';
import { stripRich } from '../../lib/richText';
import { cn } from '../../lib/utils';

export function ActivityCard({ activity, className }) {
  const parts = dateParts(activity.startAt);
  const upcoming = isUpcoming(activity.startAt);

  return (
    <article
      id={activity.slug}
      className={cn(
        'group grid overflow-hidden rounded-3xl border border-line bg-elevated transition-all duration-500 hover:border-accent/30 hover:shadow-lift sm:grid-cols-[minmax(0,1fr)_15rem]',
        !upcoming && 'opacity-75',
        className
      )}
    >
      <div className="flex flex-col p-6 sm:p-7">
        <div className="flex flex-wrap items-center gap-2">
          <span className="chip chip-accent">{activity.category}</span>
          {upcoming ? (
            <span className="chip border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300">
              Upcoming
            </span>
          ) : (
            <span className="chip">Past</span>
          )}
        </div>
        <h3 className="mt-4 font-display text-2xl font-semibold leading-tight text-ink transition-colors group-hover:text-accent">
          {activity.title}
        </h3>
        {activity.description && (
          <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-soft">
            {stripRich(activity.description).slice(0, 220)}
          </p>
        )}
        <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-[0.78rem] text-faint">
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-accent/80" />
            {formatTime(activity.startAt)}
            {activity.endAt ? ` – ${formatTime(activity.endAt)}` : ''}
          </span>
          {activity.location && (
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-accent/80" />
              {activity.location}
            </span>
          )}
        </div>
        <Link
          to="/contact"
          className="mt-6 inline-flex w-fit items-center gap-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-accent transition hover:gap-2.5"
        >
          Ask about this <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="order-first flex items-stretch gap-4 border-b border-line p-4 sm:order-last sm:flex-col sm:border-b-0 sm:border-l">
        <div className="flex w-20 shrink-0 flex-col items-center justify-center rounded-2xl bg-accent/10 py-3 text-accent sm:w-auto">
          <span className="text-[0.6rem] font-bold uppercase tracking-[0.18em]">{parts.month}</span>
          <span className="font-display text-3xl font-semibold leading-none">{parts.day}</span>
          <span className="mt-1 text-[0.55rem] uppercase tracking-[0.14em] text-soft">{parts.weekday.slice(0, 3)}</span>
        </div>
        <div className="relative hidden flex-1 overflow-hidden rounded-2xl sm:block">
          <ImageWithFallback
            src={activity.image}
            alt={activity.title}
            className="h-full min-h-[9rem] w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        </div>
      </div>
    </article>
  );
}
