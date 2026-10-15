"use client";
import { useMemo } from 'react';
import Link from 'next/link';
import { BrainCircuit, RefreshCw, AlertTriangle, ExternalLink } from '@/components/ui/icons';
import clsx from 'clsx';
import { apiPost, errorMessage } from '../../lib/api';
import { usePostQuery } from '../../lib/useApi';
import type { HoldingIntel } from '../../types/intel';
import {
  stanceColor, callColor, gradeColor, phaseColor, PHASE_LABELS,
} from './format';
import { tint } from '../../lib/theme';

/**
 * Holdings Intelligence: the same teardown engine that powers the screener,
 * run across every open position — health grade, news stance, market phase
 * and the two-horizon verdict, so a deteriorating holding surfaces itself.
 */
export default function HoldingsIntel({ positions }: { positions: { symbol: string }[] }) {
  // Re-run only when the set of symbols changes, not on every price tick.
  const symbolsKey = positions.map(p => p.symbol).sort().join(',');
  const body = useMemo(
    () => (symbolsKey ? { positions: symbolsKey.split(',').map(symbol => ({ symbol })) } : null),
    [symbolsKey],
  );
  const { data: res, error: err, loading, reload } = usePostQuery<{ holdings: HoldingIntel[] }>(
    body ? '/api/holdings-intel' : null, body, apiPost);
  const data = res?.holdings ?? [];
  const error = err ? errorMessage(err) : '';

  if (positions.length === 0) return null;

  return (
    <section className="glass rounded-xl mb-6 p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-fg">
          <BrainCircuit size={15} className="text-fg-2" /> Holdings Intelligence
          <span className="rounded bg-white/[0.06] px-1.5 py-0.5 text-caption text-fg-3">
            news sweep · fundamentals · phase · verdict
          </span>
        </h2>
        <button
          onClick={reload}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-sm border border-white/25 bg-black/30 px-3 py-1.5 text-caption text-fg-2 transition-colors hover:bg-white/[0.06] hover:text-fg disabled:opacity-50"
        >
          <RefreshCw size={11} /> Refresh
        </button>
      </div>

      {loading && data.length === 0 ? (
        <p className="text-sm text-fg-2">
          Sweeping news sources and statements for {positions.length} holding{positions.length > 1 ? 's' : ''}.
          The first run takes about 10 seconds per symbol; later runs are cached.
        </p>
      ) : error ? (
        <p className="text-sm text-down">{error}</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {data.map((h) => {
            if ('error' in h) {
              return (
                <div key={h.symbol} className="rounded-xl well p-4">
                  <div className="ticker text-fg">{h.symbol}</div>
                  <p className="mt-1 text-xs text-fg-3">Intel unavailable: {h.error}</p>
                </div>
              );
            }
            const sColor = stanceColor(h.news_stance);
            const pColor = phaseColor(h.phase);
            const lt = h.verdict?.long_term;
            const st = h.verdict?.short_term;
            return (
              <div key={h.symbol} className="flex flex-col rounded-xl well p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="ticker text-fg">{h.symbol}</div>
                    <div className="truncate text-caption text-fg-3">{h.company}</div>
                  </div>
                  {h.health_grade && (
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold"
                      style={{ color: gradeColor(h.health_grade), background: tint(gradeColor(h.health_grade), 10) }}
                      title={`Fundamental health ${h.health_score}/100`}
                    >
                      {h.health_grade}
                    </span>
                  )}
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  <span className="rounded-md px-1.5 py-0.5 text-caption font-bold" style={{ color: sColor, background: tint(sColor, 10) }}>
                    {h.news_stance} {h.news_rating}/100
                  </span>
                  {h.phase && (
                    <span className="rounded-md px-1.5 py-0.5 text-caption font-semibold" style={{ color: pColor, background: tint(pColor, 10) }}>
                      {(PHASE_LABELS[h.phase] || h.phase).split(' ·')[0]}
                    </span>
                  )}
                  {h.valuation_premium_pct !== null && h.valuation_premium_pct !== undefined && (
                    <span className={clsx(
                      'rounded-md px-1.5 py-0.5 text-caption font-semibold tabular',
                      h.valuation_premium_pct > 5 ? 'bg-down/10 text-down' : h.valuation_premium_pct < -5 ? 'bg-up/10 text-up' : 'bg-white/[0.06] text-fg-2'
                    )}>
                      P/E {h.valuation_premium_pct > 0 ? '+' : ''}{h.valuation_premium_pct}% vs hist
                    </span>
                  )}
                </div>

                {(lt || st) && (
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {lt && (
                      <div className="rounded-lg bg-white/[0.06] p-2">
                        <div className="text-caption text-fg-3">Long term</div>
                        <div className="text-sm font-bold" style={{ color: callColor(lt.call) }}>
                          {lt.call} <span className="text-caption font-medium text-fg-3">{lt.conviction_10}/10</span>
                        </div>
                      </div>
                    )}
                    {st && (
                      <div className="rounded-lg bg-white/[0.06] p-2">
                        <div className="text-caption text-fg-3">Short term</div>
                        <div className="text-sm font-bold" style={{ color: callColor(st.call) }}>
                          {st.call} <span className="text-caption font-medium text-fg-3">{st.conviction_10}/10</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {h.top_red_flag && (
                  <div className="mt-2 flex items-center gap-1.5 text-caption text-warn">
                    <AlertTriangle size={10} className="shrink-0" />
                    <span className="truncate">{h.top_red_flag}{(h.red_flag_count ?? 0) > 1 ? ` +${(h.red_flag_count ?? 0) - 1} more` : ''}</span>
                  </div>
                )}

                {h.top_headline && (h.top_headline.link ? (
                  <a
                    href={h.top_headline.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group mt-2 block border-t border-line pt-2"
                  >
                    <p className="line-clamp-2 text-caption leading-snug text-fg-2 transition-colors group-hover:text-fg">
                      {h.top_headline.title}
                      <ExternalLink size={9} className="ml-1 inline opacity-0 group-hover:opacity-60" />
                    </p>
                  </a>
                ) : (
                  <p className="mt-2 line-clamp-2 border-t border-line pt-2 text-caption leading-snug text-fg-2">
                    {h.top_headline.title}
                  </p>
                ))}

                <div className="mt-auto pt-3">
                  <Link
                    href={`/s/${encodeURIComponent(h.symbol)}`}
                    className="text-caption font-medium text-fg-2 hover:underline"
                  >
                    Full teardown →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="mt-3 border-t border-line pt-2 text-caption text-fg-3">
        Same engine as the Terminal teardown, batched across your book. Educational paper-trading
        research, not investment advice.
      </p>
    </section>
  );
}
