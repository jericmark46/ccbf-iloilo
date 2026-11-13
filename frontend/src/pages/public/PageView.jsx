import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowRight, FileQuestion, Heart } from 'lucide-react';
import { api, getError } from '../../api/client';
import { useSite } from '../../context/SiteContext';
import { PageHero } from '../../components/public/PageHero';
import { ChurchSidebar } from '../../components/public/ChurchSidebar';
import { GivingOptions } from '../../components/public/GivingOptions';
import { RichContent } from '../../components/ui/Markdown';
import { SectionHeading } from '../../components/ui/SectionHeading';
import { InlineLoader } from '../../components/ui/Loaders';
import { EmptyState } from '../../components/ui/EmptyState';
import { formatDate } from '../../lib/dates';
import { copyValue } from '../../lib/copy';

const fallbackImages = {
  about: '/images/worship.png',
  donate: '/images/outreach.png',
};

export default function PageView() {
  const { slug } = useParams();
  const { giving, settings } = useSite();
  const copy = (key) => copyValue(settings, key);
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    api
      .get(`/public/pages/${slug}`)
      .then(({ data }) => active && setPage(data.page))
      .catch((err) => active && setError(getError(err)))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="pt-48">
        <InlineLoader label="Opening the page…" />
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="container-x py-44">
        <EmptyState
          icon={FileQuestion}
          title="This page is not available"
          description={error || 'The page may have been moved or unpublished.'}
          action={
            <Link to="/" className="btn btn-accent btn-sm">
              Return home
            </Link>
          }
        />
      </div>
    );
  }

  const isDonate = page.slug === 'donate';

  return (
    <>
      <PageHero
        kicker={settings?.siteName || 'Calvary Chapel Iloilo'}
        title={page.title}
        subtitle={page.subtitle}
        image={page.heroImage || fallbackImages[page.slug] || '/images/hero-mountains.png'}
      >
        {page.updatedAt && (
          <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[0.65rem] uppercase tracking-[0.16em] text-white/70 backdrop-blur">
            {copy('page_updated_label')} {formatDate(page.updatedAt)}
          </span>
        )}
      </PageHero>

      <section className="py-16 sm:py-20">
        <div className="container-x grid gap-12 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="min-w-0">
            <RichContent>{page.content}</RichContent>

            {isDonate && (
              <div className="mt-16 border-t border-line pt-14">
                <SectionHeading
                  kicker={copy('donate_ways_kicker')}
                  title={copy('donate_ways_title')}
                  description={copy('donate_ways_text')}
                />
                <div className="mt-9">
                  <GivingOptions options={giving} />
                </div>
                <div className="mt-8 flex flex-col gap-4 rounded-3xl border border-accent/20 bg-accent/[0.05] p-6 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm leading-relaxed text-soft">
                    {copy('donate_contact_note')}
                  </p>
                  <Link to="/contact" className="btn btn-outline btn-sm shrink-0">
                    {copy('donate_contact_button')}
                  </Link>
                </div>
              </div>
            )}

            <div className="mt-14 flex flex-col gap-5 rounded-3xl border border-line bg-elevated p-7 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="kicker">{copy('donate_questions_kicker')}</p>
                <h3 className="mt-3 font-display text-2xl font-semibold text-ink">
                  {copy('donate_questions_title')}
                </h3>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link to="/contact" className="btn btn-accent group">
                  {copy('donate_questions_button')}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
                {!isDonate && (
                  <Link to="/pages/donate" className="btn btn-outline">
                    <Heart className="h-4 w-4" /> {copy('nav_give_label')}
                  </Link>
                )}
              </div>
            </div>
          </div>

          <ChurchSidebar className="lg:sticky lg:top-28 lg:self-start" />
        </div>
      </section>
    </>
  );
}
