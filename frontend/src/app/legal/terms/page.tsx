import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Terms' };

export default function Terms() {
  return (
    <>
      <h1>Terms</h1>
      <p className="text-caption text-fg-3">Last updated 11 October 2026</p>

      <h2>Paper trading only</h2>
      <p>Every trade in Polaris is simulated with paper money. No real orders are placed, and no broker is connected.</p>

      <h2>Not investment advice</h2>
      <p>Signals, plans, forecasts, risk figures and AI answers are educational. They can be wrong, late or based on incomplete data. Decide for yourself, and talk to a licensed adviser before risking real money.</p>

      <h2>Data quality</h2>
      <p>Most prices are delayed by about 15 minutes, and some sources fail from time to time. Polaris marks stale and delayed data, but cannot guarantee any price, calculation or availability.</p>

      <h2>Your account</h2>
      <p>Access is by invitation during the preview. Keep your sign-in to yourself and turn on two-step verification. We may suspend accounts that abuse the service, for example by scraping it or trying to reach other people&apos;s data.</p>

      <h2>Changes</h2>
      <p>Polaris is visibly in progress. Features and these terms will change; we will note the date above when they do.</p>
    </>
  );
}
