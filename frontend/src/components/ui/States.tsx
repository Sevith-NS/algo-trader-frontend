import clsx from 'clsx';
import type { CSSProperties, ReactNode } from 'react';
import { errorMessage } from '@/lib/api';
import { Button } from './Button';

export function Skeleton({ className, style }: { className?: string; style?: CSSProperties }) {
  return <span aria-hidden="true" style={style} className={clsx('skeleton block h-3', className)} />;
}

/** A few skeleton lines inside a status region, so screen readers hear "Loading". */
export function LoadingBlock({ lines = 4, label = 'Loading', className }: {
  lines?: number; label?: string; className?: string;
}) {
  const widths = ['w-3/4', 'w-1/2', 'w-full', 'w-5/6', 'w-2/3', 'w-11/12'];
  return (
    <div role="status" aria-label={label} className={clsx('flex flex-col gap-3 py-2', className)}>
      {Array.from({ length: lines }, (_, i) => <Skeleton key={i} className={widths[i % widths.length]} />)}
    </div>
  );
}

export function EmptyState({ title, children, action, className }: {
  title: string; children?: ReactNode; action?: ReactNode; className?: string;
}) {
  return (
    <div className={clsx('well flex flex-col items-start gap-2 rounded-xl border-dashed p-5', className)}>
      <p className="text-body-sm font-medium text-fg">{title}</p>
      {children && <div className="max-w-prose text-body-sm text-fg-2">{children}</div>}
      {action && <div className="pt-1">{action}</div>}
    </div>
  );
}

export function ErrorState({ error, title = "Couldn't load this", onRetry, className }: {
  error: unknown; title?: string; onRetry?: () => void; className?: string;
}) {
  return (
    <div role="alert" className={clsx('flex flex-col items-start gap-2 rounded-xl border border-down/40 bg-down/[0.07] p-5', className)}>
      <p className="text-body-sm font-medium text-fg">{title}</p>
      <p className="max-w-prose text-body-sm text-fg-2">{errorMessage(error)}</p>
      {onRetry && <Button variant="secondary" size="sm" onClick={onRetry}>Try again</Button>}
    </div>
  );
}

/** Provenance: where a number came from and how fresh it is. */
export function DataChip({ children, stale = false, className }: {
  children: ReactNode; stale?: boolean; className?: string;
}) {
  return (
    <span className={clsx(
      'inline-flex items-center gap-1.5 rounded-sm border px-1.5 py-0.5 text-caption',
      stale ? 'border-warn/50 bg-warn/10 text-warn' : 'border-white/15 bg-white/[0.04] text-fg-2',
      className,
    )}>
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />
      {children}
    </span>
  );
}
