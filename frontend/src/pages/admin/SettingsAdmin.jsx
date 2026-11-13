import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  BookOpen,
  Image as ImageIcon,
  Link2,
  MonitorSmartphone,
  Moon,
  Palette,
  Plus,
  Save,
  Sparkles,
  Sun,
  Trash2,
} from 'lucide-react';
import { api, getError } from '../../api/client';
import { useSite } from '../../context/SiteContext';
import { useToast } from '../../context/ToastContext';
import { PageHeader, Panel, PanelHeader, FilterChips } from '../../components/admin/AdminUI';
import { Field, MediaField, SelectField, TextAreaField, TextField } from '../../components/admin/fields';
import { InlineLoader, Spinner } from '../../components/ui/Loaders';
import { THEME_ACCENTS, THEME_MODES } from '../../context/ThemeContext';
import { COPY_GROUPS } from '../../lib/copy';
import { cn } from '../../lib/utils';

const TABS = [
  { id: 'general', label: 'General' },
  { id: 'background', label: 'Home & background' },
  { id: 'copy', label: 'Website text' },
  { id: 'contact', label: 'Contact & schedule' },
  { id: 'appearance', label: 'Appearance' },
];

const modeIcons = {
  light: Sun,
  dark: Moon,
  system: MonitorSmartphone,
  midnight: Sparkles,
  sepia: BookOpen,
};

const focalOptions = [
  { value: 'center', label: 'Center' },
  { value: 'top', label: 'Top' },
  { value: 'bottom', label: 'Bottom' },
  { value: 'left', label: 'Left' },
  { value: 'right', label: 'Right' },
];

const buttonStyles = [
  { value: 'solid', label: 'Solid' },
  { value: 'outline', label: 'Outline' },
  { value: 'ghost', label: 'Ghost' },
];

export default function SettingsAdmin() {
  const toast = useToast();
  const { refresh } = useSite();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState(() =>
    TABS.some((item) => item.id === searchParams.get('tab')) ? searchParams.get('tab') : 'general'
  );
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const requested = searchParams.get('tab');
    if (TABS.some((item) => item.id === requested)) setTab(requested);
  }, [searchParams]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/settings');
      const settings = data.settings;
      setForm({
        ...settings,
        heroLines: settings.heroLines || [],
        heroButtons: settings.heroButtons || [],
        serviceTimes: settings.serviceTimes || [],
        announcements: settings.announcements || [],
        copy: settings.copy || {},
      });
    } catch (err) {
      toast.error(getError(err));
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));
  const updateGroup = (group, field, value) =>
    setForm((prev) => ({ ...prev, [group]: { ...prev[group], [field]: value } }));
  const updateAt = (group, index, field, value) =>
    setForm((prev) => ({
      ...prev,
      [group]: prev[group].map((item, position) =>
        position === index ? { ...item, [field]: value } : item
      ),
    }));
  const addItem = (group, item) =>
    setForm((prev) => ({ ...prev, [group]: [...prev[group], item] }));
  const removeItem = (group, index) =>
    setForm((prev) => ({ ...prev, [group]: prev[group].filter((_, position) => position !== index) }));
  const updateCopy = (key, value) =>
    setForm((prev) => ({ ...prev, copy: { ...(prev.copy || {}), [key]: value } }));
  const updatePerson = (index, field, value) =>
    setForm((prev) => ({
      ...prev,
      contact: {
        ...(prev.contact || {}),
        people: (prev.contact?.people || []).map((person, position) =>
          position === index ? { ...person, [field]: value } : person
        ),
      },
    }));
  const addPerson = () =>
    setForm((prev) => ({
      ...prev,
      contact: {
        ...(prev.contact || {}),
        people: [...(prev.contact?.people || []), { name: '', role: '', email: '', phone: '' }],
      },
    }));
  const removePerson = (index) =>
    setForm((prev) => ({
      ...prev,
      contact: {
        ...(prev.contact || {}),
        people: (prev.contact?.people || []).filter((_person, position) => position !== index),
      },
    }));

  const save = async () => {
    setSaving(true);
    try {
      const { data } = await api.put('/admin/settings', form);
      setForm({
        ...data.settings,
        heroLines: data.settings.heroLines || [],
        heroButtons: data.settings.heroButtons || [],
        serviceTimes: data.settings.serviceTimes || [],
        announcements: data.settings.announcements || [],
        copy: data.settings.copy || {},
      });
      toast.success('Site settings saved.');
      refresh();
    } catch (err) {
      toast.error(getError(err));
    } finally {
      setSaving(false);
    }
  };

  const background = form?.background || {};
  const backgroundPreview = useMemo(() => {
    if (!form) return null;
    const focal = background.focal || 'center';
    const mediaStyle = {
      objectPosition: focal,
      filter: background.blur ? `blur(${background.blur}px)` : undefined,
      transform: background.blur ? 'scale(1.06)' : undefined,
    };
    return (
      <div className="relative aspect-[16/10] overflow-hidden rounded-3xl border border-line bg-[#05070c]">
        {background.url ? (
          background.type === 'video' ? (
            <video
              key={background.url}
              src={background.url}
              poster={background.poster || undefined}
              className="absolute inset-0 h-full w-full object-cover"
              style={mediaStyle}
              autoPlay
              muted
              loop
              playsInline
            />
          ) : (
            <img
              src={background.url}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
              style={mediaStyle}
            />
          )
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(61,49,110,0.8),transparent_60%),radial-gradient(ellipse_at_bottom_right,rgba(201,162,83,0.35),transparent_55%)]" />
        )}
        <div
          className="absolute inset-0 bg-[#05070c]"
          style={{ opacity: Math.min(90, Math.max(0, background.overlay ?? 52)) / 100 }}
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center text-white">
          <p className="text-[0.55rem] uppercase tracking-[0.3em] text-white/60">
            {form.heroKicker || 'Calvary Chapel Iloilo'}
          </p>
          <div className="mt-3 space-y-1">
            {(form.heroLines || []).slice(0, 3).map((line, index) => (
              <div key={index}>
                <p className="text-[0.5rem] uppercase tracking-[0.26em] text-[#e7c77e]/80">{line.label}</p>
                <p className="font-display text-lg font-semibold leading-tight text-white sm:text-xl">
                  {line.text}
                </p>
              </div>
            ))}
          </div>
          {form.heroSubtitle && (
            <p className="mt-3 line-clamp-2 max-w-sm text-[0.7rem] leading-relaxed text-white/70">
              {form.heroSubtitle}
            </p>
          )}
          <div className="mt-4 flex gap-2">
            {(form.heroButtons || []).slice(0, 2).map((button, index) => (
              <span
                key={index}
                className={cn(
                  'rounded-full px-3 py-1.5 text-[0.62rem] font-semibold',
                  button.style === 'outline'
                    ? 'border border-white/40 text-white'
                    : 'bg-accent text-[#1a1526]'
                )}
              >
                {button.label || 'Button'}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  }, [form, background]);

  if (loading || !form) return <InlineLoader label="Loading site settings…" />;

  return (
    <div className="space-y-6 pb-20">
      <PageHeader
        kicker="Content"
        title="Site settings"
        description="The church’s identity, hero, every piece of website text, contact details, and the default look."
        actions={
          <button type="button" className="btn btn-accent btn-sm" onClick={save} disabled={saving}>
            {saving ? <Spinner className="h-4 w-4 text-current" /> : <Save className="h-3.5 w-3.5" />}
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        }
      />

      <FilterChips
        value={tab}
        onChange={(next) => {
          setTab(next);
          setSearchParams(next === 'general' ? {} : { tab: next }, { replace: true });
        }}
        options={TABS}
      />

      {tab === 'general' && (
        <div className="grid gap-5 xl:grid-cols-[1.3fr_1fr]">
          <Panel>
            <PanelHeader title="Church identity" description="How the church is named across the website and footer." />
            <div className="space-y-5 p-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <TextField
                  label="Site name"
                  value={form.siteName || ''}
                  onChange={(event) => update('siteName', event.target.value)}
                  placeholder="Calvary Chapel Iloilo"
                />
                <TextField
                  label="Short name"
                  value={form.shortName || ''}
                  onChange={(event) => update('shortName', event.target.value)}
                  placeholder="CCI"
                />
              </div>
              <TextField
                label="Tagline"
                value={form.tagline || ''}
                onChange={(event) => update('tagline', event.target.value)}
                placeholder="A Bible-believing family in Iloilo City"
              />
              <TextAreaField
                label="Footer note"
                value={form.footerNote || ''}
                onChange={(event) => update('footerNote', event.target.value)}
                rows={3}
                placeholder="Grace and peace to you."
              />
              <div className="grid gap-5 sm:grid-cols-[1.4fr_1fr]">
                <TextAreaField
                  label="Featured verse"
                  value={form.verse?.text || ''}
                  onChange={(event) => updateGroup('verse', 'text', event.target.value)}
                  rows={3}
                  placeholder="“Your word is a lamp to my feet…”"
                />
                <TextField
                  label="Verse reference"
                  value={form.verse?.reference || ''}
                  onChange={(event) => updateGroup('verse', 'reference', event.target.value)}
                  placeholder="Psalm 119:105"
                />
              </div>
            </div>
          </Panel>

          <Panel>
            <PanelHeader
              title="Announcement bar"
              description="Up to three short messages above the navigation."
            />
            <div className="space-y-3 p-5">
              {(form.announcements || []).map((item, index) => (
                <div key={index} className="rounded-2xl border border-line bg-surface/50 p-3.5">
                  <div className="flex items-start gap-2">
                    <div className="flex-1 space-y-2">
                      <input
                        className="field py-2.5"
                        value={item.text || ''}
                        onChange={(event) => updateAt('announcements', index, 'text', event.target.value)}
                        placeholder="Sunday worship at 9:00 AM — everyone is welcome."
                      />
                      <input
                        className="field py-2.5"
                        value={item.href || ''}
                        onChange={(event) => updateAt('announcements', index, 'href', event.target.value)}
                        placeholder="Optional link, e.g. /activities"
                      />
                    </div>
                    <button
                      type="button"
                      className="icon-btn h-9 w-9 shrink-0 hover:border-red-500/40 hover:text-red-500"
                      onClick={() => removeItem('announcements', index)}
                      aria-label="Remove announcement"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <label className="mt-2 flex items-center gap-2 text-xs text-soft">
                    <input
                      type="checkbox"
                      className="h-3.5 w-3.5 accent-[rgb(var(--c-accent))]"
                      checked={item.active !== false}
                      onChange={(event) => updateAt('announcements', index, 'active', event.target.checked)}
                    />
                    Show this announcement
                  </label>
                </div>
              ))}
              {(form.announcements || []).length < 3 && (
                <button
                  type="button"
                  className="btn btn-outline btn-sm w-full"
                  onClick={() => addItem('announcements', { text: '', href: '', active: true })}
                >
                  <Plus className="h-4 w-4" /> Add announcement
                </button>
              )}
              <p className="text-[0.68rem] leading-relaxed text-faint">
                The bar is hidden when there are no active announcements.
              </p>
            </div>
          </Panel>
        </div>
      )}

      {tab === 'background' && (
        <div className="grid gap-5 xl:grid-cols-[1.25fr_1fr]">
          <div className="space-y-5">
            <Panel>
              <PanelHeader title="Hero message" description="The words at the center of the home page." />
              <div className="space-y-5 p-5">
                <TextField
                  label="Kicker"
                  value={form.heroKicker || ''}
                  onChange={(event) => update('heroKicker', event.target.value)}
                  placeholder="A Bible-believing fellowship · Iloilo City"
                />
                <TextAreaField
                  label="Subtitle"
                  value={form.heroSubtitle || ''}
                  onChange={(event) => update('heroSubtitle', event.target.value)}
                  rows={2}
                  placeholder="Come as you are. Leave changed by the Word of God."
                />
                <Field label="Hero lines" hint="Up to four lines. Each has a small label and a large phrase.">
                  <div className="space-y-2.5">
                    {(form.heroLines || []).map((line, index) => (
                      <div key={index} className="flex flex-col gap-2 sm:flex-row">
                        <input
                          className="field w-full py-2.5 sm:w-32"
                          value={line.label || ''}
                          onChange={(event) => updateAt('heroLines', index, 'label', event.target.value)}
                          placeholder="EVANGELISM"
                        />
                        <input
                          className="field flex-1 py-2.5"
                          value={line.text || ''}
                          onChange={(event) => updateAt('heroLines', index, 'text', event.target.value)}
                          placeholder="Showing the way"
                        />
                        <button
                          type="button"
                          className="icon-btn h-10 w-10 shrink-0 hover:border-red-500/40 hover:text-red-500"
                          onClick={() => removeItem('heroLines', index)}
                          aria-label="Remove hero line"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    {(form.heroLines || []).length < 4 && (
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={() => addItem('heroLines', { label: '', text: '' })}
                      >
                        <Plus className="h-4 w-4" /> Add line
                      </button>
                    )}
                  </div>
                </Field>
                <Field label="Hero buttons" hint="Up to three buttons shown beneath the hero lines.">
                  <div className="space-y-2.5">
                    {(form.heroButtons || []).map((button, index) => (
                      <div key={index} className="flex flex-col gap-2 sm:flex-row">
                        <input
                          className="field w-full py-2.5 sm:w-36"
                          value={button.label || ''}
                          onChange={(event) => updateAt('heroButtons', index, 'label', event.target.value)}
                          placeholder="Join our church"
                        />
                        <input
                          className="field flex-1 py-2.5"
                          value={button.href || ''}
                          onChange={(event) => updateAt('heroButtons', index, 'href', event.target.value)}
                          placeholder="/pages/about"
                        />
                        <select
                          className="field w-full py-2.5 sm:w-28"
                          value={button.style || 'solid'}
                          onChange={(event) => updateAt('heroButtons', index, 'style', event.target.value)}
                        >
                          {buttonStyles.map((style) => (
                            <option key={style.value} value={style.value}>
                              {style.label}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          className="icon-btn h-10 w-10 shrink-0 hover:border-red-500/40 hover:text-red-500"
                          onClick={() => removeItem('heroButtons', index)}
                          aria-label="Remove hero button"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    {(form.heroButtons || []).length < 3 && (
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={() => addItem('heroButtons', { label: '', href: '/', style: 'solid' })}
                      >
                        <Plus className="h-4 w-4" /> Add button
                      </button>
                    )}
                  </div>
                </Field>
              </div>
            </Panel>

            <Panel>
              <PanelHeader
                title="Background media"
                description="Use a photo or a looping video behind the hero. Upload it or choose from the library."
              />
              <div className="space-y-5 p-5">
                <Field label="Background type">
                  <div className="flex gap-2">
                    {[
                      { id: 'image', label: 'Image', icon: ImageIcon },
                      { id: 'video', label: 'Video', icon: Link2 },
                    ].map((option) => {
                      const Icon = option.icon;
                      const active = (background.type || 'image') === option.id;
                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => updateGroup('background', 'type', option.id)}
                          className={cn(
                            'flex flex-1 items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-xs font-semibold transition',
                            active
                              ? 'border-accent/50 bg-accent/10 text-accent'
                              : 'border-line text-soft hover:text-ink'
                          )}
                        >
                          <Icon className="h-4 w-4" /> {option.label}
                        </button>
                      );
                    })}
                  </div>
                </Field>
                <MediaField
                  label={background.type === 'video' ? 'Video file or URL' : 'Background image'}
                  hint="Landscape images look best. Videos should be short and muted."
                  value={background.url || ''}
                  onChange={(value) => updateGroup('background', 'url', value)}
                  type={background.type === 'video' ? 'video' : 'image'}
                />
                {background.type === 'video' && (
                  <MediaField
                    label="Video poster (optional)"
                    hint="Shown while the video loads, and on slow connections."
                    value={background.poster || ''}
                    onChange={(value) => updateGroup('background', 'poster', value)}
                    type="image"
                  />
                )}
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label={`Overlay darkness — ${background.overlay ?? 52}%`}>
                    <input
                      type="range"
                      min="0"
                      max="90"
                      value={background.overlay ?? 52}
                      onChange={(event) => updateGroup('background', 'overlay', Number(event.target.value))}
                      className="w-full accent-[rgb(var(--c-accent))]"
                    />
                  </Field>
                  <Field label={`Blur — ${background.blur ?? 0}px`}>
                    <input
                      type="range"
                      min="0"
                      max="12"
                      value={background.blur ?? 0}
                      onChange={(event) => updateGroup('background', 'blur', Number(event.target.value))}
                      className="w-full accent-[rgb(var(--c-accent))]"
                    />
                  </Field>
                </div>
                <SelectField
                  label="Focal point"
                  value={background.focal || 'center'}
                  onChange={(event) => updateGroup('background', 'focal', event.target.value)}
                  options={focalOptions}
                  hint="Which part of the media stays centered when cropping."
                />
              </div>
            </Panel>
          </div>

          <div className="space-y-4 xl:sticky xl:top-24 xl:self-start">
            <div className="rounded-3xl border border-line bg-elevated p-3">
              <p className="px-2 pb-2 pt-1 text-[0.58rem] font-semibold uppercase tracking-[0.22em] text-faint">
                Hero preview
              </p>
              {backgroundPreview}
            </div>
            <div className="flex items-start gap-3 rounded-2xl border border-accent/20 bg-accent/[0.05] px-4 py-3">
              <Palette className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
              <p className="text-[0.7rem] leading-relaxed text-soft">
                The preview reflects the saved media. Upload a video under 150 MB, or paste a direct
                CDN link. Changes go live after saving.
              </p>
            </div>
          </div>
        </div>
      )}

      {tab === 'copy' && (
        <div className="space-y-5">
          <div className="flex items-start gap-3 rounded-2xl border border-accent/20 bg-accent/[0.05] px-4 py-3">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
            <p className="text-[0.72rem] leading-relaxed text-soft">
              Every heading, paragraph, button, and image on the public website can be changed here.
              Leave a field empty to keep its built-in text. Save to publish the changes.
            </p>
          </div>
          {COPY_GROUPS.map((group) => (
            <Panel key={group.id}>
              <PanelHeader title={group.label} description={group.description} />
              <div className="grid gap-5 p-5 md:grid-cols-2">
                {group.fields.map((field) =>
                  field.media ? (
                    <MediaField
                      key={field.key}
                      className="md:col-span-2"
                      label={field.label}
                      hint={`Leave empty to use the built-in image (${field.default}).`}
                      value={form.copy?.[field.key] || ''}
                      onChange={(value) => updateCopy(field.key, value)}
                      type="image"
                    />
                  ) : field.multiline ? (
                    <TextAreaField
                      key={field.key}
                      className="md:col-span-2"
                      label={field.label}
                      rows={3}
                      hint={`Default: ${field.default}`}
                      value={form.copy?.[field.key] || ''}
                      onChange={(event) => updateCopy(field.key, event.target.value)}
                      placeholder={field.default}
                    />
                  ) : (
                    <TextField
                      key={field.key}
                      label={field.label}
                      hint={`Default: ${field.default}`}
                      value={form.copy?.[field.key] || ''}
                      onChange={(event) => updateCopy(field.key, event.target.value)}
                      placeholder={field.default}
                    />
                  )
                )}
              </div>
            </Panel>
          ))}
        </div>
      )}

      {tab === 'contact' && (
        <div className="grid gap-5 xl:grid-cols-2">
          <Panel>
            <PanelHeader title="Contact details" description="Shown on the contact page and in the footer." />
            <div className="space-y-5 p-5">
              <TextAreaField
                label="Address"
                value={form.contact?.address || ''}
                onChange={(event) => updateGroup('contact', 'address', event.target.value)}
                rows={2}
                placeholder="Iloilo City, Western Visayas, Philippines"
              />
              <div className="grid gap-5 sm:grid-cols-2">
                <TextField
                  label="Phone"
                  value={form.contact?.phone || ''}
                  onChange={(event) => updateGroup('contact', 'phone', event.target.value)}
                  placeholder="+63 900 000 0000"
                />
                <TextField
                  label="Email"
                  type="email"
                  value={form.contact?.email || ''}
                  onChange={(event) => updateGroup('contact', 'email', event.target.value)}
                  placeholder="hello@calvarychapeliloilo.org"
                />
              </div>
              <TextField
                label="Map link"
                value={form.contact?.mapUrl || ''}
                onChange={(event) => updateGroup('contact', 'mapUrl', event.target.value)}
                placeholder="https://maps.google.com/…"
                hint="Optional — used for the “Open in maps” link."
              />
              <TextAreaField
                label="Google Maps embed"
                value={form.contact?.mapEmbed || ''}
                onChange={(event) => updateGroup('contact', 'mapEmbed', event.target.value)}
                rows={3}
                placeholder={'<iframe src="https://www.google.com/maps/embed?pb=…"></iframe>'}
                hint="Optional — in Google Maps choose Share → Embed a map and paste the code or just the embed URL here. This replaces the automatic map on the contact page."
              />
              <div className="border-t border-line/70 pt-5">
                <p className="mb-4 text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-faint">
                  What to expect
                </p>
                <div className="space-y-4">
                  <TextField
                    label="Section heading"
                    value={form.contact?.expectTitle ?? 'What to expect'}
                    onChange={(event) => updateGroup('contact', 'expectTitle', event.target.value)}
                    placeholder="What to expect"
                  />
                  <TextAreaField
                    label="Bullet points"
                    value={(form.contact?.expectations || []).join('\n')}
                    onChange={(event) =>
                      updateGroup('contact', 'expectations', event.target.value.split('\n'))
                    }
                    rows={4}
                    placeholder={'A warm welcome — no dress code, no pressure.\nBible teaching that is practical and Christ-centered.'}
                    hint="One point per line, shown on the Contact page. Leave blank to use the default welcome message."
                  />
                </div>
              </div>
              <div className="border-t border-line/70 pt-5">
                <p className="mb-4 text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-faint">
                  Social links
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  {['facebook', 'instagram', 'youtube', 'tiktok'].map((network) => (
                    <TextField
                      key={network}
                      label={network.charAt(0).toUpperCase() + network.slice(1)}
                      value={form.socials?.[network] || ''}
                      onChange={(event) => updateGroup('socials', network, event.target.value)}
                      placeholder="https://…"
                    />
                  ))}
                </div>
              </div>
            </div>
          </Panel>

          <Panel>
            <PanelHeader
              title="Service times"
              description="Shown in the hero card, footer, and contact page."
              actions={
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => addItem('serviceTimes', { day: '', time: '', label: '' })}
                >
                  <Plus className="h-3.5 w-3.5" /> Add time
                </button>
              }
            />
            <div className="space-y-2.5 p-5">
              {(form.serviceTimes || []).map((slot, index) => (
                <div key={index} className="flex flex-col gap-2 rounded-2xl border border-line bg-surface/50 p-3 sm:flex-row">
                  <input
                    className="field py-2.5 sm:w-28"
                    value={slot.day || ''}
                    onChange={(event) => updateAt('serviceTimes', index, 'day', event.target.value)}
                    placeholder="Sunday"
                  />
                  <input
                    className="field py-2.5 sm:w-32"
                    value={slot.time || ''}
                    onChange={(event) => updateAt('serviceTimes', index, 'time', event.target.value)}
                    placeholder="9:00 AM"
                  />
                  <input
                    className="field flex-1 py-2.5"
                    value={slot.label || ''}
                    onChange={(event) => updateAt('serviceTimes', index, 'label', event.target.value)}
                    placeholder="Worship Service"
                  />
                  <button
                    type="button"
                    className="icon-btn h-10 w-10 shrink-0 hover:border-red-500/40 hover:text-red-500"
                    onClick={() => removeItem('serviceTimes', index)}
                    aria-label="Remove service time"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              {(form.serviceTimes || []).length === 0 && (
                <p className="py-6 text-center text-sm text-faint">
                  No service times yet. Add the first one so visitors know when to come.
                </p>
              )}
            </div>
          </Panel>

          <Panel className="xl:col-span-2">
            <PanelHeader
              title="Contact persons"
              description="Add the people visitors can reach directly. Each person appears as a contact card on the Contact page."
              actions={
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={addPerson}
                  disabled={(form.contact?.people || []).length >= 10}
                >
                  <Plus className="h-3.5 w-3.5" /> Add person
                </button>
              }
            />
            <div className="grid gap-4 p-5 md:grid-cols-2">
              {(form.contact?.people || []).map((person, index) => (
                <div key={index} className="rounded-2xl border border-line bg-surface/50 p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-faint">
                      Contact person {index + 1}
                    </p>
                    <button
                      type="button"
                      className="icon-btn h-8 w-8 hover:border-red-500/40 hover:text-red-500"
                      onClick={() => removePerson(index)}
                      aria-label={`Remove contact person ${index + 1}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <TextField
                      label="Name"
                      value={person.name || ''}
                      onChange={(event) => updatePerson(index, 'name', event.target.value)}
                      placeholder="Pastor Jeric Mark"
                    />
                    <TextField
                      label="Role"
                      value={person.role || ''}
                      onChange={(event) => updatePerson(index, 'role', event.target.value)}
                      placeholder="Lead pastor"
                    />
                    <TextField
                      label="Email"
                      type="email"
                      value={person.email || ''}
                      onChange={(event) => updatePerson(index, 'email', event.target.value)}
                      placeholder="name@church.org"
                    />
                    <TextField
                      label="Phone"
                      value={person.phone || ''}
                      onChange={(event) => updatePerson(index, 'phone', event.target.value)}
                      placeholder="+63 900 000 0000"
                    />
                  </div>
                </div>
              ))}
              {(form.contact?.people || []).length === 0 && (
                <div className="rounded-2xl border border-dashed border-line px-5 py-8 text-center md:col-span-2">
                  <p className="text-sm text-soft">
                    Only one general church contact is shown right now.
                  </p>
                  <p className="mt-1 text-xs text-faint">
                    Add a person to let visitors reach the right team member directly.
                  </p>
                </div>
              )}
            </div>
          </Panel>
        </div>
      )}

      {tab === 'appearance' && (
        <div className="grid gap-5 xl:grid-cols-[1.25fr_1fr]">
          <Panel>
            <PanelHeader
              title="Default theme"
              description="Applied to first-time visitors. Anyone can still change it with the theme switcher."
            />
            <div className="space-y-5 p-5">
              <Field label="Default mode">
                <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                  {THEME_MODES.map((mode) => {
                    const Icon = modeIcons[mode.id] || Sun;
                    const active = (form.theme?.defaultMode || 'system') === mode.id;
                    return (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => updateGroup('theme', 'defaultMode', mode.id)}
                        className={cn(
                          'flex items-start gap-3 rounded-2xl border p-3.5 text-left transition',
                          active
                            ? 'border-accent/50 bg-accent/[0.07]'
                            : 'border-line bg-surface/40 hover:border-accent/30'
                        )}
                      >
                        <span
                          className={cn(
                            'grid h-9 w-9 shrink-0 place-items-center rounded-xl',
                            active ? 'bg-accent/15 text-accent' : 'bg-ink/5 text-soft'
                          )}
                        >
                          <Icon className="h-4 w-4" />
                        </span>
                        <span>
                          <span className="block text-sm font-semibold text-ink">{mode.label}</span>
                          <span className="text-[0.68rem] text-faint">{mode.hint}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </Field>

              <Field label="Accent color">
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {THEME_ACCENTS.map((accent) => {
                    const active = (form.theme?.accent || 'gold') === accent.id;
                    return (
                      <button
                        key={accent.id}
                        type="button"
                        onClick={() => updateGroup('theme', 'accent', accent.id)}
                        className={cn(
                          'flex items-center gap-3 rounded-2xl border p-3.5 text-left transition',
                          active
                            ? 'border-accent/50 bg-accent/[0.07]'
                            : 'border-line bg-surface/40 hover:border-accent/30'
                        )}
                      >
                        <span
                          className="h-8 w-8 shrink-0 rounded-full ring-2 ring-white/50 ring-offset-2 ring-offset-transparent"
                          style={{ backgroundColor: accent.hex }}
                        />
                        <span>
                          <span className="block text-sm font-semibold text-ink">{accent.label}</span>
                          <span className="text-[0.68rem] text-faint">{accent.id}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </Field>
            </div>
          </Panel>

          <Panel>
            <PanelHeader title="How theming works" />
            <div className="space-y-4 p-5 text-sm leading-relaxed text-soft">
              <p>
                The website ships with five modes — light, dark, midnight (pure black), sepia paper,
                and a system mode that follows the visitor’s device.
              </p>
              <p>
                Four accents — Grace Gold, Living Water, Olive Branch, and Sunrise Rose — work across
                every mode.
              </p>
              <p className="rounded-2xl border border-line bg-surface/50 px-4 py-3 text-xs text-faint">
                A visitor’s own choice is remembered in their browser and always wins over the default.
                Use the moon button in the top bar to cycle modes while you work.
              </p>
            </div>
          </Panel>
        </div>
      )}

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface/90 px-4 py-3 backdrop-blur-xl lg:left-[17.5rem]">
        <div className="flex items-center justify-between gap-3 px-1 sm:px-2 lg:px-6">
          <p className="hidden text-[0.7rem] text-faint sm:block">
            Changes apply to the public website after saving.
          </p>
          <button type="button" className="btn btn-accent btn-sm ml-auto" onClick={save} disabled={saving}>
            {saving ? <Spinner className="h-4 w-4 text-current" /> : <Save className="h-3.5 w-3.5" />}
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
