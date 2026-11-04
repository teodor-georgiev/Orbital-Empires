import test from 'node:test';
import assert from 'node:assert/strict';
import {
 generateGame,validateGame,advanceMonth,combat,reconcileShipUnits,getOutpost,outpostDefense,
 stationMaxHp,stationModules,stationPlatforms,stationIncome,stationUnderSiege,
 canUpgradeOutpost,upgradeOutpost,canInstallStationModule,installStationModule,
 canBuildStationPlatform,buildStationPlatform,systemYield,aiTurn
} from '../core.js';
import {
 OUTPOST_TIERS,MODULE_SLOTS,PLATFORM_LIMITS,PLATFORM_HP,STATION_MODULES,
 makeOutpost,damageOutpost,canAddModule,addModule,canAddPlatform,addPlatform
} from '../modules/strategy/outposts.js';
import {
 buildStationMesh,buildOutpostMesh,buildPlatformMesh,stationPosition,stationScale,platformPositions,STATION_ORBIT
} from '../modules/visuals/ship-models.js';

function game(seed='STAR-STATION-2200'){
 return generateGame({seed,size:60,opponents:2,startYear:2200});
}
function meshRadius(mesh){
 let max=0;
 for(let i=0;i<mesh.length;i+=6)max=Math.max(max,Math.hypot(mesh[i],mesh[i+1],mesh[i+2]));
 return max;
}
/** A player fleet large enough to always beat a tier-4 station but not to raze a 320 HP one. */
function siegeGame(seed='STATION-SIEGE'){
 const g=generateGame({seed,size:60,opponents:2,startYear:2200});
 g.empires[0].wars[1]=true;g.empires[1].wars[0]=true;
 const target=g.systems[g.empires[1].home];
 g.fleets=g.fleets.filter(f=>f.owner!==1); // the home squadron is destroyed in the first assault
 const fleet=g.fleets.find(f=>f.owner===0);
 fleet.ships={corvette:41,frigate:0,cruiser:0};
 fleet.system=target.id;
 fleet.movedTurn=0;
 reconcileShipUnits(g);
 target.outpost={...makeOutpost(4),platforms:PLATFORM_LIMITS[4]};
 target.outpost.hp=stationMaxHp(target);
 return {g,target,fleet};
}

test('the station orbits between the star and the first planet at every tier',()=>{
 const first=stationPosition(0),later=stationPosition(40);
 for(const pos of [first,later]){
  assert.equal(pos.length,3);
  assert.ok(pos.every(Number.isFinite));
  assert.equal(pos[1],.25);
  assert.ok(Math.abs(Math.hypot(pos[0],pos[2])-STATION_ORBIT)<1e-9);
 }
 assert.ok(Math.hypot(later[0]-first[0],later[2]-first[2])>.25,'the station moves along its orbit');
 assert.deepEqual(stationPosition(12),stationPosition(12));
 const reach=Math.max(...[1,2,3,4].map(level=>stationScale(level)*meshRadius(buildStationMesh(level))));
 assert.ok(STATION_ORBIT-reach>.92,'the largest station clears the star');
 assert.ok(STATION_ORBIT+reach<2.4,'the largest station stays inside the first planet orbit');
 assert.equal(stationScale(0),0);
 const platforms=platformPositions(stationPosition(0),3,0);
 assert.equal(platforms.length,3);
 for(const p of platforms)assert.ok(Math.abs(Math.hypot(p[0]-stationPosition(0)[0],p[2]-stationPosition(0)[2])-.62)<1e-9);
});

test('station meshes gain triangles at every tier and stay inside the safe radius',()=>{
 let previous=0;
 for(const level of [1,2,3,4]){
  const mesh=buildStationMesh(level);
  assert.equal(mesh.length%18,0);
  assert.ok(mesh.length>previous,`tier ${level} must be larger than tier ${level-1}`);
  previous=mesh.length;
  assert.ok([...mesh].every(Number.isFinite));
  assert.ok(meshRadius(mesh)<=1.4+1e-9,`tier ${level} radius ${meshRadius(mesh)}`);
 }
 assert.deepEqual([...buildStationMesh(1)],[...buildOutpostMesh()],'tier 1 keeps the original outpost shape');
 const platform=buildPlatformMesh();
 assert.ok(platform.length>0);
 assert.equal(platform.length%18,0);
 assert.ok(meshRadius(platform)<.4);
 assert.equal(buildStationMesh(0).length,0);
});

test('module slots and platform limits follow the station tier',()=>{
 const ids=Object.keys(STATION_MODULES);
 assert.equal(ids.length,4);
 for(const level of [1,2,3,4]){
  const slots=MODULE_SLOTS[level],platforms=PLATFORM_LIMITS[level];
  const station={owner:0,outpost:makeOutpost(level)};
  for(let i=0;i<slots;i++)assert.equal(addModule(station,ids[i]).ok,true,`slot ${i} at tier ${level}`);
  assert.equal(stationModules(station).length,slots);
  if(slots<ids.length)assert.equal(canAddModule(station,ids[slots]).ok,false,'no free slot');
  for(let i=0;i<platforms;i++)assert.equal(addPlatform(station).ok,true);
  assert.equal(stationPlatforms(station),platforms);
  assert.equal(canAddPlatform(station).ok,false,'platform limit');
  assert.equal(station.outpost.hp,OUTPOST_TIERS[level].maxHp+platforms*PLATFORM_HP);
 }
 const duplicate={owner:0,outpost:makeOutpost(3)};
 assert.equal(canAddModule(duplicate,'gun-battery').ok,true);
 assert.equal(addModule(duplicate,'gun-battery').ok,true);
 assert.equal(canAddModule(duplicate,'gun-battery').ok,false,'each module only once');
 assert.equal(canAddModule(duplicate,'plasma-lance').ok,false,'unknown module');
 assert.equal(canAddModule({owner:0,outpost:makeOutpost(0)},'gun-battery').ok,false,'ruined station');
 assert.equal(canAddPlatform({owner:0,outpost:makeOutpost(0)}).ok,false);
});

test('refits cost exactly once and refused refits spend nothing',()=>{
 const g=game('STATION-COST'),home=g.systems[g.empires[0].home],emp=g.empires[0],foreign=g.systems[g.empires[1].home];
 emp.credits=2000;emp.alloys=2000;
 let credits=emp.credits,alloys=emp.alloys;
 const moduleCost=canInstallStationModule(g,home.id,'repair-dock').cost;
 assert.equal(installStationModule(g,home.id,'repair-dock').ok,true);
 assert.equal(credits-emp.credits,moduleCost.credits);
 assert.equal(alloys-emp.alloys,moduleCost.alloys);
 credits=emp.credits;alloys=emp.alloys;
 assert.equal(installStationModule(g,home.id,'repair-dock').ok,false,'duplicate module');
 assert.equal(installStationModule(g,home.id,'gun-battery').ok,false,'no free slot at tier 1');
 assert.equal(emp.credits,credits);assert.equal(emp.alloys,alloys);
 const platformCost=canBuildStationPlatform(g,home.id).cost;
 assert.equal(buildStationPlatform(g,home.id).ok,true);
 assert.equal(credits-emp.credits,platformCost.credits);
 assert.equal(alloys-emp.alloys,platformCost.alloys);
 credits=emp.credits;
 assert.equal(buildStationPlatform(g,home.id).ok,false,'platform limit at tier 1');
 assert.equal(emp.credits,credits);
 assert.equal(canInstallStationModule(g,foreign.id,'gun-battery').ok,false,'foreign system');
 assert.equal(installStationModule(g,foreign.id,'gun-battery').ok,false);
 assert.equal(canBuildStationPlatform(g,foreign.id).ok,false);
 assert.equal(buildStationPlatform(g,foreign.id).ok,false);
 assert.equal(emp.credits,credits);
 const poor=game('STATION-POOR');
 poor.empires[0].credits=0;poor.empires[0].alloys=0;
 const poorHome=poor.systems[poor.empires[0].home];
 assert.equal(installStationModule(poor,poorHome.id,'gun-battery').ok,false);
 assert.equal(buildStationPlatform(poor,poorHome.id).ok,false);
 assert.equal(poor.empires[0].credits,0);assert.equal(poor.empires[0].alloys,0);
 assert.equal(validateGame(g),true);
});

test('modules and platforms raise defense while the tier fields stay canonical',()=>{
 const g=game('STATION-DEFENSE'),home=g.systems[g.empires[0].home],emp=g.empires[0];
 emp.credits=5000;emp.alloys=5000;
 assert.equal(upgradeOutpost(g,home.id).ok,true);
 const base=outpostDefense(home);
 assert.equal(installStationModule(g,home.id,'gun-battery').ok,true);
 const withGun=outpostDefense(home);
 assert.ok(withGun>base);
 assert.equal(installStationModule(g,home.id,'shield-lattice').ok,true);
 const withLattice=outpostDefense(home);
 assert.ok(withLattice>withGun);
 assert.equal(buildStationPlatform(g,home.id).ok,true);
 assert.ok(outpostDefense(home)>withLattice);
 const tier=OUTPOST_TIERS[home.outpost.level];
 assert.equal(home.outpost.armor,tier.armor);
 assert.equal(home.outpost.shield,tier.shield);
 assert.equal(home.outpost.power,tier.power);
 assert.equal(validateGame(g),true);

 const modules=stationModules(home).slice(),platforms=stationPlatforms(home);
 const hp=stationMaxHp(home);
 assert.equal(upgradeOutpost(g,home.id).ok,true);
 assert.deepEqual(stationModules(home),modules,'upgrades keep installed modules');
 assert.equal(stationPlatforms(home),platforms,'upgrades keep platforms');
 assert.equal(stationMaxHp(home),OUTPOST_TIERS[home.outpost.level].maxHp+platforms*PLATFORM_HP);
 assert.equal(home.outpost.hp,stationMaxHp(home));
 assert.ok(stationMaxHp(home)>hp);
 assert.equal(validateGame(g),true);
});

test('a winning fleet besieges the station instead of seizing the system',()=>{
 const {g,target,fleet}=siegeGame();
 assert.equal(combat(g,fleet,target.id),true);
 assert.equal(target.owner,1,'the system keeps its owner while the station stands');
 assert.ok(g.fleets.some(f=>f.id===fleet.id),'the besieging fleet survives its victory');
 assert.equal(getOutpost(target).level,4);
 assert.ok(getOutpost(target).hp>0);
 assert.ok(g.logs[0].message.includes('is besieging '+target.name),g.logs[0].message);
 assert.equal(validateGame(g),true);
});

test('a siege continues each month until the system falls or the fleet is destroyed',()=>{
 const {g,target,fleet}=siegeGame('STATION-SIEGE-2');
 let resolved=false;
 for(let month=0;month<15&&!resolved;month++){
  advanceMonth(g);
  resolved=!g.fleets.some(f=>f.id===fleet.id)||target.owner===0;
  if(target.owner===0)assert.equal(getOutpost(target).level,0,'a captured station is ruined');
 }
 assert.equal(resolved,true,'the siege must resolve within fifteen months');
 assert.equal(validateGame(g),true);
});

test('a besieged station cannot repair while hostile ships hold orbit',()=>{
 const g=game('STATION-NO-REPAIR'),home=g.systems[g.empires[0].home],emp=g.empires[0];
 emp.credits=5000;emp.alloys=5000;
 home.outpost={...makeOutpost(4),hp:OUTPOST_TIERS[4].maxHp};
 g.fleets=g.fleets.filter(f=>!(f.owner===0&&f.system===home.id));
 g.empires[0].wars[1]=true;g.empires[1].wars[0]=true;
 g.fleets.push({id:g.nextFleetId++,owner:1,system:home.id,ships:{corvette:41,frigate:0,cruiser:0},movedTurn:0,name:'Siege Group'});
 reconcileShipUnits(g);
 assert.equal(stationUnderSiege(g,home.id),true);
 // The same rng draws in a clone give the exact damage the month will apply.
 const clone=structuredClone(g);
 combat(clone,clone.fleets.find(f=>f.id!==undefined&&f.owner===1&&f.system===home.id),home.id);
 const expected=clone.systems[home.id].outpost.hp;
 assert.ok(expected<OUTPOST_TIERS[4].maxHp);
 advanceMonth(g);
 assert.equal(getOutpost(home).hp,expected,'no damage control is applied while besieged');
 assert.equal(stationUnderSiege(g,home.id),true);
 assert.equal(validateGame(g),true);
});

test('a cleared orbit repairs the station each month and a repair dock heals faster',()=>{
 const g=game('STATION-REPAIR'),home=g.systems[g.empires[0].home],emp=g.empires[0];
 emp.credits=5000;emp.alloys=5000;
 home.outpost={...makeOutpost(4),hp:OUTPOST_TIERS[4].maxHp};
 damageOutpost(home,40);
 const damaged=getOutpost(home).hp;
 assert.equal(stationUnderSiege(g,home.id),false);
 advanceMonth(g);
 assert.equal(getOutpost(home).hp,damaged+6);
 assert.equal(installStationModule(g,home.id,'repair-dock').ok,true);
 damageOutpost(home,40);
 const damagedAgain=getOutpost(home).hp;
 advanceMonth(g);
 assert.equal(getOutpost(home).hp,damagedAgain+6+STATION_MODULES['repair-dock'].repair);
 assert.equal(validateGame(g),true);
});

test('a knocked-out station loses its refits and the captured system is left ruined',()=>{
 const {g,target,fleet}=siegeGame('STATION-KNOCKOUT');
 target.outpost={...makeOutpost(2),modules:['gun-battery'],platforms:2,hp:1};
 assert.equal(validateGame(g),true);
 assert.equal(combat(g,fleet,target.id),true);
 assert.equal(target.owner,0);
 assert.equal(getOutpost(target).level,0);
 assert.deepEqual(stationModules(target),[]);
 assert.equal(stationPlatforms(target),0);
 assert.equal(outpostDefense(target),0);
 assert.equal(validateGame(g),true);
});

test('a trade relay adds exactly four credits per month and nothing once wrecked',()=>{
 const g=game('STATION-TRADE'),home=g.systems[g.empires[0].home],emp=g.empires[0];
 emp.credits=5000;emp.alloys=5000;
 const base=systemYield(g,home).credits;
 assert.equal(stationIncome(home),0);
 assert.equal(installStationModule(g,home.id,'trade-relay').ok,true);
 assert.equal(stationIncome(home),STATION_MODULES['trade-relay'].income);
 assert.equal(systemYield(g,home).credits,base+4);
 damageOutpost(home,9999);
 assert.equal(stationIncome(home),0);
 assert.equal(systemYield(g,home).credits,base);
 assert.equal(validateGame(g),true);
});

test('a rival upgrades its weakest station without consuming the random stream',()=>{
 const rich=game('STATION-AI');
 const quiet=structuredClone(rich);
 for(const g of [rich,quiet]){
  const rival=g.empires[1];
  rival.credits=4000;rival.alloys=4000;
 }
 // The quiet twin has no upgradable station, so only the refit step differs.
 for(const s of quiet.systems)if(s.owner===1&&s.outpost)s.outpost=makeOutpost(4);
 const owned=rich.systems.filter(s=>s.owner===1);
 const before=owned.map(s=>getOutpost(s).level);
 const lowest=owned.slice().sort((a,b)=>getOutpost(a).level-getOutpost(b).level)[0];
 aiTurn(rich,rich.empires[1]);
 aiTurn(quiet,quiet.empires[1]);
 assert.equal(rich.rng,quiet.rng,'the refit must not draw a random number');
 assert.ok(owned.some((s,index)=>getOutpost(s).level>before[index]),'one weak station was upgraded');
 assert.ok(getOutpost(lowest).level>Math.min(...before));
 assert.ok(rich.empires[1].credits<4000,'the refit is paid for');
});

test('tampered station saves are rejected while old saves still load',()=>{
 const tamper=mutate=>{const g=game('STATION-SAVE');mutate(g.systems[g.empires[0].home],g);return validateGame(g);};
 const home=system=>{system.outpost={...makeOutpost(2),modules:['gun-battery'],platforms:2};return system;};
 assert.equal(tamper(s=>home(s)),true,'a legal refitted station validates');
 assert.equal(tamper(s=>{home(s).outpost.modules=['warp-drive'];}),false,'unknown module');
 assert.equal(tamper(s=>{home(s).outpost.modules=['gun-battery','shield-lattice','repair-dock'];}),false,'too many modules');
 assert.equal(tamper(s=>{home(s).outpost.modules=['gun-battery','gun-battery'];}),false,'duplicate module');
 assert.equal(tamper(s=>{home(s).outpost.platforms=3;}),false,'too many platforms');
 assert.equal(tamper(s=>{home(s);s.outpost.hp=stationMaxHp(s)+1;}),false,'hp above maximum');
 assert.equal(tamper(s=>{home(s).outpost.modules='gun-battery';}),false,'modules must be an array');
 assert.equal(tamper(s=>{home(s).outpost.platforms=1.5;}),false,'platforms must be a whole number');
 assert.equal(tamper(s=>{delete s.outpost;}),true,'old saves without a station stay valid');
 assert.equal(tamper(s=>{home(s);delete s.outpost.modules;delete s.outpost.platforms;}),true);
 const stale=game('STATION-LEGACY');
 for(const s of stale.systems)delete s.outpost;
 assert.equal(validateGame(stale),true);
 for(const s of stale.systems)if(s.owner!==null)s.outpost={...makeOutpost(1),hp:1};
 assert.equal(validateGame(stale),true);
});
