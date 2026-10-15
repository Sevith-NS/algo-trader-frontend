'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import Sparkline from '@/components/discover/Sparkline';
import { Change } from '@/components/ui/Change';
import { X } from '@/components/ui/icons';
import { formatMoney, formatPct } from '@/lib/format';
import { useApi } from '@/lib/useApi';
import type { Quote } from '@/types/api';

type Closes = { quotes: { close: number | null }[] };

/** True once the element has come near the viewport; never goes back. */
function useSeen<T extends Element>() {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || seen) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) setSeen(true); }, { rootMargin: '200px' });
    io.observe(el);
    return () => io.disconnect();
  }, [seen]);
  return [ref, seen] as const;
}

/**
 * One row. Its quote and 1-month closes load only once the row nears the
 * screen: a 100-symbol list would otherwise fire 200 requests at once, past
 * the API's burst limit.
 */
function Row({ symbol, onRemove }: { symbol: string; onRemove: (s: string) => void }) {
  const [ref, seen] = useSeen<HTMLTableRowElement>();
  const enc = encodeURIComponent(symbol);
  const quote = useApi<Quote>(seen ? `/api/quote?symbol=${enc}` : null, { refreshMs: 60_000 });
  const chart = useApi<Closes>(seen ? `/api/chart?symbol=${enc}&interval=1d&range=1mo` : null);
  const q = quote.data;
  const closes = chart.data?.quotes.map((b) => b.close).filter((c): c is number => c != null);
  const month = closes && closes.length > 1 ? (closes[closes.length - 1] / closes[0] - 1) * 100 : null;

  return (
    <tr ref={ref} className="border-b border-white/[0.07] last:border-0">
      <th scope="row" className="w-full max-w-0 py-2 pr-2 text-left font-normal">
        <Link href={`/s/${enc}`} className="flex min-h-11 flex-col justify-center hover:underline">
          <span className="ticker truncate">{symbol}</span>
          {q?.shortName && q.shortName !== symbol && <span className="truncate text-caption text-fg-3">{q.shortName}</span>}
        </Link>
      </th>
      <td className="whitespace-nowrap py-2 text-right tabular">
        {quote.error && !q ? <span className="text-fg-3">Unavailable</span>
          : !q ? <span className="skeleton ml-auto block h-3 w-16" aria-label="Loading" />
          : <span className={q.stale ? 'text-warn' : ''} title={q.stale ? 'Stale price' : undefined}>
              {formatMoney(q.regularMarketPrice, q.currency)}
            </span>}
      </td>
      <td className="whitespace-nowrap py-2 pl-2 text-right">{q ? <Change pct={q.regularMarketChangePercent} /> : null}</td>
      <td className="hidden py-2 pl-4 sm:table-cell">
        {month === null ? (chart.error ? <span className="block text-right text-caption text-fg-3">No chart</span> : null) : (
          <span className="flex items-center gap-3">
            <Sparkline data={closes} className="h-8 w-24" />
            <span className="w-16 text-right text-caption text-fg-2 tabular">{formatPct(month, 1)}</span>
          </span>
        )}
      </td>
      <td className="py-2 text-right">
        <button type="button" onClick={() => onRemove(symbol)} aria-label={`Remove ${symbol}`}
                className="ml-auto grid min-h-11 min-w-11 place-items-center text-fg-3 hover:text-fg">
          <X size={14} />
        </button>
      </td>
    </tr>
  );
}

export function WatchlistTable({ name, symbols, onRemove }: { name: string; symbols: string[]; onRemove: (s: string) => void }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-table">
        <caption className="sr-only">{name}: last price, change today and over one month</caption>
        <thead>
          <tr className="border-b border-white/10 text-left text-caption text-fg-3">
            <th scope="col" className="py-2 font-normal">Symbol</th>
            <th scope="col" className="py-2 text-right font-normal">Last</th>
            <th scope="col" className="py-2 text-right font-normal">Today</th>
            <th scope="col" className="hidden py-2 pl-4 text-right font-normal sm:table-cell">1 month</th>
            <th scope="col" className="w-11 py-2"><span className="sr-only">Remove</span></th>
          </tr>
        </thead>
        <tbody>
          {symbols.map((s) => <Row key={s} symbol={s} onRemove={onRemove} />)}
        </tbody>
      </table>
    </div>
  );
}
