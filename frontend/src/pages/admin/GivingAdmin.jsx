import { useCallback, useEffect, useState } from 'react';
import { HandCoins, Pencil, Plus, Trash2, Wallet } from 'lucide-react';
import { api, getError } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { PageHeader, Panel } from '../../components/admin/AdminUI';
import { Field, RichTextField, MediaField, SelectField, TextField } from '../../components/admin/fields';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { InlineLoader, Spinner } from '../../components/ui/Loaders';

const METHODS = [
  { value: 'gcash', label: 'GCash' },
  { value: 'bank', label: 'Bank transfer' },
  { value: 'paypal', label: 'PayPal' },
  { value: 'cash', label: 'Cash' },
  { value: 'in-person', label: 'In person' },
  { value: 'other', label: 'Other' },
];

const methodLabel = (method) => METHODS.find((item) => item.value === method)?.label || 'Other';

const emptyOption = {
  title: '',
  anchor: '',
  method: 'gcash',
  description: '',
  accountName: '',
  accountNumber: '',
  instructions: '',
  image: '',
  order: 0,
  published: true,
};

export default function GivingAdmin() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyOption);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [removing, setRemoving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/giving');
      setItems(data.options || []);
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
    setForm({ ...emptyOption, order: items.length });
    setFormOpen(true);
  };

  const openEdit = (option) => {
    setEditing(option);
    setForm({
      title: option.title || '',
      anchor: option.anchor || '',
      method: option.method || 'gcash',
      description: option.description || '',
      accountName: option.accountName || '',
      accountNumber: option.accountNumber || '',
      instructions: option.instructions || '',
      image: option.image || '',
      order: option.order ?? 0,
      published: Boolean(option.published),
    });
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditing(null);
    setForm(emptyOption);
  };

  const save = async (event) => {
    event.preventDefault();
    if (form.title.trim().length < 2) {
      toast.error('Please enter a giving option title.');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/admin/giving/${editing.id}`, form);
        toast.success('Giving option saved.');
      } else {
        await api.post('/admin/giving', form);
        toast.success('Giving option created.');
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
      await api.delete(`/admin/giving/${deleting.id}`);
      toast.success('Giving option deleted.');
      setDeleting(null);
      load();
    } catch (err) {
      toast.error(getError(err));
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Community"
        title="Giving"
        description="The ways people can give — online transfers, bank deposits, and in-person giving. Shown on the Donate page."
        actions={
          <button type="button" className="btn btn-accent btn-sm" onClick={openCreate}>
            <Plus className="h-3.5 w-3.5" /> New giving option
          </button>
        }
      />

      <Panel>
        {loading ? (
          <InlineLoader label="Loading giving options…" />
        ) : items.length === 0 ? (
          <EmptyState
            icon={Wallet}
            title="No giving options yet"
            description="Add how the church receives gifts so the Donate page is ready."
            action={
              <button type="button" className="btn btn-accent btn-sm" onClick={openCreate}>
                <Plus className="h-3.5 w-3.5" /> Add a giving option
              </button>
            }
            className="m-5"
          />
        ) : (
          <div className="divide-y divide-line/70">
            {items.map((option) => (
              <div key={option.id} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:px-5">
                <div className="flex min-w-0 flex-1 items-center gap-3.5">
                  {option.image ? (
                    <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-2xl border border-line bg-white p-1">
                      <img src={option.image} alt="" className="h-full w-full object-contain" loading="lazy" />
                    </span>
                  ) : (
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-accent/10 text-accent">
                      <HandCoins className="h-4 w-4" />
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">{option.title}</p>
                    <p className="mt-0.5 truncate text-[0.7rem] text-faint">
                      {methodLabel(option.method)}
                      {option.accountName ? ` · ${option.accountName}` : ''}
                      {option.anchor ? ` · #${option.anchor}` : ''}
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      <Badge variant={option.published ? 'success' : 'warning'}>
                        {option.published ? 'Live' : 'Draft'}
                      </Badge>
                      <Badge>Order {option.order ?? 0}</Badge>
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1.5 self-end sm:self-auto">
                  <button type="button" className="icon-btn h-9 w-9" onClick={() => openEdit(option)} aria-label="Edit giving option">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    className="icon-btn h-9 w-9 hover:border-red-500/40 hover:text-red-500"
                    onClick={() => setDeleting(option)}
                    aria-label="Delete giving option"
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
        title={editing ? 'Edit giving option' : 'New giving option'}
        description="Account details are shown on the Donate page."
        size="lg"
        footer={
          <>
            <button type="button" className="btn btn-ghost btn-sm" onClick={closeForm} disabled={saving}>
              Cancel
            </button>
            <button type="submit" form="giving-form" className="btn btn-accent btn-sm" disabled={saving}>
              {saving && <Spinner className="h-4 w-4 text-current" />}
              {editing ? 'Save option' : 'Create option'}
            </button>
          </>
        }
      >
        <form id="giving-form" onSubmit={save} className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField
              label="Title"
              required
              value={form.title}
              onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
              placeholder="Church giving · GCash"
            />
            <SelectField
              label="Method"
              value={form.method}
              onChange={(event) => setForm((prev) => ({ ...prev, method: event.target.value }))}
              options={METHODS}
            />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField
              label="Anchor"
              value={form.anchor}
              onChange={(event) => setForm((prev) => ({ ...prev, anchor: event.target.value }))}
              placeholder="gcash"
              hint="Used for direct links like /pages/donate#gcash."
            />
            <TextField
              label="Display order"
              type="number"
              value={form.order}
              onChange={(event) => setForm((prev) => ({ ...prev, order: Number(event.target.value) }))}
            />
          </div>
          <TextField
            label="Short description"
            value={form.description}
            onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
            placeholder="Send gifts directly to our ministry account."
          />
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField
              label="Account name"
              value={form.accountName}
              onChange={(event) => setForm((prev) => ({ ...prev, accountName: event.target.value }))}
              placeholder="Calvary Chapel Iloilo"
            />
            <TextField
              label="Account number"
              value={form.accountNumber}
              onChange={(event) => setForm((prev) => ({ ...prev, accountNumber: event.target.value }))}
              placeholder="09XX XXX XXXX"
            />
          </div>
          <MediaField
            label="Payment image"
            hint="Upload a QR code, bank details screenshot, or any image. It is shown beside this giving option on the Donate page."
            value={form.image}
            onChange={(value) => setForm((prev) => ({ ...prev, image: value }))}
            type="image"
          />
          <RichTextField
            label="Instructions"
            value={form.instructions}
            onChange={(value) => setForm((prev) => ({ ...prev, instructions: value }))}
            rows={7}
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
                <span className="text-xs text-soft">Show this option on the Donate page.</span>
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
        title="Delete this giving option?"
        description={`“${deleting?.title || 'This option'}” will be removed from the Donate page.`}
      />
    </div>
  );
}
