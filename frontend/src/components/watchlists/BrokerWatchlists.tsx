'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { ErrorState, LoadingBlock } from '@/components/ui/States';
import { SyncBadge } from '@/components/ui/SyncBadge';
import { onBrokersChanged } from '@/lib/brokers';
import { useApi } from '@/lib/useApi';
import type { BrokerWatchlist, BrokerWatchlistItem } from '@/types/api';
import { WatchlistTable } from './WatchlistTable';

function detail(i: BrokerWatchlistItem): string {
  const parts: string[] = [];
  if (i.held !== null) parts.push(`Held ${i.held}`);
  if (i.position !== null) {
    const n = Number(i.position);
    parts.push(n === 0 ? 'Closed today' : `Today ${n > 0 ? '+' : '−'}${Math.abs(n)}`);
  }
  return parts.join(' · ');
}

/**
 * Read-only lists from each connected broker: its holdings and today's
 * positions, read live from the broker, with live quotes. Kept apart from the
 * user's own watchlists; brokers don't expose their app watchlists.
 */
export function BrokerWatchlists() {
  const { data, error, loading, reload } = useApi<{ lists: BrokerWatchlist[] }>('/api/brokers/watchlist');
  // A broker login finishing in its own tab refreshes this one.
  useEffect(() => onBrokersChanged(reload), [reload]);

  return (
    <section aria-labelledby="broker-wl-h" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="broker-wl-h" className="text-h4">From your brokers</h2>
        <span className="text-caption text-fg-3">Read-only · live holdings and today&apos;s positions</span>
      </div>

      {loading && !data ? <LoadingBlock lines={3} label="Loading broker watchlists" />
        : error && !data ? <ErrorState error={error} title="Couldn't load your broker watchlists" onRetry={reload} />
        : !data?.lists.length ? (
          <p className="glass rounded-2xl p-5 text-body-sm text-fg-2 md:p-6">
            Connect a broker in{' '}
            <Link href="/settings#brokers-h" className="underline underline-offset-4">Settings</Link>{' '}
            to see what you hold and trade there, next to your own lists.
          </p>
        ) : data.lists.map(({ connection: c, as_of: asOf, items }) => {
          const title = `${c.label} · ${c.broker_user_id}`;
          return (
            <div key={c.id} className="glass flex min-w-0 flex-col gap-4 rounded-2xl p-5 md:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="truncate text-body font-medium">{title}</h3>
                <SyncBadge broker={c.label} status={c.status} lastSyncedAt={c.status === 'connected' ? asOf : null} />
              </div>
              {c.status === 'needs_reconnect' ? (
                <p className="text-body-sm text-fg-2">
                  The {c.label} session has ended.{' '}
                  <Link href="/settings#brokers-h" className="underline underline-offset-4">Reconnect in Settings</Link>
                  {' '}to see it again.
                </p>
              ) : c.status === 'error' ? (
                <p className="text-body-sm text-warn">{c.last_error ?? `${c.label} couldn’t be read right now.`}</p>
              ) : items.length ? (
                <WatchlistTable name={title} symbols={items.map((i) => i.symbol)}
                                details={Object.fromEntries(items.map((i) => [i.symbol, detail(i)]))} />
              ) : (
                <p className="text-body-sm text-fg-2">No NSE or BSE holdings or positions on this account right now.</p>
              )}
            </div>
          );
        })}
    </section>
  );
}
