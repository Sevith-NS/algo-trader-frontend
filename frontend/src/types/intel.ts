/**
 * Payloads from the research engine: deep_analysis.py, fundamentals.py and
 * news_intel.py. Only the fields the UI reads are typed; the engine may send
 * more. Any block can come back as `{ error }` when its source is down;
 * check with `'error' in x`.
 */

export type Call = 'BUY' | 'HOLD' | 'AVOID';
export type Stance = 'bullish' | 'bearish' | 'neutral';

export type Failed = { error: string };

export type HorizonVerdict = { call: Call; score: number; conviction_10: number };

export type Verdict = {
  long_term: HorizonVerdict;
  short_term: HorizonVerdict;
  pillars: Record<'fundamentals' | 'valuation' | 'technicals' | 'quant' | 'news', number>;
  interesting_price: number | null;
};

export type Technical = {
  phase: string;
  phase_note: string;
  price: number;
  pos_52w: number;
  volume_read: string;
  volume_note: string;
  support: { near: number; major: number };
  resistance: { near: number; major: number };
};

export type FiscalYear = {
  fiscal_year: string | number;
  revenue: number | null;
  net_income: number | null;
  net_margin: number | null;
  roe: number | null;
  cash_conversion: number | null;
  debt_to_equity: number | null;
};

export type Flag = { title: string; detail: string; severity?: string };

export type Fundamentals = {
  health: { score: number; grade: string; components: Record<string, number> };
  years: FiscalYear[];
  trends: { window_years: number; revenue_cagr_pct: number | null; profit_cagr_pct: number | null };
  valuation: {
    pe: number | null;
    pb: number | null;
    ev_ebitda: number | null;
    pe_hist_avg: number | null;
    premium_to_own_history_pct: number | null;
    fair_price_at_hist_pe: number | null;
    eps_basis?: string;
    verdict?: string;
  };
  red_flags: Flag[];
  green_flags: Flag[];
  quarterly_momentum?: { revenue_yoy?: number; net_income_yoy?: number };
  not_covered?: string[];
};

export type NewsArticle = {
  title: string;
  link: string | null;
  source: string | null;
  sentiment: Stance;
  age_days: number;
};

export type NewsIntel = {
  stance: Stance;
  rating: number;
  confidence: number;
  article_count: number;
  distinct_outlets: number;
  breakdown: Record<Stance, number>;
  articles: NewsArticle[];
  sources_scanned?: string[];
};

export type Narrative = Partial<Record<
  'one_liner' | 'business_model' | 'quarterly_results' | 'balance_sheet' | 'competitive_position'
  | 'management_quality' | 'technical_setup' | 'catalysts' | 'bull_case' | 'bear_case' | 'valuation',
  unknown
>> & { final_verdict?: { call?: string; horizon?: string; rationale?: unknown } | null };

export type DeepAnalysis = {
  symbol: string;
  fundamentals: Fundamentals | Failed;
  technical: Technical | Failed;
  verdict: Verdict;
  narrative: Narrative | null;
};

export type HoldingIntel =
  | { symbol: string; error: string }
  | {
      symbol: string;
      company: string | null;
      health_score: number | null;
      health_grade: string | null;
      red_flag_count: number | null;
      top_red_flag: string | null;
      valuation_premium_pct: number | null;
      phase: string | null;
      news_stance: Stance | null;
      news_rating: number | null;
      top_headline: { title: string; link: string | null; sentiment: Stance; source: string | null } | null;
      verdict: Verdict;
    };
