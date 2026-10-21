'use client';

import clsx from 'clsx';
import { useState } from 'react';
import { PerformanceChart } from '@/components/portfolio/PerformanceChart';
import { usePortfolioSelection } from '@/components/portfolio/selection';
import { ButtonLink } from '@/components/ui/Button';
import { EmptyState, ErrorState, LoadingBlock } from '@/components/ui/States';
import { usePortfolio } from '@/context/PortfolioContext';
import { useMediaQuery } from '@/lib/browser';
import { direction, formatPct } from '@/lib/format';
import { useApi } from '@/lib/useApi';
import type { Account, Performance, PerformancePeriod } from '@/types/api';

const PERIODS: { id: PerformancePeriod; label: string }[] = [
  { id: '1m', label: '1M' }, { id: '3m', label: '3M' }, { id: '6m', label: '6M' },
  { id: '1y', label: '1Y' }, { id: 'ytd', label: 'YTD' }, { id: 'all', label: 'All' },
];

const MEASURES = {
  twr: { label: 'Time-weighted', short: 'TWR', explain: 'How the investments did, ignoring when money went in or out. Use it to compare with the benchmark.' },
  xirr: { label: 'Money-weighted', short: 'XIRR', explain: 'Your annualised return on the money you actually put in, so the timing of deposits counts.' },
} as const;
type Measure = keyof typeof MEASURES;

const dateLabel = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

function Segmented<T extends string>({ label, options, value, onChange }: {
  label: string; options: { id: T; label: string }[]; value: T; onChange: (v: T) => void;
}) {
  return (
    <div role="group" aria-label={label} className="flex w-fit overflow-hidden rounded-sm border border-white/15 bg-black/30">
      {options.map((o) => (
        <button key={o.id} type="button" aria-pressed={value === o.id} onClick={() => onChange(o.id)}
                className={clsx('min-h-11 min-w-11 px-3 text-table tabular', value === o.id ? 'bg-fg text-ink-0' : 'text-fg-2 hover:text-fg')}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** A signed return with an arrow, so the direction never rests on colour. `points` for a difference of two returns. */
function Figure({ pct, points = false, hero = false }: { pct: number; points?: boolean; hero?: boolean }) {
  const dir = direction(pct);
  return (
    <span className={clsx('tabular', dir === 'up' ? 'text-up' : dir === 'down' ? 'text-down' : 'text-fg', hero && 'text-figure')}>
      <span aria-hidden="true" className={clsx(hero && 'align-middle text-[0.6em]')}>{dir === 'up' ? '▲ ' : dir === 'down' ? '▼ ' : ''}</span>
      {points ? `${formatPct(pct).replace('%', '')} pts` : formatPct(pct)}
    </span>
  );
}

function AccountPerformance({ account }: { account: Account }) {
  const [period, setPeriod] = useState<PerformancePeriod>('6m');
  const [measure, setMeasure] = useState<Measure>('twr');
  const height = useMediaQuery('(max-width: 767px)') ? 260 : 360;
  const { data, error, reload } = useApi<Performance>(`/api/accounts/${account.id}/performance?period=${period}`);
  const fresh = data?.period === period ? data : undefined;
  const value = fresh ? (measure === 'twr' ? fresh.twr_pct : fresh.xirr_pct) : null;
  const bench = fresh?.benchmark;
  const paper = account.kind === 'paper';

  return (
    <section aria-labelledby="perf-h" className="glass flex flex-col gap-5 rounded-2xl p-5 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="perf-h" className="text-h4">Performance</h2>
        <Segmented label="Period" options={PERIODS} value={period} onChange={setPeriod} />
      </div>

      {error && !data ? <ErrorState error={error} title="Couldn't load performance" onRetry={reload} />
        : !fresh ? <LoadingBlock lines={4} label="Loading performance" />
        : fresh.series.length < 2 ? (
          <EmptyState title="Not enough history yet">
            {paper ? 'Performance starts once the account has a few days of history.'
              : 'Performance is built from daily syncs, so it starts after the second sync of this account.'}
          </EmptyState>
        ) : (
          <>
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div className="flex flex-col gap-1.5">
                <Segmented label="Measure" options={(Object.keys(MEASURES) as Measure[]).map((id) => ({ id, label: MEASURES[id].short }))}
                           value={measure} onChange={setMeasure} />
                <p className="mt-2 text-caption text-fg-3">{MEASURES[measure].label}</p>
                {value !== null ? <Figure pct={value} hero />
                  : <p className="text-body text-fg-2">{measure === 'xirr' ? fresh.xirr_note ?? 'Unavailable' : 'Unavailable'}</p>}
                <p className="max-w-prose text-body-sm text-fg-2">{MEASURES[measure].explain}</p>
              </div>
              <dl className="flex flex-col gap-1 text-body-sm md:text-right">
                <div className="flex gap-2 md:justify-end">
                  <dt className="text-fg-2">{bench ? bench.name : 'Benchmark'}</dt>
                  <dd>{bench?.return_pct != null ? <Figure pct={bench.return_pct} /> : <span className="text-fg-3">Unavailable</span>}</dd>
                </div>
                {fresh.twr_pct != null && bench?.return_pct != null && (
                  <div className="flex gap-2 md:justify-end">
                    <dt className="text-fg-2">Versus benchmark (TWR)</dt>
                    <dd><Figure pct={fresh.twr_pct - bench.return_pct} points /></dd>
                  </div>
                )}
                <div className="text-caption text-fg-3 tabular">
                  {fresh.start && fresh.end && `${dateLabel(fresh.start)} to ${dateLabel(fresh.end)}`}
                </div>
              </dl>
            </div>

            <figure className="flex flex-col gap-2">
              <PerformanceChart portfolio={fresh.series} benchmark={bench?.series} paper={paper} height={height} />
              <figcaption className="flex flex-wrap gap-x-5 gap-y-1 text-caption text-fg-2">
                <span className="flex items-center gap-2">
                  <span aria-hidden="true" className={clsx('h-0.5 w-5', paper ? 'bg-paper' : 'bg-fg')} />
                  {account.name}{paper && ' (paper)'}, growth of 100
                </span>
                {bench && (
                  <span className="flex items-center gap-2">
                    <span aria-hidden="true" className="w-5 border-t border-dashed border-fg-3" />
                    {bench.name}
                  </span>
                )}
              </figcaption>
            </figure>
          </>
        )}

      {fresh && <p className="text-caption text-fg-3">{fresh.method}</p>}
    </section>
  );
}

export default function PerformancePage() {
  const { loading } = usePortfolio();
  const { selection } = usePortfolioSelection();

  if (selection.mode === 'none') {
    return loading ? <LoadingBlock lines={4} label="Loading accounts" />
      : <EmptyState title="No portfolio yet">Open a paper portfolio or connect a broker to see performance.</EmptyState>;
  }
  if (selection.mode === 'paper') return <AccountPerformance key={selection.account.id} account={selection.account} />;
  if (selection.accounts.length === 1) return <AccountPerformance key={selection.accounts[0].id} account={selection.accounts[0]} />;
  return (
    <EmptyState title="Performance is measured per account"
                action={
                  <div className="flex flex-wrap gap-2">
                    {selection.accounts.map((a) => (
                      <ButtonLink key={a.id} variant="secondary" href={`/portfolio/performance?p=${encodeURIComponent(a.id)}`}>
                        {a.name}
                      </ButtonLink>
                    ))}
                  </div>
                }>
      Each account is synced separately, so returns aren&apos;t combined. Pick one.
    </EmptyState>
  );
}
