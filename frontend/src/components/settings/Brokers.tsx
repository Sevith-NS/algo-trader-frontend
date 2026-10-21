'use client';

import clsx from 'clsx';
import Image from 'next/image';
import { useEffect, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Field, inputClass } from '@/components/ui/Field';
import { ErrorState, LoadingBlock } from '@/components/ui/States';
import { SyncBadge } from '@/components/ui/SyncBadge';
import { useToast } from '@/components/ui/Toast';
import { usePortfolio } from '@/context/PortfolioContext';
import { ApiError, apiDelete, apiPost, errorMessage } from '@/lib/api';
import { announceBrokersChanged, brokerLogo, callbackUrl, onBrokersChanged, startBrokerConnect } from '@/lib/brokers';
import { useApi } from '@/lib/useApi';
import type { BrokerConnection, BrokerKeep, BrokerName, BrokersResponse } from '@/types/api';

type Available = BrokersResponse['available'][number];

const SCOPE_COPY: Record<string, string> = {
  'profile:read': 'Your client ID and name',
  'holdings:read': 'Your holdings: quantity, average price, last price',
  'positions:read': 'Today’s positions: quantity and average price',
};

const KEEP_OPTIONS: { value: BrokerKeep; label: (a: Available) => string }[] = [
  { value: 'session', label: () => 'Until I close this browser' },
  { value: 'token', label: (a) => (a.auth === 'oauth' ? `Until today’s ${a.label} session ends` : 'Until the token expires') },
  { value: '7d', label: () => '7 days' },
  { value: '30d', label: () => '30 days' },
  { value: '90d', label: () => '90 days' },
  { value: 'custom', label: () => 'Custom date…' },
];

const when = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' });
const day = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' });

/** YYYY-MM-DD, local, `days` from today: the bounds of the custom date picker. */
function isoDay(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function BrokerLogo({ broker, size = 32 }: { broker: BrokerName; size?: number }) {
  return <Image src={brokerLogo(broker)} alt="" width={size} height={size} className="shrink-0 rounded-md" />;
}

function ReadOnlyNote() {
  return (
    <p className="max-w-prose text-body-sm text-fg-2">
      Polaris only reads from your broker, live, and stores nothing about it: each connection, with your broker app&apos;s
      keys, is an encrypted cookie in this browser, kept for as long as you choose. It can&apos;t place orders, move money
      or change anything in your account. Broker logins open in a new tab; brokers end sessions daily (Zerodha at 6:00
      IST), so you&apos;ll reconnect once a day, in one click.
    </p>
  );
}

/** The redirect URL the user must save on their broker app, with a copy button. */
function RedirectUrl({ broker }: { broker: BrokerName }) {
  const [copied, setCopied] = useState(false);
  const url = callbackUrl(broker);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // No clipboard permission: the URL is selectable as text.
    }
  };
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-table text-fg-2">Redirect URL for your app</p>
      <div className="flex items-center gap-2">
        <code className="min-w-0 flex-1 break-all rounded-md bg-white/[0.06] px-2 py-1.5 text-caption text-fg">{url}</code>
        <Button type="button" variant="ghost" onClick={() => void copy()}>{copied ? 'Copied' : 'Copy'}</Button>
      </div>
    </div>
  );
}

/**
 * Connect form for every broker: the user's own broker-app keys (OAuth
 * brokers, then their login page) or a pasted read-only token or key, and how
 * long Polaris may keep them, like a GitHub token's expiration.
 */
function ConnectDialog({ broker, maxKeepDays, open, onClose, onLinked, onStarted }: {
  broker: Available | null; maxKeepDays: number; open: boolean; onClose: () => void; onLinked: () => void;
  onStarted: (a: Available) => void;
}) {
  return (
    <Dialog open={open} onClose={onClose} title={broker ? `Connect ${broker.label}` : 'Connect'}>
      {broker && <ConnectForm key={broker.broker} broker={broker} maxKeepDays={maxKeepDays} onClose={onClose}
                              onLinked={onLinked} onStarted={onStarted} />}
    </Dialog>
  );
}

function ConnectForm({ broker, maxKeepDays, onClose, onLinked, onStarted }: {
  broker: Available; maxKeepDays: number; onClose: () => void; onLinked: () => void; onStarted: (a: Available) => void;
}) {
  const toast = useToast();
  const oauth = broker.auth === 'oauth';
  const [values, setValues] = useState<Record<string, string>>({});
  const [keep, setKeep] = useState<BrokerKeep>(oauth ? '30d' : 'token');
  const [until, setUntil] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const complete = broker.fields.every((f) => (values[f.name] ?? '').trim()) && (keep !== 'custom' || until);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!complete) { setError('Fill in every field.'); return; }
    setBusy(true);
    setError(null);
    const keys = Object.fromEntries(broker.fields.map((f) => [f.name, values[f.name].trim()]));
    // The end of the picked day, in this browser's time zone.
    const keepUntil = keep === 'custom' ? new Date(`${until}T23:59:59`).toISOString() : undefined;
    try {
      if (oauth) {
        await startBrokerConnect(broker.broker, { app: keys, keep, keep_until: keepUntil });
        onStarted(broker);
      } else {
        await apiPost(`/api/brokers/${broker.broker}/link`, { credentials: keys, keep, keep_until: keepUntil });
        toast.show({ message: `${broker.label} connected` });
        announceBrokersChanged();
        onLinked();
      }
      onClose();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
      <div className="flex items-center gap-3">
        <BrokerLogo broker={broker.broker} size={40} />
        <p className="text-body-sm text-fg-2">
          {broker.help}{' '}
          <a href={broker.help_url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">
            {oauth ? `Open ${broker.label} developer apps` : `Open ${broker.label}`}
          </a>
        </p>
      </div>
      {oauth && <RedirectUrl broker={broker.broker} />}
      {broker.fields.map((f) => (
        <Field key={f.name} id={`cred-${f.name}`} label={f.label}>
          <input id={`cred-${f.name}`} type={f.secret ? 'password' : 'text'} autoComplete="off" spellCheck={false}
                 value={values[f.name] ?? ''} className={inputClass}
                 onChange={(e) => { setValues((v) => ({ ...v, [f.name]: e.target.value })); setError(null); }} />
        </Field>
      ))}
      <Field id="cred-keep" label="Keep this connection" error={error}
             hint={oauth ? `Your ${broker.label} session still ends every day; until then, reconnecting reuses these keys.`
               : undefined}>
        <select id="cred-keep" value={keep} className={inputClass}
                onChange={(e) => { setKeep(e.target.value as BrokerKeep); setError(null); }}>
          {KEEP_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label(broker)}</option>)}
        </select>
      </Field>
      {keep === 'custom' && (
        <Field id="cred-until" label="Keep until">
          <input id="cred-until" type="date" min={isoDay(1)} max={isoDay(maxKeepDays - 1)} value={until}
                 className={inputClass} onChange={(e) => { setUntil(e.target.value); setError(null); }} />
        </Field>
      )}
      <p className="text-caption text-fg-3">
        Kept only in this browser, encrypted, and forgotten when the time you picked runs out or you disconnect.
        Polaris checks {oauth ? 'them' : 'it'} with {broker.label} and never stores {oauth ? 'them' : 'it'} anywhere else.
      </p>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
        <Button type="submit" loading={busy} disabled={!complete}>
          {oauth ? `Continue to ${broker.label}` : `Connect ${broker.label}`}
        </Button>
      </div>
    </form>
  );
}

function Connection({ c, onChanged, onReconnect }: {
  c: BrokerConnection; onChanged: () => void; onReconnect: (c: BrokerConnection) => void;
}) {
  const toast = useToast();
  const { refresh } = usePortfolio();
  const [confirming, setConfirming] = useState(false);
  const [typed, setTyped] = useState('');
  const [removing, setRemoving] = useState(false);
  const [removeError, setRemoveError] = useState('');
  const needsReconnect = c.status === 'needs_reconnect';
  const label = c.broker_user_name ? `${c.broker_user_name} (${c.broker_user_id})` : c.broker_user_id;
  const kept = c.session_only ? 'Kept until you close this browser'
    : `Keys kept until ${day.format(new Date(c.kept_until))}`;

  const remove = async (e: FormEvent) => {
    e.preventDefault();
    setRemoving(true);
    setRemoveError('');
    try {
      await apiDelete(`/api/brokers/${c.id}`);
      setConfirming(false);
      toast.show({ message: `${c.label} disconnected` });
      announceBrokersChanged();
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
      <div className="flex min-w-0 items-start gap-3">
        <BrokerLogo broker={c.broker} size={36} />
        <div className="flex min-w-0 flex-col gap-2">
          <p className="text-body font-medium">{c.label} <span className="text-fg-2">· {label}</span></p>
          <SyncBadge broker={c.label} status={c.status} lastSyncedAt={null} className="self-start" />
          <ul className="flex flex-col gap-0.5 text-caption text-fg-3">
            {!needsReconnect && <li>{c.label} session ends {when.format(new Date(c.token_expires_at))}</li>}
            <li>{kept}</li>
            {c.scopes.map((s) => <li key={s}>Reads: {SCOPE_COPY[s] ?? s}</li>)}
          </ul>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {needsReconnect && <Button onClick={() => onReconnect(c)}>Reconnect {c.label}</Button>}
        <Button variant="ghost" onClick={() => setConfirming(true)}>Disconnect</Button>
      </div>

      <Dialog open={confirming} onClose={() => { setConfirming(false); setTyped(''); setRemoveError(''); }}
              title={`Disconnect ${c.label}`}>
        <form onSubmit={remove} className="flex flex-col gap-4" noValidate>
          <p className="text-body-sm text-fg-2">
            This forgets the {c.broker_user_id} login and its keys in this browser now, and ends its session with
            {' '}{c.label}. Nothing changes in your {c.label} account. You can connect again any time.
          </p>
          <Field id={`disconnect-${c.id}`} label={`Type ${c.broker_user_id} to confirm`} error={removeError || null}>
            <input id={`disconnect-${c.id}`} autoComplete="off" autoCapitalize="characters" value={typed}
                   onChange={(e) => setTyped(e.target.value)} className={inputClass}
                   aria-invalid={Boolean(removeError)} aria-describedby={removeError ? `disconnect-${c.id}-error` : undefined} />
          </Field>
          <Button type="submit" variant="danger" loading={removing}
                  disabled={typed.trim().toUpperCase() !== c.broker_user_id.toUpperCase()}>
            Disconnect
          </Button>
        </form>
      </Dialog>
    </li>
  );
}

export function Brokers() {
  const toast = useToast();
  const { data, error, loading, reload } = useApi<BrokersResponse>('/api/brokers');
  const { refresh } = usePortfolio();
  const [starting, setStarting] = useState<BrokerName | null>(null);
  // An OAuth login open in another tab; cleared when that tab reports back.
  const [waiting, setWaiting] = useState<Available | null>(null);
  const [connecting, setConnecting] = useState<Available | null>(null);

  useEffect(() => onBrokersChanged(() => { setWaiting(null); reload(); void refresh(); }), [reload, refresh]);

  const changed = () => { reload(); void refresh(); };

  /** OAuth reconnects reuse the saved app keys: one click. Pasted tokens need a new one. */
  const reconnect = async (c: BrokerConnection, a: Available) => {
    if (a.auth === 'keys') { setConnecting(a); return; }
    setStarting(a.broker);
    try {
      await startBrokerConnect(a.broker, { connection_id: c.id });
      setWaiting(a);
    } catch (err) {
      const msg = err instanceof ApiError && err.status === 503
        ? 'Broker connections aren’t available on this server right now.' : errorMessage(err);
      toast.show({ message: msg, tone: 'error' });
      if (err instanceof ApiError && err.status === 404) setConnecting(a); // keys gone: enter them again
    } finally {
      setStarting(null);
    }
  };

  if (loading && !data) return <LoadingBlock lines={3} label="Loading broker connections" />;
  if (error && !data) return <ErrorState error={error} title="Couldn't load your brokers" onRetry={reload} />;
  if (!data) return null;

  const byName = new Map(data.available.map((a) => [a.broker, a]));

  return (
    <div className="flex flex-col gap-5">
      {data.connections.length > 0 && (
        <ul className="flex flex-col gap-3">
          {data.connections.map((c) => (
            <Connection key={c.id} c={c} onChanged={reload}
                        onReconnect={(conn) => { const a = byName.get(conn.broker); if (a) void reconnect(conn, a); }} />
          ))}
        </ul>
      )}

      {waiting && (
        <div role="status" className="well flex flex-col gap-2 rounded-xl p-4 text-body-sm">
          <p className="font-medium">Finish logging in to {waiting.label} in the new tab.</p>
          <p className="text-fg-2">
            When you&apos;re done, {waiting.label} should bring you back to Polaris and this page updates by itself. If
            you stay on {waiting.label} after logging in, the Redirect URL saved on your {waiting.label} developer app is
            wrong. It must be exactly:
          </p>
          <code className="break-all rounded-md bg-white/[0.06] px-2 py-1 text-caption text-fg">{callbackUrl(waiting.broker)}</code>
          <div><Button variant="ghost" onClick={() => setWaiting(null)}>Dismiss</Button></div>
        </div>
      )}

      <div className="flex flex-col gap-3">
        <h3 className="text-body font-medium">{data.connections.length ? 'Connect another account' : 'Connect a broker'}</h3>
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {data.available.map((a) => (
            <li key={a.broker}>
              <button type="button" onClick={() => setConnecting(a)} disabled={!a.configured || starting !== null}
                      aria-describedby={`broker-${a.broker}-how`}
                      className={clsx('well flex min-h-16 w-full items-center gap-3 rounded-xl p-3 text-left transition-colors duration-fast',
                        a.configured ? 'hover:bg-white/[0.06]' : 'cursor-not-allowed opacity-50')}>
                <BrokerLogo broker={a.broker} />
                <span className="flex min-w-0 flex-col">
                  <span className="text-body-sm font-medium">{starting === a.broker ? `Opening ${a.label}…` : a.label}</span>
                  <span id={`broker-${a.broker}-how`} className="text-caption text-fg-3">
                    {!a.configured ? 'Not available on this server'
                      : a.auth === 'keys' ? (a.markets.includes('crypto') ? 'Read-only API key' : 'Paste an access token')
                      : 'Your own API app'}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <ReadOnlyNote />
      <ConnectDialog broker={connecting} maxKeepDays={data.max_keep_days} open={connecting !== null}
                     onClose={() => setConnecting(null)} onLinked={changed} onStarted={setWaiting} />
    </div>
  );
}
