import assert from 'node:assert/strict';
import { test } from 'node:test';
import { sizeByRisk } from './sizing';

test('risks the stated share of equity between entry and stop', () => {
  // 1% of 10,00,000 = 10,000 at risk; 40.60 per share to the stop -> 246 shares.
  const r = sizeByRisk({ equityBase: 1_000_000, cashBase: 1_000_000, riskPct: 1, entry: 2902, stop: 2861.4, fx: 1 });
  assert.ok(r);
  assert.equal(r.quantity, 246);
  assert.ok(r.riskBase <= 10_000);
  assert.equal(r.cappedByCash, false);
});

test('converts instrument currency into the base currency', () => {
  // $5 per share to the stop at 85 INR/USD = 425 INR per share; 10,000 / 425 -> 23.
  const r = sizeByRisk({ equityBase: 1_000_000, cashBase: 1_000_000, riskPct: 1, entry: 200, stop: 195, fx: 85 });
  assert.equal(r?.quantity, 23);
});

test('cash caps the size when the stop is tight', () => {
  const r = sizeByRisk({ equityBase: 100_000, cashBase: 5_000, riskPct: 2, entry: 100, stop: 99.9, fx: 1 });
  assert.equal(r?.quantity, 50);
  assert.equal(r?.cappedByCash, true);
});

test('crypto sizes in fractions', () => {
  const r = sizeByRisk({ equityBase: 100_000, cashBase: 100_000, riskPct: 1, entry: 60_000, stop: 58_000, fx: 1, fractional: true });
  assert.equal(r?.quantity, 0.5);
});

test('refuses a stop at or above entry', () => {
  assert.equal(sizeByRisk({ equityBase: 1e5, cashBase: 1e5, riskPct: 1, entry: 100, stop: 100, fx: 1 }), null);
  assert.equal(sizeByRisk({ equityBase: 1e5, cashBase: 1e5, riskPct: 1, entry: 100, stop: 120, fx: 1 }), null);
});
