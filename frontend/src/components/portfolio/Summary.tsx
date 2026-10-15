'use client';

import { Change } from '@/components/ui/Change';
import { ErrorState, Skeleton } from '@/components/ui/States';
import { usePortfolio } from '@/context/PortfolioContext';
import { formatMoney } from '@/lib/format';

/** Account value, return since start, cash and position count. */
export function PortfolioPulse() {
  const { book, loading, error, refresh } = usePortfolio();
  if (loading && !book) {
    return <div className="glass flex flex-wrap gap-8 rounded-2xl p-6"><Skeleton className="h-10 w-56" /><Skeleton className="h-10 w-32" /></div>;
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
    <section aria-label="Paper account" className="glass glass-paper rounded-2xl p-5 md:p-6">
      <span aria-hidden="true" className="absolute inset-x-6 top-0 h-0.5 rounded-full bg-paper" />
      <p className="mb-4 flex items-center justify-between gap-3">
        <span className="pill text-paper">Paper</span>
        <span className="text-caption text-fg-2">Simulated money, never added to real totals</span>
      </p>
    <dl className="flex flex-wrap items-end gap-x-10 gap-y-4">
      <div className="flex flex-col gap-1">
        <dt className="text-caption text-fg-2">Paper account value</dt>
        <dd className="text-silver text-figure tabular md:text-[56px] md:leading-[60px]">{formatMoney(equity, ccy)}</dd>
      </div>
      <div className="flex flex-col gap-1">
        <dt className="text-caption text-fg-2">Since you started</dt>
        <dd className="text-h4"><Change pct={totalReturn} amount={equity - start} currency={ccy} /></dd>
      </div>
      <div className="flex flex-col gap-1">
        <dt className="text-caption text-fg-2">Cash</dt>
        <dd className="text-h4 tabular">{formatMoney(book.cash, ccy)}</dd>
      </div>
      <div className="flex flex-col gap-1">
        <dt className="text-caption text-fg-2">Open positions</dt>
        <dd className="text-h4 tabular">{book.positions.length}</dd>
      </div>
      {unpriced && <p className="basis-full text-caption text-warn">Some holdings have no live price right now; they count at cost.</p>}
    </dl>
    </section>
  );
}
