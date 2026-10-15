'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { describeAlert } from '@/components/alerts/AlertSheet';
import { Popover } from '@/components/ui/Popover';
import { ErrorState, LoadingBlock } from '@/components/ui/States';
import { apiPost } from '@/lib/api';
import { formatNumber, formatPct, timeAgo } from '@/lib/format';
import { announceAlertsSeen } from '@/lib/useAlertCount';
import { useApi } from '@/lib/useApi';
import type { AlertFiring } from '@/types/api';

const SHOWN = 5;

/**
 * The bell: opens the latest firings in a popover. Opening it is what
 * "seeing" them means (as on the Triggered tab), so the count clears; the
 * list keeps them labelled New while it is open.
 */
export function AlertsBell({ count, className, children }: { count: number; className?: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  const { data, error, loading, reload } = useApi<{ firings: AlertFiring[]; unseen: number }>(
    open ? `/api/alerts/firings?limit=${SHOWN}` : null);
  // Newest firing already marked seen: reopening shows the last list for a moment, which must not mark again.
  const marked = useRef<string | null>(null);

  useEffect(() => {
    const newest = data?.firings[0]?.id ?? null;
    if (!open || !data?.unseen || marked.current === newest) return;
    marked.current = newest;
    apiPost('/api/alerts/firings/seen', {}).then(announceAlertsSeen).catch(() => { marked.current = null; });
  }, [open, data]);

  return (
    <>
      <button ref={button} type="button" aria-expanded={open} aria-controls="alerts-popover"
              aria-label={count ? `Alerts, ${count} new` : 'Alerts'} onClick={() => setOpen((o) => !o)} className={className}>
        {children}
      </button>
      <Popover id="alerts-popover" open={open} onClose={() => setOpen(false)} anchorRef={button} label="Triggered alerts">
        <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
          <h2 className="text-body-sm font-medium">Triggered alerts</h2>
          <Link href="/alerts?tab=triggered" onClick={() => setOpen(false)}
                className="flex min-h-11 items-center text-body-sm text-fg-2 underline-offset-4 hover:text-fg hover:underline">
            See all
          </Link>
        </div>
        <div className="max-h-[60dvh] overflow-y-auto px-4 py-2">
          {loading && !data ? <LoadingBlock lines={3} label="Loading alerts" />
            : error && !data ? <ErrorState error={error} title="Couldn't load alerts" onRetry={reload} />
            : !data?.firings.length ? (
              <p className="py-3 text-body-sm text-fg-2">Nothing has fired yet. Alerts you set land here when they trigger.</p>
            ) : (
              <ul className="flex flex-col divide-y divide-white/[0.07]">
                {data.firings.map((f) => (
                  <li key={f.id}>
                    <Link href={`/s/${encodeURIComponent(f.symbol)}`} onClick={() => setOpen(false)}
                          className="-mx-2 flex min-h-11 flex-col gap-0.5 rounded-md px-2 py-2 hover:bg-white/[0.04]">
                      <span className="flex items-center gap-2 text-body-sm">
                        {!f.seen && <span className="pill text-fg">New</span>}
                        {describeAlert(f)}
                      </span>
                      <span className="text-caption text-fg-3 tabular">
                        {formatNumber(f.price, 2)}{f.change_pct !== null && ` (${formatPct(f.change_pct)} on the day)`} · {timeAgo(f.fired_at)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
        </div>
      </Popover>
    </>
  );
}
