import { Link } from 'react-router-dom';
import { ArrowUpRight, CalendarClock } from 'lucide-react';
import { ImageWithFallback } from '../ui/ImageWithFallback';
import { stripRich } from '../../lib/richText';
import { cn } from '../../lib/utils';

export function MinistryCard({ ministry, className, imageClassName }) {
  return (
    <Link
      to={`/ministries/${ministry.slug}`}
      className={cn(
        'group flex flex-col overflow-hidden rounded-3xl border border-line bg-elevated transition-all duration-500 hover:-translate-y-1.5 hover:border-accent/30 hover:shadow-lift',
        className
      )}
    >
      <div className="relative overflow-hidden">
        <ImageWithFallback
          src={ministry.image}
          alt={ministry.name}
          className={cn('aspect-[4/3] w-full object-cover transition-transform duration-[900ms] group-hover:scale-[1.06]', imageClassName)}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#060a12]/55 via-transparent to-transparent opacity-70" />
        {ministry.schedule && (
          <span className="absolute bottom-4 left-4 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/35 px-3 py-1.5 text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-white/85 backdrop-blur-md">
            <CalendarClock className="h-3 w-3" />
            {ministry.schedule}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-6">
        <h3 className="font-display text-[1.35rem] font-semibold leading-tight text-ink transition-colors group-hover:text-accent">
          {ministry.name}
        </h3>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-soft line-clamp-2">
          {ministry.tagline || stripRich(ministry.description || '')}
        </p>
        <span className="mt-5 inline-flex items-center gap-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-accent">
          Discover
          <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}
