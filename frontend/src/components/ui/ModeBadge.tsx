import clsx from 'clsx';

/** `Real` (neutral outline) or `Paper` (blue tint), per docs/DESIGN.md §7. */
export function ModeBadge({ mode, className }: { mode: 'real' | 'paper'; className?: string }) {
  return (
    <span className={clsx('pill', mode === 'paper' ? 'border-paper/40 bg-paper/10 text-paper' : 'bg-transparent text-fg',
      className)}>
      {mode === 'paper' ? 'Paper' : 'Real'}
    </span>
  );
}
