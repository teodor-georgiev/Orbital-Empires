import test from 'node:test';
import assert from 'node:assert/strict';
import { generateGame, validateGame, getNeighbors, ownedSystems, income, availableTechs, chooseResearch, colonize, canColonize, build, canBuild, canMove, moveFleet, recruit, endTurn, getVisibility, sendEnvoy, declareWar, offerPeace, score } from '../core.js';

test('same seed deterministically generates the same reachable galaxy',()=>{
 const a=generateGame({seed:'ANDROMEDA-42',size:90,opponents:4}),b=generateGame({seed:'ANDROMEDA-42',size:90,opponents:4});
 assert.deepEqual(a.systems,b.systems);assert.equal(a.systems.length,90);assert.equal(a.empires.length,5);assert.equal(validateGame(a),true);
 const visited=new Set([0]);const work=[0];while(work.length){for(const neighbor of getNeighbors(a,work.shift()))if(!visited.has(neighbor.id)){visited.add(neighbor.id);work.push(neighbor.id)}}assert.equal(visited.size,90);
 for(const s of a.systems)for(const n of s.neighbors)assert.ok(a.systems[n].neighbors.includes(s.id));
});
test('new game fields are valid, homeworlds are non-overlapping and positive incomes',()=>{
 for(const size of [40,60,90,140,180]){const g=generateGame({seed:'BETA-'+size,size,opponents:6});assert.equal(g.systems.length,size);assert.equal(new Set(g.empires.map(e=>e.home)).size,7);assert.equal(ownedSystems(g,0).length,1);assert.ok(income(g).credits>0);assert.ok(income(g).science>0);assert.ok(getVisibility(g).has(g.empires[0].home));}
});
test('colonies require supply line and consume resource cost',()=>{
 const g=generateGame();const home=g.empires[0].home,adj=getNeighbors(g,home).find(s=>s.owner===null);assert.ok(adj);const initial={...g.empires[0]};
 assert.equal(canColonize(g,adj.id).ok,true);assert.equal(colonize(g,adj.id).ok,true);assert.equal(g.systems[adj.id].owner,0);assert.ok(g.empires[0].credits<initial.credits);assert.ok(g.empires[0].alloys<initial.alloys);assert.equal(colonize(g,adj.id).ok,false);
 const far=g.systems.find(s=>s.owner===null&&!s.neighbors.some(n=>g.systems[n].owner===0));assert.ok(far);assert.equal(canColonize(g,far.id).ok,false);
});
test('research prerequisites, production and buildings work',()=>{
 const g=generateGame();const home=g.empires[0].home;
 assert.equal(chooseResearch(g,'capital-ships').ok,false);
 assert.ok(availableTechs(g.empires[0]).some(t=>t.id==='stellar-survey'));
 assert.equal(canBuild(g,home,'exchange').ok,true);assert.equal(build(g,home,'exchange').ok,true);assert.equal(g.systems[home].buildings.exchange,2);
 const before=g.empires[0].credits;const production=income(g).credits;const result=endTurn(g);assert.equal(result.ok,true);assert.equal(g.empires[0].credits,before+production);assert.equal(g.turn,2);
 for(let i=0;i<15;i++)endTurn(g);assert.ok(g.empires[0].techs.length>=1);
});
test('fleet recruits, movement once per cycle and returns meaningful errors',()=>{
 const g=generateGame();const home=g.empires[0].home,neighbor=getNeighbors(g,home).find(s=>s.owner===null),fleet=g.fleets.find(f=>f.owner===0);
 assert.equal(recruit(g,home,'cruiser').ok,false);assert.equal(canMove(g,fleet.id,neighbor.id).ok,true);
 const other=3;assert.equal(moveFleet(g,fleet.id,neighbor.id).ok,true);assert.equal(fleet.system,neighbor.id);
 assert.equal(moveFleet(g,fleet.id,home).ok,false);endTurn(g);assert.equal(canMove(g,fleet.id,home).ok,true);
 assert.equal(moveFleet(g,fleet.id,home).ok,true);
});
test('diplomacy, saving structure and stable 30-turn simulation',()=>{
 const g=generateGame({seed:'BULGARIA',size:90,opponents:5});
 assert.equal(sendEnvoy(g,1).ok,true);assert.equal(sendEnvoy(g,1).ok,false);
 assert.equal(declareWar(g,1).ok,true);assert.equal(g.empires[1].wars[0],true);
 assert.equal(offerPeace(g,1).ok,true);assert.equal(g.empires[1].wars[0],false);
 for(let i=0;i<30;i++){const r=endTurn(g);if(!r.ok)break;assert.ok(validateGame(g));assert.ok(g.fleets.every(f=>g.systems[f.system]));assert.ok(g.systems.every(s=>s.owner===null||g.empires[s.owner]));}
 assert.ok(score(g,0)>0);assert.ok(JSON.parse(JSON.stringify(g)).systems.length===90);
});
