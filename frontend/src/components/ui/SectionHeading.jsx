import { cn } from '../../lib/utils';

export function SectionHeading({
  kicker,
  title,
  description,
  align = 'left',
  action,
  tone = 'default',
  className,
}) {
  const light = tone === 'light';
  return (
    <div
      className={cn(
        'flex flex-col gap-6 md:flex-row md:items-end md:justify-between',
        align === 'center' && 'md:flex-col md:items-center md:justify-center',
        className
      )}
    >
      <div className={cn('max-w-2xl', align === 'center' && 'text-center')}>
        {kicker && (
          <span
            className={cn(
              'kicker mb-4',
              light && 'text-[#e7c77e]',
              align === 'center' && 'justify-center'
            )}
          >
            {kicker}
          </span>
        )}
        <h2
          className={cn(
            'text-balance font-display text-3xl font-semibold leading-[1.08] tracking-[-0.01em] sm:text-4xl lg:text-[2.9rem]',
            light ? 'text-white' : 'text-ink'
          )}
        >
          {title}
        </h2>
        {description && (
          <p
            className={cn(
              'mt-4 max-w-xl text-pretty text-[0.98rem] leading-relaxed',
              align === 'center' && 'mx-auto',
              light ? 'text-white/70' : 'text-soft'
            )}
          >
            {description}
          </p>
        )}
      </div>
      {action && <div className={cn(align === 'center' && 'md:mt-2')}>{action}</div>}
    </div>
  );
}
