import test from 'node:test';
import assert from 'node:assert/strict';
import {generateGame,validateGame,advanceMonth,canUpgradeOutpost,upgradeOutpost,colonize,combat,reconcileShipUnits,shipUnitRoster,orderSelectedShips,splitShipSelection,mergeShipSelection,getOutpost,outpostDefense} from '../core.js';
import {makeOutpost,damageOutpost,getOutpost as directOutpost,restoreOutpost,OUTPOST_TIERS} from '../modules/strategy/outposts.js';

function game(){return generateGame({scenario:'sol',seed:'OUTPOST-TEST-2200',size:60,opponents:2,startYear:2200});}

test('home systems and newly claimed colonies automatically receive a defensive outpost',()=>{
 const g=game();const home=g.systems[g.empires[0].home];
 assert.equal(home.outpost.level,1);assert.ok(outpostDefense(home)>0);
 const candidate=g.systems.find(s=>s.owner===null&&s.neighbors.includes(home.id));
 assert.ok(candidate);
 assert.equal(colonize(g,candidate.id).ok,true);
 assert.equal(candidate.outpost.level,1);
 assert.equal(validateGame(g),true);
});
test('upgrades charge resources, strengthen defenses and cannot exceed citadel tier',()=>{
 const g=game(),home=g.systems[g.empires[0].home],emp=g.empires[0],before=outpostDefense(home);
 const price=canUpgradeOutpost(g,home.id);
 assert.equal(price.ok,true);
 const credits=emp.credits,alloys=emp.alloys;
 assert.equal(upgradeOutpost(g,home.id).ok,true);
 assert.equal(home.outpost.level,2);assert.ok(outpostDefense(home)>before);
 assert.equal(credits-emp.credits,price.cost.credits);
 assert.equal(alloys-emp.alloys,price.cost.alloys);
 home.outpost=makeOutpost(4);
 assert.equal(canUpgradeOutpost(g,home.id).ok,false);
 assert.equal(upgradeOutpost(g,home.id).ok,false);
});
test('siege damage reduces outpost strength; it can be destroyed and repaired in monthly play',()=>{
 const g=game(),home=g.systems[g.empires[0].home];
 const def=outpostDefense(home);
 damageOutpost(home,30);
 assert.ok(outpostDefense(home)<def);
 assert.equal(home.outpost.hp,30);
 restoreOutpost(home,6);assert.equal(home.outpost.hp,36);
 damageOutpost(home,999);
 assert.equal(home.outpost.level,0);assert.equal(outpostDefense(home),0);
 home.outpost=makeOutpost(1);
 advanceMonth(g);
 assert.equal(home.outpost.hp,OUTPOST_TIERS[1].maxHp);
});
test('enemy stations enter combat resolution; victory captures ruined outpost',()=>{
 const g=game(),attacker=g.fleets.find(f=>f.owner===0),target=g.systems[g.empires[1].home];
 assert.ok(target.outpost);
 const war=g.empires[0].wars;war[1]=true;g.empires[1].wars[0]=true;
 attacker.ships={corvette:100,frigate:0,cruiser:0};reconcileShipUnits(g);
 assert.equal(combat(g,attacker,target.id),true);
 assert.equal(target.owner,0);
 assert.equal(target.outpost.level,0);
 assert.equal(outpostDefense(target),0);
 assert.equal(canUpgradeOutpost(g,target.id).ok,true);
 assert.equal(validateGame(g),true);
});
test('legacy saves with absent ship units and outposts load and reconcile safely',()=>{
 const g=game();
 for(const s of g.systems)delete s.outpost;
 for(const f of g.fleets)delete f.units;
 delete g.nextShipId;
 assert.equal(validateGame(g),true);
 const legacy=structuredClone(g);
 reconcileShipUnits(legacy);
 assert.equal(validateGame(legacy),true);
 assert.equal(directOutpost(legacy.systems[legacy.empires[0].home]).level,1);
 const ids=shipUnitRoster(legacy,legacy.empires[0].home).map(u=>u.id);
 assert.equal(new Set(ids).size,ids.length);
});
test('ship selection orders persist through save, splitting and merging without duplicating units',()=>{
 const g=game(),home=g.empires[0].home,roster=shipUnitRoster(g,home).filter(u=>u.owner===0);
 assert.equal(roster.length,3);
 const ids=roster.slice(0,2).map(x=>x.id);
 let r=orderSelectedShips(g,ids,{kind:'orbit',planetId:2});
 assert.equal(r.ok,true);
 assert.equal(g.fleets.filter(f=>f.owner===0).length,2);
 assert.equal(shipUnitRoster(g,home).find(u=>u.id===ids[0]).localOrder.kind,'orbit');
 assert.equal(validateGame(structuredClone(g)),true);
 const allIds=shipUnitRoster(g,home).filter(u=>u.owner===0).map(u=>u.id);
 assert.equal(mergeShipSelection(g,allIds).ok,true);
 assert.equal(g.fleets.filter(f=>f.owner===0).length,1);
 assert.equal(shipUnitRoster(g,home).filter(u=>u.owner===0).length,3);
 assert.equal(splitShipSelection(g,[allIds[0]]).ok,true);
 assert.equal(validateGame(g),true);
 r=orderSelectedShips(g,[allIds[0]],{kind:'move',position:[2.3,-1.5]});
 assert.equal(r.ok,true);
 assert.deepEqual(shipUnitRoster(g,home).find(u=>u.id===allIds[0]).localOrder.position,[2.3,-1.5]);
 assert.equal(orderSelectedShips(g,[allIds[0]],{kind:'orbit',planetId:99}).ok,false);
 assert.equal(orderSelectedShips(g,[allIds[0]],{kind:'move',position:[999,0]}).ok,false);
});
