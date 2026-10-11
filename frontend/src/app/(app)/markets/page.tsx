'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { WifiOff, RotateCw, ArrowRight } from '@/components/ui/icons';
import clsx from 'clsx';
import PctChip from '@/components/discover/PctChip';
import { TAG_ORDER, TAG_LABELS, TAG_STYLES } from '@/components/discover/tagStyles';
import { fmtPrice } from '@/components/intel/format';
import { API_BASE, DATA_UNAVAILABLE } from '@/lib/api';
import type { DiscoverCard, DiscoverResponse, HorizonTagId } from '@/types/discover';


// Session-cache TTL — matches the backend's Cache-Control max-age=300, so a
// long-lived tab doesn't render prices frozen at first fetch all session.
const CACHE_TTL_MS = 300_000;

// The hub's tab strip is a fixed product surface (short labels for the strip),
// not the backend's universe index — every id must exist in UNIVERSES.
const MARKETS = [
  { id: 'us_large', label: 'US Equities' },
  { id: 'nifty50', label: 'India' },
  { id: 'crypto', label: 'Crypto' },
  { id: 'bonds', label: 'Govt Bonds' },
  { id: 'commodities', label: 'Commodities' },
  { id: 'indices', label: 'Indices' },
] as const;

/** 429 message with Retry-After from the header, or the JSON body as fallback. */
function rateLimitMessage(res: Response, body: { retry_after_seconds?: number } | null): string {
  const retryAfter = res.headers.get('Retry-After')
    || (body?.retry_after_seconds != null ? String(Math.ceil(body.retry_after_seconds)) : null);
  return `Rate limited. Too many requests. Try again in ${retryAfter || 'a few'} seconds.`;
}

/**
 * Heat band for a tile: the old page's 5% / 2% / >0 banding, re-expressed as
 * committed-token colors at alpha steps so intensity reads on the dark theme.
 * The signed % on every tile is the non-color channel — direction survives
 * without hue.
 */
function heatClass(change: number | null): string {
  if (change === null) return 'bg-ink-2';
  if (change >= 5) return 'bg-up/80';
  if (change >= 2) return 'bg-up/60';
  if (change > 0) return 'bg-up/40';
  if (change <= -5) return 'bg-down/80';
  if (change <= -2) return 'bg-down/60';
  if (change < 0) return 'bg-down/40';
  return 'bg-line'; // exactly flat
}

function SectionHeading({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="mb-3 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
      <h2 className="text-sm font-semibold text-textSecondary">{title}</h2>
      {hint && <span className="text-xs text-textMuted">{hint}</span>}
    </div>
  );
}

function MoverList({ title, accent, items }: {
  title: string;
  accent: 'green' | 'red';
  items: DiscoverCard[];
}) {
  return (
    <div className="glass-panel p-5">
      <h3
        className={clsx(
          'mb-3 border-b border-borderSubtle pb-2 text-sm font-semibold',
          accent === 'green' ? 'text-accentGreen' : 'text-accentRed',
        )}
      >
        {title}
      </h3>
      {items.length === 0 ? (
        <p className="py-4 text-center text-xs text-textMuted">No data</p>
      ) : (
        <div className="space-y-1">
          {items.map((c) => (
            <Link
              key={c.symbol}
              href={`/s/${encodeURIComponent(c.symbol)}`}
              className="flex items-center justify-between gap-3 rounded p-2 transition-colors hover:bg-ink-2 focus-visible:ring-1 focus-visible:ring-accentCyan/50"
            >
              <div className="min-w-0">
                <div className="ticker text-textPrimary">{c.symbol}</div>
                <div className="truncate text-xs text-textMuted">{c.name}</div>
              </div>
              <div className="shrink-0 text-right">
                <div className="text-sm tabular text-textPrimary">{fmtPrice(c.price, c.currency)}</div>
                <div className="mt-0.5"><PctChip value={c.change_1d_pct} /></div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function MarketsPage() {
  const [market, setMarket] = useState<string>('us_large');
  const [data, setData] = useState<DiscoverResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retryNonce, setRetryNonce] = useState(0);

  // Per-universe response cache: tab flips within a session render instantly
  // instead of re-hitting the backend (which is itself only 5-min memoised).
  // Entries carry a timestamp and expire after CACHE_TTL_MS.
  const cacheRef = useRef<Record<string, { body: DiscoverResponse; at: number }>>({});

  // A tab backgrounded past the TTL comes back with frozen prices — drop the
  // stale entry for the visible market and refetch via the existing nonce.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return;
      const entry = cacheRef.current[market];
      if (entry && Date.now() - entry.at >= CACHE_TTL_MS) {
        delete cacheRef.current[market];
        setRetryNonce((n) => n + 1);
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [market]);

  useEffect(() => {
    const cached = cacheRef.current[market];
    if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
      setData(cached.body);
      setLoading(false);
      setError('');
      return;
    }
    let cancelled = false;

    async function fetchMarket() {
      setLoading(true);
      setData(null);
      setError('');
      try {
        // all=1: every parsed symbol gets a card (tags may be []) — the heat
        // grid and movers need the whole universe, not just tagged setups.
        const res = await fetch(
          `${API_BASE}/api/discover?universe=${encodeURIComponent(market)}&all=1`
        );
        const body = await res.json().catch(() => null);
        if (cancelled) return;

        if (res.status === 429) {
          setError(rateLimitMessage(res, body));
        } else if (!res.ok || body?.error) {
          setError(body?.error || `Markets request failed (${res.status}).`);
        } else {
          setData(body as DiscoverResponse);
          // parsed: 0 means upstream outage — caching it would pin the empty
          // payload for the whole session with no recovery path.
          if ((body as DiscoverResponse).parsed !== 0) {
            cacheRef.current[market] = { body: body as DiscoverResponse, at: Date.now() };
          }
        }
      } catch (err) {
        console.error('Failed to fetch market data', err);
        if (!cancelled) setError(DATA_UNAVAILABLE);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchMarket();
    return () => { cancelled = true; };
  }, [market, retryNonce]);

  const cards = useMemo(() => data?.cards ?? [], [data]);

  // Movers: factual top/bottom of the day. Fewer than 10 symbols with change
  // data (12-symbol universes, partial outages) would make fixed slices of 5
  // overlap — cap each list at half the pool so a symbol never appears in both.
  const { gainers, losers } = useMemo(() => {
    const withChange = cards.filter((c) => c.change_1d_pct !== null);
    const sorted = [...withChange].sort(
      (a, b) => (b.change_1d_pct as number) - (a.change_1d_pct as number)
    );
    const n = Math.min(5, Math.floor(sorted.length / 2));
    // slice(-0) would return the whole array — guard the empty case explicitly.
    return { gainers: sorted.slice(0, n), losers: n === 0 ? [] : sorted.slice(-n).reverse() };
  }, [cards]);

  // Horizon setups: the tagged subset — same doctrine as /discover.
  const tagged = useMemo(() => cards.filter((c) => c.tags.length > 0), [cards]);
  const tagCounts = useMemo(() => {
    const counts = {} as Record<HorizonTagId, number>;
    for (const card of tagged) {
      for (const tag of card.tags) counts[tag.id] = (counts[tag.id] || 0) + 1;
    }
    return counts;
  }, [tagged]);
  const presentTags = TAG_ORDER.filter((id) => tagCounts[id] > 0);

  return (
    <div className="flex flex-col">
      <div>
        <div className="w-full">

          {/* The section's five views. Sits under the h1 and above this view's
              own controls, so the hierarchy reads section → view → filters
              rather than three peer control rows competing for the same eye. */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
            <div
              role="group"
              aria-label="Market universe"
              className="flex flex-wrap gap-1.5"
            >
              {MARKETS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMarket(m.id)}
                  aria-pressed={m.id === market}
                  className={clsx(
                    // min-h-9 so these clear a comfortable hit target and line
                    // up with the view strip above them.
                    'inline-flex min-h-9 items-center rounded-lg border px-3 text-xs font-medium transition-colors duration-150',
                    m.id === market
                      ? 'border-accentGreen/40 bg-accentGreen/10 text-accentGreen'
                      : 'border-borderSubtle text-textSecondary hover:bg-ink-2 hover:text-textPrimary'
                  )}
                >
                  {m.label}
                </button>
              ))}
            </div>
            {data?.as_of && (
              <span className="tabular text-xs text-textMuted">as of {data.as_of}</span>
            )}
          </div>

          {market === 'bonds' && (
            <p className="mb-5 rounded-lg border border-borderSubtle bg-ink-2 px-3 py-2 text-xs text-textMuted">
              US-listed bond ETFs stand in here. The Indian G-Sec series has no reliable keyless source yet (PRD A11).
            </p>
          )}

          {loading ? (
            <div className="space-y-8">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
                {Array.from({ length: 16 }).map((_, i) => (
                  <div key={i} className="h-[92px] rounded-md bg-ink-2 skeleton" />
                ))}
              </div>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div className="glass-panel h-64 skeleton" />
                <div className="glass-panel h-64 skeleton" />
              </div>
            </div>
          ) : error ? (
            <div className="glass-panel flex h-64 flex-col items-center justify-center gap-3 px-6 text-center">
              <WifiOff size={22} className="text-accentAmber" />
              <p className="max-w-md text-sm leading-relaxed text-textSecondary">{error}</p>
              <button
                onClick={() => { setError(''); setRetryNonce((n) => n + 1); }}
                className="mt-1 flex items-center gap-1.5 rounded-lg border border-borderSubtle px-3 py-1.5 text-xs font-medium text-textSecondary transition-colors hover:bg-ink-2 hover:text-textPrimary"
              >
                <RotateCw size={12} /> Retry
              </button>
            </div>
          ) : cards.length === 0 ? (
            <div className="glass-panel flex h-64 flex-col items-center justify-center gap-3 px-6 text-center">
              <WifiOff size={22} className="text-accentAmber" />
              <p className="max-w-md text-sm leading-relaxed text-textSecondary">
                No data parsed for {data?.universe_label ?? 'this market'} right now. The upstream
                feed may be down. Data refreshes as the cache recovers (~30 min).
              </p>
              <button
                // Belt-and-braces: outage payloads aren't cached, but drop any
                // entry for this market anyway before refetching.
                onClick={() => { delete cacheRef.current[market]; setRetryNonce((n) => n + 1); }}
                className="mt-1 flex items-center gap-1.5 rounded-lg border border-borderSubtle px-3 py-1.5 text-xs font-medium text-textSecondary transition-colors hover:bg-ink-2 hover:text-textPrimary"
              >
                <RotateCw size={12} /> Retry
              </button>
            </div>
          ) : (
            <div className="space-y-10">

              {/* ---- Section 1: Heat ---- */}
              <section>
                <SectionHeading
                  title="Heat"
                  hint={`${cards.length} of ${data?.scanned ?? cards.length} symbols · 1-day change`}
                />
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
                  {cards.map((c) => (
                    <Link
                      key={c.symbol}
                      href={`/s/${encodeURIComponent(c.symbol)}`}
                      className={clsx(
                        heatClass(c.change_1d_pct),
                        'flex min-h-[92px] flex-col justify-between rounded-md p-3 transition-[filter] hover:brightness-110 focus-visible:ring-1 focus-visible:ring-accentCyan/50'
                      )}
                    >
                      <div className="ticker truncate text-sm text-textPrimary">{c.symbol}</div>
                      <div>
                        <div className="truncate text-sm font-medium tabular text-white/90">
                          {fmtPrice(c.price, c.currency)}
                        </div>
                        <div className="text-xs font-bold tabular text-white/80">
                          {c.change_1d_pct === null
                            ? '–'
                            : `${c.change_1d_pct >= 0 ? '+' : ''}${c.change_1d_pct.toFixed(2)}%`}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>

              {/* ---- Section 2: Movers ---- */}
              <section>
                <SectionHeading title="Movers" hint="top 5 by 1-day change, each way" />
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <MoverList title="Top gainers" accent="green" items={gainers} />
                  <MoverList title="Top losers" accent="red" items={losers} />
                </div>
              </section>

              {/* ---- Section 3: handoff to Ideas ----
                  This section used to BE the Ideas tab: same /api/discover
                  payload, same IdeaCard grid, same tag filters, different URL.
                  Two places to find the same setups meant neither felt
                  authoritative. Heat is what this page is for, so the setups
                  now live only on Ideas, and what stays here is the count plus
                  the door: enough to know the setups exist and which tags
                  fired, without re-rendering the grid. */}
              <section>
                <Link
                  href="/markets/ideas"
                  className="group glass-panel flex flex-wrap items-center justify-between gap-x-6 gap-y-3 p-5 transition-colors hover:border-line-strong"
                >
                  <div className="min-w-0">
                    <h2 className="flex items-center gap-2 text-sm font-semibold text-textPrimary">
                      Horizon setups
                      <span className="tabular rounded bg-ink-2 px-1.5 py-0.5 text-caption text-textSecondary">
                        {tagged.length}
                      </span>
                    </h2>
                    <p className="mt-1 max-w-xl text-xs leading-relaxed text-textMuted">
                      {tagged.length === 0
                        ? `Nothing tagged in ${data?.universe_label ?? 'this market'} right now. Tags re-evaluate as cached data refreshes, about every 30 minutes.`
                        : `${tagged.length} names in ${data?.universe_label ?? 'this market'} carry a descriptive tag with the numbers that fired. Candidates, not calls.`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {/* The tags themselves are the preview: which KINDS of setup
                        fired is the part worth carrying across the handoff. */}
                    {presentTags.length > 0 && (
                      <div className="hidden flex-wrap items-center gap-1.5 sm:flex">
                        {presentTags.slice(0, 4).map((id) => (
                          <span
                            key={id}
                            className={clsx(
                              'rounded border px-2 py-0.5 text-caption',
                              TAG_STYLES[id].chip,
                            )}
                          >
                            {TAG_LABELS[id]} {tagCounts[id]}
                          </span>
                        ))}
                        {presentTags.length > 4 && (
                          <span className="tabular text-caption text-textMuted">
                            +{presentTags.length - 4}
                          </span>
                        )}
                      </div>
                    )}
                    <span className="flex shrink-0 items-center gap-1.5 whitespace-nowrap text-xs font-medium text-accentGreen">
                      Open Ideas
                      <ArrowRight
                        size={14}
                        className="transition-transform duration-150 motion-safe:group-hover:translate-x-0.5"
                      />
                    </span>
                  </div>
                </Link>
              </section>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
