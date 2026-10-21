'use client';

import { useState } from 'react';
import { Panel } from '@/components/PageHeader';
import { Change } from '@/components/ui/Change';
import { ErrorState, LoadingBlock } from '@/components/ui/States';
import { Tabs } from '@/components/ui/Tabs';
import { usePortfolio } from '@/context/PortfolioContext';
import { formatNumber } from '@/lib/format';
import { useApi } from '@/lib/useApi';
import type { MarketPulse } from '@/types/api';

type Market = 'in' | 'us';
const MARKETS: { id: Market; label: string }[] = [{ id: 'in', label: 'India' }, { id: 'us', label: 'US' }];

/** Advancers / decliners as one bar; the counts are always written out too. */
function BreadthBar({ b }: { b: MarketPulse['breadth'] }) {
  const total = b.advancing + b.declining + b.unchanged || 1;
  const pct = (n: number) => `${(n / total) * 100}%`;
  return (
    <div className="flex flex-col gap-2">
      <div aria-hidden="true" className="flex h-2 overflow-hidden rounded-full bg-white/[0.06]">
        <span className="bg-up" style={{ width: pct(b.advancing) }} />
        <span className="bg-fg-3/60" style={{ width: pct(b.unchanged) }} />
        <span className="bg-down" style={{ width: pct(b.declining) }} />
      </div>
      <p className="flex flex-wrap gap-x-4 gap-y-1 text-body-sm tabular">
        <span><span className="text-up">{formatNumber(b.advancing, 0)}</span> advancing</span>
        <span><span className="text-down">{formatNumber(b.declining, 0)}</span> declining</span>
        <span><span className="text-fg-2">{formatNumber(b.unchanged, 0)}</span> unchanged</span>
      </p>
      <p className="text-caption text-fg-3">
        Across {b.universe}.
        {b.partial && ` Covers ${formatNumber(b.priced, 0)} of ${formatNumber(b.scanned, 0)} (${b.coverage_pct}%) while prices load.`}
      </p>
    </div>
  );
}

/** Sector moves, strongest first, with a bar scaled to the biggest move of the day. */
function SectorTable({ pulse }: { pulse: MarketPulse }) {
  const max = Math.max(...pulse.sectors.map((s) => Math.abs(s.change_pct)), 0.01);
  return (
    <table className="w-full text-table">
      <caption className="sr-only">{pulse.label} sectors by today&apos;s change</caption>
      <thead>
        <tr className="border-b border-white/10 text-left text-caption text-fg-3">
          <th scope="col" className="py-2 font-normal">Sector</th>
          <th scope="col" className="w-2/5 py-2 font-normal"><span className="sr-only">Relative move</span></th>
          <th scope="col" className="py-2 text-right font-normal">Today</th>
        </tr>
      </thead>
      <tbody>
        {pulse.sectors.map((s) => (
          <tr key={s.symbol} className="border-b border-white/[0.07] last:border-0">
            <th scope="row" className="py-2.5 text-left font-normal">{s.name}</th>
            <td className="py-2.5 pr-4">
              <span aria-hidden="true" className="block h-1.5 rounded-full bg-white/[0.05]">
                <span className={`block h-full rounded-full ${s.change_pct >= 0 ? 'bg-up/70' : 'bg-down/70'}`}
                      style={{ width: `${Math.max(4, (Math.abs(s.change_pct) / max) * 100)}%` }} />
              </span>
            </td>
            <td className="py-2.5 text-right"><Change pct={s.change_pct} /></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Market breadth and sector heat for India or the US (docs/DESIGN.md §9.1). */
export function MarketBreadth() {
  const { profile } = usePortfolio();
  const [choice, setChoice] = useState<Market | null>(null);
  // Until the person picks, lead with the market they trade.
  const market: Market = choice ?? (profile && !profile.markets.includes('india') && profile.markets.includes('us') ? 'us' : 'in');
  const { data, error, loading, reload } = useApi<MarketPulse>(`/api/markets/pulse?market=${market}`, { refreshMs: 60_000 });

  return (
    <Panel level={2} id="breadth-h" title="Market breadth" bodyClassName="flex flex-col gap-4">
      <Tabs tabs={MARKETS} value={market} onChange={setChoice} label="Market" idPrefix="breadth" />
      <div role="tabpanel" id={`breadth-panel-${market}`} aria-labelledby={`breadth-tab-${market}`} className="flex flex-col gap-5">
        {loading && !data ? <LoadingBlock lines={5} label="Loading market breadth" />
          : error && !data ? <ErrorState error={error} title="Couldn't load market breadth" onRetry={reload} />
          : data && (
            <>
              <BreadthBar b={data.breadth} />
              <SectorTable pulse={data} />
              {data.missing.length > 0 && (
                <p className="text-caption text-warn">
                  {data.missing.length === 1 ? 'One index or sector' : `${data.missing.length} indices or sectors`} had no price this time, so {data.missing.length === 1 ? 'it isn’t' : 'they aren’t'} shown.
                </p>
              )}
            </>
          )}
      </div>
    </Panel>
  );
}
