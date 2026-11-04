import test from 'node:test';
import assert from 'node:assert/strict';
import { applyShipCasualties } from '../modules/strategy/strategy-combat.js';

test('attrition removes existing hulls without converting frigates to corvettes', () => {
  const before = { corvette: 0, frigate: 2, cruiser: 0 };
  assert.deepEqual(applyShipCasualties(before, 0.7),
    { corvette: 0, frigate: 1, cruiser: 0 });
  assert.deepEqual(before, { corvette: 0, frigate: 2, cruiser: 0 },
    'combat calculation must not mutate the fleet');
});

test('single surviving heavy hull is retained instead of synthesizing a corvette', () => {
  assert.deepEqual(applyShipCasualties({ corvette: 0, frigate: 0, cruiser: 1 }, 0.7),
    { corvette: 0, frigate: 0, cruiser: 1 });
});

test('larger fleets lose exactly the budgeted number of ships, cheapest first', () => {
  assert.deepEqual(applyShipCasualties({ corvette: 3, frigate: 2, cruiser: 1 }, 0.5),
    { corvette: 0, frigate: 2, cruiser: 1 });
  assert.deepEqual(applyShipCasualties({ corvette: 2, frigate: 1, cruiser: 1 }, 0.75),
    { corvette: 0, frigate: 0, cruiser: 1 });
});

test('zero casualties and empty fleets never manufacture a ship', () => {
  assert.deepEqual(applyShipCasualties({ corvette: 0, frigate: 0, cruiser: 0 }, 0.9),
    { corvette: 0, frigate: 0, cruiser: 0 });
  assert.deepEqual(applyShipCasualties({ corvette: 2, frigate: 0, cruiser: 1 }, 0),
    { corvette: 2, frigate: 0, cruiser: 1 });
});

test('casualty computation rejects invalid ship counts and loss fractions', () => {
  const fleet = { corvette: 2, frigate: 0, cruiser: 0 };
  for (const bad of [-0.01, 1.01, NaN, Infinity, '0.5']) {
    assert.throws(() => applyShipCasualties(fleet, bad), RangeError);
  }
  for (const invalid of [
    { corvette: -1, frigate: 0, cruiser: 0 },
    { corvette: 0.4, frigate: 0, cruiser: 0 },
    { corvette: 0, frigate: NaN, cruiser: 0 },
    { corvette: 0, frigate: 0, cruiser: Infinity },
    { corvette: 0, frigate: 0 },
    null,
  ]) {
    assert.throws(() => applyShipCasualties(invalid, 0.5), RangeError);
  }
});
