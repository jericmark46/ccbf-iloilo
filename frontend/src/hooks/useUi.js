import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../api/client';

export function useLockBodyScroll(locked) {
  useEffect(() => {
    if (!locked) return undefined;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [locked]);
}

export function useOnClickOutside(ref, handler) {
  useEffect(() => {
    const listener = (event) => {
      if (!ref.current || ref.current.contains(event.target)) return;
      handler(event);
    };
    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);
    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler]);
}

export function useScrolled(threshold = 24) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold]);
  return scrolled;
}

export function useDebounced(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export function useKeyPress(targetKey, handler) {
  const savedHandler = useRef(handler);
  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === targetKey) savedHandler.current(event);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [targetKey]);
}

export function useCopyToClipboard(resetDelay = 2000) {
  const [copied, setCopied] = useState(false);
  const copy = useCallback(
    async (text) => {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        window.setTimeout(() => setCopied(false), resetDelay);
        return true;
      } catch {
        return false;
      }
    },
    [resetDelay]
  );
  return { copied, copy };
}

const VISIT_KEY = 'cc_last_visit';

/**
 * Reports one visit per public page to the API. Nothing personal is stored:
 * the server hashes the address and browser into a per-day value. Visitors who
 * ask not to be tracked are respected, and admin screens are never counted.
 */
export function useVisitTracker(pathname) {
  useEffect(() => {
    if (!pathname || pathname.startsWith('/admin')) return;
    if (navigator.doNotTrack === '1' || window.doNotTrack === '1') return;

    // Reloading the same page a moment later is not a new visit.
    try {
      const last = JSON.parse(sessionStorage.getItem(VISIT_KEY) || 'null');
      if (last && last.path === pathname && Date.now() - last.at < 60_000) return;
      sessionStorage.setItem(VISIT_KEY, JSON.stringify({ path: pathname, at: Date.now() }));
    } catch {
      // Storage can be blocked in private mode; the visit still counts.
    }

    api.post('/public/visit', { path: pathname }).catch(() => {});
  }, [pathname]);
}
