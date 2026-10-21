'use client';

import clsx from 'clsx';
import Link from 'next/link';
import { useEffect, useId, useState, type FormEvent, type KeyboardEvent } from 'react';
import { Panel } from '@/components/PageHeader';
import { Button } from '@/components/ui/Button';
import { Change } from '@/components/ui/Change';
import { inputClass } from '@/components/ui/Field';
import { X } from '@/components/ui/icons';
import { EmptyState, ErrorState, LoadingBlock } from '@/components/ui/States';
import { useToast } from '@/components/ui/Toast';
import { apiDelete, apiGet, apiPost, errorMessage } from '@/lib/api';
import { formatMoney } from '@/lib/format';
import { useApi } from '@/lib/useApi';
import { toOption, useSymbolSearch } from '@/lib/useSymbolSearch';
import { WATCHLIST_CHANGED, addToWatchlist } from '@/lib/watchlist';
import type { Quote, Watchlist as WL } from '@/types/api';

const SYMBOL = /^[A-Za-z0-9^][A-Za-z0-9.\-=&^]{0,23}$/;

function useQuotes(symbols: string[]) {
  const [quotes, setQuotes] = useState<Record<string, Quote | null>>({});
  const key = symbols.join(',');
  useEffect(() => {
    if (!key) return;
    const controller = new AbortController();
    const load = () => key.split(',').forEach((s) => {
      apiGet<Quote>(`/api/quote?symbol=${encodeURIComponent(s)}`, controller.signal)
        .then((q) => setQuotes((all) => ({ ...all, [s]: q })))
        .catch((err) => { if (err.name !== 'AbortError') setQuotes((all) => ({ ...all, [s]: null })); });
    });
    load();
    const id = window.setInterval(() => document.visibilityState === 'visible' && load(), 60_000);
    return () => { controller.abort(); window.clearInterval(id); };
  }, [key]);
  return quotes;
}

/** The user's first watchlist, with live quotes. Created on first add. */
export function Watchlist() {
  const { data, error, loading, reload } = useApi<{ watchlists: WL[] }>('/api/watchlists');
  const toast = useToast();
  const list = data?.watchlists[0];
  const quotes = useQuotes(list?.symbols ?? []);

  // Adds from anywhere (this box, the search palette) land here too.
  useEffect(() => {
    window.addEventListener(WATCHLIST_CHANGED, reload);
    return () => window.removeEventListener(WATCHLIST_CHANGED, reload);
  }, [reload]);

  const remove = async (symbol: string) => {
    if (!list) return;
    try {
      await apiDelete(`/api/watchlists/${list.id}/items/${encodeURIComponent(symbol)}`);
      reload();
      toast.show({
        message: `Removed ${symbol}`,
        action: { label: 'Undo', onClick: () => { void apiPost(`/api/watchlists/${list.id}/items`, { symbol }).then(reload); } },
      });
    } catch (err) {
      toast.show({ message: errorMessage(err), tone: 'error' });
    }
  };

  return (
    <Panel level={2} id="watchlist-h" title="Watchlist" bodyClassName="flex flex-col gap-3"
           aside={list ? `${list.symbols.length} of 100` : undefined}>

      <AddSymbol listId={list?.id} have={list?.symbols ?? []} />

      {loading && !data ? <LoadingBlock lines={5} label="Loading watchlist" />
        : error ? <ErrorState error={error} onRetry={reload} />
        : !list?.symbols.length ? (
          <EmptyState title="Your watchlist is empty">
            Add the symbols you follow. Prices refresh every minute while this page is open.
          </EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[320px] text-table">
              <caption className="sr-only">Watchlist with last price and change today</caption>
              <thead>
                <tr className="border-b border-white/10 text-left text-caption text-fg-3">
                  <th scope="col" className="py-2 font-normal">Symbol</th>
                  <th scope="col" className="py-2 text-right font-normal">Last</th>
                  <th scope="col" className="py-2 text-right font-normal">Today</th>
                  <th scope="col" className="w-11 py-2"><span className="sr-only">Remove</span></th>
                </tr>
              </thead>
              <tbody>
                {list.symbols.map((s) => {
                  const q = quotes[s];
                  return (
                    <tr key={s} className="border-b border-white/[0.07] last:border-0">
                      <th scope="row" className="py-2 text-left font-normal">
                        <Link href={`/s/${encodeURIComponent(s)}`} className="flex min-h-9 flex-col justify-center hover:underline">
                          <span className="ticker">{s}</span>
                          {q?.shortName && q.shortName !== s && <span className="max-w-[16ch] truncate text-caption text-fg-3">{q.shortName}</span>}
                        </Link>
                      </th>
                      <td className="py-2 text-right tabular">
                        {q === undefined ? <span className="skeleton ml-auto block h-3 w-16" aria-label="Loading" />
                          : q === null ? <span className="text-fg-3">Unavailable</span>
                          : <span className={q.stale ? 'text-warn' : ''} title={q.stale ? 'Stale price' : undefined}>
                              {formatMoney(q.regularMarketPrice, q.currency)}
                            </span>}
                      </td>
                      <td className="py-2 text-right">{q ? <Change pct={q.regularMarketChangePercent} /> : null}</td>
                      <td className="py-2 text-right">
                        <button type="button" onClick={() => remove(s)} aria-label={`Remove ${s}`}
                                className="grid min-h-11 min-w-11 place-items-center text-fg-3 hover:text-fg">
                          <X size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
    </Panel>
  );
}

/**
 * Search-as-you-type add box (WAI-ARIA combobox). Arrow keys move through
 * results, Enter adds the highlighted one, or the typed ticker when nothing
 * is highlighted, so an exact ticker still works without picking.
 */
export function AddSymbol({ listId, have }: { listId?: string; have: string[] }) {
  const toast = useToast();
  const listboxId = useId();
  const [input, setInput] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);
  const { results, status, error } = useSymbolSearch(input);
  const query = input.trim();
  const options = query ? results.slice(0, 8).map(toOption) : [];
  const showList = open && query.length > 0;

  const add = async (symbol: string) => {
    if (have.includes(symbol)) {
      setFormError(`${symbol} is already on your watchlist.`);
      return;
    }
    setBusy(true);
    setFormError('');
    try {
      await addToWatchlist(symbol, listId);
      setInput('');
      setOpen(false);
      setActive(-1);
      toast.show({ message: `Added ${symbol} to your watchlist` });
    } catch (err) {
      setFormError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const pick = showList && active >= 0 ? options[active]?.symbol : undefined;
    const symbol = pick ?? query.toUpperCase();
    if (!SYMBOL.test(symbol)) {
      setFormError('Pick a result, or type a ticker like AAPL, RELIANCE.NS or BTC-USD.');
      return;
    }
    void add(symbol);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown' && options.length) { e.preventDefault(); setOpen(true); setActive((a) => Math.min(a + 1, options.length - 1)); }
    if (e.key === 'ArrowUp' && options.length) { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    if (e.key === 'Escape' && showList) { e.preventDefault(); setOpen(false); setActive(-1); }
  };

  return (
    <div className="relative">
      <form onSubmit={submit} className="flex gap-2" noValidate>
        <label htmlFor="wl-add" className="sr-only">Search for a symbol to add</label>
        <input id="wl-add" role="combobox" aria-expanded={showList && options.length > 0} aria-controls={listboxId}
               aria-autocomplete="list" aria-activedescendant={showList && active >= 0 ? `${listboxId}-${active}` : undefined}
               value={input} placeholder="Search a name or ticker, e.g. Infosys"
               onChange={(e) => { setInput(e.target.value); setOpen(true); setActive(-1); setFormError(''); }}
               onFocus={() => setOpen(true)} onBlur={() => setOpen(false)} onKeyDown={onKeyDown}
               maxLength={64} autoComplete="off" spellCheck={false} aria-invalid={Boolean(formError)}
               aria-describedby={formError ? 'wl-add-error' : undefined} className={inputClass} />
        <Button type="submit" variant="secondary" loading={busy}>Add</Button>
      </form>
      {formError && <p id="wl-add-error" role="alert" className="mt-2 text-caption text-down">{formError}</p>}
      {showList && (
        <div className="glass-2 shadow-overlay absolute inset-x-0 top-full z-30 mt-1 max-h-80 overflow-y-auto overflow-x-hidden rounded-xl py-1">
          {status === 'loading' && !options.length && <p role="status" className="px-3 py-2 text-body-sm text-fg-3">Searching</p>}
          {status === 'error' && <p role="alert" className="px-3 py-2 text-body-sm text-down">{error}</p>}
          {status === 'idle' && !options.length && (
            <p className="px-3 py-2 text-body-sm text-fg-2">
              No matches. Press Add to use <span className="ticker">{query.toUpperCase()}</span> as typed.
            </p>
          )}
          <ul id={listboxId} role="listbox" aria-label="Search results">
            {options.map((o, i) => {
              const inList = have.includes(o.symbol);
              return (
                <li key={o.symbol} id={`${listboxId}-${i}`} role="option" aria-selected={i === active} aria-disabled={inList}
                    onMouseEnter={() => setActive(i)}
                    // mousedown, not click: it runs before the input's blur closes the list.
                    onMouseDown={(e) => { e.preventDefault(); if (!inList) void add(o.symbol); }}
                    className={clsx('flex min-h-11 items-center justify-between gap-3 px-3 py-1.5',
                      inList ? 'cursor-default' : 'cursor-pointer', i === active && 'bg-white/[0.06]')}>
                  <span className="flex min-w-0 flex-col">
                    <span className="flex min-w-0 items-baseline gap-2">
                      <span className="ticker shrink-0 text-body-sm">{o.symbol}</span>
                      {o.name && <span className="truncate text-body-sm text-fg-2">{o.name}</span>}
                    </span>
                    {o.meta && <span className="truncate text-caption text-fg-3">{o.meta}</span>}
                  </span>
                  <span className={clsx('shrink-0 text-caption', inList ? 'text-fg-3' : 'text-fg')}>{inList ? 'In list' : 'Add'}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
