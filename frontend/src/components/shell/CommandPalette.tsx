'use client';

import clsx from 'clsx';
import { useRouter } from 'next/navigation';
import { useEffect, useId, useRef, useState } from 'react';
import { useToast } from '@/components/ui/Toast';
import { errorMessage } from '@/lib/api';
import { readStorage, writeStorage } from '@/lib/browser';
import { useApi } from '@/lib/useApi';
import { toOption, useSymbolSearch, type SymbolOption } from '@/lib/useSymbolSearch';
import { WATCHLIST_CHANGED, addToWatchlist } from '@/lib/watchlist';
import type { Watchlist } from '@/types/api';
import { Search, X } from '@/components/ui/icons';

// Recent searches are the signed-in user's own: lib/browser namespaces the
// key by user id and clears other users' entries on sign-in.
const RECENT_KEY = 'recent-symbols.v1';

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
 * arrow keys move, Enter opens, Shift+Enter adds to the watchlist, Escape
 * closes and returns focus. Each row also has a "+ Watchlist" button for
 * pointer and touch (kept out of the tab order: the combobox owns focus).
 */
export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  const hintId = useId();
  const toast = useToast();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const [adding, setAdding] = useState<string | null>(null);
  const { results, status, error } = useSymbolSearch(query);
  const lists = useApi<{ watchlists: Watchlist[] }>(open ? '/api/watchlists' : null);
  const watchlist = lists.data?.watchlists[0];
  const reloadLists = lists.reload;

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
    window.addEventListener(WATCHLIST_CHANGED, reloadLists);
    return () => window.removeEventListener(WATCHLIST_CHANGED, reloadLists);
  }, [reloadLists]);

  // Read on render while open: recents are a small, local convenience.
  const recent = open ? readRecent() : [];
  const options: SymbolOption[] = query.trim() ? results.map(toOption) : recent.map((s) => ({ symbol: s }));
  const current = Math.min(active, Math.max(options.length - 1, 0));
  const inWatchlist = (symbol: string) => Boolean(watchlist?.symbols.includes(symbol));

  const addToList = async (symbol: string) => {
    if (inWatchlist(symbol) || adding) return;
    setAdding(symbol);
    try {
      await addToWatchlist(symbol, watchlist?.id);
      toast.show({ message: `Added ${symbol} to your watchlist` });
    } catch (err) {
      toast.show({ message: errorMessage(err), tone: 'error' });
    } finally {
      setAdding(null);
    }
  };

  const go = (symbol: string) => {
    rememberSymbol(symbol);
    onClose();
    setQuery('');
    router.push(`/s/${encodeURIComponent(symbol)}`);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(Math.min(current + 1, options.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActive(Math.max(current - 1, 0)); }
    if (e.key === 'Enter') {
      e.preventDefault();
      const pick = options[current]?.symbol ?? query.trim().toUpperCase();
      if (!pick) return;
      if (e.shiftKey) void addToList(pick);
      else go(pick);
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
      className="glass-2 m-0 h-[100dvh] max-h-none w-full max-w-none overflow-hidden p-0 text-fg backdrop:bg-black/60 backdrop:backdrop-blur-sm sm:bottom-auto sm:mx-auto sm:mt-[12vh] sm:h-auto sm:max-h-[70vh] sm:w-[min(40rem,calc(100vw-2rem))] sm:rounded-2xl"
    >
      {/* Focus shows on the row's bottom edge, inside the dialog; the field's
          own ring would be drawn outside it and over the dialog border. */}
      <div className="flex items-center gap-2 border-b border-white/10 px-4 focus-within:border-fg">
        <Search className="shrink-0 text-fg-3" />
        <input
          ref={inputRef}
          role="combobox"
          aria-expanded={options.length > 0}
          aria-controls={listId}
          aria-activedescendant={options[current] ? `${listId}-${current}` : undefined}
          aria-autocomplete="list"
          aria-describedby={hintId}
          value={query}
          onChange={(e) => { setQuery(e.target.value); setActive(0); }}
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
          {options.map((o, i) => {
            const listed = inWatchlist(o.symbol);
            return (
              <li key={o.symbol} id={`${listId}-${i}`} role="option" aria-selected={i === current}
                  onMouseEnter={() => setActive(i)}
                  onMouseDown={(e) => { e.preventDefault(); go(o.symbol); }}
                  className={clsx('flex min-h-12 cursor-pointer items-center justify-between gap-3 px-4 py-2',
                    i === current ? 'bg-white/[0.06]' : '')}>
                {/* Phones: type and exchange drop to a second line so the name keeps its width. */}
                <span className="flex min-w-0 flex-1 flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                  <span className="flex min-w-0 items-baseline gap-3">
                    <span className="ticker shrink-0 text-body-sm">{o.symbol}</span>
                    {o.name && <span className="truncate text-body-sm text-fg-2">{o.name}</span>}
                  </span>
                  {o.meta && <span className="truncate text-caption text-fg-3 sm:shrink-0">{o.meta}</span>}
                </span>
                {listed ? (
                  <span className="shrink-0 text-caption text-fg-3">In watchlist</span>
                ) : (
                  <button type="button" tabIndex={-1} aria-label={`Add ${o.symbol} to watchlist`}
                          // Own mousedown so the row's "open" doesn't fire as well.
                          onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); void addToList(o.symbol); }}
                          className="min-h-11 shrink-0 rounded-sm border border-white/15 px-2.5 text-caption text-fg-2 hover:border-white/30 hover:text-fg">
                    {adding === o.symbol ? 'Adding' : '+ Watchlist'}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
        {/* Hidden on phones (no Shift key); still read out through aria-describedby. */}
        <p id={hintId} className="hidden border-t border-white/10 px-4 py-2 text-caption text-fg-3 sm:block">
          Enter opens a symbol. Shift+Enter adds it to your watchlist.
        </p>
      </div>
    </dialog>
  );
}
