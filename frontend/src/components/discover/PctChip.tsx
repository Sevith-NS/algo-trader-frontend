import clsx from 'clsx';

/**
 * Signed day-change chip. The sign is always explicit (+ / -) so direction
 * survives without color — non-color redundancy is a hard requirement.
 */
export default function PctChip({ value }: { value: number | null | undefined }) {
  if (value === null || value === undefined) return <span className="text-xs text-fg-3">–</span>;
  return (
    <span
      className={clsx(
        'whitespace-nowrap rounded px-1.5 py-0.5 text-caption font-semibold tabular',
        value >= 0 ? 'bg-up/10 text-up' : 'bg-down/10 text-down',
      )}
    >
      {value >= 0 ? '+' : ''}{value.toFixed(2)}%
    </span>
  );
}
