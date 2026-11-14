import { useCallback, useEffect, useState } from 'react';
import {
  KeyRound,
  Pencil,
  Plus,
  ShieldCheck,
  Trash2,
  UserCog,
  Users,
} from 'lucide-react';
import { api, getError } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useDebounced } from '../../hooks/useUi';
import { PageHeader, Panel, Toolbar, SearchInput, AdminNotice, Switch } from '../../components/admin/AdminUI';
import { Field, SelectField, TextField } from '../../components/admin/fields';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { InlineLoader, Spinner } from '../../components/ui/Loaders';
import { formatDate, relativeTime } from '../../lib/dates';
import { ADMIN_PERMISSIONS, DEFAULT_PERMISSIONS } from '../../lib/permissions';

const blankForm = {
  name: '',
  email: '',
  password: '',
  role: 'admin',
  active: true,
  permissions: [...DEFAULT_PERMISSIONS],
};

const initials = (name = '') =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || '?';

export default function UsersAdmin() {
  const { user: me } = useAuth();
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const search = useDebounced(query, 250);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blankForm);
  const [saving, setSaving] = useState(false);

  const [resetUser, setResetUser] = useState(null);
  const [passwords, setPasswords] = useState({ password: '', confirm: '' });
  const [resetting, setResetting] = useState(false);

  const [deleting, setDeleting] = useState(null);
  const [removing, setRemoving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/users');
      setUsers(data.users || []);
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
    setForm({ ...blankForm, permissions: [...DEFAULT_PERMISSIONS] });
    setFormOpen(true);
  };

  const openEdit = (user) => {
    setEditing(user);
    setForm({
      name: user.name || '',
      email: user.email || '',
      password: '',
      role: user.role || 'admin',
      active: Boolean(user.active),
      permissions: Array.isArray(user.permissions) ? [...user.permissions] : [...DEFAULT_PERMISSIONS],
    });
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditing(null);
    setForm(blankForm);
  };

  const togglePermission = (key) => {
    setForm((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(key)
        ? prev.permissions.filter((item) => item !== key)
        : [...prev.permissions, key],
    }));
  };

  const save = async (event) => {
    event.preventDefault();
    if (form.name.trim().length < 2) {
      toast.error('Please enter the account holder’s name.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      toast.error('Please enter a valid email address.');
      return;
    }
    if (!editing && form.password.length < 8) {
      toast.error('The password must be at least 8 characters.');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        const payload = {
          name: form.name,
          email: form.email,
          role: form.role,
          active: form.active,
          permissions: form.permissions,
        };
        await api.put(`/admin/users/${editing.id}`, payload);
        toast.success('Account saved.');
      } else {
        const payload = {
          name: form.name,
          email: form.email,
          password: form.password,
          role: form.role,
          permissions: form.permissions,
        };
        await api.post('/admin/users', payload);
        toast.success('Staff account created.');
      }
      closeForm();
      load();
    } catch (err) {
      toast.error(getError(err));
    } finally {
      setSaving(false);
    }
  };

  const openReset = (user) => {
    setResetUser(user);
    setPasswords({ password: '', confirm: '' });
  };

  const submitReset = async (event) => {
    event.preventDefault();
    if (passwords.password.length < 8) {
      toast.error('The new password must be at least 8 characters.');
      return;
    }
    if (passwords.password !== passwords.confirm) {
      toast.error('The passwords do not match.');
      return;
    }
    setResetting(true);
    try {
      await api.patch(`/admin/users/${resetUser.id}/password`, { password: passwords.password });
      toast.success(`Password reset for ${resetUser.name}.`);
      setResetUser(null);
    } catch (err) {
      toast.error(getError(err));
    } finally {
      setResetting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setRemoving(true);
    try {
      await api.delete(`/admin/users/${deleting.id}`);
      toast.success('Account deleted.');
      setDeleting(null);
      load();
    } catch (err) {
      toast.error(getError(err));
    } finally {
      setRemoving(false);
    }
  };

  const visible = search
    ? users.filter((user) =>
        `${user.name} ${user.email} ${user.role}`.toLowerCase().includes(search.toLowerCase())
      )
    : users;

  const superadmins = users.filter((user) => user.role === 'superadmin').length;
  const isSelf = (user) => String(user.id) === String(me?.id);

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Administration"
        title="Accounts"
        description="Create staff accounts, choose their role, and keep access tidy. Only superadmins can manage accounts."
        actions={
          <button type="button" className="btn btn-accent btn-sm" onClick={openCreate}>
            <Plus className="h-3.5 w-3.5" /> New account
          </button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-3xl border border-line bg-elevated p-5">
          <p className="text-[0.6rem] font-semibold uppercase tracking-[0.18em] text-faint">Total staff</p>
          <p className="mt-1 font-display text-2xl font-semibold text-ink">{users.length}</p>
        </div>
        <div className="rounded-3xl border border-line bg-elevated p-5">
          <p className="text-[0.6rem] font-semibold uppercase tracking-[0.18em] text-faint">Superadmins</p>
          <p className="mt-1 font-display text-2xl font-semibold text-ink">{superadmins}</p>
        </div>
        <div className="rounded-3xl border border-line bg-elevated p-5">
          <p className="text-[0.6rem] font-semibold uppercase tracking-[0.18em] text-faint">Active</p>
          <p className="mt-1 font-display text-2xl font-semibold text-ink">
            {users.filter((user) => user.active).length}
          </p>
        </div>
      </div>

      <Panel>
        <div className="border-b border-line/70 px-4 py-4 sm:px-5">
          <Toolbar>
            <SearchInput value={query} onChange={setQuery} placeholder="Search accounts…" />
          </Toolbar>
        </div>

        {loading ? (
          <InlineLoader label="Loading accounts…" />
        ) : visible.length === 0 ? (
          <EmptyState
            icon={Users}
            title={users.length ? 'No accounts match your search' : 'No accounts yet'}
            description={users.length ? 'Try a different search term.' : 'Create the first staff account.'}
            action={
              !users.length && (
                <button type="button" className="btn btn-accent btn-sm" onClick={openCreate}>
                  <Plus className="h-3.5 w-3.5" /> Create an account
                </button>
              )
            }
            className="m-5"
          />
        ) : (
          <div className="divide-y divide-line/70">
            {visible.map((user) => (
              <div key={user.id} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:px-5">
                <div className="flex min-w-0 flex-1 items-center gap-3.5">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand text-[0.68rem] font-bold text-accent">
                    {initials(user.name)}
                  </span>
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 truncate text-sm font-semibold text-ink">
                      {user.name}
                      {isSelf(user) && (
                        <span className="rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 text-[0.55rem] font-semibold uppercase tracking-[0.12em] text-accent">
                          You
                        </span>
                      )}
                    </p>
                    <p className="truncate text-[0.7rem] text-faint">{user.email}</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <Badge variant={user.role === 'superadmin' ? 'accent' : 'default'}>
                        {user.role === 'superadmin' ? (
                          <>
                            <ShieldCheck className="h-2.5 w-2.5" /> Superadmin
                          </>
                        ) : (
                          <>
                            <UserCog className="h-2.5 w-2.5" /> Admin
                          </>
                        )}
                      </Badge>
                      <Badge variant={user.active ? 'success' : 'danger'}>
                        {user.active ? 'Active' : 'Disabled'}
                      </Badge>
                      {user.role === 'superadmin' ? (
                        <Badge variant="accent">Full access</Badge>
                      ) : (
                        <Badge>
                          {(user.permissions || DEFAULT_PERMISSIONS).length} of {ADMIN_PERMISSIONS.length} sections
                        </Badge>
                      )}
                      <span className="text-[0.63rem] text-faint">
                        {user.lastLogin ? `Last seen ${relativeTime(user.lastLogin)}` : `Added ${formatDate(user.createdAt)}`}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1.5 self-end sm:self-auto">
                  <button type="button" className="icon-btn h-9 w-9" onClick={() => openReset(user)} aria-label="Reset password">
                    <KeyRound className="h-3.5 w-3.5" />
                  </button>
                  <button type="button" className="icon-btn h-9 w-9" onClick={() => openEdit(user)} aria-label="Edit account">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  {!isSelf(user) && (
                    <button
                      type="button"
                      className="icon-btn h-9 w-9 hover:border-red-500/40 hover:text-red-500"
                      onClick={() => setDeleting(user)}
                      aria-label="Delete account"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <AdminNotice>
        At least one active superadmin must always remain. A superadmin manages navigation and
        accounts; an admin manages content, media, and site settings.
      </AdminNotice>

      <Modal
        open={formOpen}
        onClose={closeForm}
        title={editing ? 'Edit account' : 'New staff account'}
        size="md"
        footer={
          <>
            <button type="button" className="btn btn-ghost btn-sm" onClick={closeForm} disabled={saving}>
              Cancel
            </button>
            <button type="submit" form="user-form" className="btn btn-accent btn-sm" disabled={saving}>
              {saving && <Spinner className="h-4 w-4 text-current" />}
              {editing ? 'Save account' : 'Create account'}
            </button>
          </>
        }
      >
        <form id="user-form" onSubmit={save} className="space-y-5">
          <TextField
            label="Full name"
            required
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            placeholder="Pastor Jeric Mark"
          />
          <TextField
            label="Email address"
            type="email"
            required
            value={form.email}
            onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
            placeholder="staff@calvarychapeliloilo.org"
          />
          {!editing && (
            <TextField
              label="Temporary password"
              type="password"
              required
              minLength={8}
              value={form.password}
              onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
              placeholder="At least 8 characters"
              hint="Share it securely with the new staff member."
            />
          )}
          <SelectField
            label="Role"
            value={form.role}
            onChange={(event) => setForm((prev) => ({ ...prev, role: event.target.value }))}
            disabled={editing && isSelf(editing)}
            hint={
              editing && isSelf(editing)
                ? 'You cannot change your own role or deactivate yourself.'
                : 'Superadmin manages navigation and accounts. Admin manages content.'
            }
          >
            <option value="admin">Admin — content & media</option>
            <option value="superadmin">Superadmin — full access</option>
          </SelectField>

          {form.role === 'admin' && (
            <Field
              label="Sections this account can access"
              hint="Media library access is needed if this person should upload images from other editors."
            >
              <div className="rounded-2xl border border-line bg-surface/60 p-3">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2 px-1">
                  <p className="text-[0.68rem] text-faint">
                    {form.permissions.length} of {ADMIN_PERMISSIONS.length} selected
                  </p>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() =>
                        setForm((prev) => ({ ...prev, permissions: [...DEFAULT_PERMISSIONS] }))
                      }
                    >
                      Select all
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => setForm((prev) => ({ ...prev, permissions: [] }))}
                    >
                      Clear
                    </button>
                  </div>
                </div>
                <div className="grid gap-1.5 sm:grid-cols-2">
                  {ADMIN_PERMISSIONS.map((permission) => (
                    <label
                      key={permission.key}
                      className="flex cursor-pointer items-start gap-2.5 rounded-xl px-2.5 py-2 transition hover:bg-ink/[0.03]"
                    >
                      <input
                        type="checkbox"
                        className="mt-0.5 h-4 w-4 shrink-0 rounded border-line accent-[rgb(var(--c-accent))]"
                        checked={form.permissions.includes(permission.key)}
                        onChange={() => togglePermission(permission.key)}
                      />
                      <span className="min-w-0">
                        <span className="block text-xs font-medium text-ink">{permission.label}</span>
                        <span className="mt-0.5 block text-[0.65rem] leading-snug text-faint">
                          {permission.description}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </Field>
          )}

          {editing && (
            <Switch
              label="Active account"
              description="Disabled accounts cannot sign in."
              checked={form.active}
              onChange={(value) => setForm((prev) => ({ ...prev, active: value }))}
              disabled={isSelf(editing)}
            />
          )}
          {editing && (
            <Field>
              <p className="text-[0.68rem] leading-relaxed text-faint">
                Passwords are never shown. Use the key button on the account row to set a new one.
              </p>
            </Field>
          )}
        </form>
      </Modal>

      <Modal
        open={Boolean(resetUser)}
        onClose={() => setResetUser(null)}
        title="Reset password"
        description={resetUser ? `Set a new password for ${resetUser.name}.` : ''}
        size="sm"
        footer={
          <>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setResetUser(null)} disabled={resetting}>
              Cancel
            </button>
            <button type="submit" form="reset-form" className="btn btn-accent btn-sm" disabled={resetting}>
              {resetting && <Spinner className="h-4 w-4 text-current" />}
              Update password
            </button>
          </>
        }
      >
        <form id="reset-form" onSubmit={submitReset} className="space-y-4">
          <TextField
            label="New password"
            type="password"
            required
            minLength={8}
            value={passwords.password}
            onChange={(event) => setPasswords((prev) => ({ ...prev, password: event.target.value }))}
            placeholder="At least 8 characters"
          />
          <TextField
            label="Confirm password"
            type="password"
            required
            value={passwords.confirm}
            onChange={(event) => setPasswords((prev) => ({ ...prev, confirm: event.target.value }))}
            placeholder="Repeat the password"
          />
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        loading={removing}
        title="Delete this account?"
        description={`${deleting?.name || 'This staff member'} will lose access immediately. This cannot be undone.`}
      />
    </div>
  );
}
