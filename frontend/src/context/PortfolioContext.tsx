'use client';

/**
 * The signed-in user's paper account, read from the server ledger.
 *
 * v1 kept the portfolio in localStorage, so clearing the browser erased the
 * track record and nothing tied it to the user. Now the server is the record:
 * this context only caches what /api/accounts returns and re-reads it after
 * every order. Prices for orders are set by the server, never sent from here.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { apiGet, apiPost } from '@/lib/api';
import type { Account, OrderResult, PositionsResponse, Profile } from '@/types/api';

/** Shape older components read (agents desk, assistant context). */
export type Position = { symbol: string; shares: number; averagePrice: number };

type PortfolioState = {
  loading: boolean;
  error: unknown;
  profile: Profile | null;
  /** Every account, paper and real. `account` is the paper one this context trades. */
  accounts: Account[];
  account: Account | null;
  book: PositionsResponse | null;
  /** Cash in the account currency. */
  balance: number;
  positions: Position[];
  refresh: () => Promise<void>;
  placeOrder: (symbol: string, side: 'buy' | 'sell', quantity: number,
               extra?: { stop_price?: number; note?: string }) => Promise<OrderResult>;
};

const PortfolioContext = createContext<PortfolioState | null>(null);

export function PortfolioProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [account, setAccount] = useState<Account | null>(null);
  const [book, setBook] = useState<PositionsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const refresh = useCallback(async () => {
    try {
      const [me, accounts] = await Promise.all([
        apiGet<Profile>('/api/me'),
        apiGet<{ accounts: Account[] }>('/api/accounts'),
      ]);
      setProfile(me);
      setAccounts(accounts.accounts);
      // Real (broker) accounts are read-only; this context drives paper trading.
      const acct = accounts.accounts.find((a) => a.kind === 'paper') ?? null;
      setAccount(acct);
      setBook(acct ? await apiGet<PositionsResponse>(`/api/accounts/${acct.id}/positions`) : null);
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial load; every later refresh is triggered by an order or a retry.
    const id = window.setTimeout(() => { void refresh(); }, 0);
    return () => window.clearTimeout(id);
  }, [refresh]);

  const placeOrder = useCallback<PortfolioState['placeOrder']>(async (symbol, side, quantity, extra) => {
    if (!account) throw new Error('No paper account yet.');
    const result = await apiPost<OrderResult>(`/api/accounts/${account.id}/orders`, {
      symbol, side, quantity: String(quantity),
      // One id per submission: a double tap or a retry lands once.
      client_order_id: crypto.randomUUID(),
      ...(extra?.stop_price ? { stop_price: String(extra.stop_price) } : {}),
      ...(extra?.note ? { note: extra.note } : {}),
    });
    await refresh();
    return result;
  }, [account, refresh]);

  const value = useMemo<PortfolioState>(() => ({
    loading, error, profile, accounts, account, book, refresh, placeOrder,
    balance: book ? Number(book.cash) : 0,
    positions: (book?.positions ?? []).map((p) => ({
      symbol: p.symbol, shares: Number(p.quantity), averagePrice: Number(p.avg_cost),
    })),
  }), [loading, error, profile, accounts, account, book, refresh, placeOrder]);

  return <PortfolioContext.Provider value={value}>{children}</PortfolioContext.Provider>;
}

export function usePortfolio() {
  const ctx = useContext(PortfolioContext);
  if (!ctx) throw new Error('usePortfolio must be used inside <PortfolioProvider>');
  return ctx;
}
