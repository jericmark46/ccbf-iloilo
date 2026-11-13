import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  Facebook,
  Instagram,
  Mail,
  MapPin,
  Music2,
  Phone,
  ShieldCheck,
  Youtube,
  Heart,
} from 'lucide-react';
import { useSite } from '../../context/SiteContext';
import { useAuth } from '../../context/AuthContext';
import { Logo } from '../ui/Logo';
import { ThemeSwitcher } from '../ui/ThemeSwitcher';
import { cn } from '../../lib/utils';
import { copyValue } from '../../lib/copy';

export function Footer() {
  const { settings, nav } = useSite();
  const copy = (key) => copyValue(settings, key);
  const { user } = useAuth();
  const verse = settings?.verse || {};
  const socials = settings?.socials || {};
  const contact = settings?.contact || {};
  const times = settings?.serviceTimes || [];
  const links = (nav || []).filter((item) => item.visible !== false);
  const year = new Date().getFullYear();
  const giveHref = links.find((item) => /donate|give/i.test(item.label))?.href || '/pages/donate';

  const socialItems = [
    { key: 'facebook', icon: Facebook, label: 'Facebook' },
    { key: 'instagram', icon: Instagram, label: 'Instagram' },
    { key: 'youtube', icon: Youtube, label: 'YouTube' },
    { key: 'tiktok', icon: Music2, label: 'TikTok' },
  ].filter((item) => socials[item.key]);

  return (
    <footer className="relative overflow-hidden bg-[#080b11] text-white/65">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(201,162,83,0.10),transparent_58%)]" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#c9a253]/50 to-transparent" />
      <div className="pointer-events-none absolute inset-0 noise" />

      <div className="container-x relative py-16 lg:py-20">
        <div className="grid gap-14 lg:grid-cols-[1.05fr_1.5fr]">
          <div>
            <Logo className="text-white" siteName={settings?.siteName} />
            <p className="mt-7 max-w-md font-display text-[1.6rem] italic leading-snug text-white/85">
              {verse.text || '“Your word is a lamp to my feet and a light to my path.”'}
            </p>
            <p className="mt-4 text-[0.62rem] font-semibold uppercase tracking-[0.3em] text-[#e7c77e]">
              {verse.reference || 'Psalm 119:105'}
            </p>

            {socialItems.length > 0 && (
              <div className="mt-7 flex gap-2">
                {socialItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <a
                      key={item.key}
                      href={socials[item.key]}
                      target="_blank"
                      rel="noreferrer noopener"
                      aria-label={item.label}
                      className="grid h-10 w-10 place-items-center rounded-full border border-white/15 text-white/60 transition hover:border-[#e7c77e]/60 hover:text-[#e7c77e]"
                    >
                      <Icon className="h-4 w-4" />
                    </a>
                  );
                })}
              </div>
            )}
          </div>

          <div className="grid gap-10 sm:grid-cols-3">
            <div>
              <p className="text-[0.62rem] font-semibold uppercase tracking-[0.24em] text-white/35">
                {copy('footer_explore_label')}
              </p>
              <ul className="mt-5 space-y-3">
                {links.map((item) => (
                  <li key={item.id}>
                    <Link
                      to={item.href}
                      className="group inline-flex items-center gap-1.5 text-sm text-white/65 transition hover:text-white"
                    >
                      {item.label}
                      <ArrowUpRight className="h-3 w-3 opacity-0 transition group-hover:opacity-60" />
                    </Link>
                  </li>
                ))}
                <li>
                  <Link
                    to="/contact"
                    className="group inline-flex items-center gap-1.5 text-sm text-white/65 transition hover:text-white"
                  >
                    {copy('footer_contact_label')}
                    <ArrowUpRight className="h-3 w-3 opacity-0 transition group-hover:opacity-60" />
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <p className="text-[0.62rem] font-semibold uppercase tracking-[0.24em] text-white/35">
                {copy('footer_gather_label')}
              </p>
              <ul className="mt-5 space-y-4">
                {times.length === 0 && <li className="text-sm text-white/50">{copy('footer_times_empty')}</li>}
                {times.map((slot, index) => (
                  <li key={`${slot.day}-${slot.time}-${index}`} className="text-sm">
                    <span className="block text-white/85">{slot.label}</span>
                    <span className="mt-0.5 block text-[0.78rem] text-white/45">
                      {slot.day} · {slot.time}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-[0.62rem] font-semibold uppercase tracking-[0.24em] text-white/35">
                {copy('footer_connect_label')}
              </p>
              <ul className="mt-5 space-y-3.5 text-sm">
                {contact.address && (
                  <li className="flex gap-2.5 text-white/60">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#e7c77e]/80" />
                    <span>{contact.address}</span>
                  </li>
                )}
                {contact.email && (
                  <li>
                    <a
                      href={`mailto:${contact.email}`}
                      className="flex gap-2.5 text-white/60 transition hover:text-white"
                    >
                      <Mail className="mt-0.5 h-4 w-4 shrink-0 text-[#e7c77e]/80" />
                      <span className="break-all">{contact.email}</span>
                    </a>
                  </li>
                )}
                {contact.phone && (
                  <li>
                    <a
                      href={`tel:${contact.phone}`}
                      className="flex gap-2.5 text-white/60 transition hover:text-white"
                    >
                      <Phone className="mt-0.5 h-4 w-4 shrink-0 text-[#e7c77e]/80" />
                      <span>{contact.phone}</span>
                    </a>
                  </li>
                )}
              </ul>

              <Link to={giveHref} className="btn btn-sm mt-6 border border-[#e7c77e]/40 bg-[#e7c77e]/10 text-[#f0d9a4] hover:bg-[#e7c77e]/20">
                <Heart className="h-3.5 w-3.5" /> {copy('footer_give_label')}
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-5 border-t border-white/10 pt-6 text-xs text-white/35 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {settings?.siteName || 'Calvary Chapel Iloilo'}.{' '}
            {settings?.footerNote || 'Grace and peace to you.'}
          </p>
          <div className="flex flex-wrap items-center gap-5">
            <ThemeSwitcher onDark />
            <Link to="/contact" className="transition hover:text-white/80">
              {copy('footer_contact_label')}
            </Link>
            <Link to={user ? '/admin' : '/admin/login'} className="inline-flex items-center gap-1.5 transition hover:text-white/80">
              <ShieldCheck className="h-3.5 w-3.5" />
              {user ? copy('footer_dashboard_label') : copy('footer_staff_label')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
