// Shapes returned by the backtester (backend/backtest/service.py).
//
// Every number here can be null: the backend replaces NaN and Infinity with
// null rather than emitting invalid JSON, and an infinite profit factor (a run
// with no losing trades) is the common case for that.

export type Num = number | null;

export interface StrategyParam {
  name: string;
  default: number | string;
  type: 'int' | 'float' | 'string';
}

export interface StrategyInfo {
  name: string;
  doc: string;
  /** 'target' = {-1,0,+1} series; 'risk'/'swingpro' own their own execution. */
  engine: 'target' | 'risk' | 'swingpro';
  params: StrategyParam[];
  costs: { commission_bps?: number; slippage_bps?: number };
}

export interface CurvePoint { t: string; v: Num }
export interface Curve { points: CurvePoint[]; downsampled: boolean }

export interface Summary {
  ticker: string; strategy: string; interval: string;
  start: string; end: string; bars: number; years: number;
  initial: number; final: number;
  total_return: Num; cagr: Num;
  volatility: Num; sharpe: Num; sortino: Num; calmar: Num;
  max_dd: Num; dd_bars: number; dd_start: string | null; dd_end: string | null;
  exposure: Num;
  n_trades: number; trades_per_year: Num; longs: number; shorts: number;
  win_rate: Num; avg_win: Num; avg_loss: Num;
  profit_factor: Num; payoff: Num; expectancy: Num;
  best_trade: Num; worst_trade: Num; avg_bars_held: Num;
  win_streak: number; loss_streak: number;
  avg_mae: Num; exit_mix: Record<string, number>;
  bh_total: Num; bh_cagr: Num; bh_max_dd: Num; bh_sharpe: Num;
  alpha_cagr: Num;
}

export interface DrawdownEpisode {
  start: string; trough: string; end: string | null;
  depth: Num; length_bars: number; recovery_bars: number | null; recovered: boolean;
}

export interface Excursions {
  avg_mae_all?: Num; avg_mfe_all?: Num; worst_mae?: Num; best_mfe?: Num;
  avg_mae_winners?: Num; avg_mfe_winners?: Num; avg_giveback_winners?: Num;
  avg_mae_losers?: Num; avg_mfe_losers?: Num;
}

export interface BenchmarkStats {
  beta?: Num; alpha_annual?: Num; correlation?: Num;
  bench_total_return?: Num; bench_max_dd?: Num;
}

export interface Extended {
  ulcer_index: Num;
  ulcer_performance_index: Num;
  omega: Num;
  drawdowns: DrawdownEpisode[];
  excursions: Excursions;
  annual_returns: Record<string, Num>;
  benchmark?: BenchmarkStats;
}

export interface TradeRow {
  direction: number;
  entry_time: string; entry_price: Num;
  exit_time: string; exit_price: Num;
  shares: Num; pnl: Num; ret_pct: Num;
  bars_held: number; exit_reason: string;
  mae_pct: Num; mfe_pct: Num;
}

export interface MonthlyRow {
  year: number;
  months: Record<string, Num>;
  total: Num;
}

export interface Verdict { level: 'good' | 'warn' | 'bad'; text: string }

export interface OosResult {
  available: boolean;
  reason?: string;
  fraction?: number;
  verdict?: Verdict;
  in_sample?: { summary: Summary; equity: Curve };
  out_of_sample?: { summary: Summary; equity: Curve };
}

export interface MonteCarlo {
  paths: number;
  note?: string;
  trades_resampled?: number;
  final_return?: { p5: Num; p25: Num; median: Num; p75: Num; p95: Num };
  cagr?: { p5: Num; median: Num; p95: Num };
  max_drawdown?: { median: Num; p95: Num; worst: Num };
  prob_profit?: Num;
  ruin_threshold?: Num;
  prob_ruin?: Num;
  band?: { p5: number[]; median: number[]; p95: number[] };
}

export interface BacktestResult {
  symbol: string; strategy: string; interval: string;
  range: string; range_clamped: boolean;
  params: Record<string, number | string>;
  config: Record<string, number | boolean | null>;
  summary: Summary;
  extended: Extended;
  benchmark_symbol: string | null;
  equity: Curve;
  buy_hold: Curve;
  drawdown: Curve;
  rolling_sharpe: Curve;
  trades: { rows: TradeRow[]; total: number; truncated: boolean };
  monthly: MonthlyRow[];
  bars: number;
  oos?: OosResult;
  monte_carlo?: MonteCarlo;
  elapsed_ms: number;
}

/* ------------------------------------------------------------ sweep events */

export interface SweepRow {
  params: Record<string, number>;
  cagr: Num; sharpe: Num; sortino: Num; max_dd: Num; calmar: Num;
  profit_factor: Num; trades: number; win_rate: Num; exposure: Num;
}

export type OptimizeEvent =
  | { type: 'start'; symbol: string; strategy: string; interval: string;
      combinations: number; keys: string[]; bars: number }
  | { type: 'progress'; done: number; total: number;
      params: Record<string, number>; result: SweepRow | null }
  | { type: 'done'; rows: SweepRow[]; keys: string[]; verdict: Verdict; elapsed_ms: number }
  | { type: 'error'; message: string };

export interface FoldSide {
  start: string; end: string; cagr: Num; sharpe: Num; max_dd: Num; trades: number;
}

export interface Fold {
  fold: number;
  params: Record<string, number>;
  in_sample: FoldSide;
  out_of_sample: FoldSide;
}

export type WalkForwardEvent =
  | { type: 'start'; symbol: string; strategy: string; interval: string;
      folds: number; combinations: number; keys: string[]; total_runs: number }
  | { type: 'progress'; fold: number; folds: number; done: number; total: number }
  | ({ type: 'fold' } & Partial<Fold> & { skipped?: boolean; reason?: string })
  | { type: 'done'; folds: Fold[]; stitched_equity: Curve;
      stitched_summary: { final?: Num; total_return?: Num; cagr?: Num; max_dd?: Num };
      mean_is_cagr: Num; mean_oos_cagr: Num; efficiency: Num;
      verdict: Verdict; elapsed_ms: number }
  | { type: 'error'; message: string };
