'use client';

import { useCallback, useEffect, useState } from 'react';
import clsx from 'clsx';
import {
  History, Trash2, RefreshCw, Target, TrendingUp, TrendingDown, WifiOff,
} from '@/components/ui/icons';
import type { JournalEntry, JournalStats } from '../../types/agents';
import { deleteJournalEntry, fetchJournal, restoreJournalEntry } from '../../lib/agentsDesk';
import { useToast } from '@/components/ui/Toast';
import { actionColor, gradeColor, GRADE_LABELS, pct, rawPct, relativeDay } from './deskFormat';
import { Chip, MicroLabel } from './DeskAtoms';

function Scorecard({ stats }: { stats: JournalStats }) {
  const hitColor = stats.hit_rate === null ? '#848C88'
    : stats.hit_rate >= 50 ? '#2FBF71' : '#E5484D';
  const alphaColor = stats.avg_signed_alpha_pct === null ? '#848C88'
    : stats.avg_signed_alpha_pct >= 0 ? '#2FBF71' : '#E5484D';

  return (
    <div className="grid grid-cols-2 gap-4 rounded-xl border border-borderSubtle bg-ink-2 p-4 sm:grid-cols-4">
      <div>
        <MicroLabel>Hit rate</MicroLabel>
        <div className="text-2xl font-bold tabular" style={{ color: hitColor }}>
          {stats.hit_rate === null ? '–' : `${stats.hit_rate.toFixed(0)}%`}
        </div>
        <div className="text-caption text-textMuted">
          {stats.hits}/{stats.directional} directional calls
        </div>
      </div>
      <div>
        <MicroLabel>Avg alpha</MicroLabel>
        <div className="text-2xl font-bold tabular" style={{ color: alphaColor }}>
          {pct(stats.avg_signed_alpha_pct)}
        </div>
        <div className="text-caption text-textMuted">vs S&amp;P 500, per call</div>
      </div>
      <div>
        <MicroLabel>Stood aside</MicroLabel>
        <div className="text-2xl font-bold tabular text-textPrimary">{stats.stand_aside}</div>
        <div className="text-caption text-textMuted">
          {stats.dodged} dodged · {stats.missed_moves} missed
        </div>
      </div>
      <div>
        <MicroLabel>Decisions</MicroLabel>
        <div className="text-2xl font-bold tabular text-textPrimary">{stats.total}</div>
        <div className="text-caption text-textMuted">{stats.graded} scored so far</div>
      </div>
    </div>
  );
}

function Row({ entry, onDelete }: { entry: JournalEntry; onDelete: (id: string) => void }) {
  const outcome = entry.outcome;
  const gColor = gradeColor(outcome?.grade);
  const aColor = actionColor(entry.action);

  return (
    <div className="flex flex-col gap-2 border-t border-borderSubtle py-3 first:border-t-0 sm:flex-row sm:items-start sm:gap-4">
      <div className="flex min-w-0 shrink-0 items-center gap-2 sm:w-44">
        <span className="ticker text-[13px] font-semibold text-textPrimary">{entry.symbol}</span>
        <Chip label={entry.decision === 'REJECT' ? `REJECT ${entry.action}` : entry.action} color={aColor} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-caption text-textMuted">
          <span>{entry.date}</span>
          <span>{relativeDay(outcome?.days_held)}</span>
          <span>conviction <span className="tabular text-textSecondary">{entry.conviction_10}/10</span></span>
          {entry.size_pct > 0 && (
            <span>size <span className="tabular text-textSecondary">{rawPct(entry.size_pct, 2)}</span></span>
          )}
          <span>{entry.rounds} {entry.rounds === 1 ? 'round' : 'rounds'} · {entry.debate_winner.toLowerCase()} won</span>
        </div>
        {entry.thesis && (
          <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-textSecondary">{entry.thesis}</p>
        )}
      </div>

      <div className="flex shrink-0 items-start gap-3 sm:w-52 sm:justify-end">
        {outcome ? (
          <div className="text-right">
            <div className="flex items-center justify-end gap-1.5">
              {outcome.signed_alpha_pct >= 0
                ? <TrendingUp size={12} style={{ color: gColor }} />
                : <TrendingDown size={12} style={{ color: gColor }} />}
              <span className="text-sm font-bold tabular" style={{ color: gColor }}>
                {pct(outcome.alpha_pct)}
              </span>
              <span className="text-caption text-textMuted">alpha</span>
            </div>
            <div className="mt-0.5 text-caption tabular text-textMuted">
              {pct(outcome.return_pct)} vs SPX {pct(outcome.benchmark_return_pct)}
            </div>
            <div className="mt-1 flex justify-end">
              <Chip label={outcome.grade} color={gColor} title={GRADE_LABELS[outcome.grade]} />
            </div>
          </div>
        ) : (
          <span className="text-caption text-textMuted">too fresh to score</span>
        )}
        <button
          onClick={() => onDelete(entry.id)}
          aria-label={`Forget the ${entry.date} decision on ${entry.symbol}`}
          title="Forget this decision so it stops informing future runs"
          className="mt-0.5 rounded p-1 text-textMuted transition-colors hover:text-accentRed"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}

/**
 * The desk's own track record, scored on alpha vs the S&P rather than raw
 * return. This is the reflection loop made visible: everything listed here is
 * fed back into the debate and the portfolio manager on the next run for the
 * same ticker, which is why deleting a row is offered — a decision you no
 * longer stand behind should stop teaching the desk.
 */
export default function DecisionJournal({
  symbol, refreshKey,
}: { symbol?: string; refreshKey?: number }) {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [stats, setStats] = useState<JournalStats | null>(null);
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
      setStats(data.stats);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'The decision journal is unavailable.');
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
    // Optimistic: the row is gone from the user's view either way, and a failed
    // delete surfaces on the next load rather than blocking the interaction.
    setEntries((prev) => prev.filter((e) => e.id !== id));
    try {
      await deleteJournalEntry(id);
      load();
      // Deletes are soft on the server, so offer the way back right here.
      toast.show({
        message: 'Decision removed from the journal',
        action: { label: 'Undo', onClick: () => { void restoreJournalEntry(id).then(load); } },
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not delete that decision.');
    }
  };

  return (
    <div className="glass-panel p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-borderSubtle pb-3">
        <h4 className="flex items-center gap-2 text-sm font-semibold text-textPrimary">
          <History size={15} className="text-accentBlue" /> Decision Journal
          <span className="rounded bg-ink-2 px-1.5 py-0.5 text-caption text-textMuted">
            scored on alpha · feeds the next run
          </span>
        </h4>
        <div className="flex items-center gap-2">
          {symbol && (
            <div className="flex overflow-hidden rounded-lg border border-borderSubtle">
              {(['symbol', 'all'] as const).map((option) => (
                <button
                  key={option}
                  onClick={() => setScope(option)}
                  className={clsx(
                    'px-2.5 py-1 text-caption transition-colors',
                    scope === option
                      ? 'bg-line text-textPrimary'
                      : 'text-textMuted hover:text-textSecondary',
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
            aria-label="Rescore the journal"
            className="rounded-lg border border-borderSubtle px-2 py-1.5 text-textMuted transition-colors hover:text-textPrimary disabled:opacity-50"
          >
            <RefreshCw size={13} />
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-[12px] text-textSecondary">
          <WifiOff size={14} className="shrink-0 text-accentAmber" /> {error}
        </div>
      )}

      {!error && stats && <Scorecard stats={stats} />}

      {!error && entries.length === 0 && !loading && (
        <p className="mt-4 flex items-center gap-2 text-[12px] text-textMuted">
          <Target size={13} />
          No decisions recorded yet. Every desk run is journalled here and scored against
          the S&amp;P once the market has had a day to respond.
        </p>
      )}

      {entries.length > 0 && (
        <div className="mt-4">
          {entries.map((entry) => (
            <Row key={entry.id} entry={entry} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
