import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ALL_BUILDINGS, BIOME_BUILDINGS, BUILDINGS, build, canBuild,
  generateGame, systemYield, validateGame
} from '../core.js';

/**
 * Contract audit for the authoritative construction actions.
 * The test uses the existing price tables and public canBuild/build methods;
 * it does not duplicate the game's pricing or production implementation.
 */
const makeGame = seed => generateGame({ seed, size: 48, opponents: 2 });
const yields = ['credits', 'alloys', 'science', 'influence'];
const treasury = ['credits', 'alloys', 'influence', 'unity'];

test('construction data has unique IDs and exactly three finite, positive price tiers', () => {
  assert.ok(BUILDINGS.length > 0 && BIOME_BUILDINGS.length > 0);
  assert.equal(new Set(ALL_BUILDINGS.map(b => b.id)).size, ALL_BUILDINGS.length);
  for (const building of ALL_BUILDINGS) {
    assert.equal(building.cost.length, 3, `${building.id}: alloy tiers`);
    assert.equal(building.credit.length, 3, `${building.id}: credit tiers`);
    for (let tier = 0; tier < 3; tier++) {
      assert.ok(Number.isFinite(building.cost[tier]) && building.cost[tier] > 0);
      assert.ok(Number.isFinite(building.credit[tier]) && building.credit[tier] > 0);
      if (tier > 0) {
        assert.ok(building.cost[tier] > building.cost[tier - 1],
          `${building.id}: alloys must increase between tiers`);
        assert.ok(building.credit[tier] > building.credit[tier - 1],
          `${building.id}: credits must increase between tiers`);
      }
    }
  }
});

for (const building of ALL_BUILDINGS) {
  test(`construction quotes and actual treasury charges agree at all tiers: ${building.id}`, () => {
    for (const tier of [0, 1, 2]) {
      const game = makeGame(`BUILD-QUOTE-${building.id}-${tier}`);
      const home = game.systems[game.empires[0].home];
      if (building.allowed) home.biome = building.allowed[0];
      home.buildings[building.id] = tier;
      const empire = game.empires[0];
      const price = { alloys: building.cost[tier], credits: building.credit[tier] };
      empire.alloys = price.alloys;
      empire.credits = price.credits;

      const before = JSON.stringify(game);
      const report = canBuild(game, home.id, building.id);
      assert.equal(report.ok, true, `${building.id}: tier ${tier} should be buildable with exact funds`);
      assert.deepEqual(report.cost, price, `${building.id}: wrong quote at tier ${tier}`);
      assert.equal(JSON.stringify(game), before, 'asking for a construction quote must not mutate the save');

      const previousYield = systemYield(game, home);
      const previousStockpile = Object.fromEntries(treasury.map(k => [k, empire[k]]));
      assert.equal(build(game, home.id, building.id).ok, true);
      assert.equal(home.buildings[building.id], tier + 1);
      assert.equal(previousStockpile.alloys - empire.alloys, price.alloys);
      assert.equal(previousStockpile.credits - empire.credits, price.credits);
      for (const k of ['influence', 'unity']) {
        assert.equal(empire[k], previousStockpile[k], `${building.id}: unrelated ${k} balance changed`);
      }
      assert.equal(empire.credits, 0);
      assert.equal(empire.alloys, 0);
      assert.equal(validateGame(game), true);

      const currentYield = systemYield(game, home);
      if (building.yield) {
        for (const resource of yields) {
          assert.equal(currentYield[resource] - previousYield[resource], building.yield[resource] ?? 0,
            `${building.id}: wrong ${resource} gain at tier ${tier}`);
        }
      } else if (building.resource === 'defense') {
        assert.deepEqual(currentYield, previousYield, 'defensive upgrades must not fake economic production');
      } else {
        assert.ok(currentYield[building.resource] > previousYield[building.resource],
          `${building.id}: tier ${tier} must improve its advertised production`);
      }
      if (tier === 2) {
        const after = JSON.stringify(game);
        assert.equal(canBuild(game, home.id, building.id).ok, false, 'level 3 must be capped');
        assert.equal(build(game, home.id, building.id).ok, false, 'level 3 cannot upgrade again');
        assert.equal(JSON.stringify(game), after, 'rejected max-level upgrade must not mutate the save');
      }
    }
  });
}

test('insufficient credits or alloys reject construction without mutation at every tier', () => {
  for (const building of ALL_BUILDINGS) {
    for (const tier of [0, 1, 2]) {
      for (const missing of ['credits', 'alloys']) {
        const game = makeGame(`BUILD-SHORT-${building.id}-${tier}-${missing}`);
        const home = game.systems[game.empires[0].home];
        if (building.allowed) home.biome = building.allowed[0];
        home.buildings[building.id] = tier;
        const empire = game.empires[0];
        empire.alloys = building.cost[tier];
        empire.credits = building.credit[tier];
        empire[missing] -= 1;
        const before = JSON.stringify(game);
        assert.equal(canBuild(game, home.id, building.id).ok, false,
          `${building.id}: tier ${tier}, missing ${missing}`);
        assert.equal(build(game, home.id, building.id).ok, false,
          `${building.id}: tier ${tier}, missing ${missing}`);
        assert.equal(JSON.stringify(game), before, 'rejected construction must not mutate the save');
      }
    }
  }
});

test('biome restrictions and foreign ownership prohibit construction even with enough resources', () => {
  const game = makeGame('BUILD-GATES');
  const home = game.systems[game.empires[0].home];
  game.empires[0].alloys = 10000;
  game.empires[0].credits = 10000;
  const biomeBuilding = BIOME_BUILDINGS.find(b => b.allowed.length < 3);
  assert.ok(biomeBuilding);
  home.biome = 'Gas Giant';
  const before = JSON.stringify(game);
  assert.equal(canBuild(game, home.id, biomeBuilding.id).ok, false);
  assert.equal(build(game, home.id, biomeBuilding.id).ok, false);
  assert.equal(JSON.stringify(game), before);

  const rivalHome = game.empires[1].home;
  assert.equal(game.systems[rivalHome].owner, 1);
  const secondBefore = JSON.stringify(game);
  assert.equal(canBuild(game, rivalHome, 'foundry').ok, false);
  assert.equal(build(game, rivalHome, 'foundry').ok, false);
  assert.equal(JSON.stringify(game), secondBefore);
});
