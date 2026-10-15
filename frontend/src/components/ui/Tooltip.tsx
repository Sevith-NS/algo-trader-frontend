'use client';

import { cloneElement, useEffect, useId, useRef, useState, type ReactElement } from 'react';
import { createPortal } from 'react-dom';
import { useAnchoredPosition, type Placement } from './Popover';

const SHOW_MS = 300;
const HIDE_MS = 100;

/**
 * A short hint on hover (after a delay) or keyboard focus. Escape hides it,
 * and the pointer can move onto it without it vanishing (WCAG 1.4.13). The
 * text is also in a hidden span the trigger points at with aria-describedby,
 * so screen readers get it whether or not the bubble is showing. Never put
 * the only copy of something important here.
 */
export function Tooltip({ content, placement = 'top', children }: {
  content: string; placement?: Placement; children: ReactElement<{ 'aria-describedby'?: string }>;
}) {
  const id = useId();
  const anchor = useRef<HTMLSpanElement>(null);
  const bubble = useRef<HTMLDivElement>(null);
  const timer = useRef<number | undefined>(undefined);
  const [open, setOpen] = useState(false);
  useAnchoredPosition(open, anchor, bubble, placement);

  const later = (next: boolean, ms: number) => { window.clearTimeout(timer.current); timer.current = window.setTimeout(() => setOpen(next), ms); };
  const now = (next: boolean) => { window.clearTimeout(timer.current); setOpen(next); };

  useEffect(() => () => window.clearTimeout(timer.current), []);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const describedBy = [children.props['aria-describedby'], `${id}-text`].filter(Boolean).join(' ');

  return (
    <span ref={anchor} className="inline-flex"
          onPointerEnter={(e) => { if (e.pointerType === 'mouse') later(true, SHOW_MS); }}
          onPointerLeave={(e) => { if (e.pointerType === 'mouse') later(false, HIDE_MS); }}
          onFocus={(e) => { if ((e.target as HTMLElement).matches(':focus-visible')) now(true); }}
          onBlur={() => now(false)}>
      {cloneElement(children, { 'aria-describedby': describedBy })}
      <span id={`${id}-text`} hidden>{content}</span>
      {open && createPortal(
        <div ref={bubble} aria-hidden="true" style={{ position: 'fixed', top: 0, left: 0 }}
             onPointerEnter={() => window.clearTimeout(timer.current)} onPointerLeave={() => later(false, HIDE_MS)}
             className="popover z-[70] max-w-xs rounded bg-ink-2 px-2 py-1 text-caption text-fg shadow-overlay">
          {content}
        </div>,
        document.body,
      )}
    </span>
  );
}
