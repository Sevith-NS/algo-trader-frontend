/**
 * Regular trading hours, evaluated in each exchange's own time zone.
 * Holidays and half-days are not modelled yet, which the UI says plainly.
 */
export type Exchange = { id: string; name: string; tz: string; open: [number, number]; close: [number, number]; days: number[] };

export const EXCHANGES: Exchange[] = [
  { id: 'nse', name: 'NSE', tz: 'Asia/Kolkata', open: [9, 15], close: [15, 30], days: [1, 2, 3, 4, 5] },
  { id: 'nyse', name: 'NYSE', tz: 'America/New_York', open: [9, 30], close: [16, 0], days: [1, 2, 3, 4, 5] },
  { id: 'lse', name: 'LSE', tz: 'Europe/London', open: [8, 0], close: [16, 30], days: [1, 2, 3, 4, 5] },
  { id: 'tse', name: 'Tokyo', tz: 'Asia/Tokyo', open: [9, 0], close: [15, 30], days: [1, 2, 3, 4, 5] },
];

function partsIn(tz: string, now: Date) {
  const f = new Intl.DateTimeFormat('en-US', { timeZone: tz, weekday: 'short', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' });
  const p = Object.fromEntries(f.formatToParts(now).map((x) => [x.type, x.value]));
  const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(p.weekday);
  return { day, minutes: Number(p.hour) * 60 + Number(p.minute) };
}

export function sessionState(ex: Exchange, now = new Date()): { open: boolean; label: string } {
  const { day, minutes } = partsIn(ex.tz, now);
  const o = ex.open[0] * 60 + ex.open[1];
  const c = ex.close[0] * 60 + ex.close[1];
  const fmt = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
  if (ex.days.includes(day) && minutes >= o && minutes < c) return { open: true, label: `Closes ${fmt(c)} local` };
  if (ex.days.includes(day) && minutes < o) return { open: false, label: `Opens ${fmt(o)} local` };
  // After the close or on a non-trading day: name the next session's day.
  const names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const next = [1, 2, 3, 4, 5, 6, 7].map((k) => (day + k) % 7).find((d) => ex.days.includes(d));
  return { open: false, label: next === undefined ? 'Closed' : `Opens ${names[next]} ${fmt(o)} local` };
}

/** Best guess of a symbol's exchange from its Yahoo suffix. */
export function exchangeFor(symbol: string): Exchange | 'crypto' | null {
  const s = symbol.toUpperCase();
  if (/-(USD|USDT|INR|EUR)$/.test(s)) return 'crypto';
  if (s.endsWith('.NS') || s.endsWith('.BO')) return EXCHANGES[0];
  if (s.endsWith('.L')) return EXCHANGES[2];
  if (s.endsWith('.T')) return EXCHANGES[3];
  if (s.includes('=X') || s.includes('=F') || s.startsWith('^')) return null;
  if (!s.includes('.')) return EXCHANGES[1];
  return null;
}
