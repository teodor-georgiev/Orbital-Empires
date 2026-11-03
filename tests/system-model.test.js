import test from 'node:test';
import assert from 'node:assert/strict';
import { generateGame } from '../core.js';
import { generateSystemBodies, selectSystemPlanet } from '../system-model.js';

const game = generateGame({seed:'SOLAR-RENDER-TEST',size:60,opponents:2});
const system = game.systems[game.empires[0].home];

test('planets are deterministic and do not mutate the saved system', () => {
  const before = JSON.stringify(system);
  const first = generateSystemBodies(game.seed,system);
  assert.deepEqual(first, generateSystemBodies(game.seed,system));
  assert.equal(JSON.stringify(system), before);
  assert.notDeepEqual(first,generateSystemBodies('ANOTHER-SEED',system));
});

test('the first planet mirrors the simulation colony world', () => {
  const bodies = generateSystemBodies(game.seed,system);
  assert.equal(bodies.planets[0].biome,system.biome);
  assert.equal(bodies.planets[0].isColonyWorld,true);
  assert.equal(bodies.planets[0].habitability,system.habitability);
  assert.equal(bodies.planets.filter(p=>p.isColonyWorld).length,1);
});

test('planet rings, moon orbits, radii and colors have usable finite coordinates', () => {
  const bodies=generateSystemBodies(game.seed,system);
  assert.ok(bodies.planets.length>=4 && bodies.planets.length<=7);
  assert.ok(bodies.planets.every((p,i)=>Number.isFinite(p.orbitRadius)&&p.orbitRadius>1.5&&Number.isFinite(p.radius)&&p.radius>0&&/^#[0-9a-f]{6}$/i.test(p.color) && (i===0||p.orbitRadius>bodies.planets[i-1].orbitRadius)));
  assert.ok(bodies.planets.every(p=>p.moons.every(m=>m.orbitRadius>p.radius && m.radius>0)));
});

test('planet IDs cannot select an unrelated or nonexistent body', () => {
  const bodies=generateSystemBodies(game.seed,system);
  assert.equal(selectSystemPlanet(bodies,0),bodies.planets[0]);
  assert.equal(selectSystemPlanet(bodies,999),null);
  assert.equal(selectSystemPlanet(bodies,'0'),null);
  assert.equal(selectSystemPlanet(bodies,-1),null);
});
