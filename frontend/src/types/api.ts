/** Shapes returned by the Polaris API's user-data routes. Money arrives as strings. */

export type Market = 'india' | 'us' | 'europe' | 'asia' | 'crypto' | 'fx' | 'commodities' | 'bonds';

export type Profile = {
  id: string;
  plan: 'free' | 'pro';
  base_currency: string;
  risk_per_trade_pct: string;
  markets: Market[];
  onboarded: boolean;
  onboarded_at: string | null;
  created_at: string;
};

export type SyncStatus = 'connected' | 'syncing' | 'needs_reconnect' | 'error';

/** Paper accounts take simulated orders; real ones mirror a broker, read-only. */
export type Account = {
  id: string;
  name: string;
  kind: 'paper' | 'real';
  currency: string;
  /** Null for real accounts. */
  starting_cash: string | null;
  created_at: string;
  broker: 'zerodha' | null;
  sync: { connection_id: string; status: SyncStatus; last_synced_at: string | null } | null;
};

export type BrokerConnection = {
  id: string;
  broker: 'zerodha';
  broker_user_id: string;
  broker_user_name: string | null;
  status: SyncStatus;
  account_id: string | null;
  last_synced_at: string | null;
  token_expires_at: string | null;
  last_error: string | null;
  scopes: string[];
  created_at: string;
};

export type BrokersResponse = {
  connections: BrokerConnection[];
  available: { broker: 'zerodha'; label: string; markets: string[]; configured: boolean }[];
};

export type SyncResult = { account_id: string; holdings: number; skipped: number; synced_at: string };

/** One synced holding of a real account. Money fields are decimal strings. */
export type HoldingRow = {
  symbol: string;
  broker_symbol: string;
  exchange: string;
  isin: string | null;
  quantity: string;
  currency: string;
  avg_price: string;
  last_price: string | null;
  market_value: string;
  invested: string;
  unrealized_pnl: string;
  unrealized_pnl_pct: string | null;
  day_change_pct: string | null;
  fx_rate: string | null;
  /** In the user's base currency; null when the FX rate is unavailable. */
  market_value_base: string | null;
};

export type HoldingsResponse = {
  account: { id: string; name: string; kind: 'real'; currency: string };
  /** When the broker was last synced; prices are as of then. */
  as_of: string | null;
  base_currency: string;
  holdings: HoldingRow[];
  totals: { market_value: string; invested: string; unrealized_pnl: string;
            unrealized_pnl_pct: string | null; market_value_base: string | null };
};

export type PositionRow = {
  symbol: string;
  quantity: string;
  currency: string;
  avg_cost: string;
  cost_basis: string;
  realized_pnl: string;
  last_price: string | null;
  fx_rate: string | null;
  market_value: string | null;
  unrealized_pnl: string | null;
  price_unavailable: boolean;
};

export type PositionsResponse = {
  account: { id: string; name: string; currency: string; starting_cash: string };
  cash: string;
  realized_pnl: string;
  positions: PositionRow[];
};

export type Fill = {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  quantity: string;
  price: string;
  currency: string;
  fx_rate: string;
  fee: string;
  stop_price: string | null;
  note: string | null;
  filled_at: string;
};

export type OrderResult = {
  fill_id: string;
  duplicate: boolean;
  symbol?: string;
  side?: 'buy' | 'sell';
  quantity?: string;
  price?: string;
  currency?: string;
  filled_at?: string;
};

export type Watchlist = { id: string; name: string; created_at: string; symbols: string[] };

export type Quote = {
  symbol: string;
  shortName?: string;
  longName?: string;
  currency?: string;
  regularMarketPrice?: number;
  previousClose?: number;
  regularMarketChangePercent?: number;
  regularMarketVolume?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  stale?: boolean;
};

export type SearchResult = {
  symbol: string;
  shortname?: string;
  longname?: string;
  quoteType?: string;
  exchDisp?: string;
  exchange?: string;
};


/** One index or sector row from /api/markets/pulse. */
export type PulseRow = {
  symbol: string;
  name: string;
  price: number;
  change: number | null;
  change_pct: number;
  spark: number[];
  as_of: string | null;
};

export type MarketPulse = {
  market: 'in' | 'us';
  label: string;
  currency: string;
  session: { state: 'open' | 'closed'; hours: string; note: string };
  indices: PulseRow[];
  /** Counts over `universe`, which always names what was counted. */
  breadth: {
    universe: string;
    advancing: number;
    declining: number;
    unchanged: number;
    priced: number;
    scanned: number;
    coverage_pct: number;
    partial: boolean;
    as_of: string | null;
  };
  sectors: PulseRow[];
  missing: string[];
  source: string;
  computed_at: string;
};

export type FxQuote = {
  pair: string;
  base: string;
  quote: string;
  rate: number;
  source: string;
  as_of: string | null;
  stale: boolean;
};
