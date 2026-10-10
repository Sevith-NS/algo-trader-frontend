'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import {
  Building2, Play, Square, WifiOff, Brain, CircleDot, Check, Timer, BookOpen, Shuffle,
} from '@/components/ui/icons';
import type {
  AnalystEvent, ContextEvent, DebateEvent, DeskEvent, DeskStage, JudgeEvent,
  RiskEvent, TradePlanEvent, VerdictEvent,
} from '../../types/agents';
import { streamDesk, DeskRateLimited } from '../../lib/agentsDesk';
import { usePortfolio } from '../../context/PortfolioContext';
import { errorMessage } from '../../lib/api';
import AnalystCards from './AnalystCards';
import DebateTranscript from './DebateTranscript';
import ThesisPanel from './ThesisPanel';
import TradePlanPanel from './TradePlanPanel';
import RiskCommittee from './RiskCommittee';
import DeskVerdict from './DeskVerdict';
import DecisionJournal from './DecisionJournal';
import { MicroLabel } from './DeskAtoms';
import { STAGE_LABELS, STAGE_ORDER } from './deskFormat';

const ROUND_OPTIONS = [1, 2, 3, 4];

interface DeskState {
  context: ContextEvent | null;
  analysts: AnalystEvent[];
  debate: DebateEvent[];
  judge: JudgeEvent | null;
  plan: TradePlanEvent | null;
  risk: RiskEvent[];
  verdict: VerdictEvent | null;
  stage: DeskStage | null;
  message: string;
  elapsedMs: number | null;
  /** Set when the run left Gemini mid-flight because its quota was exhausted. */
  failover: string | null;
  fallbackCalls: number;
}

const EMPTY: DeskState = {
  context: null, analysts: [], debate: [], judge: null, plan: null,
  risk: [], verdict: null, stage: null, message: '', elapsedMs: null,
  failover: null, fallbackCalls: 0,
};

/** The stage rail: which seats have reported, which one is speaking now. */
function StageRail({ stage, message, running }: {
  stage: DeskStage | null; message: string; running: boolean;
}) {
  const currentIndex = stage ? STAGE_ORDER.indexOf(stage) : -1;
  return (
    <div className="rounded-xl border border-borderSubtle bg-white/[0.02] p-4">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-2">
        {STAGE_ORDER.map((key, i) => {
          const done = i < currentIndex || (!running && currentIndex === STAGE_ORDER.length - 1 && i <= currentIndex);
          const active = running && i === currentIndex;
          return (
            <div key={key} className="flex items-center gap-2">
              <span
                className={clsx(
                  'flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-1 text-[10px] font-mono uppercase tracking-wide transition-colors',
                  active ? 'bg-accentPurple/15 text-accentPurple'
                    : done ? 'text-accentGreen'
                    : 'text-textMuted',
                )}
              >
                {done ? <Check size={10} />
                  : active ? <CircleDot size={10} className="animate-pulse-soft" />
                  : <CircleDot size={10} className="opacity-40" />}
                {STAGE_LABELS[key]}
              </span>
              {i < STAGE_ORDER.length - 1 && <span className="text-textMuted/40">·</span>}
            </div>
          );
        })}
      </div>
      {message && (
        <p className="mt-2.5 border-t border-borderSubtle pt-2.5 text-[12px] text-textSecondary">
          {message}
        </p>
      )}
    </div>
  );
}

/**
 * The multi-agent trading desk: four analysts, a bull/bear debate, a trader, a
 * three-seat risk committee and a portfolio manager who signs off — streamed
 * turn by turn so the reasoning is watchable rather than a wall of text at the
 * end.
 *
 * Every figure the agents argue over comes from the same engines the Terminal
 * already renders, and the desk's own past calls (scored on alpha) are fed back
 * into each new run. See backend/agents_desk.py.
 */
export default function TradingDeskSection({
  symbol, currency,
}: { symbol: string; currency: string }) {
  const [state, setState] = useState<DeskState>(EMPTY);
  const [rounds, setRounds] = useState(2);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');
  const [journalKey, setJournalKey] = useState(0);
  const [showJournal, setShowJournal] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const { balance, positions, placeOrder } = usePortfolio();

  // A run is tied to the symbol it was opened on — switching tickers has to
  // abort it, or a later event would land in the wrong stock's transcript.
  useEffect(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setState(EMPTY);
    setError('');
    setRunning(false);
  }, [symbol]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const apply = useCallback((event: DeskEvent) => {
    setState((prev) => {
      switch (event.type) {
        case 'status':
          return { ...prev, stage: event.stage, message: event.message };
        case 'context':
          return { ...prev, context: event };
        case 'analyst':
          return { ...prev, analysts: [...prev.analysts.filter((a) => a.role !== event.role), event] };
        case 'debate':
          return { ...prev, debate: [...prev.debate, event] };
        case 'judge':
          return { ...prev, judge: event };
        case 'trade_plan':
          return { ...prev, plan: event };
        case 'risk':
          return { ...prev, risk: [...prev.risk.filter((r) => r.seat !== event.seat), event] };
        case 'verdict':
          return { ...prev, verdict: event };
        case 'notice':
          return { ...prev, failover: event.message };
        case 'done':
          return {
            ...prev,
            elapsedMs: event.elapsed_ms,
            message: '',
            fallbackCalls: event.routing?.fallback_calls ?? prev.fallbackCalls,
          };
        default:
          return prev;
      }
    });

    if (event.type === 'error') setError(event.message);
    // The run journals itself server-side; nudge the journal panel to re-read.
    if (event.type === 'journal') setJournalKey((k) => k + 1);
  }, []);

  const run = async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setState({ ...EMPTY, stage: 'gather' });
    setError('');
    setRunning(true);
    try {
      await streamDesk({ symbol, rounds, portfolio: { balance, positions } }, apply, controller.signal);
    } catch (e) {
      if ((e as Error)?.name === 'AbortError') return; // user stopped it, or the symbol changed
      setError(
        e instanceof DeskRateLimited || e instanceof Error
          ? e.message
          : 'The trading desk could not be reached.',
      );
    } finally {
      if (!controller.signal.aborted) setRunning(false);
    }
  };

  const stop = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setRunning(false);
  };

  const { context, analysts, debate, judge, plan, risk, verdict } = state;
  const started = Boolean(context) || running;
  const priorCalls = context?.memory.same_ticker.length ?? 0;
  // Available from the context event, so the committee's anchor line is drawn
  // while the seats are still arguing rather than only once the PM reports.
  const halfKellyPct = context?.quant
    ? context.quant.position_sizing.recommended_fraction * 100
    : verdict?.half_kelly_pct ?? null;

  return (
    <div className="space-y-5">
      {/* ---- Header and controls ---- */}
      <div className="glass-panel p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="flex flex-wrap items-center gap-2 text-sm font-semibold text-textPrimary">
              <Building2 size={15} className="text-accentPurple" /> Trading Desk
              <span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] font-mono uppercase tracking-wide text-textMuted">
                analysts · debate · risk · sign-off
              </span>
            </h3>
            <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-textSecondary">
              Four specialist analysts read {symbol} separately, a bull and a bear argue it out
              over {rounds} {rounds === 1 ? 'round' : 'rounds'}, a trader turns the thesis into
              the quant engine&apos;s solved levels, three risk seats fight over position size,
              and a portfolio manager signs off or refuses. Every figure comes from this
              platform&apos;s own engines.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div>
              <MicroLabel className="mb-1">Debate rounds</MicroLabel>
              <div className="flex overflow-hidden rounded-lg border border-borderSubtle">
                {ROUND_OPTIONS.map((option) => (
                  <button
                    key={option}
                    onClick={() => setRounds(option)}
                    disabled={running}
                    className={clsx(
                      'min-h-8 px-2.5 font-mono text-[11px] font-semibold tabular transition-colors disabled:opacity-50',
                      rounds === option
                        ? 'bg-accentPurple/15 text-accentPurple'
                        : 'text-textMuted hover:text-textSecondary',
                    )}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            {running ? (
              <button
                onClick={stop}
                className="flex min-h-11 items-center gap-2 rounded-lg border border-borderStrong px-4 text-xs font-semibold text-textSecondary transition-colors hover:text-textPrimary"
              >
                <Square size={13} /> Stop
              </button>
            ) : (
              <button
                onClick={run}
                className="flex min-h-11 items-center gap-2 rounded-lg border border-accentPurple/30 bg-accentPurple/5 px-4 text-xs font-semibold text-accentPurple transition-colors hover:bg-accentPurple/10"
              >
                <Play size={13} /> {started ? 'Run again' : `Convene the desk on ${symbol}`}
              </button>
            )}
          </div>
        </div>

        {/* ---- Live context strip ---- */}
        {context && (
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-borderSubtle pt-3 text-[11px] text-textMuted">
            <span>
              <span className="ticker text-textSecondary">{context.symbol}</span>
              {context.company !== context.symbol && ` · ${context.company}`}
            </span>
            <span>
              engine call{' '}
              <span className="font-semibold text-textSecondary">{context.verdict.long_term.call}</span>
            </span>
            {context.quant && (
              <span>
                quant <span className="font-semibold text-textSecondary">{context.quant.signal}</span>
              </span>
            )}
            <span>
              book{' '}
              <span className="tabular text-textSecondary">
                {context.portfolio.has_book
                  ? `$${context.portfolio.total_equity.toLocaleString()}`
                  : 'not connected'}
              </span>
            </span>
            {context.portfolio.existing_position && (
              <span className="text-accentAmber">
                already holding {context.portfolio.existing_position.shares} shares
              </span>
            )}
            <span className={clsx('flex items-center gap-1', priorCalls > 0 && 'text-accentBlue')}>
              <Brain size={11} />
              {priorCalls > 0
                ? `${priorCalls} prior call${priorCalls === 1 ? '' : 's'} on ${symbol} in memory`
                : 'no prior calls on this name'}
            </span>
            {state.elapsedMs !== null && (
              <span className="flex items-center gap-1">
                <Timer size={11} /> {(state.elapsedMs / 1000).toFixed(1)}s
              </span>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="glass-panel flex items-start gap-3 p-5">
          <WifiOff size={16} className="mt-0.5 shrink-0 text-accentAmber" />
          <p className="text-sm leading-relaxed text-textSecondary">{error}</p>
        </div>
      )}

      {/* The desk changed provider mid-run. Not an error — the run continued —
          but the reader deserves to know which model answered which seat. */}
      {state.failover && (
        <div className="glass-panel flex items-start gap-3 p-4">
          <Shuffle size={15} className="mt-0.5 shrink-0 text-accentAmber" />
          <div className="min-w-0">
            <p className="text-[13px] leading-relaxed text-textSecondary">{state.failover}</p>
            {state.fallbackCalls > 0 && (
              <p className="mt-1 text-[11px] text-textMuted">
                <span className="tabular">{state.fallbackCalls}</span> of this run&apos;s seats were
                served by the fallback.
              </p>
            )}
          </div>
        </div>
      )}

      {running && <StageRail stage={state.stage} message={state.message} running={running} />}

      {/* ---- The run, in the order it happened ---- */}
      <AnalystCards cards={analysts} pending={running && analysts.length < 4} />

      <DebateTranscript
        turns={debate}
        rounds={context?.rounds ?? rounds}
        pending={running && Boolean(context) && analysts.length === 4 && !judge}
      />

      {judge && <ThesisPanel judge={judge} />}
      {plan && <TradePlanPanel plan={plan} currency={currency} />}

      <RiskCommittee
        seats={risk}
        halfKellyPct={halfKellyPct}
        pending={running && Boolean(plan) && risk.length < 3}
      />

      {verdict && (
        <DeskVerdict
          verdict={verdict}
          symbol={symbol}
          currency={currency}
          onExecute={async (shares) => {
            try {
              await placeOrder(symbol, verdict.action === 'SELL' ? 'sell' : 'buy', shares);
              return { success: true, message: 'Filled at the live price.' };
            } catch (err) {
              return { success: false, message: errorMessage(err) };
            }
          }}
        />
      )}

      {/* ---- Track record ---- */}
      {showJournal ? (
        <DecisionJournal symbol={symbol} refreshKey={journalKey} />
      ) : (
        <button
          onClick={() => setShowJournal(true)}
          className="glass-panel flex w-full items-center justify-center gap-2 p-4 text-xs font-semibold text-textSecondary transition-colors hover:text-textPrimary"
        >
          <BookOpen size={14} className="text-accentBlue" />
          Show the decision journal — every past call, scored on alpha vs the S&amp;P
        </button>
      )}
    </div>
  );
}
