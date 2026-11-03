import test from 'node:test';
import assert from 'node:assert/strict';
import { generateGame } from '../core.js';
import { generateSystemBodies } from '../system-model.js';
import { planetVisual, planetPalette, biomeId } from '../modules/visuals/planet-visual.js';
test('seeded planet variations are stable and different within the same biome',()=>{
 const g=generateGame({seed:'ART-RENDER-42',size:90,opponents:2});
 const system=g.systems[g.empires[0].home];
 const a=generateSystemBodies(g.seed,system),b=generateSystemBodies(g.seed,system);
 assert.deepEqual(a,b);assert.ok(a.planets.every(p=>p.visual&&Number.isFinite(p.visual.seed)));
 const x=planetVisual('TEST',3,2,'Terran'),y=planetVisual('TEST',3,2,'Terran'),z=planetVisual('TEST',3,3,'Terran');
 assert.deepEqual(x,y);assert.notDeepEqual(x,z);
 assert.notDeepEqual(planetVisual('TEST2',3,2,'Terran'),x);
 assert.ok(x.cloud>=0&&x.cloud<=1);assert.ok(x.hue>=-20&&x.hue<=20);
});
test('all planet biomes have distinct palettes, gas storms and volcanic glow',()=>{
 const biomes=['Terran','Oceanic','Jungle','Desert','Arctic','Volcanic','Barren','Toxic','Crystal','Gas Giant'];
 const ids=new Set(biomes.map(biomeId));assert.equal(ids.size,biomes.length);
 for(const biome of biomes){const colors=planetPalette(biome);assert.equal(colors.length,3);assert.ok(colors.every(c=>/^#[0-9a-f]{6}$/i.test(c)));}
 assert.ok(planetVisual('x',1,5,'Gas Giant').bands>.5);
 assert.ok(planetVisual('x',1,5,'Volcanic').lava>.5);
 assert.equal(planetVisual('x',0,2,'Terran').rings<1,true);
});
test('Sol planets keep named data and stable archetypes',()=>{
 const g=generateGame({seed:'SOL-ART',size:90,opponents:3,scenario:'sol',startYear:2200});
 const solar=generateSystemBodies(g.seed,g.systems[0]);
 assert.equal(solar.planets[2].name,'Earth');assert.equal(solar.planets[2].biome,'Terran');
 assert.equal(solar.planets[5].name,'Saturn');assert.equal(solar.planets[5].visual.rings,1);
 assert.ok(solar.planets[4].visual.bands>.5);assert.equal(solar.planets[2].orbitalDistanceAu,1);
});
