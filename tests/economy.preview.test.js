import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BUILDINGS, BIOME_BUILDINGS, generateGame, getNeighbors,
  systemYield, build, colonize
} from '../core.js';
import { resourceShortfalls } from '../modules/economy/ledger.js';
import {
  previewColonyUpgrade, recommendColonyInvestments
} from '../modules/economy/upgrade-preview.js';

const setup = seed => generateGame({seed, size:48, opponents:2});
const allBuildings = [...BUILDINGS, ...BIOME_BUILDINGS];

test('an upgrade preview predicts actual credits and alloys yields with no save mutation', () => {
  const game = setup('FORECAST-PARITY');
  const home = game.empires[0].home;
  const building = BUILDINGS.find(b=>b.id==='exchange');
  const before = JSON.stringify(game);
  const preview = previewColonyUpgrade(game, home, building, systemYield, {credits:40,alloys:20});
  assert.equal(JSON.stringify(game), before, 'forecast must not alter the campaign');
  assert.equal(preview.systemId, home);
  assert.equal(preview.buildingId, 'exchange');
  assert.equal(preview.nextLevel, 2);
  assert.deepEqual(preview.cost, {credits:building.credit[1],alloys:building.cost[1]});
  const oldYield = systemYield(game,game.systems[home]);
  assert.equal(build(game,home,'exchange').ok, true);
  const newYield = systemYield(game,game.systems[home]);
  for (const resource of ['credits','alloys','science','influence']) {
    assert.equal(preview.gain[resource],newYield[resource]-oldYield[resource]);
  }
  assert.equal(preview.gain.credits>0,true);
  assert.equal(preview.affordable,true);
  assert.equal(preview.preservesReserves,true);
});

test('biome-ineligible, maxed, foreign and absent targets are omitted',()=>{
  const game = setup('FORECAST-INELIGIBLE');
  const home = game.empires[0].home;
  game.systems[home].biome='Barren';
  assert.equal(previewColonyUpgrade(game, home, BIOME_BUILDINGS.find(b=>b.id==='agri-domes'),systemYield),null);
  game.systems[home].buildings.exchange=3;
  assert.equal(previewColonyUpgrade(game,home,BUILDINGS.find(b=>b.id==='exchange'),systemYield),null);
  assert.equal(previewColonyUpgrade(game,game.empires[1].home,BUILDINGS[0],systemYield),null);
  assert.equal(previewColonyUpgrade(game,-1,BUILDINGS[0],systemYield),null);
  assert.equal(previewColonyUpgrade(game,home,null,systemYield),null);
});

test('costs and reserve checks are advisory, and visible shortages are exact',()=>{
  const game=setup('FORECAST-BUDGET');
  const e=game.empires[0],home=e.home;
  e.credits=32;e.alloys=15;
  const b=BUILDINGS.find(x=>x.id==='foundry');
  const reserves={credits:20,alloys:10};
  const before=JSON.stringify(game);
  const report=previewColonyUpgrade(game,home,b,systemYield,reserves);
  assert.equal(report.affordable,false);
  assert.equal(report.preservesReserves,false);
  assert.deepEqual(report.shortfalls,resourceShortfalls(
    {credits:e.credits,alloys:e.alloys},report.cost,reserves));
  assert.equal(JSON.stringify(game),before);
  assert.equal(report.gain.alloys>0,true);
});

test('recommendations return one positive-production option per colony in stable order',()=>{
  const game=setup('FORECAST-MULTICOLONY');
  const first=game.empires[0].home;
  const next=getNeighbors(game,first).find(s=>s.owner===null);
  assert.ok(next);
  assert.equal(colonize(game,next.id).ok,true);
  const prior=JSON.stringify(game);
  const a=recommendColonyInvestments(game,allBuildings,systemYield,{reserves:{credits:30,alloys:20},limit:4});
  const b=recommendColonyInvestments(game,allBuildings,systemYield,{reserves:{credits:30,alloys:20},limit:4});
  assert.deepEqual(a,b);
  assert.equal(JSON.stringify(game),prior);
  assert.equal(a.length,2);
  assert.equal(new Set(a.map(x=>x.systemId)).size,2);
  assert.ok(a.every(x=>Object.values(x.gain).some(v=>v>0)));
  assert.deepEqual(recommendColonyInvestments(game,allBuildings,systemYield,{limit:1}).length,1);
  assert.deepEqual(recommendColonyInvestments(game,[BUILDINGS.find(x=>x.id==='citadel')],systemYield),[]);
});

test('invalid reserves and recommendation limits fail safely',()=>{
  const game=setup('FORECAST-VALIDATION'),home=game.empires[0].home;
  assert.throws(()=>previewColonyUpgrade(game,home,BUILDINGS[0],systemYield,{credits:-1}),RangeError);
  assert.throws(()=>recommendColonyInvestments(game,allBuildings,systemYield,{limit:-1}),RangeError);
});
