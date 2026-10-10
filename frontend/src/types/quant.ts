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
};

export type QuantSignals = {
  symbol: string;
  signal: string;
  action: 'buy' | 'sell' | 'hold' | string;
  conviction: number;
  composite_score: number;
  levels?: QuantLevels;
  factors?: Record<string, number>;
  position_sizing?: {
    kelly_fraction: number;
    recommended_fraction: number;
    win_rate: number;
    payoff_ratio: number;
  };
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
  xgboost_probability: number;
  prophet_7d_forecast: number;
  fear_greed_index: number;
};
