'use client';

import { Gavel, ShieldAlert, Ban, Sparkle } from '@/components/ui/icons';
import type { JudgeEvent } from '../../types/agents';
import { callColor, winnerColor } from './deskFormat';
import { Chip, ConvictionMeter, MicroLabel, SeatError, TintPanel } from './DeskAtoms';

const WINNER_COPY: Record<string, string> = {
  BULL: 'Bull carried the debate',
  BEAR: 'Bear carried the debate',
  SPLIT: 'Genuinely split',
};

/**
 * The research manager's thesis — the point where a debate becomes a view.
 *
 * The "vs engine" chip is deliberate: the deterministic verdict from
 * deep_analysis is computed independently of any model, so agreement is
 * corroboration and disagreement is worth reading closely rather than hiding.
 */
export default function ThesisPanel({ judge }: { judge: JudgeEvent }) {
  const stanceColor = callColor(judge.stance);
  const wColor = winnerColor(judge.winner);

  return (
    <div className="glass-panel p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-borderSubtle pb-3">
        <h4 className="flex items-center gap-2 text-sm font-semibold text-textPrimary">
          <Gavel size={15} style={{ color: stanceColor }} /> Desk Thesis
          <span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] font-mono uppercase tracking-wide text-textMuted">
            research manager
          </span>
        </h4>
        <Chip label={WINNER_COPY[judge.winner]} color={wColor} />
      </div>

      {judge.error && <div className="mb-3"><SeatError message={judge.error} /></div>}

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <Chip label={judge.stance} color={stanceColor} size="lg" />
        <div>
          <MicroLabel>Conviction</MicroLabel>
          <div className="mt-1"><ConvictionMeter value={judge.conviction_10} color={stanceColor} /></div>
        </div>
        <div className="ml-auto">
          <MicroLabel>vs computed engine</MicroLabel>
          <div className="mt-0.5 flex items-center gap-1.5">
            <Chip label={judge.computed_call} color={callColor(judge.computed_call)} />
            <span className={judge.agrees_with_engine ? 'text-[11px] text-accentGreen' : 'text-[11px] text-accentAmber'}>
              {judge.agrees_with_engine ? 'agrees' : 'disagrees — read the thesis'}
            </span>
          </div>
        </div>
      </div>

      {judge.thesis && (
        <p className="mt-4 text-[13px] leading-relaxed text-textPrimary">{judge.thesis}</p>
      )}

      {judge.decisive_argument && (
        <TintPanel color="#A4ACA8" className="mt-4">
          <div className="flex gap-2">
            <Sparkle size={13} className="mt-0.5 shrink-0 text-accentPurple" />
            <div className="min-w-0">
              <MicroLabel>What settled it</MicroLabel>
              <p className="mt-1 text-[12px] leading-relaxed text-textSecondary">{judge.decisive_argument}</p>
            </div>
          </div>
        </TintPanel>
      )}

      {(judge.key_risk || judge.invalidation) && (
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          {judge.key_risk && (
            <div className="rounded-xl border border-accentAmber/25 bg-accentAmber/[0.06] p-3.5">
              <h5 className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold font-mono uppercase tracking-wider text-accentAmber">
                <ShieldAlert size={12} /> Key risk
              </h5>
              <p className="text-[12px] leading-relaxed text-textSecondary">{judge.key_risk}</p>
            </div>
          )}
          {judge.invalidation && (
            <div className="rounded-xl border border-accentRed/25 bg-down/[0.06] p-3.5">
              <h5 className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold font-mono uppercase tracking-wider text-accentRed">
                <Ban size={12} /> Thesis is wrong if
              </h5>
              <p className="text-[12px] leading-relaxed text-textSecondary">{judge.invalidation}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
