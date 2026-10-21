import { notFound } from 'next/navigation';
import { PageHeader, Panel } from '@/components/PageHeader';
import { AppShell } from '@/components/shell/AppShell';
import { Button } from '@/components/ui/Button';
import { Change } from '@/components/ui/Change';
import { DataChip } from '@/components/ui/States';

/**
 * Development-only preview of the signed-in shell with sample content, so the
 * glass system can be checked without a Clerk session. 404 in production.
 */
const INDICES = [
  { name: 'NIFTY 50', value: '24,812.35', pct: 0.62 },
  { name: 'SENSEX', value: '81,377.90', pct: 0.54 },
  { name: 'BANK NIFTY', value: '52,104.10', pct: -0.21 },
  { name: 'S&P 500', value: '5,812.44', pct: 0.31 },
  { name: 'NASDAQ', value: '18,402.77', pct: 0.88 },
];
const MOVERS = [
  { s: 'TATAMOTORS', n: 'Tata Motors', p: '₹982.40', c: 4.12 },
  { s: 'ADANIPORTS', n: 'Adani Ports', p: '₹1,402.15', c: 3.08 },
  { s: 'INFY', n: 'Infosys', p: '₹1,886.00', c: -1.94 },
  { s: 'HDFCBANK', n: 'HDFC Bank', p: '₹1,712.60', c: 1.21 },
];

export default function ShellPreview() {
  if (process.env.NODE_ENV === 'production') notFound();
  return (
    <AppShell>
      <PageHeader level={1} eyebrow="Sample data" title="Market pulse"
                  description="India and US at a glance. Every figure on this preview is sample data."
                  actions={<div className="flex gap-3"><Button variant="secondary">Customize</Button><Button>New paper order</Button></div>} />

      <div className="mb-6 flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none]">
        {INDICES.map((i) => (
          <div key={i.name} className="glass min-w-[180px] rounded-xl px-4 py-3">
            <p className="text-micro uppercase text-fg-3">{i.name}</p>
            <p className="mt-1 text-h4 font-medium tabular">{i.value}</p>
            <Change pct={i.pct} className="text-body-sm" />
          </div>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-12">
        <Panel title="Real net worth" aside="Synced 2m ago" className="xl:col-span-8">
          <div className="flex flex-wrap items-end gap-4">
            <p className="text-silver text-figure tabular md:text-[56px] md:leading-[60px]">₹1,84,20,500</p>
            <Change pct={2.4} amount={43120} currency="INR" className="pb-2" />
          </div>
          <svg viewBox="0 0 600 160" className="dot-grid well mt-6 h-40 w-full rounded-xl" aria-label="Net worth trend, up over the period">
            <path d="M0 130 C60 120 90 95 140 100 S220 125 270 110 330 60 390 70 470 95 520 72 580 40 600 36"
                  fill="none" stroke="var(--fg-2)" strokeWidth="2" />
          </svg>
        </Panel>

        <div className="flex flex-col gap-4 xl:col-span-4">
          <Panel title="Target allocation">
            <div className="flex items-baseline gap-6">
              <p><span className="block text-h2 tabular">60%</span><span className="text-body-sm text-fg-2">equity</span></p>
              <span aria-hidden="true" className="text-h2 text-fg-3">/</span>
              <p><span className="block text-h2 tabular">40%</span><span className="text-body-sm text-fg-2">bonds</span></p>
            </div>
            <p className="mt-5"><span className="pill">Rebalance needed</span></p>
            <p className="mt-2 text-body-sm text-fg-2">Bond allocation drifted 4.2%</p>
          </Panel>
          <div className="glass glass-paper rounded-2xl p-5">
            <p className="flex items-center justify-between"><span className="pill text-paper">Paper</span><DataChip>Simulated</DataChip></p>
            <p className="mt-4 text-body-sm text-fg-2">Swing book P&amp;L today</p>
            <Change pct={0.84} amount={8420} currency="INR" className="text-h4" />
          </div>
          <div className="glass glass-down rounded-2xl p-5">
            <span className="pill text-down">Stop hit</span>
            <p className="mt-3 text-body-sm text-fg-2">INFY closed below ₹1,890.00 (paper).</p>
          </div>
        </div>

        <Panel title="Top movers" aside="NSE · 15m delayed" className="xl:col-span-8">
          <table className="w-full text-body-sm">
            <thead><tr className="text-left text-caption text-fg-3"><th className="pb-2 font-normal">Symbol</th><th className="pb-2 text-right font-normal">Last</th><th className="pb-2 text-right font-normal">Change</th></tr></thead>
            <tbody>
              {MOVERS.map((m) => (
                <tr key={m.s} className="border-t border-white/[0.06]">
                  <td className="py-3"><span className="ticker">{m.s}</span><span className="block text-caption text-fg-3">{m.n}</span></td>
                  <td className="py-3 text-right tabular">{m.p}</td>
                  <td className="py-3 text-right"><Change pct={m.c} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <Panel title="Data freshness" className="xl:col-span-4">
          <div className="flex flex-wrap gap-2">
            <DataChip>NSE live</DataChip>
            <DataChip stale>NYSE 15m delayed</DataChip>
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
