'use client';

import { Change } from '@/components/ui/Change';
import { ErrorState, Skeleton } from '@/components/ui/States';
import { usePortfolio } from '@/context/PortfolioContext';
import { formatMoney } from '@/lib/format';

/** Account value, return since start, cash and position count. */
export function PortfolioPulse() {
  const { book, loading, error, refresh } = usePortfolio();
  if (loading && !book) {
    return <div className="flex flex-wrap gap-8 py-2"><Skeleton className="h-8 w-48" /><Skeleton className="h-8 w-32" /></div>;
  }
  if (error) return <ErrorState error={error} title="Couldn't load your portfolio" onRetry={() => void refresh()} />;
  if (!book) return null;

  const ccy = book.account.currency;
  const invested = book.positions.reduce((sum, p) => sum + Number(p.market_value ?? p.cost_basis), 0);
  const equity = Number(book.cash) + invested;
  const start = Number(book.account.starting_cash);
  const totalReturn = start ? ((equity - start) / start) * 100 : 0;
  const unpriced = book.positions.some((p) => p.price_unavailable);

  return (
    <dl className="flex flex-wrap items-end gap-x-10 gap-y-4">
      <div className="flex flex-col gap-1">
        <dt className="text-caption text-fg-3">Paper account value</dt>
        <dd className="text-h2 font-bold tabular tracking-[-0.02em]">{formatMoney(equity, ccy)}</dd>
      </div>
      <div className="flex flex-col gap-1">
        <dt className="text-caption text-fg-3">Since you started</dt>
        <dd className="text-h4"><Change pct={totalReturn} amount={equity - start} currency={ccy} /></dd>
      </div>
      <div className="flex flex-col gap-1">
        <dt className="text-caption text-fg-3">Cash</dt>
        <dd className="text-h4 tabular">{formatMoney(book.cash, ccy)}</dd>
      </div>
      <div className="flex flex-col gap-1">
        <dt className="text-caption text-fg-3">Open positions</dt>
        <dd className="text-h4 tabular">{book.positions.length}</dd>
      </div>
      {unpriced && <p className="basis-full text-caption text-warn">Some holdings have no live price right now; they count at cost.</p>}
    </dl>
  );
}
