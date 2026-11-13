import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound, LogOut, ShieldCheck, UserRound } from 'lucide-react';
import { api, getError } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { PageHeader, Panel, PanelHeader, AdminNotice } from '../../components/admin/AdminUI';
import { TextField } from '../../components/admin/fields';
import { Badge } from '../../components/ui/Badge';
import { Spinner } from '../../components/ui/Loaders';
import { formatDate } from '../../lib/dates';

export default function AccountAdmin() {
  const { user, setUser, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [profile, setProfile] = useState({ name: user?.name || '', email: user?.email || '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [savingPassword, setSavingPassword] = useState(false);

  const saveProfile = async (event) => {
    event.preventDefault();
    setSavingProfile(true);
    try {
      const { data } = await api.patch('/auth/profile', profile);
      setUser(data.user);
      toast.success('Profile updated.');
    } catch (err) {
      toast.error(getError(err));
    } finally {
      setSavingProfile(false);
    }
  };

  const savePassword = async (event) => {
    event.preventDefault();
    if (passwords.newPassword.length < 8) {
      toast.error('Your new password must be at least 8 characters.');
      return;
    }
    if (passwords.newPassword !== passwords.confirm) {
      toast.error('The new passwords do not match.');
      return;
    }
    setSavingPassword(true);
    try {
      await api.patch('/auth/password', {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      toast.success('Password updated. Please sign in again.');
      await logout();
      navigate('/admin/login', { replace: true });
    } catch (err) {
      toast.error(getError(err));
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="My account"
        title="Account settings"
        description="Keep your staff profile and password up to date."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-3xl border border-line bg-elevated p-5 sm:col-span-2">
          <div className="flex items-center gap-4">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand text-lg font-bold text-accent">
              {(user?.name || '?')
                .split(/\s+/)
                .filter(Boolean)
                .slice(0, 2)
                .map((part) => part[0])
                .join('')
                .toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="truncate font-display text-xl font-semibold text-ink">{user?.name}</p>
              <p className="truncate text-sm text-soft">{user?.email}</p>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <Badge variant={user?.role === 'superadmin' ? 'accent' : 'default'}>
                  <ShieldCheck className="h-2.5 w-2.5" />{' '}
                  {user?.role === 'superadmin' ? 'Superadmin' : 'Admin'}
                </Badge>
                <span className="text-[0.65rem] text-faint">
                  {user?.lastLogin ? `Last sign-in ${formatDate(user.lastLogin)}` : 'First session'}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col justify-between gap-3 rounded-3xl border border-line bg-elevated p-5">
          <div>
            <p className="text-[0.6rem] font-semibold uppercase tracking-[0.18em] text-faint">Session</p>
            <p className="mt-1 text-sm text-ink">Signed in securely</p>
            <p className="mt-0.5 text-xs text-faint">HTTP-only cookie session</p>
          </div>
          <button
            type="button"
            className="btn btn-outline btn-sm w-full"
            onClick={async () => {
              await logout();
              toast.success('Signed out.');
              navigate('/admin/login', { replace: true });
            }}
          >
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </button>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Panel>
          <PanelHeader title="Profile" description="Your name and email appear on content you publish." />
          <form onSubmit={saveProfile} className="space-y-5 p-5">
            <TextField
              label="Full name"
              required
              value={profile.name}
              onChange={(event) => setProfile((prev) => ({ ...prev, name: event.target.value }))}
            />
            <TextField
              label="Email address"
              type="email"
              required
              value={profile.email}
              onChange={(event) => setProfile((prev) => ({ ...prev, email: event.target.value }))}
            />
            <div className="flex items-center gap-3">
              <UserRound className="h-4 w-4 text-faint" />
              <p className="text-xs text-faint">Changing your email changes how you sign in.</p>
            </div>
            <button type="submit" className="btn btn-accent btn-sm" disabled={savingProfile}>
              {savingProfile && <Spinner className="h-4 w-4 text-current" />}
              Save profile
            </button>
          </form>
        </Panel>

        <Panel>
          <PanelHeader title="Password" description="Use at least 8 characters." />
          <form onSubmit={savePassword} className="space-y-5 p-5">
            <TextField
              label="Current password"
              type="password"
              required
              autoComplete="current-password"
              value={passwords.currentPassword}
              onChange={(event) =>
                setPasswords((prev) => ({ ...prev, currentPassword: event.target.value }))
              }
            />
            <div className="grid gap-5 sm:grid-cols-2">
              <TextField
                label="New password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={passwords.newPassword}
                onChange={(event) =>
                  setPasswords((prev) => ({ ...prev, newPassword: event.target.value }))
                }
              />
              <TextField
                label="Confirm password"
                type="password"
                required
                value={passwords.confirm}
                onChange={(event) =>
                  setPasswords((prev) => ({ ...prev, confirm: event.target.value }))
                }
              />
            </div>
            <div className="flex items-center gap-3">
              <KeyRound className="h-4 w-4 text-faint" />
              <p className="text-xs text-faint">You will be signed out after changing your password.</p>
            </div>
            <button type="submit" className="btn btn-accent btn-sm" disabled={savingPassword}>
              {savingPassword && <Spinner className="h-4 w-4 text-current" />}
              Update password
            </button>
          </form>
        </Panel>
      </div>

      <AdminNotice>
        If you ever suspect your account has been compromised, change your password and tell a
        superadmin so they can review account access.
      </AdminNotice>
    </div>
  );
}
