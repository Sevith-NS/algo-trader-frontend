'use client';

import clsx from 'clsx';
import { useEffect, useRef, type ReactNode } from 'react';
import { X } from './icons';

/**
 * Modal built on the native <dialog>: the browser traps focus, closes on
 * Escape, and returns focus to whatever opened it. On phones it docks to the
 * bottom as a sheet.
 */
export function Dialog({ open, onClose, title, children, className }: {
  open: boolean; onClose: () => void; title: string; children: ReactNode; className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => { if (e.target === ref.current) onClose(); }}
      aria-labelledby="dialog-title"
      className={clsx(
        'm-0 mt-auto w-full max-w-none border border-line-strong bg-ink-2 p-0 text-fg backdrop:bg-black/70',
        'sm:m-auto sm:w-[min(32rem,calc(100vw-2rem))]',
        className,
      )}
    >
      {open && (
        <div className="flex max-h-[85dvh] flex-col">
          <div className="flex items-center justify-between gap-4 border-b border-line px-4 py-3">
            <h2 id="dialog-title" className="text-body font-medium">{title}</h2>
            <button type="button" aria-label="Close" onClick={onClose}
                    className="grid min-h-11 min-w-11 place-items-center text-fg-2 hover:text-fg">
              <X />
            </button>
          </div>
          <div className="overflow-y-auto p-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))]">{children}</div>
        </div>
      )}
    </dialog>
  );
}
