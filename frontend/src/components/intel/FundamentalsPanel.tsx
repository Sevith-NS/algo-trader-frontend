"use client";
import { FileSearch, AlertTriangle, CheckCircle2, Scale } from '@/components/ui/icons';
import clsx from 'clsx';
import { fmtBig, fmtPrice, gradeColor } from './format';
import type { Failed, Fundamentals } from '../../types/intel';
import { tint } from '../../lib/theme';

function ScoreBar({ label, value, max = 25 }: { label: string; value: number; max?: number }) {
  const pct = Math.min(value / max, 1) * 100;
  const color = pct >= 75 ? 'var(--green)' : pct >= 50 ? 'var(--fg-2)' : pct >= 30 ? 'var(--fg-2)' : 'var(--red)';
  return (
    <div className="flex items-center gap-2 py-0.5">
      <span className="w-24 shrink-0 text-caption capitalize text-fg-3">{label.replace('_', ' ')}</span>
      <div className="h-1.5 flex-1 overflow-hidden bg-white/[0.06]">
        <div className="h-full" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="w-8 text-right text-caption tabular text-fg-2">{value}/{max}</span>
    </div>
  );
}

/**
 * Fundamental X-Ray: health score, 5-year statement trajectory, red/green
 * flags, and valuation computed from raw statements vs the stock's own history.
 * Honest footer states what is NOT covered (concalls, MD&A, pledge data).
 */
export default function FundamentalsPanel({ data, currency }: { data: Fundamentals | Failed | null | undefined; currency: string }) {
  if (!data) return null;
  if ('error' in data) {
    return (
      <div className="glass rounded-xl p-5">
        <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-fg">
          <FileSearch size={15} className="text-fg-2" /> Fundamental X-Ray
        </h3>
        <p className="text-sm text-fg-2">{data.error}</p>
      </div>
    );
  }

  const { health, years, trends, valuation: val, red_flags, green_flags, quarterly_momentum: qm } = data;
  const gColor = gradeColor(health.grade);

  return (
    <div className="glass rounded-xl p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-fg">
          <FileSearch size={15} className="text-fg-2" /> Fundamental X-Ray
          <span className="rounded bg-white/[0.06] px-1.5 py-0.5 text-caption text-fg-3">
            {years.length} fiscal years · derived from raw statements
          </span>
        </h3>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-caption text-fg-3">Health</div>
            <div className="text-lg font-bold tabular text-fg">{health.score}<span className="text-xs text-fg-3">/100</span></div>
          </div>
          <div
            className="flex h-11 w-11 items-center justify-center rounded-xl text-lg font-bold"
            style={{ color: gColor, background: tint(gColor, 10), border: `1px solid ${tint(gColor, 25)}` }}
          >
            {health.grade}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.4fr_1fr]">
        {/* Left: trajectory table + score components */}
        <div>
          <div className="mb-3">
            {Object.entries(health.components).map(([k, v]) => (
              <ScoreBar key={k} label={k} value={v as number} />
            ))}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="border-b border-line text-left text-caption text-fg-3">
                  <th className="py-2 pr-2 font-medium">FY</th>
                  <th className="py-2 pr-2 font-medium">Revenue</th>
                  <th className="py-2 pr-2 font-medium">Net profit</th>
                  <th className="py-2 pr-2 font-medium">Net mgn</th>
                  <th className="py-2 pr-2 font-medium">ROE</th>
                  <th className="py-2 pr-2 font-medium" title="Operating cash flow ÷ net profit">CFO/PAT</th>
                  <th className="py-2 font-medium">D/E</th>
                </tr>
              </thead>
              <tbody>
                {years.map((y) => (
                  <tr key={y.fiscal_year} className="border-b border-line">
                    <td className="py-1.5 pr-2 font-semibold text-fg">{y.fiscal_year}</td>
                    <td className="py-1.5 pr-2 tabular text-fg-2">{fmtBig(y.revenue, currency)}</td>
                    <td className="py-1.5 pr-2 tabular text-fg-2">{fmtBig(y.net_income, currency)}</td>
                    <td className="py-1.5 pr-2 tabular text-fg-2">{y.net_margin !== null ? `${y.net_margin}%` : '–'}</td>
                    <td className={clsx('py-1.5 pr-2 tabular', y.roe !== null && y.roe >= 15 ? 'text-up' : y.roe !== null && y.roe < 10 ? 'text-warn' : 'text-fg-2')}>
                      {y.roe !== null ? `${y.roe}%` : '–'}
                    </td>
                    <td className={clsx('py-1.5 pr-2 tabular', y.cash_conversion !== null && y.cash_conversion < 0.7 ? 'text-down' : 'text-fg-2')}>
                      {y.cash_conversion !== null ? `${y.cash_conversion}x` : '–'}
                    </td>
                    <td className={clsx('py-1.5 tabular', y.debt_to_equity !== null && y.debt_to_equity > 1.5 ? 'text-down' : 'text-fg-2')}>
                      {y.debt_to_equity !== null ? `${y.debt_to_equity}x` : '–'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-caption text-fg-3">
            {trends.revenue_cagr_pct !== null && (
              <span>Revenue CAGR ({trends.window_years}y): <span className={clsx('tabular font-medium', trends.revenue_cagr_pct >= 10 ? 'text-up' : 'text-fg')}>{trends.revenue_cagr_pct}%</span></span>
            )}
            {trends.profit_cagr_pct !== null && (
              <span>Profit CAGR: <span className={clsx('tabular font-medium', trends.profit_cagr_pct >= 10 ? 'text-up' : 'text-fg')}>{trends.profit_cagr_pct}%</span></span>
            )}
            {qm?.revenue_yoy !== undefined && (
              <span>Last qtr rev YoY: <span className={clsx('tabular font-medium', qm.revenue_yoy >= 0 ? 'text-up' : 'text-down')}>{qm.revenue_yoy}%</span></span>
            )}
            {qm?.net_income_yoy !== undefined && (
              <span>Last qtr profit YoY: <span className={clsx('tabular font-medium', qm.net_income_yoy >= 0 ? 'text-up' : 'text-down')}>{qm.net_income_yoy}%</span></span>
            )}
          </div>
        </div>

        {/* Right: valuation + flags */}
        <div className="space-y-4">
          <div className="rounded-xl well p-3">
            <div className="mb-2 flex items-center gap-1.5 text-caption font-semibold text-fg-3">
              <Scale size={11} /> Valuation vs its own history
            </div>
            <div className="mb-2 flex items-end gap-3">
              <div>
                <div className="text-xl font-bold tabular text-fg">{val.pe ?? '–'}<span className="ml-1 text-caption font-normal text-fg-3">P/E {val.eps_basis}</span></div>
              </div>
              {val.premium_to_own_history_pct !== null && (
                <span className={clsx(
                  'rounded-md px-1.5 py-0.5 text-caption font-bold tabular',
                  val.premium_to_own_history_pct > 5 ? 'bg-down/10 text-down' : val.premium_to_own_history_pct < -5 ? 'bg-up/10 text-up' : 'bg-white/[0.06] text-fg-2'
                )}>
                  {val.premium_to_own_history_pct > 0 ? '+' : ''}{val.premium_to_own_history_pct}% vs {val.pe_hist_avg} avg
                </span>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg bg-white/[0.06] py-1.5">
                <div className="text-caption text-fg-3">P/B</div>
                <div className="text-sm font-semibold tabular text-fg">{val.pb ?? '–'}</div>
              </div>
              <div className="rounded-lg bg-white/[0.06] py-1.5">
                <div className="text-caption text-fg-3">EV/EBITDA</div>
                <div className="text-sm font-semibold tabular text-fg">{val.ev_ebitda ?? '–'}</div>
              </div>
              <div className="rounded-lg bg-white/[0.06] py-1.5">
                <div className="text-caption text-fg-3">Fair @ hist P/E</div>
                <div className="text-sm font-semibold tabular text-fg">{val.fair_price_at_hist_pe ? fmtPrice(val.fair_price_at_hist_pe, currency) : '–'}</div>
              </div>
            </div>
            <p className="mt-2 text-caption leading-relaxed text-fg-2">{val.verdict}</p>
          </div>

          {red_flags.length > 0 && (
            <div>
              <div className="mb-1.5 flex items-center gap-1.5 text-caption font-semibold text-down">
                <AlertTriangle size={11} /> Red flags
              </div>
              <div className="space-y-1.5">
                {red_flags.map((f, i) => (
                  <div key={i} className="rounded-lg border border-down/15 bg-down/5 p-2">
                    <div className="flex items-center gap-1.5 text-caption font-semibold text-fg">
                      {f.title}
                      {f.severity === 'high' && <span className="rounded bg-down/20 px-1 text-caption font-bold text-down">high</span>}
                    </div>
                    <p className="mt-0.5 text-caption leading-relaxed text-fg-2">{f.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {green_flags.length > 0 && (
            <div>
              <div className="mb-1.5 flex items-center gap-1.5 text-caption font-semibold text-up">
                <CheckCircle2 size={11} /> Green flags
              </div>
              <div className="space-y-1.5">
                {green_flags.map((f, i) => (
                  <div key={i} className="rounded-lg border border-up/15 bg-up/5 p-2">
                    <div className="text-caption font-semibold text-fg">{f.title}</div>
                    <p className="mt-0.5 text-caption leading-relaxed text-fg-2">{f.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <p className="mt-4 border-t border-line pt-2 text-caption leading-relaxed text-fg-3">
        Not covered by this automated x-ray (needs manual reading): {data.not_covered?.join(' · ')}.
        All figures derived from public filings data; paper-trading research, not investment advice.
      </p>
    </div>
  );
}
