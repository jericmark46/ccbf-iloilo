import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowUpRight,
  ChevronDown,
  Heart,
  LayoutDashboard,
  Menu,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import { useSite } from '../../context/SiteContext';
import { useAuth } from '../../context/AuthContext';
import { useLockBodyScroll, useScrolled } from '../../hooks/useUi';
import { Logo } from '../ui/Logo';
import { ThemeSwitcher, ThemePanel } from '../ui/ThemeSwitcher';
import { SearchDialog } from './SearchDialog';
import { cn } from '../../lib/utils';
import { copyValue } from '../../lib/copy';

function isExternalLink(link) {
  return link.external || /^https?:\/\//i.test(link.href || '');
}

function NavAnchor({ link, className, children, onNavigate }) {
  if (isExternalLink(link)) {
    return (
      <a
        href={link.href}
        target={link.openInNewTab ? '_blank' : undefined}
        rel={link.openInNewTab ? 'noreferrer noopener' : undefined}
        className={className}
        onClick={onNavigate}
      >
        {children}
      </a>
    );
  }
  return (
    <Link to={link.href} className={className} onClick={onNavigate}>
      {children}
    </Link>
  );
}

export function Navbar() {
  const { settings, nav } = useSite();
  const copy = (key) => copyValue(settings, key);
  const { user } = useAuth();
  const location = useLocation();
  const scrolled = useScrolled(28);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [expanded, setExpanded] = useState(null);

  const isHome = location.pathname === '/';
  const onTransparent = isHome && !scrolled;
  const announcement = (settings?.announcements || []).find((item) => item.active && item.text);
  const showAnnouncement = announcement && !scrolled;

  const giveLink =
    nav.find((item) => /donate|give/i.test(item.label)) ||
    nav.find((item) => item.href?.includes('donate'));
  const giveHref = giveLink?.href || '/pages/donate';

  useLockBodyScroll(mobileOpen);

  useEffect(() => {
    setMobileOpen(false);
    setExpanded(null);
  }, [location.pathname, location.hash]);

  useEffect(() => {
    const onKey = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const isActive = (href = '') => {
    const path = href.split('#')[0] || '/';
    if (path === '/') return location.pathname === '/';
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const headerTone = onTransparent
    ? 'bg-transparent'
    : scrolled
      ? 'border-b border-line/70 bg-surface/88 shadow-[0_18px_40px_-32px_rgba(0,0,0,0.6)] backdrop-blur-xl'
      : 'border-b border-line/50 bg-surface/70 backdrop-blur-xl';

  const linkTone = onTransparent
    ? 'text-white/80 hover:text-white'
    : 'text-soft hover:text-ink';
  const activeTone = 'bg-accent/12 text-accent';
  const pillTone = onTransparent
    ? 'border-white/15 bg-white/[0.06]'
    : 'border-line/80 bg-elevated/60';

  return (
    <>
      <header className={cn('safe-top fixed inset-x-0 top-0 z-50 transition-all duration-500', headerTone)}>
        <AnimatePresence>
          {showAnnouncement && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className={cn(
                'overflow-hidden border-b text-[0.68rem] tracking-wide sm:text-[0.72rem]',
                onTransparent
                  ? 'border-white/10 bg-white/[0.04] text-white/75'
                  : 'border-line/60 bg-elevated/60 text-soft'
              )}
            >
              <div className="container-x flex min-h-9 items-center justify-center gap-2 py-2 text-center leading-snug">
                <Sparkles
                  className={cn('h-3.5 w-3.5 shrink-0', onTransparent ? 'text-[#e7c77e]' : 'text-accent')}
                />
                {announcement.href ? (
                  isExternalLink(announcement) ? (
                    <a
                      href={announcement.href}
                      className="line-clamp-2 underline decoration-current/30 underline-offset-4 transition hover:text-white sm:line-clamp-none"
                      target="_blank"
                      rel="noreferrer noopener"
                    >
                      {announcement.text}
                    </a>
                  ) : (
                    <Link
                      to={announcement.href}
                      className="line-clamp-2 underline decoration-current/30 underline-offset-4 transition hover:text-inherit hover:opacity-80 sm:line-clamp-none"
                    >
                      {announcement.text}
                    </Link>
                  )
                ) : (
                  <span className="line-clamp-2 sm:line-clamp-none">{announcement.text}</span>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="container-x flex h-16 items-center justify-between gap-3 sm:h-[74px] sm:gap-4">
          <Logo className={onTransparent ? 'text-white' : 'text-ink'} />

          <nav className="hidden items-center lg:flex">
            <div className={cn('flex items-center gap-0.5 rounded-full border px-1.5 py-1.5 backdrop-blur-md', pillTone)}>
              {nav.map((link) => {
                const active = isActive(link.href);
                const hasChildren = link.children?.length > 0;
                return (
                  <div key={link.id} className="group relative">
                    <NavAnchor
                      link={link}
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[0.82rem] font-medium transition-colors duration-300',
                        linkTone,
                        active && activeTone
                      )}
                    >
                      {link.label}
                      {hasChildren && (
                        <ChevronDown className="h-3.5 w-3.5 opacity-60 transition-transform duration-300 group-hover:rotate-180" />
                      )}
                      {isExternalLink(link) && <ArrowUpRight className="h-3 w-3 opacity-60" />}
                    </NavAnchor>

                    {hasChildren && (
                      <div className="invisible absolute left-1/2 top-full z-50 w-64 -translate-x-1/2 pt-3 opacity-0 transition-all duration-200 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                        <div className="overflow-hidden rounded-2xl border border-line bg-elevated p-2 shadow-lift">
                          <p className="px-3 pb-1.5 pt-2 text-[0.6rem] font-semibold uppercase tracking-[0.22em] text-faint">
                            {link.label}
                          </p>
                          {link.children.map((child) => (
                            <NavAnchor
                              key={child.id}
                              link={child}
                              className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm text-soft transition hover:bg-accent/10 hover:text-accent"
                            >
                              <span className="flex flex-col">
                                <span className="font-medium">{child.label}</span>
                                {child.description && (
                                  <span className="text-[0.7rem] text-faint">{child.description}</span>
                                )}
                              </span>
                              <ArrowUpRight className="h-3.5 w-3.5 opacity-50" />
                            </NavAnchor>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className={cn(
                onTransparent
                  ? 'inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white backdrop-blur-md transition hover:border-white/50 hover:bg-white/20'
                  : 'icon-btn h-11 w-11'
              )}
              aria-label="Search"
              title="Search (Ctrl+K)"
            >
              <Search className="h-[18px] w-[18px]" />
            </button>

            <div className="hidden sm:block">
              <ThemeSwitcher onDark={onTransparent} />
            </div>

            {user && (
              <Link
                to="/admin"
                className={cn(
                  onTransparent
                    ? 'hidden h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white backdrop-blur-md transition hover:border-white/50 hover:bg-white/20 sm:inline-flex'
                    : 'icon-btn hidden sm:inline-flex'
                )}
                title="Admin dashboard"
              >
                <LayoutDashboard className="h-[18px] w-[18px]" />
              </Link>
            )}

            <Link
              to={giveHref}
              className={cn(
                'btn btn-sm hidden items-center sm:inline-flex',
                onTransparent ? 'btn-white' : 'btn-accent'
              )}
            >
              <Heart className="h-4 w-4" />
              {copy('nav_give_label')}
            </Link>

            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className={cn(
                'inline-flex h-11 w-11 items-center justify-center rounded-full border transition lg:hidden',
                onTransparent
                  ? 'border-white/25 bg-white/10 text-white backdrop-blur-md hover:bg-white/20'
                  : 'border-line bg-elevated/60 text-soft hover:text-ink'
              )}
              aria-label="Open menu"
              aria-expanded={mobileOpen}
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />

      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-[95] lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="absolute inset-0 bg-[#04070d]/65 backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="absolute right-0 top-0 flex h-[100dvh] w-[88%] max-w-sm flex-col overflow-y-auto overscroll-contain border-l border-line bg-surface"
              aria-label="Mobile navigation"
            >
              <div className="flex items-center justify-between border-b border-line px-5 py-4">
                <Logo className="text-ink" />
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="icon-btn h-11 w-11"
                  aria-label="Close menu"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="safe-bottom flex-1 px-4 pt-5">
                <button
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    setSearchOpen(true);
                  }}
                  className="mb-4 flex w-full items-center gap-3 rounded-2xl border border-line bg-elevated px-4 py-3.5 text-sm text-faint"
                >
                  <Search className="h-4 w-4" />
                  Search the website…
                </button>

                <nav className="space-y-1">
                  {nav.map((link) => {
                    const active = isActive(link.href);
                    const hasChildren = link.children?.length > 0;
                    const open = expanded === link.id;
                    return (
                      <div key={link.id}>
                        <div className="flex items-center gap-1">
                          <NavAnchor
                            link={link}
                            className={cn(
                              'flex-1 rounded-xl px-3 py-3.5 text-[0.95rem] font-medium transition',
                              active ? 'bg-accent/10 text-accent' : 'text-ink hover:bg-ink/5'
                            )}
                          >
                            {link.label}
                          </NavAnchor>
                          {hasChildren && (
                            <button
                              type="button"
                              onClick={() => setExpanded(open ? null : link.id)}
                              className="icon-btn h-11 w-11"
                              aria-label={`${open ? 'Collapse' : 'Expand'} ${link.label}`}
                              aria-expanded={open}
                            >
                              <ChevronDown
                                className={cn('h-4 w-4 transition-transform', open && 'rotate-180')}
                              />
                            </button>
                          )}
                        </div>
                        {hasChildren && open && (
                          <div className="ml-4 mt-1 space-y-1 border-l border-line pl-4">
                            {link.children.map((child) => (
                              <NavAnchor
                                key={child.id}
                                link={child}
                                className="flex items-center justify-between rounded-lg px-3 py-3 text-sm text-soft transition hover:bg-accent/10 hover:text-accent"
                              >
                                {child.label}
                                <ArrowUpRight className="h-3.5 w-3.5 opacity-50" />
                              </NavAnchor>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </nav>

                <div className="mt-6 grid gap-2">
                  <Link
                    to={giveHref}
                    onClick={() => setMobileOpen(false)}
                    className="btn btn-accent w-full"
                  >
                    <Heart className="h-4 w-4" /> {copy('nav_give_label')}
                  </Link>
                  <Link
                    to="/contact"
                    onClick={() => setMobileOpen(false)}
                    className="btn btn-outline w-full"
                  >
                    {copy('nav_visit_label')}
                  </Link>
                </div>

                <div className="mt-7 border-t border-line pt-5">
                  <p className="mb-1 px-1 text-[0.6rem] font-semibold uppercase tracking-[0.22em] text-faint">
                    Appearance
                  </p>
                  <ThemePanel className="w-full border-0 bg-transparent p-1 shadow-none" />
                </div>

                {user ? (
                  <Link
                    to="/admin"
                    onClick={() => setMobileOpen(false)}
                    className="mt-4 flex items-center justify-between rounded-xl border border-line px-3 py-3 text-sm text-soft"
                  >
                    Admin dashboard
                    <LayoutDashboard className="h-4 w-4" />
                  </Link>
                ) : (
                  <Link
                    to="/admin/login"
                    onClick={() => setMobileOpen(false)}
                    className="mt-4 flex items-center justify-between rounded-xl border border-line px-3 py-3 text-sm text-faint"
                  >
                    {copy('footer_staff_label')}
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                )}
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
