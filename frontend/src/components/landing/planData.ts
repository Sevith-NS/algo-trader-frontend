/**
 * The landing page's example plan. Illustrative numbers, labelled as such on
 * the page. They are internally consistent: 34 shares x (2,902.00 - 2,861.40)
 * = 1,380.40 at risk, which is 1% of a 1,38,040 paper balance.
 */
export const LEVELS = [
  { key: 't2', label: 'Target 2', price: 3023.8, note: '3R' },
  { key: 't1', label: 'Target 1', price: 2963.0, note: '1.5R' },
  { key: 'entry', label: 'Entry', price: 2902.0, note: 'limit' },
  { key: 'stop', label: 'Stop', price: 2861.4, note: '1.5× ATR' },
] as const;

export const LAST_PRICE = 2914.5;

export type Candle = { open: number; high: number; low: number; close: number };

/** Seeded so the server and the browser draw the same chart. */
function lcg(seed: number) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

export const CANDLES: Candle[] = (() => {
  const rand = lcg(7);
  const count = 48;
  const out: Candle[] = [];
  let prev = 2872;
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1);
    const drift = 2872 + 42 * t + 14 * Math.sin(t * Math.PI * 3.2);
    const close = i === count - 1 ? LAST_PRICE : drift + (rand() - 0.5) * 18;
    const open = prev;
    out.push({
      open,
      close,
      high: Math.max(open, close) + rand() * 7,
      low: Math.min(open, close) - rand() * 7,
    });
    prev = close;
  }
  return out;
})();

const inr = new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** ₹2,902.00, or −₹1,380.40 with a true minus sign. */
export function formatInr(value: number) {
  return `${value < 0 ? '−' : ''}₹${inr.format(Math.abs(value))}`;
}
