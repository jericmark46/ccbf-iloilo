import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  Clock,
  Heart,
  HeartHandshake,
  MapPin,
  Quote,
  Users,
} from 'lucide-react';
import { useSite } from '../../context/SiteContext';
import { Hero } from '../../components/public/Hero';
import { PostPreviewCard } from '../../components/public/PostPreviewCard';
import { MinistryCard } from '../../components/public/MinistryCard';
import { SectionHeading } from '../../components/ui/SectionHeading';
import { Reveal } from '../../components/ui/Reveal';
import { dateParts, formatTime, isUpcoming } from '../../lib/dates';
import { copyValue } from '../../lib/copy';

function AccentedWord({ text }) {
  return String(text)
    .split(/(\bWord\b)/i)
    .map((part, index) =>
      /^Word$/i.test(part) ? (
        <em key={`${part}-${index}`} className="text-accent">
          {part}
        </em>
      ) : (
        part
      )
    );
}

function ActivityRow({ activity }) {
  const parts = dateParts(activity.startAt);
  return (
    <Link
      to={`/activities#${activity.slug}`}
      className="group flex items-center gap-5 rounded-3xl border border-line bg-elevated p-5 transition-all duration-500 hover:-translate-y-0.5 hover:border-accent/30 hover:shadow-soft"
    >
      <span className="flex h-[4.2rem] w-[4.2rem] shrink-0 flex-col items-center justify-center rounded-2xl bg-accent/10 text-accent">
        <span className="text-[0.58rem] font-bold uppercase tracking-[0.18em]">{parts.month}</span>
        <span className="font-display text-2xl font-semibold leading-none">{parts.day}</span>
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.65rem] uppercase tracking-[0.14em] text-faint">
          <span className="text-accent">{activity.category}</span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" /> {formatTime(activity.startAt)}
          </span>
          {activity.location && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3 w-3" /> {activity.location}
            </span>
          )}
        </span>
        <span className="mt-1.5 block truncate font-display text-lg font-semibold text-ink transition-colors group-hover:text-accent">
          {activity.title}
        </span>
      </span>
      <ArrowUpRight className="h-5 w-5 shrink-0 text-faint transition group-hover:-translate-y-0.5 group-hover:text-accent" />
    </Link>
  );
}

export default function HomePage() {
  const { settings, posts, ministries, activities, giving } = useSite();
  const copy = (key) => copyValue(settings, key);

  const upcoming = (activities || []).filter((item) => isUpcoming(item.startAt)).slice(0, 3);
  const featuredPosts = (posts || []).slice(0, 3);
  const serviceTimes = settings?.serviceTimes || [];
  const verse = settings?.verse || {};
  const featuredMinistries = (ministries || []).slice(0, 3);

  return (
    <>
      <Hero settings={settings} nextActivity={upcoming[0]} />

      <section id="welcome" className="section relative overflow-hidden scroll-mt-24">
        <div className="pointer-events-none absolute -left-40 top-20 h-80 w-80 rounded-full bg-accent/[0.06] blur-3xl" />
        <div className="container-x relative grid items-center gap-16 lg:grid-cols-[1.02fr_1fr]">
          <Reveal className="relative">
            <div className="relative overflow-hidden rounded-[2rem] border border-line shadow-soft">
              <img
                src={copy('home_welcome_image')}
                alt={copy('home_welcome_image_alt')}
                className="aspect-[4/5] w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#070b12]/78 via-transparent to-transparent" />
              <div className="absolute inset-x-6 bottom-6">
                <p className="font-display text-2xl italic leading-snug text-white/90">
                  {copy('home_quote')}
                </p>
                <p className="mt-2 text-[0.6rem] font-semibold uppercase tracking-[0.28em] text-[#e7c77e]">
                  {copy('home_quote_ref')}
                </p>
              </div>
            </div>
            <div className="absolute -bottom-10 -right-4 hidden w-56 overflow-hidden rounded-3xl border-4 border-surface shadow-lift sm:block lg:-right-10">
              <img src={copy('home_welcome_small_image')} alt="Community outreach" className="aspect-[4/3] w-full object-cover" />
            </div>
            <div className="absolute -left-4 top-8 hidden rotate-[-8deg] rounded-2xl border border-line bg-elevated/90 px-4 py-3 shadow-soft backdrop-blur lg:block">
              <p className="text-[0.55rem] font-semibold uppercase tracking-[0.2em] text-faint">{copy('home_badge_city')}</p>
              <p className="mt-1 font-display text-lg text-ink">{copy('home_badge_text')}</p>
            </div>
          </Reveal>

          <Reveal delay={0.08}>
            <span className="kicker">{copy('home_welcome_kicker')}</span>
            <h2 className="mt-5 text-balance font-display text-4xl font-semibold leading-[1.06] tracking-[-0.015em] text-ink sm:text-5xl">
              <AccentedWord text={copy('home_welcome_title')} />
            </h2>
            <p className="mt-5 max-w-lg text-pretty leading-relaxed text-soft">
              {settings?.tagline || 'A Bible-believing church in the heart of Iloilo'}. {copy('home_welcome_text')}
            </p>

            <ul className="mt-8 space-y-4">
              {[
                {
                  icon: BookOpen,
                  title: copy('home_point_1_title'),
                  text: copy('home_point_1_text'),
                },
                {
                  icon: Users,
                  title: copy('home_point_2_title'),
                  text: copy('home_point_2_text'),
                },
                {
                  icon: HeartHandshake,
                  title: copy('home_point_3_title'),
                  text: copy('home_point_3_text'),
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.title} className="flex gap-4">
                    <span className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-accent/15 bg-accent/[0.07] text-accent">
                      <Icon className="h-[18px] w-[18px]" />
                    </span>
                    <span>
                      <span className="block text-[0.92rem] font-semibold text-ink">{item.title}</span>
                      <span className="mt-0.5 block text-sm leading-relaxed text-soft">{item.text}</span>
                    </span>
                  </li>
                );
              })}
            </ul>

            <div className="mt-9 flex flex-wrap gap-3">
              <Link to="/pages/about" className="btn btn-accent group">
                {copy('home_story_button')}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link to="/contact" className="btn btn-outline">
                {copy('home_visit_button')}
              </Link>
            </div>

            <div className="mt-10 grid grid-cols-3 gap-4 border-t border-line pt-6">
              <div>
                <p className="font-display text-2xl font-semibold text-ink">{ministries.length || 6}</p>
                <p className="mt-1 text-[0.65rem] uppercase tracking-[0.14em] text-faint">{copy('home_stat_1_label')}</p>
              </div>
              <div>
                <p className="font-display text-2xl font-semibold text-ink">{serviceTimes.length || 4}</p>
                <p className="mt-1 text-[0.65rem] uppercase tracking-[0.14em] text-faint">{copy('home_stat_2_label')}</p>
              </div>
              <div>
                <p className="font-display text-2xl font-semibold text-ink">{copy('home_stat_3_value')}</p>
                <p className="mt-1 text-[0.65rem] uppercase tracking-[0.14em] text-faint">{copy('home_stat_3_label')}</p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {serviceTimes.length > 0 && (
        <section className="border-y border-line bg-elevated/50">
          <div className="container-x grid gap-5 py-9 sm:grid-cols-2 lg:grid-cols-4">
            {serviceTimes.map((slot, index) => (
              <Reveal key={`${slot.day}-${slot.time}-${index}`} delay={index * 0.05}>
                <div className="flex items-start gap-3.5">
                  <span className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-line bg-surface text-accent">
                    <Clock className="h-[17px] w-[17px]" />
                  </span>
                  <div>
                    <p className="text-[0.6rem] font-semibold uppercase tracking-[0.18em] text-faint">
                      {slot.day}
                    </p>
                    <p className="mt-1 font-display text-lg font-semibold text-ink">{slot.time}</p>
                    <p className="mt-0.5 text-[0.78rem] text-soft">{slot.label}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {featuredPosts.length > 0 && (
        <section className="section">
          <div className="container-x">
            <Reveal>
              <SectionHeading
                kicker={copy('home_updates_kicker')}
                title={copy('home_updates_title')}
                description={copy('home_updates_text')}
                action={
                  <Link to="/updates" className="btn btn-outline btn-sm">
                    {copy('home_updates_button')} <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                }
              />
            </Reveal>
            <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {featuredPosts.map((post, index) => (
                <Reveal key={post.id} delay={index * 0.07}>
                  <PostPreviewCard post={post} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {featuredMinistries.length > 0 && (
        <section className="section border-y border-line bg-elevated/40">
          <div className="container-x">
            <Reveal>
              <SectionHeading
                kicker={copy('home_ministries_kicker')}
                title={copy('home_ministries_title')}
                description={copy('home_ministries_text')}
                action={
                  <Link to="/ministries" className="btn btn-outline btn-sm">
                    {copy('home_ministries_button')} <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                }
              />
            </Reveal>
            <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {featuredMinistries.map((ministry, index) => (
                <Reveal key={ministry.id} delay={index * 0.07}>
                  <MinistryCard ministry={ministry} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="section">
        <div className="container-x grid items-start gap-12 lg:grid-cols-[0.85fr_1.15fr]">
          <Reveal>
            <SectionHeading
              kicker={copy('home_activities_kicker')}
              title={copy('home_activities_title')}
              description={copy('home_activities_text')}
            />
            <Link to="/activities" className="btn btn-accent mt-8 group">
              {copy('home_activities_button')}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Reveal>

          <div className="space-y-4">
            {upcoming.length > 0 ? (
              upcoming.map((activity, index) => (
                <Reveal key={activity.id} delay={index * 0.06}>
                  <ActivityRow activity={activity} />
                </Reveal>
              ))
            ) : (
              <Reveal>
                <div className="rounded-3xl border border-dashed border-line bg-elevated/50 px-6 py-12 text-center">
                  <p className="font-display text-lg text-ink">{copy('home_activities_empty_title')}</p>
                  <p className="mt-2 text-sm text-soft">{copy('home_activities_empty_text')}</p>
                </div>
              </Reveal>
            )}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden">
        <img
          src={copy('home_cta_image')}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-[#060a12]/78" />
        <div className="absolute inset-0 noise" />
        <div className="container-x relative py-24 text-center text-white sm:py-28">
          <Reveal>
            <Quote className="mx-auto h-9 w-9 text-[#e7c77e]/60" />
            <p className="mx-auto mt-6 max-w-3xl text-balance font-display text-2xl italic leading-snug text-white/90 sm:text-3xl lg:text-[2.4rem]">
              {verse.text || '“Your word is a lamp to my feet and a light to my path.”'}
            </p>
            <p className="mt-5 text-[0.62rem] font-semibold uppercase tracking-[0.3em] text-[#e7c77e]">
              {verse.reference || 'Psalm 119:105'}
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Link to="/pages/about" className="btn btn-accent group">
                {copy('home_cta_primary')}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link to="/contact" className="btn btn-white">
                {copy('home_cta_secondary')}
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="section">
        <div className="container-x">
          <Reveal>
            <div className="grid overflow-hidden rounded-[2.5rem] border border-line bg-elevated lg:grid-cols-2">
              <div className="relative min-h-[20rem] overflow-hidden">
                <img src={copy('home_giving_image')} alt="Serving our community" className="absolute inset-0 h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#070b12]/80 via-[#070b12]/20 to-transparent" />
                <div className="absolute inset-x-7 bottom-7">
                  <p className="text-[0.6rem] font-semibold uppercase tracking-[0.24em] text-[#e7c77e]">
                    {copy('home_giving_overlay_kicker')}
                  </p>
                  <p className="mt-2 font-display text-2xl leading-snug text-white">
                    {copy('home_giving_overlay_text')}
                  </p>
                </div>
              </div>
              <div className="p-8 sm:p-12">
                <span className="kicker">{copy('home_giving_kicker')}</span>
                <h2 className="mt-4 font-display text-3xl font-semibold leading-tight text-ink sm:text-4xl">
                  {copy('home_giving_title')}
                </h2>
                <p className="mt-4 text-sm leading-relaxed text-soft">
                  {copy('home_giving_text')}
                </p>
                <ul className="mt-7 grid gap-3 sm:grid-cols-2">
                  {(giving.length ? giving : [{ title: 'General Fund' }, { title: 'Ministry Support' }, { title: 'Building Fund' }]).map((option) => (
                    <li key={option.id || option.title} className="flex items-center gap-2.5 text-sm text-soft">
                      <span className="grid h-5 w-5 place-items-center rounded-full bg-accent/12 text-accent">
                        <Check className="h-3 w-3" strokeWidth={3} />
                      </span>
                      {option.title}
                    </li>
                  ))}
                </ul>
                <div className="mt-9 flex flex-wrap gap-3">
                  <Link to="/pages/donate" className="btn btn-accent">
                    <Heart className="h-4 w-4" /> {copy('home_giving_button')}
                  </Link>
                  <Link to="/contact" className="btn btn-outline">
                    {copy('home_giving_question_button')}
                  </Link>
                </div>
                <p className="mt-6 text-[0.7rem] leading-relaxed text-faint">
                  {copy('home_giving_quote')}
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
