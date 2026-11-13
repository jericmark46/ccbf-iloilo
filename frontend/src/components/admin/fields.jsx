import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Baseline,
  Bold,
  Eraser,
  Eye,
  Film,
  Image as ImageIcon,
  Italic,
  Library,
  Link2,
  List as ListIcon,
  ListOrdered,
  Pencil,
  Play,
  Quote,
  Redo2,
  Strikethrough,
  Trash2,
  Underline,
  Undo2,
  Upload,
  X,
} from 'lucide-react';
import { api, getError } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { MediaPicker } from './MediaPicker';
import { Spinner } from '../ui/Loaders';
import { cn } from '../../lib/utils';
import { sanitizeRich, toEditorHtml } from '../../lib/richText';

const isVideoUrl = (url = '') => /\.(mp4|webm|ogg|mov|m4v)(\?|#|$)/i.test(url);

export function Field({ label, hint, required, error, children, className }) {
  return (
    <div className={cn('block', className)}>
      {label && (
        <span className="mb-1.5 flex items-baseline gap-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-soft">
          {label}
          {required && <span className="text-accent">*</span>}
        </span>
      )}
      {children}
      {hint && !error && <span className="mt-1.5 block text-[0.7rem] leading-relaxed text-faint">{hint}</span>}
      {error && <span className="mt-1.5 block text-[0.7rem] text-red-500">{error}</span>}
    </div>
  );
}

export function TextField({ label, hint, required, className, ...props }) {
  return (
    <Field label={label} hint={hint} required={required} className={className}>
      <input className="field" required={required} {...props} />
    </Field>
  );
}

export function TextAreaField({ label, hint, required, rows = 4, className, ...props }) {
  return (
    <Field label={label} hint={hint} required={required} className={className}>
      <textarea className="field" rows={rows} required={required} {...props} />
    </Field>
  );
}

export function SelectField({ label, hint, options = [], className, children, ...props }) {
  return (
    <Field label={label} hint={hint} className={className}>
      <select className="field appearance-none" {...props}>
        {children ||
          options.map((option) => {
            const value = typeof option === 'string' ? option : option.value;
            const text = typeof option === 'string' ? option : option.label;
            return (
              <option key={value} value={value}>
                {text}
              </option>
            );
          })}
      </select>
    </Field>
  );
}

export function MediaField({ label, hint, value = '', onChange, type = 'image', className }) {
  const toast = useToast();
  const fileRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const video = type === 'video' || isVideoUrl(value);

  const uploadFile = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const body = new FormData();
      body.append('file', file);
      const { data } = await api.post('/admin/media/upload', body);
      onChange(data.media.url);
      toast.success('File uploaded.');
    } catch (err) {
      toast.error(getError(err));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <Field label={label} hint={hint} className={className}>
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative grid h-24 w-full shrink-0 place-items-center overflow-hidden rounded-2xl border border-line bg-surface sm:w-40">
          {value ? (
            video ? (
              <video
                src={value}
                className="h-full w-full object-cover"
                muted
                playsInline
                preload="metadata"
                aria-hidden="true"
              />
            ) : (
              <img src={value} alt="" className="h-full w-full object-cover" loading="lazy" />
            )
          ) : (
            <ImageIcon className="h-6 w-6 text-faint" />
          )}
          {video && value && (
            <a
              href={value}
              target="_blank"
              rel="noreferrer"
              aria-label="Open video preview"
              className="absolute inset-0 grid place-items-center bg-black/25 text-white transition hover:bg-black/40"
            >
              <Play className="h-5 w-5" fill="currentColor" />
            </a>
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Link2 className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
              <input
                className="field py-2.5 pl-10"
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder="/uploads/file.jpg or https://…"
              />
            </div>
            {value && (
              <button
                type="button"
                className="icon-btn h-10 w-10 shrink-0"
                onClick={() => onChange('')}
                aria-label="Clear media"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <input
              ref={fileRef}
              type="file"
              accept={type === 'video' ? 'video/*' : 'image/*'}
              className="hidden"
              onChange={(event) => uploadFile(event.target.files?.[0])}
            />
            <button
              type="button"
              className="btn btn-accent btn-sm"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? <Spinner className="h-4 w-4 text-current" /> : <Upload className="h-4 w-4" />}
              {uploading ? 'Uploading…' : type === 'video' ? 'Upload video' : 'Upload image'}
            </button>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setOpen(true)}>
              <Library className="h-4 w-4" /> Media library
            </button>
            {value && (
              <a
                href={value}
                target="_blank"
                rel="noreferrer"
                className="btn btn-ghost btn-sm"
              >
                <Eye className="h-4 w-4" /> Preview
              </a>
            )}
          </div>
        </div>
      </div>
      <MediaPicker
        open={open}
        onClose={() => setOpen(false)}
        onSelect={(media) => onChange(media.url)}
        type={type}
      />
    </Field>
  );
}

const SIZE_OPTIONS = [
  { label: 'Small', value: '13px' },
  { label: 'Normal', value: '16px' },
  { label: 'Large', value: '20px' },
  { label: 'Extra large', value: '26px' },
];

const SIZE_LEVELS = { 1: '12px', 2: '13px', 3: '16px', 4: '18px', 5: '24px', 6: '32px', 7: '36px' };
const SIZE_KEYWORDS = {
  'x-small': '12px',
  small: '13px',
  medium: '16px',
  large: '18px',
  'x-large': '24px',
  'xx-large': '32px',
  'xxx-large': '36px',
};

function ToolButton({ icon: Icon, label, onClick, active = false }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className={cn(
        'grid h-8 w-8 place-items-center rounded-lg text-soft transition hover:bg-ink/5 hover:text-ink',
        active && 'bg-accent/15 text-accent'
      )}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

export function RichTextField({ label, hint, value = '', onChange, rows = 14, className }) {
  const editorRef = useRef(null);
  const lastValue = useRef(null);
  const rangeRef = useRef(null);
  const [active, setActive] = useState({});
  const [color, setColor] = useState('#9a6b1f');
  const [preview, setPreview] = useState(false);
  const previewHtml = useMemo(() => sanitizeRich(value || ''), [value]);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || lastValue.current === value) return;
    const html = toEditorHtml(value);
    if (editor.innerHTML !== html) editor.innerHTML = html;
    lastValue.current = value;
  }, [value]);

  const refresh = () => {
    const editor = editorRef.current;
    if (!editor) return;
    try {
      const block = String(document.queryCommandValue('formatBlock') || 'p').replace(/[<>]/g, '').toLowerCase();
      setActive({
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        underline: document.queryCommandState('underline'),
        strike: document.queryCommandState('strikeThrough'),
        unordered: document.queryCommandState('insertUnorderedList'),
        ordered: document.queryCommandState('insertOrderedList'),
        block: block || 'p',
      });
    } catch {
      setActive({});
    }
  };

  const emit = () => {
    const editor = editorRef.current;
    if (!editor) return;
    lastValue.current = editor.innerHTML;
    onChange(editor.innerHTML);
    refresh();
  };

  const normalize = () => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.querySelectorAll('font[size]').forEach((font) => {
      const span = document.createElement('span');
      span.style.fontSize = SIZE_LEVELS[font.getAttribute('size')] || '16px';
      span.innerHTML = font.innerHTML;
      font.replaceWith(span);
    });
    editor.querySelectorAll('span[style*="font-size"]').forEach((span) => {
      const size = span.style.fontSize;
      if (SIZE_KEYWORDS[size]) span.style.fontSize = SIZE_KEYWORDS[size];
    });
    editor.querySelectorAll('a[href]').forEach((anchor) => {
      anchor.setAttribute('rel', 'noopener noreferrer');
      if (anchor.getAttribute('href').startsWith('http')) anchor.setAttribute('target', '_blank');
    });
  };

  const rememberRange = () => {
    const editor = editorRef.current;
    const selection = window.getSelection();
    if (editor && selection?.rangeCount && editor.contains(selection.anchorNode)) {
      rangeRef.current = selection.getRangeAt(0).cloneRange();
    }
    refresh();
  };

  const restoreRange = () => {
    const editor = editorRef.current;
    const selection = window.getSelection();
    if (!editor || !selection) return;
    const inside = selection.rangeCount && editor.contains(selection.anchorNode);
    if (inside && !selection.isCollapsed) return;
    if (rangeRef.current) {
      selection.removeAllRanges();
      selection.addRange(rangeRef.current);
    }
  };

  const run = (command, argument) => {
    const editor = editorRef.current;
    editor?.focus();
    restoreRange();
    document.execCommand('styleWithCSS', false, true);
    document.execCommand(command, false, argument);
    normalize();
    emit();
    rememberRange();
  };

  const setBlock = (block) => run('formatBlock', `<${block}>`);

  const applySize = (size) => {
    if (!size) return;
    const editor = editorRef.current;
    editor?.focus();
    restoreRange();
    const selection = window.getSelection();
    let range = null;
    if (selection?.rangeCount && !selection.isCollapsed && editor?.contains(selection.anchorNode)) {
      range = selection.getRangeAt(0);
    } else if (rangeRef.current) {
      range = rangeRef.current;
    }
    if (!editor || !range || !editor.contains(range.commonAncestorContainer)) return;
    const span = document.createElement('span');
    span.style.fontSize = size;
    try {
      range.surroundContents(span);
    } catch {
      span.appendChild(range.extractContents());
      range.insertNode(span);
    }
    selection.removeAllRanges();
    const next = document.createRange();
    next.selectNodeContents(span);
    selection.addRange(next);
    rangeRef.current = next.cloneRange();
    emit();
  };

  const addLink = () => {
    const url = window.prompt('Paste the link address:', 'https://');
    if (!url || url === 'https://') return;
    run('createLink', url);
  };

  const addImage = () => {
    const url = window.prompt('Paste the image URL:', 'https://');
    if (!url || url === 'https://') return;
    run('insertImage', url);
  };

  const applyColor = (nextColor) => {
    setColor(nextColor);
    run('foreColor', nextColor);
  };

  return (
    <Field label={label} hint={hint} className={className}>
      <div className="overflow-hidden rounded-2xl border border-line bg-elevated focus-within:border-accent/60 focus-within:ring-4 focus-within:ring-accent/10">
        <div className="flex flex-wrap items-center gap-1 border-b border-line/70 bg-surface/70 px-2 py-1.5">
          {!preview && (
            <>
          <select
            value={active.block || 'p'}
            onChange={(event) => setBlock(event.target.value)}
            className="h-8 rounded-lg border border-line bg-elevated px-2 text-[0.72rem] font-semibold text-ink outline-none"
            aria-label="Text style"
          >
            <option value="p">Paragraph</option>
            <option value="h2">Heading 2</option>
            <option value="h3">Heading 3</option>
            <option value="blockquote">Quote</option>
          </select>

          <span className="mx-1 h-5 w-px bg-line" />

          <ToolButton icon={Bold} label="Bold" active={active.bold} onClick={() => run('bold')} />
          <ToolButton icon={Italic} label="Italic" active={active.italic} onClick={() => run('italic')} />
          <ToolButton icon={Underline} label="Underline" active={active.underline} onClick={() => run('underline')} />
          <ToolButton
            icon={Strikethrough}
            label="Strikethrough"
            active={active.strike}
            onClick={() => run('strikeThrough')}
          />

          <span className="mx-1 h-5 w-px bg-line" />

          <label
            title="Text color"
            className="relative grid h-8 w-8 cursor-pointer place-items-center rounded-lg text-soft transition hover:bg-ink/5 hover:text-ink"
          >
            <Baseline className="h-4 w-4" />
            <span className="absolute bottom-1 right-1.5 h-1 w-3 rounded-full" style={{ background: color }} />
            <input
              type="color"
              value={color}
              onChange={(event) => applyColor(event.target.value)}
              className="sr-only"
              aria-label="Text color"
            />
          </label>
          <select
            value=""
            onChange={(event) => applySize(event.target.value)}
            className="h-8 rounded-lg border border-line bg-elevated px-2 text-[0.72rem] font-semibold text-ink outline-none"
            aria-label="Font size"
          >
            <option value="">Size</option>
            {SIZE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <span className="mx-1 h-5 w-px bg-line" />

          <ToolButton
            icon={ListIcon}
            label="Bullet list"
            active={active.unordered}
            onClick={() => run('insertUnorderedList')}
          />
          <ToolButton
            icon={ListOrdered}
            label="Numbered list"
            active={active.ordered}
            onClick={() => run('insertOrderedList')}
          />
          <ToolButton icon={Quote} label="Quote" active={active.block === 'blockquote'} onClick={() => setBlock('blockquote')} />
          <ToolButton icon={Link2} label="Link" onClick={addLink} />
          <ToolButton icon={ImageIcon} label="Insert image" onClick={addImage} />

          <span className="mx-1 h-5 w-px bg-line" />

          <ToolButton icon={AlignLeft} label="Align left" onClick={() => run('justifyLeft')} />
          <ToolButton icon={AlignCenter} label="Align center" onClick={() => run('justifyCenter')} />
          <ToolButton icon={AlignRight} label="Align right" onClick={() => run('justifyRight')} />

          <span className="mx-1 h-5 w-px bg-line" />

          <ToolButton icon={Undo2} label="Undo" onClick={() => run('undo')} />
          <ToolButton icon={Redo2} label="Redo" onClick={() => run('redo')} />
          <ToolButton icon={Eraser} label="Clear formatting" onClick={() => run('removeFormat')} />
            </>
          )}
          <button
            type="button"
            onClick={() => setPreview((on) => !on)}
            aria-pressed={preview}
            className={cn(
              'ml-auto inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-[0.66rem] font-semibold uppercase tracking-[0.12em] transition',
              preview
                ? 'border-accent/40 bg-accent/10 text-accent'
                : 'border-line text-soft hover:border-accent/40 hover:text-accent'
            )}
          >
            {preview ? <Pencil className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            {preview ? 'Edit' : 'Website view'}
          </button>
        </div>

        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          role="textbox"
          aria-multiline="true"
          aria-label={label || 'Rich text content'}
          data-placeholder="Write your content, then select text to make it bold, colored, larger, and more."
          onInput={emit}
          onKeyUp={rememberRange}
          onMouseUp={rememberRange}
          onTouchEnd={rememberRange}
          onFocus={refresh}
          className={cn(
            'rich-editor prose-church w-full px-4 py-3 text-[0.95rem] text-ink outline-none',
            preview && 'hidden'
          )}
          style={{ minHeight: `${Math.max(10, rows * 1.45)}rem` }}
        />
        {preview && (
          <div
            className="rich-preview prose-church rich-content w-full px-4 py-3 text-[0.95rem] text-ink"
            style={{ minHeight: `${Math.max(10, rows * 1.45)}rem` }}
          >
            {previewHtml ? (
              <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
            ) : (
              <p className="text-faint">Nothing to preview yet.</p>
            )}
          </div>
        )}
      </div>
      <span className="mt-1.5 block text-[0.68rem] text-faint">
        {preview
          ? 'Website preview — this is how the content will appear to visitors.'
          : 'Select text first, then choose bold, color, or size. Existing Markdown content is converted automatically when edited.'}
      </span>
    </Field>
  );
}

export function MediaListField({ label, hint, items = [], onChange, className }) {
  const toast = useToast();
  const fileRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [url, setUrl] = useState('');
  const [type, setType] = useState('image');

  const add = (next) => onChange([...(items || []), next]);
  const remove = (index) => onChange(items.filter((_, position) => position !== index));

  const uploadFile = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const body = new FormData();
      body.append('file', file);
      const { data } = await api.post('/admin/media/upload', body);
      add({
        url: data.media.url,
        type: data.media.type === 'video' || isVideoUrl(data.media.url) ? 'video' : 'image',
      });
      toast.success('File uploaded.');
    } catch (err) {
      toast.error(getError(err));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <Field label={label} hint={hint} className={className}>
      <div className="space-y-2.5">
        {(items || []).map((item, index) => {
          const video = item.type === 'video' || isVideoUrl(item.url);
          return (
            <div
              key={`${item.url}-${index}`}
              className="flex items-center gap-3 rounded-2xl border border-line bg-surface/60 p-2.5"
            >
              <div className="grid h-12 w-16 shrink-0 place-items-center overflow-hidden rounded-xl bg-ink/5">
                {video ? (
                  <Film className="h-4 w-4 text-faint" />
                ) : (
                  <img src={item.url} alt="" className="h-full w-full object-cover" loading="lazy" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs text-ink">{item.url}</p>
                <p className="mt-0.5 text-[0.62rem] uppercase tracking-[0.12em] text-faint">
                  {video ? 'Video' : 'Image'}
                </p>
              </div>
              <a
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="icon-btn h-8 w-8 shrink-0"
                aria-label={video ? 'Open video in a new tab' : 'Open image in a new tab'}
              >
                <Eye className="h-3.5 w-3.5" />
              </a>
              <button
                type="button"
                className="icon-btn h-8 w-8 shrink-0"
                onClick={() => remove(index)}
                aria-label="Remove media"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}

        <div className="flex flex-col gap-2 rounded-2xl border border-dashed border-line p-3 sm:flex-row">
          <input
            className="field py-2.5"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="Paste a media URL"
          />
          <select className="field w-full py-2.5 sm:w-32" value={type} onChange={(event) => setType(event.target.value)}>
            <option value="image">Image</option>
            <option value="video">Video</option>
          </select>
          <button
            type="button"
            className="btn btn-outline btn-sm shrink-0"
            onClick={() => {
              if (!url.trim()) return;
              add({ url: url.trim(), type });
              setUrl('');
            }}
          >
            <Link2 className="h-4 w-4" /> Add
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*,video/*"
            className="hidden"
            onChange={(event) => uploadFile(event.target.files?.[0])}
          />
          <button
            type="button"
            className="btn btn-accent btn-sm shrink-0"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? <Spinner className="h-4 w-4 text-current" /> : <Upload className="h-4 w-4" />}
            {uploading ? 'Uploading…' : 'Upload'}
          </button>
          <button type="button" className="btn btn-ghost btn-sm shrink-0" onClick={() => setOpen(true)}>
            <Library className="h-4 w-4" /> Library
          </button>
        </div>
      </div>
      <MediaPicker
        open={open}
        onClose={() => setOpen(false)}
        onSelect={(media) => add({ url: media.url, type: media.type })}
        type="all"
      />
    </Field>
  );
}
