'use client';

import clsx from 'clsx';
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { X } from './icons';

type Toast = {
  id: number;
  message: string;
  tone: 'neutral' | 'error';
  action?: { label: string; onClick: () => void };
};

type ShowArgs = Omit<Toast, 'id' | 'tone'> & { tone?: Toast['tone']; durationMs?: number };

const ToastContext = createContext<{ show: (t: ShowArgs) => void } | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}

/**
 * Toasts confirm what just happened and, for reversible actions, offer Undo.
 * They sit in a polite live region so screen readers announce them without
 * interrupting, and they never steal focus.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => setToasts((all) => all.filter((t) => t.id !== id)), []);

  const show = useCallback(({ durationMs = 10_000, tone = 'neutral', ...rest }: ShowArgs) => {
    const id = nextId.current++;
    setToasts((all) => [...all.slice(-2), { id, tone, ...rest }]);
    window.setTimeout(() => dismiss(id), durationMs);
  }, [dismiss]);

  const value = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div aria-live="polite" aria-atomic="false"
           className="pointer-events-none fixed inset-x-4 bottom-[calc(72px+env(safe-area-inset-bottom,0px))] z-[60] flex flex-col items-center gap-2 lg:bottom-6 lg:left-auto lg:right-6 lg:items-end">
        {toasts.map((t) => (
          <div key={t.id} role={t.tone === 'error' ? 'alert' : 'status'}
               className={clsx('glass-2 pointer-events-auto relative flex w-full max-w-sm items-center justify-between gap-3 rounded-lg py-2 pl-4 pr-1 text-body-sm',
                 t.tone === 'error' && 'glass-down')}>
            <span>{t.message}</span>
            <span className="flex items-center">
              {t.action && (
                <button type="button" className="min-h-8 px-2 font-medium text-fg underline-offset-4 hover:underline"
                        onClick={() => { t.action?.onClick(); dismiss(t.id); }}>
                  {t.action.label}
                </button>
              )}
              <button type="button" aria-label="Dismiss" onClick={() => dismiss(t.id)}
                      className="grid min-h-8 min-w-8 place-items-center text-fg-3 hover:text-fg">
                <X size={14} />
              </button>
            </span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
