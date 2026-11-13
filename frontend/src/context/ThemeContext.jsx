import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Sun, Moon, MonitorSmartphone, Sparkles, BookOpen } from 'lucide-react';

const ThemeContext = createContext(null);

export const THEME_MODES = [
  { id: 'light', label: 'Light', icon: Sun, hint: 'Warm & bright' },
  { id: 'dark', label: 'Dark', icon: Moon, hint: 'Deep navy' },
  { id: 'system', label: 'System', icon: MonitorSmartphone, hint: 'Auto' },
  { id: 'midnight', label: 'Midnight', icon: Sparkles, hint: 'Pure black' },
  { id: 'sepia', label: 'Sepia', icon: BookOpen, hint: 'Paper' },
];

export const THEME_ACCENTS = [
  { id: 'gold', label: 'Grace Gold', hex: '#c9a253' },
  { id: 'ocean', label: 'Living Water', hex: '#2a9db5' },
  { id: 'forest', label: 'Olive Branch', hex: '#7ba24a' },
  { id: 'rose', label: 'Sunrise Rose', hex: '#d2688a' },
];

const prefersDark = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;

export function ThemeProvider({ children }) {
  const [mode, setModeState] = useState(() => localStorage.getItem('cc_theme_mode') || 'system');
  const [accent, setAccentState] = useState(() => localStorage.getItem('cc_theme_accent') || 'gold');
  const [systemDark, setSystemDark] = useState(prefersDark);

  useEffect(() => {
    const query = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (event) => setSystemDark(event.matches);
    query.addEventListener?.('change', onChange);
    return () => query.removeEventListener?.('change', onChange);
  }, []);

  const resolvedMode =
    mode === 'system' ? (systemDark ? 'dark' : 'light') : mode === 'midnight' ? 'midnight' : mode;

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.mode = resolvedMode;
    root.dataset.pref = mode;
    root.dataset.accent = accent;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute(
        'content',
        resolvedMode === 'light' || resolvedMode === 'sepia' ? '#f7f4ee' : '#0b1017'
      );
    }
  }, [resolvedMode, mode, accent]);

  const setMode = useCallback((next) => {
    setModeState(next);
    localStorage.setItem('cc_theme_mode', next);
  }, []);

  const setAccent = useCallback((next) => {
    setAccentState(next);
    localStorage.setItem('cc_theme_accent', next);
  }, []);

  const cycleMode = useCallback(() => {
    const order = THEME_MODES.map((item) => item.id);
    const index = order.indexOf(mode);
    setMode(order[(index + 1) % order.length]);
  }, [mode, setMode]);

  const value = useMemo(
    () => ({
      mode,
      accent,
      resolvedMode,
      isDark: resolvedMode === 'dark' || resolvedMode === 'midnight',
      setMode,
      setAccent,
      cycleMode,
      modes: THEME_MODES,
      accents: THEME_ACCENTS,
    }),
    [mode, accent, resolvedMode, setMode, setAccent, cycleMode]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used inside ThemeProvider');
  return context;
};
