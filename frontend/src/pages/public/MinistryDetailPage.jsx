import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, CalendarClock, UserRound, Users } from 'lucide-react';
import { api, getError } from '../../api/client';
import { useSite } from '../../context/SiteContext';
import { PageHero } from '../../components/public/PageHero';
import { RichContent } from '../../components/ui/Markdown';
import { InlineLoader } from '../../components/ui/Loaders';
import { EmptyState } from '../../components/ui/EmptyState';
import { copyValue } from '../../lib/copy';

export default function MinistryDetailPage() {
  const { slug } = useParams();
  const { ministries, settings } = useSite();
  const copy = (key) => copyValue(settings, key);
  const [ministry, setMinistry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    api
      .get(`/public/ministries/${slug}`)
      .then(({ data }) => active && setMinistry(data.ministry))
      .catch((err) => active && setError(getError(err)))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [slug]);

  if (loading) return <div className="pt-48"><InlineLoader label="Loading ministry…" /></div>;

  if (error || !ministry) {
    return (
      <div className="container-x py-44">
        <EmptyState
          icon={Users}
          title="Ministry not found"
          description={error || 'This ministry may have been moved or unpublished.'}
          action={
            <Link to="/ministries" className="btn btn-accent btn-sm">
              Back to ministries
            </Link>
          }
        />
      </div>
    );
  }

  const others = ministries.filter((item) => item.slug !== ministry.slug).slice(0, 5);

  return (
    <>
      <PageHero
        kicker={copy('ministry_detail_kicker')}
        title={ministry.name}
        subtitle={ministry.tagline}
        image={ministry.image || '/images/worship.png'}
      >
        <div className="flex flex-wrap gap-2">
          {ministry.leader && (
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-[0.7rem] text-white/80 backdrop-blur">
              <UserRound className="h-3.5 w-3.5" /> {ministry.leader}
            </span>
          )}
          {ministry.schedule && (
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-[0.7rem] text-white/80 backdrop-blur">
              <CalendarClock className="h-3.5 w-3.5" /> {ministry.schedule}
            </span>
          )}
        </div>
      </PageHero>

      <section className="py-16 sm:py-20">
        <div className="container-x grid gap-12 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="min-w-0">
            <Link
              to="/ministries"
              className="mb-6 inline-flex items-center gap-2 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-faint transition hover:text-accent"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> {copy('ministry_detail_back')}
            </Link>
            <RichContent>{ministry.description}</RichContent>

            <div className="mt-12 rounded-3xl border border-accent/20 bg-accent/[0.05] p-7">
              <p className="kicker">{copy('ministry_detail_cta_kicker')}</p>
              <h2 className="mt-3 font-display text-2xl font-semibold text-ink">
                {copy('ministry_detail_cta_title')}
              </h2>
              <p className="mt-2 max-w-lg text-sm leading-relaxed text-soft">
                {copy('ministry_detail_cta_text')}
              </p>
              <Link to="/contact" className="btn btn-accent btn-sm mt-5">
                {copy('ministry_detail_cta_button')}
              </Link>
            </div>
          </div>

          <aside className="space-y-5 lg:sticky lg:top-28 lg:self-start">
            <div className="rounded-3xl border border-line bg-elevated p-6">
              <p className="text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-accent">
                {copy('ministry_detail_details_label')}
              </p>
              <dl className="mt-4 space-y-3 text-sm">
                <div>
                  <dt className="text-[0.68rem] uppercase tracking-[0.14em] text-faint">Leader</dt>
                  <dd className="mt-0.5 text-ink">{ministry.leader || copy('ministry_detail_fallback_leader')}</dd>
                </div>
                <div>
                  <dt className="text-[0.68rem] uppercase tracking-[0.14em] text-faint">Meeting</dt>
                  <dd className="mt-0.5 text-ink">{ministry.schedule || copy('ministry_detail_fallback_schedule')}</dd>
                </div>
              </dl>
              <Link to="/contact" className="btn btn-accent btn-sm mt-5 w-full">
                {copy('ministry_detail_ask_button')}
              </Link>
            </div>

            <div className="rounded-3xl border border-line bg-elevated p-6">
              <p className="text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-faint">
                {copy('ministry_detail_more_label')}
              </p>
              <ul className="mt-3 divide-y divide-line/70">
                {others.map((item) => (
                  <li key={item.id}>
                    <Link
                      to={`/ministries/${item.slug}`}
                      className="group flex items-center justify-between gap-2 py-3 text-sm text-soft transition hover:text-accent"
                    >
                      {item.name}
                      <ArrowUpRight className="h-3.5 w-3.5 opacity-40 transition group-hover:opacity-100" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-3xl border border-accent/20 bg-accent/[0.06] p-6">
              <p className="font-display text-lg italic leading-relaxed text-ink">
                {settings?.verse?.text || '“Your word is a lamp to my feet and a light to my path.”'}
              </p>
              <p className="mt-3 text-[0.6rem] font-semibold uppercase tracking-[0.22em] text-accent">
                {settings?.verse?.reference || 'Psalm 119:105'}
              </p>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
