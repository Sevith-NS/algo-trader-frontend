/**
 * Number and money formatting. One place, so every screen agrees.
 * INR uses Indian digit grouping (10,00,000); everything else en-US grouping.
 */

const MINUS = '−';

function locale(currency?: string) {
  return currency === 'INR' ? 'en-IN' : 'en-US';
}

export function toNumber(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined || value === '') return null;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

/** ₹2,914.50 / $231.40. Unknown values render as an en dash. */
export function formatMoney(value: number | string | null | undefined, currency = 'USD', digits = 2): string {
  const n = toNumber(value);
  if (n === null) return '–';
  try {
    const s = new Intl.NumberFormat(locale(currency), {
      style: 'currency', currency, minimumFractionDigits: digits, maximumFractionDigits: digits,
    }).format(Math.abs(n));
    return n < 0 ? `${MINUS}${s}` : s;
  } catch {
    return `${formatNumber(n, digits)} ${currency}`;
  }
}

export function formatNumber(value: number | string | null | undefined, digits = 2, currency?: string): string {
  const n = toNumber(value);
  if (n === null) return '–';
  const s = new Intl.NumberFormat(locale(currency), {
    minimumFractionDigits: digits, maximumFractionDigits: digits,
  }).format(Math.abs(n));
  return n < 0 ? `${MINUS}${s}` : s;
}

/** Always signed: +1.33% / −0.42% / 0.00%. */
export function formatPct(value: number | string | null | undefined, digits = 2): string {
  const n = toNumber(value);
  if (n === null) return '–';
  const s = Math.abs(n).toFixed(digits);
  return n > 0 ? `+${s}%` : n < 0 ? `${MINUS}${s}%` : `${s}%`;
}

/** Signed money change: +₹38.20 / −$1.10. */
export function formatSignedMoney(value: number | string | null | undefined, currency = 'USD', digits = 2): string {
  const n = toNumber(value);
  if (n === null) return '–';
  const s = formatMoney(Math.abs(n), currency, digits);
  return n > 0 ? `+${s}` : n < 0 ? `${MINUS}${s}` : s;
}

/** Compact large numbers: 1.2K, 3.4M, 5.6B. */
export function formatCompact(value: number | string | null | undefined): string {
  const n = toNumber(value);
  if (n === null) return '–';
  return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(n);
}

export function direction(value: number | string | null | undefined): 'up' | 'down' | 'flat' {
  const n = toNumber(value);
  if (n === null || n === 0) return 'flat';
  return n > 0 ? 'up' : 'down';
}

export function timeAgo(iso: string | number | Date): string {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return '';
  const s = Math.max(0, Math.round((Date.now() - t) / 1000));
  if (s < 60) return 'just now';
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 48) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}
