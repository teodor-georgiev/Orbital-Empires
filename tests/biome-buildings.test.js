import test from 'node:test';
import assert from 'node:assert/strict';
import {generateGame,validateGame,income,endTurn,canBuild,build,canBuildOrbital,buildOrbital,systemYield} from '../core.js';
import {generateSystemBodies} from '../system-model.js';
import {populationCapacity} from '../modules/simulation/population.js';
import {BIOME_BUILDINGS,ORBITAL_BUILDINGS,biomeBuildingAllowed} from '../modules/strategy/planet-buildings.js';
const setup=(seed='BIOME-TEST')=>{const g=generateGame({seed,size:60,opponents:2});return {g,home:g.systems[g.empires[0].home]};};
test('all colony buildings have explicit biome restrictions and meaningful output',()=>{
 for(const b of BIOME_BUILDINGS){assert.ok(b.allowed.length>0);assert.ok(b.cost.length===3&&b.credit.length===3);assert.ok(b.yield||b.capacity);assert.equal(biomeBuildingAllowed(b,{biome:'Gas Giant'}),false);}
 const {g,home}=setup();home.biome='Terran';
 assert.equal(canBuild(g,home.id,'biosphere-lab').ok,true);
 assert.match(canBuild(g,home.id,'solar-array').message,/biome|world|available/i);
 assert.equal(canBuild(g,home.id,'solar-array').ok,false);
 assert.equal(canBuild(g,home.id,'made-up').ok,false);
 assert.equal(g.empires[0].alloys,124);
});
test('biome structures cost resources and increase income or carrying capacity once',()=>{
 const {g,home}=setup('BUILD-ONE');home.biome='Terran';
 const before=systemYield(g,home),capBefore=populationCapacity(home),wallet={credits:g.empires[0].credits,alloys:g.empires[0].alloys};
 const def=BIOME_BUILDINGS.find(b=>b.id==='agri-domes');
 assert.equal(build(g,home.id,'agri-domes').ok,true);
 assert.equal(home.buildings['agri-domes'],1);
 assert.equal(populationCapacity(home),capBefore+def.capacity);
 assert.equal(systemYield(g,home).credits,before.credits+def.yield.credits);
 assert.equal(g.empires[0].credits,wallet.credits-def.credit[0]);
 assert.equal(g.empires[0].alloys,wallet.alloys-def.cost[0]);
 assert.equal(validateGame(JSON.parse(JSON.stringify(g))),true);
});
test('wrong-biome or unavailable colony building never charges resources',()=>{
 const {g,home}=setup('WRONG-WORLD');
 home.biome='Volcanic';const before={...g.empires[0]};
 const denied=build(g,home.id,'agri-domes');
 assert.equal(denied.ok,false);assert.equal(g.empires[0].credits,before.credits);assert.equal(g.empires[0].alloys,before.alloys);
 assert.equal(canBuild(g,home.id,'magma-foundry').ok,true);
 assert.equal(build(g,home.id,'magma-foundry').ok,true);
 const base=systemYield(g,home).alloys;
 assert.ok(base>0);
});
test('orbital construction is possible on owned gas giants, not on Earth or enemy worlds',()=>{
 const {g,home}=setup('GAS-BUILD');g.scenario='sol';home.realStarId='sol';home.biome='Terran';
 const bodies=generateSystemBodies(g.seed,home);const giant=bodies.planets.find(p=>p.biome==='Gas Giant');
 assert.ok(giant);assert.ok(ORBITAL_BUILDINGS.some(b=>b.id==='gas-harvester'));
 const id=giant.id,before=income(g).credits;
 assert.equal(canBuildOrbital(g,home.id,id,'gas-harvester').ok,true);
 assert.equal(buildOrbital(g,home.id,id,'gas-harvester').ok,true);
 assert.equal(home.orbitalSites[id]['gas-harvester'],1);
 assert.equal(income(g).credits,before+4);
 assert.equal(canBuildOrbital(g,home.id,0,'gas-harvester').ok,false);
 assert.equal(canBuildOrbital(g,home.id,999,'gas-harvester').ok,false);
 assert.equal(buildOrbital(g,home.id,id,'orbital-mines').ok,false);
 const opponent=g.systems[g.empires[1].home];
 assert.equal(buildOrbital(g,opponent.id,id,'gas-harvester').ok,false);
 assert.ok(validateGame(g));
});
test('orbital production applies once per cycle, persists to json, and rejects tampered site data',()=>{
 const {g,home}=setup('ORBIT-LEDGER');const worlds=generateSystemBodies(g.seed,home);
 const planet=worlds.planets.find(p=>!p.isColonyWorld&&ORBITAL_BUILDINGS.some(b=>b.allowed.includes(p.biome)));
 assert.ok(planet,'at least one seeded survey-only planet must have an orbital option');
 const b=ORBITAL_BUILDINGS.find(b=>b.allowed.includes(planet.biome));
 assert.equal(buildOrbital(g,home.id,planet.id,b.id).ok,true);
 const expected=income(g),initial=g.empires[0].credits;
 assert.equal(endTurn(g).ok,true);
 assert.equal(g.empires[0].credits,initial+expected.credits);
 assert.ok(validateGame(JSON.parse(JSON.stringify(g))));
 const corrupt=structuredClone(g);corrupt.systems[home.id].orbitalSites[planet.id][b.id]=9999;
 assert.equal(validateGame(corrupt),false);
});
test('legacy v1 save objects lacking biome fields and orbital sites still advance',()=>{
 const {g,home}=setup('LEGACY-BIOME');
 delete home.orbitalSites;delete home.buildings['agri-domes'];
 assert.equal(validateGame(g),true);assert.equal(endTurn(g).ok,true);
 assert.equal(validateGame(g),true);
});
