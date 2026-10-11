'use client';

import clsx from 'clsx';
import { useRouter } from 'next/navigation';
import { useEffect, useId, useRef, useState } from 'react';
import { apiGet, errorMessage } from '@/lib/api';
import { readStorage, writeStorage } from '@/lib/browser';
import type { SearchResult } from '@/types/api';
import { Search, X } from '@/components/ui/icons';

// Recent searches are the signed-in user's own: lib/browser namespaces the
// key by user id and clears other users' entries on sign-in.
const RECENT_KEY = 'recent-symbols.v1';

/** Yahoo sends EQUITY / ETF / CRYPTOCURRENCY; show Equity, ETF, Cryptocurrency. */
const sentenceCase = (s?: string) => (!s ? s : s.length <= 4 ? s : s[0] + s.slice(1).toLowerCase());

function readRecent(): string[] {
  try {
    const v = JSON.parse(readStorage(RECENT_KEY) ?? '[]');
    return Array.isArray(v) ? v.filter((s) => typeof s === 'string').slice(0, 6) : [];
  } catch {
    return [];
  }
}

export function rememberSymbol(symbol: string) {
  const next = [symbol, ...readRecent().filter((s) => s !== symbol)].slice(0, 6);
  writeStorage(RECENT_KEY, JSON.stringify(next));
}

/**
 * Search, the way into every symbol. A combobox inside a native modal dialog:
 * arrow keys move, Enter opens, Escape closes and returns focus.
 */
export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [active, setActive] = useState(0);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [error, setError] = useState('');

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open && !el.open) {
      el.showModal();
      inputRef.current?.focus();
    }
    if (!open && el.open) el.close();
  }, [open]);

  useEffect(() => {
    const q = query.trim();
    if (!q) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setStatus('loading');
      setResults([]);
      apiGet<{ quotes: SearchResult[] }>(`/api/search?q=${encodeURIComponent(q)}`, controller.signal)
        .then((d) => { setResults(d.quotes); setActive(0); setStatus('idle'); })
        .catch((err) => {
          if ((err as Error).name === 'AbortError') return;
          setError(errorMessage(err));
          setStatus('error');
        });
    }, 180);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [query]);

  // Read on render while open: recents are a small, local convenience.
  const recent = open ? readRecent() : [];
  const options: { symbol: string; name?: string; meta?: string }[] = query.trim()
    ? results.map((r) => ({ symbol: r.symbol, name: r.shortname || r.longname,
                            meta: [sentenceCase(r.quoteType), r.exchDisp].filter(Boolean).join(' · ') }))
    : recent.map((s) => ({ symbol: s }));

  const go = (symbol: string) => {
    rememberSymbol(symbol);
    onClose();
    setQuery('');
    router.push(`/s/${encodeURIComponent(symbol)}`);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, options.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    if (e.key === 'Enter') {
      e.preventDefault();
      const pick = options[active]?.symbol ?? query.trim().toUpperCase();
      if (pick) go(pick);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={(e) => { if (e.target === dialogRef.current) onClose(); }}
      aria-label="Search symbols"
      // sm:bottom-auto: a modal dialog is pinned top and bottom by default, so
      // without it the box stretches to max-height instead of fitting results.
      className="m-0 h-[100dvh] max-h-none w-full max-w-none border-0 bg-ink-1 p-0 text-fg backdrop:bg-black/70 sm:bottom-auto sm:mx-auto sm:mt-[12vh] sm:h-auto sm:max-h-[70vh] sm:w-[min(40rem,calc(100vw-2rem))] sm:border sm:border-line-strong"
    >
      {/* Focus shows on the row's bottom edge, inside the dialog; the field's
          own ring would be drawn outside it and over the dialog border. */}
      <div className="flex items-center gap-2 border-b border-line px-3 focus-within:border-up">
        <Search className="shrink-0 text-fg-3" />
        <input
          ref={inputRef}
          role="combobox"
          aria-expanded={options.length > 0}
          aria-controls={listId}
          aria-activedescendant={options[active] ? `${listId}-${active}` : undefined}
          aria-autocomplete="list"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Search stocks, ETFs, crypto, FX"
          maxLength={64}
          autoComplete="off"
          spellCheck={false}
          className="min-h-14 w-full min-w-0 bg-transparent text-body text-fg outline-none focus-visible:outline-none placeholder:text-fg-3"
        />
        <button type="button" onClick={onClose} aria-label="Close search"
                className="grid min-h-11 min-w-11 place-items-center text-fg-2 hover:text-fg">
          <X />
        </button>
      </div>

      <div className="max-h-[calc(100dvh-3.5rem)] overflow-y-auto sm:max-h-[calc(70vh-3.5rem)]">
        {!query.trim() && (
          <p className="px-4 pb-1 pt-3 text-caption text-fg-3">
            {recent.length ? 'Recent' : 'Type a name or ticker, such as Reliance, AAPL or BTC-USD.'}
          </p>
        )}
        {query.trim() && status === 'error' && <p role="alert" className="px-4 py-3 text-body-sm text-down">{error}</p>}
        {query.trim() && status === 'loading' && !results.length && <p role="status" className="px-4 py-3 text-body-sm text-fg-3">Searching</p>}
        {query.trim() && status === 'idle' && !results.length && (
          <p className="px-4 py-3 text-body-sm text-fg-2">
            No matches. Press Enter to open <span className="ticker">{query.trim().toUpperCase()}</span> directly.
          </p>
        )}
        <ul id={listId} role="listbox" aria-label="Results" className="py-1">
          {options.map((o, i) => (
            <li key={o.symbol} id={`${listId}-${i}`} role="option" aria-selected={i === active}
                onMouseEnter={() => setActive(i)}
                onMouseDown={(e) => { e.preventDefault(); go(o.symbol); }}
                // Phones: type and exchange drop to a second line so the name keeps its width.
                className={clsx('flex min-h-12 cursor-pointer flex-col justify-center gap-0.5 px-4 py-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4',
                  i === active ? 'bg-ink-2' : '')}>
              <span className="flex min-w-0 items-baseline gap-3">
                <span className="ticker shrink-0 text-body-sm">{o.symbol}</span>
                {o.name && <span className="truncate text-body-sm text-fg-2">{o.name}</span>}
              </span>
              {o.meta && <span className="truncate text-caption text-fg-3 sm:shrink-0">{o.meta}</span>}
            </li>
          ))}
        </ul>
      </div>
    </dialog>
  );
}
