import { Link } from 'react-router-dom';
import { ArrowUpRight, Pin } from 'lucide-react';
import { ImageWithFallback } from '../ui/ImageWithFallback';
import { Badge } from '../ui/Badge';
import { relativeTime } from '../../lib/dates';
import { stripRich } from '../../lib/richText';
import { cn } from '../../lib/utils';

export function PostPreviewCard({ post, className }) {
  const previewText = stripRich(post.content || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 150);

  return (
    <Link
      to={`/updates/${post.id}`}
      className={cn(
        'group flex flex-col overflow-hidden rounded-3xl border border-line bg-elevated transition-all duration-500 hover:-translate-y-1.5 hover:border-accent/30 hover:shadow-lift',
        className
      )}
    >
      <div className="relative overflow-hidden">
        <ImageWithFallback
          src={post.coverImage}
          alt={post.title || 'Church update'}
          className="aspect-[16/10] w-full object-cover transition-transform duration-[900ms] group-hover:scale-[1.05]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#060a12]/60 via-transparent to-transparent" />
        <div className="absolute left-4 top-4 flex items-center gap-2">
          <Badge variant="dark">{post.category}</Badge>
          {post.pinned && (
            <Badge variant="dark">
              <Pin className="h-3 w-3" /> Pinned
            </Badge>
          )}
        </div>
      </div>
      <div className="flex flex-1 flex-col p-6">
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-faint">
          {relativeTime(post.createdAt)}
        </p>
        <h3 className="mt-2 font-display text-[1.3rem] font-semibold leading-snug text-ink transition-colors group-hover:text-accent">
          {post.title || 'Church update'}
        </h3>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-soft line-clamp-3">{previewText}…</p>
        <span className="mt-5 inline-flex items-center gap-1.5 text-[0.66rem] font-semibold uppercase tracking-[0.18em] text-accent">
          Read update
          <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}
