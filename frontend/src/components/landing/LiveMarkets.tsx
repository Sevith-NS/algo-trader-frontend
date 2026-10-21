import 'server-only';
import { publicGet } from '@/lib/server-api';

/**
 * Real market figures for the landing page, from the API's public snapshot
 * (flint_api/routers/public.py), cached on the Next.js server for 60 seconds.
 * Every figure carries its source and time; an outage shows as an outage,
 * never as a stand-in number.
 */

type Index = { symbol: string; name: string; price: number; change: number; change_pct: number; as_of: string | null };
type Market = {
  label: string; currency: string; session: 'open' | 'closed' | null; source: string | null;
  indices: Index[];
  breadth: { universe: string; advancing: number; declining: number; unchanged: number; partial: boolean } | null;
};
type Fx = { pair: string; rate: number; change_pct: number | null; source: string; as_of: string | null };
export type LandingMarkets = { india: Market | null; us: Market | null; fx: Fx | null; generated_at: string };

export const getLandingMarkets = () => publicGet<LandingMarkets>('/api/public/landing');

const micro = 'text-micro uppercase';
const num = (v: number, digits = 2) =>
  new Intl.NumberFormat('en-IN', { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(v);

/** "19 Oct, 09:15 IST": market data is shown on Indian time everywhere. */
function asOf(iso: string | null | undefined) {
  if (!iso) return 'time unknown';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'time unknown';
  return `${new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(d)} IST`;
}

/** Direction is carried by the sign and arrow, never by colour alone. */
export function Change({ pct, className = '' }: { pct: number | null; className?: string }) {
  if (pct === null || !Number.isFinite(pct)) return <span className={`text-fg-3 ${className}`}>–</span>;
  const up = pct >= 0;
  return (
    <span className={`inline-flex items-center gap-1 tabular ${up ? 'text-up' : 'text-down'} ${className}`}>
      <span aria-hidden="true" className="text-[0.75em]">{up ? '▲' : '▼'}</span>
      <span className="sr-only">{up ? 'up' : 'down'}</span>
      {up ? '+' : '−'}{num(Math.abs(pct))}%
    </span>
  );
}

function Unavailable({ title }: { title: string }) {
  return (
    <div className="glass-hero w-full rounded-2xl p-6">
      <p className={`${micro} text-fg`}>{title}</p>
      <p className="mt-4 text-body-sm text-fg-2">Market data is unavailable right now. Nothing is shown in its place.</p>
    </div>
  );
}

export function MarketCard({ market, title, limit = 3 }: { market: Market | null; title: string; limit?: number }) {
  if (!market || market.indices.length === 0) return <Unavailable title={title} />;
  const rows = market.indices.filter((i) => !i.name.includes('VIX')).slice(0, limit);
  const b = market.breadth;
  const total = b ? b.advancing + b.declining + b.unchanged : 0;
  return (
    <section aria-label={`${title} markets`} className="glass-hero w-full rounded-2xl p-6">
      <p className="flex items-center justify-between">
        <span className={`${micro} text-fg`}>{title}</span>
        <span className="pill text-caption text-fg-2">{market.session === 'open' ? 'Open' : 'Closed'}</span>
      </p>
      <dl className="mt-4">
        {rows.map((i) => (
          <div key={i.symbol} className="flex items-baseline justify-between gap-3 border-t border-white/[0.07] py-2.5">
            <dt className="text-body-sm text-fg-2">{i.name}</dt>
            <dd className="flex items-baseline gap-3">
              <span className="tabular text-fg">{num(i.price)}</span>
              <Change pct={i.change_pct} className="w-[4.75rem] justify-end text-body-sm" />
            </dd>
          </div>
        ))}
      </dl>
      {b && total > 0 && (
        <div className="mt-3">
          <div aria-hidden="true" className="flex h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
            <span className="bg-up" style={{ width: `${(b.advancing / total) * 100}%` }} />
            <span className="bg-down ml-auto" style={{ width: `${(b.declining / total) * 100}%` }} />
          </div>
          <p className="mt-2 text-caption text-fg-2">
            {b.advancing} up, {b.declining} down · {b.universe}{b.partial ? ', partial scan' : ''}
          </p>
        </div>
      )}
      <p className="mt-3 text-caption text-fg-3">{market.source ?? 'Source unknown'} · {asOf(rows[0]?.as_of)}</p>
    </section>
  );
}

export function FxCard({ fx }: { fx: Fx | null }) {
  if (!fx) return <Unavailable title="USD / INR" />;
  return (
    <section aria-label="US dollar in rupees" className="glass-hero w-full rounded-2xl p-6">
      <p className="flex items-center justify-between">
        <span className={`${micro} text-fg`}>USD / INR</span>
        <span className="text-caption text-fg-2">Rupees per dollar</span>
      </p>
      <p className="mt-3 flex items-baseline gap-3">
        <span className="text-[40px] font-medium leading-none tracking-[-0.03em] tabular">₹{num(fx.rate)}</span>
        <Change pct={fx.change_pct} className="text-body-sm" />
      </p>
      <p className="mt-3 text-caption text-fg-3">{fx.source} · {asOf(fx.as_of)}</p>
    </section>
  );
}

/** Marquee items: every index plus USD/INR, or just market names if the snapshot is down. */
export function tapeItems(data: LandingMarkets | null, fallback: readonly string[]) {
  const live = [...(data?.india?.indices ?? []), ...(data?.us?.indices ?? [])]
    .map((i) => ({ name: i.name, value: num(i.price), pct: i.change_pct as number | null }));
  if (data?.fx) live.push({ name: 'USD/INR', value: num(data.fx.rate), pct: data.fx.change_pct });
  return live.length ? live : fallback.map((name) => ({ name, value: null as string | null, pct: null }));
}
