'use client';

import clsx from 'clsx';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/States';
import { formatCompact, formatMoney, formatNumber, formatPct } from '@/lib/format';
import type { SizeResult } from '@/lib/sizing';
import type { MlInsights, QuantSignals } from '@/types/quant';

export function KV({ label, children, hint }: { label: string; children: ReactNode; hint?: ReactNode }) {
  return (
    <div className="flex min-h-10 items-baseline justify-between gap-4 border-b border-line py-2">
      <dt className="text-body-sm text-fg-2">{label}</dt>
      <dd className="text-right text-body-sm tabular">
        {children}
        {hint && <span className="ml-1.5 text-caption text-fg-3">{hint}</span>}
      </dd>
    </div>
  );
}

/** Overview column: the plan in one glance, sized to the user's own risk. */
export function PlanSummary({ quant, currency, size, baseCurrency, riskPct, onTrade, canTrade, fractional }: {
  quant: QuantSignals | undefined;
  currency: string;
  size: SizeResult | null;
  baseCurrency: string;
  riskPct: number | null;
  onTrade: () => void;
  canTrade: boolean;
  fractional: boolean;
}) {
  const l = quant?.levels;
  return (
    <section aria-labelledby="plan-h" className="glass rounded-2xl p-5 md:p-6 flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <h2 id="plan-h" className="flex items-center gap-3 text-micro uppercase text-fg"><span aria-hidden="true" className="ring-dot text-fg" />Trade plan</h2>
        <span className="text-caption text-fg-3">Daily bars</span>
      </div>
      {!quant || !l ? (
        <EmptyState title="No plan for this symbol">
          There isn&apos;t enough clean price history to compute entry, stop and targets. Check the chart and try another timeframe or symbol.
        </EmptyState>
      ) : (
        <dl>
          <KV label="Plan side">{l.side === 'short' ? 'Short' : 'Long'}</KV>
          <KV label="Entry" hint="limit">{formatMoney(l.entry, currency)}</KV>
          <KV label="Stop" hint={l.atr_stop_mult ? `${l.atr_stop_mult.toFixed(1)}× ATR` : undefined}>{formatMoney(l.stop_loss, currency)}</KV>
          <KV label="Target 1" hint={l.r_multiple_1 ? `${l.r_multiple_1.toFixed(1)}R` : undefined}>{formatMoney(l.target_1, currency)}</KV>
          <KV label="Target 2" hint={l.r_multiple_2 ? `${l.r_multiple_2.toFixed(1)}R` : undefined}>{formatMoney(l.target_2, currency)}</KV>
          <KV label="Size" hint={riskPct ? `${riskPct}% risk` : undefined}>
            {size && size.quantity > 0 ? formatNumber(size.quantity, fractional ? 4 : 0) : '–'}
          </KV>
          <KV label="At risk if stopped">
            <span className="text-down">{size && size.quantity > 0 ? `−${formatMoney(size.riskBase, baseCurrency)}` : '–'}</span>
          </KV>
        </dl>
      )}
      {size?.cappedByCash && <p className="text-caption text-warn">Cash limits this size below your risk budget.</p>}
      <p className="text-caption text-fg-3">Levels computed from price history by a published formula. Not a recommendation; you decide whether to trade.</p>
      <Button onClick={onTrade} disabled={!canTrade}>Paper trade</Button>
    </section>
  );
}

export function KeyStats({ quote, currency }: {
  quote: { fiftyTwoWeekHigh?: number; fiftyTwoWeekLow?: number; regularMarketVolume?: number; previousClose?: number } | undefined;
  currency: string;
}) {
  return (
    <section aria-labelledby="stats-h" className="glass rounded-2xl p-5 md:p-6 flex flex-col gap-3">
      <h2 id="stats-h" className="flex items-center gap-3 text-micro uppercase text-fg"><span aria-hidden="true" className="ring-dot text-fg" />Key stats</h2>
      <dl>
        <KV label="Previous close">{formatMoney(quote?.previousClose, currency)}</KV>
        <KV label="52-week high">{formatMoney(quote?.fiftyTwoWeekHigh, currency)}</KV>
        <KV label="52-week low">{formatMoney(quote?.fiftyTwoWeekLow, currency)}</KV>
        <KV label="Volume">{formatCompact(quote?.regularMarketVolume)}</KV>
      </dl>
    </section>
  );
}

function FactorBar({ label, value }: { label: string; value: number }) {
  const width = Math.min(Math.abs(value), 1) * 50;
  const up = value >= 0;
  return (
    <div className="grid grid-cols-[8rem_1fr_3.5rem] items-center gap-3 py-1.5">
      <span className="text-body-sm capitalize text-fg-2">{label.replace(/_/g, ' ')}</span>
      <span className="relative h-1.5 bg-white/[0.06]" aria-hidden="true">
        <span className="absolute inset-y-0 left-1/2 w-px bg-line-strong" />
        <span className={clsx('absolute inset-y-0', up ? 'left-1/2 bg-up' : 'right-1/2 bg-down')} style={{ width: `${width}%` }} />
      </span>
      <span className={clsx('text-right text-table tabular', up ? 'text-up' : 'text-down')}>
        {up ? '+' : '−'}{Math.abs(value).toFixed(2)}
      </span>
    </div>
  );
}

/** Plan tab: how the plan was reached, every input visible. */
export function PlanDetail({ quant, ml, currency }: {
  quant: QuantSignals | undefined; ml: MlInsights | undefined; currency: string;
}) {
  if (!quant?.levels) {
    return <EmptyState title="No plan for this symbol">There isn&apos;t enough clean price history to compute a plan.</EmptyState>;
  }
  const l = quant.levels;
  const ind = quant.indicators;
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <section aria-labelledby="levels-h" className="glass rounded-2xl p-5 md:p-6 flex flex-col gap-3">
        <h2 id="levels-h" className="flex items-center gap-3 text-micro uppercase text-fg"><span aria-hidden="true" className="ring-dot text-fg" />Levels and odds</h2>
        <dl>
          <KV label="Entry (limit)" hint={l.fill_probability != null ? `${Math.round(l.fill_probability * 100)}% fill in 5 days` : undefined}>{formatMoney(l.entry, currency)}</KV>
          <KV label="Stop" hint={l.atr_stop_mult != null ? `${l.atr_stop_mult.toFixed(2)}× ATR or swing` : undefined}>{formatMoney(l.stop_loss, currency)}</KV>
          <KV label="Target 1" hint={l.win_probability != null ? `${Math.round(l.win_probability * 100)}% reach before stop` : undefined}>{formatMoney(l.target_1, currency)}</KV>
          <KV label="Target 2" hint={l.expectancy_r != null ? `expectancy ${l.expectancy_r > 0 ? '+' : ''}${l.expectancy_r.toFixed(2)}R` : undefined}>{formatMoney(l.target_2, currency)}</KV>
          <KV label="Composite score">{quant.composite_score > 0 ? '+' : ''}{quant.composite_score}</KV>
        </dl>
      </section>

      {quant.factors && (
        <section aria-labelledby="factors-h" className="glass rounded-2xl p-5 md:p-6 flex flex-col gap-3">
          <h2 id="factors-h" className="flex items-center gap-3 text-micro uppercase text-fg"><span aria-hidden="true" className="ring-dot text-fg" />Factor readings</h2>
          <p className="text-caption text-fg-3">Each factor reads from {'−'}1 (weaker on that measure) to +1 (stronger). The levels are solved from their weighted sum, the composite score.</p>
          <div>{Object.entries(quant.factors).map(([k, v]) => <FactorBar key={k} label={k} value={v} />)}</div>
        </section>
      )}

      {ind && (
        <section aria-labelledby="tech-h" className="glass rounded-2xl p-5 md:p-6 flex flex-col gap-3">
          <h2 id="tech-h" className="flex items-center gap-3 text-micro uppercase text-fg"><span aria-hidden="true" className="ring-dot text-fg" />Technical readout</h2>
          <dl>
            <KV label="RSI (14)" hint={ind.rsi_14 >= 70 ? 'overbought' : ind.rsi_14 <= 30 ? 'oversold' : undefined}>{formatNumber(ind.rsi_14, 1)}</KV>
            <KV label="Z-score (20 days)">{formatNumber(ind.zscore_20d, 2)}</KV>
            {ind.half_life_days ? <KV label="Mean-reversion half-life">{formatNumber(ind.half_life_days, 1)} days</KV> : null}
            <KV label="VWAP (20 days)" hint={formatPct(ind.vwap_deviation_pct)}>{formatMoney(ind.vwap_20d, currency)}</KV>
            <KV label="ATR (14)">{formatMoney(ind.atr_14, currency)}</KV>
            <KV label="Realised volatility" hint={`${ind.vol_regime_percentile}th percentile`}>{formatPct(ind.realized_vol_annual * 100, 1).replace('+', '')} a year</KV>
            <KV label="Bollinger %B">{formatNumber(ind.bollinger_pct_b, 2)}</KV>
          </dl>
        </section>
      )}

      {ml && (
        <section aria-labelledby="ml-h" className="glass rounded-2xl p-5 md:p-6 flex flex-col gap-3">
          <div className="flex items-baseline gap-3">
            <h2 id="ml-h" className="flex items-center gap-3 text-micro uppercase text-fg"><span aria-hidden="true" className="ring-dot text-fg" />Model forecasts</h2>
            <span className="pill border-warn/50 bg-warn/10 text-warn">In-sample</span>
          </div>
          <p className="text-caption text-fg-3">These models are scored on the same history they learned from, so they overstate their own accuracy. Treat them as context, not a signal.</p>
          <dl>
            <KV label="Next day up (XGBoost)">{formatPct(ml.xgboost_probability * 100, 0).replace('+', '')}</KV>
            <KV label="News sentiment">{ml.fear_greed_index} of 100</KV>
          </dl>
        </section>
      )}
    </div>
  );
}
