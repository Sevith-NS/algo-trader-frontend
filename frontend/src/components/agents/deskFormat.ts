// Palette + label helpers for the research desk panels. Colours are the
// globals.css tokens as `var()`, because several of these are consumed as
// inline style values (tinted panels; see lib/theme tint).

import type { DebateSide } from '../../types/agents';

export const ACCENT = {
  green: 'var(--green)',
  red: 'var(--red)',
  amber: 'var(--fg-2)',
  muted: 'var(--fg-3)',
} as const;

export const sideColor = (side: DebateSide) => (side === 'BULL' ? ACCENT.green : ACCENT.red);

/** A signed reading in [-1, 1] — the analysts' and factor readings' shared scale. */
export const scoreColor = (score: number) =>
  score > 0.05 ? ACCENT.green : score < -0.05 ? ACCENT.red : ACCENT.muted;

export const ANALYST_ORDER = ['fundamentals', 'technical', 'news', 'sentiment'] as const;

export const STAGE_LABELS: Record<string, string> = {
  gather: 'Gathering data',
  analysts: 'Analyst team',
  debate: 'Debate',
  summary: 'Summary',
};

export const STAGE_ORDER = ['gather', 'analysts', 'debate', 'summary'];

/** Unsigned percentage — sizes and shares of a book, where a "+" would be noise. */
export const rawPct = (value: number | null | undefined, digits = 1) =>
  value === null || value === undefined || Number.isNaN(value)
    ? '–'
    : `${value.toFixed(digits)}%`;
