'use client';

import { useEffect, useState } from 'react';
import { apiGet, errorMessage } from './api';
import type { SearchResult } from '@/types/api';

/** Yahoo sends EQUITY / ETF / CRYPTOCURRENCY; show Equity, ETF, Cryptocurrency. */
const sentenceCase = (s?: string) => (!s ? s : s.length <= 4 ? s : s[0] + s.slice(1).toLowerCase());

export type SymbolOption = { symbol: string; name?: string; meta?: string };

export function toOption(r: SearchResult): SymbolOption {
  return { symbol: r.symbol, name: r.shortname || r.longname,
           meta: [sentenceCase(r.quoteType), r.exchDisp].filter(Boolean).join(' · ') };
}

/**
 * Symbol search as you type: debounced, and a newer query aborts the older
 * request so results never arrive out of order. Shared by the command palette
 * and the watchlist's add box.
 */
export function useSymbolSearch(query: string, delayMs = 180) {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [error, setError] = useState('');

  useEffect(() => {
    const q = query.trim();
    if (!q) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setStatus('loading');
      setResults([]);
      apiGet<{ quotes: SearchResult[] }>(`/api/search?q=${encodeURIComponent(q)}`, controller.signal)
        .then((d) => { setResults(d.quotes); setStatus('idle'); })
        .catch((err) => {
          if ((err as Error).name === 'AbortError') return;
          setError(errorMessage(err));
          setStatus('error');
        });
    }, delayMs);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [query, delayMs]);

  return { results, status, error };
}
