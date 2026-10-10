'use client';

import clsx from 'clsx';
import Link from 'next/link';
import { EmptyState, ErrorState, LoadingBlock } from '@/components/ui/States';
import { usePortfolio } from '@/context/PortfolioContext';
import { formatMoney, formatNumber } from '@/lib/format';
import { useApi } from '@/lib/useApi';
import type { Fill } from '@/types/api';

const when = (iso: string) => new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso));

export default function Activity() {
  const { account } = usePortfolio();
  const { data, error, loading, reload } = useApi<{ fills: Fill[] }>(account ? `/api/accounts/${account.id}/fills?limit=200` : null);

  if ((loading && !data) || !account) return <LoadingBlock lines={6} label="Loading activity" />;
  if (error) return <ErrorState error={error} onRetry={reload} />;
  if (!data?.fills.length) {
    return <EmptyState title="No activity yet">Every paper fill appears here with its price, time and the stop you set.</EmptyState>;
  }

  return (
    <section aria-label="Activity" className="overflow-x-auto">
      <table className="w-full min-w-[560px] text-table">
        <caption className="sr-only">Paper fills, newest first</caption>
        <thead>
          <tr className="border-b border-line text-left text-caption text-fg-3">
            <th scope="col" className="py-2 font-normal">When</th>
            <th scope="col" className="py-2 font-normal">Symbol</th>
            <th scope="col" className="py-2 font-normal">Side</th>
            <th scope="col" className="py-2 text-right font-normal">Quantity</th>
            <th scope="col" className="py-2 text-right font-normal">Price</th>
            <th scope="col" className="py-2 text-right font-normal">Stop</th>
          </tr>
        </thead>
        <tbody>
          {data.fills.map((f) => (
            <tr key={f.id} className="border-b border-line">
              <td className="py-2.5 text-fg-2">{when(f.filled_at)}</td>
              <td className="py-2.5"><Link href={`/s/${encodeURIComponent(f.symbol)}`} className="ticker hover:underline">{f.symbol}</Link></td>
              <td className={clsx('py-2.5 capitalize', f.side === 'buy' ? 'text-up' : 'text-down')}>{f.side}</td>
              <td className="py-2.5 text-right tabular">{formatNumber(f.quantity, Number(f.quantity) % 1 ? 4 : 0)}</td>
              <td className="py-2.5 text-right tabular">{formatMoney(f.price, f.currency)}</td>
              <td className="py-2.5 text-right tabular text-fg-2">{f.stop_price ? formatMoney(f.stop_price, f.currency) : '–'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
