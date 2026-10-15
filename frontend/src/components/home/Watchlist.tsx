'use client';

import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';
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
  const [input, setInput] = useState('');
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);
  const list = data?.watchlists[0];
  const quotes = useQuotes(list?.symbols ?? []);

  const add = async (e: FormEvent) => {
    e.preventDefault();
    const symbol = input.trim().toUpperCase();
    if (!SYMBOL.test(symbol)) {
      setFormError('Use a ticker like AAPL, RELIANCE.NS or BTC-USD.');
      return;
    }
    setBusy(true);
    setFormError('');
    try {
      const id = list?.id ?? (await apiPost<{ id: string }>('/api/watchlists', { name: 'Watchlist' })).id;
      await apiPost(`/api/watchlists/${id}/items`, { symbol });
      setInput('');
      reload();
    } catch (err) {
      setFormError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

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

      <form onSubmit={add} className="flex gap-2" noValidate>
        <label htmlFor="wl-add" className="sr-only">Add a symbol</label>
        <input id="wl-add" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Add a symbol, e.g. INFY.NS"
               maxLength={24} autoComplete="off" spellCheck={false} aria-invalid={Boolean(formError)}
               aria-describedby={formError ? 'wl-add-error' : undefined} className={inputClass} />
        <Button type="submit" variant="secondary" loading={busy}>Add</Button>
      </form>
      {formError && <p id="wl-add-error" role="alert" className="text-caption text-down">{formError}</p>}

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
