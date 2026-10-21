'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button, ButtonLink } from '@/components/ui/Button';
import { LoadingBlock } from '@/components/ui/States';
import { useToast } from '@/components/ui/Toast';
import { usePortfolio } from '@/context/PortfolioContext';
import { apiPost, errorMessage } from '@/lib/api';
import { BROKER_LABEL, CALLBACK_PARAMS, announceBrokersChanged } from '@/lib/brokers';
import type { BrokerConnection, BrokerName } from '@/types/api';

type Outcome =
  | { kind: 'working' }
  | { kind: 'cancelled' }
  | { kind: 'error'; message: string }
  | { kind: 'done'; connection: BrokerConnection };

/**
 * The broker sends the browser here (in the tab the connect opened) after
 * login, with its one-time login values and, for most brokers, our state.
 * They go to the API once, through the BFF, which adds this browser's sealed
 * state cookie; the API checks that cookie was issued to this user for this
 * broker. The connection itself comes back as another sealed cookie.
 */
function Callback({ broker }: { broker: BrokerName }) {
  const params = useSearchParams();
  const toast = useToast();
  const { refresh } = usePortfolio();
  const sent = useRef(false);
  const name = BROKER_LABEL[broker];
  // Read once: the address bar is cleared right after the first render.
  const [link] = useState(() => {
    const values = Object.fromEntries(CALLBACK_PARAMS[broker]
      .map((k) => [k, params.get(k)] as const).filter((e): e is readonly [string, string] => Boolean(e[1])));
    return {
      values,
      state: params.get('state'),
      // Zerodha also reports the outcome; the others just omit the values on cancel.
      ok: params.get('status') !== 'cancelled' && params.get('status') !== 'error'
        && Boolean(values[CALLBACK_PARAMS[broker][0]]),
    };
  });
  const [outcome, setOutcome] = useState<Outcome>(link.ok ? { kind: 'working' } : { kind: 'cancelled' });

  useEffect(() => {
    // Keep the one-time values out of the address bar and history.
    window.history.replaceState(null, '', window.location.pathname);
    // The state is single use: never post it twice (React runs effects twice in development).
    if (sent.current || !link.ok) return;
    sent.current = true;
    apiPost<{ connection: BrokerConnection }>(`/api/brokers/${broker}/session`,
      { ...(link.state ? { state: link.state } : {}), params: link.values })
      .then(({ connection }) => {
        setOutcome({ kind: 'done', connection });
        announceBrokersChanged(); // the Polaris tab that started this refreshes
        void refresh();
        toast.show({ message: `${name} connected` });
      })
      .catch((err) => setOutcome({ kind: 'error', message: errorMessage(err) }));
  }, [broker, link, name, refresh, toast]);

  // Closes this tab when Polaris opened it; otherwise the browser ignores it.
  const closeTab = () => window.close();

  return (
    <section aria-live="polite" className="glass mx-auto flex w-full max-w-xl flex-col gap-4 rounded-2xl p-5 md:p-6">
      <h1 className="text-h3 font-medium">
        {outcome.kind === 'working' ? `Connecting ${name}`
          : outcome.kind === 'done' ? `${name} connected`
          : outcome.kind === 'cancelled' ? 'Connection cancelled'
          : `${name} didn’t connect`}
      </h1>

      {outcome.kind === 'working' && <LoadingBlock lines={2} label={`Connecting ${name}`} />}

      {outcome.kind === 'done' && (
        <>
          <p className="text-body-sm text-fg-2">
            Connected as {outcome.connection.broker_user_id}. Polaris can only read this account. Your other
            Polaris tab has been updated, so you can close this one.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={closeTab}>Close this tab</Button>
            <ButtonLink href="/watchlists" variant="secondary">See broker watchlist</ButtonLink>
          </div>
        </>
      )}

      {outcome.kind === 'cancelled' && (
        <>
          <p className="text-body-sm text-fg-2">{name} didn&apos;t finish signing in, so nothing was connected.</p>
          <div className="flex flex-wrap gap-2">
            {/* The app keys travelled in the one-time login state, so a new try starts from Settings. */}
            <ButtonLink href="/settings#brokers-h">Back to Settings</ButtonLink>
            <Button variant="secondary" onClick={closeTab}>Close this tab</Button>
          </div>
        </>
      )}

      {outcome.kind === 'error' && (
        <>
          <p className="text-body-sm text-fg-2">{outcome.message}</p>
          <div className="flex flex-wrap gap-2">
            <ButtonLink href="/settings#brokers-h">Back to Settings</ButtonLink>
            <Button variant="secondary" onClick={closeTab}>Close this tab</Button>
          </div>
        </>
      )}
    </section>
  );
}

export function BrokerCallback({ broker }: { broker: BrokerName }) {
  return (
    <Suspense fallback={<LoadingBlock lines={2} label={`Connecting ${BROKER_LABEL[broker]}`} />}>
      <Callback broker={broker} />
    </Suspense>
  );
}
