'use client';

import clsx from 'clsx';
import { usePathname } from 'next/navigation';
import { Fragment, useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { MessageSquare, Send, X } from '@/components/ui/icons';
import { usePortfolio } from '@/context/PortfolioContext';
import { apiPost, errorMessage } from '@/lib/api';

type ChatMessage = { role: 'user' | 'assistant'; content: string; error?: boolean };

const SUGGESTIONS = [
  'How risky is my portfolio right now?',
  'Explain this trade plan in plain words',
  'What would make this setup wrong?',
];

/**
 * Model text is rendered as plain React text, never as HTML: **bold** and
 * bullet lines are the only formatting, parsed into elements here.
 */
function render(text: string): ReactNode {
  return text.split('\n').map((line, i) => {
    const bullet = /^\s*[-*•]\s+/.test(line);
    const body = line.replace(/^\s*[-*•]\s+/, '');
    const parts = body.split(/\*\*(.+?)\*\*/g).map((p, j) =>
      j % 2 ? <strong key={j} className="font-medium text-fg">{p}</strong> : <Fragment key={j}>{p}</Fragment>);
    return <p key={i} className={clsx('min-h-[0.75em]', bullet && 'pl-4 -indent-3')}>{bullet && '• '}{parts}</p>;
  });
}

export default function AIAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const { book, positions } = usePortfolio();
  const pathname = usePathname();
  const symbol = pathname?.startsWith('/s/') ? decodeURIComponent(pathname.split('/')[2] ?? '') || undefined : undefined;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, loading]);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  function close() {
    setOpen(false);
    launcherRef.current?.focus();
  }

  const send = async (text?: string, e?: FormEvent) => {
    e?.preventDefault();
    const content = (text ?? input).trim().slice(0, 4000);
    if (!content || loading) return;
    const next: ChatMessage[] = [...messages.filter((m) => !m.error), { role: 'user', content }];
    setMessages(next);
    setInput('');
    setLoading(true);
    try {
      const res = await apiPost<{ reply: string }>('/api/ai-chat', {
        messages: next.slice(-20).map(({ role, content: c }) => ({ role, content: c })),
        symbol,
        portfolio: {
          currency: book?.account.currency,
          cash_balance: book ? Number(book.cash) : undefined,
          positions: positions.slice(0, 12).map((p) => ({ symbol: p.symbol, quantity: p.shares, average_cost: p.averagePrice })),
        },
      });
      setMessages((m) => [...m, { role: 'assistant', content: res.reply }]);
    } catch (err) {
      setMessages((m) => [...m, { role: 'assistant', content: errorMessage(err), error: true }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {!open && (
        <button ref={launcherRef} type="button" onClick={() => setOpen(true)}
                className="fixed bottom-[calc(72px+env(safe-area-inset-bottom,0px))] right-4 z-30 flex min-h-11 items-center gap-2 border border-control bg-ink-1 px-3 text-body-sm text-fg hover:border-fg-3 lg:bottom-6 lg:right-6">
          <MessageSquare size={16} />
          Ask Flint
        </button>
      )}

      {open && (
        <section role="dialog" aria-modal="false" aria-labelledby="assistant-h"
                 className="fixed inset-0 z-50 flex flex-col border-line bg-ink-1 pt-[env(safe-area-inset-top,0px)] sm:inset-auto sm:bottom-6 sm:right-6 sm:h-[min(640px,80vh)] sm:w-[400px] sm:border">
          <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-2">
            <div>
              <h2 id="assistant-h" className="text-body font-medium">Ask Flint</h2>
              <p className="text-caption text-fg-3">{symbol ? `Looking at ${symbol} and your portfolio` : 'Sees your paper portfolio'}</p>
            </div>
            <button type="button" onClick={close} aria-label="Close assistant"
                    className="grid min-h-11 min-w-11 place-items-center text-fg-2 hover:text-fg">
              <X />
            </button>
          </div>

          <div ref={scrollRef} aria-live="polite" className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-4 text-body-sm">
            {messages.length === 0 && (
              <div className="flex flex-col gap-3">
                <p className="text-fg-2">Ask about your positions, risk, or the plan on screen. Answers cite the live numbers Flint has.</p>
                {SUGGESTIONS.map((s) => (
                  <button key={s} type="button" onClick={() => send(s)}
                          className="min-h-11 border border-line px-3 text-left text-fg-2 hover:border-control hover:text-fg">
                    {s}
                  </button>
                ))}
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={clsx('flex flex-col gap-1', m.role === 'user' && 'items-end')}>
                <span className="text-caption text-fg-3">{m.role === 'user' ? 'You' : 'Flint'}</span>
                <div className={clsx('max-w-[90%] leading-6',
                  m.role === 'user' ? 'border border-line bg-ink-2 px-3 py-2 text-fg' : m.error ? 'text-down' : 'text-fg-2')}>
                  {render(m.content)}
                </div>
              </div>
            ))}
            {loading && <p role="status" className="text-fg-3">Reading the live data</p>}
          </div>

          <form onSubmit={(e) => send(undefined, e)} className="border-t border-line p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
            <div className="flex items-end gap-2">
              <label htmlFor="assistant-input" className="sr-only">Message</label>
              <textarea id="assistant-input" ref={inputRef} rows={1} value={input} maxLength={4000}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void send(); } }}
                        placeholder="Ask about a ticker, your risk, a plan"
                        className="max-h-32 min-h-11 flex-1 resize-none border border-control bg-ink-0 px-3 py-2.5 text-body-sm text-fg placeholder:text-fg-3 focus-visible:border-up" />
              <button type="submit" disabled={!input.trim() || loading} aria-label="Send"
                      className="grid min-h-11 min-w-11 place-items-center bg-up text-ink-0 disabled:opacity-40">
                <Send size={16} />
              </button>
            </div>
            <p className="mt-2 text-caption text-fg-3">Educational analysis on paper trades, not financial advice.</p>
          </form>
        </section>
      )}
    </>
  );
}
