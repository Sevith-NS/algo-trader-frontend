'use client';

import { ModeBadge } from '@/components/ui/ModeBadge';
import { usePortfolio } from '@/context/PortfolioContext';
import { ALL_REAL, usePortfolioSelection } from './selection';

/**
 * Which book you're looking at: All real, each real account, each paper
 * portfolio (docs/DESIGN.md §7). A native select keeps keyboard, screen
 * reader and phone pickers right; the badge beside it says Real or Paper.
 */
export function PortfolioSwitcher() {
  const { accounts } = usePortfolio();
  const { selection, select } = usePortfolioSelection();
  const real = accounts.filter((a) => a.kind === 'real');
  const paper = accounts.filter((a) => a.kind === 'paper');
  if (selection.mode === 'none' || accounts.length < 2) {
    return selection.mode === 'none' ? null : <ModeBadge mode={selection.mode} />;
  }

  return (
    <div className="flex items-center gap-3">
      <label htmlFor="portfolio-switcher" className="sr-only">Portfolio</label>
      <select id="portfolio-switcher" value={selection.key} onChange={(e) => select(e.target.value)}
              className="min-h-11 max-w-[16rem] rounded-sm border border-white/15 bg-black/30 px-3 text-body-sm text-fg hover:border-white/30">
        {real.length > 0 && (
          <optgroup label="Real (read-only)">
            {real.length > 1 && <option value={ALL_REAL}>All real ({real.length} accounts)</option>}
            {real.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </optgroup>
        )}
        {paper.length > 0 && (
          <optgroup label="Paper (simulated)">
            {paper.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </optgroup>
        )}
      </select>
      <ModeBadge mode={selection.mode} />
    </div>
  );
}
