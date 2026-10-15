'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState } from 'react';
import { startZerodhaConnect } from '@/components/settings/Brokers';
import { Button, ButtonLink } from '@/components/ui/Button';
import { LoadingBlock } from '@/components/ui/States';
import { useToast } from '@/components/ui/Toast';
import { usePortfolio } from '@/context/PortfolioContext';
import { apiPost, errorMessage } from '@/lib/api';
import type { BrokerConnection } from '@/types/api';

type Outcome =
  | { kind: 'working' }
  | { kind: 'cancelled' }
  | { kind: 'error'; message: string }
  | { kind: 'done'; connection: BrokerConnection; holdings: number | null; syncError: string | null };

/**
 * Zerodha sends the browser here after login with ?request_token&status&state.
 * The token and state go to the API once (through the BFF, so the exchange is
 * tied to this signed-in user); the API checks the state was issued to them.
 */
function Callback() {
  const params = useSearchParams();
  const router = useRouter();
  const toast = useToast();
  const { refresh } = usePortfolio();
  const sent = useRef(false);
  // Read once: the address bar is cleared right after the first render.
  const [link] = useState(() => ({
    token: params.get('request_token'),
    state: params.get('state'),
    ok: params.get('status') === 'success',
  }));
  const [outcome, setOutcome] = useState<Outcome>(
    link.ok && link.token && link.state ? { kind: 'working' } : { kind: 'cancelled' });
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    // Keep the one-time token out of the address bar and history.
    window.history.replaceState(null, '', window.location.pathname);
    // The state is single use: never post it twice (React runs effects twice in development).
    if (sent.current || !link.ok || !link.token || !link.state) return;
    sent.current = true;
    apiPost<{ connection: BrokerConnection; sync: { holdings?: number; error?: string } }>(
      '/api/brokers/zerodha/session', { request_token: link.token, state: link.state })
      .then(({ connection, sync }) => {
        setOutcome({ kind: 'done', connection, holdings: sync.holdings ?? null, syncError: sync.error ?? null });
        void refresh();
        toast.show({ message: 'Zerodha connected' });
      })
      .catch((err) => setOutcome({ kind: 'error', message: errorMessage(err) }));
  }, [link, refresh, toast]);

  const retry = async () => {
    setRetrying(true);
    try {
      await startZerodhaConnect();
    } catch (err) {
      setOutcome({ kind: 'error', message: errorMessage(err) });
      setRetrying(false);
    }
  };

  return (
    <section aria-live="polite" className="glass mx-auto flex w-full max-w-xl flex-col gap-4 rounded-2xl p-5 md:p-6">
      <h1 className="text-h3 font-medium">
        {outcome.kind === 'working' ? 'Connecting Zerodha'
          : outcome.kind === 'done' ? 'Zerodha connected'
          : outcome.kind === 'cancelled' ? 'Connection cancelled'
          : 'Zerodha didn’t connect'}
      </h1>

      {outcome.kind === 'working' && <LoadingBlock lines={2} label="Connecting Zerodha" />}

      {outcome.kind === 'done' && (
        <>
          <p className="text-body-sm text-fg-2">
            {outcome.syncError
              ? `Connected as ${outcome.connection.broker_user_id}, but the first sync didn’t finish: ${outcome.syncError} Try “Sync now” from Settings.`
              : `Connected as ${outcome.connection.broker_user_id}. ${outcome.holdings ?? 0} holding${outcome.holdings === 1 ? '' : 's'} synced. Polaris can only read this account.`}
          </p>
          <div className="flex flex-wrap gap-2">
            <ButtonLink href="/portfolio">See your portfolio</ButtonLink>
            <Button variant="secondary" onClick={() => router.push('/settings#brokers-h')}>Back to Settings</Button>
          </div>
        </>
      )}

      {outcome.kind === 'cancelled' && (
        <>
          <p className="text-body-sm text-fg-2">Zerodha didn&apos;t finish signing in, so nothing was connected.</p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={retry} loading={retrying}>Try again</Button>
            <ButtonLink href="/settings#brokers-h" variant="secondary">Back to Settings</ButtonLink>
          </div>
        </>
      )}

      {outcome.kind === 'error' && (
        <>
          <p className="text-body-sm text-fg-2">{outcome.message}</p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={retry} loading={retrying}>Start again</Button>
            <ButtonLink href="/settings#brokers-h" variant="secondary">Back to Settings</ButtonLink>
          </div>
        </>
      )}
    </section>
  );
}

export default function BrokerCallbackPage() {
  return (
    <Suspense fallback={<LoadingBlock lines={2} label="Connecting Zerodha" />}>
      <Callback />
    </Suspense>
  );
}
