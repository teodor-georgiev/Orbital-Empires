import test from 'node:test';
import assert from 'node:assert/strict';
import {
  generateGame, income, systemYield, colonize, getNeighbors, build
} from '../core.js';
import { unityIncome } from '../modules/strategy/civics.js';
import { economyLedger, resourceShortfalls } from '../modules/economy/ledger.js';

test('economy ledger accounts for every colony without changing simulation state', () => {
  const game = generateGame({ seed: 'LEDGER-PARITY', size: 48, opponents: 2 });
  const before = JSON.stringify(game);
  const ledger = economyLedger(game, 0, systemYield);
  assert.deepEqual(ledger.production, { ...income(game), unity: unityIncome(game) });
  assert.deepEqual(ledger.stockpile, {
    credits: game.empires[0].credits,
    alloys: game.empires[0].alloys,
    influence: game.empires[0].influence,
    unity: game.empires[0].unity
  });
  assert.equal(ledger.colonies.length, 1);
  assert.equal(ledger.colonies[0].id, game.empires[0].home);
  assert.deepEqual(ledger.colonies[0].production, systemYield(game, game.systems[game.empires[0].home]));
  assert.equal(JSON.stringify(game), before, 'the report must not mutate the save');
});

test('economy ledger updates after development and colonization', () => {
  const game = generateGame({ seed: 'LEDGER-COLONIES', size: 48, opponents: 2 });
  const start = economyLedger(game, 0, systemYield);
  assert.equal(build(game, game.empires[0].home, 'exchange').ok, true);
  const upgraded = economyLedger(game, 0, systemYield);
  assert.ok(upgraded.production.credits > start.production.credits);
  const neighbor = getNeighbors(game, game.empires[0].home).find(s => s.owner === null);
  assert.ok(neighbor);
  assert.equal(colonize(game, neighbor.id).ok, true);
  const expanded = economyLedger(game, 0, systemYield);
  assert.equal(expanded.colonies.length, 2);
  assert.deepEqual(expanded.production, { ...income(game), unity: unityIncome(game) });
});

test('economy ledger isolates rival empires and handles legacy missing unity', () => {
  const game = generateGame({ seed: 'LEDGER-RIVALS', size: 48, opponents: 2 });
  delete game.empires[0].unity;
  const ours = economyLedger(game, 0, systemYield);
  const rival = economyLedger(game, 1, systemYield);
  assert.equal(ours.stockpile.unity, 0);
  assert.ok(rival.colonies.every(c => game.systems[c.id].owner === 1));
  assert.ok(ours.colonies.every(c => game.systems[c.id].owner === 0));
  assert.deepEqual(rival.production, { ...income(game, 1), unity: unityIncome(game, 1) });
  assert.throws(() => economyLedger(game, 99, systemYield), RangeError);
});

test('resource shortfalls respect reserves without spending anything', () => {
  const stockpile = { credits: 100, alloys: 40, influence: 18, unity: 0 };
  const cost = { credits: 30, alloys: 20, influence: 10 };
  const reserves = { credits: 80, alloys: 10 };
  const before = JSON.stringify([stockpile, cost, reserves]);
  assert.deepEqual(resourceShortfalls(stockpile, cost, reserves), { credits: 10 });
  assert.equal(JSON.stringify([stockpile, cost, reserves]), before);
  assert.deepEqual(resourceShortfalls(stockpile, { credits: 20, alloys: 20 }), {});
  assert.deepEqual(resourceShortfalls(stockpile, { unity: 5 }), { unity: 5 });
});

test('resource budgets reject invalid costs and non-spendable research output', () => {
  assert.throws(() => resourceShortfalls({ credits: 100 }, { credits: -1 }), RangeError);
  assert.throws(() => resourceShortfalls({ credits: 100 }, { credits: NaN }), RangeError);
  assert.throws(() => resourceShortfalls({ credits: 100 }, { science: 1 }), RangeError);
  assert.throws(() => resourceShortfalls({ credits: 100 }, { credits: 1 }, { credits: -2 }), RangeError);
});
