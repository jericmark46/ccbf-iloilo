import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, FileText, Pencil, Plus, Trash2 } from 'lucide-react';
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
import { formatDate } from '../../lib/dates';

const emptyPage = {
  title: '',
  slug: '',
  subtitle: '',
  heroImage: '',
  content: '',
  published: true,
};

export default function PagesAdmin() {
  const toast = useToast();
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const search = useDebounced(query, 250);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyPage);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [removing, setRemoving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/pages');
      setPages(data.pages || []);
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
    setForm(emptyPage);
    setFormOpen(true);
  };

  const openEdit = (page) => {
    setEditing(page);
    setForm({
      title: page.title || '',
      slug: page.slug || '',
      subtitle: page.subtitle || '',
      heroImage: page.heroImage || '',
      content: page.content || '',
      published: Boolean(page.published),
    });
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditing(null);
    setForm(emptyPage);
  };

  const save = async (event) => {
    event.preventDefault();
    if (form.title.trim().length < 2) {
      toast.error('Please enter a page title.');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/admin/pages/${editing.id}`, form);
        toast.success('Page saved.');
      } else {
        await api.post('/admin/pages', form);
        toast.success('Page created.');
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
      await api.delete(`/admin/pages/${deleting.id}`);
      toast.success('Page deleted.');
      setDeleting(null);
      load();
    } catch (err) {
      toast.error(getError(err));
    } finally {
      setRemoving(false);
    }
  };

  const visible = search
    ? pages.filter((page) =>
        `${page.title} ${page.slug}`.toLowerCase().includes(search.toLowerCase())
      )
    : pages;

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Content"
        title="Pages"
        description="Long-form pages such as About and Donate. Each page can be linked from the navigation builder."
        actions={
          <button type="button" className="btn btn-accent btn-sm" onClick={openCreate}>
            <Plus className="h-3.5 w-3.5" /> New page
          </button>
        }
      />

      <Panel>
        <div className="border-b border-line/70 px-4 py-4 sm:px-5">
          <Toolbar>
            <SearchInput value={query} onChange={setQuery} placeholder="Search pages…" />
            <span className="text-[0.7rem] text-faint">{visible.length} pages</span>
          </Toolbar>
        </div>

        {loading ? (
          <InlineLoader label="Loading pages…" />
        ) : visible.length === 0 ? (
          <EmptyState
            icon={FileText}
            title={pages.length ? 'No pages match your search' : 'No pages yet'}
            description={pages.length ? 'Try a different search term.' : 'Create your first page, like “About” or “Give”.'}
            action={
              !pages.length && (
                <button type="button" className="btn btn-accent btn-sm" onClick={openCreate}>
                  <Plus className="h-3.5 w-3.5" /> Create a page
                </button>
              )
            }
            className="m-5"
          />
        ) : (
          <div className="divide-y divide-line/70">
            {visible.map((page) => (
              <div key={page.id} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:px-5">
                <div className="flex min-w-0 flex-1 items-center gap-3.5">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-accent/10 text-accent">
                    <FileText className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">{page.title}</p>
                    <p className="mt-0.5 truncate text-[0.7rem] text-faint">
                      /pages/{page.slug} · updated {formatDate(page.updatedAt || page.createdAt)}
                    </p>
                    <div className="mt-1.5">
                      <Badge variant={page.published ? 'success' : 'warning'}>
                        {page.published ? 'Live' : 'Draft'}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1.5 self-end sm:self-auto">
                  <Link to={`/pages/${page.slug}`} target="_blank" className="icon-btn h-9 w-9" aria-label="View page">
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                  <button type="button" className="icon-btn h-9 w-9" onClick={() => openEdit(page)} aria-label="Edit page">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    className="icon-btn h-9 w-9 hover:border-red-500/40 hover:text-red-500"
                    onClick={() => setDeleting(page)}
                    aria-label="Delete page"
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
        title={editing ? 'Edit page' : 'New page'}
        description="Format the content directly. The slug becomes the page address."
        size="xl"
        footer={
          <>
            <button type="button" className="btn btn-ghost btn-sm" onClick={closeForm} disabled={saving}>
              Cancel
            </button>
            <button type="submit" form="page-form" className="btn btn-accent btn-sm" disabled={saving}>
              {saving && <Spinner className="h-4 w-4 text-current" />}
              {editing ? 'Save page' : 'Create page'}
            </button>
          </>
        }
      >
        <form id="page-form" onSubmit={save} className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField
              label="Title"
              required
              value={form.title}
              onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
              placeholder="About our church"
            />
            <TextField
              label="Slug"
              value={form.slug}
              onChange={(event) => setForm((prev) => ({ ...prev, slug: event.target.value }))}
              placeholder="about"
              hint="Leave empty to generate from the title."
            />
          </div>
          <TextField
            label="Subtitle"
            value={form.subtitle}
            onChange={(event) => setForm((prev) => ({ ...prev, subtitle: event.target.value }))}
            placeholder="A short line shown beneath the title."
          />
          <MediaField
            label="Hero image"
            value={form.heroImage}
            onChange={(value) => setForm((prev) => ({ ...prev, heroImage: value }))}
            type="image"
          />
          <RichTextField
            label="Content"
            value={form.content}
            onChange={(value) => setForm((prev) => ({ ...prev, content: value }))}
            rows={16}
          />
          <Field label="Visibility">
            <label className="flex items-center gap-3 rounded-2xl border border-line bg-surface/60 px-4 py-3">
              <input
                type="checkbox"
                className="h-4 w-4 accent-[rgb(var(--c-accent))]"
                checked={form.published}
                onChange={(event) => setForm((prev) => ({ ...prev, published: event.target.checked }))}
              />
              <span>
                <span className="block text-sm font-medium text-ink">Published</span>
                <span className="text-xs text-soft">Unpublished pages return a “not found” message.</span>
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
        title="Delete this page?"
        description={`“${deleting?.title || 'Untitled page'}” will be permanently removed. Navigation links pointing to it will stop working.`}
      />
    </div>
  );
}
