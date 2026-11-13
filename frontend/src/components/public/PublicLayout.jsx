import { Outlet } from 'react-router-dom';
import { WifiOff, RotateCcw } from 'lucide-react';
import { useSite } from '../../context/SiteContext';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { FullPageLoader } from '../ui/Loaders';
import { Logo } from '../ui/Logo';

function SiteUnavailable({ message, onRetry }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-surface px-6 text-center">
      <Logo to={null} />
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-accent/10 text-accent">
        <WifiOff className="h-6 w-6" />
      </span>
      <div className="max-w-md">
        <h1 className="font-display text-2xl text-ink">We could not reach the church website</h1>
        <p className="mt-2 text-sm leading-relaxed text-soft">{message}</p>
      </div>
      <button type="button" onClick={onRetry} className="btn btn-accent btn-sm">
        <RotateCcw className="h-4 w-4" /> Try again
      </button>
    </div>
  );
}

export function PublicLayout() {
  const { loading, error, refresh } = useSite();

  if (loading) return <FullPageLoader />;
  if (error) return <SiteUnavailable message={error} onRetry={refresh} />;

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
