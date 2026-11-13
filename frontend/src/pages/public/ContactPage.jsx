import { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Facebook,
  Instagram,
  Mail,
  MapPin,
  Phone,
  Send,
  Youtube,
} from 'lucide-react';
import { api, getError } from '../../api/client';
import { useSite } from '../../context/SiteContext';
import { useToast } from '../../context/ToastContext';
import { PageHero } from '../../components/public/PageHero';
import { Reveal } from '../../components/ui/Reveal';
import { SectionHeading } from '../../components/ui/SectionHeading';
import { copyValue } from '../../lib/copy';

const initialForm = { name: '', email: '', phone: '', subject: '', message: '' };

const initials = (name) =>
  String(name || '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

export default function ContactPage() {
  const { settings } = useSite();
  const copy = (key) => copyValue(settings, key);
  const toast = useToast();
  const [form, setForm] = useState(initialForm);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const onChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      toast.error('Please fill in your name, email, and message.');
      return;
    }
    setSending(true);
    try {
      const { data } = await api.post('/public/contact', form);
      toast.success(data.message || 'Message sent. We will get back to you soon.');
      setSent(true);
      setForm(initialForm);
    } catch (err) {
      toast.error(getError(err));
    } finally {
      setSending(false);
    }
  };

  const contact = settings?.contact || {};
  const contactPeople = (contact.people || []).filter(
    (person) => person.name || person.email || person.phone
  );
  const socials = settings?.socials || {};
  const socialLinks = [
    { key: 'facebook', label: 'Facebook', href: socials.facebook, Icon: Facebook },
    { key: 'instagram', label: 'Instagram', href: socials.instagram, Icon: Instagram },
    { key: 'youtube', label: 'YouTube', href: socials.youtube, Icon: Youtube },
  ].filter((item) => item.href);

  const mapQuery = contact.address || 'Calvary Chapel Iloilo';
  const mapEmbed = contact.mapEmbed || `https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&output=embed`;
  const mapLink =
    contact.mapUrl ||
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`;
  const expectTitle = contact.expectTitle || 'What to expect';
  const expectations = contact.expectations?.length
    ? contact.expectations
    : [
        'A warm welcome — no dress code, no pressure.',
        'Bible teaching that is practical and Christ-centered.',
        'Prayer, worship, and time to connect over coffee.',
      ];

  return (
    <>
      <PageHero
        kicker={copy('contact_hero_kicker')}
        title={copy('contact_hero_title')}
        subtitle={copy('contact_hero_subtitle')}
        image={copy('contact_hero_image')}
      />

      <section className="py-16 sm:py-20">
        <div className="container-x">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Reveal>
              <div className="h-full rounded-3xl border border-line bg-elevated p-6">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                  <MapPin className="h-5 w-5" />
                </span>
                <p className="mt-4 text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-faint">
                  {copy('contact_visit_label')}
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-ink">
                  {contact.address || copy('contact_fallback_address')}
                </p>
                <a
                  href={mapLink}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-block text-xs font-semibold text-accent hover:underline"
                >
                  {copy('contact_map_open')}
                </a>
              </div>
            </Reveal>
            <Reveal delay={0.06}>
              <div className="h-full rounded-3xl border border-line bg-elevated p-6">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                  <Mail className="h-5 w-5" />
                </span>
                <p className="mt-4 text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-faint">
                  {copy('contact_email_label')}
                </p>
                {contact.email ? (
                  <a href={`mailto:${contact.email}`} className="mt-1.5 block text-sm text-ink hover:text-accent">
                    {contact.email}
                  </a>
                ) : (
                  <p className="mt-1.5 text-sm text-ink">hello@calvarychapeliloilo.org</p>
                )}
                {contact.phone && (
                  <a href={`tel:${contact.phone}`} className="mt-1 block text-sm text-soft hover:text-accent">
                    {contact.phone}
                  </a>
                )}
              </div>
            </Reveal>
            <Reveal delay={0.12}>
              <div className="h-full rounded-3xl border border-line bg-elevated p-6">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                  <Clock className="h-5 w-5" />
                </span>
                <p className="mt-4 text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-faint">
                  {copy('contact_times_label')}
                </p>
                <div className="mt-1.5 space-y-1 text-sm text-soft">
                  {(settings?.serviceTimes || []).slice(0, 3).map((slot) => (
                    <p key={slot.label}>
                      <span className="font-medium text-ink">{slot.day}</span> · {slot.time}
                    </p>
                  ))}
                  {!settings?.serviceTimes?.length && <p>{copy('contact_fallback_time')}</p>}
                </div>
              </div>
            </Reveal>
          </div>

          {contactPeople.length > 0 && (
            <div className="mt-14">
              <SectionHeading
                kicker={copy('contact_team_kicker')}
                title={copy('contact_team_title')}
                description={copy('contact_team_text')}
              />
              <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {contactPeople.map((person, index) => (
                  <Reveal key={`${person.name}-${person.email}-${index}`} delay={Math.min(index * 0.05, 0.2)}>
                    <article className="flex h-full flex-col rounded-3xl border border-line bg-elevated p-6">
                      <div className="flex items-center gap-3.5">
                        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-accent/10 font-display text-base font-semibold text-accent">
                          {initials(person.name) || 'CC'}
                        </span>
                        <div className="min-w-0">
                          <h3 className="truncate font-display text-lg font-semibold text-ink">
                            {person.name || 'Church contact'}
                          </h3>
                          {person.role && (
                            <p className="mt-0.5 truncate text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-faint">
                              {person.role}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="mt-5 space-y-2 text-sm">
                        {person.email && (
                          <a
                            href={`mailto:${person.email}`}
                            className="flex items-center gap-2.5 text-soft transition hover:text-accent"
                          >
                            <Mail className="h-4 w-4 shrink-0 text-accent" />
                            <span className="truncate">{person.email}</span>
                          </a>
                        )}
                        {person.phone && (
                          <a
                            href={`tel:${person.phone}`}
                            className="flex items-center gap-2.5 text-soft transition hover:text-accent"
                          >
                            <Phone className="h-4 w-4 shrink-0 text-accent" />
                            <span>{person.phone}</span>
                          </a>
                        )}
                      </div>
                    </article>
                  </Reveal>
                ))}
              </div>
            </div>
          )}

          <div className="mt-14 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div>
              <SectionHeading
                kicker={copy('contact_send_kicker')}
                title={copy('contact_send_title')}
                description={copy('contact_send_text')}
              />

              {sent ? (
                <div className="mt-8 rounded-3xl border border-emerald-500/25 bg-emerald-500/[0.07] p-8 text-center">
                  <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
                  <h3 className="mt-4 font-display text-2xl font-semibold text-ink">
                    Message received
                  </h3>
                  <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-soft">
                    Thank you for reaching out. Our church office will be in touch with you soon.
                  </p>
                  <button type="button" className="btn btn-outline btn-sm mt-5" onClick={() => setSent(false)}>
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={onSubmit} className="mt-8 space-y-5">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-semibold text-soft">Name</span>
                      <input
                        className="field"
                        name="name"
                        value={form.name}
                        onChange={onChange}
                        placeholder="Your full name"
                        required
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-semibold text-soft">Email</span>
                      <input
                        className="field"
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={onChange}
                        placeholder="you@example.com"
                        required
                      />
                    </label>
                  </div>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-semibold text-soft">Phone (optional)</span>
                      <input
                        className="field"
                        name="phone"
                        value={form.phone}
                        onChange={onChange}
                        placeholder="+63 900 000 0000"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-semibold text-soft">Subject (optional)</span>
                      <input
                        className="field"
                        name="subject"
                        value={form.subject}
                        onChange={onChange}
                        placeholder="Prayer request, visit, ministry…"
                      />
                    </label>
                  </div>
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-semibold text-soft">Message</span>
                    <textarea
                      className="field min-h-[9rem] resize-y"
                      name="message"
                      value={form.message}
                      onChange={onChange}
                      placeholder="Tell us how we can help…"
                      required
                    />
                  </label>
                  <button type="submit" className="btn btn-accent" disabled={sending}>
                    <Send className="h-4 w-4" />
                    {sending ? 'Sending…' : 'Send message'}
                  </button>
                  <p className="text-xs leading-relaxed text-faint">
                    By sending a message you agree to be contacted about your enquiry. We never share
                    your details.
                  </p>
                </form>
              )}
            </div>

            <div className="space-y-5">
              <div className="overflow-hidden rounded-3xl border border-line bg-elevated">
                <iframe
                  title="Calvary Chapel Iloilo location"
                  src={mapEmbed}
                  className="h-72 w-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
                <div className="flex items-center justify-between gap-3 p-5">
                  <div>
                    <p className="text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-faint">
                      {copy('contact_find_label')}
                    </p>
                    <p className="mt-1 text-sm text-ink">{contact.address || copy('contact_fallback_address')}</p>
                  </div>
                  <Phone className="h-5 w-5 shrink-0 text-accent" />
                </div>
              </div>

              <div className="rounded-3xl border border-line bg-elevated p-6">
                <p className="kicker">{expectTitle}</p>
                <ul className="mt-4 space-y-3 text-sm leading-relaxed text-soft">
                  {expectations.map((item, index) => (
                    <li key={`${item}-${index}`}>• {item}</li>
                  ))}
                </ul>
              </div>

              {socialLinks.length > 0 && (
                <div className="rounded-3xl border border-line bg-elevated p-6">
                  <p className="text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-faint">
                    {copy('contact_follow_label')}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {socialLinks.map(({ key, label, href, Icon }) => (
                      <a
                        key={key}
                        href={href}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2 text-xs font-semibold text-soft transition hover:border-accent/40 hover:text-accent"
                      >
                        <Icon className="h-3.5 w-3.5" /> {label}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
