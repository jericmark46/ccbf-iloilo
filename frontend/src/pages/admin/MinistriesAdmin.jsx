import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, HeartHandshake, Pencil, Plus, Trash2 } from 'lucide-react';
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

const emptyMinistry = {
  name: '',
  slug: '',
  tagline: '',
  description: '',
  image: '',
  leader: '',
  schedule: '',
  order: 0,
  published: true,
};

export default function MinistriesAdmin() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const search = useDebounced(query, 250);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyMinistry);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [removing, setRemoving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/ministries');
      setItems(data.ministries || []);
    } catch (err) {
      toast.error(getError(err));
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyMinistry);
    setFormOpen(true);
  };

  const openEdit = (ministry) => {
    setEditing(ministry);
    setForm({
      name: ministry.name || '',
      slug: ministry.slug || '',
      tagline: ministry.tagline || '',
      description: ministry.description || '',
      image: ministry.image || '',
      leader: ministry.leader || '',
      schedule: ministry.schedule || '',
      order: ministry.order ?? 0,
      published: Boolean(ministry.published),
    });
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditing(null);
    setForm(emptyMinistry);
  };

  const save = async (event) => {
    event.preventDefault();
    if (form.name.trim().length < 2) {
      toast.error('Please enter the ministry name.');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/admin/ministries/${editing.id}`, form);
        toast.success('Ministry saved.');
      } else {
        await api.post('/admin/ministries', form);
        toast.success('Ministry created.');
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
      await api.delete(`/admin/ministries/${deleting.id}`);
      toast.success('Ministry deleted.');
      setDeleting(null);
      load();
    } catch (err) {
      toast.error(getError(err));
    } finally {
      setRemoving(false);
    }
  };

  const visible = search
    ? items.filter((item) => `${item.name} ${item.tagline} ${item.leader}`.toLowerCase().includes(search.toLowerCase()))
    : items;

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Community"
        title="Ministries"
        description="The places where the church serves and grows together — worship, children, youth, outreach, and more."
        actions={
          <button type="button" className="btn btn-accent btn-sm" onClick={openCreate}>
            <Plus className="h-3.5 w-3.5" /> New ministry
          </button>
        }
      />

      <Panel>
        <div className="border-b border-line/70 px-4 py-4 sm:px-5">
          <Toolbar>
            <SearchInput value={query} onChange={setQuery} placeholder="Search ministries…" />
            <span className="text-[0.7rem] text-faint">{visible.length} ministries</span>
          </Toolbar>
        </div>

        {loading ? (
          <InlineLoader label="Loading ministries…" />
        ) : visible.length === 0 ? (
          <EmptyState
            icon={HeartHandshake}
            title={items.length ? 'No ministries match your search' : 'No ministries yet'}
            description={items.length ? 'Try a different search term.' : 'Add the first ministry so the church can discover it.'}
            action={
              !items.length && (
                <button type="button" className="btn btn-accent btn-sm" onClick={openCreate}>
                  <Plus className="h-3.5 w-3.5" /> Add a ministry
                </button>
              )
            }
            className="m-5"
          />
        ) : (
          <div className="divide-y divide-line/70">
            {visible.map((ministry) => (
              <div key={ministry.id} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:px-5">
                <div className="flex min-w-0 flex-1 items-center gap-3.5">
                  <div className="h-14 w-20 shrink-0 overflow-hidden rounded-xl border border-line bg-surface">
                    {ministry.image ? (
                      <img src={ministry.image} alt="" className="h-full w-full object-cover" loading="lazy" />
                    ) : (
                      <span className="grid h-full w-full place-items-center bg-accent/10 text-accent">
                        <HeartHandshake className="h-4 w-4" />
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">{ministry.name}</p>
                    <p className="truncate text-[0.7rem] text-faint">
                      {ministry.tagline || 'No tagline'} · {ministry.schedule || 'Schedule TBD'}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <Badge variant={ministry.published ? 'success' : 'warning'}>
                        {ministry.published ? 'Live' : 'Draft'}
                      </Badge>
                      <Badge>Order {ministry.order ?? 0}</Badge>
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1.5 self-end sm:self-auto">
                  <Link
                    to={`/ministries/${ministry.slug}`}
                    target="_blank"
                    className="icon-btn h-9 w-9"
                    aria-label="View ministry"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                  <button type="button" className="icon-btn h-9 w-9" onClick={() => openEdit(ministry)} aria-label="Edit ministry">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    className="icon-btn h-9 w-9 hover:border-red-500/40 hover:text-red-500"
                    onClick={() => setDeleting(ministry)}
                    aria-label="Delete ministry"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <Modal
        open={formOpen}
        onClose={closeForm}
        title={editing ? 'Edit ministry' : 'New ministry'}
        size="xl"
        footer={
          <>
            <button type="button" className="btn btn-ghost btn-sm" onClick={closeForm} disabled={saving}>
              Cancel
            </button>
            <button type="submit" form="ministry-form" className="btn btn-accent btn-sm" disabled={saving}>
              {saving && <Spinner className="h-4 w-4 text-current" />}
              {editing ? 'Save ministry' : 'Create ministry'}
            </button>
          </>
        }
      >
        <form id="ministry-form" onSubmit={save} className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField
              label="Name"
              required
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="Worship & Music"
            />
            <TextField
              label="Slug"
              value={form.slug}
              onChange={(event) => setForm((prev) => ({ ...prev, slug: event.target.value }))}
              placeholder="worship-music"
              hint="Leave empty to generate from the name."
            />
          </div>
          <TextField
            label="Tagline"
            value={form.tagline}
            onChange={(event) => setForm((prev) => ({ ...prev, tagline: event.target.value }))}
            placeholder="Songs that lift our eyes to Jesus."
          />
          <div className="grid gap-5 sm:grid-cols-3">
            <TextField
              label="Leader"
              value={form.leader}
              onChange={(event) => setForm((prev) => ({ ...prev, leader: event.target.value }))}
              placeholder="Kuya Mark"
            />
            <TextField
              label="Meeting schedule"
              value={form.schedule}
              onChange={(event) => setForm((prev) => ({ ...prev, schedule: event.target.value }))}
              placeholder="Saturdays · 4:00 PM"
            />
            <TextField
              label="Display order"
              type="number"
              value={form.order}
              onChange={(event) => setForm((prev) => ({ ...prev, order: Number(event.target.value) }))}
              hint="Lower numbers appear first."
            />
          </div>
          <MediaField
            label="Ministry image"
            value={form.image}
            onChange={(value) => setForm((prev) => ({ ...prev, image: value }))}
            type="image"
          />
          <RichTextField
            label="Description"
            value={form.description}
            onChange={(value) => setForm((prev) => ({ ...prev, description: value }))}
            rows={12}
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
                <span className="text-xs text-soft">Show this ministry on the website.</span>
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
        title="Delete this ministry?"
        description={`“${deleting?.name || 'This ministry'}” will be removed from the website.`}
      />
    </div>
  );
}
