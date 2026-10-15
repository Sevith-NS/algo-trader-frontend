'use client';

import { Briefcase, OctagonX } from '@/components/ui/icons';
import type { TradePlanEvent } from '../../types/agents';
import { fmtPrice } from '../intel/format';
import { actionColor } from './deskFormat';
import { Chip, ConvictionMeter, MicroLabel, SeatError } from './DeskAtoms';

function Level({ label, value, currency, color }: {
  label: string; value: number | undefined; currency: string; color?: string;
}) {
  return (
    <div>
      <MicroLabel>{label}</MicroLabel>
      <div className="mt-0.5 text-sm font-bold tabular" style={color ? { color } : undefined}>
        {value === undefined ? '–' : fmtPrice(value, currency)}
      </div>
    </div>
  );
}

/**
 * The trader's decision. The levels shown here are lifted verbatim from
 * quant_models' solved plan — the trader chooses whether the trade is worth
 * taking and for how long, never where the stop goes. That split is why the
 * numbers on this panel match the Terminal's Quant Trade Plan exactly.
 */
export default function TradePlanPanel({
  plan, currency,
}: { plan: TradePlanEvent; currency: string }) {
  const color = actionColor(plan.action);
  const levels = plan.levels;

  return (
    <div className="glass rounded-xl p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
        <h4 className="flex items-center gap-2 text-sm font-semibold text-fg">
          <Briefcase size={15} style={{ color }} /> Trade Plan
          <span className="rounded bg-white/[0.06] px-1.5 py-0.5 text-caption text-fg-3">
            levels from the quant engine, not the model
          </span>
        </h4>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <Chip label={plan.action} color={color} size="lg" />
          <ConvictionMeter value={plan.conviction_10} color={color} />
        </div>
      </div>

      {plan.error && <div className="mb-3"><SeatError message={plan.error} /></div>}

      {levels ? (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Level label="Entry" value={levels.entry} currency={currency} color="var(--fg-2)" />
            <Level label="Stop" value={levels.stop_loss} currency={currency} color="var(--red)" />
            <Level label="Target 1" value={levels.target_1} currency={currency} color="var(--green)" />
            <Level label="Target 2" value={levels.target_2} currency={currency} color="var(--green)" />
          </div>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 border-t border-line pt-3 text-caption text-fg-3">
            <span><span className="tabular text-fg-2">{levels.r_multiple_1.toFixed(2)}</span>R to target 1</span>
            <span><span className="tabular text-fg-2">{(levels.fill_probability * 100).toFixed(0)}%</span> fill in 5d</span>
            <span><span className="tabular text-fg-2">{(levels.win_probability * 100).toFixed(0)}%</span> hit before stop</span>
            <span>expectancy <span className="tabular text-fg-2">{levels.expectancy_r >= 0 ? '+' : ''}{levels.expectancy_r.toFixed(2)}</span>R</span>
            <span>risk <span className="tabular text-fg-2">{fmtPrice(levels.risk_per_share, currency)}</span> / share</span>
          </div>
        </>
      ) : (
        <p className="text-[12px] text-fg-3">
          No solved levels for this symbol, so the trader worked without an executable plan.
        </p>
      )}

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div>
          <MicroLabel>Horizon</MicroLabel>
          <div className="mt-0.5 text-sm font-semibold tabular text-fg">{plan.horizon_days}d</div>
        </div>
        <div className="col-span-2">
          <MicroLabel>Entry style</MicroLabel>
          <div className="mt-0.5 text-[13px] text-fg-2">{plan.entry_style}</div>
        </div>
      </div>

      {plan.rationale && (
        <p className="mt-4 text-[13px] leading-relaxed text-fg-2">{plan.rationale}</p>
      )}

      {plan.abort_if && (
        <div className="mt-3 flex gap-2 border-t border-line pt-3">
          <OctagonX size={13} className="mt-0.5 shrink-0 text-down" />
          <div className="min-w-0">
            <MicroLabel>Would not send the order if</MicroLabel>
            <p className="mt-0.5 text-[12px] leading-relaxed text-fg-2">{plan.abort_if}</p>
          </div>
        </div>
      )}
    </div>
  );
}
