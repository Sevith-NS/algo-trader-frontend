'use client';

import clsx from 'clsx';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState, type FormEvent } from 'react';
import { AddSymbol } from '@/components/home/Watchlist';
import { PageHeader } from '@/components/PageHeader';
import { WatchlistTable } from '@/components/watchlists/WatchlistTable';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Field, describedBy, inputClass } from '@/components/ui/Field';
import { EmptyState, ErrorState, LoadingBlock } from '@/components/ui/States';
import { useToast } from '@/components/ui/Toast';
import { apiDelete, apiPatch, apiPost, errorMessage } from '@/lib/api';
import { useApi } from '@/lib/useApi';
import { WATCHLIST_CHANGED, removeFromWatchlist } from '@/lib/watchlist';
import type { Watchlist } from '@/types/api';

// Mirrors the API (routers/watchlists.py).
const MAX_LISTS = 20;
const MAX_NAME = 40;
const UNDO_MS = 10_000;

/** Create (no `list`) or rename (`list`) dialog. `onSaved` gets the list id. */
function NameDialog({ open, list, onClose, onSaved }: {
  open: boolean; list?: Watchlist; onClose: () => void; onSaved: (id: string) => void;
}) {
  return (
    <Dialog open={open} onClose={onClose} title={list ? 'Rename list' : 'New list'}>
      <NameForm list={list} onClose={onClose} onSaved={onSaved} />
    </Dialog>
  );
}

// Mounted only while the dialog is open, so each opening starts fresh.
function NameForm({ list, onClose, onSaved }: { list?: Watchlist; onClose: () => void; onSaved: (id: string) => void }) {
  const [name, setName] = useState(list?.name ?? '');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  // After the parent's showModal(), which would otherwise focus Close.
  useEffect(() => { const id = requestAnimationFrame(() => input.current?.focus()); return () => cancelAnimationFrame(id); }, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) { setError('Give the list a name.'); return; }
    if (trimmed === list?.name) { onClose(); return; }
    setBusy(true);
    try {
      const id = list
        ? (await apiPatch<{ id: string }>(`/api/watchlists/${list.id}`, { name: trimmed })).id
        : (await apiPost<{ id: string }>('/api/watchlists', { name: trimmed })).id;
      onSaved(id);
      onClose();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-5" noValidate>
      <Field id="wl-name" label="Name" hint={`Up to ${MAX_NAME} characters.`} error={error}>
        <input ref={input} id="wl-name" value={name} onChange={(e) => { setName(e.target.value); setError(null); }}
               maxLength={MAX_NAME} autoComplete="off" aria-invalid={Boolean(error)}
               aria-describedby={describedBy('wl-name', Boolean(error))} className={inputClass} />
      </Field>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
        <Button type="submit" loading={busy}>{list ? 'Save' : 'Create list'}</Button>
      </div>
    </form>
  );
}

function WatchlistsPage() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const toast = useToast();
  const { data, error, loading, reload } = useApi<{ watchlists: Watchlist[] }>('/api/watchlists');
  const [dialog, setDialog] = useState<{ open: boolean; list?: Watchlist }>({ open: false });
  const [hidden, setHidden] = useState<string[]>([]);

  useEffect(() => {
    window.addEventListener(WATCHLIST_CHANGED, reload);
    return () => window.removeEventListener(WATCHLIST_CHANGED, reload);
  }, [reload]);

  const lists = (data?.watchlists ?? []).filter((w) => !hidden.includes(w.id));
  const list = lists.find((w) => w.id === params.get('list')) ?? lists[0];
  const select = (id: string) => router.replace(`${pathname}?list=${id}`, { scroll: false });
  const full = lists.length >= MAX_LISTS;

  const removeSymbol = async (symbol: string) => {
    if (!list) return;
    try {
      await removeFromWatchlist(symbol, [list.id]);
      toast.show({
        message: `Removed ${symbol} from ${list.name}`,
        action: { label: 'Undo', onClick: () => { void apiPost(`/api/watchlists/${list.id}/items`, { symbol }).then(reload); } },
      });
    } catch (err) {
      toast.show({ message: errorMessage(err), tone: 'error' });
    }
  };

  // Delete waits out the Undo window: the list is hidden now and the DELETE
  // goes out when the toast would close. Undo just cancels, keeping the id,
  // order and symbols. If the tab closes first, the list survives (fails safe).
  const deleteList = () => {
    if (!list) return;
    const gone = list;
    setHidden((h) => [...h, gone.id]);
    router.replace(pathname, { scroll: false });
    const unhide = () => setHidden((h) => h.filter((id) => id !== gone.id));
    const timer = window.setTimeout(() => {
      apiDelete(`/api/watchlists/${gone.id}`)
        .catch((err) => toast.show({ message: errorMessage(err), tone: 'error' }))
        .finally(() => { unhide(); reload(); });
    }, UNDO_MS);
    toast.show({
      message: `Deleted ${gone.name}`, durationMs: UNDO_MS,
      action: { label: 'Undo', onClick: () => { window.clearTimeout(timer); unhide(); select(gone.id); } },
    });
  };

  const newButton = (
    <Button variant="secondary" onClick={() => setDialog({ open: true })} disabled={full}
            title={full ? `You can have up to ${MAX_LISTS} lists` : undefined}>
      New list
    </Button>
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader level={1} title="Watchlists" className="mb-2" actions={data && lists.length > 0 ? newButton : undefined} />

      {loading && !data ? <LoadingBlock lines={5} label="Loading watchlists" />
        : error && !data ? <ErrorState error={error} title="Couldn't load your watchlists" onRetry={reload} />
        : !list ? (
          <EmptyState title="No watchlists yet" className="glass rounded-2xl p-6"
                      action={<Button onClick={() => setDialog({ open: true })}>Create a list</Button>}>
            Group the symbols you follow into named lists, for example Core, Swing ideas or US tech.
          </EmptyState>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
            <nav aria-label="Your lists" className="glass hidden self-start rounded-2xl p-2 lg:block">
              <ul className="flex flex-col gap-0.5">
                {lists.map((w) => (
                  <li key={w.id}>
                    <button type="button" onClick={() => select(w.id)} aria-current={w.id === list.id ? 'true' : undefined}
                            className={clsx('relative flex min-h-11 w-full items-center justify-between gap-3 rounded-lg px-3 text-left text-body-sm transition-colors duration-fast',
                              w.id === list.id ? 'bg-white/[0.08] text-fg' : 'text-fg-2 hover:bg-white/[0.04] hover:text-fg')}>
                      {w.id === list.id && <span aria-hidden="true" className="absolute inset-y-2 left-0 w-0.5 bg-fg" />}
                      <span className="truncate">{w.name}</span>
                      <span className="text-caption text-fg-3 tabular">{w.symbols.length}</span>
                    </button>
                  </li>
                ))}
              </ul>
              {full && <p className="px-3 pb-1 pt-2 text-caption text-fg-3">{MAX_LISTS} lists is the most you can have.</p>}
            </nav>

            <section aria-labelledby="wl-title" className="glass flex min-w-0 flex-col gap-4 rounded-2xl p-5 md:p-6">
              <div className="lg:hidden">
                <label htmlFor="wl-select" className="mb-1.5 block text-table text-fg-2">List</label>
                <select id="wl-select" value={list.id} onChange={(e) => select(e.target.value)} className={inputClass}>
                  {lists.map((w) => <option key={w.id} value={w.id}>{w.name} ({w.symbols.length})</option>)}
                </select>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex min-w-0 items-baseline gap-3">
                  <h2 id="wl-title" className="truncate text-h4">{list.name}</h2>
                  <span className="text-caption text-fg-3 tabular">{list.symbols.length} of 100</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" onClick={() => setDialog({ open: true, list })}>Rename</Button>
                  <Button variant="danger" onClick={deleteList}>Delete</Button>
                </div>
              </div>

              <AddSymbol listId={list.id} have={list.symbols} />

              {list.symbols.length ? (
                <WatchlistTable key={list.id} name={list.name} symbols={list.symbols} onRemove={removeSymbol} />
              ) : (
                <EmptyState title={`${list.name} is empty`}>
                  Search above to add symbols. Prices refresh every minute while this page is open.
                </EmptyState>
              )}
            </section>
          </div>
        )}

      <NameDialog open={dialog.open} list={dialog.list} onClose={() => setDialog((d) => ({ ...d, open: false }))}
                  onSaved={(id) => { reload(); select(id); }} />
    </div>
  );
}

export default function Watchlists() {
  return <Suspense fallback={<LoadingBlock lines={5} label="Loading watchlists" />}><WatchlistsPage /></Suspense>;
}
