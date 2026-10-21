'use client';

import { useCallback, useEffect, useState } from 'react';
import clsx from 'clsx';
import { History, Trash2, RefreshCw, WifiOff, Target } from '@/components/ui/icons';
import type { JournalEntry } from '../../types/agents';
import { deleteJournalEntry, fetchJournal, restoreJournalEntry } from '../../lib/agentsDesk';
import { useToast } from '@/components/ui/Toast';

function Row({ entry, onDelete }: { entry: JournalEntry; onDelete: (id: string) => void }) {
  // Notes written before the desk rebuild only have the old thesis.
  const text = entry.summary || entry.thesis;
  return (
    <div className="flex flex-col gap-2 border-t border-line py-3 first:border-t-0 sm:flex-row sm:items-start sm:gap-4">
      <div className="flex min-w-0 shrink-0 flex-col sm:w-36">
        <span className="ticker text-[13px] font-semibold text-fg">{entry.symbol}</span>
        <span className="text-caption text-fg-3">{entry.date} · {entry.rounds} {entry.rounds === 1 ? 'round' : 'rounds'}</span>
      </div>

      <div className="min-w-0 flex-1">
        {text && <p className="line-clamp-3 text-[12px] leading-relaxed text-fg-2">{text}</p>}
        {entry.what_to_watch && entry.what_to_watch.length > 0 && (
          <p className="mt-1 text-caption text-fg-3">Watching: {entry.what_to_watch.join(' · ')}</p>
        )}
      </div>

      <button
        onClick={() => onDelete(entry.id)}
        aria-label={`Delete the ${entry.date} note on ${entry.symbol}`}
        className="mt-0.5 shrink-0 self-start rounded p-1 text-fg-3 transition-colors hover:text-down"
      >
        <Trash2 size={13} />
      </button>
    </div>
  );
}

/**
 * The user's desk notes: what each run explained and what it said to watch.
 * Nothing is scored, because the desk makes no calls. Deletes are soft, with
 * an undo.
 */
export default function DeskNotes({
  symbol, refreshKey,
}: { symbol?: string; refreshKey?: number }) {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [scope, setScope] = useState<'symbol' | 'all'>(symbol ? 'symbol' : 'all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const toast = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchJournal(scope === 'symbol' ? symbol : undefined);
      setEntries(data.entries);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Desk notes are unavailable.');
    } finally {
      setLoading(false);
    }
  }, [scope, symbol]);

  useEffect(() => {
    // Run as a task, not inside the effect: load() sets loading state first.
    const id = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(id);
  }, [load, refreshKey]);

  const handleDelete = async (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
    try {
      await deleteJournalEntry(id);
      load();
      toast.show({
        message: 'Note deleted',
        action: { label: 'Undo', onClick: () => { void restoreJournalEntry(id).then(load); } },
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not delete that note.');
    }
  };

  return (
    <div className="glass rounded-xl p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
        <h4 className="flex items-center gap-2 text-sm font-semibold text-fg">
          <History size={15} className="text-fg-2" /> Desk notes
          <span className="rounded bg-white/[0.06] px-1.5 py-0.5 text-caption text-fg-3">
            one per run · kept for you
          </span>
        </h4>
        <div className="flex items-center gap-2">
          {symbol && (
            <div className="flex overflow-hidden rounded-sm border border-white/15 bg-black/30">
              {(['symbol', 'all'] as const).map((option) => (
                <button
                  key={option}
                  onClick={() => setScope(option)}
                  className={clsx(
                    'px-2.5 py-1 text-caption transition-colors',
                    scope === option ? 'bg-line text-fg' : 'text-fg-3 hover:text-fg-2',
                  )}
                >
                  {option === 'symbol' ? symbol : 'All'}
                </button>
              ))}
            </div>
          )}
          <button
            onClick={load}
            disabled={loading}
            aria-label="Reload desk notes"
            className="rounded-sm border border-white/25 bg-black/30 px-2 py-1.5 text-fg-3 transition-colors hover:text-fg disabled:opacity-50"
          >
            <RefreshCw size={13} />
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-[12px] text-fg-2">
          <WifiOff size={14} className="shrink-0 text-warn" /> {error}
        </div>
      )}

      {!error && entries.length === 0 && !loading && (
        <p className="flex items-center gap-2 text-[12px] text-fg-3">
          <Target size={13} />
          No notes yet. Each desk run keeps one here: its summary and what it said to watch.
        </p>
      )}

      {entries.length > 0 && (
        <div>
          {entries.map((entry) => <Row key={entry.id} entry={entry} onDelete={handleDelete} />)}
        </div>
      )}
    </div>
  );
}
