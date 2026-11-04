import test from 'node:test';
import assert from 'node:assert/strict';
import {
  generateGame, getNeighbors, colonyCost, canColonize, colonize, validateGame
} from '../core.js';

// Regression contract for the authoritative public colonization actions.
// No duplicate game pricing implementation: exact quotes are asserted against
// real treasury deductions, not another independent calculator.
const makeGame = seed => generateGame({ seed, size: 48, opponents: 2 });
const neutralNeighbor = game =>
  getNeighbors(game, game.empires[0].home).find(system => system.owner === null);

const DISCOUNT_CASES = [
  { name: 'baseline', techs: [], traditions: [], civics: [], expected: { credits: 70, alloys: 42, influence: 18 } },
  { name: 'charters', techs: ['stellar-survey', 'colonial-charters'], traditions: [], civics: [], expected: { credits: 53, alloys: 42, influence: 14 } },
  { name: 'frontier-tradition', techs: [], traditions: ['frontier-spirit'], civics: [], expected: { credits: 62, alloys: 42, influence: 16 } },
  { name: 'frontier-civic', techs: [], traditions: [], civics: ['frontier-autonomy'], expected: { credits: 63, alloys: 42, influence: 17 } },
  { name: 'stacked-discounts', techs: ['stellar-survey', 'colonial-charters'], traditions: ['frontier-spirit'], civics: ['frontier-autonomy'], expected: { credits: 38, alloys: 42, influence: 10 } }
];

for (const scenario of DISCOUNT_CASES) {
  test(`quoted colonization price equals actual spending: ${scenario.name}`, () => {
    const game = makeGame('COST-PARITY-' + scenario.name);
    const empire = game.empires[0], target = neutralNeighbor(game);
    assert.ok(target, 'the starting system must have a neutral neighbor');
    empire.techs = [...scenario.techs];
    empire.traditions = [...scenario.traditions];
    empire.civics = [...scenario.civics];

    const before = JSON.stringify(game);
    const quoted = colonyCost(game);
    assert.deepEqual(quoted, scenario.expected);
    assert.equal(JSON.stringify(game), before, 'quoting a price must be side-effect-free');
    assert.equal(canColonize(game, target.id).ok, true, 'quoted purchase should be legal');
    assert.equal(JSON.stringify(game), before, 'checking legality must be side-effect-free');

    const initial = Object.fromEntries(
      Object.keys(quoted).map(key => [key, empire[key]])
    );
    assert.equal(colonize(game, target.id).ok, true);
    assert.equal(target.owner, 0);
    for (const resource of Object.keys(quoted)) {
      assert.equal(initial[resource] - empire[resource], quoted[resource],
        `${resource} deduction must exactly match the displayed quote`);
      assert.ok(empire[resource] >= 0, `${resource} must not become negative`);
    }
    assert.equal(validateGame(game), true, 'a priced colonization must preserve a valid save');
    assert.deepEqual(colonyCost(game), quoted, 'the action must not mutate its pricing rules');
  });
}

test('each resource gates colonization at the exact cost boundary without spending on failure', () => {
  for (const resource of ['credits', 'alloys', 'influence']) {
    const game = makeGame('COST-BOUNDARY-' + resource);
    const target = neutralNeighbor(game);
    assert.ok(target);
    const quote = colonyCost(game);
    const empire = game.empires[0];

    for (const key of Object.keys(quote)) empire[key] = quote[key];
    empire[resource] -= 1;
    const before = JSON.stringify(game);
    assert.equal(canColonize(game, target.id).ok, false, resource);
    assert.equal(colonize(game, target.id).ok, false, resource);
    assert.equal(JSON.stringify(game), before, 'rejected purchases must not alter the game');

    empire[resource] += 1;
    assert.equal(canColonize(game, target.id).ok, true,
      resource + ': the exact quoted amount must be sufficient');
    assert.equal(colonize(game, target.id).ok, true);
    for (const key of Object.keys(quote)) {
      assert.equal(empire[key], 0, 'exact-budget purchase must use the quoted amount');
    }
    assert.equal(validateGame(game), true);
  }
});

test('discounts are empire-specific and must not reduce another empire price', () => {
  const game = makeGame('COST-EMPIRE-ISOLATION');
  const player = colonyCost(game, 0);
  assert.deepEqual(player, { credits: 70, alloys: 42, influence: 18 });
  const rival = game.empires[1];
  rival.techs = ['stellar-survey', 'colonial-charters'];
  rival.traditions = ['frontier-spirit'];
  rival.civics = ['frontier-autonomy'];

  const before = JSON.stringify(game);
  assert.deepEqual(colonyCost(game, 1), { credits: 38, alloys: 42, influence: 10 });
  assert.deepEqual(colonyCost(game, 0), player);
  assert.equal(JSON.stringify(game), before);
});

test('an unreachable system is never colonizable even when treasury covers the quote', () => {
  const game = makeGame('COST-SUPPLY-LINE');
  const farAway = game.systems.find(system =>
    system.owner === null && !system.neighbors.some(id => game.systems[id].owner === 0)
  );
  assert.ok(farAway);
  const quoted = colonyCost(game);
  assert.ok(Object.entries(quoted).every(([key, cost]) => game.empires[0][key] >= cost));
  const before = JSON.stringify(game);
  assert.equal(canColonize(game, farAway.id).ok, false);
  assert.equal(colonize(game, farAway.id).ok, false);
  assert.equal(JSON.stringify(game), before);
});
