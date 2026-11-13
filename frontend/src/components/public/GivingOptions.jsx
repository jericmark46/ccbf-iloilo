import {
  Banknote,
  CreditCard,
  HandCoins,
  HeartHandshake,
  Landmark,
  Smartphone,
} from 'lucide-react';
import { RichContent } from '../ui/Markdown';
import { cn } from '../../lib/utils';

const methodMeta = {
  gcash: { icon: Smartphone, label: 'GCash' },
  bank: { icon: Landmark, label: 'Bank transfer' },
  paypal: { icon: CreditCard, label: 'PayPal' },
  cash: { icon: Banknote, label: 'Cash' },
  'in-person': { icon: HandCoins, label: 'In person' },
  other: { icon: HeartHandshake, label: 'Giving' },
};

export function GivingOptions({ options = [] }) {
  if (options.length === 0) return null;

  return (
    <div id="give" className="scroll-mt-32">
      <div className="grid gap-5 lg:grid-cols-3">
        {options.map((option, index) => {
          const meta = methodMeta[option.method] || methodMeta.other;
          const Icon = meta.icon;
          const hasDetails = Boolean(option.image || option.accountName || option.accountNumber);
          return (
            <article
              key={option.id}
              id={option.anchor || undefined}
              className={cn(
                'flex scroll-mt-32 flex-col rounded-3xl border border-line bg-elevated p-6 transition hover:border-accent/30',
                index === 0 && 'lg:col-span-2 lg:flex-row lg:gap-8'
              )}
            >
              <div className={cn('flex-1', index === 0 && 'lg:max-w-[58%]')}>
                <div className="flex items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-accent/10 text-accent">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-faint">
                      {meta.label}
                    </p>
                    <h3 className="font-display text-xl font-semibold text-ink">{option.title}</h3>
                  </div>
                </div>
                {option.description && (
                  <p className="mt-4 text-sm leading-relaxed text-soft">{option.description}</p>
                )}
                {option.instructions && (
                  <div className="mt-4">
                    <RichContent className="text-[0.92rem] leading-relaxed">{option.instructions}</RichContent>
                  </div>
                )}
              </div>

              {hasDetails && (
                <div
                  className={cn(
                    'mt-5 space-y-4',
                    index === 0 && 'lg:mt-0 lg:w-64 lg:self-start'
                  )}
                >
                  {option.image && (
                    <a
                      href={option.image}
                      target="_blank"
                      rel="noreferrer"
                      className="block overflow-hidden rounded-2xl border border-line bg-white p-2.5 transition hover:border-accent/40"
                    >
                      <img
                        src={option.image}
                        alt={`${option.title} payment image`}
                        loading="lazy"
                        className="mx-auto max-h-72 w-full rounded-xl object-contain"
                      />
                      <span className="mt-2 block text-center text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-faint">
                        Tap to view full size
                      </span>
                    </a>
                  )}
                  {(option.accountName || option.accountNumber) && (
                    <div className="rounded-2xl border border-line bg-surface/70 p-4">
                      <p className="text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-faint">
                        Account
                      </p>
                      {option.accountName && (
                        <p className="mt-2 text-sm font-semibold text-ink">{option.accountName}</p>
                      )}
                      {option.accountNumber && (
                        <p className="mt-1 break-words text-[0.82rem] leading-relaxed text-soft">
                          {option.accountNumber}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
