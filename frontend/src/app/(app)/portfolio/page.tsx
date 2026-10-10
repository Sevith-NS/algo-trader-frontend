'use client';

import Link from 'next/link';
import { ButtonLink } from '@/components/ui/Button';
import { Change } from '@/components/ui/Change';
import { EmptyState, ErrorState, LoadingBlock } from '@/components/ui/States';
import { usePortfolio } from '@/context/PortfolioContext';
import { formatMoney, formatNumber } from '@/lib/format';
import type { PositionRow } from '@/types/api';

function pnlPct(p: PositionRow) {
  const cost = Number(p.cost_basis);
  return p.unrealized_pnl !== null && cost > 0 ? (Number(p.unrealized_pnl) / cost) * 100 : null;
}

const qtyDigits = (q: string) => (Number(q) % 1 === 0 ? 0 : 4);

export default function Holdings() {
  const { book, loading, error, refresh } = usePortfolio();

  if (loading && !book) return <LoadingBlock lines={6} label="Loading holdings" />;
  if (error) return <ErrorState error={error} onRetry={() => void refresh()} />;
  if (!book) return null;
  const ccy = book.account.currency;

  if (!book.positions.length) {
    return (
      <EmptyState title="No positions yet"
                  action={<ButtonLink href="/markets" variant="secondary">Find a symbol</ButtonLink>}>
        Open a symbol and place a paper order to start your track record. Every fill is kept here, tied to your account.
      </EmptyState>
    );
  }

  return (
    <section aria-label="Holdings" className="flex flex-col gap-4">
      {/* Laptop: one table. */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-table">
          <caption className="sr-only">Open paper positions, values in {ccy}</caption>
          <thead>
            <tr className="border-b border-line text-left text-caption text-fg-3">
              <th scope="col" className="py-2 font-normal">Symbol</th>
              <th scope="col" className="py-2 text-right font-normal">Quantity</th>
              <th scope="col" className="py-2 text-right font-normal">Avg cost ({ccy})</th>
              <th scope="col" className="py-2 text-right font-normal">Last</th>
              <th scope="col" className="py-2 text-right font-normal">Value ({ccy})</th>
              <th scope="col" className="py-2 text-right font-normal">Unrealised</th>
              <th scope="col" className="py-2 text-right font-normal">Realised</th>
            </tr>
          </thead>
          <tbody>
            {book.positions.map((p) => (
              <tr key={p.symbol} className="border-b border-line">
                <th scope="row" className="py-3 text-left font-normal">
                  <Link href={`/s/${encodeURIComponent(p.symbol)}`} className="ticker hover:underline">{p.symbol}</Link>
                </th>
                <td className="py-3 text-right tabular">{formatNumber(p.quantity, qtyDigits(p.quantity))}</td>
                <td className="py-3 text-right tabular">{formatMoney(p.avg_cost, ccy)}</td>
                <td className="py-3 text-right tabular">
                  {p.price_unavailable ? <span className="text-warn">Unavailable</span> : formatMoney(p.last_price, p.currency)}
                </td>
                <td className="py-3 text-right tabular">{formatMoney(p.market_value ?? p.cost_basis, ccy)}</td>
                <td className="py-3 text-right">
                  {p.unrealized_pnl !== null ? <Change amount={p.unrealized_pnl} pct={pnlPct(p)} currency={ccy} /> : '–'}
                </td>
                <td className="py-3 text-right"><Change amount={p.realized_pnl} currency={ccy} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Phone: one card per holding, same numbers. */}
      <ul className="flex flex-col divide-y divide-line border-y border-line md:hidden">
        {book.positions.map((p) => (
          <li key={p.symbol}>
            <Link href={`/s/${encodeURIComponent(p.symbol)}`} className="flex min-h-16 items-center justify-between gap-4 py-3">
              <span className="flex flex-col">
                <span className="ticker">{p.symbol}</span>
                <span className="text-caption text-fg-3 tabular">
                  {formatNumber(p.quantity, qtyDigits(p.quantity))} at {formatMoney(p.avg_cost, ccy)}
                </span>
              </span>
              <span className="flex flex-col items-end">
                <span className="tabular">{formatMoney(p.market_value ?? p.cost_basis, ccy)}</span>
                {p.unrealized_pnl !== null
                  ? <Change amount={p.unrealized_pnl} pct={pnlPct(p)} currency={ccy} className="text-caption" />
                  : <span className="text-caption text-warn">No live price</span>}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <p className="text-caption text-fg-3">Values in {ccy}, converted at live exchange rates. Average cost includes the rate on each fill day.</p>
    </section>
  );
}
