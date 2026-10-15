'use client';

import clsx from 'clsx';
import Link from 'next/link';
import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { Floating, focusFromAnchor, type Placement } from './Popover';

export type MenuItem = {
  id: string;
  label: string;
  /** Either an action or a link. */
  onSelect?: () => void;
  href?: string;
  tone?: 'danger';
  disabled?: boolean;
};

const itemClass = (danger: boolean) => clsx(
  'flex min-h-11 w-full items-center rounded-md px-3 text-left text-body-sm outline-none',
  'focus:bg-white/[0.08] aria-disabled:opacity-50',
  danger ? 'text-down' : 'text-fg',
);

/**
 * Menu button (WAI-ARIA APG). Enter, Space or ArrowDown open it on the first
 * item, ArrowUp on the last; arrows move (wrapping), Home and End jump, a
 * letter jumps to the next item starting with it, Escape closes and returns
 * to the button, Tab closes and moves on from the button.
 */
export function Menu({ label, items, placement = 'bottom-start', buttonClassName, children }: {
  /** Accessible name of the button (when `children` is only an icon). */
  label: string;
  items: MenuItem[];
  placement?: Placement;
  buttonClassName?: string;
  /** Button content; defaults to `label`. */
  children?: ReactNode;
}) {
  const id = useId();
  const button = useRef<HTMLButtonElement>(null);
  const refs = useRef<(HTMLElement | null)[]>([]);
  const [open, setOpen] = useState(false);
  const [start, setStart] = useState<'first' | 'last'>('first');

  const enabled = items.map((it, i) => (it.disabled ? -1 : i)).filter((i) => i >= 0);
  const focusAt = (i: number) => refs.current[i]?.focus();

  useEffect(() => {
    if (!open) return;
    const first = start === 'first' ? enabled[0] : enabled[enabled.length - 1];
    if (first !== undefined) focusAt(first);
    // Only on opening; `enabled` is derived from items each render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, start]);

  const openAt = (where: 'first' | 'last') => { setStart(where); setOpen(true); };
  const close = (refocus: boolean) => { setOpen(false); if (refocus) button.current?.focus(); };

  const onButtonKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openAt('first'); }
    if (e.key === 'ArrowUp') { e.preventDefault(); openAt('last'); }
  };

  const onMenuKey = (e: KeyboardEvent) => {
    const at = refs.current.findIndex((el) => el === document.activeElement);
    const pos = enabled.indexOf(at);
    const move = (to: number) => { e.preventDefault(); focusAt(enabled[(to + enabled.length) % enabled.length]); };
    if (e.key === 'ArrowDown') move(pos + 1);
    else if (e.key === 'ArrowUp') move(pos - 1);
    else if (e.key === 'Home') move(0);
    else if (e.key === 'End') move(enabled.length - 1);
    else if (e.key === 'Tab') { e.preventDefault(); close(false); focusFromAnchor(button.current, e.currentTarget as HTMLElement, e.shiftKey); }
    else if (e.key.length === 1 && /\S/.test(e.key)) {
      const ch = e.key.toLowerCase();
      const order = [...enabled.slice(pos + 1), ...enabled.slice(0, pos + 1)];
      const hit = order.find((i) => items[i].label.toLowerCase().startsWith(ch));
      if (hit !== undefined) { e.preventDefault(); focusAt(hit); }
    }
  };

  const select = (it: MenuItem) => {
    if (it.disabled) return;
    close(!it.href);
    it.onSelect?.();
  };

  return (
    <>
      <button ref={button} type="button" id={`${id}-button`} aria-haspopup="menu" aria-expanded={open}
              aria-controls={open ? `${id}-menu` : undefined} aria-label={children ? label : undefined}
              onClick={() => (open ? close(false) : openAt('first'))} onKeyDown={onButtonKey}
              className={buttonClassName}>
        {children ?? label}
      </button>
      <Floating open={open} onClose={() => close(false)} anchorRef={button} placement={placement}
                id={`${id}-menu`} role="menu" aria-labelledby={`${id}-button`} onKeyDown={onMenuKey}
                className="min-w-48 p-1">
        {items.map((it, i) => {
          const common = {
            ref: (el: HTMLElement | null) => { refs.current[i] = el; },
            role: 'menuitem', tabIndex: -1, 'aria-disabled': it.disabled || undefined,
            className: itemClass(it.tone === 'danger'),
          } as const;
          return it.href && !it.disabled
            ? <Link key={it.id} href={it.href} {...common} onClick={() => select(it)}>{it.label}</Link>
            : <button key={it.id} type="button" {...common} onClick={() => select(it)}>{it.label}</button>;
        })}
      </Floating>
    </>
  );
}
