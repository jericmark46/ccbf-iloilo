import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getError } from '../../api/client';
import { Logo } from '../../components/ui/Logo';
import { Spinner } from '../../components/ui/Loaders';

export default function AdminLogin() {
  const { user, login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (user) return <Navigate to={location.state?.from || '/admin'} replace />;

  const onSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const account = await login(email.trim(), password);
      toast.success(`Welcome back, ${account.name.split(' ')[0]}.`);
      navigate(location.state?.from || '/admin', { replace: true });
    } catch (err) {
      setError(getError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen bg-surface lg:grid-cols-[1.05fr_1fr]">
      <div className="relative hidden overflow-hidden bg-[#070b12] lg:block">
        <img
          src="/images/worship.png"
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#05070c] via-[#05070c]/40 to-[#05070c]/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#05070c]/70 to-transparent" />
        <div className="relative flex h-full flex-col justify-between p-12">
          <Logo to="/" className="text-white" siteName="Calvary Chapel Iloilo" />
          <div className="max-w-md">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-[#e7c77e] backdrop-blur">
              <ShieldCheck className="h-3.5 w-3.5" /> Staff workspace
            </span>
            <h1 className="mt-6 text-balance font-display text-[2.6rem] font-semibold leading-[1.08] tracking-tight text-white">
              Shepherd the story well.
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-white/60">
              Publish updates, steward the ministry pages, and keep the church family connected —
              all from one calm place.
            </p>
            <div className="mt-8 flex items-center gap-4 text-[0.65rem] uppercase tracking-[0.18em] text-white/40">
              <span>Calvary Chapel Iloilo</span>
              <span className="h-px w-8 bg-white/20" />
              <span>Est. in the Word</span>
            </div>
          </div>
          <p className="text-[0.62rem] uppercase tracking-[0.22em] text-white/30">
            “Let all things be done decently and in order.” — 1 Cor 14:40
          </p>
        </div>
      </div>

      <div className="flex flex-col">
        <div className="flex items-center justify-between p-6 lg:justify-end">
          <Logo to="/" className="text-ink lg:hidden" />
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-soft transition hover:text-accent"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to website
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center px-5 pb-16 sm:px-10">
          <div className="w-full max-w-sm">
            <p className="text-[0.6rem] font-semibold uppercase tracking-[0.26em] text-accent">
              Staff sign in
            </p>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink">
              Welcome back.
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-soft">
              Sign in with the account a superadmin created for you.
            </p>

            <form onSubmit={onSubmit} className="mt-8 space-y-4">
              <label className="block">
                <span className="label">Email address</span>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
                  <input
                    type="email"
                    autoComplete="email"
                    className="field py-3.5 pl-11"
                    placeholder="you@church.org"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                  />
                </div>
              </label>

              <label className="block">
                <span className="label">Password</span>
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    className="field py-3.5 pl-11 pr-12"
                    placeholder="••••••••"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-faint transition hover:text-ink"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </label>

              {error && (
                <p className="rounded-2xl border border-red-500/25 bg-red-500/[0.07] px-4 py-3 text-xs leading-relaxed text-red-500">
                  {error}
                </p>
              )}

              <button type="submit" className="btn btn-accent w-full" disabled={loading}>
                {loading ? <Spinner className="h-4 w-4 text-current" /> : null}
                {loading ? 'Signing you in…' : 'Enter the studio'}
                {!loading && <ArrowRight className="h-4 w-4" />}
              </button>
            </form>

            <p className="mt-7 rounded-2xl border border-line bg-elevated/60 px-4 py-3 text-[0.7rem] leading-relaxed text-faint">
              Access is limited to church staff. Need an account or a password reset? Ask a
              superadmin to help you.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
