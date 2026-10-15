// Shared formatting + palette helpers for the intelligence panels.

export const fmtPrice = (val: number | null | undefined, currency = 'USD') =>
  val === null || val === undefined
    ? '–'
    : new Intl.NumberFormat(currency === 'INR' ? 'en-IN' : 'en-US', {
        style: 'currency',
        currency,
      }).format(val);

/** Large statement figures: ₹ Cr / L Cr for INR, $B/$M elsewhere. */
export const fmtBig = (val: number | null | undefined, currency = 'USD') => {
  if (val === null || val === undefined) return '–';
  const abs = Math.abs(val);
  if (currency === 'INR') {
    if (abs >= 1e12) return `₹${(val / 1e12).toFixed(2)} L Cr`;
    if (abs >= 1e7) return `₹${Math.round(val / 1e7).toLocaleString('en-IN')} Cr`;
    return `₹${Math.round(val).toLocaleString('en-IN')}`;
  }
  if (abs >= 1e12) return `$${(val / 1e12).toFixed(2)}T`;
  if (abs >= 1e9) return `$${(val / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `$${(val / 1e6).toFixed(1)}M`;
  return `$${Math.round(val).toLocaleString('en-US')}`;
};

export const stanceColor = (stance: string | null | undefined) =>
  stance === 'bullish' ? 'var(--green)' : stance === 'bearish' ? 'var(--red)' : 'var(--fg-2)';

export const callColor = (call: string | undefined) =>
  call === 'BUY' ? 'var(--green)' : call === 'AVOID' ? 'var(--red)' : 'var(--fg-2)';

export const gradeColor = (grade: string | undefined) => {
  if (!grade) return 'var(--fg-3)';
  if (grade.startsWith('A')) return 'var(--green)';
  if (grade === 'B') return 'var(--fg-2)';
  if (grade === 'C') return 'var(--fg-2)';
  return 'var(--red)';
};

export const PHASE_LABELS: Record<string, string> = {
  markup: 'Markup · uptrend',
  markdown: 'Markdown · downtrend',
  accumulation: 'Accumulation · basing',
  distribution: 'Distribution · topping',
  transition: 'Transition · no regime',
};

export const phaseColor = (phase: string | null | undefined) =>
  phase === 'markup' ? 'var(--green)'
  : phase === 'markdown' ? 'var(--red)'
  : phase === 'accumulation' ? 'var(--fg-2)'
  : phase === 'distribution' ? 'var(--fg-2)'
  : 'var(--fg-2)';
