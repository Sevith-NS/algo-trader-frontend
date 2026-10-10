// Client for the multi-agent trading desk (backend/agents_desk.py).
//
// The run endpoint is POST — the paper portfolio travels in the body, not a
// query string — which rules out EventSource, so the SSE frames are read off
// the fetch body stream instead. That is the whole reason for the hand-rolled
// frame parser below.

import { API_BASE } from './api';
import type { DeskEvent, JournalResponse } from '../types/agents';

export interface DeskRunRequest {
  symbol: string;
  rounds?: number;
  portfolio?: {
    balance: number;
    positions: { symbol: string; shares: number; averagePrice: number }[];
  };
}

/** Thrown for a 429 so the caller can show the countdown instead of "failed". */
export class DeskRateLimited extends Error {
  retryAfter: number | null;
  constructor(retryAfter: number | null) {
    super(
      `Rate limited. A desk run is roughly a dozen model calls, so it has its own quota. Try again in ${
        retryAfter ?? 'a few'
      } seconds.`,
    );
    this.name = 'DeskRateLimited';
    this.retryAfter = retryAfter;
  }
}

function retryAfterFrom(res: Response, body: unknown): number | null {
  const header = res.headers.get('Retry-After');
  if (header && Number.isFinite(Number(header))) return Number(header);
  const seconds = (body as { retry_after_seconds?: number })?.retry_after_seconds;
  return typeof seconds === 'number' ? Math.ceil(seconds) : null;
}

/**
 * Stream one desk run, invoking `onEvent` per agent turn.
 *
 * Resolves when the stream ends. Aborting via `signal` rejects with an
 * AbortError, which callers are expected to swallow — a user who navigated
 * away or hit Stop does not need an error panel.
 */
export async function streamDesk(
  req: DeskRunRequest,
  onEvent: (event: DeskEvent) => void,
  signal?: AbortSignal,
): Promise<void> {
  const res = await fetch(`${API_BASE}/api/agents/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...req, stream: true }),
    signal,
  });

  if (!res.ok) {
    // An error before the stream opens is JSON, not SSE.
    const body = await res.json().catch(() => null);
    if (res.status === 429) throw new DeskRateLimited(retryAfterFrom(res, body));
    throw new Error(
      (body as { error?: string })?.error || `The desk could not start (${res.status}).`,
    );
  }
  if (!res.body) throw new Error('This browser cannot read the desk stream.');

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  // SSE frames are separated by a blank line. Chunk boundaries fall anywhere,
  // so a partial frame stays in the buffer until its terminator arrives.
  const drain = (flush = false) => {
    let split = buffer.indexOf('\n\n');
    while (split !== -1) {
      const frame = buffer.slice(0, split);
      buffer = buffer.slice(split + 2);
      emit(frame);
      split = buffer.indexOf('\n\n');
    }
    if (flush && buffer.trim()) {
      emit(buffer);
      buffer = '';
    }
  };

  const emit = (frame: string) => {
    const line = frame.split('\n').find((l) => l.startsWith('data:'));
    if (!line) return;
    try {
      onEvent(JSON.parse(line.slice(5).trim()) as DeskEvent);
    } catch {
      // A single malformed frame is not worth ending the run over.
    }
  };

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      drain();
    }
    buffer += decoder.decode();
    drain(true);
  } finally {
    reader.releaseLock();
  }
}

export async function fetchJournal(symbol?: string, limit = 60): Promise<JournalResponse> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (symbol) params.set('symbol', symbol);
  const res = await fetch(`${API_BASE}/api/agents/journal?${params}`);
  const body = await res.json().catch(() => null);
  if (res.status === 429) throw new DeskRateLimited(retryAfterFrom(res, body));
  if (!res.ok) {
    throw new Error((body as { error?: string })?.error || 'The decision journal is unavailable.');
  }
  return body as JournalResponse;
}

export async function deleteJournalEntry(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/agents/journal/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error((body as { error?: string })?.error || 'Could not delete that decision.');
  }
}
