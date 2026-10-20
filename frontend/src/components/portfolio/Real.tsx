'use client';

import Link from 'next/link';
import { ButtonLink } from '@/components/ui/Button';
import { Change } from '@/components/ui/Change';
import { ModeBadge } from '@/components/ui/ModeBadge';
import { EmptyState, ErrorState, LoadingBlock, Skeleton } from '@/components/ui/States';
import { SyncBadge } from '@/components/ui/SyncBadge';
import { BROKER_LABEL } from '@/lib/brokers';
import { formatMoney, formatNumber, timeAgo } from '@/lib/format';
import type { Account, HoldingRow } from '@/types/api';
import { useRealHoldings } from './useRealHoldings';

type Row = HoldingRow & { accountName: string };

const qtyDigits = (q: string) => (Number(q) % 1 === 0 ? 0 : 4);

/** Sum in the base currency, or null if any part has no FX rate: a partial total would mislead. */
function sumBase(values: (string | null)[]): number | null {
  let total = 0;
  for (const v of values) {
    if (v === null) return null;
    total += Number(v);
  }
  return total;
}

function useReal(accounts: Account[]) {
  // Holdings are read live; a broker that needs a reconnect can't be read, and the summary says so.
  const live = accounts.filter((a) => a.sync?.status === 'connected');
  const { data: fetched, error, loading, reload } = useRealHoldings(live.map((a) => a.id));
  const data = live.length ? fetched : [];
  const rows: Row[] = (data ?? []).flatMap((h) =>
    h.holdings.map((r) => ({ ...r, accountName: h.account.name })));
  return { data, rows, error, loading, reload, live };
}

/** Header figures for one real account or all of them together. Never mixed with paper. */
export function RealSummary({ accounts, label }: { accounts: Account[]; label: string }) {
  const { data, rows, error, loading, reload } = useReal(accounts);

  if (loading && !data) {
    return <div className="glass flex flex-wrap gap-8 rounded-2xl p-6"><Skeleton className="h-10 w-56" /><Skeleton className="h-10 w-32" /></div>;
  }
  if (error && !data) return <ErrorState error={error} title="Couldn't load your real holdings" onRetry={reload} />;
  if (!data) return null;

  const base = data[0]?.base_currency ?? accounts[0]?.currency ?? 'INR';
  const value = sumBase(data.map((h) => h.totals.market_value_base));
  // Rows without a known cost (crypto balances) count towards value, not P&L.
  const costed = rows.filter((r) => r.unrealized_pnl !== null && r.invested !== null);
  const pnl = sumBase(costed.map((r) => (r.fx_rate === null ? null : String(Number(r.unrealized_pnl) * Number(r.fx_rate)))));
  const invested = sumBase(costed.map((r) => (r.fx_rate === null ? null : String(Number(r.invested) * Number(r.fx_rate)))));
  const oldest = data.map((h) => h.as_of).filter((t): t is string => Boolean(t)).sort()[0];
  const attention = accounts.filter((a) => a.sync && a.sync.status !== 'connected');

  return (
    <section aria-label="Real holdings summary" className="glass rounded-2xl p-5 md:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <span className="flex items-center gap-3">
          <ModeBadge mode="real" />
          <span className="text-body-sm text-fg">{label}</span>
        </span>
        <span className="text-caption text-fg-2">Read-only from your broker, never added to paper totals</span>
      </div>
      <dl className="flex flex-wrap items-end gap-x-10 gap-y-4">
        <div className="flex flex-col gap-1">
          <dt className="text-caption text-fg-2">Real value ({base})</dt>
          <dd className="text-silver text-figure tabular md:text-[56px] md:leading-[60px]">
            {value === null ? <span className="text-h3 text-warn">Unavailable</span> : formatMoney(value, base)}
          </dd>
        </div>
        <div className="flex flex-col gap-1">
          <dt className="text-caption text-fg-2">Unrealised</dt>
          <dd className="text-h4">
            {pnl === null || invested === null ? '–'
              : <Change amount={pnl} pct={invested ? (pnl / invested) * 100 : null} currency={base} />}
          </dd>
        </div>
        <div className="flex flex-col gap-1">
          <dt className="text-caption text-fg-2">Holdings</dt>
          <dd className="text-h4 tabular">{rows.length}</dd>
        </div>
      </dl>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {accounts.map((a) => a.sync && (
          <SyncBadge key={a.id} broker={accounts.length > 1 || !a.broker ? a.name : BROKER_LABEL[a.broker]} status={a.sync.status}
                     lastSyncedAt={a.sync.last_synced_at} />
        ))}
      </div>
      <p className="mt-3 text-caption text-fg-3">
        Read live from your broker{oldest ? ` ${timeAgo(oldest)}` : ''}. Polaris stores none of it.
        {value === null && ' An exchange rate is unavailable, so the total in your base currency is left out.'}
      </p>
      {attention.length > 0 && (
        <p className="mt-3 text-body-sm text-warn">
          {attention.length === 1 ? `${attention[0].name} needs` : 'Some accounts need'} a reconnect before Polaris can read them.{' '}
          <Link href="/settings#brokers-h" className="underline underline-offset-4">Open Brokers in Settings</Link>
        </p>
      )}
    </section>
  );
}

/** Holdings table for real accounts: currency per row, value in the base currency, no trade actions. */
export function RealHoldings({ accounts }: { accounts: Account[] }) {
  const { data, rows, error, loading, reload, live } = useReal(accounts);
  const multi = accounts.length > 1;

  if (loading && !data) return <LoadingBlock lines={6} label="Loading holdings" />;
  if (error && !data) return <ErrorState error={error} onRetry={reload} />;
  if (!data) return null;
  const base = data[0]?.base_currency ?? 'INR';

  if (!rows.length) {
    return (
      <EmptyState title={live.length ? 'No holdings' : 'Reconnect to see holdings'}
                  action={<ButtonLink href="/settings#brokers-h" variant="secondary">Open Brokers</ButtonLink>}>
        {live.length
          ? 'Your broker has no NSE or BSE holdings on this account right now.'
          : 'Your broker session has ended. Reconnect in Settings and your holdings load live again.'}
      </EmptyState>
    );
  }

  const sorted = [...rows].sort((a, b) => Number(b.market_value_base ?? b.market_value) - Number(a.market_value_base ?? a.market_value));

  return (
    <section aria-label="Real holdings" className="glass flex flex-col gap-4 rounded-2xl p-5 md:p-6">
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-table">
          <caption className="sr-only">Real holdings, read-only, live from the broker</caption>
          <thead>
            <tr className="border-b border-white/10 text-left text-caption text-fg-3">
              <th scope="col" className="py-2 font-normal">Symbol</th>
              {multi && <th scope="col" className="py-2 font-normal">Account</th>}
              <th scope="col" className="py-2 text-right font-normal">Quantity</th>
              <th scope="col" className="py-2 text-right font-normal">Avg price</th>
              <th scope="col" className="py-2 text-right font-normal">Last</th>
              <th scope="col" className="py-2 text-right font-normal">Day</th>
              <th scope="col" className="py-2 text-right font-normal">Value ({base})</th>
              <th scope="col" className="py-2 text-right font-normal">Unrealised</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((r) => (
              <tr key={`${r.accountName}:${r.symbol}`} className="border-b border-white/[0.07] last:border-0">
                <th scope="row" className="py-3 text-left font-normal">
                  <Link href={`/s/${encodeURIComponent(r.symbol)}`} className="ticker hover:underline">{r.broker_symbol}</Link>
                  <span className="ml-2 text-caption text-fg-3">{r.exchange}</span>
                </th>
                {multi && <td className="py-3 text-fg-2">{r.accountName}</td>}
                <td className="py-3 text-right tabular">{formatNumber(r.quantity, qtyDigits(r.quantity))}</td>
                <td className="py-3 text-right tabular">{r.avg_price !== null ? formatMoney(r.avg_price, r.currency) : '–'}</td>
                <td className="py-3 text-right tabular">{r.last_price !== null ? formatMoney(r.last_price, r.currency) : '–'}</td>
                <td className="py-3 text-right">{r.day_change_pct !== null ? <Change pct={r.day_change_pct} /> : '–'}</td>
                <td className="py-3 text-right tabular">
                  {r.market_value_base !== null ? formatMoney(r.market_value_base, base) : <span className="text-warn">Unavailable</span>}
                </td>
                <td className="py-3 text-right">
                  {r.unrealized_pnl !== null ? <Change amount={r.unrealized_pnl} pct={r.unrealized_pnl_pct} currency={r.currency} /> : '–'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="flex flex-col divide-y divide-white/[0.07] md:hidden">
        {sorted.map((r) => (
          <li key={`${r.accountName}:${r.symbol}`}>
            <Link href={`/s/${encodeURIComponent(r.symbol)}`} className="flex min-h-16 items-center justify-between gap-4 py-3">
              <span className="flex min-w-0 flex-col">
                <span className="ticker">{r.broker_symbol}</span>
                <span className="text-caption text-fg-3 tabular">
                  {formatNumber(r.quantity, qtyDigits(r.quantity))}
                  {r.avg_price !== null && ` at ${formatMoney(r.avg_price, r.currency)}`}
                  {multi && ` · ${r.accountName}`}
                </span>
              </span>
              <span className="flex flex-col items-end">
                <span className="tabular">
                  {r.market_value_base !== null ? formatMoney(r.market_value_base, base) : <span className="text-warn">Unavailable</span>}
                </span>
                {r.unrealized_pnl !== null
                  && <Change amount={r.unrealized_pnl} pct={r.unrealized_pnl_pct} currency={r.currency} className="text-caption" />}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <p className="text-caption text-fg-3">
        Read-only and live from your broker; values in {base} use the latest exchange rate. Crypto balances carry no
        purchase price, so they have no P&amp;L. Polaris can&apos;t trade {multi ? 'these accounts' : 'this account'}.
      </p>
    </section>
  );
}
