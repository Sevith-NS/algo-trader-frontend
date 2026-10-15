import Link from 'next/link';
import clsx from 'clsx';
import { Layers, RefreshCw } from '@/components/ui/icons';
import type { LevelRow } from '../../types/discover';
import { fmtPrice } from '../intel/format';
import Sparkline from './Sparkline';

/**
 * One name sitting at a respected level.
 *
 * The hero here is the DISTANCE — how far price is from the level is the whole
 * reason the row exists, so it gets the largest type, and the level price sits
 * directly under it. Side is carried by an explicit "SUPPORT"/"RESISTANCE"
 * word as well as color, per the non-color-redundancy requirement.
 */

const SIDE_STYLES = {
  resistance: {
    chip: 'border-down/30 bg-down/10 text-down',
    rail: 'bg-down',
    label: 'Resistance',
  },
  support: {
    chip: 'border-up/30 bg-up/10 text-up',
    rail: 'bg-up',
    label: 'Support',
  },
} as const;

export default function LevelCard({ row }: { row: LevelRow }) {
  const side = SIDE_STYLES[row.side];
  // The level is above spot for resistance, below for support — say which way
  // in words rather than relying on the sign of a number.
  const direction = row.distance_pct >= 0 ? 'above' : 'below';

  return (
    <Link
      href={`/s/${encodeURIComponent(row.symbol)}`}
      className="glass rounded-xl relative block overflow-hidden p-4 transition-colors hover:bg-white/[0.06] focus-visible:ring-1 focus-visible:ring-fg-2/50"
    >
      {/* Side rail: the one place color alone is used, and it is decorative —
          every fact it encodes is also written out below. */}
      <span className={clsx('absolute left-0 top-0 h-full w-0.5', side.rail)} aria-hidden="true" />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-semibold text-fg">{row.symbol}</div>
          <div className="truncate text-xs text-fg-3">{row.name}</div>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-sm font-semibold tabular text-fg">
            {fmtPrice(row.price, row.currency)}
          </div>
          <div className="text-caption text-fg-3">spot</div>
        </div>
      </div>

      <div className="mt-3 flex items-end justify-between gap-3">
        <div>
          <div className="text-2xl font-bold tabular leading-none text-fg">
            {Math.abs(row.distance_pct).toFixed(1)}%
          </div>
          <div className="mt-1 text-caption text-fg-2">
            {direction} · {side.label.toLowerCase()} at{' '}
            <span className="tabular text-fg">{fmtPrice(row.level, row.currency)}</span>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-sm font-semibold tabular text-fg">
            {row.distance_sigmas.toFixed(1)}σ
          </div>
          <div className="text-caption text-fg-3">of a daily move</div>
        </div>
      </div>

      <div className="mt-3">
        <Sparkline data={row.spark} />
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        <span className={clsx('rounded border px-1.5 py-0.5 text-caption', side.chip)}>
          {side.label}
        </span>
        <span className="rounded border border-line bg-white/[0.06] px-1.5 py-0.5 text-caption text-fg-2">
          {row.timeframe}
        </span>
        <span className="rounded border border-line bg-white/[0.06] px-1.5 py-0.5 text-caption text-fg-2">
          <span className="tabular">{row.touches}</span> touches
        </span>
        {row.confluence && (
          <span
            title="A level at this price exists on both the daily and the weekly"
            className="flex items-center gap-1 rounded border border-fg-2/30 bg-fg-2/10 px-1.5 py-0.5 text-caption text-fg-2"
          >
            <Layers size={9} /> D+W
          </span>
        )}
        {row.flipped && (
          <span
            title="Has acted as both support and resistance"
            className="flex items-center gap-1 rounded border border-fg-2/30 bg-fg-2/10 px-1.5 py-0.5 text-caption text-fg-2"
          >
            <RefreshCw size={9} /> Flip
          </span>
        )}
      </div>

      <p className="mt-2 text-caption leading-snug text-fg-3">{row.reason}</p>

      <div className="mt-2 flex items-center gap-2 border-t border-line pt-2">
        <span className="text-caption text-fg-3">Level quality</span>
        {/* The bar is a redundant read of the number beside it, not the only one. */}
        <div className="h-1 flex-1 overflow-hidden bg-white/[0.06]">
          <div
            className="h-full bg-fg-2/70"
            style={{ width: `${Math.max(0, Math.min(100, row.score))}%` }}
          />
        </div>
        <span className="tabular text-caption text-fg-2">{row.score.toFixed(0)}</span>
      </div>
    </Link>
  );
}
