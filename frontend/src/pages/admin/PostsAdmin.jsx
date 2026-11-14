import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ExternalLink, Image as ImageIcon, Newspaper, Pencil, Pin, Plus, Trash2 } from 'lucide-react';
import { api, getError } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { useDebounced } from '../../hooks/useUi';
import { PageHeader, Panel, Toolbar, SearchInput, FilterChips } from '../../components/admin/AdminUI';
import { Field, MediaField, MediaListField, RichTextField, SelectField, TextField } from '../../components/admin/fields';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { InlineLoader, Spinner } from '../../components/ui/Loaders';
import { formatDate } from '../../lib/dates';
import { cn } from '../../lib/utils';

const emptyPost = {
  title: '',
  content: '',
  category: '',
  coverImage: '',
  media: [],
  pinned: false,
  inNewsFeed: false,
  published: true,
};

export default function PostsAdmin() {
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [status, setStatus] = useState('all');
  const debouncedQuery = useDebounced(query, 350);

  const [editing, setEditing] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(emptyPost);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [removing, setRemoving] = useState(false);
  const [categories, setCategories] = useState([]);

  // Categories live in Navigation → Update categories, so they are fetched
  // rather than hardcoded here.
  const loadCategories = useCallback(async () => {
    try {
      const { data } = await api.get('/admin/categories');
      setCategories(data.categories || []);
    } catch (err) {
      toast.error(getError(err));
    }
  }, [toast]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const visibleCategories = useMemo(
    () => categories.filter((item) => item.visible),
    [categories]
  );
  const defaultCategory = visibleCategories[0]?.name || 'Announcement';

  // A post may sit in a category that was later hidden; keep it selectable so
  // editing the post never silently moves it somewhere else.
  const pickerOptions = useMemo(() => {
    const names = visibleCategories.map((item) => item.name);
    if (form.category && !names.includes(form.category)) names.unshift(form.category);
    return names;
  }, [visibleCategories, form.category]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 8 };
      if (debouncedQuery.trim()) params.q = debouncedQuery.trim();
      if (category !== 'All') params.category = category;
      if (status !== 'all') params.status = status;
      const { data } = await api.get('/admin/posts', { params });
      setItems(data.items || []);
      setPages(data.pages || 1);
      setTotal(data.total || 0);
    } catch (err) {
      toast.error(getError(err));
    } finally {
      setLoading(false);
    }
  }, [page, debouncedQuery, category, status, toast]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [debouncedQuery, category, status]);

  const openCreate = useCallback(() => {
    setEditing(null);
    setForm({ ...emptyPost, category: defaultCategory });
    setFormOpen(true);
  }, [defaultCategory]);

  useEffect(() => {
    if (searchParams.get('compose') === '1') {
      openCreate();
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams, openCreate]);

  const openEdit = (post) => {
    setEditing(post);
    setForm({
      title: post.title || '',
      content: post.content || '',
      category: post.category || defaultCategory,
      coverImage: post.coverImage || '',
      media: post.media || [],
      pinned: Boolean(post.pinned),
      inNewsFeed: Boolean(post.inNewsFeed),
      published: Boolean(post.published),
    });
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditing(null);
    setForm(emptyPost);
  };

  const save = async (event) => {
    event.preventDefault();
    if (!form.title.trim()) {
      toast.error('Please give this update a title.');
      return;
    }
    if (form.content.trim().length < 3) {
      toast.error('Please write the update before saving.');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/admin/posts/${editing.id}`, form);
        toast.success('Update saved.');
      } else {
        await api.post('/admin/posts', form);
        toast.success('Update published to the website.');
      }
      closeForm();
      load();
      loadCategories();
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
      await api.delete(`/admin/posts/${deleting.id}`);
      toast.success('Update deleted.');
      setDeleting(null);
      if (items.length === 1 && page > 1) setPage((prev) => prev - 1);
      else load();
    } catch (err) {
      toast.error(getError(err));
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Content"
        title="Updates"
        description="Share announcements, sermons, testimonies, and moments from the life of the church."
        actions={
          <button type="button" className="btn btn-accent btn-sm" onClick={openCreate}>
            <Plus className="h-3.5 w-3.5" /> New update
          </button>
        }
      />

      <Panel>
        <div className="border-b border-line/70 px-4 py-4 sm:px-5">
          <Toolbar>
            <SearchInput value={query} onChange={setQuery} placeholder="Search updates…" />
            <FilterChips
              value={status}
              onChange={setStatus}
              options={[
                { id: 'all', label: 'All' },
                { id: 'published', label: 'Live' },
                { id: 'draft', label: 'Drafts' },
              ]}
            />
            <select
              className="field w-auto py-2.5"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            >
              <option value="All">All categories</option>
              {categories.map((item) => (
                <option key={item.id} value={item.name}>
                  {item.visible ? item.name : `${item.name} (hidden)`}
                </option>
              ))}
            </select>
          </Toolbar>
        </div>

        {loading ? (
          <InlineLoader label="Loading updates…" />
        ) : items.length === 0 ? (
          <EmptyState
            icon={Pin}
            title="No updates found"
            description={query || category !== 'All' || status !== 'all' ? 'Try adjusting your filters, or write something new.' : 'Share the first update with the church family.'}
            action={
              <button type="button" className="btn btn-accent btn-sm" onClick={openCreate}>
                <Plus className="h-3.5 w-3.5" /> Write an update
              </button>
            }
            className="m-5"
          />
        ) : (
          <div className="divide-y divide-line/70">
            {items.map((post) => (
              <div key={post.id} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:px-5">
                <div className="flex min-w-0 flex-1 items-center gap-3.5">
                  <div className="grid h-14 w-20 shrink-0 place-items-center overflow-hidden rounded-xl border border-line bg-surface">
                    {post.coverImage ? (
                      <img src={post.coverImage} alt="" className="h-full w-full object-cover" loading="lazy" />
                    ) : (
                      <ImageIcon className="h-4 w-4 text-faint" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">{post.title || 'Untitled update'}</p>
                    <p className="mt-0.5 text-[0.7rem] text-faint">
                      {post.category} · {formatDate(post.createdAt)} · {post.commentCount || 0} comments
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {post.pinned && (
                        <Badge variant="accent">
                          <Pin className="h-2.5 w-2.5" /> Pinned
                        </Badge>
                      )}
                      {post.inNewsFeed && (
                        <Badge variant="accent">
                          <Newspaper className="h-2.5 w-2.5" /> News feed
                        </Badge>
                      )}
                      <Badge variant={post.published ? 'success' : 'warning'}>
                        {post.published ? 'Live' : 'Draft'}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1.5 self-end sm:self-auto">
                  <Link
                    to={`/updates/${post.id}`}
                    target="_blank"
                    className="icon-btn h-9 w-9"
                    aria-label="View update"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                  <button type="button" className="icon-btn h-9 w-9" onClick={() => openEdit(post)} aria-label="Edit update">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    className="icon-btn h-9 w-9 hover:border-red-500/40 hover:text-red-500"
                    onClick={() => setDeleting(post)}
                    aria-label="Delete update"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {pages > 1 && (
          <div className="flex items-center justify-between gap-3 border-t border-line/70 px-5 py-3">
            <p className="text-[0.7rem] text-faint">
              Page {page} of {pages} · {total} updates
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                className="btn btn-outline btn-sm"
                disabled={page <= 1}
                onClick={() => setPage((prev) => prev - 1)}
              >
                Previous
              </button>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                disabled={page >= pages}
                onClick={() => setPage((prev) => prev + 1)}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </Panel>

      <Modal
        open={formOpen}
        onClose={closeForm}
        title={editing ? 'Edit update' : 'Write an update'}
        description="Use the toolbar to add bold text, italics, color, sizes, links, quotes, and lists."
        size="xl"
        footer={
          <>
            <button type="button" className="btn btn-ghost btn-sm" onClick={closeForm} disabled={saving}>
              Cancel
            </button>
            <button type="submit" form="post-form" className="btn btn-accent btn-sm" disabled={saving}>
              {saving && <Spinner className="h-4 w-4 text-current" />}
              {editing ? 'Save changes' : 'Publish update'}
            </button>
          </>
        }
      >
        <form id="post-form" onSubmit={save} className="space-y-5">
          <TextField
            label="Title"
            required
            value={form.title}
            onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
            placeholder="Welcome home, Iloilo"
          />
          <div className="grid gap-5 sm:grid-cols-2">
            <SelectField
              label="Category"
              value={form.category}
              onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
              options={pickerOptions}
              hint="Manage this list in Navigation → Update categories."
            />
            <Field label="Visibility" hint="Drafts stay hidden from the public website.">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, published: false }))}
                  className={cn(
                    'flex-1 rounded-2xl border px-4 py-3 text-xs font-semibold transition',
                    !form.published ? 'border-accent/50 bg-accent/10 text-accent' : 'border-line text-soft'
                  )}
                >
                  Draft
                </button>
                <button
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, published: true }))}
                  className={cn(
                    'flex-1 rounded-2xl border px-4 py-3 text-xs font-semibold transition',
                    form.published ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300' : 'border-line text-soft'
                  )}
                >
                  Published
                </button>
              </div>
            </Field>
          </div>

          <MediaField
            label="Cover image"
            hint="Shown on the updates feed and at the top of the post."
            value={form.coverImage}
            onChange={(value) => setForm((prev) => ({ ...prev, coverImage: value }))}
            type="image"
          />

          <RichTextField
            label="Content"
            value={form.content}
            onChange={(value) => setForm((prev) => ({ ...prev, content: value }))}
            rows={14}
          />

          <MediaListField
            label="Attached media"
            hint="Optional photos or videos shown below the post."
            items={form.media}
            onChange={(media) => setForm((prev) => ({ ...prev, media }))}
          />

          <div className="grid gap-2 sm:grid-cols-2">
            <label className="flex items-center gap-3 rounded-2xl border border-line bg-surface/60 px-4 py-3">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-line accent-[rgb(var(--c-accent))]"
                checked={form.pinned}
                onChange={(event) => setForm((prev) => ({ ...prev, pinned: event.target.checked }))}
              />
              <span>
                <span className="block text-sm font-medium text-ink">Pin this update</span>
                <span className="text-xs text-soft">Pinned updates appear first on the updates page.</span>
              </span>
            </label>
            <label className="flex items-center gap-3 rounded-2xl border border-line bg-surface/60 px-4 py-3">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-line accent-[rgb(var(--c-accent))]"
                checked={form.inNewsFeed}
                onChange={(event) => setForm((prev) => ({ ...prev, inNewsFeed: event.target.checked }))}
              />
              <span>
                <span className="block text-sm font-medium text-ink">Show in news feed</span>
                <span className="text-xs text-soft">Church happenings appear in the Facebook-style feed.</span>
              </span>
            </label>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        loading={removing}
        title="Delete this update?"
        description={`“${deleting?.title || 'Untitled update'}” and its comments will be permanently removed.`}
      />
    </div>
  );
}
