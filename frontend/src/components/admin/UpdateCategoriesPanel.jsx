import { useCallback, useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, Eye, EyeOff, Pencil, Plus, Tags, Trash2 } from 'lucide-react';
import { api, getError } from '../../api/client';
import { useSite } from '../../context/SiteContext';
import { useToast } from '../../context/ToastContext';
import { Panel, PanelHeader, Switch } from './AdminUI';
import { TextField } from './fields';
import { Modal } from '../ui/Modal';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { EmptyState } from '../ui/EmptyState';
import { InlineLoader, Spinner } from '../ui/Loaders';
import { cn } from '../../lib/utils';

const emptyCategory = { name: '', visible: true };

const countLabel = (count) => `${count} ${count === 1 ? 'update' : 'updates'}`;

export default function UpdateCategoriesPanel() {
  const toast = useToast();
  const { refresh } = useSite();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyCategory);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [removing, setRemoving] = useState(false);
  const [moving, setMoving] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/categories');
      setCategories(data.categories || []);
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
    setForm(emptyCategory);
    setFormOpen(true);
  };

  const openEdit = (category) => {
    setEditing(category);
    setForm({ name: category.name || '', visible: Boolean(category.visible) });
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditing(null);
    setForm(emptyCategory);
  };

  const save = async (event) => {
    event.preventDefault();
    if (!form.name.trim()) {
      toast.error('Please give the category a name.');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/admin/categories/${editing.id}`, form);
        toast.success('Category updated.');
      } else {
        await api.post('/admin/categories', form);
        toast.success('Category added.');
      }
      closeForm();
      await load();
      refresh();
    } catch (err) {
      toast.error(getError(err));
    } finally {
      setSaving(false);
    }
  };

  const toggleVisible = async (category) => {
    try {
      const { data } = await api.put(`/admin/categories/${category.id}`, { visible: !category.visible });
      setCategories((prev) => prev.map((item) => (item.id === category.id ? data.category : item)));
      refresh();
    } catch (err) {
      toast.error(getError(err));
    }
  };

  const move = async (category, direction) => {
    const index = categories.findIndex((item) => item.id === category.id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= categories.length) return;
    const reordered = [...categories];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];

    setMoving(category.id);
    try {
      await api.put('/admin/categories/reorder', {
        items: reordered.map((item, order) => ({ id: item.id, order })),
      });
      await load();
      refresh();
    } catch (err) {
      toast.error(getError(err));
    } finally {
      setMoving(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setRemoving(true);
    try {
      const { data } = await api.delete(`/admin/categories/${deleting.id}`);
      const moved = data?.reassigned
        ? ` ${countLabel(data.reassigned)} moved to “${data.movedTo}”.`
        : '';
      toast.success(`Category deleted.${moved}`);
      setDeleting(null);
      await load();
      refresh();
    } catch (err) {
      toast.error(getError(err));
    } finally {
      setRemoving(false);
    }
  };

  return (
    <Panel>
      <PanelHeader
        title="Update categories"
        description="The topics people filter by on the Updates page. Hidden categories stay available on existing updates but disappear from the website filters."
        actions={
          <button type="button" className="btn btn-outline btn-sm" onClick={openCreate}>
            <Plus className="h-3.5 w-3.5" /> Add category
          </button>
        }
      />

      {loading ? (
        <InlineLoader label="Loading categories…" />
      ) : categories.length === 0 ? (
        <EmptyState
          icon={Tags}
          title="No categories yet"
          description="Add a category so updates can be grouped on the website."
          action={
            <button type="button" className="btn btn-accent btn-sm" onClick={openCreate}>
              <Plus className="h-3.5 w-3.5" /> Add a category
            </button>
          }
          className="m-5"
        />
      ) : (
        <div className="divide-y divide-line/70">
          {categories.map((category, index) => {
            const busyMoving = moving === category.id;
            return (
              <div
                key={category.id}
                className="flex flex-col gap-2.5 px-4 py-3 sm:flex-row sm:items-center sm:px-5"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <span
                    className={cn(
                      'grid h-8 w-8 shrink-0 place-items-center rounded-lg',
                      category.visible ? 'bg-accent/10 text-accent' : 'bg-ink/5 text-faint'
                    )}
                  >
                    <Tags className="h-3.5 w-3.5" />
                  </span>
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-ink">
                      <span className="truncate">{category.name}</span>
                      {!category.visible && (
                        <span className="text-[0.6rem] uppercase tracking-[0.14em] text-faint">Hidden</span>
                      )}
                    </p>
                    <p className="text-[0.68rem] text-faint">
                      {category.postCount > 0
                        ? countLabel(category.postCount)
                        : 'No updates yet'}
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-1 self-end sm:self-auto">
                  <div className="mr-1 flex items-center rounded-full border border-line">
                    <button
                      type="button"
                      className="grid h-7 w-7 place-items-center rounded-l-full text-faint transition hover:text-ink disabled:opacity-30"
                      onClick={() => move(category, -1)}
                      disabled={index <= 0 || busyMoving}
                      aria-label={`Move ${category.name} up`}
                    >
                      <ChevronUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      className="grid h-7 w-7 place-items-center rounded-r-full text-faint transition hover:text-ink disabled:opacity-30"
                      onClick={() => move(category, 1)}
                      disabled={index >= categories.length - 1 || busyMoving}
                      aria-label={`Move ${category.name} down`}
                    >
                      <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <button
                    type="button"
                    className="icon-btn h-8 w-8"
                    onClick={() => toggleVisible(category)}
                    title={category.visible ? 'Hide from website filters' : 'Show on website filters'}
                    aria-label={category.visible ? 'Hide category' : 'Show category'}
                  >
                    {category.visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                  </button>
                  <button
                    type="button"
                    className="icon-btn h-8 w-8"
                    onClick={() => openEdit(category)}
                    aria-label={`Rename ${category.name}`}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    className="icon-btn h-8 w-8 hover:border-red-500/40 hover:text-red-500"
                    onClick={() => setDeleting(category)}
                    disabled={categories.length <= 1}
                    title={categories.length <= 1 ? 'Keep at least one category' : 'Delete category'}
                    aria-label={`Delete ${category.name}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        open={formOpen}
        onClose={closeForm}
        title={editing ? 'Rename category' : 'Add update category'}
        description="Renaming keeps every update already filed under this category in place."
        size="sm"
        footer={
          <>
            <button type="button" className="btn btn-ghost btn-sm" onClick={closeForm} disabled={saving}>
              Cancel
            </button>
            <button type="submit" form="category-form" className="btn btn-accent btn-sm" disabled={saving}>
              {saving && <Spinner className="h-4 w-4 text-current" />}
              {editing ? 'Save category' : 'Add category'}
            </button>
          </>
        }
      >
        <form id="category-form" onSubmit={save} className="space-y-5">
          <TextField
            label="Name"
            required
            maxLength={40}
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            placeholder="Youth ministry"
            hint="Shown as a filter button on the Updates page."
          />
          <Switch
            label="Visible on the website"
            description="Turn off to keep the category for admin use only."
            checked={form.visible}
            onChange={(value) => setForm((prev) => ({ ...prev, visible: value }))}
          />
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        loading={removing}
        confirmLabel="Delete category"
        title="Delete this category?"
        description={
          deleting?.postCount > 0
            ? `“${deleting?.name}” will be removed and its ${countLabel(deleting.postCount)} will move to another category. Nothing gets unpublished.`
            : `“${deleting?.name || 'This category'}” will be removed from the update filters.`
        }
      />
    </Panel>
  );
}
