import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUpRight, Search, X, CornerDownLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api, getError } from '../../api/client';
import { useDebounced, useLockBodyScroll } from '../../hooks/useUi';
import { cn } from '../../lib/utils';
import { Spinner } from '../ui/Loaders';

export function SearchDialog({ open, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const debounced = useDebounced(query, 280);

  useLockBodyScroll(open);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => inputRef.current?.focus(), 80);
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    let active = true;
    if (!open) return undefined;
    if (debounced.trim().length < 2) {
      setResults([]);
      setError('');
      setLoading(false);
      return undefined;
    }
    setLoading(true);
    setError('');
    api
      .get('/public/search', { params: { q: debounced.trim() } })
      .then(({ data }) => {
        if (active) setResults(data.results || []);
      })
      .catch((err) => {
        if (active) setError(getError(err));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [debounced, open]);

  const go = (href) => {
    onClose();
    setQuery('');
    if (href.startsWith('/')) navigate(href);
  };

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[110] flex items-start justify-center px-4 pt-[12vh] sm:pt-[16vh]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#04070d]/70 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-line bg-surface shadow-lift"
            role="dialog"
            aria-modal="true"
            aria-label="Search the website"
          >
            <div className="flex items-center gap-3 border-b border-line px-5 py-4">
              <Search className="h-5 w-5 text-accent" />
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && results[0]) go(results[0].href);
                }}
                placeholder="Search updates, pages, ministries…"
                className="flex-1 bg-transparent text-[0.98rem] text-ink outline-none placeholder:text-faint"
              />
              {loading && <Spinner className="h-4 w-4" />}
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-line px-2 py-1 text-[0.6rem] font-semibold uppercase tracking-wider text-faint transition hover:text-ink"
              >
                Esc
              </button>
            </div>

            <div className="max-h-[52vh] overflow-y-auto p-2">
              {query.trim().length < 2 ? (
                <div className="px-4 py-10 text-center">
                  <p className="text-sm text-soft">Search the life of our church.</p>
                  <p className="mt-1 text-xs text-faint">
                    Try “Romans”, “youth”, “outreach”, or “about”.
                  </p>
                </div>
              ) : error ? (
                <p className="px-4 py-8 text-center text-sm text-red-500">{error}</p>
              ) : !loading && results.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-soft">
                  Nothing found for “{query.trim()}”. Try another word.
                </p>
              ) : (
                <ul className="space-y-1">
                  {results.map((result, index) => (
                    <li key={`${result.type}-${result.href}-${index}`}>
                      <button
                        type="button"
                        onClick={() => go(result.href)}
                        className="group flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition hover:bg-ink/[0.04]"
                      >
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-line bg-elevated text-[0.55rem] font-bold uppercase tracking-wide text-accent">
                          {result.type.slice(0, 3)}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-ink">{result.title}</span>
                          {result.subtitle && (
                            <span className="block truncate text-xs text-faint">{result.subtitle}</span>
                          )}
                        </span>
                        <ArrowUpRight className="h-4 w-4 shrink-0 text-faint transition group-hover:text-accent" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-line bg-elevated/60 px-5 py-2.5 text-[0.65rem] text-faint">
              <span className="flex items-center gap-2">
                <CornerDownLeft className="h-3.5 w-3.5" /> Enter to open the first result
              </span>
              <span>Calvary Chapel Iloilo</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
