import { useState } from 'react';
import { ImageOff } from 'lucide-react';
import { cn } from '../../lib/utils';

export function ImageWithFallback({ src, alt = '', className, imgClassName, loading = 'lazy', ...rest }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={cn(
          'grid place-items-center bg-[radial-gradient(circle_at_30%_20%,rgb(var(--c-accent)/0.18),transparent_55%),linear-gradient(135deg,rgb(var(--c-brand)/0.12),rgb(var(--c-accent)/0.08))] text-faint',
          className
        )}
        aria-label={alt}
      >
        <ImageOff className="h-6 w-6" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading={loading}
      decoding="async"
      onError={() => setFailed(true)}
      className={cn(className, imgClassName)}
      {...rest}
    />
  );
}
