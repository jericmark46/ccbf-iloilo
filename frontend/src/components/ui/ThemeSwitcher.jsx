import { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useOnClickOutside } from '../../hooks/useUi';
import { cn } from '../../lib/utils';

export function ThemePanel({ className }) {
  const { mode, setMode, accent, setAccent, modes, accents } = useTheme();

  return (
    <div className={cn('w-[19rem] rounded-3xl border border-line bg-elevated p-4 shadow-lift', className)}>
      <p className="px-2 pb-2 text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-faint">
        Color mode
      </p>
      <div className="grid gap-0.5">
        {modes.map((item) => {
          const Icon = item.icon;
          const active = mode === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setMode(item.id)}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition',
                active ? 'bg-accent/10 text-ink' : 'text-soft hover:bg-ink/5 hover:text-ink'
              )}
            >
              <Icon className={cn('h-4 w-4', active ? 'text-accent' : 'text-faint')} />
              <span className="flex-1 font-medium">{item.label}</span>
              <span className="text-[0.6rem] uppercase tracking-[0.12em] text-faint">{item.hint}</span>
              {active && <Check className="h-4 w-4 text-accent" />}
            </button>
          );
        })}
      </div>

      <div className="mt-4 border-t border-line pt-4">
        <p className="px-2 pb-3 text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-faint">
          Accent
        </p>
        <div className="flex items-start justify-between gap-1 px-1">
          {accents.map((item) => {
            const active = accent === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setAccent(item.id)}
                className="group flex flex-col items-center gap-2"
                title={item.label}
                aria-label={`Use ${item.label} accent`}
              >
                <span
                  className={cn(
                    'grid h-8 w-8 place-items-center rounded-full ring-2 ring-offset-2 ring-offset-elevated transition',
                    active ? 'ring-accent' : 'ring-transparent group-hover:ring-line'
                  )}
                  style={{ backgroundColor: item.hex }}
                >
                  {active && <Check className="h-3.5 w-3.5 text-white drop-shadow" strokeWidth={3} />}
                </span>
                <span
                  className={cn(
                    'text-[0.57rem] font-semibold uppercase tracking-[0.08em] transition',
                    active ? 'text-accent' : 'text-faint group-hover:text-soft'
                  )}
                >
                  {item.label.split(' ')[0]}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function ThemeSwitcher({ className, onDark = false, align = 'right' }) {
  const { mode, modes } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useOnClickOutside(ref, () => setOpen(false));

  const Icon = modes.find((item) => item.id === mode)?.icon || modes[0].icon;

  return (
    <div className={cn('relative', className)} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label="Change appearance"
        aria-expanded={open}
        className={cn(
          onDark
            ? 'inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white backdrop-blur-md transition hover:border-white/50 hover:bg-white/20'
            : 'icon-btn'
        )}
      >
        <Icon className="h-[18px] w-[18px]" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className={cn('absolute top-full z-[70] mt-3', align === 'right' ? 'right-0' : 'left-0')}
          >
            <ThemePanel />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
