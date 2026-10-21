/** /api/quant-signals and /api/ml-insights payloads (fields the UI reads). */

export type QuantLevels = {
  entry: number | null;
  stop_loss: number | null;
  target_1: number | null;
  target_2: number | null;
  r_multiple_1?: number | null;
  r_multiple_2?: number | null;
  fill_probability?: number | null;
  atr_stop_mult?: number | null;
  win_probability?: number | null;
  expectancy_r?: number | null;
  side?: 'long' | 'short';
};

export type QuantSignals = {
  symbol: string;
  composite_score: number;
  levels?: QuantLevels;
  factors?: Record<string, number>;
  indicators?: {
    rsi_14: number;
    zscore_20d: number;
    half_life_days?: number | null;
    vwap_20d: number;
    vwap_deviation_pct: number;
    atr_14: number;
    realized_vol_annual: number;
    vol_regime_percentile: number;
    bollinger_pct_b: number;
    volume_imbalance: number;
  };
};

export type MlInsights = {
  fear_greed_index: number;
};
