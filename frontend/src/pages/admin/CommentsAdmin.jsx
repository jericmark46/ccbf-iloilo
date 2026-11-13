import { useCallback, useEffect, useState } from 'react';
import { Check, MessageCircle, ShieldCheck, Trash2, Undo2 } from 'lucide-react';
import { api, getError } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { PageHeader, Panel, FilterChips } from '../../components/admin/AdminUI';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { InlineLoader } from '../../components/ui/Loaders';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { relativeTime } from '../../lib/dates';

const initials = (name = '') =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || '?';

export default function CommentsAdmin() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [busy, setBusy] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [removing, setRemoving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/comments', { params: { limit: 100 } });
      setItems(data.items || []);
    } catch (err) {
      toast.error(getError(err));
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleApproved = async (comment) => {
    setBusy(comment.id);
    try {
      const { data } = await api.patch(`/admin/comments/${comment.id}`, {
        approved: !comment.approved,
      });
      setItems((prev) =>
        prev.map((item) =>
          item.id === comment.id ? { ...item, approved: data.comment.approved } : item
        )
      );
      toast.success(data.comment.approved ? 'Comment approved.' : 'Comment hidden from the site.');
    } catch (err) {
      toast.error(getError(err));
    } finally {
      setBusy(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setRemoving(true);
    try {
      await api.delete(`/admin/comments/${deleting.id}`);
      toast.success('Comment deleted.');
      setItems((prev) => prev.filter((item) => item.id !== deleting.id));
      setDeleting(null);
    } catch (err) {
      toast.error(getError(err));
    } finally {
      setRemoving(false);
    }
  };

  const visible = items.filter((comment) => {
    if (filter === 'pending') return !comment.approved;
    if (filter === 'approved') return comment.approved;
    return true;
  });

  const pendingCount = items.filter((comment) => !comment.approved).length;

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Community"
        title="Comments"
        description="Review what the church family is saying. Pending comments are hidden from the public until approved."
        actions={
          <Badge variant={pendingCount ? 'warning' : 'success'}>
            {pendingCount ? `${pendingCount} awaiting review` : 'All reviewed'}
          </Badge>
        }
      />

      <Panel>
        <div className="border-b border-line/70 px-4 py-4 sm:px-5">
          <FilterChips
            value={filter}
            onChange={setFilter}
            options={[
              { id: 'all', label: `All (${items.length})` },
              { id: 'pending', label: `Pending (${pendingCount})` },
              { id: 'approved', label: `Approved (${items.length - pendingCount})` },
            ]}
          />
        </div>

        {loading ? (
          <InlineLoader label="Loading comments…" />
        ) : visible.length === 0 ? (
          <EmptyState
            icon={MessageCircle}
            title={items.length ? 'Nothing in this view' : 'No comments yet'}
            description={
              items.length
                ? 'Try another filter — everything here is already handled.'
                : 'Comments from the website will appear here for review.'
            }
            className="m-5"
          />
        ) : (
          <div className="divide-y divide-line/70">
            {visible.map((comment) => (
              <article key={comment.id} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:px-5">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent/10 text-[0.68rem] font-bold text-accent">
                  {initials(comment.name)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-ink">{comment.name}</p>
                    <Badge variant={comment.approved ? 'success' : 'warning'}>
                      {comment.approved ? 'Approved' : 'Pending'}
                    </Badge>
                    <span className="text-[0.65rem] text-faint">{relativeTime(comment.createdAt)}</span>
                  </div>
                  <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-soft">{comment.body}</p>
                  <p className="mt-2 text-[0.68rem] text-faint">
                    On <span className="text-soft">{comment.postTitle}</span>
                  </p>
                </div>
                <div className="flex shrink-0 items-start gap-1.5 self-end sm:self-start">
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => toggleApproved(comment)}
                    disabled={busy === comment.id}
                  >
                    {comment.approved ? (
                      <>
                        <Undo2 className="h-3.5 w-3.5" /> Unapprove
                      </>
                    ) : (
                      <>
                        <Check className="h-3.5 w-3.5" /> Approve
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    className="icon-btn h-9 w-9 hover:border-red-500/40 hover:text-red-500"
                    onClick={() => setDeleting(comment)}
                    aria-label="Delete comment"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </Panel>

      <div className="flex items-start gap-3 rounded-3xl border border-accent/20 bg-accent/[0.05] px-5 py-4">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
        <p className="text-xs leading-relaxed text-soft">
          Comments are published after approval. New comments from the website appear here as
          pending so the church can keep conversations gracious and on topic.
        </p>
      </div>

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        loading={removing}
        title="Delete this comment?"
        description="The comment will be permanently removed from the update."
      />
    </div>
  );
}
