import clsx from 'clsx';

const MINUS = '−';

/** Sentiment as a word: the score alone means nothing to most readers. */
export function toneWord(score: number, threshold = 0.05): 'Positive' | 'Negative' | 'Neutral' {
  return score >= threshold ? 'Positive' : score <= -threshold ? 'Negative' : 'Neutral';
}

/**
 * A headline's tone from a sentiment model, on −1 to +1. Like Change, it is
 * carried by sign, arrow and word as well as colour.
 */
export function Tone({ score, className }: { score: number; className?: string }) {
  const word = toneWord(score);
  const up = word === 'Positive';
  const down = word === 'Negative';
  const value = `${score > 0 ? '+' : score < 0 ? MINUS : ''}${Math.abs(score).toFixed(2)}`;
  return (
    <span aria-label={`${word} tone, ${value}`}
          className={clsx('inline-flex items-center gap-1 whitespace-nowrap text-table tabular',
            up ? 'text-up' : down ? 'text-down' : 'text-fg-2', className)}>
      <span aria-hidden="true" className="text-[0.75em]">{up ? '▲' : down ? '▼' : ''}</span>
      <span aria-hidden="true">{word} {value}</span>
    </span>
  );
}
