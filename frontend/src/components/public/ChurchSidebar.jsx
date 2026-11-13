import { Link } from 'react-router-dom';
import { ArrowRight, Clock, Heart, Quote, Sparkles } from 'lucide-react';
import { useSite } from '../../context/SiteContext';
import { Logo } from '../ui/Logo';
import { cn } from '../../lib/utils';
import { formatShortDate, formatTime } from '../../lib/dates';
import { copyValue } from '../../lib/copy';

export function ChurchSidebar({ className }) {
  const { settings, activities } = useSite();
  const copy = (key) => copyValue(settings, key);
  const times = settings?.serviceTimes || [];
  const verse = settings?.verse || {};
  const next = activities?.[0];

  return (
    <aside className={cn('space-y-5', className)}>
      <div className="rounded-3xl border border-line bg-elevated p-6">
        <Logo to={null} siteName={settings?.siteName} />
        <p className="mt-4 text-sm leading-relaxed text-soft">
          {settings?.tagline || 'A Bible-believing church in the heart of Iloilo'}
        </p>

        {times.length > 0 && (
          <ul className="mt-5 space-y-3 border-t border-line pt-5">
            {times.map((slot, index) => (
              <li key={`${slot.day}-${index}`} className="flex items-start gap-2.5">
                <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
                <span className="text-[0.8rem] leading-relaxed">
                  <span className="font-medium text-ink">{slot.label}</span>
                  <span className="block text-[0.72rem] text-faint">
                    {slot.day} · {slot.time}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}

        <Link to="/contact" className="btn btn-outline btn-sm mt-5 w-full">
          {copy('sidebar_visit_button')}
        </Link>
      </div>

      {next && (
        <Link
          to={`/activities#${next.slug}`}
          className="group block rounded-3xl border border-line bg-elevated p-6 transition hover:border-accent/30"
        >
          <p className="flex items-center gap-2 text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-accent">
            <Sparkles className="h-3.5 w-3.5" /> {copy('sidebar_next_label')}
          </p>
          <p className="mt-2.5 font-display text-lg font-semibold leading-snug text-ink transition group-hover:text-accent">
            {next.title}
          </p>
          <p className="mt-2 text-[0.75rem] text-soft">
            {formatShortDate(next.startAt)} · {formatTime(next.startAt)}
          </p>
          <span className="mt-3 inline-flex items-center gap-1 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-accent">
            {copy('sidebar_details')} <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
          </span>
        </Link>
      )}

      <div className="relative overflow-hidden rounded-3xl border border-accent/20 bg-accent/[0.06] p-6">
        <Quote className="h-6 w-6 text-accent/50" />
        <p className="mt-3 font-display text-[1.05rem] italic leading-relaxed text-ink">
          {verse.text || '“Your word is a lamp to my feet and a light to my path.”'}
        </p>
        <p className="mt-3 text-[0.6rem] font-semibold uppercase tracking-[0.22em] text-accent">
          {verse.reference || 'Psalm 119:105'}
        </p>
      </div>

      <div className="rounded-3xl border border-line bg-elevated p-6">
        <p className="text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-accent">{copy('sidebar_giving_kicker')}</p>
        <p className="mt-2 font-display text-lg font-semibold leading-snug text-ink">
          {copy('sidebar_giving_title')}
        </p>
        <p className="mt-2 text-[0.8rem] leading-relaxed text-soft">
          {copy('sidebar_giving_text')}
        </p>
        <Link to="/pages/donate" className="btn btn-accent btn-sm mt-4 w-full">
          <Heart className="h-3.5 w-3.5" /> {copy('sidebar_give_button')}
        </Link>
      </div>
    </aside>
  );
}
