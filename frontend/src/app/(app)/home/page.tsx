'use client';

import clsx from 'clsx';
import Link from 'next/link';
import { PageHeader, Panel } from '@/components/PageHeader';
import { Watchlist } from '@/components/home/Watchlist';
import { PortfolioPulse } from '@/components/portfolio/Summary';
import { Change } from '@/components/ui/Change';
import { EmptyState, ErrorState, LoadingBlock, Skeleton } from '@/components/ui/States';
import { useNow } from '@/lib/browser';
import { EXCHANGES, sessionState } from '@/lib/sessions';
import { useApi } from '@/lib/useApi';
import type { JournalResponse } from '@/types/agents';

function Sessions() {
  const now = useNow();
  return (
    <Panel level={2} id="sessions-h" title="Market hours" bodyClassName="flex flex-col gap-3">
      <ul className="divide-y divide-white/[0.07]">
        {EXCHANGES.map((ex) => {
          const s = now ? sessionState(ex, now) : null;
          return (
            <li key={ex.id} className="flex min-h-11 items-center justify-between gap-4 text-body-sm">
              <span className="font-medium">{ex.name}</span>
              {s ? (
                <span className="flex items-center gap-3">
                  <span className="text-caption text-fg-3">{s.label}</span>
                  <span className={clsx('inline-flex items-center gap-1.5', s.open ? 'text-up' : 'text-fg-2')}>
                    <span aria-hidden="true" className={clsx('h-1.5 w-1.5 rounded-full', s.open ? 'bg-up' : 'border border-fg-3')} />
                    {s.open ? 'Open' : 'Closed'}
                  </span>
                </span>
              ) : <Skeleton className="w-24" />}
            </li>
          );
        })}
        <li className="flex min-h-11 items-center justify-between text-body-sm">
          <span className="font-medium">Crypto</span>
          <span className="inline-flex items-center gap-1.5 text-up"><span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-up" />Always open</span>
        </li>
      </ul>
      <p className="text-caption text-fg-3">Regular hours only. Exchange holidays aren&apos;t shown yet.</p>
    </Panel>
  );
}

function RecentDecisions() {
  const { data, error, loading, reload } = useApi<JournalResponse>('/api/journal?limit=3');
  return (
    <Panel level={2} id="journal-h" title="Recent desk decisions" bodyClassName="flex flex-col gap-3"
           aside={<Link href="/portfolio/journal" className="text-body-sm text-fg-2 underline-offset-4 hover:text-fg hover:underline">Journal</Link>}>
      {loading && !data ? <LoadingBlock lines={3} label="Loading decisions" />
        : error ? <ErrorState error={error} onRetry={reload} />
        : !data?.entries.length ? (
          <EmptyState title="No decisions yet">
            Open a symbol and run the AI desk. Each verdict is saved here and scored against the market later.
          </EmptyState>
        ) : (
          <ul className="divide-y divide-white/[0.07]">
            {data.entries.map((e) => (
              <li key={e.id}>
                <Link href={`/s/${encodeURIComponent(e.symbol)}?tab=desk`}
                      className="-mx-2 flex min-h-14 items-center justify-between gap-4 rounded-lg px-2 py-2 hover:bg-white/[0.04]">
                  <span className="flex flex-col">
                    <span className="ticker text-body-sm">{e.symbol}</span>
                    <span className="text-caption text-fg-3">{e.date} · conviction {e.conviction_10}/10</span>
                  </span>
                  <span className="flex flex-col items-end text-body-sm">
                    <span className={clsx('font-medium', e.decision === 'APPROVE' ? 'text-fg' : 'text-fg-2')}>
                      {e.decision === 'APPROVE' ? `${e.action} approved` : 'Rejected'}
                    </span>
                    {e.outcome ? <span className="text-caption"><Change pct={e.outcome.alpha_pct} /> <span className="text-fg-3">vs S&amp;P</span></span>
                      : <span className="text-caption text-fg-3">Not scored yet</span>}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      {data?.stats?.hit_rate != null && (
        <p className="text-caption text-fg-3 tabular">
          {data.stats.hits} of {data.stats.directional} scored calls right ({data.stats.hit_rate.toFixed(0)}%).
        </p>
      )}
    </Panel>
  );
}

export default function Home() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader level={1} title="Today" className="mb-2" />
      <PortfolioPulse />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
        <Watchlist />
        <div className="flex flex-col gap-4">
          <Sessions />
          <RecentDecisions />
        </div>
      </div>
    </div>
  );
}
