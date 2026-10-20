'use client';

import clsx from 'clsx';
import { AlertTriangle } from '@/components/ui/icons';
import { scoreColor } from './deskFormat';
import { tint } from '../../lib/theme';

/** The small mono caps used for every field label across the desk panels. */
export function MicroLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={clsx('text-caption text-fg-3', className)}>
      {children}
    </div>
  );
}

/**
 * Center-anchored bar for a signed score in [-1, 1] — the same treatment the
 * quant factor votes and pillar attribution already use, so an analyst's score
 * reads on the same axis as the deterministic engine's.
 */
export function ScoreBar({ score, height = 6 }: { score: number; height?: number }) {
  const width = Math.min(Math.abs(score), 1) * 50;
  const color = scoreColor(score);
  return (
    <div className="relative w-full bg-white/[0.06]" style={{ height }}>
      <div className="absolute left-1/2 top-0 h-full w-px bg-line-strong" />
      <div
        className="absolute top-0"
        style={{
          height,
          background: color,
          ...(score >= 0 ? { left: '50%', width: `${width}%` } : { right: '50%', width: `${width}%` }),
        }}
      />
    </div>
  );
}


/** A tinted panel keyed to an accent, matching the AI Deep Dive treatment. */
export function TintPanel({
  color, children, className,
}: { color: string; children: React.ReactNode; className?: string }) {
  return (
    <div
      className={clsx('rounded-xl p-4', className)}
      style={{ border: `1px solid ${tint(color, 25)}`, background: tint(color, 5) }}
    >
      {children}
    </div>
  );
}

/**
 * Shown in place of an agent's output when its model call failed. A seat that
 * could not file is information — the run continued without it — so it renders
 * rather than silently disappearing.
 */
export function SeatError({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-warn/25 bg-warn/[0.06] p-2.5">
      <AlertTriangle size={13} className="mt-0.5 shrink-0 text-warn" />
      <p className="text-caption leading-relaxed text-fg-2">{message}</p>
    </div>
  );
}

/** Label / value row matching the Terminal's StatRow. */
export function DeskStat({
  label, value, valueClass, title,
}: { label: string; value: React.ReactNode; valueClass?: string; title?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1" title={title}>
      <span className="text-caption text-fg-3">{label}</span>
      <span className={clsx('text-[13px] font-medium tabular text-fg', valueClass)}>{value}</span>
    </div>
  );
}
