import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  DatabaseBackup,
  Download,
  FileArchive,
  HardDrive,
  RotateCw,
  ShieldCheck,
  Upload,
} from 'lucide-react';
import { api, getError } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useSite } from '../../context/SiteContext';
import { useToast } from '../../context/ToastContext';
import { AdminNotice, PageHeader, Panel, PanelHeader, StatCard } from '../../components/admin/AdminUI';
import { Spinner } from '../../components/ui/Loaders';
import { cn } from '../../lib/utils';

const COLLECTION_LABELS = {
  posts: 'Updates',
  pages: 'Pages',
  ministries: 'Ministries',
  activities: 'Activities',
  givingoptions: 'Giving options',
  navlinks: 'Navigation links',
  updatecategories: 'Categories',
  medias: 'Media records',
  comments: 'Comments',
  contactmessages: 'Inbox messages',
  users: 'Accounts',
  sitesettings: 'Site settings',
  auditlogs: 'Activity log',
  pagevisits: 'Traffic visits',
};

const formatBytes = (bytes = 0) => {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const power = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  return `${(bytes / 1024 ** power).toFixed(power === 0 ? 0 : 1)} ${units[power]}`;
};

export default function BackupAdmin() {
  const toast = useToast();
  const { refresh: refreshAuth } = useAuth();
  const { refresh: refreshSite } = useSite();
  const fileRef = useRef(null);

  const [info, setInfo] = useState(null);
  const [loadingInfo, setLoadingInfo] = useState(true);
  const [format, setFormat] = useState('zip');
  const [includeAudit, setIncludeAudit] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exported, setExported] = useState(0);
  const [file, setFile] = useState(null);
  const [confirmText, setConfirmText] = useState('');
  const [restoring, setRestoring] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);

  const busy = exporting || restoring;

  const loadInfo = useCallback(async () => {
    try {
      const { data } = await api.get('/admin/backup/info');
      setInfo(data);
    } catch (err) {
      toast.error(getError(err));
    } finally {
      setLoadingInfo(false);
    }
  }, [toast]);

  useEffect(() => {
    loadInfo();
  }, [loadInfo]);

  // A long transfer must not trip the 20-minute idle sign-out.
  useEffect(() => {
    if (!busy) return undefined;
    const timer = setInterval(() => {
      api.post('/auth/heartbeat').catch(() => {});
    }, 5 * 60 * 1000);
    return () => clearInterval(timer);
  }, [busy]);

  const download = async () => {
    if (exporting) return;
    setExporting(true);
    setExported(0);
    try {
      const response = await api.get('/admin/backup/export', {
        params: { format, includeAudit: includeAudit ? 1 : 0 },
        responseType: 'blob',
        timeout: 10 * 60 * 1000,
        onDownloadProgress: (event) => setExported(event.loaded || 0),
      });

      const blob = response.data instanceof Blob ? response.data : new Blob([response.data]);
      const stamp = new Date().toISOString().slice(0, 16).replace(/[-:]/g, '').replace('T', '-');
      const href = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = href;
      link.download = `cci-backup-${stamp}.${format}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(href), 5000);
      toast.success('Backup downloaded.');
    } catch (err) {
      toast.error(getError(err));
    } finally {
      setExporting(false);
    }
  };

  const restore = async () => {
    if (!file || restoring) return;
    if (confirmText.trim().toUpperCase() !== 'RESTORE') {
      toast.error('Type RESTORE to confirm.');
      return;
    }

    setRestoring(true);
    setProgress(0);
    setResult(null);
    try {
      const body = new FormData();
      body.append('file', file);
      const { data } = await api.post('/admin/backup/restore', body, {
        timeout: 30 * 60 * 1000,
        onUploadProgress: (event) => {
          if (event.total) setProgress(Math.round((event.loaded / event.total) * 100));
        },
      });

      setResult(data.summary);
      setFile(null);
      setConfirmText('');
      if (fileRef.current) fileRef.current.value = '';
      toast.success('Backup restored.');
      await Promise.allSettled([refreshSite(), refreshAuth()]);
      loadInfo();
    } catch (err) {
      toast.error(getError(err));
    } finally {
      setRestoring(false);
    }
  };

  const totalRecords = info ? Object.values(info.counts || {}).reduce((sum, value) => sum + value, 0) : 0;
  const confirmed = confirmText.trim().toUpperCase() === 'RESTORE';

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Administration"
        title="Backup & restore"
        description="Download a complete snapshot of the website — content, accounts, settings, and uploaded files — and restore it later. Only superadmins can use this page."
        actions={
          <button type="button" className="btn btn-outline btn-sm" onClick={loadInfo} disabled={loadingInfo || busy}>
            <RotateCw className={cn('h-3.5 w-3.5', loadingInfo && 'animate-spin')} /> Refresh
          </button>
        }
      />

      <AdminNotice tone="accent" className="flex items-start gap-2">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
        <span>
          Backups contain every account, including password hashes, so keep the downloaded file somewhere
          private. Restoring is limited to superadmins and is recorded in the activity log.
        </span>
      </AdminNotice>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={DatabaseBackup} label="Saved records" value={loadingInfo ? '—' : totalRecords} />
        <StatCard
          icon={HardDrive}
          label="Uploaded files"
          value={loadingInfo ? '—' : info?.uploads?.files ?? 0}
          hint={info ? formatBytes(info.uploads?.bytes) : undefined}
          tone="sky"
        />
        <StatCard
          icon={ShieldCheck}
          label="Access"
          value="Superadmin"
          hint="Export and restore are both protected"
          tone="emerald"
        />
      </div>

      <Panel>
        <PanelHeader
          title="Download a backup"
          description="A ZIP includes data.json plus every uploaded image and video. Choose JSON only for a lightweight copy that leaves media files out."
        />
        <div className="space-y-5 p-5 sm:p-6">
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setFormat('zip')}
              className={cn(
                'rounded-2xl border p-4 text-left transition',
                format === 'zip'
                  ? 'border-accent/50 bg-accent/[0.06]'
                  : 'border-line bg-surface/40 hover:border-accent/30'
              )}
            >
              <span className="flex items-center gap-2 text-sm font-semibold text-ink">
                <FileArchive className="h-4 w-4 text-accent" /> ZIP with media
              </span>
              <span className="mt-1 block text-xs leading-relaxed text-soft">
                Everything needed to rebuild this site, including uploaded images and videos.
              </span>
            </button>
            <button
              type="button"
              onClick={() => setFormat('json')}
              className={cn(
                'rounded-2xl border p-4 text-left transition',
                format === 'json'
                  ? 'border-accent/50 bg-accent/[0.06]'
                  : 'border-line bg-surface/40 hover:border-accent/30'
              )}
            >
              <span className="flex items-center gap-2 text-sm font-semibold text-ink">
                <DatabaseBackup className="h-4 w-4 text-accent" /> JSON only
              </span>
              <span className="mt-1 block text-xs leading-relaxed text-soft">
                Database records only. Faster and smaller, but media files are not included.
              </span>
            </button>
          </div>

          <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-line bg-surface/50 px-4 py-3">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 accent-[var(--accent)]"
              checked={includeAudit}
              onChange={(event) => setIncludeAudit(event.target.checked)}
            />
            <span>
              <span className="block text-sm font-medium text-ink">Include activity log & traffic stats</span>
              <span className="mt-0.5 block text-xs leading-relaxed text-soft">
                Adds the audit trail and page-visit counters. Larger file, usually not needed for a restore.
              </span>
            </span>
          </label>

          {info?.ephemeral && (
            <AdminNotice tone="warning" className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
              <span>
                Uploaded files on this server are temporary and may disappear when it restarts, so a ZIP
                backup may not contain older media. Database records are always included.
              </span>
            </AdminNotice>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <button type="button" className="btn btn-accent" onClick={download} disabled={exporting}>
              {exporting ? <Spinner className="h-4 w-4 text-current" /> : <Download className="h-4 w-4" />}
              {exporting ? 'Preparing backup…' : 'Download backup'}
            </button>
            {exporting && exported > 0 && (
              <span className="text-xs text-soft">{formatBytes(exported)} received</span>
            )}
          </div>
        </div>
      </Panel>

      <Panel>
        <PanelHeader
          title="Restore from a backup"
          description="Replaces posts, pages, ministries, activities, giving options, navigation, categories, settings, and media exactly as they were in the backup. Accounts are matched by email and merged, so you cannot lock yourself out."
        />
        <div className="space-y-5 p-5 sm:p-6">
          <AdminNotice tone="danger" className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
            <span>
              This overwrites current website content. Download a fresh backup first if you are unsure.
              Uploaded files are restored from ZIP backups only.
            </span>
          </AdminNotice>

          <div className="space-y-3">
            <input
              ref={fileRef}
              type="file"
              accept=".zip,.json,application/zip,application/json"
              className="hidden"
              onChange={(event) => {
                setFile(event.target.files?.[0] || null);
                setResult(null);
              }}
            />
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => fileRef.current?.click()}
                disabled={restoring}
              >
                <Upload className="h-4 w-4" /> Choose backup file
              </button>
              <span className="min-w-0 truncate text-xs text-soft">
                {file ? `${file.name} · ${formatBytes(file.size)}` : 'No file chosen yet (.zip or .json)'}
              </span>
            </div>

            <div className="max-w-sm">
              <label className="mb-1.5 block text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-soft">
                Type RESTORE to confirm
              </label>
              <input
                className="field"
                value={confirmText}
                onChange={(event) => setConfirmText(event.target.value)}
                placeholder="RESTORE"
                autoComplete="off"
                disabled={restoring}
              />
            </div>

            {restoring && (
              <div className="space-y-1.5">
                <div className="h-2 overflow-hidden rounded-full bg-ink/10">
                  <div
                    className="h-full rounded-full bg-accent transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-[0.7rem] text-soft">
                  {progress < 100 ? `Uploading backup… ${progress}%` : 'Restoring data and files…'}
                </p>
              </div>
            )}

            <button
              type="button"
              className="btn btn-sm bg-red-600 text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={restore}
              disabled={!file || !confirmed || restoring}
            >
              {restoring ? <Spinner className="h-4 w-4 text-current" /> : <Upload className="h-4 w-4" />}
              {restoring ? 'Restoring…' : 'Restore this backup'}
            </button>
          </div>

          {result && (
            <div className="space-y-4 rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.06] p-4">
              <p className="flex items-center gap-2 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="h-4 w-4" /> Restore complete
              </p>

              <div className="grid gap-1.5 sm:grid-cols-2">
                {Object.entries(result.collections || {}).map(([key, count]) => (
                  <div key={key} className="flex items-center justify-between gap-3 text-xs text-soft">
                    <span>{COLLECTION_LABELS[key] || key}</span>
                    <span className="font-semibold text-ink">{count}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between gap-3 text-xs text-soft">
                  <span>Accounts added / updated</span>
                  <span className="font-semibold text-ink">
                    {result.accounts?.inserted || 0} / {result.accounts?.updated || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3 text-xs text-soft">
                  <span>Uploaded files restored</span>
                  <span className="font-semibold text-ink">{result.files?.written || 0}</span>
                </div>
              </div>

              {result.warnings?.length > 0 && (
                <ul className="list-disc space-y-1 pl-5 text-[0.72rem] leading-relaxed text-soft">
                  {result.warnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              )}

              <button type="button" className="btn btn-accent btn-sm" onClick={() => window.location.reload()}>
                Reload the site
              </button>
            </div>
          )}
        </div>
      </Panel>
    </div>
  );
}
