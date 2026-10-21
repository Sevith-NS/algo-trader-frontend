'use client';

import clsx from 'clsx';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useRef, type KeyboardEvent } from 'react';

const tabClass = (active: boolean) => clsx(
  'relative -mb-px flex min-h-11 shrink-0 items-center border-b-2 px-0.5 text-body-sm transition-colors duration-fast',
  active ? 'border-fg text-fg' : 'border-transparent text-fg-3 hover:text-fg',
);

/** Tabs that are links: each tab has its own URL, so it can be shared and reloaded. */
export function LinkTabs({ tabs, label, exact = false }: {
  tabs: { href: string; label: string }[];
  label: string;
  exact?: boolean;
}) {
  const pathname = usePathname();
  const search = useSearchParams();
  const here = pathname + (search.toString() ? `?${search}` : '');
  const isActive = (href: string) => {
    if (href.includes('?')) return here === href;
    return exact ? pathname === href : pathname === href;
  };
  return (
    <nav aria-label={label} className="flex gap-6 overflow-x-auto border-b border-line [scrollbar-width:none]">
      {tabs.map((t) => (
        <Link key={t.href} href={t.href} scroll={false} aria-current={isActive(t.href) ? 'page' : undefined}
              className={tabClass(isActive(t.href))}>
          {t.label}
        </Link>
      ))}
    </nav>
  );
}

/** In-page tabs (WAI-ARIA tabs pattern, arrow-key navigation). */
export function Tabs<T extends string>({ tabs, value, onChange, label, idPrefix }: {
  tabs: { id: T; label: string }[];
  value: T;
  onChange: (id: T) => void;
  label: string;
  idPrefix: string;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const onKey = (e: KeyboardEvent, i: number) => {
    const delta = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!delta && e.key !== 'Home' && e.key !== 'End') return;
    e.preventDefault();
    const next = e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length - 1 : (i + delta + tabs.length) % tabs.length;
    onChange(tabs[next].id);
    refs.current[next]?.focus();
  };
  return (
    <div role="tablist" aria-label={label} className="flex gap-6 overflow-x-auto border-b border-line [scrollbar-width:none]">
      {tabs.map((t, i) => (
        <button key={t.id} ref={(el) => { refs.current[i] = el; }} role="tab" type="button"
                id={`${idPrefix}-tab-${t.id}`} aria-controls={`${idPrefix}-panel-${t.id}`}
                aria-selected={value === t.id} tabIndex={value === t.id ? 0 : -1}
                onClick={() => onChange(t.id)} onKeyDown={(e) => onKey(e, i)}
                className={tabClass(value === t.id)}>
          {t.label}
        </button>
      ))}
    </div>
  );
}
