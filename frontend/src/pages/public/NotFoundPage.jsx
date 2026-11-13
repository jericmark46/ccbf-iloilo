import { Link } from 'react-router-dom';
import { ArrowLeft, Compass } from 'lucide-react';
import { useSite } from '../../context/SiteContext';
import { copyValue } from '../../lib/copy';

export default function NotFoundPage() {
  const { settings } = useSite();
  const copy = (key) => copyValue(settings, key);
  return (
    <section className="relative flex min-h-[80vh] items-center overflow-hidden pt-24">
      <div className="container-x relative text-center">
        <span className="kicker justify-center">{copy('notfound_kicker')}</span>
        <p className="mt-6 font-display text-[6rem] font-semibold leading-none tracking-tight text-accent/25 sm:text-[9rem]">
          404
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-ink sm:text-4xl">
          {copy('notfound_title')}
        </h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-soft">
          {copy('notfound_text')}
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to="/" className="btn btn-accent">
            <ArrowLeft className="h-4 w-4" /> {copy('notfound_home')}
          </Link>
          <Link to="/updates" className="btn btn-outline">
            <Compass className="h-4 w-4" /> {copy('notfound_updates')}
          </Link>
        </div>
      </div>
    </section>
  );
}
