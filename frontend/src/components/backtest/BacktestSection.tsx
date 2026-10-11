'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import {
  ChevronDown, FlaskConical, History, Play, RotateCw, Settings2, ShieldCheck, Square,
} from '@/components/ui/icons';
import type { BacktestResult, StrategyInfo } from '../../types/backtest';
import {
  BACKTEST_INTERVALS, BacktestRequest, fetchStrategies, runBacktest,
} from '../../lib/backtest';
import { MicroLabel } from '../agents/DeskAtoms';
import BacktestResults from './BacktestResults';
import BacktestLab from './BacktestLab';
import { MonteCarloPanel, OosPanel } from './RobustnessPanels';

type Tab = 'report' | 'robustness' | 'lab';

/**
 * Date presets, as an offset in years from today. `null` is everything the
 * interval can reach — which on daily is four decades, and is the reason this
 * tester exists rather than the one inside a charting site.
 */
const RANGES = [
  { id: 'max', label: 'Max', years: null },
  { id: '10y', label: '10Y', years: 10 },
  { id: '5y', label: '5Y', years: 5 },
  { id: '2y', label: '2Y', years: 2 },
  { id: '1y', label: '1Y', years: 1 },
  { id: 'custom', label: 'Custom', years: undefined },
] as const;

type RangeId = (typeof RANGES)[number]['id'];

const iso = (d: Date) => d.toISOString().slice(0, 10);

function yearsAgo(n: number): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - n);
  return iso(d);
}

function Field({ label, children, hint }: {
  label: string; children: React.ReactNode; hint?: string;
}) {
  return (
    <div>
      <MicroLabel className="mb-1">{label}</MicroLabel>
      {children}
      {hint && <p className="mt-0.5 text-[10px] text-textMuted">{hint}</p>}
    </div>
  );
}

const inputClass =
  'min-h-9 w-full rounded-lg border border-borderSubtle bg-black/30 px-2.5 text-[12px] tabular text-textPrimary transition-colors hover:border-borderStrong focus:border-accentCyan/50';

function NumberField({ label, value, onChange, step = 1, placeholder, hint }: {
  label: string; value: number | null; onChange: (v: number | null) => void;
  step?: number | 'any'; placeholder?: string; hint?: string;
}) {
  return (
    <Field label={label} hint={hint}>
      <input
        type="number"
        step={step}
        value={value ?? ''}
        placeholder={placeholder ?? 'off'}
        onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
        className={inputClass}
      />
    </Field>
  );
}

/**
 * The backtester, on the symbol the Terminal is already showing.
 *
 * The engine underneath is the desktop tester's, unchanged: signals form at a
 * bar's close and fill at the next open, costs are charged on both sides, and
 * when a bar contains both a stop and a target the stop is assumed to have hit
 * first. Those three conventions are what separate this from the numbers a
 * charting site's strategy tester will show you for the same idea.
 */
export default function BacktestSection({ symbol, currency }: {
  symbol: string; currency: string;
}) {
  const [strategies, setStrategies] = useState<StrategyInfo[]>([]);
  const [strategyName, setStrategyName] = useState('ema_cross');
  const [interval, setInterval] = useState('1d');
  const [rangeId, setRangeId] = useState<RangeId>('max');
  const [start, setStart] = useState(yearsAgo(5));
  const [end, setEnd] = useState(iso(new Date()));

  const [params, setParams] = useState<Record<string, number | string>>({});
  const [showParams, setShowParams] = useState(false);
  const [showCosts, setShowCosts] = useState(false);

  const [capital, setCapital] = useState(100_000);
  const [commission, setCommission] = useState<number | null>(null);
  const [slippage, setSlippage] = useState<number | null>(null);
  const [sizePct, setSizePct] = useState(100);
  const [allowShort, setAllowShort] = useState(false);
  const [stopPct, setStopPct] = useState<number | null>(null);
  const [targetPct, setTargetPct] = useState<number | null>(null);
  const [trailPct, setTrailPct] = useState<number | null>(null);
  const [atrStop, setAtrStop] = useState<number | null>(null);

  const [oosFrac, setOosFrac] = useState<number | null>(0.3);
  const [monteCarlo, setMonteCarlo] = useState(true);

  const [result, setResult] = useState<BacktestResult | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<Tab>('report');
  const abortRef = useRef<AbortController | null>(null);

  const strategy = useMemo(
    () => strategies.find((s) => s.name === strategyName),
    [strategies, strategyName],
  );

  useEffect(() => {
    let live = true;
    fetchStrategies()
      .then((list) => { if (live) setStrategies(list); })
      .catch((e) => { if (live) setError(e.message); });
    return () => { live = false; };
  }, []);

  // A result is tied to the symbol it was run on; switching tickers has to
  // drop it, or the report would describe a different stock than the chart.
  const [runSymbol, setRunSymbol] = useState(symbol);
  if (runSymbol !== symbol) {
    setRunSymbol(symbol);
    setResult(null);
    setError('');
    setRunning(false);
  }
  // ...and abort the old symbol's run (also on unmount).
  useEffect(() => () => { abortRef.current?.abort(); abortRef.current = null; }, [symbol]);

  const buildRequest = useCallback((): BacktestRequest => {
    const preset = RANGES.find((r) => r.id === rangeId);
    const dates =
      rangeId === 'custom' ? { start, end }
      : preset?.years ? { start: yearsAgo(preset.years) }
      : {};
    return {
      symbol,
      strategy: strategyName,
      interval,
      ...dates,
      params,
      capital,
      ...(commission !== null ? { commission_bps: commission } : {}),
      ...(slippage !== null ? { slippage_bps: slippage } : {}),
      size_pct: sizePct,
      allow_short: allowShort,
      stop_loss_pct: stopPct,
      take_profit_pct: targetPct,
      trailing_stop_pct: trailPct,
      atr_stop_mult: atrStop,
    };
  }, [symbol, strategyName, interval, rangeId, start, end, params, capital,
      commission, slippage, sizePct, allowShort, stopPct, targetPct, trailPct, atrStop]);

  const run = async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setRunning(true); setError(''); setTab('report');
    try {
      const out = await runBacktest(
        { ...buildRequest(), oos_frac: oosFrac, monte_carlo: monteCarlo },
        controller.signal,
      );
      setResult(out);
    } catch (e) {
      if ((e as Error)?.name !== 'AbortError') {
        setError(e instanceof Error ? e.message : 'The backtest could not be run.');
      }
    } finally {
      if (!controller.signal.aborted) setRunning(false);
    }
  };

  const stop = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setRunning(false);
  };

  const intervalMeta = BACKTEST_INTERVALS.find((t) => t.id === interval);
  const ownCosts = strategy?.costs?.commission_bps != null;

  const TABS: { id: Tab; label: string; icon: React.ReactNode; enabled: boolean }[] = [
    { id: 'report', label: 'Report', icon: <History size={12} />, enabled: !!result },
    { id: 'robustness', label: 'Robustness', icon: <ShieldCheck size={12} />, enabled: !!result },
    { id: 'lab', label: 'Optimizer & walk-forward', icon: <FlaskConical size={12} />, enabled: !!strategy },
  ];

  return (
    <div className="space-y-5">
      {/* ---- Header and controls ---- */}
      <div className="glass-panel p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="flex flex-wrap items-center gap-2 text-sm font-semibold text-textPrimary">
              <History size={15} className="text-accentCyan" /> Backtest
              <span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] font-mono uppercase tracking-wide text-textMuted">
                full history · costs · walk-forward
              </span>
            </h3>
            <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-textSecondary">
              Runs on every bar Yahoo has for {symbol} — decades on daily. Signals form at a
              bar&apos;s close and fill at the next open, commission and slippage are charged on
              both sides, and when one bar holds both a stop and a target the stop is assumed to
              have hit first.
            </p>
          </div>

          {running ? (
            <button
              type="button"
              onClick={stop}
              className="flex min-h-11 items-center gap-2 rounded-lg border border-borderStrong px-4 text-xs font-semibold text-textSecondary transition-colors hover:text-textPrimary"
            >
              <Square size={13} /> Stop
            </button>
          ) : (
            <button
              type="button"
              onClick={run}
              disabled={!strategies.length}
              className="flex min-h-11 items-center gap-2 rounded-lg border border-accentCyan/30 bg-accentCyan/5 px-4 text-xs font-semibold text-accentCyan transition-colors hover:bg-accentCyan/10 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {result ? <RotateCw size={13} /> : <Play size={13} />}
              {result ? 'Run again' : `Backtest ${symbol}`}
            </button>
          )}
        </div>

        {/* ---- Primary controls ---- */}
        <div className="mt-4 grid grid-cols-1 gap-3 border-t border-borderSubtle pt-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Strategy" hint={strategy?.doc}>
            <select
              value={strategyName}
              onChange={(e) => {
                setStrategyName(e.target.value);
                // Parameters belong to a strategy: never carry a stale
                // `fast=10` onto something with no `fast` at all.
                setParams({});
              }}
              className={inputClass}
            >
              {strategies.map((s) => (
                <option key={s.name} value={s.name}>{s.name}</option>
              ))}
            </select>
          </Field>

          <Field label="Interval" hint={intervalMeta?.coverage}>
            <select
              value={interval}
              onChange={(e) => setInterval(e.target.value)}
              className={inputClass}
            >
              {BACKTEST_INTERVALS.map((t) => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
          </Field>

          <Field
            label="Date range"
            hint={result?.range_clamped
              ? `Clamped to ${result.range} — the interval cannot reach further back`
              : undefined}
          >
            <div className="flex overflow-hidden rounded-lg border border-borderSubtle">
              {RANGES.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRangeId(r.id)}
                  className={clsx(
                    'min-h-9 flex-1 px-1.5 font-mono text-[10px] font-semibold transition-colors',
                    rangeId === r.id ? 'bg-accentCyan/15 text-accentCyan'
                      : 'text-textMuted hover:text-textSecondary',
                  )}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Out-of-sample hold-out" hint="Fit nothing to the tail, then look once">
            <div className="flex overflow-hidden rounded-lg border border-borderSubtle">
              {[null, 0.2, 0.3, 0.4].map((f) => (
                <button
                  key={String(f)}
                  type="button"
                  onClick={() => setOosFrac(f)}
                  className={clsx(
                    'min-h-9 flex-1 font-mono text-[10px] font-semibold transition-colors',
                    oosFrac === f ? 'bg-accentCyan/15 text-accentCyan'
                      : 'text-textMuted hover:text-textSecondary',
                  )}
                >
                  {f === null ? 'off' : `${f * 100}%`}
                </button>
              ))}
            </div>
          </Field>
        </div>

        {rangeId === 'custom' && (
          <div className="mt-3 grid grid-cols-2 gap-3 sm:max-w-md">
            <Field label="From">
              <input type="date" value={start} max={end}
                     onChange={(e) => setStart(e.target.value)} className={inputClass} />
            </Field>
            <Field label="To">
              <input type="date" value={end} min={start} max={iso(new Date())}
                     onChange={(e) => setEnd(e.target.value)} className={inputClass} />
            </Field>
          </div>
        )}

        {/* ---- Execution model ---- */}
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setShowCosts((v) => !v)}
            className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-textMuted transition-colors hover:text-textSecondary"
          >
            <Settings2 size={12} />
            Costs, sizing and stops
            <ChevronDown size={12} className={clsx('transition-transform', showCosts && 'rotate-180')} />
          </button>
          {showCosts && (
            <div className="mt-2 grid grid-cols-2 gap-3 rounded-xl border border-borderSubtle bg-white/[0.02] p-3 sm:grid-cols-4">
              <NumberField label="Capital" value={capital} step={1000}
                           onChange={(v) => setCapital(v ?? 100_000)} placeholder="100000" />
              <NumberField
                label="Commission (bps/side)" value={commission} step="any"
                onChange={setCommission}
                placeholder={ownCosts ? String(strategy?.costs.commission_bps) : '3'}
                hint={ownCosts ? "the strategy's own" : undefined}
              />
              <NumberField
                label="Slippage (bps/side)" value={slippage} step="any" onChange={setSlippage}
                placeholder={ownCosts ? String(strategy?.costs.slippage_bps) : '2'}
              />
              <NumberField label="Size (% of equity)" value={sizePct} step="any"
                           onChange={(v) => setSizePct(v ?? 100)} placeholder="100" />
              <NumberField label="Stop loss %" value={stopPct} step="any" onChange={setStopPct} />
              <NumberField label="Take profit %" value={targetPct} step="any" onChange={setTargetPct} />
              <NumberField label="Trailing stop %" value={trailPct} step="any" onChange={setTrailPct} />
              <NumberField label="ATR stop (×)" value={atrStop} step="any" onChange={setAtrStop}
                           hint="overrides stop loss %" />
              <label className="col-span-2 flex items-center gap-2 pt-1 sm:col-span-4">
                <input type="checkbox" checked={allowShort} className="h-3.5 w-3.5 accent-accentCyan"
                       onChange={(e) => setAllowShort(e.target.checked)} />
                <span className="text-[11px] text-textSecondary">Allow short entries</span>
                <span className="ml-4 flex items-center gap-2">
                  <input type="checkbox" checked={monteCarlo} className="h-3.5 w-3.5 accent-accentCyan"
                         onChange={(e) => setMonteCarlo(e.target.checked)} />
                  <span className="text-[11px] text-textSecondary">Monte Carlo resample</span>
                </span>
              </label>
            </div>
          )}
        </div>

        {/* ---- Strategy parameters ---- */}
        {strategy && strategy.params.length > 0 && (
          <div className="mt-3">
            <button
              type="button"
              onClick={() => setShowParams((v) => !v)}
              className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-textMuted transition-colors hover:text-textSecondary"
            >
              <Settings2 size={12} />
              {strategy.name} parameters ({strategy.params.length})
              <ChevronDown size={12} className={clsx('transition-transform', showParams && 'rotate-180')} />
            </button>
            {showParams && (
              <div className="mt-2 grid grid-cols-2 gap-2 rounded-xl border border-borderSubtle bg-white/[0.02] p-3 sm:grid-cols-4 xl:grid-cols-6">
                {strategy.params.map((p) => (
                  <div key={p.name}>
                    <MicroLabel className="mb-0.5 truncate" >{p.name}</MicroLabel>
                    <input
                      type={p.type === 'string' ? 'text' : 'number'}
                      step={p.type === 'int' ? 1 : 'any'}
                      value={params[p.name] ?? ''}
                      placeholder={String(p.default)}
                      onChange={(e) => setParams((prev) => {
                        const next = { ...prev };
                        if (e.target.value === '') delete next[p.name];
                        else next[p.name] = p.type === 'string' ? e.target.value : Number(e.target.value);
                        return next;
                      })}
                      className="min-h-8 w-full rounded border border-borderSubtle bg-black/30 px-1.5 text-[11px] tabular text-textPrimary focus:border-accentCyan/50"
                    />
                  </div>
                ))}
                <p className="col-span-2 text-[10px] text-textMuted sm:col-span-4 xl:col-span-6">
                  Blank uses the default shown. Booleans take 1 or 0.
                </p>
              </div>
            )}
          </div>
        )}

        {error && (
          <p className="mt-3 rounded-lg border border-accentRed/25 bg-accentRed/[0.06] p-2.5 text-[12px] text-accentRed">
            {error}
          </p>
        )}

        {running && (
          <p className="mt-3 flex items-center gap-2 text-[12px] text-textSecondary">
            <RotateCw size={13} className="animate-spin" />
            Pulling history and simulating every bar…
          </p>
        )}

        {result && !running && (
          <p className="mt-3 border-t border-borderSubtle pt-3 text-[11px] text-textMuted">
            {result.bars.toLocaleString()} bars · {result.summary.n_trades} trades ·{' '}
            {result.config.commission_bps as number} + {result.config.slippage_bps as number} bps
            per side · simulated in {result.elapsed_ms.toLocaleString()} ms
          </p>
        )}
      </div>

      {/* ---- Tabs ---- */}
      {(result || strategy) && (
        <>
          <div className="flex flex-wrap gap-1.5">
            {TABS.filter((t) => t.enabled).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={clsx(
                  'flex min-h-9 items-center gap-1.5 rounded-lg border px-3 text-[11px] font-semibold transition-colors',
                  tab === t.id
                    ? 'border-accentCyan/30 bg-accentCyan/10 text-accentCyan'
                    : 'border-borderSubtle text-textMuted hover:text-textSecondary',
                )}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          {tab === 'report' && result && (
            <BacktestResults result={result} currency={currency} />
          )}

          {tab === 'robustness' && result && (
            <div className="space-y-4">
              {result.oos
                ? <OosPanel oos={result.oos} />
                : <p className="text-[12px] text-textMuted">
                    Turn the out-of-sample hold-out on and run again to see the split.
                  </p>}
              {result.monte_carlo && <MonteCarloPanel mc={result.monte_carlo} />}
            </div>
          )}

          {tab === 'lab' && strategy && (
            <BacktestLab key={strategy.name} base={buildRequest()} strategy={strategy} />
          )}
        </>
      )}
    </div>
  );
}
