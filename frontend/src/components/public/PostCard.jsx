import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Heart, MessageCircle, Share2, Pin, Send, ChevronDown } from 'lucide-react';
import { api, getError } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { RichContent } from '../ui/Markdown';
import { ImageWithFallback } from '../ui/ImageWithFallback';
import { PostGallery } from './PostGallery';
import { VideoEmbed } from './VideoEmbed';
import { Badge } from '../ui/Badge';
import { Spinner } from '../ui/Loaders';
import { cn, initials } from '../../lib/utils';
import { stripRich } from '../../lib/richText';
import { formatDateTime, relativeTime } from '../../lib/dates';

const LIKED_KEY = 'cc_liked_posts';
const NAME_KEY = 'cc_comment_name';

const readLiked = () => {
  try {
    return new Set(JSON.parse(localStorage.getItem(LIKED_KEY) || '[]'));
  } catch {
    return new Set();
  }
};

export function PostCard({ post, initialCommentsOpen = false, className }) {
  const { user } = useAuth();
  const toast = useToast();
  const [liked, setLiked] = useState(() => readLiked().has(post.id));
  const [likeCount, setLikeCount] = useState(post.likeCount || 0);
  const [likePending, setLikePending] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const [commentsOpen, setCommentsOpen] = useState(initialCommentsOpen);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [name, setName] = useState(() => localStorage.getItem(NAME_KEY) || user?.name || '');
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setLiked(readLiked().has(post.id));
    setLikeCount(post.likeCount || 0);
  }, [post.id, post.likeCount]);

  useEffect(() => {
    if (user?.name && !name) setName(user.name);
  }, [user, name]);

  const isLong = stripRich(post.content || '').length > 520;
  const videos = (post.media || []).filter((item) => item?.url && item.type === 'video');

  const toggleLike = async () => {
    if (likePending) return;
    const next = !liked;
    const previousCount = likeCount;
    setLiked(next);
    setLikeCount((count) => Math.max(0, count + (next ? 1 : -1)));
    setLikePending(true);

    try {
      const { data } = await api.post(`/public/posts/${post.id}/like`, {
        action: next ? 'like' : 'unlike',
      });
      setLikeCount(data.likeCount);
      const stored = readLiked();
      if (next) stored.add(post.id);
      else stored.delete(post.id);
      localStorage.setItem(LIKED_KEY, JSON.stringify([...stored]));
    } catch (error) {
      setLiked(!next);
      setLikeCount(previousCount);
      toast.error(getError(error));
    } finally {
      setLikePending(false);
    }
  };

  const loadComments = async () => {
    setLoadingComments(true);
    try {
      const { data } = await api.get(`/public/posts/${post.id}/comments`);
      setComments(data.comments || []);
      setCommentsLoaded(true);
    } catch (error) {
      toast.error(getError(error));
    } finally {
      setLoadingComments(false);
    }
  };

  const toggleComments = () => {
    const next = !commentsOpen;
    setCommentsOpen(next);
    if (next && !commentsLoaded) loadComments();
  };

  const submitComment = async (event) => {
    event.preventDefault();
    if (!name.trim() || body.trim().length < 3) {
      toast.error('Please share your name and a short message.');
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await api.post(`/public/posts/${post.id}/comments`, {
        name: name.trim(),
        body: body.trim(),
      });
      if (!commentsLoaded) {
        await loadComments();
      } else {
        setComments((current) => [...current, data.comment]);
      }
      localStorage.setItem(NAME_KEY, name.trim());
      setBody('');
      toast.success('Thank you — your comment has been posted.');
    } catch (error) {
      toast.error(getError(error));
    } finally {
      setSubmitting(false);
    }
  };

  const share = async () => {
    const url = `${window.location.origin}/updates/${post.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: post.title || 'Calvary Chapel Iloilo', url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success('Link copied to your clipboard.');
      }
    } catch {
      /* user cancelled */
    }
  };

  const commentCount = commentsLoaded ? comments.length : post.commentCount || 0;

  return (
    <article className={cn('overflow-hidden rounded-3xl border border-line bg-elevated', className)}>
      <header className="flex items-start justify-between gap-4 px-5 pt-5 sm:px-6 sm:pt-6">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-[#3d316e] via-[#251c47] to-[#120d24] text-[0.8rem] font-semibold text-[#e7c77e] ring-1 ring-line">
            {initials(post.authorName || 'Church Admin')}
          </span>
          <div>
            <p className="text-[0.9rem] font-semibold text-ink">{post.authorName || 'Church Admin'}</p>
            <p className="mt-0.5 text-[0.72rem] text-faint" title={formatDateTime(post.createdAt)}>
              {relativeTime(post.createdAt)} · {post.category}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {post.pinned && (
            <Badge variant="accent">
              <Pin className="h-3 w-3" /> Pinned
            </Badge>
          )}
        </div>
      </header>

      <div className="px-5 pb-1 pt-4 sm:px-6">
        {post.title && (
          <h3 className="mb-3 font-display text-[1.45rem] font-semibold leading-snug text-ink">
            {post.title}
          </h3>
        )}

        <div className="relative">
          <div className={cn(isLong && !expanded && 'max-h-[25rem] overflow-hidden')}>
            <RichContent>{post.content}</RichContent>
          </div>
          {isLong && !expanded && (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-elevated to-transparent" />
          )}
        </div>

        {isLong && (
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            className="mt-2 inline-flex items-center gap-1 text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-accent"
          >
            {expanded ? 'Show less' : 'Read more'}
            <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', expanded && 'rotate-180')} />
          </button>
        )}

        {videos.length > 0 && (
          <div className="mt-4 grid gap-3">
            {videos.map((item, index) => (
              <VideoEmbed
                key={item.id || item._id || `${item.url}-${index}`}
                item={item}
                title={post.title || 'Church update'}
              />
            ))}
          </div>
        )}

        {post.coverImage && (
          <div className="mt-5 overflow-hidden rounded-2xl border border-line">
            <ImageWithFallback
              src={post.coverImage}
              alt={post.title || 'Church update'}
              className="max-h-[32rem] w-full object-cover"
            />
          </div>
        )}

        <PostGallery postId={post.id} media={post.media} title={post.title || 'Church update'} />
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-line px-5 py-2.5 text-sm sm:px-6">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={toggleLike}
            className={cn(
              'inline-flex items-center gap-2 rounded-full px-3 py-2 text-[0.8rem] font-medium transition',
              liked ? 'text-rose-500' : 'text-soft hover:bg-ink/5 hover:text-ink'
            )}
            aria-pressed={liked}
            aria-label={liked ? 'Unlike this update' : 'Like this update'}
          >
            <Heart className={cn('h-[18px] w-[18px] transition-transform', liked && 'scale-110 fill-current')} />
            {likeCount > 0 ? likeCount : 'Like'}
          </button>
          <button
            type="button"
            onClick={toggleComments}
            className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-[0.8rem] font-medium text-soft transition hover:bg-ink/5 hover:text-ink"
            aria-expanded={commentsOpen}
          >
            <MessageCircle className="h-[18px] w-[18px]" />
            {commentCount > 0 ? commentCount : 'Comment'}
          </button>
          <button
            type="button"
            onClick={share}
            className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-[0.8rem] font-medium text-soft transition hover:bg-ink/5 hover:text-ink"
          >
            <Share2 className="h-[17px] w-[17px]" />
            <span className="hidden sm:inline">Share</span>
          </button>
        </div>
        {post.pinned && <span className="hidden text-[0.68rem] text-faint sm:block">Church highlight</span>}
      </div>

      <AnimatePresence initial={false}>
        {commentsOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden border-t border-line bg-surface/60"
          >
            <div className="space-y-4 px-5 py-5 sm:px-6">
              {loadingComments ? (
                <div className="flex justify-center py-4">
                  <Spinner />
                </div>
              ) : comments.length === 0 ? (
                <p className="text-center text-[0.82rem] text-faint">
                  No comments yet — be the first to encourage someone today.
                </p>
              ) : (
                <ul className="space-y-4">
                  {comments.map((comment) => (
                    <li key={comment.id} className="flex gap-3">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent/12 text-[0.65rem] font-bold text-accent">
                        {initials(comment.name)}
                      </span>
                      <div className="min-w-0 flex-1 rounded-2xl rounded-tl-sm border border-line bg-elevated px-4 py-3">
                        <div className="flex flex-wrap items-baseline gap-2">
                          <p className="text-[0.82rem] font-semibold text-ink">{comment.name}</p>
                          <p className="text-[0.65rem] text-faint">{relativeTime(comment.createdAt)}</p>
                        </div>
                        <p className="mt-1 whitespace-pre-wrap break-words text-[0.85rem] leading-relaxed text-soft">
                          {comment.body}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              <form onSubmit={submitComment} className="pt-1">
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Your name"
                    maxLength={60}
                    className="field sm:max-w-[11rem]"
                    aria-label="Your name"
                  />
                  <input
                    value={body}
                    onChange={(event) => setBody(event.target.value)}
                    placeholder="Write a word of encouragement…"
                    maxLength={1200}
                    className="field flex-1"
                    aria-label="Your comment"
                  />
                  <button type="submit" className="btn btn-accent" disabled={submitting}>
                    {submitting ? <Spinner className="h-4 w-4 text-current" /> : <Send className="h-4 w-4" />}
                    Send
                  </button>
                </div>
                <p className="mt-2 text-[0.65rem] text-faint">
                  Your name and comment will be visible publicly. Please keep it kind and edifying.
                </p>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </article>
  );
}
