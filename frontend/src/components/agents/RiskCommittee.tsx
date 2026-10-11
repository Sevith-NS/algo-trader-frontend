'use client';

import { Flame, Scale, ShieldCheck, Lock, Hourglass, SlidersHorizontal } from '@/components/ui/icons';
import type { RiskEvent } from '../../types/agents';
import { rawPct, riskStanceColor, SEAT_LABELS } from './deskFormat';
import { Chip, MicroLabel, SeatError } from './DeskAtoms';

const SEAT_ORDER: RiskEvent['seat'][] = ['aggressive', 'neutral', 'conservative'];

const ICONS: Record<string, React.ReactNode> = {
  aggressive: <Flame size={13} />,
  neutral: <Scale size={13} />,
  conservative: <ShieldCheck size={13} />,
};

const TEMPERAMENTS: Record<string, string> = {
  aggressive: 'opportunity cost is a real loss',
  neutral: 'half-Kelly is the anchor',
  conservative: 'survival is the whole game',
};

function Seat({ seat, maxSize }: { seat: RiskEvent; maxSize: number }) {
  const color = riskStanceColor(seat.stance);
  const width = maxSize > 0 ? Math.min(100, (seat.size_pct / maxSize) * 100) : 0;
  return (
    <div className="flex flex-col rounded-xl border border-borderSubtle bg-ink-2 p-3.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-[12px] font-semibold text-textPrimary">
            <span style={{ color }}>{ICONS[seat.seat]}</span>
            {SEAT_LABELS[seat.seat]}
          </div>
          <MicroLabel className="mt-0.5">{TEMPERAMENTS[seat.seat]}</MicroLabel>
        </div>
        <Chip label={seat.stance} color={color} />
      </div>

      <div className="mt-3">
        <div className="flex items-baseline justify-between">
          <MicroLabel>Recommends</MicroLabel>
          <span className="text-lg font-bold tabular" style={{ color }}>{rawPct(seat.size_pct, 2)}</span>
        </div>
        <div className="mt-1 h-1.5 w-full overflow-hidden bg-ink-2">
          <div className="h-full" style={{ width: `${width}%`, background: color }} />
        </div>
        <div className="mt-1 text-caption text-textMuted">of total equity</div>
      </div>

      {seat.error ? (
        <div className="mt-3"><SeatError message={seat.error} /></div>
      ) : (
        <>
          {seat.argument && (
            <p className="mt-3 text-[12px] leading-relaxed text-textSecondary">{seat.argument}</p>
          )}
          {seat.hard_constraint && (
            <div className="mt-3 flex gap-1.5 border-t border-borderSubtle pt-2">
              <Lock size={11} className="mt-0.5 shrink-0 text-textMuted" />
              <div className="min-w-0">
                <MicroLabel>Will not cross</MicroLabel>
                <p className="mt-0.5 text-caption leading-relaxed text-textMuted">{seat.hard_constraint}</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/**
 * Three seats with fixed temperaments arguing one number: percent of total
 * equity. They are not asked to agree — the spread between them is what the
 * portfolio manager is actually adjudicating, so the half-Kelly anchor is drawn
 * alongside as the reference the neutral seat is defending.
 */
export default function RiskCommittee({
  seats, halfKellyPct, pending,
}: { seats: RiskEvent[]; halfKellyPct: number | null; pending: boolean }) {
  if (seats.length === 0 && !pending) return null;

  const ordered = [...seats].sort(
    (a, b) => SEAT_ORDER.indexOf(a.seat) - SEAT_ORDER.indexOf(b.seat),
  );
  const sizes = ordered.filter((s) => !s.error).map((s) => s.size_pct);
  const maxSize = Math.max(...sizes, halfKellyPct ?? 0, 0.01);
  const spread = sizes.length > 1 ? Math.max(...sizes) - Math.min(...sizes) : null;

  return (
    <div className="glass-panel p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-borderSubtle pb-3">
        <h4 className="flex items-center gap-2 text-sm font-semibold text-textPrimary">
          <SlidersHorizontal size={15} className="text-fg-3" /> Risk Committee
          <span className="rounded bg-ink-2 px-1.5 py-0.5 text-caption text-textMuted">
            three temperaments · one number
          </span>
        </h4>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-caption text-textMuted">
          {halfKellyPct !== null && (
            <span>
              Half-Kelly anchor{' '}
              <span className="font-semibold tabular text-textSecondary">{rawPct(halfKellyPct, 2)}</span>
            </span>
          )}
          {spread !== null && (
            <span>
              Spread <span className="font-semibold tabular text-textSecondary">{rawPct(spread, 2)}</span>
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {ordered.map((seat) => <Seat key={seat.seat} seat={seat} maxSize={maxSize} />)}
        {pending && SEAT_ORDER.filter((s) => !seats.some((x) => x.seat === s)).map((s) => (
          <div
            key={s}
            className="flex min-h-[140px] items-center justify-center rounded-xl border border-dashed border-borderSubtle bg-ink-2 p-3.5"
          >
            <span className="flex items-center gap-2 text-caption text-textMuted">
              <Hourglass size={12} className="" /> {SEAT_LABELS[s].toLowerCase()} seat arguing…
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
