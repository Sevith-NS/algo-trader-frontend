// Palette + label helpers for the trading desk panels. Colours are the tokens
// from globals.css / tailwind.config.js as hex, because several of these are
// consumed as inline style values (tinted panels keyed to a verdict).

import type {
  DeskAction, DeskCall, DebateSide, DebateWinner, Grade, RiskStance,
} from '../../types/agents';

export const ACCENT = {
  green: '#34D399',
  red: '#F87171',
  amber: '#FBBF24',
  cyan: '#22D3EE',
  purple: '#A78BFA',
  blue: '#60A5FA',
  muted: '#72809A',
} as const;

export const actionColor = (action: DeskAction | undefined) =>
  action === 'BUY' ? ACCENT.green : action === 'SELL' ? ACCENT.red : ACCENT.amber;

export const callColor = (call: DeskCall | undefined) =>
  call === 'BUY' ? ACCENT.green : call === 'AVOID' ? ACCENT.red : ACCENT.amber;

export const sideColor = (side: DebateSide) => (side === 'BULL' ? ACCENT.green : ACCENT.red);

export const winnerColor = (winner: DebateWinner | undefined) =>
  winner === 'BULL' ? ACCENT.green : winner === 'BEAR' ? ACCENT.red : ACCENT.amber;

export const decisionColor = (decision: 'APPROVE' | 'REJECT' | undefined) =>
  decision === 'APPROVE' ? ACCENT.green : ACCENT.red;

/** A signed score in [-1, 1] — the analysts' and factor votes' shared scale. */
export const scoreColor = (score: number) =>
  score > 0.05 ? ACCENT.green : score < -0.05 ? ACCENT.red : ACCENT.muted;

export const riskStanceColor = (stance: RiskStance | undefined) =>
  stance === 'SIZE UP' ? ACCENT.green
  : stance === 'SIZE DOWN' ? ACCENT.amber
  : stance === 'NO TRADE' ? ACCENT.red
  : ACCENT.blue;

// A stand-aside grade is not on the same axis as a directional one: DODGED is a
// win for having stayed out, MISSED is the cost of it.
export const gradeColor = (grade: Grade | null | undefined) =>
  grade === 'HIT' || grade === 'DODGED' ? ACCENT.green
  : grade === 'MISS' || grade === 'MISSED' ? ACCENT.red
  : ACCENT.muted;

export const GRADE_LABELS: Record<Grade, string> = {
  HIT: 'Beat the tape',
  MISS: 'Lagged the tape',
  FLAT: 'No edge either way',
  DODGED: 'Dodged a drop',
  MISSED: 'Sat out a rally',
};

export const SEAT_LABELS: Record<string, string> = {
  aggressive: 'Aggressive',
  neutral: 'Neutral',
  conservative: 'Conservative',
};

export const ANALYST_ORDER = ['fundamentals', 'technical', 'news', 'sentiment'] as const;

export const STAGE_LABELS: Record<string, string> = {
  gather: 'Gathering data',
  analysts: 'Analyst team',
  debate: 'Research debate',
  judge: 'Research manager',
  trader: 'Trader',
  risk: 'Risk committee',
  pm: 'Portfolio manager',
};

export const STAGE_ORDER = ['gather', 'analysts', 'debate', 'judge', 'trader', 'risk', 'pm'];

export const pct = (value: number | null | undefined, digits = 1) =>
  value === null || value === undefined || Number.isNaN(value)
    ? '—'
    : `${value >= 0 ? '+' : ''}${value.toFixed(digits)}%`;

/** Unsigned percentage — sizes and probabilities, where a "+" would be noise. */
export const rawPct = (value: number | null | undefined, digits = 1) =>
  value === null || value === undefined || Number.isNaN(value)
    ? '—'
    : `${value.toFixed(digits)}%`;

export const relativeDay = (days: number | null | undefined) => {
  if (days === null || days === undefined) return 'not yet scored';
  if (days < 1) return 'today';
  if (days < 2) return 'yesterday';
  if (days < 30) return `${Math.round(days)}d ago`;
  if (days < 365) return `${Math.round(days / 30)}mo ago`;
  return `${(days / 365).toFixed(1)}y ago`;
};
