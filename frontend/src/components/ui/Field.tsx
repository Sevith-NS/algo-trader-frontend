import clsx from 'clsx';
import type { ReactNode } from 'react';

export const inputClass =
  'block w-full rounded-sm border border-control bg-ink-0 px-3 py-2.5 text-body text-fg tabular ' +
  'placeholder:text-fg-3 hover:border-fg-3 focus-visible:border-up aria-[invalid=true]:border-down';

/**
 * A labelled form field. The hint and error are tied to the control with
 * aria-describedby; pass `describedBy` from here to the input yourself:
 * `<input aria-describedby={describedBy(id, !!error)} />`.
 */
export function Field({ id, label, hint, error, children, className }: {
  id: string; label: string; hint?: ReactNode; error?: string | null; children: ReactNode; className?: string;
}) {
  return (
    <div className={clsx('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="text-table text-fg-2">{label}</label>
      {children}
      {hint && !error && <p id={`${id}-hint`} className="text-caption text-fg-3">{hint}</p>}
      {error && <p id={`${id}-error`} className="text-caption text-down">{error}</p>}
    </div>
  );
}

export function describedBy(id: string, hasError: boolean) {
  return hasError ? `${id}-error` : `${id}-hint`;
}
