import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, CalendarDays, ChevronDown, MapPin } from 'lucide-react';
import { cn } from '../../lib/utils';
import { formatDate } from '../../lib/dates';
import { copyValue } from '../../lib/copy';

const fallbackLines = [
  { label: 'Evangelism', text: 'Showing the way' },
  { label: 'Discipleship', text: 'Teaching the truth' },
  { label: 'Mission', text: 'Living the life' },
];

const buttonStyles = {
  solid: 'btn-accent',
  outline: 'btn-white',
  ghost: 'border-0 bg-transparent px-2 text-white/80 hover:text-white',
};

export function Hero({ settings, nextActivity }) {
  const copy = (key) => copyValue(settings, key);
  const background = settings?.background || {};
  const lines = settings?.heroLines?.length ? settings.heroLines : fallbackLines;
  const buttons = settings?.heroButtons?.length
    ? settings.heroButtons
    : [
        { label: 'Join our church', href: '/pages/about', style: 'solid' },
        { label: 'Contact us', href: '/contact', style: 'outline' },
      ];
  const serviceTimes = (settings?.serviceTimes || []).slice(0, 3);
  const overlay = background.overlay ?? 52;
  const blur = background.blur ?? 0;
  const focal = background.focal || 'center';

  return (
    <section className="relative flex min-h-[100svh] items-center overflow-hidden bg-[#070b12] text-white">
      <div className="absolute inset-0">
        {background.type === 'video' && background.url ? (
          <video
            className="h-full w-full object-cover"
            style={{
              objectPosition: focal,
              filter: blur ? `blur(${blur}px)` : undefined,
              transform: blur ? 'scale(1.06)' : undefined,
            }}
            src={background.url}
            poster={background.poster || undefined}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
          />
        ) : (
          <img
            src={background.url || '/images/hero-mountains.png'}
            alt=""
            className="h-full w-full animate-kenburns object-cover"
            style={{
              objectPosition: focal,
              filter: blur ? `blur(${blur}px)` : undefined,
            }}
            fetchpriority="high"
          />
        )}
        <div
          className="absolute inset-0"
          style={{ backgroundColor: `rgba(5, 9, 17, ${Math.min(90, Math.max(0, overlay)) / 100})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#050912]/50 via-transparent to-[#050912]/35" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_10%,rgba(4,7,14,0.55)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-surface to-transparent" />
      </div>

      <div className="container-x relative z-10 pb-32 pt-40 sm:pt-44">
        <div className="mx-auto max-w-5xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="mb-8 flex justify-center"
          >
            <span className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/[0.06] px-4 py-1.5 text-[0.6rem] font-semibold uppercase tracking-[0.28em] text-white/75 backdrop-blur-md">
              <span className="h-1 w-1 rounded-full bg-[#e7c77e]" />
              {settings?.heroKicker || 'A Bible-believing fellowship · Iloilo City'}
            </span>
          </motion.div>

          <h1 className="hero-shadow space-y-5 font-display font-medium leading-[0.98] tracking-[-0.025em]">
            {lines.map((line, index) => (
              <motion.span
                key={`${line.label}-${index}`}
                initial={{ opacity: 0, y: 26 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.85, delay: 0.12 + index * 0.13, ease: [0.16, 1, 0.3, 1] }}
                className="block"
              >
                <span className="mb-1.5 block font-sans text-[0.6rem] font-semibold uppercase tracking-[0.42em] text-[#e7c77e] sm:mb-2 sm:text-[0.68rem]">
                  {line.label}
                </span>
                <span className="block text-[2.55rem] sm:text-[3.6rem] lg:text-[4.6rem] xl:text-[5rem]">
                  {line.text}
                </span>
              </motion.span>
            ))}
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.55, ease: [0.16, 1, 0.3, 1] }}
            className="mx-auto mt-8 max-w-xl text-pretty text-[0.98rem] leading-relaxed text-white/70 sm:text-lg"
          >
            {settings?.heroSubtitle || 'Come as you are. Leave changed by the Word of God.'}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.65, ease: [0.16, 1, 0.3, 1] }}
            className="mt-10 flex flex-wrap items-center justify-center gap-3"
          >
            {buttons.map((button) => {
              const external = /^https?:\/\//i.test(button.href || '');
              const className = cn('group btn btn-lg', buttonStyles[button.style] || 'btn-accent');
              return external ? (
                <a
                  key={button.label}
                  href={button.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  className={className}
                >
                  {button.label}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </a>
              ) : (
                <Link key={button.label} to={button.href || '/'} className={className}>
                  {button.label}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              );
            })}
          </motion.div>
        </div>
      </div>

      {serviceTimes.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.8 }}
          className="absolute bottom-10 right-6 z-10 hidden w-[19rem] rounded-3xl glass-dark p-5 text-white xl:block"
        >
          <div className="flex items-center justify-between">
            <p className="text-[0.6rem] font-semibold uppercase tracking-[0.24em] text-[#e7c77e]">
              {copy('hero_gather_label')}
            </p>
            <CalendarDays className="h-4 w-4 text-white/40" />
          </div>
          <ul className="mt-4 space-y-3">
            {serviceTimes.map((slot, index) => (
              <li key={`${slot.day}-${index}`} className="flex items-baseline justify-between gap-3 border-b border-white/10 pb-3 last:border-0 last:pb-0">
                <span className="text-[0.8rem] text-white/80">{slot.label}</span>
                <span className="text-right text-[0.7rem] leading-relaxed text-white/50">
                  {slot.day}
                  <br />
                  {slot.time}
                </span>
              </li>
            ))}
          </ul>
          <Link
            to="/contact"
            className="mt-4 inline-flex items-center gap-1.5 text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-[#e7c77e] transition hover:text-white"
          >
            {copy('hero_visit_label')} <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </motion.div>
      )}

      {nextActivity && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.9 }}
          className="absolute bottom-10 left-6 z-10 hidden w-64 rounded-3xl glass-dark p-5 text-white 2xl:block"
        >
          <p className="text-[0.6rem] font-semibold uppercase tracking-[0.24em] text-[#e7c77e]">
            {copy('hero_next_label')}
          </p>
          <p className="mt-3 font-display text-lg leading-snug">{nextActivity.title}</p>
          <p className="mt-2 flex items-center gap-2 text-[0.72rem] text-white/55">
            <MapPin className="h-3.5 w-3.5" /> {formatDate(nextActivity.startAt)}
          </p>
          <Link
            to="/activities"
            className="mt-3 inline-flex items-center gap-1.5 text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-[#e7c77e] transition hover:text-white"
          >
            {copy('hero_activities_label')} <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </motion.div>
      )}

      <a
        href="#welcome"
        className="absolute bottom-6 left-1/2 z-10 hidden -translate-x-1/2 flex-col items-center gap-2 text-white/40 transition hover:text-white/80 sm:flex"
        aria-label="Scroll to content"
      >
        <span className="text-[0.58rem] font-semibold uppercase tracking-[0.28em]">Scroll</span>
        <ChevronDown className="h-4 w-4 animate-bounce" />
      </a>
    </section>
  );
}
