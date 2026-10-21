'use client';

import clsx from 'clsx';
import Link from 'next/link';
import { Change } from '@/components/ui/Change';
import { Skeleton } from '@/components/ui/States';
import { formatNumber, timeAgo } from '@/lib/format';
import { useApi } from '@/lib/useApi';
import type { FxQuote, MarketPulse } from '@/types/api';

const REFRESH_MS = 60_000;

/** The headline tiles, in the order of docs/DESIGN.md §9.1. */
const TILES: { market: 'in' | 'us'; symbol: string; label: string }[] = [
  { market: 'in', symbol: '^NSEI', label: 'NIFTY 50' },
  { market: 'in', symbol: '^BSESN', label: 'SENSEX' },
  { market: 'in', symbol: '^NSEBANK', label: 'NIFTY BANK' },
  { market: 'us', symbol: '^GSPC', label: 'S&P 500' },
  { market: 'us', symbol: '^IXIC', label: 'NASDAQ' },
];

const tileClass = 'glass flex min-w-[10.5rem] shrink-0 snap-start flex-col gap-1 rounded-xl px-4 py-3';

function SessionDot({ open }: { open: boolean }) {
  return (
    <span className={clsx('inline-flex items-center gap-1.5 text-caption', open ? 'text-up' : 'text-fg-3')}>
      <span aria-hidden="true" className={clsx('h-1.5 w-1.5 rounded-full', open ? 'bg-up' : 'border border-fg-3')} />
      {open ? 'Open' : 'Closed'}
    </span>
  );
}

function Tile({ label, href, value, pct, open, grouping, note }: {
  label: string; href: string; value: number; pct: number | null; open?: boolean; grouping: string; note?: string;
}) {
  return (
    <li>
      <Link href={href} className={clsx(tileClass, 'hover:border-white/20')}>
        <span className="flex items-center justify-between gap-3">
          <span className="text-micro uppercase text-fg-2">{label}</span>
          {open !== undefined && <SessionDot open={open} />}
        </span>
        <span className="text-h4 tabular">{formatNumber(value, 2, grouping)}</span>
        {pct !== null ? <Change pct={pct} className="text-caption" /> : <span className="text-caption text-fg-3">{note ?? '–'}</span>}
      </Link>
    </li>
  );
}

function Missing({ label }: { label: string }) {
  return (
    <li className={tileClass}>
      <span className="text-micro uppercase text-fg-2">{label}</span>
      <span className="text-body-sm text-warn">Unavailable</span>
    </li>
  );
}

/** India and US headline indices plus USD/INR, with session state. Delayed data, labelled. */
export function IndicesStrip() {
  const india = useApi<MarketPulse>('/api/markets/pulse?market=in', { refreshMs: REFRESH_MS });
  const us = useApi<MarketPulse>('/api/markets/pulse?market=us', { refreshMs: REFRESH_MS });
  const fx = useApi<FxQuote>('/api/fx?pair=USDINR', { refreshMs: REFRESH_MS });
  const pulses = { in: india, us };
  const updated = [india.data?.computed_at, us.data?.computed_at].filter(Boolean).sort()[0];

  return (
    <section aria-labelledby="indices-h" className="flex flex-col gap-2">
      <h2 id="indices-h" className="sr-only">Market indices</h2>
      <ul className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] md:mx-0 md:px-0">
        {TILES.map((t) => {
          const p = pulses[t.market];
          if (p.loading && !p.data) return <li key={t.symbol} className={tileClass}><Skeleton className="h-4 w-20" /><Skeleton className="h-6 w-28" /></li>;
          const row = p.data?.indices.find((r) => r.symbol === t.symbol);
          if (!row) return <Missing key={t.symbol} label={t.label} />;
          return <Tile key={t.symbol} label={t.label} href={`/s/${encodeURIComponent(t.symbol)}`} value={row.price}
                       pct={row.change_pct} open={p.data?.session.state === 'open'}
                       grouping={t.market === 'in' ? 'INR' : 'USD'} />;
        })}
        {fx.loading && !fx.data ? <li className={tileClass}><Skeleton className="h-4 w-20" /><Skeleton className="h-6 w-28" /></li>
          : fx.data ? <Tile label="USD/INR" href="/s/USDINR%3DX" value={fx.data.rate} pct={null} grouping="INR" note="INR per USD" />
          : <Missing label="USD/INR" />}
      </ul>
      <p className="text-caption text-fg-3">
        Delayed data from Yahoo Finance{updated ? `, updated ${timeAgo(updated)}` : ''}. Session state uses regular hours; holidays aren&apos;t applied.
        {fx.data?.stale && ' The USD/INR rate is out of date.'}
      </p>
    </section>
  );
}
