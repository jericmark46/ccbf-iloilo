import { useCallback, useEffect, useState } from 'react';
import { CalendarDays, Pencil, Plus, Trash2 } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { api, getError } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { useDebounced } from '../../hooks/useUi';
import { PageHeader, Panel, Toolbar, SearchInput } from '../../components/admin/AdminUI';
import { Field, RichTextField, MediaField, TextField } from '../../components/admin/fields';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { InlineLoader, Spinner } from '../../components/ui/Loaders';
import { dateParts, formatDateTime, isUpcoming, toDateTimeInput } from '../../lib/dates';

const defaultStart = () => {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  date.setHours(18, 0, 0, 0);
  return toDateTimeInput(date);
};

const emptyActivity = () => ({
  title: '',
  description: '',
  image: '',
  category: 'Gathering',
  location: '',
  startAt: defaultStart(),
  endAt: '',
  published: true,
});

export default function ActivitiesAdmin() {
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const search = useDebounced(query, 250);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyActivity);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [removing, setRemoving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/activities');
      setItems(data.activities || []);
    } catch (err) {
      toast.error(getError(err));
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = useCallback(() => {
    setEditing(null);
    setForm(emptyActivity());
    setFormOpen(true);
  }, []);

  useEffect(() => {
    if (searchParams.get('compose') === '1') {
      openCreate();
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams, openCreate]);

  const openEdit = (activity) => {
    setEditing(activity);
    setForm({
      title: activity.title || '',
      description: activity.description || '',
      image: activity.image || '',
      category: activity.category || 'Gathering',
      location: activity.location || '',
      startAt: toDateTimeInput(activity.startAt),
      endAt: toDateTimeInput(activity.endAt),
      published: Boolean(activity.published),
    });
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditing(null);
    setForm(emptyActivity());
  };

  const save = async (event) => {
    event.preventDefault();
    if (form.title.trim().length < 2) {
      toast.error('Please enter the activity title.');
      return;
    }
    if (!form.startAt) {
      toast.error('Please choose a start date and time.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        startAt: new Date(form.startAt).toISOString(),
        endAt: form.endAt ? new Date(form.endAt).toISOString() : undefined,
      };
      if (editing) {
        await api.put(`/admin/activities/${editing.id}`, payload);
        toast.success('Activity saved.');
      } else {
        await api.post('/admin/activities', payload);
        toast.success('Activity added to the calendar.');
      }
      closeForm();
      load();
    } catch (err) {
      toast.error(getError(err));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setRemoving(true);
    try {
      await api.delete(`/admin/activities/${deleting.id}`);
      toast.success('Activity deleted.');
      setDeleting(null);
      load();
    } catch (err) {
      toast.error(getError(err));
    } finally {
      setRemoving(false);
    }
  };

  const visible = search
    ? items.filter((item) =>
        `${item.title} ${item.category} ${item.location}`.toLowerCase().includes(search.toLowerCase())
      )
    : items;

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Community"
        title="Activities"
        description="Services, Bible studies, youth nights, and outreach — everything on the church calendar."
        actions={
          <button type="button" className="btn btn-accent btn-sm" onClick={openCreate}>
            <Plus className="h-3.5 w-3.5" /> New activity
          </button>
        }
      />

      <Panel>
        <div className="border-b border-line/70 px-4 py-4 sm:px-5">
          <Toolbar>
            <SearchInput value={query} onChange={setQuery} placeholder="Search activities…" />
            <span className="text-[0.7rem] text-faint">{visible.length} activities</span>
          </Toolbar>
        </div>

        {loading ? (
          <InlineLoader label="Loading activities…" />
        ) : visible.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title={items.length ? 'No activities match your search' : 'No activities yet'}
            description={items.length ? 'Try a different search term.' : 'Add the next gathering so the church can plan ahead.'}
            action={
              !items.length && (
                <button type="button" className="btn btn-accent btn-sm" onClick={openCreate}>
                  <Plus className="h-3.5 w-3.5" /> Add an activity
                </button>
              )
            }
            className="m-5"
          />
        ) : (
          <div className="divide-y divide-line/70">
            {visible.map((activity) => {
              const parts = dateParts(activity.startAt);
              const upcoming = isUpcoming(activity.startAt);
              return (
                <div key={activity.id} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:px-5">
                  <div className="flex min-w-0 flex-1 items-center gap-3.5">
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-accent/10 text-center text-accent">
                      <span className="font-display text-base font-semibold leading-none">{parts.day}</span>
                      <span className="mt-0.5 text-[0.55rem] font-semibold uppercase tracking-[0.12em]">
                        {parts.month}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-ink">{activity.title}</p>
                      <p className="mt-0.5 truncate text-[0.7rem] text-faint">
                        {formatDateTime(activity.startAt)}
                        {activity.location ? ` · ${activity.location}` : ''}
                      </p>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        <Badge variant={upcoming ? 'accent' : 'default'}>
                          {upcoming ? 'Upcoming' : 'Past'}
                        </Badge>
                        <Badge variant={activity.published ? 'success' : 'warning'}>
                          {activity.published ? 'Live' : 'Draft'}
                        </Badge>
                        <Badge>{activity.category || 'Gathering'}</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5 self-end sm:self-auto">
                    <button type="button" className="icon-btn h-9 w-9" onClick={() => openEdit(activity)} aria-label="Edit activity">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      className="icon-btn h-9 w-9 hover:border-red-500/40 hover:text-red-500"
                      onClick={() => setDeleting(activity)}
                      aria-label="Delete activity"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Panel>

      <Modal
        open={formOpen}
        onClose={closeForm}
        title={editing ? 'Edit activity' : 'New activity'}
        size="lg"
        footer={
          <>
            <button type="button" className="btn btn-ghost btn-sm" onClick={closeForm} disabled={saving}>
              Cancel
            </button>
            <button type="submit" form="activity-form" className="btn btn-accent btn-sm" disabled={saving}>
              {saving && <Spinner className="h-4 w-4 text-current" />}
              {editing ? 'Save activity' : 'Add activity'}
            </button>
          </>
        }
      >
        <form id="activity-form" onSubmit={save} className="space-y-5">
          <TextField
            label="Title"
            required
            value={form.title}
            onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
            placeholder="Youth Night: Anchored"
          />
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField
              label="Category"
              value={form.category}
              onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
              placeholder="Gathering"
            />
            <TextField
              label="Location"
              value={form.location}
              onChange={(event) => setForm((prev) => ({ ...prev, location: event.target.value }))}
              placeholder="Church sanctuary"
            />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField
              label="Starts at"
              type="datetime-local"
              required
              value={form.startAt}
              onChange={(event) => setForm((prev) => ({ ...prev, startAt: event.target.value }))}
            />
            <TextField
              label="Ends at"
              type="datetime-local"
              value={form.endAt}
              onChange={(event) => setForm((prev) => ({ ...prev, endAt: event.target.value }))}
              hint="Optional."
            />
          </div>
          <MediaField
            label="Cover image"
            value={form.image}
            onChange={(value) => setForm((prev) => ({ ...prev, image: value }))}
            type="image"
          />
          <RichTextField
            label="Description"
            value={form.description}
            onChange={(value) => setForm((prev) => ({ ...prev, description: value }))}
            rows={8}
          />
          <Field>
            <label className="flex items-center gap-3 rounded-2xl border border-line bg-surface/60 px-4 py-3">
              <input
                type="checkbox"
                className="h-4 w-4 accent-[rgb(var(--c-accent))]"
                checked={form.published}
                onChange={(event) => setForm((prev) => ({ ...prev, published: event.target.checked }))}
              />
              <span>
                <span className="block text-sm font-medium text-ink">Published</span>
                <span className="text-xs text-soft">Show this activity on the website calendar.</span>
              </span>
            </label>
          </Field>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        loading={removing}
        title="Delete this activity?"
        description={`“${deleting?.title || 'This activity'}” will be removed from the calendar.`}
      />
    </div>
  );
}
