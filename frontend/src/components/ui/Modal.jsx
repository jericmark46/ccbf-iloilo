import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useLockBodyScroll } from '../../hooks/useUi';
import { cn } from '../../lib/utils';

// Nested dialogs are common in the admin (e.g. a media picker inside an editor),
// so only the top-most open dialog should respond to Escape.
const modalStack = [];

const sizes = {
  sm: 'sm:max-w-md',
  md: 'sm:max-w-xl',
  lg: 'sm:max-w-3xl',
  xl: 'sm:max-w-5xl',
  full: 'sm:max-w-6xl',
};

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  className,
  bodyClassName,
}) {
  useLockBodyScroll(open);
  const instanceRef = useRef(null);
  if (!instanceRef.current) instanceRef.current = Symbol('modal');

  useEffect(() => {
    if (!open) return undefined;
    const instance = instanceRef.current;
    modalStack.push(instance);
    const onKey = (event) => {
      if (event.key !== 'Escape') return;
      if (modalStack[modalStack.length - 1] !== instance) return;
      onClose?.();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      const index = modalStack.lastIndexOf(instance);
      if (index !== -1) modalStack.splice(index, 1);
    };
  }, [open, onClose]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#05070c]/65 backdrop-blur-[3px]"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={typeof title === 'string' ? title : 'Dialog'}
            initial={{ opacity: 0, y: 32, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              'relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-[1.75rem] border border-line bg-surface shadow-lift sm:rounded-[1.75rem]',
              sizes[size],
              className
            )}
          >
            {(title || description) && (
              <header className="flex items-start justify-between gap-4 border-b border-line/70 px-5 py-4 sm:px-6 sm:py-5">
                <div>
                  {title && <h2 className="font-display text-xl font-semibold text-ink">{title}</h2>}
                  {description && <p className="mt-1 text-sm leading-relaxed text-soft">{description}</p>}
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="icon-btn h-9 w-9 shrink-0"
                  aria-label="Close dialog"
                >
                  <X className="h-4 w-4" />
                </button>
              </header>
            )}
            <div className={cn('flex-1 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6', bodyClassName)}>
              {children}
            </div>
            {footer && (
              <footer className="flex flex-wrap items-center justify-end gap-3 border-t border-line/70 bg-elevated/50 px-5 py-4 sm:px-6">
                {footer}
              </footer>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
