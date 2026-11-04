import test from 'node:test';
import assert from 'node:assert/strict';
import { generateGame, canMove } from '../core.js';
import { inspectFleetEntry } from '../modules/strategy/strategy-fleet-legality.js';

// Minimal in-memory campaign with the real numeric fleet/system/war layout.
function encounter() {
  return {
    turn: 7,
    systems: [
      { id: 0, owner: 1, neighbors: [1, 2] },
      { id: 1, owner: 0, neighbors: [0] },
      { id: 2, owner: null, neighbors: [0] },
      { id: 3, owner: 2, neighbors: [] },
    ],
    empires: [
      { id: 0, wars: { 1: true, 2: false } },
      { id: 1, wars: { 0: true, 2: false } },
      { id: 2, wars: { 0: false, 1: false } },
    ],
    fleets: [
      { id: 11, owner: 1, system: 0, movedTurn: 6, ships: { corvette: 2, frigate: 0, cruiser: 0 } },
      { id: 12, owner: 2, system: 1, movedTurn: 6, ships: { corvette: 1, frigate: 0, cruiser: 0 } },
    ],
  };
}

test('AI assault cannot ignore a neutral third-party fleet at the target', () => {
  const game = encounter(), before = structuredClone(game);
  // Fleet 11 is at war with system owner 0 but NOT with fleet owner 2.
  const result = inspectFleetEntry(game, 11, 1);
  assert.deepEqual(result, { ok: false, reason: 'neutral-blockade' });
  assert.deepEqual(game, before, 'legality checks must not mutate saves or RNG');
});

test('entry is legal against all defenders only when war is established', () => {
  const game = encounter();
  game.empires[1].wars[2] = true;
  assert.deepEqual(inspectFleetEntry(game, 11, 1), { ok: true, combat: true });
});

test('peaceful colonies block invasion, while neutral and own destinations are legal', () => {
  const game = encounter();
  game.fleets.pop();
  game.empires[1].wars[0] = false;
  assert.deepEqual(inspectFleetEntry(game, 11, 1), { ok: false, reason: 'peaceful-border' });
  assert.deepEqual(inspectFleetEntry(game, 11, 2), { ok: true, combat: false });
  game.systems[2].owner = 1;
  assert.deepEqual(inspectFleetEntry(game, 11, 2), { ok: true, combat: false });
});

test('a neutral system occupied by a peaceful fleet blocks entry', () => {
  const game = encounter();
  game.systems[2].owner = null;
  game.fleets[1].system = 2;
  assert.deepEqual(inspectFleetEntry(game, 11, 2), { ok: false, reason: 'neutral-blockade' });
  game.empires[1].wars[2] = true;
  assert.deepEqual(inspectFleetEntry(game, 11, 2), { ok: true, combat: true });
});

test('movement gate rejects stale orders and non-hyperlane destinations', () => {
  const game = encounter();
  game.fleets.pop();
  assert.deepEqual(inspectFleetEntry(game, 999, 2), { ok: false, reason: 'unknown-fleet' });
  assert.deepEqual(inspectFleetEntry(game, 11, 99), { ok: false, reason: 'unknown-destination' });
  assert.deepEqual(inspectFleetEntry(game, 11, 0), { ok: false, reason: 'same-system' });
  assert.deepEqual(inspectFleetEntry(game, 11, 3), { ok: false, reason: 'not-adjacent' });
  game.fleets[0].movedTurn = 7;
  assert.deepEqual(inspectFleetEntry(game, 11, 2), { ok: false, reason: 'already-moved' });
  game.fleets[0].movedTurn = 6;
  game.fleets[0].route = [2];
  assert.deepEqual(inspectFleetEntry(game, 11, 2), { ok: false, reason: 'active-route' });
});

test('real new-game player fleet retains existing legal-move behavior', () => {
  const game = generateGame({ seed: 'LANE-D-LEGAL-PARITY', size: 60, opponents: 3 });
  const fleet = game.fleets.find(f => f.owner === 0);
  const target = game.systems[fleet.system].neighbors.find(id => game.systems[id].owner === null);
  assert.ok(Number.isInteger(target));
  assert.equal(canMove(game, fleet.id, target).ok, true);
  assert.deepEqual(inspectFleetEntry(game, fleet.id, target), { ok: true, combat: false });
});
