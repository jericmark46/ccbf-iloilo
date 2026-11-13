import { Suspense, useEffect, useState } from 'react';
import { Link, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  CalendarDays,
  ExternalLink,
  FileText,
  HandCoins,
  HeartHandshake,
  History,
  Image,
  Inbox,
  LayoutDashboard,
  Link2,
  LogOut,
  Menu,
  MessageCircle,
  NotebookPen,
  Settings2,
  ShieldCheck,
  SunMoon,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../api/client';
import { useLockBodyScroll } from '../../hooks/useUi';
import { Logo } from '../ui/Logo';
import { FullPageLoader, InlineLoader } from '../ui/Loaders';
import { cn } from '../../lib/utils';

const sections = [
  {
    label: 'Overview',
    items: [{ to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true }],
  },
  {
    label: 'Content',
    items: [
      { to: '/admin/posts', label: 'Updates', icon: NotebookPen },
      { to: '/admin/pages', label: 'Pages', icon: FileText },
      { to: '/admin/media', label: 'Media library', icon: Image },
      { to: '/admin/settings', label: 'Site settings', icon: Settings2 },
    ],
  },
  {
    label: 'Community',
    items: [
      { to: '/admin/comments', label: 'Comments', icon: MessageCircle },
      { to: '/admin/ministries', label: 'Ministries', icon: HeartHandshake },
      { to: '/admin/activities', label: 'Activities', icon: CalendarDays },
      { to: '/admin/giving', label: 'Giving', icon: HandCoins },
      { to: '/admin/messages', label: 'Inbox', icon: Inbox, badge: true },
    ],
  },
  {
    label: 'Administration',
    superadmin: true,
    items: [
      { to: '/admin/navigation', label: 'Navigation', icon: Link2 },
      { to: '/admin/users', label: 'Accounts', icon: Users },
      { to: '/admin/logs', label: 'Activity log', icon: History },
    ],
  },
];

const titles = [
  { match: '/admin/posts', title: 'Updates' },
  { match: '/admin/pages', title: 'Pages' },
  { match: '/admin/media', title: 'Media library' },
  { match: '/admin/comments', title: 'Comments' },
  { match: '/admin/ministries', title: 'Ministries' },
  { match: '/admin/activities', title: 'Activities' },
  { match: '/admin/giving', title: 'Giving' },
  { match: '/admin/messages', title: 'Inbox' },
  { match: '/admin/navigation', title: 'Navigation' },
  { match: '/admin/users', title: 'Accounts' },
  { match: '/admin/logs', title: 'Activity log' },
  { match: '/admin/settings', title: 'Site settings' },
  { match: '/admin/account', title: 'My account' },
  { match: '/admin', title: 'Dashboard' },
];

const roleLabel = (role) => (role === 'superadmin' ? 'Superadmin' : 'Admin');

function initialsOf(name = '') {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function SidebarContent({ user, pathname, unread, onNavigate, onSignOut }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-3 px-5 pb-5 pt-6">
        <Logo to="/admin" className="text-white" siteName="Calvary Chapel Iloilo" />
        <span className="rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-[0.55rem] font-semibold uppercase tracking-[0.18em] text-white/50">
          CMS
        </span>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 pb-4">
        {sections
          .filter((section) => !section.superadmin || user?.role === 'superadmin')
          .map((section) => (
            <div key={section.label}>
              <p className="px-3 pb-2 text-[0.55rem] font-semibold uppercase tracking-[0.24em] text-white/30">
                {section.label}
              </p>
              <ul className="space-y-0.5">
                {section.items.map((item) => {
                  const active = item.end
                    ? pathname === item.to
                    : pathname === item.to || pathname.startsWith(`${item.to}/`);
                  const Icon = item.icon;
                  return (
                    <li key={item.to}>
                      <Link
                        to={item.to}
                        onClick={onNavigate}
                        className={cn(
                          'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[0.82rem] font-medium transition',
                          active
                            ? 'bg-white/[0.08] text-white ring-1 ring-inset ring-white/10'
                            : 'text-white/55 hover:bg-white/[0.05] hover:text-white'
                        )}
                      >
                        {active && (
                          <span className="absolute -left-3 h-5 w-[3px] rounded-r-full bg-accent" />
                        )}
                        <Icon
                          className={cn(
                            'h-[17px] w-[17px] shrink-0 transition',
                            active ? 'text-accent' : 'text-white/40 group-hover:text-white/70'
                          )}
                        />
                        <span className="flex-1">{item.label}</span>
                        {item.badge && unread > 0 && (
                          <span className="rounded-full bg-accent px-1.5 py-0.5 text-[0.6rem] font-bold leading-none text-[#151126]">
                            {unread > 99 ? '99+' : unread}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
      </nav>

      <div className="border-t border-white/10 p-3">
        <div className="mb-2 flex items-center gap-3 rounded-2xl bg-white/[0.04] px-3 py-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent/15 text-[0.7rem] font-bold text-accent">
            {initialsOf(user?.name)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[0.8rem] font-semibold text-white">{user?.name}</p>
            <p className="text-[0.62rem] uppercase tracking-[0.14em] text-white/40">
              {roleLabel(user?.role)}
            </p>
          </div>
        </div>
        <Link
          to="/"
          className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-[0.78rem] text-white/50 transition hover:bg-white/[0.05] hover:text-white"
        >
          <ExternalLink className="h-4 w-4" /> View website
        </Link>
        <Link
          to="/admin/account"
          onClick={onNavigate}
          className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-[0.78rem] text-white/50 transition hover:bg-white/[0.05] hover:text-white"
        >
          <ShieldCheck className="h-4 w-4" /> My account
        </Link>
        <button
          type="button"
          onClick={onSignOut}
          className="mt-1 flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-[0.78rem] text-white/50 transition hover:bg-red-500/10 hover:text-red-300"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </div>
    </div>
  );
}

export function AdminLayout() {
  const { user, loading, logout } = useAuth();
  const { cycleMode, resolvedMode } = useTheme();
  const toast = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  useLockBodyScroll(menuOpen);

  const title =
    titles.find((item) => item.match === '/admin' || location.pathname === item.match || location.pathname.startsWith(`${item.match}/`))
      ?.title || 'Dashboard';

  useEffect(() => {
    if (!user) return;
    let active = true;
    api
      .get('/admin/stats')
      .then(({ data }) => active && setUnread(data.totals?.unreadMessages || 0))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [user, location.pathname]);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  if (loading) return <FullPageLoader label="Checking your session…" />;
  if (!user) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname + location.search }} />;
  }

  const signOut = async () => {
    await logout();
    toast.success('You have been signed out.');
    navigate('/admin/login', { replace: true });
  };

  return (
    <div className="min-h-[100dvh] bg-surface">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[17.5rem] flex-col bg-[#0b0a16] lg:flex">
        <SidebarContent
          user={user}
          pathname={location.pathname}
          unread={unread}
          onNavigate={() => {}}
          onSignOut={signOut}
        />
      </aside>

      <AnimatePresence>
        {menuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#05070c]/70 backdrop-blur-sm"
              onClick={() => setMenuOpen(false)}
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="relative flex h-full w-[18rem] max-w-[85vw] flex-col bg-[#0b0a16]"
            >
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="absolute right-3 top-4 z-10 grid h-9 w-9 place-items-center rounded-full border border-white/10 text-white/60 transition hover:text-white"
                aria-label="Close menu"
              >
                <X className="h-4 w-4" />
              </button>
              <SidebarContent
                user={user}
                pathname={location.pathname}
                unread={unread}
                onNavigate={() => setMenuOpen(false)}
                onSignOut={signOut}
              />
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      <div className="lg:pl-[17.5rem]">
        <header className="sticky top-0 z-30 border-b border-line bg-surface/85 backdrop-blur-xl">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-10">
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="icon-btn h-9 w-9 lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-4 w-4" />
            </button>
            <div className="min-w-0 flex-1">
              <p className="text-[0.55rem] font-semibold uppercase tracking-[0.24em] text-faint">
                Admin studio
              </p>
              <h2 className="truncate font-display text-base font-semibold leading-tight text-ink">
                {title}
              </h2>
            </div>
            <Link
              to="/admin/messages"
              className="icon-btn relative h-9 w-9"
              aria-label="Open inbox"
            >
              <Inbox className="h-4 w-4" />
              {unread > 0 && (
                <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-accent ring-2 ring-surface" />
              )}
            </Link>
            <button
              type="button"
              onClick={cycleMode}
              className="icon-btn h-9 w-9"
              aria-label="Switch theme"
              title={`Theme: ${resolvedMode}`}
            >
              <SunMoon className="h-4 w-4" />
            </button>
            <Link to="/" className="btn btn-outline btn-sm hidden sm:inline-flex">
              <ExternalLink className="h-3.5 w-3.5" /> View site
            </Link>
            <div className="hidden items-center gap-2.5 rounded-full border border-line bg-elevated py-1 pl-1 pr-3 md:flex">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-accent/15 text-[0.62rem] font-bold text-accent">
                {initialsOf(user.name)}
              </span>
              <div className="leading-tight">
                <p className="max-w-[9rem] truncate text-[0.72rem] font-semibold text-ink">{user.name}</p>
                <p className="text-[0.55rem] uppercase tracking-[0.14em] text-faint">
                  {roleLabel(user.role)}
                </p>
              </div>
            </div>
          </div>
        </header>

        <main className="px-4 py-7 sm:px-6 sm:py-9 lg:px-10">
          <Suspense fallback={<InlineLoader label="Loading…" />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
}

export function RequireSuperadmin({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user?.role !== 'superadmin') return <Navigate to="/admin" replace />;
  return children;
}
