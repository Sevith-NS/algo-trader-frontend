'use client';

import clsx from 'clsx';
import { useMemo, useState } from 'react';
import Chart from '@/components/Chart';
import { ErrorState, Skeleton } from '@/components/ui/States';
import { readStorage, useBrowserValue, useMediaQuery, writeStorage } from '@/lib/browser';
import { useApi } from '@/lib/useApi';
import type { QuantLevels } from '@/types/quant';

/** Each range loads extra history so long overlays (EMA 200) are warmed up at the left edge. */
const TIMEFRAMES = [
  { id: '5m', label: '5m', range: '1mo', visibleBars: 375 },
  { id: '15m', label: '15m', range: '1mo', visibleBars: 250 },
  { id: '60m', label: '1h', range: '2y', visibleBars: 500 },
  { id: '1d', label: '1D', range: '5y', visibleBars: 252 },
  { id: '1wk', label: '1W', range: 'max', visibleBars: 260 },
] as const;
type TfId = (typeof TIMEFRAMES)[number]['id'];

type Bar = { time: string | number; open: number; high: number; low: number; close: number };
type ChartResponse = { quotes: (Bar & { volume: number })[]; range_clamped: boolean; range: string; requested_range: string; interval: string };

const PLAN_KEY = 'flint.chart.plan-lines.v1';

export function ChartPanel({ symbol, levels }: { symbol: string; levels?: QuantLevels }) {
  const [tf, setTf] = useState<TfId>('1d');
  const height = useMediaQuery('(max-width: 767px)') ? 320 : 480;
  const storedPlan = useBrowserValue(() => readStorage(PLAN_KEY) !== 'off', true);
  const [planOverride, setPlanOverride] = useState<boolean | null>(null);
  const showPlan = planOverride ?? storedPlan;
  const frame = TIMEFRAMES.find((t) => t.id === tf)!;
  const { data, error, loading, reload } = useApi<ChartResponse>(
    `/api/chart?symbol=${encodeURIComponent(symbol)}&interval=${frame.id}&range=${frame.range}`,
  );

  const togglePlan = () => {
    const next = !showPlan;
    writeStorage(PLAN_KEY, next ? 'on' : 'off');
    setPlanOverride(next);
  };

  const bars = useMemo(() => {
    const key = (t: string | number) => (typeof t === 'number' ? t : new Date(t).getTime() / 1000);
    const sorted = (data?.quotes ?? [])
      .filter((q) => q.open != null && q.close != null && q.time != null)
      .map(({ time, open, high, low, close }) => ({ time, open, high, low, close }))
      .sort((a, b) => key(a.time) - key(b.time));
    return sorted.filter((b, i) => i === 0 || b.time !== sorted[i - 1].time);
  }, [data]);

  const priceLines = useMemo(() => {
    if (!showPlan || !levels) return undefined;
    const lines = [
      { price: levels.entry, color: '#F2F4F3', lineStyle: 0, lineWidth: 2, title: 'Entry' },
      { price: levels.stop_loss, color: '#E5484D', lineStyle: 3, lineWidth: 2, title: 'Stop' },
      { price: levels.target_1, color: '#2FBF71', lineStyle: 3, lineWidth: 1, title: 'T1' },
      { price: levels.target_2, color: '#2FBF71', lineStyle: 3, lineWidth: 2, title: 'T2' },
    ];
    return lines.filter((l) => l.price != null).map((l) => ({ ...l, axisLabelVisible: true }));
  }, [levels, showPlan]);

  return (
    <section aria-label="Price chart" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="group" aria-label="Timeframe" className="flex border border-control">
          {TIMEFRAMES.map((t) => (
            <button key={t.id} type="button" aria-pressed={tf === t.id} onClick={() => setTf(t.id)}
                    className={clsx('min-h-9 min-w-11 px-2 text-table tabular',
                      tf === t.id ? 'bg-ink-2 text-fg' : 'text-fg-2 hover:text-fg')}>
              {t.label}
            </button>
          ))}
        </div>
        {levels && (
          <button type="button" aria-pressed={showPlan} onClick={togglePlan}
                  className="min-h-9 px-2 text-table text-fg-2 underline-offset-4 hover:text-fg hover:underline">
            {showPlan ? 'Hide plan lines' : 'Show plan lines'}
          </button>
        )}
      </div>
      {data?.range_clamped && (
        <p className="text-caption text-fg-3">
          {data.interval} history is limited to {data.range} by the data provider (you asked for {data.requested_range}).
        </p>
      )}
      <div style={{ minHeight: height }}>
        {loading && !bars.length ? <Skeleton className="w-full" style={{ height }} />
          : error ? <ErrorState error={error} title="Couldn't load the chart" onRetry={reload} />
          : bars.length ? (
            <Chart data={bars as Parameters<typeof Chart>[0]['data']} visibleBars={frame.visibleBars} height={height} symbol={symbol}
                   colors={{ priceLines }} />
          ) : <p className="py-12 text-center text-body-sm text-fg-2">No price history for this timeframe.</p>}
      </div>
    </section>
  );
}
