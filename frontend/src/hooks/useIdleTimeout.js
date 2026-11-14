import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../api/client';

const IDLE_MS = 20 * 60 * 1000;
const WARN_MS = 19 * 60 * 1000;
const HEARTBEAT_MS = 5 * 60 * 1000;
const ACTIVITY_KEY = 'cc_admin_last_active';

const readSharedActivity = () => {
  try {
    return Number(localStorage.getItem(ACTIVITY_KEY)) || 0;
  } catch {
    return 0;
  }
};

const writeSharedActivity = (value) => {
  try {
    localStorage.setItem(ACTIVITY_KEY, String(value));
  } catch {
    /* storage unavailable */
  }
};

export function useIdleTimeout({ enabled, onTimeout }) {
  const [warning, setWarning] = useState(false);
  const [remaining, setRemaining] = useState(Math.round((IDLE_MS - WARN_MS) / 1000));
  const lastActivityRef = useRef(Date.now());
  const lastWriteRef = useRef(0);
  const firedRef = useRef(false);
  const timeoutRef = useRef(onTimeout);

  useEffect(() => {
    timeoutRef.current = onTimeout;
  }, [onTimeout]);

  const markActive = useCallback(() => {
    const now = Date.now();
    lastActivityRef.current = now;
    firedRef.current = false;
    if (now - lastWriteRef.current > 1000) {
      lastWriteRef.current = now;
      writeSharedActivity(now);
    }
  }, []);

  const stayActive = useCallback(() => {
    markActive();
    setWarning(false);
    api.post('/auth/heartbeat').catch(() => {});
  }, [markActive]);

  useEffect(() => {
    if (!enabled) return undefined;

    lastActivityRef.current = Date.now();
    lastWriteRef.current = 0;
    firedRef.current = false;
    setWarning(false);
    writeSharedActivity(lastActivityRef.current);

    const events = ['mousemove', 'keydown', 'pointerdown', 'touchstart', 'wheel', 'scroll'];
    for (const name of events) {
      window.addEventListener(name, markActive, { passive: true });
    }

    const onVisibility = () => {
      if (document.visibilityState === 'visible') markActive();
    };
    document.addEventListener('visibilitychange', onVisibility);

    const onStorage = (event) => {
      if (event.key !== ACTIVITY_KEY) return;
      const shared = Number(event.newValue) || 0;
      if (shared > lastActivityRef.current) lastActivityRef.current = shared;
    };
    window.addEventListener('storage', onStorage);

    const tick = window.setInterval(() => {
      const shared = readSharedActivity();
      if (shared > lastActivityRef.current) lastActivityRef.current = shared;

      const elapsed = Date.now() - lastActivityRef.current;
      if (elapsed >= IDLE_MS) {
        setWarning(false);
        if (!firedRef.current) {
          firedRef.current = true;
          timeoutRef.current?.();
        }
        return;
      }
      if (elapsed >= WARN_MS) {
        setWarning(true);
        setRemaining(Math.max(0, Math.ceil((IDLE_MS - elapsed) / 1000)));
      } else {
        setWarning(false);
      }
    }, 10000);

    // Keep the server's idle clock in step while the member is actually using
    // the admin, so active sessions are never rejected for an old timestamp.
    const heartbeat = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      if (Date.now() - lastActivityRef.current > HEARTBEAT_MS) return;
      api.post('/auth/heartbeat').catch(() => {});
    }, HEARTBEAT_MS);

    return () => {
      for (const name of events) {
        window.removeEventListener(name, markActive);
      }
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('storage', onStorage);
      window.clearInterval(tick);
      window.clearInterval(heartbeat);
    };
  }, [enabled, markActive]);

  return { warning, remaining, stayActive };
}
