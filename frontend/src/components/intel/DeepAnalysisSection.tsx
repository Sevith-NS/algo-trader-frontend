"use client";
import { useState } from 'react';
import {
  Microscope, Sparkles, Hourglass, Quote,
  Building2, Receipt, Scale, Swords, Users,
  CandlestickChart, CalendarClock, TrendingUp, TrendingDown, Calculator, WifiOff,
} from '@/components/ui/icons';
import clsx from 'clsx';
import { apiGet, errorMessage } from '../../lib/api';
import { useApi } from '../../lib/useApi';
import type { DeepAnalysis, Narrative } from '../../types/intel';
import FundamentalsPanel from './FundamentalsPanel';
import { fmtPrice, phaseColor, PHASE_LABELS } from './format';
import { tint } from '../../lib/theme';

// The model is instructed to return strings, but a partial or mis-shaped JSON
// response must never take down the page — coerce arrays to prose, drop the rest.
const asText = (v: unknown): string | null =>
  typeof v === 'string' && v.trim()
    ? v
    : Array.isArray(v)
      ? v.filter((x) => typeof x === 'string').join(' ') || null
      : null;

function PillarBar({ label, value }: { label: string; value: number | null }) {
  if (value === null) {
    return (
      <div className="flex items-center gap-2 py-0.5">
        <span className="w-24 shrink-0 text-caption capitalize text-fg-3">{label.replace('_', ' ')}</span>
        <span className="flex-1 text-caption text-fg-3">Source unavailable</span>
      </div>
    );
  }
  // value in [-1, 1], center-anchored like the quant factor bars
  const pct = Math.min(Math.abs(value), 1) * 50;
  return (
    <div className="flex items-center gap-2 py-0.5">
      <span className="w-24 shrink-0 text-caption capitalize text-fg-3">{label.replace('_', ' ')}</span>
      <div className="relative h-1.5 flex-1 bg-white/[0.06]">
        <div className="absolute left-1/2 top-0 h-full w-px bg-line-strong" />
        <div
          className={clsx('absolute top-0 h-full', value >= 0 ? 'bg-up' : 'bg-down')}
          style={value >= 0 ? { left: '50%', width: `${pct}%` } : { right: '50%', width: `${pct}%` }}
        />
      </div>
      <span className={clsx('w-10 text-right text-caption tabular', value >= 0 ? 'text-up' : 'text-down')}>
        {value >= 0 ? '+' : ''}{value.toFixed(2)}
      </span>
    </div>
  );
}

const PILLAR_NOTES: Record<string, string> = {
  fundamentals: 'health score',
  valuation: 'P/E vs own history',
  technicals: 'market phase',
  quant: 'factor composite',
  news: 'headline tone',
};

/**
 * The deep dive: five readings side by side (no blended call, no conviction,
 * no "buy below" price), technical phase, and an on-demand Gemini write-up
 * that explains the data without recommending anything. Figures come from the
 * computed numbers; qualitative context from the model's knowledge.
 */
export default function DeepAnalysisSection({ symbol, currency }: { symbol: string; currency: string }) {
  const { data, error, loading } = useApi<DeepAnalysis>(`/api/deep-analysis?symbol=${encodeURIComponent(symbol)}`);
  // The AI teardown belongs to the symbol it was written for; switching
  // tickers drops it rather than showing one company's story under another.
  const [ai, setAi] = useState<{ symbol: string; narrative?: Narrative; error?: string } | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const narrative = ai?.symbol === symbol ? ai.narrative ?? null : null;
  const aiError = ai?.symbol === symbol ? ai.error ?? '' : '';

  const runAiTeardown = async () => {
    const forSymbol = symbol;
    setAiLoading(true);
    setAi(null);
    try {
      const d = await apiGet<DeepAnalysis>(`/api/deep-analysis?symbol=${encodeURIComponent(forSymbol)}&ai=1`);
      setAi(d.narrative
        ? { symbol: forSymbol, narrative: d.narrative }
        : { symbol: forSymbol, error: 'The AI teardown is unavailable right now. The numbers above still stand.' });
    } catch (err) {
      setAi({ symbol: forSymbol, error: errorMessage(err) });
    } finally {
      setAiLoading(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="glass rounded-xl flex items-center gap-3 p-5">
        <Hourglass size={16} className="text-fg-2" />
        <p className="text-sm text-fg-2">
          Running deep analysis for {symbol}: statements, valuation history, phase &amp; news sweep…
        </p>
      </div>
    );
  }
  // A 429 or 5xx must not silently unmount the section: say why it's missing.
  if (error) {
    return (
      <div className="glass rounded-xl flex items-center gap-3 p-5">
        <WifiOff size={16} className="shrink-0 text-warn" />
        <p className="text-sm leading-relaxed text-fg-2">{errorMessage(error)}</p>
      </div>
    );
  }
  // Only vanish when there is genuinely nothing to show and nothing to explain.
  if (!data) return null;

  const { readings, fundamentals } = data;
  const tech = 'error' in data.technical ? null : data.technical;
  const hasTech = tech !== null;
  const pColor = phaseColor(tech?.phase);

  return (
    <div className="space-y-5">
      {/* ---- Readings ---- */}
      <div className="glass rounded-xl p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-fg">
            <Microscope size={15} className="text-fg-2" /> Readings
            <span className="rounded bg-white/[0.06] px-1.5 py-0.5 text-caption text-fg-3">
              fundamentals · valuation · technicals · quant · news
            </span>
          </h3>
          {hasTech && (
            <span
              className="rounded-md px-2 py-1 text-caption font-semibold"
              style={{ color: pColor, background: tint(pColor, 10) }}
            >
              {PHASE_LABELS[tech.phase] || tech.phase}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.2fr_1fr]">
          <div>
            {Object.entries(readings.pillars).map(([k, v]) => (
              <PillarBar key={k} label={k} value={v} />
            ))}
          </div>
          <ul className="text-caption leading-relaxed text-fg-3">
            <li className="mb-1 text-fg-2">Each reading runs from −1 (weak on that measure) to +1 (strong).</li>
            {Object.keys(readings.pillars).map((k) => (
              <li key={k}><span className="capitalize">{k}</span>: {PILLAR_NOTES[k] ?? k}</li>
            ))}
            <li className="mt-1">They are shown side by side, not blended into a call. You weigh them.</li>
          </ul>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-line pt-3 sm:grid-cols-3">
          {hasTech && (
            <>
              <div>
                <div className="text-caption text-fg-3">Support / Resistance</div>
                <div className="text-sm font-semibold tabular text-fg">
                  {fmtPrice(tech.support?.near, currency)} · {fmtPrice(tech.resistance?.near, currency)}
                </div>
              </div>
              <div>
                <div className="text-caption text-fg-3">Volume</div>
                <div className={clsx('text-sm font-semibold', tech.volume_read === 'confirming' ? 'text-up' : 'text-warn')}>
                  {tech.volume_read}
                </div>
              </div>
              <div>
                <div className="text-caption text-fg-3">52-week position</div>
                <div className="text-sm font-semibold tabular text-fg">{Math.round((tech.pos_52w ?? 0) * 100)}%</div>
              </div>
            </>
          )}
        </div>
        {hasTech && (
          <p className="mt-2 text-caption leading-relaxed text-fg-2">{tech.phase_note} {tech.volume_note}</p>
        )}
      </div>

      {/* ---- Fundamentals X-Ray ---- */}
      <FundamentalsPanel data={fundamentals} currency={currency} />

      {/* ---- AI research note ---- */}
      <div className="glass rounded-xl p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-fg">
            <Sparkles size={15} className="text-fg-2" /> AI Deep Dive
            <span className="rounded bg-white/[0.06] px-1.5 py-0.5 text-caption text-fg-3">
              figures from computed data · context from model knowledge
            </span>
          </h3>
          {!narrative && (
            <button
              onClick={runAiTeardown}
              disabled={aiLoading}
              className="rounded-lg border border-fg-2/30 bg-fg-2/5 px-4 py-2 text-xs font-semibold text-fg-2 transition-colors hover:bg-fg-2/10 disabled:opacity-50"
            >
              {aiLoading ? 'Writing the teardown…' : 'Generate teardown'}
            </button>
          )}
        </div>

        {aiError && <p className="text-xs text-down">{aiError}</p>}

        {!narrative && !aiError && !aiLoading && (
          <p className="text-xs text-fg-2">
            One click writes a plain-English deep dive: business model, latest quarter, balance
            sheet, competitive position, management, technical setup, catalysts, what&apos;s going
            well and what could go wrong, valuation, and what to watch next. It explains; it
            doesn&apos;t tell you what to do.
          </p>
        )}

        {narrative && (() => {
          // Coerce every section defensively — a missing key just skips its block.
          const oneLiner = asText(narrative.one_liner);
          const watch = asText(narrative.what_to_watch);
          const sections = [
            { icon: <Building2 size={13} />, title: 'Business model', text: asText(narrative.business_model) },
            { icon: <Receipt size={13} />, title: 'Quarterly results', text: asText(narrative.quarterly_results) },
            { icon: <Scale size={13} />, title: 'Balance sheet', text: asText(narrative.balance_sheet) },
            { icon: <Swords size={13} />, title: 'Competitive position', text: asText(narrative.competitive_position) },
            { icon: <Users size={13} />, title: 'Management quality', text: asText(narrative.management_quality) },
            { icon: <CandlestickChart size={13} />, title: 'Technical setup', text: asText(narrative.technical_setup) },
            { icon: <CalendarClock size={13} />, title: 'Catalysts', text: asText(narrative.catalysts) },
          ].filter(s => s.text);
          const bull = asText(narrative.bull_case);
          const bear = asText(narrative.bear_case);
          const valuation = asText(narrative.valuation);
          return (
            <div className="space-y-4">
              {oneLiner && (
                <div className="rounded-xl border border-fg-2/20 bg-fg-2/5 p-4">
                  <Quote size={14} className="mb-1 text-fg-2" />
                  <p className="text-sm font-medium leading-relaxed text-fg">{oneLiner}</p>
                </div>
              )}

              {/* ---- Sections 1-7 in template order ---- */}
              {sections.length > 0 && (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {sections.map((s, i) => (
                    <div key={i}>
                      <h4 className="mb-1 flex items-center gap-1.5 text-caption font-semibold text-fg-3">
                        {s.icon} {s.title}
                      </h4>
                      <p className="text-xs leading-relaxed text-fg-2">{s.text}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* ---- Bull vs bear, side by side ---- */}
              {(bull || bear) && (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {bull && (
                    <div className="rounded-xl border border-up/25 bg-up/5 p-4">
                      <h4 className="mb-1.5 flex items-center gap-1.5 text-caption font-semibold text-up">
                        <TrendingUp size={12} /> Going well
                      </h4>
                      <p className="text-xs leading-relaxed text-fg-2">{bull}</p>
                    </div>
                  )}
                  {bear && (
                    <div className="rounded-xl border border-down/25 bg-down/5 p-4">
                      <h4 className="mb-1.5 flex items-center gap-1.5 text-caption font-semibold text-down">
                        <TrendingDown size={12} /> Could go wrong
                      </h4>
                      <p className="text-xs leading-relaxed text-fg-2">{bear}</p>
                    </div>
                  )}
                </div>
              )}

              {valuation && (
                <div>
                  <h4 className="mb-1 flex items-center gap-1.5 text-caption font-semibold text-fg-3">
                    <Calculator size={13} /> Valuation
                  </h4>
                  <p className="text-xs leading-relaxed text-fg-2">{valuation}</p>
                </div>
              )}

              {watch && (
                <div>
                  <h4 className="mb-1 flex items-center gap-1.5 text-caption font-semibold text-fg-3">
                    <CalendarClock size={13} /> What to watch
                  </h4>
                  <p className="text-xs leading-relaxed text-fg-2">{watch}</p>
                </div>
              )}
            </div>
          );
        })()}

        <p className="mt-4 border-t border-line pt-2 text-caption leading-relaxed text-fg-3">
          Figures are grounded in the computed data above. Qualitative context, including business model,
          competitors and catalysts, comes from the model&apos;s general knowledge of the company:
          verify it independently. Information only, not investment advice or a recommendation.
        </p>
      </div>
    </div>
  );
}
