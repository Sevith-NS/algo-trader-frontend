// Wire types for the multi-agent trading desk (backend/agents_desk.py).
//
// The backend streams one event per agent turn, so these mirror the event
// shapes rather than one big response object. Every enum below is already
// clamped to a closed set server-side — model output never reaches here raw.

export type DeskStage =
  | 'gather' | 'analysts' | 'debate' | 'judge' | 'trader' | 'risk' | 'pm';

export type DeskCall = 'BUY' | 'HOLD' | 'AVOID';
export type DeskAction = 'BUY' | 'SELL' | 'HOLD';
export type DebateSide = 'BULL' | 'BEAR';
export type DebateWinner = 'BULL' | 'BEAR' | 'SPLIT';
export type RiskStance = 'SIZE UP' | 'HOLD SIZE' | 'SIZE DOWN' | 'NO TRADE';
export type Grade = 'HIT' | 'MISS' | 'FLAT' | 'DODGED' | 'MISSED';

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

export interface MemoryEntry {
  id: string;
  symbol: string;
  date: string;
  action: DeskAction;
  decision: 'APPROVE' | 'REJECT';
  conviction_10: number | null;
  size_pct: number | null;
  thesis: string;
  grade: Grade | null;
  alpha_pct: number | null;
  days_held: number | null;
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
  verdict: {
    long_term: { call: DeskCall; score: number; conviction_10: number };
    short_term: { call: DeskCall; score: number; conviction_10: number };
    pillars: Record<string, number>;
    interesting_price: number | null;
  };
  quant: {
    signal: string;
    composite_score: number;
    conviction: number;
    factors: Record<string, number>;
    levels: QuantLevels;
    position_sizing: Record<string, number>;
  } | null;
  technical: Record<string, unknown> | null;
  news: Record<string, unknown> | null;
  fundamentals: Record<string, unknown> | null;
  portfolio: DeskBook;
  memory: { same_ticker: MemoryEntry[]; lessons: MemoryEntry[] };
  engines: Record<string, boolean>;
}

export interface AnalystEvent {
  type: 'analyst';
  role: 'fundamentals' | 'technical' | 'news' | 'sentiment';
  label: string;
  report: string;
  score: number;
  confidence: number;
  key_points: string[];
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

export interface JudgeEvent {
  type: 'judge';
  label: string;
  winner: DebateWinner;
  stance: DeskCall;
  conviction_10: number;
  thesis: string;
  decisive_argument: string | null;
  key_risk: string | null;
  invalidation: string | null;
  computed_call: DeskCall;
  agrees_with_engine: boolean;
  error?: string;
}

export interface TradePlanEvent {
  type: 'trade_plan';
  label: string;
  action: DeskAction;
  horizon_days: number;
  conviction_10: number;
  entry_style: string;
  rationale: string;
  abort_if: string | null;
  levels: QuantLevels | null;
  error?: string;
}

export interface RiskEvent {
  type: 'risk';
  seat: 'aggressive' | 'neutral' | 'conservative';
  label: string;
  stance: RiskStance;
  size_pct: number;
  argument: string;
  hard_constraint: string | null;
  error?: string;
}

export interface DeskSizing {
  shares: number;
  notional: number;
  price: number | null;
  pct_of_equity: number;
  capped_at_holding: boolean;
  note: string | null;
}

export interface VerdictEvent {
  type: 'verdict';
  label: string;
  decision: 'APPROVE' | 'REJECT';
  action: DeskAction;
  size_pct: number;
  rationale: string;
  conditions: string[];
  review_in_days: number;
  sizing: DeskSizing;
  committee_average_pct: number;
  half_kelly_pct: number;
  error?: string;
}

export interface JournalOutcome {
  scored_at: number;
  days_held: number;
  bars: number;
  price_then: number;
  price_now: number;
  return_pct: number;
  benchmark_return_pct: number;
  alpha_pct: number;
  signed_alpha_pct: number;
  grade: Grade;
}

export interface JournalEntry {
  id: string;
  symbol: string;
  company: string;
  ts: number;
  date: string;
  decision: 'APPROVE' | 'REJECT';
  action: DeskAction;
  size_pct: number;
  shares: number;
  price: number | null;
  conviction_10: number;
  stance: DeskCall;
  debate_winner: DebateWinner;
  rounds: number;
  thesis: string | null;
  key_risk: string | null;
  invalidation: string | null;
  trader_action: DeskAction;
  horizon_days: number;
  review_in_days: number;
  analyst_scores: Record<string, number>;
  computed_call: DeskCall;
  levels: QuantLevels | null;
  outcome: JournalOutcome | null;
}

export interface JournalStats {
  total: number;
  graded: number;
  directional: number;
  hits: number;
  misses: number;
  hit_rate: number | null;
  avg_signed_alpha_pct: number | null;
  stand_aside: number;
  dodged: number;
  missed_moves: number;
  best: { id: string; symbol: string; action: DeskAction; date: string; grade: Grade; signed_alpha_pct: number } | null;
  worst: { id: string; symbol: string; action: DeskAction; date: string; grade: Grade; signed_alpha_pct: number } | null;
}

export interface JournalEvent {
  type: 'journal';
  entry: JournalEntry;
  stats: JournalStats | null;
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
  | StatusEvent | ContextEvent | AnalystEvent | DebateEvent | JudgeEvent
  | TradePlanEvent | RiskEvent | VerdictEvent | JournalEvent | NoticeEvent
  | DoneEvent | ErrorEvent;

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
  stats: JournalStats;
  rescored: number;
}
