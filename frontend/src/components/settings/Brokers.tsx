'use client';

import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Field, inputClass } from '@/components/ui/Field';
import { EmptyState, ErrorState, LoadingBlock } from '@/components/ui/States';
import { SyncBadge } from '@/components/ui/SyncBadge';
import { useToast } from '@/components/ui/Toast';
import { usePortfolio } from '@/context/PortfolioContext';
import { ApiError, apiDelete, apiPost, errorMessage } from '@/lib/api';
import { useApi } from '@/lib/useApi';
import type { BrokerConnection, BrokersResponse, SyncResult } from '@/types/api';

const SCOPE_COPY: Record<string, string> = {
  'profile:read': 'Your Zerodha client ID and name',
  'holdings:read': 'Your holdings: quantity, average price, last price',
};

/** Starts the Kite login. The browser leaves Polaris and comes back to /settings/brokers/callback. */
export async function startZerodhaConnect(): Promise<void> {
  const { redirect_url } = await apiPost<{ redirect_url: string }>('/api/brokers/zerodha/connect', {});
  window.location.assign(redirect_url);
}

function ReadOnlyNote() {
  return (
    <p className="max-w-prose text-body-sm text-fg-2">
      Polaris only reads from your broker. It can&apos;t place orders, move money or change anything in your account.
      Zerodha ends every session at 6:00 IST, so you&apos;ll reconnect once a day to sync again.
    </p>
  );
}

function Connection({ c, onChanged }: { c: BrokerConnection; onChanged: () => void }) {
  const toast = useToast();
  const { refresh } = usePortfolio();
  const [busy, setBusy] = useState<'sync' | 'reconnect' | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [typed, setTyped] = useState('');
  const [removing, setRemoving] = useState(false);
  const [removeError, setRemoveError] = useState('');
  const needsReconnect = c.status === 'needs_reconnect';
  const label = c.broker_user_name ? `${c.broker_user_name} (${c.broker_user_id})` : c.broker_user_id;

  const sync = async () => {
    setBusy('sync');
    try {
      const r = await apiPost<SyncResult>(`/api/brokers/${c.id}/sync`, {});
      toast.show({ message: `Synced ${r.holdings} holding${r.holdings === 1 ? '' : 's'}` +
        (r.skipped ? `; ${r.skipped} not supported yet` : '') });
    } catch (err) {
      toast.show({ message: errorMessage(err), tone: 'error' });
    } finally {
      setBusy(null);
      onChanged();
      void refresh();
    }
  };

  const reconnect = async () => {
    setBusy('reconnect');
    try {
      await startZerodhaConnect();
    } catch (err) {
      toast.show({ message: errorMessage(err), tone: 'error' });
      setBusy(null);
    }
  };

  const remove = async (e: FormEvent) => {
    e.preventDefault();
    setRemoving(true);
    setRemoveError('');
    try {
      await apiDelete(`/api/brokers/${c.id}`);
      setConfirming(false);
      toast.show({ message: 'Zerodha disconnected' });
      onChanged();
      void refresh();
    } catch (err) {
      setRemoveError(errorMessage(err));
    } finally {
      setRemoving(false);
    }
  };

  return (
    <li className="well flex flex-col gap-4 rounded-xl p-4 md:flex-row md:items-center md:justify-between">
      <div className="flex min-w-0 flex-col gap-2">
        <p className="text-body font-medium">Zerodha <span className="text-fg-2">· {label}</span></p>
        <SyncBadge broker="Zerodha" status={c.status} lastSyncedAt={c.last_synced_at} className="self-start" />
        {c.status === 'error' && c.last_error && <p className="text-caption text-warn">{c.last_error}</p>}
        <ul className="flex flex-col gap-0.5 text-caption text-fg-3">
          {c.scopes.map((s) => <li key={s}>Reads: {SCOPE_COPY[s] ?? s}</li>)}
        </ul>
      </div>
      <div className="flex flex-wrap gap-2">
        {needsReconnect
          ? <Button onClick={reconnect} loading={busy === 'reconnect'}>Reconnect Zerodha</Button>
          : <Button variant="secondary" onClick={sync} loading={busy === 'sync'} disabled={busy !== null}>Sync now</Button>}
        <Button variant="ghost" onClick={() => setConfirming(true)}>Disconnect</Button>
      </div>

      <Dialog open={confirming} onClose={() => { setConfirming(false); setTyped(''); setRemoveError(''); }}
              title="Disconnect Zerodha">
        <form onSubmit={remove} className="flex flex-col gap-4" noValidate>
          <p className="text-body-sm text-fg-2">
            This removes the {c.broker_user_id} account from Polaris, with its synced holdings and performance history.
            Nothing changes in your Zerodha account. You can connect again any time.
          </p>
          <Field id={`disconnect-${c.id}`} label={`Type ${c.broker_user_id} to confirm`} error={removeError || null}>
            <input id={`disconnect-${c.id}`} autoComplete="off" autoCapitalize="characters" value={typed}
                   onChange={(e) => setTyped(e.target.value)} className={inputClass}
                   aria-invalid={Boolean(removeError)} aria-describedby={removeError ? `disconnect-${c.id}-error` : undefined} />
          </Field>
          <Button type="submit" variant="danger" loading={removing}
                  disabled={typed.trim().toUpperCase() !== c.broker_user_id.toUpperCase()}>
            Disconnect and remove data
          </Button>
        </form>
      </Dialog>
    </li>
  );
}

export function Brokers() {
  const toast = useToast();
  const { data, error, loading, reload } = useApi<BrokersResponse>('/api/brokers');
  const [connecting, setConnecting] = useState(false);
  const zerodha = data?.available.find((a) => a.broker === 'zerodha');

  const connect = async () => {
    setConnecting(true);
    try {
      await startZerodhaConnect();
    } catch (err) {
      const msg = err instanceof ApiError && err.status === 503
        ? 'Zerodha isn’t set up on this server yet.' : errorMessage(err);
      toast.show({ message: msg, tone: 'error' });
      setConnecting(false);
    }
  };

  if (loading && !data) return <LoadingBlock lines={3} label="Loading broker connections" />;
  if (error && !data) return <ErrorState error={error} title="Couldn't load your brokers" onRetry={reload} />;
  if (!data) return null;

  const connectButton = zerodha?.configured
    ? <Button onClick={connect} loading={connecting}>Connect Zerodha</Button>
    : <p className="text-body-sm text-warn">Zerodha isn&apos;t set up on this server yet.</p>;

  if (!data.connections.length) {
    return (
      <div className="flex flex-col gap-4">
        <EmptyState title="No broker connected" action={connectButton}>
          Connect Zerodha to see your real holdings next to your paper portfolio. Real and paper are never added together.
        </EmptyState>
        <ReadOnlyNote />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col gap-3">
        {data.connections.map((c) => <Connection key={c.id} c={c} onChanged={reload} />)}
      </ul>
      <ReadOnlyNote />
      {zerodha?.configured && (
        <div><Button variant="secondary" onClick={connect} loading={connecting}>Connect another Zerodha login</Button></div>
      )}
    </div>
  );
}
