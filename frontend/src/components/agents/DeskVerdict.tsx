'use client';

import { useState } from 'react';
import clsx from 'clsx';
import { Stamp, CheckCircle2, XCircle, CalendarClock, ListChecks, Wallet } from '@/components/ui/icons';
import type { VerdictEvent } from '../../types/agents';
import { fmtPrice } from '../intel/format';
import { actionColor, decisionColor, rawPct } from './deskFormat';
import { Chip, MicroLabel, SeatError } from './DeskAtoms';

export interface ExecuteResult { success: boolean; message: string }

/**
 * The portfolio manager's sign-off — the only agent that can approve, and the
 * hero of the whole run.
 *
 * The share count is not the model's: agents_desk derives it from the approved
 * percentage, the live price and the book's equity, then caps it at available
 * cash (buys) or shares held (sells). That is what makes the "execute" button
 * safe to offer — it places exactly the order shown.
 */
export default function DeskVerdict({
  verdict, symbol, currency, onExecute,
}: {
  verdict: VerdictEvent;
  symbol: string;
  currency: string;
  onExecute?: (shares: number) => Promise<ExecuteResult>;
}) {
  const [executed, setExecuted] = useState<ExecuteResult | null>(null);
  const [placing, setPlacing] = useState(false);
  const dColor = decisionColor(verdict.decision);
  const aColor = actionColor(verdict.action);
  const { sizing } = verdict;

  const executable =
    Boolean(onExecute) &&
    verdict.decision === 'APPROVE' &&
    verdict.action !== 'HOLD' &&
    sizing.shares > 0 &&
    Boolean(sizing.price);

  // The server prices and fills the order; a failure leaves the button live
  // so the person can try again.
  const handleExecute = async () => {
    if (!onExecute || placing) return;
    setPlacing(true);
    const result = await onExecute(sizing.shares);
    setPlacing(false);
    setExecuted(result);
  };
  const done = Boolean(executed?.success);

  return (
    <div className="glass-panel p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-borderSubtle pb-3">
        <h4 className="flex items-center gap-2 text-sm font-semibold text-textPrimary">
          <Stamp size={15} style={{ color: dColor }} /> Desk Verdict
          <span className="rounded bg-ink-2 px-1.5 py-0.5 text-caption text-textMuted">
            portfolio manager
          </span>
        </h4>
        <span className="flex items-center gap-1.5 text-caption text-textMuted">
          <CalendarClock size={12} /> review in {verdict.review_in_days}d
        </span>
      </div>

      {verdict.error && <div className="mb-3"><SeatError message={verdict.error} /></div>}

      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <div className="flex items-center gap-2">
          {verdict.decision === 'APPROVE'
            ? <CheckCircle2 size={22} style={{ color: dColor }} />
            : <XCircle size={22} style={{ color: dColor }} />}
          <span className="text-2xl font-bold tracking-tight" style={{ color: dColor }}>
            {verdict.decision}
          </span>
        </div>
        <Chip label={`${verdict.action} ${symbol}`} color={aColor} size="lg" />
      </div>

      {/* The numbers are the hero: size, shares, notional, and what they were
          measured against. */}
      <div className="mt-4 grid grid-cols-2 gap-4 border-y border-borderSubtle py-3 sm:grid-cols-4">
        <div>
          <MicroLabel>Size</MicroLabel>
          <div className="text-xl font-bold tabular" style={{ color: verdict.size_pct > 0 ? aColor : undefined }}>
            {rawPct(verdict.size_pct, 2)}
          </div>
          <div className="text-caption text-textMuted">of total equity</div>
        </div>
        <div>
          <MicroLabel>Shares</MicroLabel>
          <div className="text-xl font-bold tabular text-textPrimary">{sizing.shares.toLocaleString()}</div>
          <div className="text-caption text-textMuted">
            at {sizing.price ? fmtPrice(sizing.price, currency) : '–'}
          </div>
        </div>
        <div>
          <MicroLabel>Notional</MicroLabel>
          <div className="text-xl font-bold tabular text-textPrimary">{fmtPrice(sizing.notional, currency)}</div>
          <div className="text-caption text-textMuted">{rawPct(sizing.pct_of_equity, 2)} of book</div>
        </div>
        <div>
          <MicroLabel>Measured against</MicroLabel>
          <div className="mt-0.5 space-y-0.5 text-caption text-textSecondary">
            <div>half-Kelly <span className="tabular">{rawPct(verdict.half_kelly_pct, 2)}</span></div>
            <div>committee avg <span className="tabular">{rawPct(verdict.committee_average_pct, 2)}</span></div>
          </div>
        </div>
      </div>

      {sizing.note && (
        <p className="mt-2 text-caption text-accentAmber">{sizing.note}</p>
      )}

      {verdict.rationale && (
        <p className="mt-4 text-[13px] leading-relaxed text-textPrimary">{verdict.rationale}</p>
      )}

      {verdict.conditions.length > 0 && (
        <div className="mt-4">
          <h5 className="mb-1.5 flex items-center gap-1.5 text-caption font-semibold text-textMuted">
            <ListChecks size={12} /> Approved on these conditions
          </h5>
          <ul className="space-y-1">
            {verdict.conditions.map((condition, i) => (
              <li key={i} className="flex gap-2 text-[12px] leading-relaxed text-textSecondary">
                <span className="tabular text-textMuted">{i + 1}.</span>
                {condition}
              </li>
            ))}
          </ul>
        </div>
      )}

      {executable && (
        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-borderSubtle pt-3">
          <button
            onClick={handleExecute}
            disabled={done || placing}
            aria-busy={placing || undefined}
            className={clsx(
              'flex items-center gap-2 rounded-lg border px-4 py-2 text-xs font-semibold transition-colors disabled:opacity-50',
              verdict.action === 'BUY'
                ? 'border-accentGreen/30 bg-accentGreen/5 text-accentGreen hover:bg-accentGreen/10'
                : 'border-accentRed/30 bg-accentRed/5 text-accentRed hover:bg-accentRed/10',
            )}
          >
            <Wallet size={13} />
            {done
              ? 'Placed in your paper portfolio'
              : placing
              ? 'Placing order'
              : `${verdict.action} ${sizing.shares.toLocaleString()} ${symbol} on paper`}
          </button>
          {executed && (
            <span className={clsx('text-caption', executed.success ? 'text-accentGreen' : 'text-accentRed')}>
              {executed.message}
            </span>
          )}
          {!done && !executed && (
            <span className="text-caption text-textMuted">
              Places this order at the live price in your paper portfolio.
            </span>
          )}
        </div>
      )}

      <p className="mt-4 border-t border-borderSubtle pt-2 text-caption leading-relaxed text-textMuted">
        Agents argue over figures computed by this platform&apos;s own engines, but their
        reasoning is generated and can be wrong in ways the numbers are not. Educational
        analysis on a paper-trading platform, not investment advice.
      </p>
    </div>
  );
}
