'use client';

import clsx from 'clsx';
import { Dices, SplitSquareHorizontal } from '@/components/ui/icons';
import type { MonteCarlo, OosResult, Verdict } from '../../types/backtest';
import { num, pct, signedPct, shortDate, toneFor, VERDICT_COLOR } from '../../lib/backtest';
import { MicroLabel } from '../agents/DeskAtoms';
import { tint } from '../../lib/theme';

/** The verdict line. Colour carries the same meaning as the text, not more. */
export function VerdictBanner({ verdict }: { verdict: Verdict }) {
  const color = VERDICT_COLOR[verdict.level] ?? 'var(--fg-2)';
  return (
    <div
      className="rounded-lg p-2.5 text-[12px] leading-relaxed"
      style={{ border: `1px solid ${tint(color, 25)}`, background: tint(color, 5), color: 'var(--fg)' }}
    >
      {verdict.text}
    </div>
  );
}

function Column({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg well p-3">
      <MicroLabel className="mb-1.5">{label}</MicroLabel>
      {children}
    </div>
  );
}

function Row({ label, value, tone }: { label: string; value: React.ReactNode; tone?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-0.5">
      <span className="text-caption text-fg-3">{label}</span>
      <span className={clsx('text-[12px] font-medium tabular', tone ?? 'text-fg')}>{value}</span>
    </div>
  );
}

/**
 * In-sample against out-of-sample.
 *
 * The cheapest honest test there is: fit nothing to the held-back tail, run the
 * same parameters on it, and see whether the edge was in the market or in the
 * parameter choice.
 */
export function OosPanel({ oos }: { oos: OosResult }) {
  if (!oos.available) {
    return (
      <div className="rounded-xl well p-4">
        <h4 className="mb-2 flex items-center gap-1.5 text-caption text-fg-3">
          <SplitSquareHorizontal size={12} /> In-sample vs out-of-sample
        </h4>
        <p className="text-caption text-fg-3">{oos.reason}</p>
      </div>
    );
  }

  const halves = [
    { key: 'in_sample' as const, label: 'In-sample', side: oos.in_sample },
    { key: 'out_of_sample' as const, label: 'Out-of-sample', side: oos.out_of_sample },
  ];

  return (
    <div className="rounded-xl well p-4">
      <h4 className="mb-3 flex flex-wrap items-center gap-2 border-b border-line pb-2 text-caption text-fg-3">
        <SplitSquareHorizontal size={12} /> In-sample vs out-of-sample
        <span className="normal-case tracking-normal text-fg-3/70">
          last {pct(oos.fraction, 0)} held back
        </span>
      </h4>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {halves.map(({ key, label, side }) => {
          const s = side?.summary;
          return (
            <Column key={key} label={label}>
              <div className="mb-1 text-caption text-fg-3">
                {shortDate(s?.start)} → {shortDate(s?.end)}
              </div>
              <Row label="CAGR" value={signedPct(s?.cagr)} tone={toneFor(s?.cagr)} />
              <Row label="Sharpe" value={num(s?.sharpe)} />
              <Row label="Max drawdown" value={pct(s?.max_dd)} tone="text-down" />
              <Row label="Trades" value={s?.n_trades ?? '–'} />
              <Row label="Win rate" value={pct(s?.win_rate, 1)} />
            </Column>
          );
        })}
      </div>

      {oos.verdict && <div className="mt-3"><VerdictBanner verdict={oos.verdict} /></div>}
    </div>
  );
}

/**
 * The Monte Carlo fan, as numbers rather than a chart.
 *
 * The percentile table is the part that changes behaviour: a median drawdown
 * of -20% with a 5th percentile of -45% tells you what to size for, which the
 * single realised path never does.
 */
export function MonteCarloPanel({ mc }: { mc: MonteCarlo }) {
  if (!mc.paths) {
    return (
      <div className="rounded-xl well p-4">
        <h4 className="mb-2 flex items-center gap-1.5 text-caption text-fg-3">
          <Dices size={12} /> Monte Carlo
        </h4>
        <p className="text-caption text-fg-3">{mc.note}</p>
      </div>
    );
  }

  const ruinHigh = (mc.prob_ruin ?? 0) > 0.05;

  return (
    <div className="rounded-xl well p-4">
      <h4 className="mb-3 flex flex-wrap items-center gap-2 border-b border-line pb-2 text-caption text-fg-3">
        <Dices size={12} /> Monte Carlo
        <span className="normal-case tracking-normal text-fg-3/70">
          {mc.paths.toLocaleString()} resamples of {mc.trades_resampled} trades
        </span>
      </h4>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Column label="Total return">
          <Row label="5th percentile" value={signedPct(mc.final_return?.p5)} tone={toneFor(mc.final_return?.p5)} />
          <Row label="Median" value={signedPct(mc.final_return?.median)} tone={toneFor(mc.final_return?.median)} />
          <Row label="95th percentile" value={signedPct(mc.final_return?.p95)} tone={toneFor(mc.final_return?.p95)} />
        </Column>
        <Column label="Max drawdown">
          <Row label="Median path" value={pct(mc.max_drawdown?.median)} tone="text-down" />
          <Row label="Bad path (5%)" value={pct(mc.max_drawdown?.p95)} tone="text-down" />
          <Row label="Worst seen" value={pct(mc.max_drawdown?.worst)} tone="text-down" />
        </Column>
        <Column label="Odds">
          <Row
            label="Profitable" value={pct(mc.prob_profit, 0)}
            tone={(mc.prob_profit ?? 0) > 0.6 ? 'text-up' : 'text-warn'}
          />
          <Row
            label={`Drawdown past ${pct(mc.ruin_threshold, 0)}`}
            value={pct(mc.prob_ruin, 1)}
            tone={ruinHigh ? 'text-down' : 'text-up'}
          />
          <Row label="CAGR, median" value={signedPct(mc.cagr?.median)} tone={toneFor(mc.cagr?.median)} />
        </Column>
      </div>

      <p className="mt-2.5 text-caption leading-relaxed text-fg-3">
        Trades are resampled with replacement, so this holds each trade&apos;s size and outcome
        and asks what a different run of luck would have looked like. It assumes trades are
        independent. Losses that cluster in one regime give a fatter real tail than this
        shows, so read the bad path as the optimistic version of bad.
      </p>
    </div>
  );
}
