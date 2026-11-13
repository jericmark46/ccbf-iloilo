import { useCallback, useEffect, useRef, useState } from 'react';
import { Film, Image as ImageIcon, Link2, Play, Plus, Upload } from 'lucide-react';
import { api, getError } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { Modal } from '../ui/Modal';
import { Spinner } from '../ui/Loaders';
import { EmptyState } from '../ui/EmptyState';
import { FilterChips, SearchInput } from './AdminUI';
import { cn } from '../../lib/utils';

function sizeLabel(bytes) {
  if (!bytes) return '';
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let index = 0;
  while (value >= 1024 && index < units.length - 1) {
    value /= 1024;
    index += 1;
  }
  return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
}

export function MediaPicker({ open, onClose, onSelect, type = 'all' }) {
  const toast = useToast();
  const fileRef = useRef(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState('');
  const [filter, setFilter] = useState(type === 'all' ? 'all' : type);
  const [query, setQuery] = useState('');
  const [url, setUrl] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (open) setFilter(type === 'all' ? 'all' : type);
  }, [open, type]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: 60 };
      if (filter !== 'all') params.type = filter;
      const { data } = await api.get('/admin/media', { params });
      setItems(data.items || []);
    } catch (err) {
      toast.error(getError(err));
    } finally {
      setLoading(false);
    }
  }, [filter, toast]);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  const choose = (media) => {
    onSelect?.(media);
    onClose?.();
  };

  const uploadFiles = async (fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    let last = null;
    try {
      for (let index = 0; index < files.length; index += 1) {
        setUploading(`Uploading ${index + 1} of ${files.length}…`);
        const body = new FormData();
        body.append('file', files[index]);
        const { data } = await api.post('/admin/media/upload', body);
        last = data.media;
      }
      toast.success(files.length > 1 ? `${files.length} files uploaded.` : 'File uploaded.');
      await load();
      if (last && onSelect) choose(last);
    } catch (err) {
      toast.error(getError(err));
    } finally {
      setUploading('');
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const addUrl = async () => {
    if (!url.trim()) return;
    setAdding(true);
    try {
      const { data } = await api.post('/admin/media', {
        url: url.trim(),
        type: filter === 'video' ? 'video' : 'image',
        originalName: 'Linked media',
      });
      toast.success('Media link added.');
      setUrl('');
      await load();
      if (data.media && onSelect) choose(data.media);
    } catch (err) {
      toast.error(getError(err));
    } finally {
      setAdding(false);
    }
  };

  const visible = query
    ? items.filter((item) =>
        `${item.originalName || ''} ${item.url}`.toLowerCase().includes(query.toLowerCase())
      )
    : items;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Media library"
      description="Choose a file for this field, or add something new."
      size="lg"
    >
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <SearchInput value={query} onChange={setQuery} placeholder="Search media…" />
          <FilterChips
            value={filter}
            onChange={setFilter}
            options={[
              { id: 'all', label: 'All' },
              { id: 'image', label: 'Images' },
              { id: 'video', label: 'Videos' },
            ]}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            accept={filter === 'video' ? 'video/*' : filter === 'image' ? 'image/*' : 'image/*,video/*'}
            multiple
            className="hidden"
            onChange={(event) => uploadFiles(event.target.files)}
          />
          <button
            type="button"
            className="btn btn-accent btn-sm"
            onClick={() => fileRef.current?.click()}
            disabled={Boolean(uploading)}
          >
            {uploading ? <Spinner className="h-4 w-4 text-current" /> : <Upload className="h-4 w-4" />}
            {uploading || 'Upload files'}
          </button>
          <div className="flex min-w-[16rem] flex-1 items-center gap-2">
            <div className="relative flex-1">
              <Link2 className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
              <input
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                placeholder="Paste an image or video URL"
                className="field py-2.5 pl-10"
              />
            </div>
            <button type="button" className="btn btn-outline btn-sm" onClick={addUrl} disabled={adding}>
              {adding ? <Spinner className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              Add
            </button>
          </div>
        </div>

        <div className="max-h-[24rem] overflow-y-auto rounded-2xl border border-line bg-surface/50 p-3">
          {loading ? (
            <div className="flex items-center justify-center gap-3 py-14 text-sm text-soft">
              <Spinner /> Loading media…
            </div>
          ) : visible.length === 0 ? (
            <EmptyState
              icon={filter === 'video' ? Film : ImageIcon}
              title="Nothing here yet"
              description="Upload a file or add a link to get started."
              className="border-0 bg-transparent py-10"
            />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {visible.map((media) => (
                <button
                  key={media.id}
                  type="button"
                  onClick={() => choose(media)}
                  className="group overflow-hidden rounded-2xl border border-line bg-elevated text-left transition hover:border-accent/50"
                >
                  <div className="relative aspect-[4/3] bg-ink/5">
                    {media.type === 'video' ? (
                      <>
                        <video src={media.url} className="h-full w-full object-cover" muted preload="metadata" />
                        <span className="absolute inset-0 grid place-items-center bg-black/25 text-white">
                          <Play className="h-6 w-6" fill="currentColor" />
                        </span>
                      </>
                    ) : (
                      <img src={media.url} alt={media.originalName || ''} className="h-full w-full object-cover" loading="lazy" />
                    )}
                  </div>
                  <div className="px-2.5 py-2">
                    <p className="truncate text-[0.7rem] font-medium text-ink">
                      {media.originalName || media.url}
                    </p>
                    <p className="mt-0.5 text-[0.62rem] text-faint">
                      {media.type === 'video' ? 'Video' : 'Image'}
                      {media.size ? ` · ${sizeLabel(media.size)}` : ''}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {onSelect && (
          <p className={cn('text-[0.68rem] text-faint')}>
            Tip: files larger than 150 MB cannot be uploaded. Videos may also be linked from a CDN.
          </p>
        )}
      </div>
    </Modal>
  );
}
