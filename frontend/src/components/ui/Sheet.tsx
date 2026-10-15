'use client';

import clsx from 'clsx';
import { useEffect, useId, useRef, useState, type PointerEvent, type ReactNode } from 'react';
import { X } from './icons';

const EXIT_MS = 220; // ~70% of duration-slow (DESIGN.md §6.1)
const DISMISS_PX = 96; // drag distance that closes the phone sheet

/**
 * Side panel on lg+, bottom sheet with a drag handle below it. Built on the
 * native <dialog> like Dialog: the browser traps focus and returns it to the
 * opener on close. Escape, the scrim and the handle all go through onClose so
 * the parent owns `open`; the exit animation runs before the dialog closes.
 */
export function Sheet({ open, onClose, title, description, footer, children, className }: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  /** Pinned below the scrolling body, e.g. the primary action. */
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const drag = useRef<{ y: number; dy: number } | null>(null);
  const [closing, setClosing] = useState(false);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) {
      el.style.transform = '';
      setClosing(false);
      el.showModal();
      return;
    }
    if (!open && el.open) {
      setClosing(true);
      const t = window.setTimeout(() => { el.close(); setClosing(false); }, EXIT_MS);
      return () => window.clearTimeout(t);
    }
  }, [open]);

  // The native <dialog> doesn't stop the page behind it from scrolling.
  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    const prev = root.style.overflow;
    root.style.overflow = 'hidden';
    return () => { root.style.overflow = prev; };
  }, [open]);

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (window.matchMedia('(min-width: 1024px)').matches) return;
    if ((e.target as HTMLElement).closest('button')) return;
    drag.current = { y: e.clientY, dy: 0 };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || !ref.current) return;
    d.dy = Math.max(0, e.clientY - d.y);
    ref.current.style.transform = `translateY(${d.dy}px)`;
  };
  const onPointerUp = () => {
    const d = drag.current;
    drag.current = null;
    if (!d || !ref.current) return;
    // Past the threshold the exit animation continues from where the finger
    // let go (its keyframes only set the end state); otherwise snap back.
    if (d.dy > DISMISS_PX) onClose();
    else ref.current.style.transform = '';
  };

  return (
    <dialog
      ref={ref}
      onCancel={(e) => { e.preventDefault(); onClose(); }}
      onClick={(e) => { if (e.target === ref.current) onClose(); }}
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
      data-closing={closing || undefined}
      className={clsx(
        // overflow-hidden: the body scrolls, not the dialog (whose UA default
        // overflow:auto shows scrollbars over a 1px border rounding).
        'sheet glass-2 shadow-overlay overflow-hidden p-0 text-fg backdrop:bg-black/60 backdrop:backdrop-blur-sm',
        // Phone: docked to the bottom.
        'm-0 mt-auto max-h-[90dvh] w-full max-w-none rounded-t-2xl',
        // lg+: full-height panel on the right.
        'lg:mr-0 lg:ml-auto lg:mt-0 lg:h-dvh lg:max-h-none lg:w-[min(28rem,100vw)] lg:rounded-none lg:rounded-l-2xl',
        className,
      )}
    >
      {open || closing ? (
        <div className="flex max-h-[inherit] flex-col lg:h-full">
          <div
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            className="touch-none border-b border-white/10 px-5 pb-3 pt-2 lg:touch-auto lg:pt-3"
          >
            <div aria-hidden="true" className="mx-auto mb-2 h-1 w-10 rounded-full bg-white/25 lg:hidden" />
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 pt-2.5">
                <h2 id={titleId} className="text-body font-medium">{title}</h2>
                {description && <p id={descId} className="mt-0.5 text-body-sm text-fg-2">{description}</p>}
              </div>
              <button type="button" aria-label="Close" onClick={onClose}
                      className="-mr-3 grid min-h-11 min-w-11 shrink-0 place-items-center text-fg-2 hover:text-fg">
                <X />
              </button>
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-5">{children}</div>
          {footer && (
            <div className="border-t border-white/10 px-5 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))]">
              {footer}
            </div>
          )}
          {!footer && <div aria-hidden="true" className="h-[env(safe-area-inset-bottom,0px)] shrink-0" />}
        </div>
      ) : null}
    </dialog>
  );
}
