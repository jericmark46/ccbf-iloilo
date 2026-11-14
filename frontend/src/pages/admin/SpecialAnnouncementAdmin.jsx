import { useCallback, useEffect, useState } from 'react';
import { Megaphone, Save } from 'lucide-react';
import { api, getError } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { PageHeader, Panel, PanelHeader, AdminNotice, Switch } from '../../components/admin/AdminUI';
import { MediaField, TextAreaField, TextField } from '../../components/admin/fields';
import { Badge } from '../../components/ui/Badge';
import { InlineLoader, Spinner } from '../../components/ui/Loaders';
import { relativeTime } from '../../lib/dates';

const emptyAnnouncement = {
  enabled: false,
  title: '',
  message: '',
  image: '',
  version: 0,
  updatedAt: null,
};

export default function SpecialAnnouncementAdmin() {
  const toast = useToast();
  const [form, setForm] = useState(emptyAnnouncement);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/announcement');
      setForm({ ...emptyAnnouncement, ...(data.announcement || {}) });
    } catch (err) {
      toast.error(getError(err));
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const save = async (event) => {
    event.preventDefault();
    if (form.enabled && form.title.trim().length < 2) {
      toast.error('Please enter a title for the announcement.');
      return;
    }
    if (form.enabled && form.message.trim().length < 3) {
      toast.error('Please write the announcement message.');
      return;
    }
    setSaving(true);
    try {
      const { data } = await api.put('/admin/announcement', {
        enabled: form.enabled,
        title: form.title,
        message: form.message,
        image: form.image,
      });
      setForm({ ...emptyAnnouncement, ...(data.announcement || {}) });
      toast.success(form.enabled ? 'Special announcement published.' : 'Special announcement saved.');
    } catch (err) {
      toast.error(getError(err));
    } finally {
      setSaving(false);
    }
  };

  const previewReady = form.title.trim() || form.message.trim();

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Administration"
        title="Special announcement"
        description="A one-time modal for visitors. Turn it on, write the message, and everyone landing on the website sees it once per browser session."
        actions={
          <button type="submit" form="special-announcement-form" className="btn btn-accent btn-sm" disabled={saving || loading}>
            {saving ? <Spinner className="h-4 w-4 text-current" /> : <Save className="h-4 w-4" />}
            {saving ? 'Saving…' : 'Save announcement'}
          </button>
        }
      />

      {loading ? (
        <Panel>
          <InlineLoader label="Loading the announcement…" />
        </Panel>
      ) : (
        <div className="grid gap-5 xl:grid-cols-[1.25fr_1fr]">
          <Panel>
            <PanelHeader
              title="Announcement"
              description="Only superadmins can set this. Visitors must tap Okay to continue."
              actions={
                <Badge variant={form.enabled ? 'success' : 'default'}>
                  {form.enabled ? 'Live to visitors' : 'Hidden'}
                </Badge>
              }
            />
            <form id="special-announcement-form" onSubmit={save} className="space-y-5 p-5 sm:p-6">
              <Switch
                label="Show this announcement"
                description="When off, visitors never see the modal, even if the text below is filled in."
                checked={form.enabled}
                onChange={(value) => setForm((prev) => ({ ...prev, enabled: value }))}
              />

              <TextField
                label="Title"
                required={form.enabled}
                maxLength={120}
                value={form.title}
                onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                placeholder="Youth camp registration is open"
              />

              <TextAreaField
                label="Message"
                required={form.enabled}
                rows={6}
                maxLength={1200}
                value={form.message}
                onChange={(event) => setForm((prev) => ({ ...prev, message: event.target.value }))}
                placeholder="Join us for a week of worship, teaching, and fellowship…"
                hint={`${form.message.length}/1200 characters`}
              />

              <MediaField
                label="Optional image"
                hint="Fits neatly inside the modal. Wide or tall images are scaled, never stretched."
                value={form.image}
                onChange={(value) => setForm((prev) => ({ ...prev, image: value }))}
                type="image"
              />

              {form.updatedAt && (
                <p className="text-[0.7rem] text-faint">
                  Last updated {relativeTime(form.updatedAt)} · version {form.version}
                </p>
              )}
            </form>
          </Panel>

          <Panel className="self-start">
            <PanelHeader
              title="Visitor preview"
              description="Approximate — the modal appears centered on the website."
            />
            <div className="p-5 sm:p-6">
              {previewReady ? (
                <div className="overflow-hidden rounded-3xl border border-line bg-surface shadow-lift">
                  {form.image && (
                    <img
                      src={form.image}
                      alt=""
                      className="max-h-56 w-full bg-ink/5 object-contain"
                    />
                  )}
                  <div className="space-y-3 p-5">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-2.5 py-1 text-[0.58rem] font-semibold uppercase tracking-[0.16em] text-accent">
                      <Megaphone className="h-3 w-3" /> Announcement
                    </span>
                    <h3 className="font-display text-xl font-semibold leading-tight text-ink">
                      {form.title.trim() || 'Your title'}
                    </h3>
                    <p className="whitespace-pre-line text-sm leading-relaxed text-soft">
                      {form.message.trim() || 'Your message will appear here.'}
                    </p>
                    <button type="button" className="btn btn-accent btn-sm" disabled>
                      Okay
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid place-items-center rounded-3xl border border-dashed border-line py-14 text-center">
                  <Megaphone className="h-7 w-7 text-faint" />
                  <p className="mt-2 text-sm text-soft">Write a title or message to see the preview.</p>
                </div>
              )}
            </div>
          </Panel>
        </div>
      )}

      <AdminNotice>
        Visitors see the announcement once per browser session and must tap <strong>Okay</strong> to
        continue. Editing the title, message, or image creates a new version, so visitors who have
        already dismissed an older announcement will see the change once.
      </AdminNotice>
    </div>
  );
}
