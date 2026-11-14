import { ExternalLink } from 'lucide-react';
import { cn } from '../../lib/utils';

const PROVIDER_LABELS = {
  youtube: 'YouTube',
  gdrive: 'Google Drive',
  facebook: 'Facebook',
};

export function VideoEmbed({ item, title = 'Video', className }) {
  if (!item?.url) return null;

  const provider = item.provider || 'file';
  const source = item.embedUrl || item.url;

  if (provider === 'file') {
    return (
      <video
        src={source}
        controls
        playsInline
        preload="metadata"
        className={cn('aspect-video w-full rounded-2xl border border-line bg-black object-contain', className)}
      />
    );
  }

  const label = PROVIDER_LABELS[provider];

  return (
    <div className={cn('overflow-hidden rounded-2xl border border-line bg-black', className)}>
      <iframe
        src={source}
        title={label ? `${title} — ${label} video` : title}
        loading="lazy"
        allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
        sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
        className="aspect-video w-full"
      />
      {label && (
        <a
          href={item.url}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center gap-1.5 border-t border-white/10 py-2 text-[0.66rem] font-semibold uppercase tracking-[0.14em] text-white/70 transition hover:text-white"
        >
          Watch on {label}
          <ExternalLink className="h-3 w-3" />
        </a>
      )}
    </div>
  );
}
