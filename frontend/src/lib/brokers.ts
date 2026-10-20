import { apiPost } from '@/lib/api';
import type { BrokerKeep, BrokerName } from '@/types/api';

// Mirrors the API (flint_api/brokers).
export const BROKER_LABEL: Record<BrokerName, string> = {
  zerodha: 'Zerodha',
  upstox: 'Upstox',
  groww: 'Groww',
  angel: 'Angel One',
  fyers: 'FYERS',
  dhan: 'Dhan',
  indmoney: 'INDmoney',
  binance: 'Binance',
};

/** Each company's own icon, saved from its website into public/brokers. */
export const brokerLogo = (broker: BrokerName) => `/brokers/${broker}.png`;

/**
 * The one-time login values each OAuth broker sends back to its callback page.
 * Brokers connected with a pasted token or key have no callback.
 */
export const CALLBACK_PARAMS: Record<BrokerName, string[]> = {
  zerodha: ['request_token'],
  upstox: ['code'],
  groww: [],
  angel: ['auth_token', 'feed_token'],
  fyers: ['auth_code'],
  dhan: ['tokenId'],
  indmoney: [],
  binance: [],
};

/** Only brokers with a login page have a callback route. */
export const isBroker = (b: string | undefined): b is BrokerName =>
  Boolean(b && b in BROKER_LABEL && CALLBACK_PARAMS[b as BrokerName].length);

/** Where the broker must send users back to, as registered in its developer console. */
export const callbackUrl = (broker: BrokerName) =>
  `${window.location.origin}/settings/brokers/callback${broker === 'zerodha' ? '' : `/${broker}`}`;

const CHANNEL = 'polaris-brokers';

/**
 * What a broker login starts from: the user's own broker-app keys and how long
 * to keep them, or an existing connection whose saved keys are reused.
 */
export type ConnectStart =
  | { app: Record<string, string>; keep: BrokerKeep; keep_until?: string }
  | { connection_id: string };

/**
 * Starts a broker login in a new tab, so Polaris stays open here. The tab is
 * opened before the API call, inside the click, or popup blockers stop it.
 * The login state, with the app keys, is an httpOnly cookie shared with the
 * new tab. Falls back to this tab if the browser refuses new tabs.
 */
export async function startBrokerConnect(broker: BrokerName, start: ConnectStart): Promise<void> {
  const tab = window.open('', '_blank');
  if (tab) tab.opener = null; // the broker's page gets no handle on this one
  try {
    const { redirect_url } = await apiPost<{ redirect_url: string }>(
      `/api/brokers/${broker}/connect`, { ...start, redirect_uri: callbackUrl(broker) });
    if (tab && !tab.closed) tab.location.href = redirect_url;
    else window.location.assign(redirect_url);
  } catch (err) {
    tab?.close();
    throw err;
  }
}

/** Tells every Polaris tab that broker connections changed. */
export function announceBrokersChanged(): void {
  try {
    const ch = new BroadcastChannel(CHANNEL);
    ch.postMessage('changed');
    ch.close();
  } catch {
    // No BroadcastChannel: the other tab refreshes on its next load.
  }
}

/** Runs `cb` when another tab connects or disconnects a broker. Returns the unsubscribe. */
export function onBrokersChanged(cb: () => void): () => void {
  try {
    const ch = new BroadcastChannel(CHANNEL);
    ch.onmessage = () => cb();
    return () => ch.close();
  } catch {
    return () => {};
  }
}
