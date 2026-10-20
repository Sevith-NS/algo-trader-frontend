'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import {
  Building2, Play, Square, WifiOff, CircleDot, Check, Timer, BookOpen, Shuffle,
} from '@/components/ui/icons';
import type {
  AnalystEvent, ContextEvent, DebateEvent, DeskEvent, DeskStage, RulesEvent, SummaryEvent,
} from '../../types/agents';
import { streamDesk, DeskRateLimited } from '../../lib/agentsDesk';
import { usePortfolio } from '../../context/PortfolioContext';
import { formatMoney } from '../../lib/format';
import AnalystCards from './AnalystCards';
import DebateTranscript from './DebateTranscript';
import SummaryPanel from './SummaryPanel';
import RulesPanel from './RulesPanel';
import DeskNotes from './DeskNotes';
import { MicroLabel } from './DeskAtoms';
import { STAGE_LABELS, STAGE_ORDER } from './deskFormat';

const ROUND_OPTIONS = [1, 2, 3, 4];

interface DeskState {
  context: ContextEvent | null;
  analysts: AnalystEvent[];
  debate: DebateEvent[];
  summary: SummaryEvent | null;
  rules: RulesEvent | null;
  stage: DeskStage | null;
  message: string;
  elapsedMs: number | null;
  /** Set when the run left Gemini mid-flight because its quota was exhausted. */
  failover: string | null;
  fallbackCalls: number;
}

const EMPTY: DeskState = {
  context: null, analysts: [], debate: [], summary: null, rules: null,
  stage: null, message: '', elapsedMs: null, failover: null, fallbackCalls: 0,
};

/** The stage rail: which seats have reported, which one is speaking now. */
function StageRail({ stage, message, running }: {
  stage: DeskStage | null; message: string; running: boolean;
}) {
  const currentIndex = stage ? STAGE_ORDER.indexOf(stage) : -1;
  return (
    <div className="rounded-xl well p-4">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-2">
        {STAGE_ORDER.map((key, i) => {
          const done = i < currentIndex || (!running && currentIndex === STAGE_ORDER.length - 1 && i <= currentIndex);
          const active = running && i === currentIndex;
          return (
            <div key={key} className="flex items-center gap-2">
              <span
                className={clsx(
                  'flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-1 text-caption transition-colors',
                  active ? 'bg-fg text-ink-0'
                    : done ? 'text-up'
                    : 'text-fg-3',
                )}
              >
                {done ? <Check size={10} />
                  : active ? <CircleDot size={10} />
                  : <CircleDot size={10} className="opacity-40" />}
                {STAGE_LABELS[key]}
              </span>
              {i < STAGE_ORDER.length - 1 && <span className="text-fg-3/40">·</span>}
            </div>
          );
        })}
      </div>
      {message && (
        <p className="mt-2.5 border-t border-line pt-2.5 text-[12px] text-fg-2">
          {message}
        </p>
      )}
    </div>
  );
}

/**
 * The research desk: four analysts read a symbol separately, the case for
 * strength and the case for caution argue it out, a balanced summary explains
 * the data and how the plan was computed, and "Your rules" works out what your
 * own risk setting implies. Streamed turn by turn. It explains; it never tells
 * you what to do. See backend/agents_desk.py.
 */
export default function TradingDeskSection({
  symbol, currency,
}: { symbol: string; currency: string }) {
  const [state, setState] = useState<DeskState>(EMPTY);
  const [rounds, setRounds] = useState(2);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');
  const [notesKey, setNotesKey] = useState(0);
  const [showNotes, setShowNotes] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const { balance, positions, account } = usePortfolio();

  // A run is tied to the symbol it was opened on — switching tickers has to
  // clear it, or a later event would land in the wrong stock's transcript.
  const [runSymbol, setRunSymbol] = useState(symbol);
  if (runSymbol !== symbol) {
    setRunSymbol(symbol);
    setState(EMPTY);
    setError('');
    setRunning(false);
  }
  // ...and abort the old symbol's run (also on unmount).
  useEffect(() => () => { abortRef.current?.abort(); abortRef.current = null; }, [symbol]);

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
        case 'summary':
          return { ...prev, summary: event };
        case 'rules':
          return { ...prev, rules: event };
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
    // The run keeps a note server-side; nudge the notes panel to re-read.
    if (event.type === 'journal') setNotesKey((k) => k + 1);
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
          : 'The research desk could not be reached.',
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

  const { context, analysts, debate, summary, rules } = state;
  const started = Boolean(context) || running;

  return (
    <div className="space-y-5">
      {/* ---- Header and controls ---- */}
      <div className="glass rounded-xl p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="flex flex-wrap items-center gap-2 text-sm font-semibold text-fg">
              <Building2 size={15} className="text-fg-2" /> Research desk
              <span className="rounded bg-white/[0.06] px-1.5 py-0.5 text-caption text-fg-3">
                analysts · debate · summary · your rules
              </span>
            </h3>
            <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-fg-2">
              Four analysts read {symbol} separately, the case for strength and the case for caution
              argue it over {rounds} {rounds === 1 ? 'round' : 'rounds'}, and a balanced summary explains
              the data and how the plan&apos;s levels were computed. &ldquo;Your rules&rdquo; then works out
              what your own risk setting implies. Every figure comes from this platform&apos;s engines. The
              desk explains; it never tells you what to do.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div>
              <MicroLabel className="mb-1">Debate rounds</MicroLabel>
              <div className="flex overflow-hidden rounded-sm border border-white/15 bg-black/30">
                {ROUND_OPTIONS.map((option) => (
                  <button
                    key={option}
                    onClick={() => setRounds(option)}
                    disabled={running}
                    className={clsx(
                      'min-h-8 px-2.5 text-caption font-semibold tabular transition-colors disabled:opacity-50',
                      rounds === option ? 'bg-fg text-ink-0' : 'text-fg-3 hover:text-fg-2',
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
                className="flex min-h-11 items-center gap-2 rounded-sm border border-white/25 bg-black/30 px-4 text-xs font-semibold text-fg-2 transition-colors hover:text-fg"
              >
                <Square size={13} /> Stop
              </button>
            ) : (
              <button
                onClick={run}
                className="flex min-h-11 items-center gap-2 rounded-lg border border-fg-2/30 bg-fg-2/5 px-4 text-xs font-semibold text-fg-2 transition-colors hover:bg-fg-2/10"
              >
                <Play size={13} /> {started ? 'Run again' : `Run the desk on ${symbol}`}
              </button>
            )}
          </div>
        </div>

        {/* ---- Live context strip ---- */}
        {context && (
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line pt-3 text-caption text-fg-3">
            <span>
              <span className="ticker text-fg-2">{context.symbol}</span>
              {context.company !== context.symbol && ` · ${context.company}`}
            </span>
            {context.quant && (
              <span>
                factor composite{' '}
                <span className="font-semibold tabular text-fg-2">
                  {context.quant.composite_score > 0 ? '+' : ''}{context.quant.composite_score.toFixed(2)}
                </span>
              </span>
            )}
            <span>
              book{' '}
              <span className="tabular text-fg-2">
                {context.portfolio.has_book
                  ? formatMoney(context.portfolio.total_equity, account?.currency, 0)
                  : 'not connected'}
              </span>
            </span>
            {context.portfolio.existing_position && (
              <span className="text-warn">
                already holding {context.portfolio.existing_position.shares} shares
              </span>
            )}
            {state.elapsedMs !== null && (
              <span className="flex items-center gap-1">
                <Timer size={11} /> {(state.elapsedMs / 1000).toFixed(1)}s
              </span>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="glass rounded-xl flex items-start gap-3 p-5">
          <WifiOff size={16} className="mt-0.5 shrink-0 text-warn" />
          <p className="text-sm leading-relaxed text-fg-2">{error}</p>
        </div>
      )}

      {/* The desk changed provider mid-run. Not an error — the run continued —
          but the reader deserves to know which model answered which seat. */}
      {state.failover && (
        <div className="glass rounded-xl flex items-start gap-3 p-4">
          <Shuffle size={15} className="mt-0.5 shrink-0 text-warn" />
          <div className="min-w-0">
            <p className="text-[13px] leading-relaxed text-fg-2">{state.failover}</p>
            {state.fallbackCalls > 0 && (
              <p className="mt-1 text-caption text-fg-3">
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
        pending={running && Boolean(context) && analysts.length === 4 && !summary}
      />

      {summary && <SummaryPanel summary={summary} />}
      {rules && <RulesPanel rules={rules} currency={currency} />}

      {/* ---- Notes ---- */}
      {showNotes ? (
        <DeskNotes symbol={symbol} refreshKey={notesKey} />
      ) : (
        <button
          onClick={() => setShowNotes(true)}
          className="glass rounded-xl flex w-full items-center justify-center gap-2 p-4 text-xs font-semibold text-fg-2 transition-colors hover:text-fg"
        >
          <BookOpen size={14} className="text-fg-2" />
          Show desk notes: what each past run explained
        </button>
      )}
    </div>
  );
}
