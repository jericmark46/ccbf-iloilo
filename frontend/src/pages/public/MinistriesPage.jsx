import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useSite } from '../../context/SiteContext';
import { PageHero } from '../../components/public/PageHero';
import { MinistryCard } from '../../components/public/MinistryCard';
import { Reveal } from '../../components/ui/Reveal';
import { EmptyState } from '../../components/ui/EmptyState';
import { copyValue } from '../../lib/copy';
import { Users } from 'lucide-react';

export default function MinistriesPage() {
  const { ministries, settings } = useSite();
  const copy = (key) => copyValue(settings, key);

  return (
    <>
      <PageHero
        kicker={copy('ministries_hero_kicker')}
        title={copy('ministries_hero_title')}
        subtitle={copy('ministries_hero_subtitle')}
        image={copy('ministries_hero_image')}
      />

      <section className="py-16 sm:py-20">
        <div className="container-x">
          {ministries.length === 0 ? (
            <EmptyState
              icon={Users}
              title={copy('ministries_empty_title')}
              description={copy('ministries_empty_text')}
              action={
                <Link to="/contact" className="btn btn-accent btn-sm">
                  Contact us
                </Link>
              }
            />
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {ministries.map((ministry, index) => (
                <Reveal key={ministry.id} delay={(index % 3) * 0.06}>
                  <MinistryCard ministry={ministry} />
                </Reveal>
              ))}
            </div>
          )}

          <div className="mt-16 flex flex-col items-center gap-5 rounded-[2rem] border border-line bg-elevated px-6 py-12 text-center">
            <span className="kicker justify-center">{copy('ministries_cta_kicker')}</span>
            <h2 className="max-w-xl text-balance font-display text-3xl font-semibold leading-tight text-ink">
              {copy('ministries_cta_title')}
            </h2>
            <p className="max-w-lg text-sm leading-relaxed text-soft">
              {copy('ministries_cta_text')}
            </p>
            <Link to="/contact" className="btn btn-accent mt-2 group">
              {copy('ministries_cta_button')}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
