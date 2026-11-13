import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Link2,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import { api, getError } from '../../api/client';
import { useSite } from '../../context/SiteContext';
import { useToast } from '../../context/ToastContext';
import { PageHeader, Panel, Switch } from '../../components/admin/AdminUI';
import UpdateCategoriesPanel from '../../components/admin/UpdateCategoriesPanel';
import { SelectField, TextField } from '../../components/admin/fields';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { EmptyState } from '../../components/ui/EmptyState';
import { InlineLoader, Spinner } from '../../components/ui/Loaders';
import { cn } from '../../lib/utils';

const emptyLink = {
  label: '',
  href: '',
  parent: '',
  description: '',
  visible: true,
  external: false,
  openInNewTab: false,
};

export default function NavigationAdmin() {
  const toast = useToast();
  const { refresh } = useSite();
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyLink);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [removing, setRemoving] = useState(false);
  const [moving, setMoving] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/nav');
      setLinks(data.links || []);
    } catch (err) {
      toast.error(getError(err));
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const parents = useMemo(
    () => links.filter((link) => !link.parent).sort((a, b) => a.order - b.order),
    [links]
  );

  const childrenOf = useCallback(
    (id) => links.filter((link) => String(link.parent) === String(id)).sort((a, b) => a.order - b.order),
    [links]
  );

  const hasChildren = useCallback(
    (id) => links.some((link) => String(link.parent) === String(id)),
    [links]
  );

  const openCreate = (parentId = '') => {
    setEditing(null);
    setForm({ ...emptyLink, parent: parentId });
    setFormOpen(true);
  };

  const openEdit = (link) => {
    setEditing(link);
    setForm({
      label: link.label || '',
      href: link.href || '',
      parent: link.parent ? String(link.parent) : '',
      description: link.description || '',
      visible: Boolean(link.visible),
      external: Boolean(link.external),
      openInNewTab: Boolean(link.openInNewTab),
    });
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditing(null);
    setForm(emptyLink);
  };

  const save = async (event) => {
    event.preventDefault();
    if (!form.label.trim()) {
      toast.error('Please enter a label for the link.');
      return;
    }
    if (!form.href.trim()) {
      toast.error('Please enter a URL or path for the link.');
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form, parent: form.parent || null };
      if (editing) {
        await api.put(`/admin/nav/${editing.id}`, payload);
        toast.success('Navigation link saved.');
      } else {
        await api.post('/admin/nav', payload);
        toast.success('Navigation link added.');
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

  const toggleVisible = async (link) => {
    try {
      const { data } = await api.put(`/admin/nav/${link.id}`, { visible: !link.visible });
      setLinks((prev) => prev.map((item) => (item.id === link.id ? data.link : item)));
      refresh();
    } catch (err) {
      toast.error(getError(err));
    }
  };

  const move = async (link, direction) => {
    const siblings = link.parent
      ? childrenOf(link.parent)
      : parents;
    const index = siblings.findIndex((item) => item.id === link.id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= siblings.length) return;
    const reordered = [...siblings];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];

    setMoving(link.id);
    try {
      await api.put('/admin/nav/reorder', {
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
      await api.delete(`/admin/nav/${deleting.id}`);
      toast.success('Navigation link deleted.');
      setDeleting(null);
      await load();
      refresh();
    } catch (err) {
      toast.error(getError(err));
    } finally {
      setRemoving(false);
    }
  };

  const parentOptions = parents.filter((parent) => {
    if (editing && String(parent.id) === String(editing.id)) return false;
    return true;
  });
  const editHasChildren = editing ? hasChildren(editing.id) : false;
  const editingIsChild = Boolean(editing?.parent);

  const renderRow = (link, child = false) => {
    const siblings = link.parent ? childrenOf(link.parent) : parents;
    const index = siblings.findIndex((item) => item.id === link.id);
    const busyMoving = moving === link.id;

    return (
      <div
        key={link.id}
        className={cn(
          'flex flex-col gap-2.5 px-4 py-3 sm:flex-row sm:items-center',
          child ? 'rounded-xl border border-line/80 bg-elevated px-3 py-2.5' : ''
        )}
      >
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <span
            className={cn(
              'grid h-8 w-8 shrink-0 place-items-center rounded-lg',
              link.visible ? 'bg-accent/10 text-accent' : 'bg-ink/5 text-faint'
            )}
          >
            <Link2 className="h-3.5 w-3.5" />
          </span>
          <div className="min-w-0">
            <p className="flex items-center gap-2 truncate text-sm font-semibold text-ink">
              {link.label}
              {!link.visible && <span className="text-[0.6rem] uppercase tracking-[0.14em] text-faint">Hidden</span>}
              {link.openInNewTab && (
                <span className="rounded border border-line px-1 text-[0.5rem] uppercase tracking-[0.1em] text-faint">
                  New tab
                </span>
              )}
            </p>
            <p className="truncate text-[0.68rem] text-faint">
              {link.href}
              {link.description ? ` · ${link.description}` : ''}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1 self-end sm:self-auto">
          <div className="mr-1 flex items-center rounded-full border border-line">
            <button
              type="button"
              className="grid h-7 w-7 place-items-center rounded-l-full text-faint transition hover:text-ink disabled:opacity-30"
              onClick={() => move(link, -1)}
              disabled={index <= 0 || busyMoving}
              aria-label="Move up"
            >
              <ChevronUp className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              className="grid h-7 w-7 place-items-center rounded-r-full text-faint transition hover:text-ink disabled:opacity-30"
              onClick={() => move(link, 1)}
              disabled={index >= siblings.length - 1 || busyMoving}
              aria-label="Move down"
            >
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
          </div>
          {!child && (
            <button
              type="button"
              className="icon-btn h-8 w-8"
              onClick={() => openCreate(link.id)}
              title="Add a child link"
              aria-label="Add child link"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            type="button"
            className="icon-btn h-8 w-8"
            onClick={() => toggleVisible(link)}
            title={link.visible ? 'Hide from website' : 'Show on website'}
            aria-label={link.visible ? 'Hide link' : 'Show link'}
          >
            {link.visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
          </button>
          <button type="button" className="icon-btn h-8 w-8" onClick={() => openEdit(link)} aria-label="Edit link">
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            className="icon-btn h-8 w-8 hover:border-red-500/40 hover:text-red-500"
            onClick={() => setDeleting(link)}
            aria-label="Delete link"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Administration"
        title="Navigation"
        description="Build the website menu and manage the categories used by the Updates page. Top-level links can hold one level of child links, like Donate → Give online."
        actions={
          <button type="button" className="btn btn-accent btn-sm" onClick={() => openCreate()}>
            <Plus className="h-3.5 w-3.5" /> Add link
          </button>
        }
      />

      <div className="rounded-3xl border border-white/10 bg-[#0c0a18] p-5 text-white shadow-lift">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[0.55rem] font-semibold uppercase tracking-[0.24em] text-white/35">
            Live menu preview
          </p>
          <span className="text-[0.6rem] text-white/30">Visible links only</span>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {parents.filter((parent) => parent.visible).length === 0 && (
            <p className="text-xs text-white/40">No visible links yet.</p>
          )}
          {parents
            .filter((parent) => parent.visible)
            .map((parent) => {
              const visibleChildren = childrenOf(parent.id).filter((child) => child.visible);
              return (
                <span
                  key={parent.id}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-[0.72rem] text-white/80"
                >
                  {parent.label}
                  {visibleChildren.length > 0 && <ChevronDown className="h-3 w-3 text-white/40" />}
                </span>
              );
            })}
        </div>
      </div>

      <Panel>
        {loading ? (
          <InlineLoader label="Loading navigation…" />
        ) : parents.length === 0 ? (
          <EmptyState
            icon={Link2}
            title="No navigation links"
            description="Add your first link to build the website menu."
            action={
              <button type="button" className="btn btn-accent btn-sm" onClick={() => openCreate()}>
                <Plus className="h-3.5 w-3.5" /> Add a link
              </button>
            }
            className="m-5"
          />
        ) : (
          <div className="space-y-3 p-4 sm:p-5">
            {parents.map((parent) => {
              const children = childrenOf(parent.id);
              return (
                <div key={parent.id} className="rounded-2xl border border-line bg-surface/50">
                  {renderRow(parent)}
                  {children.length > 0 && (
                    <div className="space-y-2 border-t border-line/70 px-4 pb-4 pt-3 sm:pl-12">
                      {children.map((child) => renderRow(child, true))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Panel>

      <UpdateCategoriesPanel />

      <Modal
        open={formOpen}
        onClose={closeForm}
        title={editing ? 'Edit navigation link' : form.parent ? 'Add child link' : 'Add navigation link'}
        description="Use a path like /pages/about or a full https:// address for external links."
        size="md"
        footer={
          <>
            <button type="button" className="btn btn-ghost btn-sm" onClick={closeForm} disabled={saving}>
              Cancel
            </button>
            <button type="submit" form="nav-form" className="btn btn-accent btn-sm" disabled={saving}>
              {saving && <Spinner className="h-4 w-4 text-current" />}
              {editing ? 'Save link' : 'Add link'}
            </button>
          </>
        }
      >
        <form id="nav-form" onSubmit={save} className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField
              label="Label"
              required
              value={form.label}
              onChange={(event) => setForm((prev) => ({ ...prev, label: event.target.value }))}
              placeholder="Donate"
            />
            <TextField
              label="Link"
              required
              value={form.href}
              onChange={(event) => setForm((prev) => ({ ...prev, href: event.target.value }))}
              placeholder="/pages/donate"
            />
          </div>
          <SelectField
            label="Parent link"
            value={form.parent}
            onChange={(event) => setForm((prev) => ({ ...prev, parent: event.target.value }))}
            disabled={editingIsChild ? false : editHasChildren}
            hint={
              editHasChildren
                ? 'This link has children, so it stays at the top level. Move its children first.'
                : 'Leave empty for a top-level link. Navigation supports two levels.'
            }
          >
            <option value="">Top level</option>
            {parentOptions.map((parent) => (
              <option key={parent.id} value={parent.id}>
                {parent.label}
              </option>
            ))}
          </SelectField>
          <TextField
            label="Description"
            value={form.description}
            onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
            placeholder="Optional note shown in the menu"
          />
          <div className="grid gap-2.5 sm:grid-cols-2">
            <Switch
              label="Visible"
              description="Show in the website menu."
              checked={form.visible}
              onChange={(value) => setForm((prev) => ({ ...prev, visible: value }))}
            />
            <Switch
              label="External link"
              description="Points to another website."
              checked={form.external}
              onChange={(value) => setForm((prev) => ({ ...prev, external: value }))}
            />
            <Switch
              label="Open in new tab"
              description="Useful for giving or partner sites."
              checked={form.openInNewTab}
              onChange={(value) => setForm((prev) => ({ ...prev, openInNewTab: value }))}
            />
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        loading={removing}
        title="Delete this navigation link?"
        description={
          deleting && hasChildren(deleting.id)
            ? `“${deleting.label}” and its child links will be permanently removed from the menu.`
            : `“${deleting?.label || 'This link'}” will be removed from the menu.`
        }
      />
    </div>
  );
}
