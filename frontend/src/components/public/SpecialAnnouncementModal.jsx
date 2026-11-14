import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Megaphone, X } from 'lucide-react';
import { useSite } from '../../context/SiteContext';
import { useLockBodyScroll } from '../../hooks/useUi';

const SEEN_KEY = 'cc_special_announcement_seen';

const readSeen = () => {
  try {
    return sessionStorage.getItem(SEEN_KEY) || '';
  } catch {
    return '';
  }
};

const markSeen = (version) => {
  try {
    sessionStorage.setItem(SEEN_KEY, String(version));
  } catch {
    /* storage unavailable */
  }
};

export function SpecialAnnouncementModal() {
  const { settings } = useSite();
  const announcement = settings?.specialAnnouncement;
  const reduceMotion = useReducedMotion();
  const [open, setOpen] = useState(false);
  const okayRef = useRef(null);

  const enabled = Boolean(announcement?.enabled);
  const title = (announcement?.title || '').trim();
  const message = (announcement?.message || '').trim();
  const image = announcement?.image || '';
  const version = announcement?.version ?? 0;

  useLockBodyScroll(open);

  const dismiss = () => {
    markSeen(version);
    setOpen(false);
  };

  useEffect(() => {
    if (!enabled || !title || !message) {
      setOpen(false);
      return;
    }
    if (readSeen() === String(version)) return;
    setOpen(true);
  }, [enabled, title, message, version]);

  useEffect(() => {
    if (!open) return undefined;
    const timer = window.setTimeout(() => okayRef.current?.focus(), 80);
    const onKey = (event) => {
      if (event.key === 'Escape') dismiss();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!enabled || !title || !message) return null;

  const transition = reduceMotion
    ? { duration: 0 }
    : { duration: 0.32, ease: [0.16, 1, 0.3, 1] };

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[110] flex items-end justify-center p-0 sm:items-center sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.24 }}
            onClick={dismiss}
            className="absolute inset-0 bg-[#05070c]/70 backdrop-blur-[3px]"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="special-announcement-title"
            initial={{ opacity: 0, y: reduceMotion ? 0 : 28, scale: reduceMotion ? 1 : 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: reduceMotion ? 0 : 20, scale: reduceMotion ? 1 : 0.98 }}
            transition={transition}
            className="relative flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-[1.75rem] border border-line bg-elevated shadow-lift sm:rounded-[1.75rem]"
          >
            <button
              type="button"
              onClick={dismiss}
              className="icon-btn absolute right-3 top-3 z-10 h-9 w-9 bg-elevated/80 backdrop-blur"
              aria-label="Close announcement"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="overflow-y-auto">
              {image && (
                <div className="bg-ink/[0.04]">
                  <img
                    src={image}
                    alt=""
                    className="max-h-[22rem] w-full object-contain"
                  />
                </div>
              )}
              <div className="space-y-3.5 p-6 pb-7 sm:p-7">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.18em] text-accent">
                  <Megaphone className="h-3 w-3" /> Announcement
                </span>
                <h2
                  id="special-announcement-title"
                  className="font-display text-2xl font-semibold leading-tight tracking-tight text-ink"
                >
                  {title}
                </h2>
                <p className="whitespace-pre-line text-sm leading-relaxed text-soft">{message}</p>
                <button
                  ref={okayRef}
                  type="button"
                  onClick={dismiss}
                  className="btn btn-accent mt-2 w-full"
                >
                  Okay
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
