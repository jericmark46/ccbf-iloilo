import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';

export function PageHero({ title, subtitle, image, kicker, children, compact = false, className }) {
  return (
    <section
      className={cn(
        'relative flex items-end overflow-hidden bg-[#070b12] text-white',
        compact ? 'min-h-[340px] pt-32' : 'min-h-[440px] pt-36',
        className
      )}
    >
      <div className="absolute inset-0">
        {image ? (
          <img src={image} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full bg-[radial-gradient(ellipse_at_top_left,rgba(61,49,110,0.8),transparent_60%),radial-gradient(ellipse_at_bottom_right,rgba(201,162,83,0.35),transparent_55%)]" />
        )}
        <div className="absolute inset-0 bg-[#060a12]/65" />
        <div className="absolute inset-0 bg-gradient-to-t from-surface via-[#060a12]/20 to-[#060a12]/45" />
      </div>

      <div className="container-x relative z-10 pb-16 sm:pb-20">
        <nav className="mb-6 flex items-center gap-2 text-[0.68rem] uppercase tracking-[0.18em] text-white/45">
          <Link to="/" className="transition hover:text-white/80">
            Home
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-[#e7c77e]/90">{kicker || title}</span>
        </nav>
        {kicker && <span className="kicker mb-4 text-[#e7c77e]">{kicker}</span>}
        <h1 className="hero-shadow max-w-4xl text-balance font-display text-4xl font-semibold leading-[1.04] tracking-[-0.02em] sm:text-5xl lg:text-6xl">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-5 max-w-2xl text-pretty text-[0.98rem] leading-relaxed text-white/65 sm:text-lg">
            {subtitle}
          </p>
        )}
        {children && <div className="mt-8">{children}</div>}
      </div>
    </section>
  );
}
