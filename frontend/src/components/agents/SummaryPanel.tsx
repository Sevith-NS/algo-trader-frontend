'use client';

import { BookOpen, TrendingUp, TrendingDown, Scale, Eye, Calculator } from '@/components/ui/icons';
import type { SummaryEvent } from '../../types/agents';
import { ACCENT } from './deskFormat';
import { MicroLabel, SeatError, TintPanel } from './DeskAtoms';

/**
 * The desk's balanced write-up: what the data shows, the strongest evidence
 * each way, where the two cases disagree, what to watch, and how the plan's
 * levels were computed. No winner, no stance, no rating.
 */
export default function SummaryPanel({ summary }: { summary: SummaryEvent }) {
  return (
    <div className="glass rounded-xl p-5">
      <div className="mb-4 flex flex-wrap items-center gap-2 border-b border-line pb-3">
        <h4 className="flex items-center gap-2 text-sm font-semibold text-fg">
          <BookOpen size={15} className="text-fg-2" /> Desk summary
        </h4>
        <span className="rounded bg-white/[0.06] px-1.5 py-0.5 text-caption text-fg-3">
          balanced · no call
        </span>
      </div>

      {summary.error ? <SeatError message={summary.error} /> : (
        <div className="space-y-4">
          {summary.summary && <p className="text-sm leading-relaxed text-fg">{summary.summary}</p>}

          {(summary.going_well || summary.could_go_wrong) && (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {summary.going_well && (
                <TintPanel color={ACCENT.green}>
                  <MicroLabel className="mb-1 flex items-center gap-1.5"><TrendingUp size={12} /> Going well</MicroLabel>
                  <p className="text-xs leading-relaxed text-fg-2">{summary.going_well}</p>
                </TintPanel>
              )}
              {summary.could_go_wrong && (
                <TintPanel color={ACCENT.red}>
                  <MicroLabel className="mb-1 flex items-center gap-1.5"><TrendingDown size={12} /> Could go wrong</MicroLabel>
                  <p className="text-xs leading-relaxed text-fg-2">{summary.could_go_wrong}</p>
                </TintPanel>
              )}
            </div>
          )}

          {summary.disagreement && (
            <div>
              <MicroLabel className="mb-1 flex items-center gap-1.5"><Scale size={12} /> Where the cases disagree</MicroLabel>
              <p className="text-xs leading-relaxed text-fg-2">{summary.disagreement}</p>
            </div>
          )}

          {summary.what_to_watch.length > 0 && (
            <div>
              <MicroLabel className="mb-1 flex items-center gap-1.5"><Eye size={12} /> What to watch</MicroLabel>
              <ul className="list-disc space-y-1 pl-5 text-xs leading-relaxed text-fg-2">
                {summary.what_to_watch.map((w) => <li key={w}>{w}</li>)}
              </ul>
            </div>
          )}

          {summary.plan_explained && (
            <div className="rounded-xl well p-4">
              <MicroLabel className="mb-1 flex items-center gap-1.5"><Calculator size={12} /> How the plan was computed</MicroLabel>
              <p className="text-xs leading-relaxed text-fg-2">{summary.plan_explained}</p>
            </div>
          )}

          <p className="border-t border-line pt-2 text-caption text-fg-3">
            The desk explains the data; it doesn&apos;t tell you what to do. Information only, not
            investment advice.
          </p>
        </div>
      )}
    </div>
  );
}
