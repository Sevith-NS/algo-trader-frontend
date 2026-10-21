'use client';

import { Ruler } from '@/components/ui/icons';
import type { RulesEvent } from '../../types/agents';
import { formatMoney, formatNumber } from '../../lib/format';
import { rawPct } from './deskFormat';
import { DeskStat } from './DeskAtoms';

/**
 * What the user's own risk-per-trade setting implies for the computed plan:
 * equity × risk% ÷ per-share risk, capped by cash on a long. Pure arithmetic
 * from the backend, no model; the user decides whether to place anything.
 */
export default function RulesPanel({ rules, currency }: { rules: RulesEvent; currency: string }) {
  const sized = rules.shares !== null;
  return (
    <div className="glass rounded-xl p-5">
      <div className="mb-4 flex flex-wrap items-center gap-2 border-b border-line pb-3">
        <h4 className="flex items-center gap-2 text-sm font-semibold text-fg">
          <Ruler size={15} className="text-fg-2" /> Your rules
        </h4>
        <span className="rounded bg-white/[0.06] px-1.5 py-0.5 text-caption text-fg-3">
          arithmetic on your risk setting · no AI
        </span>
      </div>

      <div className="grid grid-cols-1 gap-x-8 md:grid-cols-2">
        <div>
          <DeskStat label="Risk per trade (Settings)" value={rules.risk_pct !== null ? rawPct(rules.risk_pct, 2) : 'not set'} />
          <DeskStat label="Paper book equity" value={rules.equity !== null ? formatMoney(rules.equity, currency, 0) : '–'} />
          <DeskStat label="Plan side" value={rules.side === 'short' ? 'Short' : rules.side === 'long' ? 'Long' : '–'} />
          <DeskStat label="Entry / stop" value={rules.entry !== null && rules.stop !== null
            ? `${formatMoney(rules.entry, currency)} / ${formatMoney(rules.stop, currency)}` : '–'} />
        </div>
        <div>
          <DeskStat label="Shares at your risk" value={sized ? formatNumber(rules.shares, 0) : '–'} />
          <DeskStat label="At risk if stopped" valueClass={sized ? 'text-down' : undefined}
                    value={rules.risk_amount !== null ? `−${formatMoney(rules.risk_amount, currency)}` : '–'} />
          <DeskStat label="Position value" value={rules.position_value !== null ? formatMoney(rules.position_value, currency) : '–'} />
          <DeskStat label="Share of book after" value={rawPct(rules.pct_of_equity_after)} />
        </div>
      </div>

      {rules.existing_position && (
        <p className="mt-3 text-caption text-warn">
          You already hold {formatNumber(rules.existing_position.shares, 0)} shares
          ({rawPct(rules.existing_position.pct_of_equity)} of the book); the share above includes them.
        </p>
      )}
      {rules.capped_by_cash && <p className="mt-2 text-caption text-warn">Cash limits this below your risk budget.</p>}
      {rules.notes.map((n) => <p key={n} className="mt-2 text-caption text-fg-2">{n}</p>)}

      <p className="mt-3 border-t border-line pt-2 text-caption text-fg-3">
        These numbers follow from your settings and the plan formula. Placing a paper order is up to you,
        from the symbol&apos;s Overview.
      </p>
    </div>
  );
}
