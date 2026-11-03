import test from 'node:test';
import assert from 'node:assert/strict';
import { generateGame, income, endTurn, colonyCost, chooseResearch, TECHS, adoptTradition, enactPolicy, validateGame } from '../core.js';
import { generateSystemBodies } from '../system-model.js';
import { TRADITIONS, POLICIES, civicBonuses, unityIncome, traditionCost } from '../modules/strategy/civics.js';

test('seeded solar systems contain 3–7 deterministic planets and one homeworld',()=>{
 const a=generateGame({seed:'ORBITAL-PLANETS',size:60}),b=generateGame({seed:'ORBITAL-PLANETS',size:60});
 for(let i=0;i<a.systems.length;i++){
  const one=generateSystemBodies(a.seed,a.systems[i]).planets,two=generateSystemBodies(b.seed,b.systems[i]).planets;
  assert.deepEqual(one,two);
  assert.ok(one.length>=4&&one.length<=7);
  const primary=one.filter(p=>p.isColonyWorld);
  assert.equal(primary.length,1);
  assert.equal(primary[0].biome,a.systems[i].biome);
  assert.equal(new Set(one.map(p=>p.id)).size,one.length);
 }
});
test('unity accrues, traditions follow prerequisites and change colony economics',()=>{
 const g=generateGame(),e=g.empires[0];
 assert.ok(unityIncome(g)>0);
 assert.equal(adoptTradition(g,'pathfinders').ok,false);
 const initial=e.unity;endTurn(g);assert.ok(e.unity>initial);
 e.unity=200;
 const initialCost=colonyCost(g).credits;
 assert.equal(adoptTradition(g,'frontier-spirit').ok,true);
 assert.equal(adoptTradition(g,'frontier-spirit').ok,false);
 assert.ok(colonyCost(g).credits<initialCost);
 assert.equal(adoptTradition(g,'pathfinders').ok,true);
 assert.ok(civicBonuses(e).fleet>0);
 assert.ok(traditionCost(e)>traditionCost({traditions:[]}));
 assert.ok(validateGame(JSON.parse(JSON.stringify(g))));
});
test('social policies are exclusive per slot, spend influence and affect production',()=>{
 const g=generateGame(),e=g.empires[0],old=income(g).credits,start=e.influence;
 assert.equal(enactPolicy(g,'open-markets').ok,true);
 assert.equal(e.influence,start-20);
 assert.ok(income(g).credits>old);
 assert.equal(enactPolicy(g,'open-markets').ok,false);
 assert.equal(enactPolicy(g,'directed-industry').ok,true);
 assert.deepEqual(e.policies,['directed-industry']);
 assert.equal(enactPolicy(g,'academic-freedom').ok,false);
 assert.equal(POLICIES.length,6);
 assert.equal(TRADITIONS.length,9);
});
test('new technologies have valid prerequisites, and older saves are compatible',()=>{
 const g=generateGame();
 assert.ok(TECHS.some(t=>t.id==='culture-networks'));
 for(const t of TECHS)for(const id of t.prereqs)assert.ok(TECHS.some(x=>x.id===id));
 assert.equal(chooseResearch(g,'civic-administration').ok,false);
 for(const e of g.empires){delete e.unity;delete e.traditions;delete e.policies;}
 assert.ok(validateGame(g));
 assert.ok(endTurn(g).ok);
 assert.ok(g.empires[0].unity>0);
});
