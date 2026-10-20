// Wire types for the research desk (backend/agents_desk.py).
//
// The backend streams one event per agent turn, so these mirror the event
// shapes rather than one big response object. The desk explains and never
// advises: no event carries a buy/sell call, conviction, target or size of its
// own. Model output is clamped and trimmed server-side before it gets here.

export type DeskStage = 'gather' | 'analysts' | 'debate' | 'summary';

export type DebateSide = 'BULL' | 'BEAR';

export interface QuantLevels {
  entry: number;
  stop_loss: number;
  target_1: number;
  target_2: number;
  r_multiple_1: number;
  r_multiple_2: number;
  risk_per_share: number;
  side: 'long' | 'short';
  fill_probability: number;
  win_probability: number;
  expectancy_r: number;
}

export interface ExistingPosition {
  shares: number;
  average_price: number;
  market_value: number;
  pct_of_equity: number | null;
  unrealized_pct: number | null;
}

export interface DeskBook {
  has_book: boolean;
  total_equity: number;
  cash: number;
  invested_value: number;
  position_count: number;
  existing_position: ExistingPosition | null;
  risk: Record<string, number | null> | null;
  sector_allocation: Record<string, number> | null;
  top_weights: Record<string, number> | null;
}

export interface StatusEvent {
  type: 'status';
  stage: DeskStage;
  message: string;
}

export interface ContextEvent {
  type: 'context';
  run_id: string;
  symbol: string;
  company: string;
  price: number | null;
  rounds: number;
  /** Five pillars, −1…+1, null when a source is down. Readings, never a call. */
  readings: { pillars: Record<string, number | null> };
  quant: {
    composite_score: number;
    factors: Record<string, number>;
    levels: QuantLevels | null;
  } | null;
  technical: Record<string, unknown> | null;
  news: Record<string, unknown> | null;
  fundamentals: Record<string, unknown> | null;
  portfolio: DeskBook;
  engines: Record<string, boolean>;
}

export interface AnalystEvent {
  type: 'analyst';
  role: 'fundamentals' | 'technical' | 'news' | 'sentiment';
  label: string;
  report: string;
  /** How weak (−1) or strong (+1) this slice of the data looks. */
  score: number;
  confidence: number;
  key_points: string[];
  /** Observable things that would change the reading. */
  flags: string[];
  error?: string;
}

export interface DebateEvent {
  type: 'debate';
  round: number;
  side: DebateSide;
  label: string;
  argument: string;
  evidence: string | null;
  rebuts: string | null;
  concedes: string | null;
  error?: string;
}

export interface SummaryEvent {
  type: 'summary';
  label: string;
  summary: string;
  going_well: string | null;
  could_go_wrong: string | null;
  disagreement: string | null;
  what_to_watch: string[];
  plan_explained: string | null;
  error?: string;
}

/** What the user's own risk-per-trade rule implies. Arithmetic, no model. */
export interface RulesEvent {
  type: 'rules';
  label: string;
  risk_pct: number | null;
  side: 'long' | 'short' | null;
  entry: number | null;
  stop: number | null;
  equity: number | null;
  cash: number;
  existing_position: ExistingPosition | null;
  risk: Record<string, number | null> | null;
  top_weights: Record<string, number> | null;
  shares: number | null;
  risk_amount: number | null;
  position_value: number | null;
  pct_of_equity_after: number | null;
  capped_by_cash: boolean;
  notes: string[];
}

/**
 * A note of one desk run. Notes from before 2026-10-20 also carry the old
 * fields (thesis, action, conviction); the UI reads only the ones below.
 */
export interface JournalEntry {
  id: string;
  symbol: string;
  company: string;
  ts: number;
  date: string;
  price: number | null;
  rounds: number;
  summary?: string | null;
  thesis?: string | null;
  what_to_watch?: string[] | null;
  analyst_scores?: Record<string, number>;
}

export interface JournalEvent {
  type: 'journal';
  entry: JournalEntry;
}

/**
 * Emitted once, the first time a run leaves the primary provider because it
 * reported its quota was gone. The run continues — this is information, not an
 * error, which is why it is a distinct type from ErrorEvent.
 */
export interface NoticeEvent {
  type: 'notice';
  kind: 'failover';
  message: string;
}

export interface DoneEvent {
  type: 'done';
  run_id: string;
  elapsed_ms: number;
  routing: {
    /** Model calls in this run served by the OmniRoute fallback rather than Gemini. */
    fallback_calls: number;
    primary_benched_for: number;
    fallback_model: string | null;
  };
}

export interface ErrorEvent {
  type: 'error';
  message: string;
}

export type DeskEvent =
  | StatusEvent | ContextEvent | AnalystEvent | DebateEvent | SummaryEvent
  | RulesEvent | JournalEvent | NoticeEvent | DoneEvent | ErrorEvent;

/** Snapshot of GET /api/agents/routing — where desk calls are currently going. */
export interface RoutingStatus {
  enabled: boolean;
  base_url: string;
  model: string;
  has_key: boolean;
  available: boolean;
  benched: Record<string, number>;
  counters: { fallback_calls: number; fallback_failures: number; bench_events: number };
}

export interface JournalResponse {
  entries: JournalEntry[];
}
