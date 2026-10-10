import clsx from 'clsx';
import { direction, formatPct, formatSignedMoney, toNumber } from '@/lib/format';

/**
 * A change readout. Direction is carried three ways (sign, arrow, colour), so
 * it never depends on telling green from red.
 */
export function Change({ pct, amount, currency, chip = false, className }: {
  pct?: number | string | null;
  amount?: number | string | null;
  currency?: string;
  chip?: boolean;
  className?: string;
}) {
  const dir = direction(pct ?? amount);
  const arrow = dir === 'up' ? '▲' : dir === 'down' ? '▼' : '';
  const parts = [
    amount !== undefined && amount !== null ? formatSignedMoney(amount, currency) : null,
    pct !== undefined && pct !== null ? (amount !== undefined && amount !== null ? `(${formatPct(pct)})` : formatPct(pct)) : null,
  ].filter(Boolean);
  const n = toNumber(pct ?? amount);
  const spoken = n === null ? 'no change data'
    : `${dir === 'up' ? 'up' : dir === 'down' ? 'down' : 'unchanged'} ${parts.join(' ')}`;

  return (
    <span
      aria-label={spoken}
      className={clsx(
        'inline-flex items-center gap-1 tabular whitespace-nowrap',
        dir === 'up' && 'text-up', dir === 'down' && 'text-down', dir === 'flat' && 'text-fg-2',
        chip && 'rounded-sm px-1.5 py-0.5 text-table',
        chip && dir === 'up' && 'bg-up/[0.12]', chip && dir === 'down' && 'bg-down/[0.12]',
        chip && dir === 'flat' && 'bg-ink-2',
        className,
      )}
    >
      {arrow && <span aria-hidden="true" className="text-[0.75em]">{arrow}</span>}
      <span aria-hidden="true">{parts.join(' ') || '–'}</span>
    </span>
  );
}
