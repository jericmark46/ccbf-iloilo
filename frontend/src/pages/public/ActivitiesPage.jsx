import { useEffect, useState } from 'react';
import { CalendarDays, CalendarX2 } from 'lucide-react';
import { api, getError } from '../../api/client';
import { PageHero } from '../../components/public/PageHero';
import { ActivityCard } from '../../components/public/ActivityCard';
import { EmptyState } from '../../components/ui/EmptyState';
import { InlineLoader } from '../../components/ui/Loaders';
import { Reveal } from '../../components/ui/Reveal';
import { SectionHeading } from '../../components/ui/SectionHeading';
import { isUpcoming } from '../../lib/dates';
import { copyValue } from '../../lib/copy';
import { useSite } from '../../context/SiteContext';

export default function ActivitiesPage() {
  const { settings } = useSite();
  const copy = (key) => copyValue(settings, key);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    api
      .get('/public/activities')
      .then(({ data }) => active && setActivities(data.activities || []))
      .catch((err) => active && setError(getError(err)))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const upcoming = activities.filter((item) => isUpcoming(item.startAt));
  const past = activities.filter((item) => !isUpcoming(item.startAt)).sort((a, b) => new Date(b.startAt) - new Date(a.startAt));

  return (
    <>
      <PageHero
        kicker={copy('activities_hero_kicker')}
        title={copy('activities_hero_title')}
        subtitle={copy('activities_hero_subtitle')}
        image={copy('activities_hero_image')}
      />

      <section className="py-16 sm:py-20">
        <div className="container-x">
          {loading ? (
            <InlineLoader label="Loading activities…" />
          ) : error ? (
            <EmptyState icon={CalendarX2} title="Could not load activities" description={error} />
          ) : (
            <>
              <Reveal>
                <SectionHeading
                  kicker={copy('activities_upcoming_kicker')}
                  title={copy('activities_upcoming_title')}
                  description={copy('activities_upcoming_text')}
                />
              </Reveal>

              {upcoming.length === 0 ? (
                <div className="mt-10">
                  <EmptyState
                    icon={CalendarDays}
                    title={copy('activities_empty_title')}
                    description={copy('activities_empty_text')}
                  />
                </div>
              ) : (
                <div className="mt-10 space-y-5">
                  {upcoming.map((activity, index) => (
                    <Reveal key={activity.id} delay={index * 0.05}>
                      <ActivityCard activity={activity} />
                    </Reveal>
                  ))}
                </div>
              )}

              {past.length > 0 && (
                <div className="mt-20">
                  <Reveal>
                    <SectionHeading
                      kicker={copy('activities_past_kicker')}
                      title={copy('activities_past_title')}
                      description={copy('activities_past_text')}
                    />
                  </Reveal>
                  <div className="mt-10 space-y-5">
                    {past.map((activity, index) => (
                      <Reveal key={activity.id} delay={index * 0.04}>
                        <ActivityCard activity={activity} />
                      </Reveal>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </>
  );
}
