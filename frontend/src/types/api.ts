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

export type Account = {
  id: string;
  name: string;
  currency: string;
  starting_cash: string;
  created_at: string;
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
