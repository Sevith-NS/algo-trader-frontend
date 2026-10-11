'use client';

import clsx from 'clsx';
import { AlertTriangle } from '@/components/ui/icons';
import { scoreColor } from './deskFormat';

/** The small mono caps used for every field label across the desk panels. */
export function MicroLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={clsx('text-caption text-textMuted', className)}>
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
    <div className="relative w-full bg-ink-2" style={{ height }}>
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

/** Conviction /10 as a filled meter. */
export function ConvictionMeter({ value, color }: { value: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 overflow-hidden bg-ink-2">
        <div
          className="h-full"
          style={{ width: `${Math.max(0, Math.min(10, value)) * 10}%`, background: color }}
        />
      </div>
      <span className="text-caption tabular text-textSecondary">{value}/10</span>
    </div>
  );
}

/** A coloured pill for a call, action, stance or grade. */
export function Chip({
  label, color, size = 'sm', title,
}: { label: string; color: string; size?: 'sm' | 'lg'; title?: string }) {
  return (
    <span
      title={title}
      className={clsx(
        'inline-block whitespace-nowrap rounded-md font-semibold',
        size === 'lg' ? 'px-2.5 py-0.5 text-lg font-bold tracking-tight' : 'px-1.5 py-0.5 text-caption',
      )}
      style={{ color, background: `${color}1a` }}
    >
      {label}
    </span>
  );
}

/** A tinted panel keyed to an accent, matching the AI Deep Dive treatment. */
export function TintPanel({
  color, children, className,
}: { color: string; children: React.ReactNode; className?: string }) {
  return (
    <div
      className={clsx('rounded-xl p-4', className)}
      style={{ border: `1px solid ${color}40`, background: `${color}0d` }}
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
    <div className="flex items-start gap-2 rounded-lg border border-accentAmber/25 bg-accentAmber/[0.06] p-2.5">
      <AlertTriangle size={13} className="mt-0.5 shrink-0 text-accentAmber" />
      <p className="text-caption leading-relaxed text-textSecondary">{message}</p>
    </div>
  );
}

/** Label / value row matching the Terminal's StatRow. */
export function DeskStat({
  label, value, valueClass, title,
}: { label: string; value: React.ReactNode; valueClass?: string; title?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1" title={title}>
      <span className="text-caption text-textMuted">{label}</span>
      <span className={clsx('text-[13px] font-medium tabular text-textPrimary', valueClass)}>{value}</span>
    </div>
  );
}
