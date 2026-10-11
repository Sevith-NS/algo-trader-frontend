'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import { FlaskConical, Footprints, Play, Square } from '@/components/ui/icons';
import type {
  Fold, OptimizeEvent, StrategyInfo, SweepRow, WalkForwardEvent, Curve, Verdict,
} from '../../types/backtest';
import {
  BacktestRequest, streamOptimize, streamWalkForward,
  num, pct, ratio, shortDate, signedPct, toneFor,
} from '../../lib/backtest';
import { MicroLabel } from '../agents/DeskAtoms';
import { VerdictBanner } from './RobustnessPanels';
import EquityChart from './EquityChart';

interface Sweep { on: boolean; min: number; max: number; step: number }

/** A sensible default range around a parameter's own default. */
function defaultSweep(value: number, isInt: boolean): Sweep {
  const span = Math.abs(value) || 1;
  const min = Math.max(isInt ? 1 : 0.1, value - span * 0.5);
  const max = value + span * 0.5;
  const step = (max - min) / 4 || 1;
  const round = (v: number) => (isInt ? Math.max(1, Math.round(v)) : Number(v.toFixed(2)));
  return { on: false, min: round(min), max: round(max), step: round(step) };
}

function countCombos(sweeps: Record<string, Sweep>): number {
  return Object.values(sweeps)
    .filter((s) => s.on)
    .reduce((total, s) => {
      const n = s.step > 0 ? Math.floor((s.max - s.min) / s.step + 1e-9) + 1 : 0;
      return total * Math.max(0, n);
    }, 1);
}

function gridString(sweeps: Record<string, Sweep>): string {
  return Object.entries(sweeps)
    .filter(([, s]) => s.on)
    .map(([name, s]) => `${name}=${s.min}:${s.max}:${s.step}`)
    .join(',');
}

function ProgressBar({ done, total, label }: { done: number; total: number; label: string }) {
  const percent = total > 0 ? Math.min(100, (done / total) * 100) : 0;
  return (
    <div>
      <div className="mb-1 flex justify-between text-[10px] text-textMuted">
        <span>{label}</span>
        <span className="tabular">{done.toLocaleString()} / {total.toLocaleString()}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
        <div
          className="h-full rounded-full bg-accentCyan transition-[width] duration-200"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

/**
 * Parameter sweeps and walk-forward analysis.
 *
 * Both are hundreds of backtests, so both stream: a progress bar that moves is
 * the difference between "working" and "hung". Both also come back with a
 * verdict, because the number a sweep produces is the most over-trusted figure
 * in this whole tool — the best cell in a grid is the one most likely to be
 * noise, and saying so next to it is the point.
 */
export default function BacktestLab({ base, strategy }: {
  base: BacktestRequest; strategy: StrategyInfo;
}) {
  const numericParams = useMemo(
    () => strategy.params.filter((p) => p.type !== 'string'),
    [strategy],
  );

  // Defaults follow the strategy: a grid built for ema_cross means nothing on
  // swingpro_in. The parent keys this component by strategy, so a switch
  // starts a fresh lab instead of sweeping the wrong knobs.
  const [sweeps, setSweeps] = useState<Record<string, Sweep>>(() => {
    const next: Record<string, Sweep> = {};
    numericParams.forEach((p, i) => {
      const sweep = defaultSweep(Number(p.default), p.type === 'int');
      // Pre-arm the first two so the panel is usable without configuring it.
      next[p.name] = { ...sweep, on: i < 2 && numericParams.length <= 12 };
    });
    return next;
  });
  const [error, setError] = useState('');

  // Optimizer
  const [optRunning, setOptRunning] = useState(false);
  const [optProgress, setOptProgress] = useState({ done: 0, total: 0 });
  const [optRows, setOptRows] = useState<SweepRow[]>([]);
  const [optKeys, setOptKeys] = useState<string[]>([]);
  const [optVerdict, setOptVerdict] = useState<Verdict | null>(null);

  // Walk-forward
  const [wfRunning, setWfRunning] = useState(false);
  const [wfProgress, setWfProgress] = useState({ done: 0, total: 0, fold: 0, folds: 0 });
  const [folds, setFolds] = useState<Fold[]>([]);
  const [wfDone, setWfDone] = useState<Extract<WalkForwardEvent, { type: 'done' }> | null>(null);
  const [foldCount, setFoldCount] = useState(5);

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  const combos = countCombos(sweeps);
  const grid = gridString(sweeps);
  const armed = Object.values(sweeps).some((s) => s.on);
  const busy = optRunning || wfRunning;

  const setSweep = (name: string, patch: Partial<Sweep>) =>
    setSweeps((prev) => ({ ...prev, [name]: { ...prev[name], ...patch } }));

  const stop = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setOptRunning(false);
    setWfRunning(false);
  };

  const runOptimize = async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setOptRunning(true); setError(''); setOptRows([]); setOptVerdict(null);
    setOptProgress({ done: 0, total: combos });
    try {
      await streamOptimize({ ...base, grid }, (ev: OptimizeEvent) => {
        if (ev.type === 'start') setOptProgress({ done: 0, total: ev.combinations });
        else if (ev.type === 'progress') setOptProgress({ done: ev.done, total: ev.total });
        else if (ev.type === 'done') {
          setOptRows(ev.rows); setOptKeys(ev.keys); setOptVerdict(ev.verdict);
        } else if (ev.type === 'error') setError(ev.message);
      }, controller.signal);
    } catch (e) {
      if ((e as Error)?.name !== 'AbortError') {
        setError(e instanceof Error ? e.message : 'The sweep failed.');
      }
    } finally {
      if (!controller.signal.aborted) setOptRunning(false);
    }
  };

  const runWalkForward = async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setWfRunning(true); setError(''); setFolds([]); setWfDone(null);
    setWfProgress({ done: 0, total: 0, fold: 0, folds: foldCount });
    try {
      await streamWalkForward({ ...base, grid, folds: foldCount, is_frac: 0.7 },
        (ev: WalkForwardEvent) => {
          if (ev.type === 'start') {
            setWfProgress({ done: 0, total: ev.combinations, fold: 1, folds: ev.folds });
          } else if (ev.type === 'progress') {
            setWfProgress({ done: ev.done, total: ev.total, fold: ev.fold, folds: ev.folds });
          } else if (ev.type === 'fold' && !ev.skipped && ev.fold) {
            setFolds((prev) => [...prev, ev as Fold]);
          } else if (ev.type === 'done') {
            setWfDone(ev);
          } else if (ev.type === 'error') setError(ev.message);
        }, controller.signal);
    } catch (e) {
      if ((e as Error)?.name !== 'AbortError') {
        setError(e instanceof Error ? e.message : 'Walk-forward failed.');
      }
    } finally {
      if (!controller.signal.aborted) setWfRunning(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* ---- Grid builder ---- */}
      <div className="rounded-xl border border-borderSubtle bg-white/[0.02] p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-borderSubtle pb-2">
          <h4 className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-textMuted">
            <FlaskConical size={12} /> Parameter grid
          </h4>
          <span className={clsx('text-[10px] tabular', combos > 2000 ? 'text-accentRed' : 'text-textMuted')}>
            {armed ? `${combos.toLocaleString()} combinations` : 'nothing selected'}
            {combos > 2000 && ' — over the 2,000 cap'}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
          {numericParams.map((p) => {
            const s = sweeps[p.name];
            if (!s) return null;
            return (
              <div
                key={p.name}
                className={clsx(
                  'rounded-lg border p-2 transition-colors',
                  s.on ? 'border-accentCyan/30 bg-accentCyan/[0.04]' : 'border-borderSubtle',
                )}
              >
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={s.on}
                    disabled={busy}
                    onChange={(e) => setSweep(p.name, { on: e.target.checked })}
                    className="h-3.5 w-3.5 accent-accentCyan"
                  />
                  <span className="font-mono text-[11px] text-textSecondary">{p.name}</span>
                  <span className="ml-auto text-[10px] text-textMuted">default {String(p.default)}</span>
                </label>
                {s.on && (
                  <div className="mt-2 grid grid-cols-3 gap-1.5">
                    {(['min', 'max', 'step'] as const).map((field) => (
                      <div key={field}>
                        <MicroLabel className="mb-0.5">{field}</MicroLabel>
                        <input
                          type="number"
                          value={s[field]}
                          disabled={busy}
                          step={p.type === 'int' ? 1 : 'any'}
                          onChange={(e) => setSweep(p.name, { [field]: Number(e.target.value) })}
                          className="min-h-8 w-full rounded border border-borderSubtle bg-black/30 px-1.5 text-[11px] tabular text-textPrimary focus:border-accentCyan/50"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-borderSubtle pt-3">
          {busy ? (
            <button
              type="button"
              onClick={stop}
              className="flex min-h-10 items-center gap-2 rounded-lg border border-borderStrong px-3 text-xs font-semibold text-textSecondary transition-colors hover:text-textPrimary"
            >
              <Square size={13} /> Stop
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={runOptimize}
                disabled={!armed || combos > 2000}
                className="flex min-h-10 items-center gap-2 rounded-lg border border-accentCyan/30 bg-accentCyan/5 px-3 text-xs font-semibold text-accentCyan transition-colors hover:bg-accentCyan/10 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Play size={13} /> Sweep parameters
              </button>
              <button
                type="button"
                onClick={runWalkForward}
                disabled={!armed || combos > 2000}
                className="flex min-h-10 items-center gap-2 rounded-lg border border-accentPurple/30 bg-accentPurple/5 px-3 text-xs font-semibold text-accentPurple transition-colors hover:bg-accentPurple/10 disabled:cursor-not-allowed disabled:opacity-40"
                title="Re-optimise on a rolling window and trade the window after it"
              >
                <Footprints size={13} /> Walk forward
              </button>
              <div className="flex items-center gap-1.5">
                <MicroLabel>folds</MicroLabel>
                <div className="flex overflow-hidden rounded-lg border border-borderSubtle">
                  {[3, 4, 5, 6, 8].map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setFoldCount(f)}
                      className={clsx(
                        'min-h-8 px-2 font-mono text-[11px] tabular transition-colors',
                        foldCount === f ? 'bg-accentPurple/15 text-accentPurple'
                          : 'text-textMuted hover:text-textSecondary',
                      )}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {optRunning && (
          <div className="mt-3">
            <ProgressBar done={optProgress.done} total={optProgress.total} label="Sweeping" />
          </div>
        )}
        {wfRunning && (
          <div className="mt-3">
            <ProgressBar
              done={wfProgress.done}
              total={wfProgress.total}
              label={`Fold ${wfProgress.fold} of ${wfProgress.folds} — fitting`}
            />
          </div>
        )}
        {error && (
          <p className="mt-3 rounded-lg border border-accentRed/25 bg-accentRed/[0.06] p-2 text-[11px] text-accentRed">
            {error}
          </p>
        )}
      </div>

      {/* ---- Sweep results ---- */}
      {optRows.length > 0 && (
        <div className="rounded-xl border border-borderSubtle bg-white/[0.02] p-4">
          <h4 className="mb-2 flex flex-wrap items-center gap-2 border-b border-borderSubtle pb-2 text-[11px] font-mono uppercase tracking-wider text-textMuted">
            <FlaskConical size={12} /> Top parameters by Sharpe
            <span className="normal-case tracking-normal text-textMuted/70">
              {optRows.length} usable of {optProgress.total}
            </span>
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-[11px] tabular">
              <thead>
                <tr className="border-b border-borderSubtle text-left font-mono text-[10px] uppercase tracking-wider text-textMuted">
                  {optKeys.map((k) => <th key={k} className="py-1.5 pr-2 text-right font-normal">{k}</th>)}
                  <th className="py-1.5 pr-2 text-right font-normal">Sharpe</th>
                  <th className="py-1.5 pr-2 text-right font-normal">CAGR</th>
                  <th className="py-1.5 pr-2 text-right font-normal">Max DD</th>
                  <th className="py-1.5 pr-2 text-right font-normal">PF</th>
                  <th className="py-1.5 pr-2 text-right font-normal">Trades</th>
                  <th className="py-1.5 text-right font-normal">Exposure</th>
                </tr>
              </thead>
              <tbody>
                {optRows.slice(0, 15).map((r, i) => (
                  <tr
                    key={i}
                    className={clsx('border-b border-borderSubtle/50',
                                    i === 0 && 'bg-accentCyan/[0.05]')}
                  >
                    {optKeys.map((k) => (
                      <td key={k} className="py-1.5 pr-2 text-right font-mono text-accentCyan">
                        {r.params[k]}
                      </td>
                    ))}
                    <td className="py-1.5 pr-2 text-right font-semibold text-textPrimary">{num(r.sharpe)}</td>
                    <td className={clsx('py-1.5 pr-2 text-right', toneFor(r.cagr))}>{signedPct(r.cagr, 1)}</td>
                    <td className="py-1.5 pr-2 text-right text-accentRed">{pct(r.max_dd, 1)}</td>
                    <td className="py-1.5 pr-2 text-right text-textSecondary">{ratio(r.profit_factor)}</td>
                    <td className="py-1.5 pr-2 text-right text-textMuted">{r.trades}</td>
                    <td className="py-1.5 text-right text-textMuted">{pct(r.exposure, 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {optVerdict && <div className="mt-3"><VerdictBanner verdict={optVerdict} /></div>}
        </div>
      )}

      {/* ---- Walk-forward ---- */}
      {(folds.length > 0 || wfDone) && (
        <div className="rounded-xl border border-borderSubtle bg-white/[0.02] p-4">
          <h4 className="mb-2 flex flex-wrap items-center gap-2 border-b border-borderSubtle pb-2 text-[11px] font-mono uppercase tracking-wider text-textMuted">
            <Footprints size={12} /> Walk-forward
            {wfDone && (
              <span className="normal-case tracking-normal text-textMuted/70">
                efficiency {pct(wfDone.efficiency, 0)} · stitched CAGR{' '}
                <span className={toneFor(wfDone.stitched_summary?.cagr)}>
                  {signedPct(wfDone.stitched_summary?.cagr)}
                </span>
              </span>
            )}
          </h4>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-[11px] tabular">
              <thead>
                <tr className="border-b border-borderSubtle text-left font-mono text-[10px] uppercase tracking-wider text-textMuted">
                  <th className="py-1.5 pr-2 font-normal">Fold</th>
                  <th className="py-1.5 pr-2 font-normal">Chosen on training</th>
                  <th className="py-1.5 pr-2 text-right font-normal">IS Sharpe</th>
                  <th className="py-1.5 pr-2 font-normal">Traded</th>
                  <th className="py-1.5 pr-2 text-right font-normal">OOS CAGR</th>
                  <th className="py-1.5 pr-2 text-right font-normal">OOS Sharpe</th>
                  <th className="py-1.5 text-right font-normal">OOS Max DD</th>
                </tr>
              </thead>
              <tbody>
                {folds.map((f) => (
                  <tr key={f.fold} className="border-b border-borderSubtle/50">
                    <td className="py-1.5 pr-2 text-textMuted">{f.fold}</td>
                    <td className="py-1.5 pr-2 font-mono text-[10px] text-accentCyan">
                      {Object.entries(f.params).map(([k, v]) => `${k}=${v}`).join(' ')}
                    </td>
                    <td className="py-1.5 pr-2 text-right text-textSecondary">{num(f.in_sample.sharpe)}</td>
                    <td className="py-1.5 pr-2 text-[10px] text-textMuted">
                      {shortDate(f.out_of_sample.start)} → {shortDate(f.out_of_sample.end)}
                    </td>
                    <td className={clsx('py-1.5 pr-2 text-right font-semibold', toneFor(f.out_of_sample.cagr))}>
                      {signedPct(f.out_of_sample.cagr, 1)}
                    </td>
                    <td className="py-1.5 pr-2 text-right text-textSecondary">{num(f.out_of_sample.sharpe)}</td>
                    <td className="py-1.5 text-right text-accentRed">{pct(f.out_of_sample.max_dd, 1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {wfDone && (
            <>
              <div className="mt-3 rounded-lg border border-borderSubtle bg-black/20 p-2">
                <MicroLabel className="mb-1 px-1">
                  Stitched out-of-sample equity — every bar here was traded on parameters fitted
                  before it
                </MicroLabel>
                <EquityChart
                  equity={wfDone.stitched_equity as Curve}
                  interval={base.interval}
                  height={200}
                  showBuyHold={false}
                />
              </div>
              <div className="mt-3"><VerdictBanner verdict={wfDone.verdict} /></div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
