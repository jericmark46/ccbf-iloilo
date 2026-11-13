import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Copy,
  Eye,
  Film,
  Image as ImageIcon,
  Link2,
  Plus,
  Trash2,
  Upload,
} from 'lucide-react';
import { api, getError } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { useCopyToClipboard } from '../../hooks/useUi';
import { PageHeader, Panel, Toolbar, FilterChips } from '../../components/admin/AdminUI';
import { Field } from '../../components/admin/fields';
import { MediaPicker } from '../../components/admin/MediaPicker';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { InlineLoader, Spinner } from '../../components/ui/Loaders';
import { formatDate } from '../../lib/dates';

function sizeLabel(bytes) {
  if (!bytes) return 'Linked';
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let index = 0;
  while (value >= 1024 && index < units.length - 1) {
    value /= 1024;
    index += 1;
  }
  return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
}

export default function MediaAdmin() {
  const toast = useToast();
  const { copied, copy } = useCopyToClipboard();
  const fileRef = useRef(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState('');
  const [type, setType] = useState('all');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [preview, setPreview] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [removing, setRemoving] = useState(false);
  const [urlOpen, setUrlOpen] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [urlForm, setUrlForm] = useState({ url: '', type: 'image' });
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 18 };
      if (type !== 'all') params.type = type;
      const { data } = await api.get('/admin/media', { params });
      setItems(data.items || []);
      setPages(data.pages || 1);
      setTotal(data.total || 0);
    } catch (err) {
      toast.error(getError(err));
    } finally {
      setLoading(false);
    }
  }, [page, type, toast]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [type]);

  const uploadFiles = async (fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    try {
      for (let index = 0; index < files.length; index += 1) {
        setUploading(`Uploading ${index + 1} of ${files.length}…`);
        const body = new FormData();
        body.append('file', files[index]);
        await api.post('/admin/media/upload', body);
      }
      toast.success(files.length > 1 ? `${files.length} files uploaded.` : 'File uploaded.');
      setPage(1);
      load();
    } catch (err) {
      toast.error(getError(err));
    } finally {
      setUploading('');
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const addUrl = async (event) => {
    event.preventDefault();
    if (!urlForm.url.trim()) return;
    setAdding(true);
    try {
      await api.post('/admin/media', {
        url: urlForm.url.trim(),
        type: urlForm.type,
        originalName: 'Linked media',
      });
      toast.success('Media link added.');
      setUrlOpen(false);
      setUrlForm({ url: '', type: 'image' });
      load();
    } catch (err) {
      toast.error(getError(err));
    } finally {
      setAdding(false);
    }
  };

  const doCopy = async (media) => {
    const ok = await copy(media.url);
    if (ok) toast.success('Media URL copied.');
    else toast.error('Could not copy the URL.');
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setRemoving(true);
    try {
      await api.delete(`/admin/media/${deleting.id}`);
      toast.success('Media deleted.');
      setDeleting(null);
      setPreview(null);
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
        title="Media library"
        description="Upload and reuse images and videos across updates, pages, ministries, and the site background."
        actions={
          <>
            <input
              ref={fileRef}
              type="file"
              multiple
              accept="image/*,video/*"
              className="hidden"
              onChange={(event) => uploadFiles(event.target.files)}
            />
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => setUrlOpen(true)}
            >
              <Link2 className="h-3.5 w-3.5" /> Add link
            </button>
            <button
              type="button"
              className="btn btn-accent btn-sm"
              onClick={() => fileRef.current?.click()}
              disabled={Boolean(uploading)}
            >
              {uploading ? <Spinner className="h-4 w-4 text-current" /> : <Upload className="h-3.5 w-3.5" />}
              {uploading || 'Upload files'}
            </button>
          </>
        }
      />

      <Panel>
        <div className="flex flex-col gap-3 border-b border-line/70 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <FilterChips
            value={type}
            onChange={setType}
            options={[
              { id: 'all', label: 'All media' },
              { id: 'image', label: 'Images' },
              { id: 'video', label: 'Videos' },
            ]}
          />
          <div className="flex items-center gap-2 text-[0.7rem] text-faint">
            <span>{total} files</span>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setLibraryOpen(true)}>
              <Eye className="h-3.5 w-3.5" /> Browse
            </button>
          </div>
        </div>

        {loading ? (
          <InlineLoader label="Loading media…" />
        ) : items.length === 0 ? (
          <EmptyState
            icon={ImageIcon}
            title="No media yet"
            description="Upload images and videos, or link to media hosted elsewhere. Files up to 150 MB are supported."
            action={
              <button type="button" className="btn btn-accent btn-sm" onClick={() => fileRef.current?.click()}>
                <Upload className="h-3.5 w-3.5" /> Upload your first file
              </button>
            }
            className="m-5"
          />
        ) : (
          <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 sm:p-5 lg:grid-cols-4 xl:grid-cols-5">
            {items.map((media) => (
              <div
                key={media.id}
                className="group overflow-hidden rounded-2xl border border-line bg-surface/60"
              >
                <button
                  type="button"
                  onClick={() => setPreview(media)}
                  className="relative block aspect-[4/3] w-full bg-ink/5"
                  aria-label="Preview media"
                >
                  {media.type === 'video' ? (
                    <>
                      <video src={media.url} className="h-full w-full object-cover" muted preload="metadata" />
                      <span className="absolute inset-0 grid place-items-center bg-black/25 text-white">
                        <Film className="h-6 w-6" />
                      </span>
                    </>
                  ) : (
                    <img src={media.url} alt={media.originalName || ''} className="h-full w-full object-cover" loading="lazy" />
                  )}
                </button>
                <div className="px-3 py-2.5">
                  <p className="truncate text-[0.72rem] font-medium text-ink">
                    {media.originalName || 'Linked media'}
                  </p>
                  <p className="mt-0.5 text-[0.62rem] text-faint">
                    {sizeLabel(media.size)} · {formatDate(media.createdAt)}
                  </p>
                  <div className="mt-2 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => doCopy(media)}
                      className="icon-btn h-7 w-7"
                      aria-label="Copy URL"
                      title={copied ? 'Copied!' : 'Copy URL'}
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreview(media)}
                      className="icon-btn h-7 w-7"
                      aria-label="Preview"
                    >
                      <Eye className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleting(media)}
                      className="icon-btn ml-auto h-7 w-7 hover:border-red-500/40 hover:text-red-500"
                      aria-label="Delete media"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {pages > 1 && (
          <div className="flex items-center justify-between gap-3 border-t border-line/70 px-5 py-3">
            <p className="text-[0.7rem] text-faint">
              Page {page} of {pages}
            </p>
            <div className="flex gap-2">
              <button type="button" className="btn btn-outline btn-sm" disabled={page <= 1} onClick={() => setPage((prev) => prev - 1)}>
                Previous
              </button>
              <button type="button" className="btn btn-outline btn-sm" disabled={page >= pages} onClick={() => setPage((prev) => prev + 1)}>
                Next
              </button>
            </div>
          </div>
        )}
      </Panel>

      <Modal open={urlOpen} onClose={() => setUrlOpen(false)} title="Add media from a link" size="md">
        <form onSubmit={addUrl} className="space-y-5">
          <Field label="Media URL" hint="Must start with https:// or / for a local path.">
            <input
              className="field"
              value={urlForm.url}
              onChange={(event) => setUrlForm((prev) => ({ ...prev, url: event.target.value }))}
              placeholder="https://cdn.example.com/worship.jpg"
              required
            />
          </Field>
          <Field label="Type">
            <div className="flex gap-2">
              {['image', 'video'].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setUrlForm((prev) => ({ ...prev, type: value }))}
                  className={
                    urlForm.type === value
                      ? 'btn btn-accent btn-sm flex-1'
                      : 'btn btn-outline btn-sm flex-1'
                  }
                >
                  {value === 'image' ? <ImageIcon className="h-4 w-4" /> : <Film className="h-4 w-4" />}
                  {value === 'image' ? 'Image' : 'Video'}
                </button>
              ))}
            </div>
          </Field>
          <div className="flex justify-end gap-2">
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setUrlOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-accent btn-sm" disabled={adding}>
              {adding && <Spinner className="h-4 w-4 text-current" />}
              Add to library
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(preview)}
        onClose={() => setPreview(null)}
        title={preview?.originalName || 'Media preview'}
        description={preview ? `${preview.type === 'video' ? 'Video' : 'Image'} · ${sizeLabel(preview.size)} · added ${formatDate(preview.createdAt)}` : ''}
        size="lg"
        footer={
          preview && (
            <>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => doCopy(preview)}>
                <Copy className="h-4 w-4" /> Copy URL
              </button>
              <button
                type="button"
                className="btn btn-sm bg-red-600 text-white hover:bg-red-700"
                onClick={() => setDeleting(preview)}
              >
                <Trash2 className="h-4 w-4" /> Delete
              </button>
            </>
          )
        }
      >
        {preview && (
          <div className="space-y-4">
            <div className="overflow-hidden rounded-2xl border border-line bg-black/40">
              {preview.type === 'video' ? (
                <video src={preview.url} controls className="max-h-[60vh] w-full" />
              ) : (
                <img src={preview.url} alt={preview.originalName || ''} className="max-h-[60vh] w-full object-contain" />
              )}
            </div>
            <div className="rounded-2xl border border-line bg-surface/60 px-4 py-3">
              <p className="text-[0.6rem] font-semibold uppercase tracking-[0.18em] text-faint">File URL</p>
              <p className="mt-1 break-all text-xs text-soft">{preview.url}</p>
            </div>
            <Badge>{preview.type === 'video' ? 'Video' : 'Image'}</Badge>
          </div>
        )}
      </Modal>

      <MediaPicker open={libraryOpen} onClose={() => setLibraryOpen(false)} type="all" />

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        loading={removing}
        title="Delete this media?"
        description="Uploaded files are removed from the server. Any content still using this URL will show a broken image."
      />
    </div>
  );
}
