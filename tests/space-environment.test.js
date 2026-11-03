import test from 'node:test';
import assert from 'node:assert/strict';
import {generateGame,validateGame} from '../core.js';
import {generateSpaceFeatures,generateStarfield,hasScannedSite,canSurveySpaceSite,surveySpaceSite,validSpaceScans} from '../modules/space/environment.js';

test('Sol has asteroid mining and comet exploration, with no fictional black hole or monster',()=>{
  const g=generateGame({seed:'SOLAR-SPACE-TEST',scenario:'sol',size:60,opponents:2});
  const home=g.systems[g.empires[0].home],before=JSON.stringify(home);
  const first=generateSpaceFeatures(g.seed,home);
  assert.deepEqual(first,generateSpaceFeatures(g.seed,home));
  assert.equal(JSON.stringify(home),before);
  assert.equal(first.blackHole,false);
  assert.ok(first.sites.some(s=>s.kind==='asteroid'));
  assert.ok(first.sites.some(s=>s.kind==='comet'));
  assert.ok(!first.sites.some(s=>['blackHole','leviathan'].includes(s.kind)));
});
test('space environment is seeded and gives finite, bounded star and orbital locations',()=>{
  const a=generateStarfield('A',0),b=generateStarfield('A',0);
  assert.deepEqual(a,b);assert.notDeepEqual(a,generateStarfield('B',0));
  assert.equal(a.length,320);
  for(const star of a){assert.ok(Number.isFinite(star.x)&&Number.isFinite(star.y)&&Number.isFinite(star.z));assert.ok(Math.hypot(star.x,star.y,star.z)>114);assert.ok(star.brightness>=.35&&star.brightness<=1);}
  const system={id:21,realStarId:undefined};
  const env=generateSpaceFeatures('ABC',system);
  assert.equal(new Set(env.sites.map(s=>s.id)).size,env.sites.length);
  assert.ok(env.sites.every(s=>s.orbitRadius>0&&Number.isFinite(s.phase)));
  const spectrum=Array.from({length:320},(_,id)=>generateSpaceFeatures('ABC',{id}));
  assert.ok(spectrum.some(x=>x.blackHole),'rare black-hole systems exist');
  assert.ok(spectrum.some(x=>x.sites.some(s=>s.kind==='leviathan')),'leviathan encounters exist');
});
test('mining actually spends credits and awards alloys once, without changing saves or RNG rules',()=>{
  const g=generateGame({seed:'MINE-TEST',scenario:'sol',size:60,opponents:2});
  const id=g.empires[0].home,p=g.empires[0],oldCredits=p.credits,oldAlloys=p.alloys,oldRng=g.rng;
  assert.equal(canSurveySpaceSite(g,id,'asteroid-belt').ok,true);
  assert.equal(surveySpaceSite(g,id,'asteroid-belt').ok,true);
  assert.equal(p.credits,oldCredits-8);assert.equal(p.alloys,oldAlloys+18);
  assert.equal(g.rng,oldRng);assert.equal(hasScannedSite(g,id,'asteroid-belt'),true);
  assert.equal(surveySpaceSite(g,id,'asteroid-belt').ok,false);
  assert.equal(validateGame(g),true);
  assert.equal(surveySpaceSite(g,id,'not-a-site').ok,false);
});
test('comet grants unity once and optional scan state keeps old saves valid',()=>{
  const g=generateGame({seed:'COMET-TEST',scenario:'sol',size:60,opponents:2});
  const id=g.empires[0].home,unity=g.empires[0].unity;
  assert.equal(surveySpaceSite(g,id,'comet').ok,true);assert.equal(g.empires[0].unity,unity+10);
  assert.equal(surveySpaceSite(g,id,'comet').ok,false);
  assert.ok(validSpaceScans(g.spaceScans));assert.equal(validateGame(g),true);
  delete g.spaceScans;assert.equal(validateGame(g),true);
  assert.equal(validSpaceScans({'0:comet':false}),false);
  assert.equal(validSpaceScans({'__proto__:comet':true}),false);
});
test('exploration requires a colony or a fleet at site; hostile fauna requires corvettes',()=>{
  const g=generateGame({seed:'SPACE-SECURITY',size:60,opponents:2});
  const remote=g.systems.find(s=>s.owner===null&&s.id!==g.empires[0].home);
  assert.ok(remote);
  assert.equal(canSurveySpaceSite(g,remote.id,'asteroid-belt').ok,false);
  const monsterSystem=Array.from({length:300},(_,id)=>({id})).find(s=>generateSpaceFeatures(g.seed,s).sites.some(x=>x.kind==='leviathan'));
  assert.ok(monsterSystem);
  // Use an already visited original system for a battle rule test, without overwriting production data.
  const enemyId=g.empires[0].home,gHome=g.systems[enemyId];
  const mock={...g,systems:g.systems.map(s=>({...s})),fleets:g.fleets.map(f=>({...f,ships:{...f.ships}})),spaceScans:{}};
  mock.systems[enemyId].realStarId=undefined;
  const site=generateSpaceFeatures(mock.seed,mock.systems[enemyId]).sites.find(s=>s.kind==='leviathan');
  if(site){const f=mock.fleets.find(f=>f.owner===0&&f.system===enemyId),count=f.ships.corvette;
    assert.equal(surveySpaceSite(mock,enemyId,'leviathan').ok,true);
    assert.equal(f.ships.corvette,count-1);assert.equal(surveySpaceSite(mock,enemyId,'leviathan').ok,false);
  }else{assert.equal(canSurveySpaceSite(mock,enemyId,'leviathan').ok,false);}
});
