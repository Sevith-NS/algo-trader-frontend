'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState } from 'react';
import { AlertSheet, CHECK_NOTE, describeAlert } from '@/components/alerts/AlertSheet';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/Button';
import { EmptyState, ErrorState, LoadingBlock } from '@/components/ui/States';
import { Tabs } from '@/components/ui/Tabs';
import { useToast } from '@/components/ui/Toast';
import { apiDelete, apiPatch, apiPost, errorMessage } from '@/lib/api';
import { formatNumber, formatPct, timeAgo } from '@/lib/format';
import { announceAlertsSeen } from '@/lib/useAlertCount';
import { useApi } from '@/lib/useApi';
import type { Alert, AlertFiring, AlertStatus } from '@/types/api';

const TAB_IDS: AlertStatus[] = ['active', 'triggered', 'paused'];
const TAB_LABEL: Record<AlertStatus, string> = { active: 'Active', triggered: 'Triggered', paused: 'Paused' };
const EMPTY: Record<AlertStatus, string> = {
  active: 'No active alerts. Create one to hear when a price crosses a level or moves sharply.',
  triggered: 'Nothing has fired yet. Fired alerts land here, with the price that set them off.',
  paused: 'No paused alerts. Pause one to stop it firing without deleting it.',
};

function Row({ a, firing, onChanged, onEdit }: {
  a: Alert; firing?: AlertFiring; onChanged: () => void; onEdit: (a: Alert) => void;
}) {
  const toast = useToast();
  const [busy, setBusy] = useState<string | null>(null);

  const act = async (label: string, run: () => Promise<unknown>, done: string) => {
    setBusy(label);
    try {
      await run();
      toast.show({ message: done });
      onChanged();
    } catch (err) {
      toast.show({ message: errorMessage(err), tone: 'error' });
    } finally {
      setBusy(null);
    }
  };
  const setStatus = (status: 'active' | 'paused', done: string) =>
    act(status, () => apiPatch(`/api/alerts/${a.id}`, { status }), done);

  return (
    <li className="flex flex-col gap-3 py-4 md:flex-row md:items-center md:justify-between">
      <div className="flex min-w-0 flex-col gap-1">
        <p className="text-body">
          <Link href={`/s/${encodeURIComponent(a.symbol)}`} className="hover:underline">{describeAlert(a)}</Link>
        </p>
        {a.note && <p className="text-body-sm text-fg-2">{a.note}</p>}
        <p className="text-caption text-fg-3 tabular">
          {a.status === 'triggered' && a.triggered_at
            ? `Fired ${timeAgo(a.triggered_at)}${firing ? ` at ${formatNumber(firing.price, 2)}` : ''}`
            : `Created ${timeAgo(a.created_at)}${a.reference_price ? ` when the price was ${formatNumber(a.reference_price, 2)}` : ''}`}
          {a.status === 'active' && a.last_checked_at && ` · last checked ${timeAgo(a.last_checked_at)}`}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {a.status === 'triggered' && (
          <Button variant="secondary" loading={busy === 'active'} onClick={() => setStatus('active', 'Alert is on again')}>
            Turn on again
          </Button>
        )}
        {a.status === 'paused' && (
          <Button variant="secondary" loading={busy === 'active'} onClick={() => setStatus('active', 'Alert resumed')}>
            Resume
          </Button>
        )}
        <Button variant="ghost" onClick={() => onEdit(a)}>Edit</Button>
        {a.status === 'active' && (
          <Button variant="ghost" loading={busy === 'paused'} onClick={() => setStatus('paused', 'Alert paused')}>
            Pause
          </Button>
        )}
        <Button variant="ghost" loading={busy === 'delete'}
                onClick={() => act('delete', () => apiDelete(`/api/alerts/${a.id}`), 'Alert deleted')}>
          Delete
        </Button>
      </div>
    </li>
  );
}

function Firings({ firings }: { firings: AlertFiring[] }) {
  if (!firings.length) return null;
  return (
    <section aria-labelledby="firings-h" className="flex flex-col gap-2 border-t border-white/10 pt-4">
      <h2 id="firings-h" className="text-micro uppercase text-fg-2">Recent firings</h2>
      <ul className="flex flex-col divide-y divide-white/[0.07]">
        {firings.map((f) => (
          <li key={f.id} className="flex min-h-11 flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2 text-body-sm">
            <span className="flex items-center gap-2">
              {!f.seen && <span className="pill text-fg">New</span>}
              {describeAlert(f)}
            </span>
            <span className="text-caption text-fg-3 tabular">
              {formatNumber(f.price, 2)}{f.change_pct !== null && ` (${formatPct(f.change_pct)} on the day)`} · {timeAgo(f.fired_at)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function AlertsPage() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const requested = params.get('tab') as AlertStatus | null;
  const tab: AlertStatus = requested && TAB_IDS.includes(requested) ? requested : 'active';
  const alerts = useApi<{ alerts: Alert[] }>('/api/alerts');
  const firings = useApi<{ firings: AlertFiring[]; unseen: number }>(tab === 'triggered' ? '/api/alerts/firings?limit=20' : null);
  const [sheet, setSheet] = useState<{ open: boolean; alert?: Alert }>({ open: false });
  const markedSeen = useRef(false);

  // Opening the Triggered tab is what "seeing" a firing means: clear the bell.
  // The list keeps showing them as New for this visit.
  useEffect(() => {
    if (tab !== 'triggered' || !firings.data?.unseen || markedSeen.current) return;
    markedSeen.current = true;
    apiPost('/api/alerts/firings/seen', {}).then(announceAlertsSeen).catch(() => { markedSeen.current = false; });
  }, [tab, firings.data]);

  const setTab = (next: AlertStatus) => router.replace(`${pathname}?tab=${next}`, { scroll: false });
  const all = alerts.data?.alerts ?? [];
  const count = (s: AlertStatus) => all.filter((a) => a.status === s).length;
  const shown = all.filter((a) => a.status === tab);
  const latestFiring = (id: string) => firings.data?.firings.find((f) => f.alert_id === id);
  const reload = () => { alerts.reload(); firings.reload(); };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader level={1} title="Alerts" className="mb-2"
                  actions={<Button onClick={() => setSheet({ open: true })}>New alert</Button>} />
      <section aria-label="Your alerts" className="glass flex flex-col gap-2 rounded-2xl p-5 md:p-6">
        <Tabs tabs={TAB_IDS.map((id) => ({ id, label: alerts.data ? `${TAB_LABEL[id]} (${count(id)})` : TAB_LABEL[id] }))}
              value={tab} onChange={setTab} label="Alert status" idPrefix="alerts" />
        <div role="tabpanel" id={`alerts-panel-${tab}`} aria-labelledby={`alerts-tab-${tab}`} className="flex flex-col gap-2">
          {alerts.loading && !alerts.data ? <LoadingBlock lines={4} label="Loading alerts" />
            : alerts.error && !alerts.data ? <ErrorState error={alerts.error} title="Couldn't load your alerts" onRetry={alerts.reload} />
            : shown.length ? (
              <ul className="flex flex-col divide-y divide-white/[0.07]">
                {shown.map((a) => <Row key={a.id} a={a} firing={latestFiring(a.id)} onChanged={reload}
                                       onEdit={(alert) => setSheet({ open: true, alert })} />)}
              </ul>
            ) : (
              <EmptyState title={`No ${TAB_LABEL[tab].toLowerCase()} alerts`} className="mt-3"
                          action={tab === 'active' && <Button variant="secondary" onClick={() => setSheet({ open: true })}>New alert</Button>}>
                {EMPTY[tab]}
              </EmptyState>
            )}
          {tab === 'triggered' && firings.data && <Firings firings={firings.data.firings} />}
        </div>
        <p className="pt-2 text-caption text-fg-3">{CHECK_NOTE}</p>
      </section>
      <AlertSheet open={sheet.open} alert={sheet.alert} onClose={() => setSheet((s) => ({ ...s, open: false }))}
                  onSaved={() => { reload(); setTab(sheet.alert ? tab : 'active'); }} />
    </div>
  );
}

export default function Alerts() {
  return <Suspense fallback={<LoadingBlock lines={4} label="Loading alerts" />}><AlertsPage /></Suspense>;
}
