/**
 * Fixed-fractional position sizing: risk a set share of equity between entry
 * and stop. All money in the account's base currency; `fx` converts one unit
 * of the instrument's currency into it.
 */
export type SizeInput = {
  equityBase: number;
  cashBase: number;
  riskPct: number;
  entry: number;
  stop: number;
  fx: number;
  /** Crypto trades in fractions; equities in whole units. */
  fractional?: boolean;
};

export type SizeResult = {
  quantity: number;
  /** What is lost if the stop is hit, base currency. */
  riskBase: number;
  costBase: number;
  /** True when cash, not risk, set the size. */
  cappedByCash: boolean;
};

export function sizeByRisk({ equityBase, cashBase, riskPct, entry, stop, fx, fractional = false }: SizeInput): SizeResult | null {
  const perUnitRisk = (entry - stop) * fx;
  if (!(equityBase > 0 && riskPct > 0 && entry > 0 && fx > 0) || !(perUnitRisk > 0)) return null;
  const round = (q: number) => (fractional ? Math.floor(q * 1e4) / 1e4 : Math.floor(q));

  let quantity = round((equityBase * riskPct) / 100 / perUnitRisk);
  let cappedByCash = false;
  const maxByCash = round(cashBase / (entry * fx));
  if (quantity > maxByCash) {
    quantity = Math.max(0, maxByCash);
    cappedByCash = true;
  }
  return { quantity, riskBase: quantity * perUnitRisk, costBase: quantity * entry * fx, cappedByCash };
}
