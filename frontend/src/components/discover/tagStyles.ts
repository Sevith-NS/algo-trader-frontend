// Horizon tags are told apart by their label, not by colour: v2 keeps one
// accent (green, for direction) and amber for stale data only. Static class
// strings so Tailwind's scanner picks them up.

import type { HorizonTagId } from '../../types/discover';

export const TAG_ORDER: HorizonTagId[] = ['long_term', 'swing', 'short_term', 'intraday'];

export const TAG_LABELS: Record<HorizonTagId, string> = {
  long_term: 'Long Term',
  swing: 'Swing',
  short_term: 'Short Term',
  intraday: 'Intraday',
};

export const TAG_STYLES: Record<HorizonTagId, { chip: string; dot: string }> = {
  long_term: { chip: 'border-line text-fg-2', dot: 'bg-fg-3' },
  swing: { chip: 'border-line text-fg-2', dot: 'bg-fg-3' },
  short_term: { chip: 'border-line text-fg-2', dot: 'bg-fg-3' },
  intraday: { chip: 'border-line text-fg-2', dot: 'bg-fg-3' },
};
