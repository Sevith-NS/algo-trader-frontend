'use client';

import { useState } from 'react';
import clsx from 'clsx';
import { ArrowDownRight, ArrowUpRight, Layers, ListOrdered, Ruler, TrendingUp } from 'lucide-react';
import type { BacktestResult, MonthlyRow, Num, TradeRow } from '../../types/backtest';
import { money, num, pct, ratio, shortDate, signedPct, toneFor } from '../../lib/backtest';
import { MicroLabel } from '../agents/DeskAtoms';
import EquityChart from './EquityChart';

/* ------------------------------------------------------------------ atoms */

function Headline({ label, value, tone, sub }: {
  label: string; value: string; tone?: string; sub?: string;
}) {
  return (
    <div className="rounded-xl border border-borderSubtle bg-white/[0.02] p-3">
      <MicroLabel>{label}</MicroLabel>
      <div className={clsx('mt-1 text-xl font-bold tabular', tone ?? 'text-textPrimary')}>
        {value}
      </div>
      {sub && <div className="mt-0.5 text-[10px] text-textMuted">{sub}</div>}
    </div>
  );
}

function Line({ label, value, tone, title }: {
  label: string; value: React.ReactNode; tone?: string; title?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1" title={title}>
      <span className="text-[11px] text-textMuted">{label}</span>
      <span className={clsx('text-[12px] font-medium tabular', tone ?? 'text-textPrimary')}>
        {value}
      </span>
    </div>
  );
}

function Card({ title, icon, children }: {
  title: string; icon?: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-borderSubtle bg-white/[0.02] p-4">
      <h4 className="mb-2 flex items-center gap-1.5 border-b border-borderSubtle pb-2 text-[11px] font-mono uppercase tracking-wider text-textMuted">
        {icon} {title}
      </h4>
      {children}
    </div>
  );
}

/* ------------------------------------------------------- monthly returns */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Colour scaled against the best and worst month in THIS run, not a fixed
 * range: a scale pinned to ±10% renders an intraday strategy's whole grid a
 * uniform grey, and one pinned to ±1% renders a decade of daily bars solid.
 */
function monthTint(value: Num, extreme: number): string | undefined {
  if (value === null || value === undefined || !Number.isFinite(value)) return undefined;
  const weight = Math.min(Math.abs(value) / (extreme || 1), 1) * 0.55 + 0.06;
  return value >= 0
    ? `rgba(52, 211, 153, ${weight.toFixed(3)})`
    : `rgba(248, 113, 113, ${weight.toFixed(3)})`;
}

function MonthlyGrid({ rows }: { rows: MonthlyRow[] }) {
  if (!rows.length) {
    return <p className="text-[11px] text-textMuted">Not enough history for a monthly grid.</p>;
  }
  const extreme = rows.reduce((m, r) => {
    const vals = Object.values(r.months).filter((v): v is number => typeof v === 'number');
    return Math.max(m, ...vals.map(Math.abs), 0);
  }, 0);

  return (
    <div className="-mx-1 overflow-x-auto">
      <table className="w-full min-w-[640px] border-separate border-spacing-[2px] text-[10px] tabular">
        <thead>
          <tr className="text-textMuted">
            <th className="text-left font-mono font-normal">Year</th>
            {MONTHS.map((m) => <th key={m} className="font-mono font-normal">{m}</th>)}
            <th className="font-mono font-normal">Year</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.year}>
              <td className="pr-1 text-left font-mono text-textSecondary">{row.year}</td>
              {MONTHS.map((m) => {
                const v = row.months[m];
                return (
                  <td
                    key={m}
                    className="rounded px-1 py-1 text-center text-textPrimary"
                    style={{ background: monthTint(v, extreme) }}
                  >
                    {typeof v === 'number' ? (v * 100).toFixed(1) : ''}
                  </td>
                );
              })}
              <td className={clsx('rounded border border-borderSubtle px-1 py-1 text-center font-semibold',
                                  toneFor(row.total))}>
                {typeof row.total === 'number' ? `${(row.total * 100).toFixed(1)}` : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-1.5 px-1 text-[10px] text-textMuted">Figures are percent returns.</p>
    </div>
  );
}

/* ------------------------------------------------------------- trade log */

const PAGE = 25;

function TradeTable({ trades, currency }: {
  trades: { rows: TradeRow[]; total: number; truncated: boolean }; currency: string;
}) {
  const [shown, setShown] = useState(PAGE);
  if (!trades.rows.length) {
    return <p className="text-[11px] text-textMuted">This strategy took no trades on these bars.</p>;
  }
  // Newest first: the most recent trades are the ones being reasoned about.
  const ordered = [...trades.rows].reverse();

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] text-[11px] tabular">
          <thead>
            <tr className="border-b border-borderSubtle text-left font-mono text-[10px] uppercase tracking-wider text-textMuted">
              <th className="py-1.5 pr-2 font-normal">Side</th>
              <th className="py-1.5 pr-2 font-normal">Entry</th>
              <th className="py-1.5 pr-2 text-right font-normal">Price</th>
              <th className="py-1.5 pr-2 font-normal">Exit</th>
              <th className="py-1.5 pr-2 text-right font-normal">Price</th>
              <th className="py-1.5 pr-2 text-right font-normal">Bars</th>
              <th className="py-1.5 pr-2 text-right font-normal" title="Return on the capital committed">Return</th>
              <th className="py-1.5 pr-2 text-right font-normal">P&amp;L</th>
              <th className="py-1.5 pr-2 text-right font-normal" title="Worst adverse excursion while open">MAE</th>
              <th className="py-1.5 pr-2 text-right font-normal" title="Best favourable excursion while open">MFE</th>
              <th className="py-1.5 font-normal">Exit reason</th>
            </tr>
          </thead>
          <tbody>
            {ordered.slice(0, shown).map((t, i) => (
              <tr key={`${t.entry_time}-${i}`} className="border-b border-borderSubtle/50">
                <td className="py-1.5 pr-2">
                  <span className={t.direction > 0 ? 'text-accentGreen' : 'text-accentRed'}>
                    {t.direction > 0 ? 'LONG' : 'SHORT'}
                  </span>
                </td>
                <td className="py-1.5 pr-2 text-textSecondary">{shortDate(t.entry_time)}</td>
                <td className="py-1.5 pr-2 text-right text-textSecondary">{num(t.entry_price)}</td>
                <td className="py-1.5 pr-2 text-textSecondary">{shortDate(t.exit_time)}</td>
                <td className="py-1.5 pr-2 text-right text-textSecondary">{num(t.exit_price)}</td>
                <td className="py-1.5 pr-2 text-right text-textMuted">{t.bars_held}</td>
                <td className={clsx('py-1.5 pr-2 text-right font-semibold', toneFor(t.ret_pct))}>
                  {t.ret_pct === null ? '—' : `${t.ret_pct > 0 ? '+' : ''}${t.ret_pct.toFixed(2)}%`}
                </td>
                <td className={clsx('py-1.5 pr-2 text-right', toneFor(t.pnl))}>
                  {money(t.pnl, currency)}
                </td>
                <td className="py-1.5 pr-2 text-right text-accentRed/80">
                  {t.mae_pct === null ? '—' : `${t.mae_pct.toFixed(1)}%`}
                </td>
                <td className="py-1.5 pr-2 text-right text-accentGreen/80">
                  {t.mfe_pct === null ? '—' : `+${t.mfe_pct.toFixed(1)}%`}
                </td>
                <td className="py-1.5 font-mono text-[10px] text-textMuted">{t.exit_reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-2 flex items-center justify-between text-[10px] text-textMuted">
        <span>
          Showing {Math.min(shown, ordered.length)} of {trades.total}
          {trades.truncated && ' (log capped at 2,000)'}
        </span>
        {shown < ordered.length && (
          <button
            type="button"
            onClick={() => setShown((s) => s + PAGE * 4)}
            className="rounded border border-borderSubtle px-2 py-1 text-textSecondary transition-colors hover:text-textPrimary"
          >
            Show more
          </button>
        )}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- report */

export default function BacktestResults({ result, currency }: {
  result: BacktestResult; currency: string;
}) {
  const s = result.summary;
  const e = result.extended;
  const bench = e.benchmark;
  const beatBuyHold = (s.alpha_cagr ?? 0) > 0;

  return (
    <div className="space-y-4">
      {/* ---- Headline numbers ---- */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <Headline
          label="CAGR" value={signedPct(s.cagr)} tone={toneFor(s.cagr)}
          sub={`buy & hold ${signedPct(s.bh_cagr)}`}
        />
        <Headline
          label="Sharpe" value={num(s.sharpe)}
          tone={(s.sharpe ?? 0) >= 1 ? 'text-accentGreen' : undefined}
          sub={`sortino ${num(s.sortino)}`}
        />
        <Headline
          label="Max drawdown" value={pct(s.max_dd)} tone="text-accentRed"
          sub={`${s.dd_bars} bars underwater`}
        />
        <Headline
          label="Profit factor" value={ratio(s.profit_factor)}
          tone={(s.profit_factor ?? 0) >= 1.5 ? 'text-accentGreen' : undefined}
          sub={`win rate ${pct(s.win_rate, 1)}`}
        />
        <Headline
          label="Trades" value={String(s.n_trades)}
          sub={`${num(s.trades_per_year, 1)}/yr · ${pct(s.exposure, 0)} in market`}
        />
        <Headline
          label="Final equity" value={money(s.final, currency)}
          tone={toneFor((s.final ?? 0) - s.initial)}
          sub={`from ${money(s.initial, currency)}`}
        />
      </div>

      {/* ---- The one sentence that matters most ---- */}
      <div
        className="rounded-xl p-3 text-[12px] leading-relaxed"
        style={{
          border: `1px solid ${beatBuyHold ? '#34D39940' : '#FBBF2440'}`,
          background: beatBuyHold ? '#34D3990d' : '#FBBF240d',
        }}
      >
        <span className="text-textSecondary">
          Over {num(s.years, 1)} years and {result.bars.toLocaleString()} bars, this strategy
          returned <span className={clsx('font-semibold tabular', toneFor(s.cagr))}>{signedPct(s.cagr)}</span> a year
          against buy &amp; hold&apos;s <span className="font-semibold tabular text-textSecondary">{signedPct(s.bh_cagr)}</span>,
          {' '}while in the market only <span className="font-semibold tabular text-textSecondary">{pct(s.exposure, 0)}</span> of the time
          {' '}and drawing down <span className="font-semibold tabular text-accentRed">{pct(s.max_dd)}</span> at worst
          {' '}(buy &amp; hold: <span className="tabular">{pct(s.bh_max_dd)}</span>).
        </span>
      </div>

      {/* ---- Equity curve + drawdown ---- */}
      <div className="rounded-xl border border-borderSubtle bg-white/[0.02] p-3">
        <div className="mb-1 flex flex-wrap items-center justify-between gap-2 px-1">
          <MicroLabel>Equity curve vs buy &amp; hold · drawdown below</MicroLabel>
          <span className="text-[10px] text-textMuted">
            {shortDate(s.start)} → {shortDate(s.end)}
            {result.equity.downsampled && ' · curve thinned for display'}
          </span>
        </div>
        <EquityChart
          equity={result.equity}
          buyHold={result.buy_hold}
          drawdown={result.drawdown}
          interval={result.interval}
          height={320}
        />
      </div>

      {/* ---- Statistics ---- */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Card title="Return" icon={<TrendingUp size={12} />}>
          <Line label="Total return" value={signedPct(s.total_return)} tone={toneFor(s.total_return)} />
          <Line label="CAGR" value={signedPct(s.cagr)} tone={toneFor(s.cagr)} />
          <Line label="Alpha vs buy & hold" value={signedPct(s.alpha_cagr)} tone={toneFor(s.alpha_cagr)} />
          <Line label="Volatility (ann.)" value={pct(s.volatility)} />
          <Line label="Best trade" value={`${num(s.best_trade)}%`} tone="text-accentGreen" />
          <Line label="Worst trade" value={`${num(s.worst_trade)}%`} tone="text-accentRed" />
        </Card>

        <Card title="Risk" icon={<ArrowDownRight size={12} />}>
          <Line label="Sharpe" value={num(s.sharpe)} />
          <Line label="Sortino" value={num(s.sortino)} title="Downside deviation only" />
          <Line label="Calmar" value={num(s.calmar)} title="CAGR / max drawdown" />
          <Line
            label="Ulcer index" value={num(e.ulcer_index, 1)}
            title="Root-mean-square drawdown: how deep, and for how long"
          />
          <Line
            label="Martin ratio" value={num(e.ulcer_performance_index)}
            title="CAGR per unit of time-weighted drawdown"
          />
          <Line label="Omega" value={ratio(e.omega)} title="Gains above zero / losses below it" />
        </Card>

        <Card title="Trades" icon={<ListOrdered size={12} />}>
          <Line label="Win rate" value={pct(s.win_rate, 1)} />
          <Line label="Payoff ratio" value={ratio(s.payoff)} title="Average win / average loss" />
          <Line label="Expectancy" value={money(s.expectancy, currency)} tone={toneFor(s.expectancy)} />
          <Line label="Avg win / loss" value={`${money(s.avg_win, currency)} / ${money(s.avg_loss, currency)}`} />
          <Line label="Longest streak" value={`${s.win_streak}W · ${s.loss_streak}L`} />
          <Line label="Avg hold" value={`${num(s.avg_bars_held, 1)} bars`} />
          <Line label="Long / short" value={`${s.longs} / ${s.shorts}`} />
        </Card>

        <Card title="Excursions & benchmark" icon={<Ruler size={12} />}>
          <Line
            label="Avg MAE, winners" value={`${num(e.excursions.avg_mae_winners, 1)}%`}
            tone="text-accentRed/80"
            title="How far winners went against you first — the stop-width evidence"
          />
          <Line label="Avg MAE, losers" value={`${num(e.excursions.avg_mae_losers, 1)}%`} tone="text-accentRed/80" />
          <Line
            label="Avg give-back" value={`${num(e.excursions.avg_giveback_winners, 1)}%`}
            title="Open profit handed back between the best price and the exit"
          />
          {bench ? (
            <>
              <Line label={`Beta vs ${result.benchmark_symbol}`} value={num(bench.beta)} />
              <Line label="Alpha (ann.)" value={signedPct(bench.alpha_annual)} tone={toneFor(bench.alpha_annual)} />
              <Line label="Correlation" value={num(bench.correlation)} />
            </>
          ) : (
            <Line label="Benchmark" value="not available" tone="text-textMuted" />
          )}
        </Card>
      </div>

      {/* ---- Drawdowns ---- */}
      <Card title="Deepest drawdowns" icon={<ArrowDownRight size={12} />}>
        {e.drawdowns.length === 0 ? (
          <p className="text-[11px] text-textMuted">This curve never went underwater.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-[11px] tabular">
              <thead>
                <tr className="border-b border-borderSubtle text-left font-mono text-[10px] uppercase tracking-wider text-textMuted">
                  <th className="py-1.5 pr-2 font-normal">Depth</th>
                  <th className="py-1.5 pr-2 font-normal">Started</th>
                  <th className="py-1.5 pr-2 font-normal">Low</th>
                  <th className="py-1.5 pr-2 font-normal">Recovered</th>
                  <th className="py-1.5 pr-2 text-right font-normal">Underwater</th>
                  <th className="py-1.5 text-right font-normal">Low → recovery</th>
                </tr>
              </thead>
              <tbody>
                {e.drawdowns.map((d, i) => (
                  <tr key={i} className="border-b border-borderSubtle/50">
                    <td className="py-1.5 pr-2 font-semibold text-accentRed">{pct(d.depth, 1)}</td>
                    <td className="py-1.5 pr-2 text-textSecondary">{shortDate(d.start)}</td>
                    <td className="py-1.5 pr-2 text-textSecondary">{shortDate(d.trough)}</td>
                    <td className={clsx('py-1.5 pr-2', d.recovered ? 'text-textSecondary' : 'text-accentAmber')}>
                      {d.recovered ? shortDate(d.end) : 'still open'}
                    </td>
                    <td className="py-1.5 pr-2 text-right text-textMuted">{d.length_bars} bars</td>
                    <td className="py-1.5 text-right text-textMuted">
                      {d.recovery_bars === null ? '—' : `${d.recovery_bars} bars`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ---- Monthly returns ---- */}
      <Card title="Monthly returns" icon={<Layers size={12} />}>
        <MonthlyGrid rows={result.monthly} />
      </Card>

      {/* ---- Trade log ---- */}
      <Card title="Trade log" icon={<ArrowUpRight size={12} />}>
        <TradeTable trades={result.trades} currency={currency} />
      </Card>
    </div>
  );
}
