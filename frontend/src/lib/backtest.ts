// Client for the backtester (backend/backtest/).

import { API_BASE } from './api';
import { readSseStream } from './sse';
import type {
  BacktestResult, OptimizeEvent, StrategyInfo, WalkForwardEvent,
} from '../types/backtest';

export interface BacktestRequest {
  symbol: string;
  strategy: string;
  interval: string;
  /** YYYY-MM-DD. Omit both for the full history the interval allows. */
  start?: string;
  end?: string;
  params?: Record<string, number | string>;
  capital?: number;
  commission_bps?: number;
  slippage_bps?: number;
  size_pct?: number;
  allow_short?: boolean;
  stop_loss_pct?: number | null;
  take_profit_pct?: number | null;
  trailing_stop_pct?: number | null;
  atr_stop_mult?: number | null;
  /** Hold back this fraction of the tail and report both halves. */
  oos_frac?: number | null;
  /** '' uses the index matching the symbol's market; 'none' turns it off. */
  benchmark?: string;
  monte_carlo?: boolean;
  mc_paths?: number;
}

export interface SweepRequest extends BacktestRequest {
  /** 'fast=10:50:10,slow=100:200:50' */
  grid: string;
  folds?: number;
  is_frac?: number;
}

/** Thrown for a 429 so the caller can show a countdown instead of "failed". */
export class BacktestRateLimited extends Error {
  retryAfter: number | null;
  constructor(retryAfter: number | null) {
    super(
      `Rate limited. A sweep is hundreds of simulations, so backtests have their own quota. Try again in ${
        retryAfter ?? 'a few'
      } seconds.`,
    );
    this.name = 'BacktestRateLimited';
    this.retryAfter = retryAfter;
  }
}

function retryAfterFrom(res: Response, body: unknown): number | null {
  const header = res.headers.get('Retry-After');
  if (header && Number.isFinite(Number(header))) return Number(header);
  const seconds = (body as { retry_after_seconds?: number })?.retry_after_seconds;
  return typeof seconds === 'number' ? Math.ceil(seconds) : null;
}

async function failure(res: Response, fallback: string): Promise<Error> {
  const body = await res.json().catch(() => null);
  if (res.status === 429) return new BacktestRateLimited(retryAfterFrom(res, body));
  return new Error((body as { error?: string })?.error || fallback);
}

export async function fetchStrategies(): Promise<StrategyInfo[]> {
  const res = await fetch(`${API_BASE}/api/backtest/strategies`);
  if (!res.ok) throw await failure(res, 'The strategy list is unavailable.');
  return (await res.json()).strategies as StrategyInfo[];
}

export async function runBacktest(
  req: BacktestRequest,
  signal?: AbortSignal,
): Promise<BacktestResult> {
  const res = await fetch(`${API_BASE}/api/backtest/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
    signal,
  });
  if (!res.ok) throw await failure(res, 'The backtest could not be run.');
  return res.json();
}

async function stream<T>(
  path: string,
  req: SweepRequest,
  onEvent: (event: T) => void,
  signal?: AbortSignal,
): Promise<void> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
    signal,
  });
  // A rejected grid comes back as JSON with a 400, before the stream opens.
  if (!res.ok) throw await failure(res, 'The sweep could not be started.');
  await readSseStream<T>(res, onEvent);
}

export const streamOptimize = (
  req: SweepRequest, onEvent: (e: OptimizeEvent) => void, signal?: AbortSignal,
) => stream<OptimizeEvent>('/api/backtest/optimize', req, onEvent, signal);

export const streamWalkForward = (
  req: SweepRequest, onEvent: (e: WalkForwardEvent) => void, signal?: AbortSignal,
) => stream<WalkForwardEvent>('/api/backtest/walk-forward', req, onEvent, signal);

/* ------------------------------------------------------------- formatting */

export const pct = (v: number | null | undefined, digits = 2) =>
  v === null || v === undefined || !Number.isFinite(v)
    ? '–'
    : `${v >= 0 ? '' : ''}${(v * 100).toFixed(digits)}%`;

export const signedPct = (v: number | null | undefined, digits = 2) =>
  v === null || v === undefined || !Number.isFinite(v)
    ? '–'
    : `${v > 0 ? '+' : ''}${(v * 100).toFixed(digits)}%`;

export const num = (v: number | null | undefined, digits = 2) =>
  v === null || v === undefined || !Number.isFinite(v) ? '–' : v.toFixed(digits);

/** An infinite profit factor is a real result (no losing trades), not an error. */
export const ratio = (v: number | null | undefined, digits = 2) =>
  v === null || v === undefined ? '∞' : !Number.isFinite(v) ? '∞' : v.toFixed(digits);

export const money = (v: number | null | undefined, currency = 'USD') =>
  v === null || v === undefined || !Number.isFinite(v)
    ? '–'
    : new Intl.NumberFormat('en-US', {
        style: 'currency', currency, maximumFractionDigits: 0,
      }).format(v);

export const shortDate = (iso: string | null | undefined) =>
  iso ? iso.slice(0, 10) : '–';

/** Green above zero, red below, muted at exactly nothing. */
export const toneFor = (v: number | null | undefined) =>
  v === null || v === undefined || !Number.isFinite(v)
    ? 'text-fg-3'
    : v > 0 ? 'text-up' : v < 0 ? 'text-down' : 'text-fg-2';

export const VERDICT_COLOR: Record<string, string> = {
  good: 'var(--green)',
  warn: 'var(--amber)',
  bad: 'var(--red)',
};

/** Timeframes the backtester accepts, with the history each one reaches. */
export const BACKTEST_INTERVALS = [
  { id: '1d', label: '1D', coverage: 'Full history, decades' },
  { id: '1wk', label: '1W', coverage: 'Full history, slower signals' },
  { id: '1mo', label: '1M', coverage: 'Full history, long horizon' },
  { id: '60m', label: '1H', coverage: 'Last ~2 years' },
  { id: '30m', label: '30m', coverage: 'Last ~1 month' },
  { id: '15m', label: '15m', coverage: 'Last ~1 month' },
  { id: '5m', label: '5m', coverage: 'Last ~1 month' },
  { id: '1m', label: '1m', coverage: 'Last ~7 days' },
] as const;
