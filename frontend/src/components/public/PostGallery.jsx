import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Heart, Maximize2 } from 'lucide-react';
import { api, getError } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { ImageWithFallback } from '../ui/ImageWithFallback';
import { Modal } from '../ui/Modal';
import { cn } from '../../lib/utils';

const HYPED_KEY = 'cc_hyped_media';

const readHyped = () => {
  try {
    return new Set(JSON.parse(localStorage.getItem(HYPED_KEY) || '[]'));
  } catch {
    return new Set();
  }
};

const writeHyped = (set) => {
  try {
    localStorage.setItem(HYPED_KEY, JSON.stringify([...set]));
  } catch {
    /* storage unavailable */
  }
};

const mediaIdOf = (item) => item?.id || item?._id || '';

function HypeButton({ count = 0, active, disabled, onClick, className }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      aria-label={active ? 'Remove hype from this photo' : 'Hype this photo'}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[0.72rem] font-semibold backdrop-blur transition disabled:cursor-wait',
        active
          ? 'border-rose-400/50 bg-rose-500/90 text-white'
          : 'border-white/25 bg-black/45 text-white hover:bg-black/65',
        className
      )}
    >
      <Heart className={cn('h-3.5 w-3.5', active && 'fill-current')} />
      {count > 0 ? count : 'Hype'}
    </button>
  );
}

const slideVariants = {
  enter: (direction) => ({ x: direction > 0 ? '100%' : '-100%', opacity: 0.4 }),
  center: { x: 0, opacity: 1 },
  exit: (direction) => ({ x: direction > 0 ? '-100%' : '100%', opacity: 0.4 }),
};

export function PostGallery({ postId, media = [], title = 'Church update' }) {
  const toast = useToast();
  const reduceMotion = useReducedMotion();
  const images = useMemo(
    () => (media || []).filter((item) => item?.url && item.type !== 'video'),
    [media]
  );

  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [lightbox, setLightbox] = useState(false);
  const [hyped, setHyped] = useState(readHyped);
  const [counts, setCounts] = useState({});
  const [pending, setPending] = useState({});
  const draggedRef = useRef(false);

  const mediaKey = images.map((item) => `${mediaIdOf(item)}:${item.hypeCount || 0}`).join('|');

  useEffect(() => {
    const next = {};
    for (const item of images) {
      const id = mediaIdOf(item);
      if (id) next[id] = Number(item.hypeCount) || 0;
    }
    setCounts(next);
    // Only re-sync when the media list itself changes, not on local hype updates.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mediaKey]);

  useEffect(() => {
    setIndex(0);
    setLightbox(false);
  }, [postId]);

  const total = images.length;
  const current = images[Math.min(index, Math.max(0, total - 1))];

  useEffect(() => {
    if (!lightbox) return undefined;
    const onKey = (event) => {
      if (event.key === 'ArrowRight' && total > 1) {
        setDirection(1);
        setIndex((prev) => (prev + 1) % total);
      }
      if (event.key === 'ArrowLeft' && total > 1) {
        setDirection(-1);
        setIndex((prev) => (prev - 1 + total) % total);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightbox, total]);

  if (!total) return null;

  const go = (delta) => {
    if (total < 2) return;
    setDirection(delta);
    setIndex((prev) => (prev + delta + total) % total);
  };

  const jumpTo = (next) => {
    if (next === index) return;
    setDirection(next > index ? 1 : -1);
    setIndex(next);
  };

  const toggleHype = async (item) => {
    const id = mediaIdOf(item);
    if (!id || pending[id]) return;

    const leaving = hyped.has(id);
    const previousCount = counts[id] ?? (Number(item.hypeCount) || 0);
    const nextHyped = new Set(hyped);
    if (leaving) nextHyped.delete(id);
    else nextHyped.add(id);

    setHyped(nextHyped);
    writeHyped(nextHyped);
    setCounts((prev) => ({
      ...prev,
      [id]: Math.max(0, previousCount + (leaving ? -1 : 1)),
    }));
    setPending((prev) => ({ ...prev, [id]: true }));

    try {
      const { data } = await api.post(`/public/posts/${postId}/media/${id}/hype`, {
        action: leaving ? 'unhype' : 'hype',
      });
      setCounts((prev) => ({ ...prev, [id]: data.hypeCount }));
    } catch (error) {
      const reverted = new Set(nextHyped);
      if (leaving) reverted.add(id);
      else reverted.delete(id);
      setHyped(reverted);
      writeHyped(reverted);
      setCounts((prev) => ({ ...prev, [id]: previousCount }));
      toast.error(getError(error));
    } finally {
      setPending((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  };

  const renderHype = (item, className) => {
    const id = mediaIdOf(item);
    if (!id) return null;
    return (
      <HypeButton
        count={counts[id] ?? (Number(item.hypeCount) || 0)}
        active={hyped.has(id)}
        disabled={Boolean(pending[id])}
        onClick={() => toggleHype(item)}
        className={className}
      />
    );
  };

  const transition = { duration: reduceMotion ? 0 : 0.34, ease: [0.16, 1, 0.3, 1] };

  const lightboxModal = (
    <Modal
      open={lightbox}
      onClose={() => setLightbox(false)}
      title={title}
      description={total > 1 ? `Photo ${index + 1} of ${total}` : undefined}
      size="full"
      bodyClassName="bg-[#05070c] p-0"
    >
      {current && (
        <div className="relative grid min-h-[45vh] place-items-center bg-[#05070c] p-3 sm:p-5">
          <img
            src={current.url}
            alt={`${title} — photo ${index + 1}`}
            className="max-h-[72vh] w-full object-contain"
          />
          <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-3 sm:p-4">
            <span className="rounded-full bg-black/50 px-3 py-1.5 text-[0.7rem] font-semibold text-white backdrop-blur">
              {index + 1} / {total}
            </span>
            <span className="pointer-events-auto">{renderHype(current)}</span>
          </div>
          {total > 1 && (
            <>
              <button
                type="button"
                onClick={() => go(-1)}
                className="absolute left-2 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-black/50 text-white backdrop-blur transition hover:bg-black/70 sm:left-4"
                aria-label="Previous photo"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                className="absolute right-2 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-black/50 text-white backdrop-blur transition hover:bg-black/70 sm:right-4"
                aria-label="Next photo"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}
        </div>
      )}
    </Modal>
  );

  if (total === 1) {
    const item = images[0];
    return (
      <div className="mt-4">
        <div className="relative overflow-hidden rounded-2xl border border-line bg-ink/[0.04]">
          <button
            type="button"
            onClick={() => setLightbox(true)}
            className="block w-full cursor-zoom-in"
            aria-label="Open photo full size"
          >
            <ImageWithFallback
              src={item.url}
              alt={`${title} — photo`}
              className="max-h-[42rem] w-full object-contain"
            />
          </button>
          {renderHype(item, 'absolute right-2.5 top-2.5')}
          <button
            type="button"
            onClick={() => setLightbox(true)}
            className="absolute left-2.5 top-2.5 grid h-8 w-8 place-items-center rounded-full border border-white/25 bg-black/45 text-white backdrop-blur transition hover:bg-black/65"
            aria-label="Open photo full size"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
        </div>
        {lightboxModal}
      </div>
    );
  }

  return (
    <div className="mt-4">
      <div className="relative overflow-hidden rounded-2xl border border-line bg-ink/[0.04]">
        <div className="relative aspect-[4/3] w-full sm:aspect-[16/10]">
          <AnimatePresence initial={false} custom={direction} mode="popLayout">
            <motion.div
              key={current?.id || current?.url || index}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={transition}
              drag={total > 1 ? 'x' : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.18}
              onDragStart={() => {
                draggedRef.current = true;
              }}
              onDragEnd={(_event, info) => {
                if (info.offset.x < -60) go(1);
                else if (info.offset.x > 60) go(-1);
                window.setTimeout(() => {
                  draggedRef.current = false;
                }, 220);
              }}
              className="absolute inset-0 cursor-zoom-in"
              onClick={() => {
                if (draggedRef.current) return;
                setLightbox(true);
              }}
            >
              <ImageWithFallback
                src={current?.url}
                alt={`${title} — photo ${index + 1}`}
                className="h-full w-full object-contain"
              />
            </motion.div>
          </AnimatePresence>

          <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-2.5">
            <span className="rounded-full bg-black/45 px-2.5 py-1 text-[0.65rem] font-semibold text-white backdrop-blur">
              {index + 1} / {total}
            </span>
            <span className="pointer-events-auto">{renderHype(current)}</span>
          </div>

          <button
            type="button"
            onClick={() => go(-1)}
            className="absolute left-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-white/25 bg-black/45 text-white backdrop-blur transition hover:bg-black/70"
            aria-label="Previous photo"
          >
            <ChevronLeft className="h-[18px] w-[18px]" />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-white/25 bg-black/45 text-white backdrop-blur transition hover:bg-black/70"
            aria-label="Next photo"
          >
            <ChevronRight className="h-[18px] w-[18px]" />
          </button>
        </div>
      </div>

      <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
        {images.map((item, position) => (
          <button
            key={item.id || item._id || `${item.url}-${position}`}
            type="button"
            onClick={() => jumpTo(position)}
            aria-label={`Show photo ${position + 1}`}
            aria-current={position === index}
            className={cn(
              'relative h-14 w-20 shrink-0 overflow-hidden rounded-xl border transition',
              position === index
                ? 'border-accent ring-2 ring-accent/30'
                : 'border-line opacity-70 hover:opacity-100'
            )}
          >
            <ImageWithFallback src={item.url} alt="" className="h-full w-full object-cover" />
          </button>
        ))}
      </div>

      {lightboxModal}
    </div>
  );
}
