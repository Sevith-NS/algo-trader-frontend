'use client';

import { useMemo } from 'react';
import HoldingsIntel from '@/components/intel/HoldingsIntel';
import { EmptyState, ErrorState, LoadingBlock } from '@/components/ui/States';
import { usePortfolio } from '@/context/PortfolioContext';
import { apiPost } from '@/lib/api';
import { formatMoney, formatNumber, formatPct } from '@/lib/format';
import { usePostQuery } from '@/lib/useApi';

type Analytics = {
  risk: {
    var_95_daily_pct: number;
    var_95_daily_usd: number;
    cvar_95_daily_pct: number;
    cvar_95_daily_usd: number;
    annual_volatility_pct: number;
    max_drawdown_pct: number;
    sharpe_ratio: number;
    sortino_ratio: number;
    beta_vs_sp500: number | null;
    diversification_score: number;
  };
  weights: Record<string, number>;
  sector_allocation: Record<string, number>;
};

const MAX = 12;

function Metric({ label, value, explain }: { label: string; value: string; explain: string }) {
  return (
    <div className="flex flex-col gap-1 border-b border-line py-3">
      <dt className="flex items-baseline justify-between gap-4">
        <span className="text-body-sm text-fg-2">{label}</span>
        <span className="text-body font-medium tabular text-fg">{value}</span>
      </dt>
      <dd className="text-caption text-fg-3">{explain}</dd>
    </div>
  );
}

function Bars({ data, label }: { data: Record<string, number>; label: string }) {
  const rows = Object.entries(data).sort((a, b) => b[1] - a[1]);
  return (
    <ul aria-label={label} className="flex flex-col gap-2">
      {rows.map(([k, v]) => (
        <li key={k} className="grid grid-cols-[minmax(0,9rem)_1fr_3.5rem] items-center gap-3 text-body-sm">
          <span className="truncate text-fg-2">{k}</span>
          <span className="h-1.5 bg-white/[0.06]" aria-hidden="true"><span className="block h-full bg-fg-2" style={{ width: `${Math.max(1, v * 100)}%` }} /></span>
          <span className="text-right tabular">{(v * 100).toFixed(1)}%</span>
        </li>
      ))}
    </ul>
  );
}

export default function Risk() {
  const { book, loading: bookLoading } = usePortfolio();

  const analysed = useMemo(() => [...(book?.positions ?? [])]
    .sort((a, b) => Number(b.market_value ?? b.cost_basis) - Number(a.market_value ?? a.cost_basis))
    .slice(0, MAX), [book]);
  const currencies = new Set((book?.positions ?? []).map((p) => p.currency));
  const ccy = book?.account.currency ?? 'USD';

  const body = useMemo(() => book && analysed.length ? {
    balance: Number(book.cash),
    positions: analysed.map((p) => {
      const fx = p.fx_rate ? Number(p.fx_rate) : 1;
      return { symbol: p.symbol, shares: Number(p.quantity), averagePrice: Number(p.avg_cost) / fx, fx_rate: fx };
    }),
  } : null, [book, analysed]);
  const { data, error, loading, reload } = usePostQuery<Analytics>(body ? '/api/portfolio-analytics' : null, body, apiPost);

  if (bookLoading && !book) return <LoadingBlock lines={6} label="Loading portfolio" />;
  if (!analysed.length) {
    return <EmptyState title="Nothing to measure yet">Risk needs at least one open position with price history.</EmptyState>;
  }

  const r = data?.risk;
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section aria-labelledby="risk-h" className="glass rounded-2xl p-5 md:p-6 flex flex-col gap-3">
          <h2 id="risk-h" className="flex items-center gap-3 text-micro uppercase text-fg"><span aria-hidden="true" className="ring-dot text-fg" />How much could this lose?</h2>
          {loading && !data ? <LoadingBlock lines={6} label="Measuring risk" />
            : error ? <ErrorState error={error} title="Couldn't measure risk" onRetry={reload} />
            : r && (
              <dl>
                <Metric label="Value at risk, 1 day (95%)" value={`${formatMoney(r.var_95_daily_usd, ccy, 0)} · ${formatPct(r.var_95_daily_pct)}`}
                        explain="On 19 of 20 days, the invested part of your book lost less than this, based on the past year." />
                <Metric label="Expected shortfall (95%)" value={`${formatMoney(r.cvar_95_daily_usd, ccy, 0)} · ${formatPct(r.cvar_95_daily_pct)}`}
                        explain="The average loss on the worst 1 in 20 days. This is what a bad day actually looks like." />
                <Metric label="Worst drop from a high" value={formatPct(r.max_drawdown_pct)}
                        explain="The deepest fall from a peak over the past year if you'd held today's mix." />
                <Metric label="Volatility, yearly" value={`${formatNumber(r.annual_volatility_pct, 1)}%`}
                        explain="How much the book typically swings in a year. Higher means a bumpier ride." />
                <Metric label="Sharpe / Sortino" value={`${formatNumber(r.sharpe_ratio, 2)} / ${formatNumber(r.sortino_ratio, 2)}`}
                        explain="Return per unit of risk (Sortino counts only downside swings). Above 1 is good." />
                {r.beta_vs_sp500 !== null && (
                  <Metric label="Beta vs S&P 500" value={formatNumber(r.beta_vs_sp500, 2)}
                          explain="How much the book moves with the US market. 1 moves with it; below 1 moves less." />
                )}
                <Metric label="Diversification" value={`${formatNumber(r.diversification_score, 0)} of 100`}
                        explain="Higher means money is spread across more holdings rather than piled into one." />
              </dl>
            )}
          <p className="text-caption text-fg-3">
            {book && book.positions.length > MAX && `Covers your ${MAX} largest holdings. `}
            {currencies.size > 1 && 'Holdings are weighted in your base currency; currency moves themselves aren’t modelled yet. '}
            Past behaviour, not a forecast.
          </p>
        </section>

        {data && (
          <section aria-labelledby="mix-h" className="glass rounded-2xl p-5 md:p-6 flex flex-col gap-6">
            <h2 id="mix-h" className="flex items-center gap-3 text-micro uppercase text-fg"><span aria-hidden="true" className="ring-dot text-fg" />Where the money sits</h2>
            <Bars data={data.weights} label="Weight by holding" />
            {Object.keys(data.sector_allocation).length > 1 && (
              <>
                <h3 className="text-body-sm font-medium text-fg-2">By sector</h3>
                <Bars data={data.sector_allocation} label="Weight by sector" />
              </>
            )}
          </section>
        )}
      </div>

      <HoldingsIntel positions={analysed.map((p) => ({ symbol: p.symbol, shares: Number(p.quantity), averagePrice: Number(p.avg_cost) }))} />
    </div>
  );
}
