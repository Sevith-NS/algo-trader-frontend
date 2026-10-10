'use client';

import clsx from 'clsx';
import { TrendingUp, TrendingDown, Swords, Quote, Crosshair, Handshake, Hourglass } from 'lucide-react';
import type { DebateEvent } from '../../types/agents';
import { sideColor } from './deskFormat';
import { MicroLabel, SeatError } from './DeskAtoms';

function Turn({ turn }: { turn: DebateEvent }) {
  const bull = turn.side === 'BULL';
  const color = sideColor(turn.side);
  return (
    <div className={clsx('flex w-full', bull ? 'justify-start' : 'justify-end')}>
      <div className={clsx('min-w-0 max-w-full lg:max-w-[85%]', bull ? 'lg:mr-auto' : 'lg:ml-auto')}>
        <div className={clsx('mb-1.5 flex items-center gap-1.5', !bull && 'lg:justify-end')}>
          <span style={{ color }}>{bull ? <TrendingUp size={13} /> : <TrendingDown size={13} />}</span>
          <span className="text-[11px] font-semibold" style={{ color }}>{turn.label}</span>
        </div>

        <div
          className="rounded-xl p-4"
          style={{ border: `1px solid ${color}33`, background: `${color}0d` }}
        >
          {turn.error ? (
            <SeatError message={turn.error} />
          ) : (
            <>
              <p className="text-[13px] leading-relaxed text-textPrimary">{turn.argument}</p>

              {turn.evidence && (
                <div className="mt-3 flex gap-2 border-t pt-2.5" style={{ borderColor: `${color}26` }}>
                  <Quote size={12} className="mt-0.5 shrink-0" style={{ color }} />
                  <div className="min-w-0">
                    <MicroLabel>Standing on</MicroLabel>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-textSecondary">{turn.evidence}</p>
                  </div>
                </div>
              )}

              {(turn.rebuts || turn.concedes) && (
                <div className="mt-2.5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {turn.rebuts && (
                    <div className="flex gap-2">
                      <Crosshair size={12} className="mt-0.5 shrink-0 text-accentAmber" />
                      <div className="min-w-0">
                        <MicroLabel>Attacking</MicroLabel>
                        <p className="mt-0.5 text-[11px] leading-relaxed text-textMuted">{turn.rebuts}</p>
                      </div>
                    </div>
                  )}
                  {turn.concedes && (
                    <div className="flex gap-2">
                      <Handshake size={12} className="mt-0.5 shrink-0 text-textMuted" />
                      <div className="min-w-0">
                        <MicroLabel>Concedes</MicroLabel>
                        <p className="mt-0.5 text-[11px] leading-relaxed text-textMuted">{turn.concedes}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * The bull/bear transcript, laid out as an argument rather than a document:
 * bull left, bear right, grouped by round. From round two each speaker is
 * required to attack a named claim, which is why "Attacking" is a first-class
 * field instead of buried in the prose.
 */
export default function DebateTranscript({
  turns, rounds, pending,
}: { turns: DebateEvent[]; rounds: number; pending: boolean }) {
  if (turns.length === 0 && !pending) return null;

  const byRound = new Map<number, DebateEvent[]>();
  for (const turn of turns) {
    const bucket = byRound.get(turn.round) ?? [];
    bucket.push(turn);
    byRound.set(turn.round, bucket);
  }

  return (
    <div className="glass-panel p-5" style={{ borderTop: '2px solid #A78BFA' }}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-borderSubtle pb-3">
        <h4 className="flex items-center gap-2 text-sm font-semibold text-textPrimary">
          <Swords size={15} className="text-accentPurple" /> Research Debate
          <span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] font-mono uppercase tracking-wide text-textMuted">
            {rounds} {rounds === 1 ? 'round' : 'rounds'} · rebuttal required
          </span>
        </h4>
        <div className="flex items-center gap-3 text-[11px] text-textMuted">
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-accentGreen" /> Bull</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-accentRed" /> Bear</span>
        </div>
      </div>

      <div className="space-y-5">
        {[...byRound.entries()].map(([round, roundTurns]) => (
          <div key={round} className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-mono uppercase tracking-wider text-textMuted">
                Round {round} of {rounds}
              </span>
              <div className="h-px flex-1 bg-borderSubtle" />
            </div>
            {roundTurns.map((turn) => <Turn key={`${turn.round}-${turn.side}`} turn={turn} />)}
          </div>
        ))}

        {pending && (
          <div className="flex items-center gap-2 text-[11px] text-textMuted">
            <Hourglass size={12} className="animate-pulse-soft" />
            the next speaker is composing their argument…
          </div>
        )}
      </div>
    </div>
  );
}
