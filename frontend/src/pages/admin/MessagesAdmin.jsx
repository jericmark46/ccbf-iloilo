import { useCallback, useEffect, useState } from 'react';
import { Inbox, Mail, MailOpen, Reply, Trash2 } from 'lucide-react';
import { api, getError } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { PageHeader, Panel, FilterChips } from '../../components/admin/AdminUI';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { InlineLoader } from '../../components/ui/Loaders';
import { formatDateTime, relativeTime } from '../../lib/dates';
import { cn } from '../../lib/utils';

export default function MessagesAdmin() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [active, setActive] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [removing, setRemoving] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: 50 };
      if (filter === 'unread') params.unread = 'true';
      const { data } = await api.get('/admin/messages', { params });
      setItems(data.items || []);
      setUnread(data.unread || 0);
    } catch (err) {
      toast.error(getError(err));
    } finally {
      setLoading(false);
    }
  }, [filter, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const openMessage = async (message) => {
    setActive(message);
    if (message.read) return;
    try {
      await api.patch(`/admin/messages/${message.id}`, { read: true });
      setItems((prev) =>
        prev.map((item) => (item.id === message.id ? { ...item, read: true } : item))
      );
      setUnread((prev) => Math.max(0, prev - 1));
      setActive((prev) => (prev && prev.id === message.id ? { ...prev, read: true } : prev));
    } catch {
      // A read receipt is not critical; keep the message open.
    }
  };

  const toggleRead = async (message) => {
    setBusy(true);
    try {
      const { data } = await api.patch(`/admin/messages/${message.id}`, { read: !message.read });
      setItems((prev) =>
        prev.map((item) => (item.id === message.id ? { ...item, read: data.message.read } : item))
      );
      setUnread((prev) => {
        const next = data.message.read ? prev - 1 : prev + 1;
        return Math.max(0, next);
      });
    } catch (err) {
      toast.error(getError(err));
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setRemoving(true);
    try {
      await api.delete(`/admin/messages/${deleting.id}`);
      toast.success('Message deleted.');
      setItems((prev) => prev.filter((item) => item.id !== deleting.id));
      if (!deleting.read) setUnread((prev) => Math.max(0, prev - 1));
      if (active?.id === deleting.id) setActive(null);
      setDeleting(null);
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
        title="Inbox"
        description="Messages sent through the website contact form — prayer requests, visits, and questions."
        actions={
          <Badge variant={unread ? 'warning' : 'success'}>
            {unread ? `${unread} unread` : 'All caught up'}
          </Badge>
        }
      />

      <Panel>
        <div className="border-b border-line/70 px-4 py-4 sm:px-5">
          <FilterChips
            value={filter}
            onChange={setFilter}
            options={[
              { id: 'all', label: 'All messages' },
              { id: 'unread', label: `Unread (${unread})` },
            ]}
          />
        </div>

        {loading ? (
          <InlineLoader label="Opening the inbox…" />
        ) : items.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title={filter === 'unread' ? 'No unread messages' : 'The inbox is empty'}
            description={
              filter === 'unread'
                ? 'Every message has been read. Well done.'
                : 'Messages from the website contact form will arrive here.'
            }
            className="m-5"
          />
        ) : (
          <div className="divide-y divide-line/70">
            {items.map((message) => (
              <div
                key={message.id}
                role="button"
                tabIndex={0}
                onClick={() => openMessage(message)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    openMessage(message);
                  }
                }}
                className={cn(
                  'flex w-full cursor-pointer items-start gap-3.5 px-4 py-4 text-left transition hover:bg-accent/[0.035] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent/40 sm:px-5',
                  !message.read && 'bg-accent/[0.045]'
                )}
              >
                <span
                  className={cn(
                    'mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl',
                    message.read ? 'bg-ink/5 text-faint' : 'bg-accent/15 text-accent'
                  )}
                >
                  {message.read ? <MailOpen className="h-4 w-4" /> : <Mail className="h-4 w-4" />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className={cn('text-sm', message.read ? 'font-medium text-ink' : 'font-semibold text-ink')}>
                      {message.name}
                    </p>
                    {!message.read && <span className="h-1.5 w-1.5 rounded-full bg-accent" />}
                    <span className="text-[0.65rem] text-faint">{relativeTime(message.createdAt)}</span>
                  </div>
                  <p className={cn('mt-0.5 text-xs', message.subject ? 'text-soft' : 'text-faint')}>
                    {message.subject || 'No subject'}
                  </p>
                  <p className="mt-1 line-clamp-1 text-xs leading-relaxed text-faint">{message.message}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1 self-center">
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(event) => {
                      event.stopPropagation();
                      toggleRead(message);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.stopPropagation();
                        event.preventDefault();
                        toggleRead(message);
                      }
                    }}
                    className={cn('icon-btn h-8 w-8', busy && 'pointer-events-none opacity-50')}
                    aria-label={message.read ? 'Mark unread' : 'Mark read'}
                  >
                    {message.read ? <Mail className="h-3.5 w-3.5" /> : <MailOpen className="h-3.5 w-3.5" />}
                  </span>
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(event) => {
                      event.stopPropagation();
                      setDeleting(message);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.stopPropagation();
                        event.preventDefault();
                        setDeleting(message);
                      }
                    }}
                    className="icon-btn h-8 w-8 hover:border-red-500/40 hover:text-red-500"
                    aria-label="Delete message"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <Modal
        open={Boolean(active)}
        onClose={() => setActive(null)}
        title={active?.subject || 'Message'}
        description={active ? `${active.name} · ${active.email}` : ''}
        size="lg"
        footer={
          active && (
            <>
              <a
                href={`mailto:${active.email}?subject=${encodeURIComponent(`Re: ${active.subject || 'Your message to Calvary Chapel Iloilo'}`)}`}
                className="btn btn-accent btn-sm"
              >
                <Reply className="h-4 w-4" /> Reply by email
              </a>
              <button
                type="button"
                className="btn btn-sm bg-red-600 text-white hover:bg-red-700"
                onClick={() => setDeleting(active)}
              >
                <Trash2 className="h-4 w-4" /> Delete
              </button>
            </>
          )
        }
      >
        {active && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={active.read ? 'success' : 'warning'}>{active.read ? 'Read' : 'Unread'}</Badge>
              <span className="text-[0.68rem] text-faint">{formatDateTime(active.createdAt)}</span>
            </div>
            <div className="rounded-2xl border border-line bg-surface/60 p-5">
              <p className="whitespace-pre-line text-sm leading-relaxed text-ink">{active.message}</p>
            </div>
            <dl className="grid gap-3 rounded-2xl border border-line bg-elevated/60 p-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-[0.62rem] uppercase tracking-[0.16em] text-faint">From</dt>
                <dd className="mt-0.5 text-ink">{active.name}</dd>
              </div>
              <div>
                <dt className="text-[0.62rem] uppercase tracking-[0.16em] text-faint">Email</dt>
                <dd className="mt-0.5 break-all text-ink">{active.email}</dd>
              </div>
              <div>
                <dt className="text-[0.62rem] uppercase tracking-[0.16em] text-faint">Phone</dt>
                <dd className="mt-0.5 text-ink">{active.phone || '—'}</dd>
              </div>
              <div>
                <dt className="text-[0.62rem] uppercase tracking-[0.16em] text-faint">Subject</dt>
                <dd className="mt-0.5 text-ink">{active.subject || '—'}</dd>
              </div>
            </dl>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        loading={removing}
        title="Delete this message?"
        description={`The message from ${deleting?.name || 'this visitor'} will be permanently removed.`}
      />
    </div>
  );
}
