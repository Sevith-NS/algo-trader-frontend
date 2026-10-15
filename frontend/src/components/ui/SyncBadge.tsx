import clsx from 'clsx';
import { timeAgo } from '@/lib/format';
import type { SyncStatus } from '@/types/api';

const LABEL: Record<SyncStatus, string> = {
  connected: 'Synced',
  syncing: 'Syncing',
  needs_reconnect: 'Needs reconnect',
  error: 'Sync failed',
};

/**
 * Broker name · last sync time · state (docs/DESIGN.md §7). Amber for anything
 * that needs the person to act; the words carry the state, never colour alone.
 */
export function SyncBadge({ broker, status, lastSyncedAt, className }: {
  broker: string; status: SyncStatus; lastSyncedAt: string | null; className?: string;
}) {
  const attention = status === 'needs_reconnect' || status === 'error';
  return (
    // Wraps on narrow cards: three parts are wider than a phone column.
    <span className={clsx('pill inline-flex max-w-full flex-wrap items-center gap-x-2 gap-y-0.5 whitespace-normal text-caption',
      attention ? 'text-warn' : 'text-fg-2', className)}>
      <span aria-hidden="true" className={clsx('h-1.5 w-1.5 rounded-full', attention ? 'bg-warn' : 'bg-fg-3')} />
      <span className="text-fg">{broker}</span>
      <span aria-hidden="true">·</span>
      <span>{lastSyncedAt ? `synced ${timeAgo(lastSyncedAt)}` : 'never synced'}</span>
      <span aria-hidden="true">·</span>
      <span>{LABEL[status]}</span>
    </span>
  );
}
