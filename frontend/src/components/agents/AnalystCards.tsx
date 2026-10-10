'use client';

import { Landmark, CandlestickChart, Newspaper, Waves, Users2, Hourglass } from 'lucide-react';
import clsx from 'clsx';
import type { AnalystEvent } from '../../types/agents';
import { ANALYST_ORDER, scoreColor } from './deskFormat';
import { MicroLabel, ScoreBar, SeatError } from './DeskAtoms';

const ICONS: Record<string, React.ReactNode> = {
  fundamentals: <Landmark size={13} />,
  technical: <CandlestickChart size={13} />,
  news: <Newspaper size={13} />,
  sentiment: <Waves size={13} />,
};

const REMITS: Record<string, string> = {
  fundamentals: 'statements · valuation vs own history',
  technical: 'phase · levels · factor votes',
  news: 'headline flow · outlet spread',
  sentiment: 'flow · positioning · crowd',
};

function AnalystCard({ card }: { card: AnalystEvent }) {
  const color = scoreColor(card.score);
  return (
    <div className="flex flex-col rounded-xl border border-borderSubtle bg-white/[0.02] p-3.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-[12px] font-semibold text-textPrimary">
            <span style={{ color }}>{ICONS[card.role]}</span>
            {card.label}
          </div>
          <MicroLabel className="mt-0.5">{REMITS[card.role]}</MicroLabel>
        </div>
        <span className="shrink-0 text-base font-bold tabular" style={{ color }}>
          {card.score >= 0 ? '+' : ''}{card.score.toFixed(2)}
        </span>
      </div>

      <div className="mt-2.5">
        <ScoreBar score={card.score} />
        <div className="mt-1 flex justify-between text-[10px] text-textMuted">
          <span>bearish</span>
          <span className="tabular">confidence {(card.confidence * 100).toFixed(0)}%</span>
          <span>bullish</span>
        </div>
      </div>

      {card.error ? (
        <div className="mt-3">
          <SeatError message={card.error} />
        </div>
      ) : (
        <>
          {card.report && (
            <p className="mt-3 text-[12px] leading-relaxed text-textSecondary">{card.report}</p>
          )}
          {card.key_points.length > 0 && (
            <ul className="mt-3 space-y-1.5">
              {card.key_points.map((point, i) => (
                <li key={i} className="flex gap-1.5 text-[11px] leading-relaxed text-textSecondary">
                  <span className="mt-[3px] h-1 w-1 shrink-0 rounded-full" style={{ background: color }} />
                  {point}
                </li>
              ))}
            </ul>
          )}
          {card.flags.length > 0 && (
            <div className="mt-3 border-t border-borderSubtle pt-2">
              <MicroLabel>Would change my mind</MicroLabel>
              <ul className="mt-1 space-y-1">
                {card.flags.map((flag, i) => (
                  <li key={i} className="text-[11px] leading-relaxed text-textMuted">— {flag}</li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/**
 * The four specialist report cards. Each analyst sees only its own slice of the
 * data, so a disagreement between cards is real signal rather than noise — the
 * debate downstream is built on exactly that spread.
 */
export default function AnalystCards({
  cards, pending,
}: { cards: AnalystEvent[]; pending: boolean }) {
  if (cards.length === 0 && !pending) return null;

  const ordered = [...cards].sort(
    (a, b) => ANALYST_ORDER.indexOf(a.role) - ANALYST_ORDER.indexOf(b.role),
  );
  const filed = ordered.filter((c) => !c.error);
  const spread = filed.length > 1
    ? Math.max(...filed.map((c) => c.score)) - Math.min(...filed.map((c) => c.score))
    : null;

  return (
    <div className="glass-panel p-5" style={{ borderTop: '2px solid #22D3EE' }}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-borderSubtle pb-3">
        <h4 className="flex items-center gap-2 text-sm font-semibold text-textPrimary">
          <Users2 size={15} className="text-accentCyan" /> Analyst Team
          <span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] font-mono uppercase tracking-wide text-textMuted">
            four specialists · one slice each
          </span>
        </h4>
        {spread !== null && (
          <span className="text-[11px] text-textMuted">
            Spread{' '}
            <span className={clsx('font-semibold tabular', spread > 0.8 ? 'text-accentAmber' : 'text-textSecondary')}>
              {spread.toFixed(2)}
            </span>
            {spread > 0.8 ? ' — the desk is genuinely divided' : ' — broadly aligned'}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        {ordered.map((card) => <AnalystCard key={card.role} card={card} />)}
        {pending && ANALYST_ORDER.filter((r) => !cards.some((c) => c.role === r)).map((role) => (
          <div
            key={role}
            className="flex min-h-[140px] items-center justify-center rounded-xl border border-dashed border-borderSubtle bg-white/[0.01] p-3.5"
          >
            <span className="flex items-center gap-2 text-[11px] text-textMuted">
              <Hourglass size={12} className="animate-pulse-soft" /> reading {role}…
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
