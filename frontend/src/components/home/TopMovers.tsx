'use client';

import clsx from 'clsx';
import Link from 'next/link';
import { useState } from 'react';
import { Panel } from '@/components/PageHeader';
import { Change } from '@/components/ui/Change';
import { EmptyState, ErrorState, LoadingBlock } from '@/components/ui/States';
import { Tabs } from '@/components/ui/Tabs';
import { usePortfolio } from '@/context/PortfolioContext';
import { formatMoney, formatNumber } from '@/lib/format';
import { useApi } from '@/lib/useApi';
import type { MoversResponse } from '@/types/movers';

type Market = 'in' | 'us';
type Side = 'gainers' | 'losers';
const MARKETS: { id: Market; label: string }[] = [{ id: 'in', label: 'India' }, { id: 'us', label: 'US' }];
const SIDES: { id: Side; label: string }[] = [{ id: 'gainers', label: 'Gainers' }, { id: 'losers', label: 'Losers' }];
const ROWS = 6;

type Row = { symbol: string; href: string; name?: string; price: number; currency: string; change: number };

/** GET /api/market-overview: a fixed basket of 15 US large caps. */
type Overview = { all_assets?: { symbol: string; price: number; change: number }[]; error?: string };

// Only names that actually moved that way: on a red day the "top gainers" of a small basket can all be down.
const pick = (rows: Row[], side: Side) =>
  (side === 'gainers'
    ? rows.filter((r) => r.change > 0).sort((a, b) => b.change - a.change)
    : rows.filter((r) => r.change < 0).sort((a, b) => a.change - b.change)
  ).slice(0, ROWS);

function useMovers(market: Market, side: Side) {
  const india = useApi<MoversResponse>(market === 'in' ? `/api/movers?scope=allnse&limit=${ROWS}` : null, { refreshMs: 60_000 });
  const us = useApi<Overview>(market === 'us' ? '/api/market-overview' : null, { refreshMs: 120_000 });
  if (market === 'in') {
    const d = india.data;
    const rows = d ? [...d.gainers, ...d.losers].map((r): Row => ({
      symbol: r.symbol, href: `/s/${encodeURIComponent(r.yahoo)}`, name: r.name, price: r.price, currency: r.currency, change: r.change_pct,
    })) : [];
    const note = d && (d.partial
      ? `Covers ${formatNumber(d.priced, 0)} of ${formatNumber(d.scanned, 0)} NSE stocks (${d.coverage_pct}%) while prices load.`
      : `Across ${formatNumber(d.priced, 0)} NSE stocks${d.as_of ? `, as of ${d.as_of}` : ''}.`);
    return { ...india, rows: pick(rows, side), note, ready: Boolean(d) };
  }
  const assets = us.data?.all_assets;
  const rows = (assets ?? []).map((a): Row => ({
    symbol: a.symbol, href: `/s/${encodeURIComponent(a.symbol)}`, price: a.price, currency: 'USD', change: a.change,
  }));
  // The API answers 200 with { error } when its provider is rate limited.
  const error = us.error ?? (us.data && !assets ? new Error(us.data.error ?? 'US movers are unavailable right now.') : null);
  return { ...us, error, rows: pick(rows, side), note: 'Among 15 large US stocks, not the whole market.', ready: Boolean(assets) };
}

/** Today's biggest moves, India or US, up or down (docs/DESIGN.md §9.1). */
export function TopMovers() {
  const { profile } = usePortfolio();
  const [choice, setChoice] = useState<Market | null>(null);
  const [side, setSide] = useState<Side>('gainers');
  const market: Market = choice ?? (profile && !profile.markets.includes('india') && profile.markets.includes('us') ? 'us' : 'in');
  const { rows, note, ready, error, loading, reload } = useMovers(market, side);

  return (
    <Panel level={2} id="movers-h" title="Top movers" bodyClassName="flex flex-col gap-4"
           aside={market === 'in' && <Link href="/markets/movers" className="text-body-sm text-fg-2 underline-offset-4 hover:text-fg hover:underline">All movers</Link>}>
      <Tabs tabs={MARKETS} value={market} onChange={setChoice} label="Market" idPrefix="movers" />
      <div role="tabpanel" id={`movers-panel-${market}`} aria-labelledby={`movers-tab-${market}`} className="flex flex-col gap-3">
        <div role="group" aria-label="Direction" className="flex w-fit overflow-hidden rounded-sm border border-white/15 bg-black/30">
          {SIDES.map((s) => (
            <button key={s.id} type="button" aria-pressed={side === s.id} onClick={() => setSide(s.id)}
                    className={clsx('min-h-11 px-4 text-table', side === s.id ? 'bg-fg text-ink-0' : 'text-fg-2 hover:text-fg')}>
              {s.label}
            </button>
          ))}
        </div>

        {loading && !ready ? <LoadingBlock lines={ROWS} label="Loading movers" />
          : error && !ready ? <ErrorState error={error} title="Couldn't load movers" onRetry={reload} />
          : !rows.length ? (
            <EmptyState title={side === 'gainers' ? 'Nothing is up yet' : 'Nothing is down yet'}>
              {side === 'gainers' ? 'No stocks in this list are higher than yesterday’s close.' : 'No stocks in this list are lower than yesterday’s close.'}
            </EmptyState>
          ) : (
            <table className="w-full text-table">
              <caption className="sr-only">{`Top ${side} today, ${market === 'in' ? 'India' : 'US'}`}</caption>
              <thead>
                <tr className="border-b border-white/10 text-left text-caption text-fg-3">
                  <th scope="col" className="py-2 font-normal">Symbol</th>
                  <th scope="col" className="py-2 text-right font-normal">Last</th>
                  <th scope="col" className="py-2 text-right font-normal">Today</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.symbol} className="border-b border-white/[0.07] last:border-0">
                    <th scope="row" className="w-full max-w-0 py-2 pr-2 text-left font-normal">
                      <Link href={r.href} className="flex min-h-11 flex-col justify-center hover:underline">
                        <span className="ticker truncate">{r.symbol}</span>
                        {r.name && <span className="truncate text-caption text-fg-3">{r.name}</span>}
                      </Link>
                    </th>
                    <td className="whitespace-nowrap py-2 text-right tabular">{formatMoney(r.price, r.currency)}</td>
                    <td className="whitespace-nowrap py-2 pl-3 text-right"><Change pct={r.change} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        {ready && <p className="text-caption text-fg-3">{note} Prices are delayed.</p>}
      </div>
    </Panel>
  );
}
