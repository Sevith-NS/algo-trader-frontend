'use client';

import clsx from 'clsx';
import { useEffect, useLayoutEffect, useRef, type HTMLAttributes, type ReactNode, type RefObject } from 'react';
import { createPortal } from 'react-dom';

export type Placement = 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end' | 'top' | 'bottom';

const EDGE = 8;
const TABBABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const tabbables = (root: ParentNode) =>
  [...root.querySelectorAll<HTMLElement>(TABBABLE)].filter((el) => !el.closest('[hidden], [inert]') && el.getClientRects().length > 0);

/**
 * Floating panels live at the end of <body>, so Tab out of one would leave the
 * page's order. Continue from the trigger instead: back to it, or past it.
 */
export function focusFromAnchor(anchor: HTMLElement | null, panel: HTMLElement, back: boolean) {
  if (!anchor) return;
  if (back) { anchor.focus(); return; }
  const page = tabbables(document).filter((el) => !panel.contains(el));
  (page[page.indexOf(anchor) + 1] ?? anchor).focus();
}

/** Below by default, above when there is no room; always inside the viewport. */
function place(a: DOMRect, el: HTMLElement, placement: Placement, gap: number) {
  const { width: w, height: h } = el.getBoundingClientRect();
  const vw = document.documentElement.clientWidth;
  const vh = window.innerHeight;
  const fitsBelow = a.bottom + gap + h <= vh - EDGE;
  const fitsAbove = a.top - gap - h >= EDGE;
  const above = placement.startsWith('top') ? fitsAbove || !fitsBelow : !fitsBelow && fitsAbove;
  const align = placement.split('-')[1];
  const left = align === 'start' ? a.left : align === 'end' ? a.right - w : a.left + a.width / 2 - w / 2;
  el.style.top = `${Math.round(above ? a.top - gap - h : a.bottom + gap)}px`;
  el.style.left = `${Math.round(Math.min(Math.max(left, EDGE), vw - w - EDGE))}px`;
}

/**
 * Pin `floating` to `anchor` with fixed positioning, following scroll and
 * resize. Writes the element's style directly (no re-render per frame).
 */
export function useAnchoredPosition(open: boolean, anchor: RefObject<HTMLElement | null>, floating: RefObject<HTMLElement | null>,
  placement: Placement = 'bottom-start', gap = 6) {
  useLayoutEffect(() => {
    if (!open) return;
    const update = () => {
      const a = anchor.current;
      const el = floating.current;
      if (a && el) place(a.getBoundingClientRect(), el, placement, gap);
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => { window.removeEventListener('resize', update); window.removeEventListener('scroll', update, true); };
  }, [open, anchor, floating, placement, gap]);
}

/**
 * The shared layer under Popover and Menu: portalled to <body> (a glass
 * parent's backdrop-filter would otherwise trap `position: fixed`), anchored,
 * and closed by Escape (focus returns to the anchor) or a press outside.
 */
export function Floating({ open, onClose, anchorRef, placement, autoFocus = false, className, children, ...rest }: {
  open: boolean; onClose: () => void; anchorRef: RefObject<HTMLElement | null>; placement?: Placement;
  /** Focus the panel itself on open (Popover). A Menu focuses its first item instead. */
  autoFocus?: boolean; className?: string; children: ReactNode;
} & Omit<HTMLAttributes<HTMLDivElement>, 'className' | 'children'>) {
  const ref = useRef<HTMLDivElement>(null);
  useAnchoredPosition(open, anchorRef, ref, placement);

  useEffect(() => { if (open && autoFocus) ref.current?.focus({ preventScroll: true }); }, [open, autoFocus]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      // Only the overlay that holds focus answers, so stacked overlays close one at a time.
      const focus = document.activeElement;
      if (e.key !== 'Escape' || !(ref.current?.contains(focus) || anchorRef.current?.contains(focus))) return;
      e.preventDefault();
      onClose();
      anchorRef.current?.focus();
    };
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!ref.current?.contains(t) && !anchorRef.current?.contains(t)) onClose();
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onDown);
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('pointerdown', onDown); };
  }, [open, onClose, anchorRef]);

  if (!open) return null;
  return createPortal(
    <div ref={ref} {...rest} style={{ position: 'fixed', top: 0, left: 0 }}
         className={clsx('popover glass-2 shadow-overlay z-50 rounded-lg', className)}>
      {children}
    </div>,
    document.body,
  );
}

/**
 * A non-modal panel anchored to its trigger (role="dialog"). Focus moves into
 * it on open; Escape, a press outside, or tabbing out closes it (Tab carries
 * on from the trigger, so the page's focus order holds). The trigger
 * should carry `aria-expanded` and `aria-controls={id}`.
 */
export function Popover({ id, open, onClose, anchorRef, label, placement = 'bottom-end', className, children }: {
  id: string; open: boolean; onClose: () => void; anchorRef: RefObject<HTMLElement | null>; label: string;
  placement?: Placement; className?: string; children: ReactNode;
}) {
  return (
    <Floating open={open} onClose={onClose} anchorRef={anchorRef} placement={placement} autoFocus id={id}
              role="dialog" aria-label={label} tabIndex={-1}
              className={clsx('w-[min(22rem,calc(100vw-1rem))] outline-none', className)}
              onKeyDown={(e) => {
                if (e.key !== 'Tab') return;
                const inside = tabbables(e.currentTarget);
                const atEdge = e.shiftKey ? !inside.length || document.activeElement === inside[0] || document.activeElement === e.currentTarget
                  : !inside.length || document.activeElement === inside[inside.length - 1];
                if (!atEdge) return;
                e.preventDefault();
                onClose();
                focusFromAnchor(anchorRef.current, e.currentTarget, e.shiftKey);
              }}
              onBlur={(e) => {
                const next = e.relatedTarget as Node | null;
                if (next && !e.currentTarget.contains(next) && !anchorRef.current?.contains(next)) onClose();
              }}>
      {children}
    </Floating>
  );
}
