import { test } from 'node:test';
import assert from 'node:assert/strict';
import { direction, formatPct, formatSignedMoney } from './format';
import { EXCHANGES, sessionState } from './sessions';

test('changes that round to zero are flat, with no sign', () => {
  assert.equal(direction(-0.0001), 'flat');
  assert.equal(formatPct(-0.0001), '0.00%');
  assert.equal(formatSignedMoney(-0.004, 'USD'), '$0.00');
  assert.equal(direction(-0.006), 'down');
  assert.equal(formatPct(0.006), '+0.01%');
});

test('a closed exchange names its next session', () => {
  const nyse = EXCHANGES[1];
  // Saturday 2026-10-10 noon in New York: next open is Monday.
  assert.deepEqual(sessionState(nyse, new Date('2026-10-10T16:00:00Z')), { open: false, label: 'Opens Mon 09:30 local' });
  // Friday after the close.
  assert.equal(sessionState(nyse, new Date('2026-10-09T21:30:00Z')).label, 'Opens Mon 09:30 local');
  // Tuesday after the close.
  assert.equal(sessionState(nyse, new Date('2026-10-06T21:30:00Z')).label, 'Opens Wed 09:30 local');
});
