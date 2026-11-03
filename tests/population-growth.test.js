import test from 'node:test';
import assert from 'node:assert/strict';
import { generateGame, endTurn, validateGame } from '../core.js';
import { populationCapacity, populationGrowth, advancePopulation, populationForecast } from '../modules/simulation/population.js';

test('colonies approach a habitat-dependent carrying capacity without overshooting',()=>{
 for(const habitability of [1,2,3]) {
  const s={owner:0,habitability,richness:2,population:2};
  const k=populationCapacity(s);assert.ok(k>2);let last=2;
  for(let i=0;i<400;i++){advancePopulation(s);assert.ok(s.population>=last);assert.ok(s.population<=k);last=s.population;}
  assert.ok(k-s.population<0.02, 'colony should approach capacity');
  assert.equal(populationForecast(s).capacity,k);
 }
});
test('growth slows near saturation and is not driven by random population spikes',()=>{
 const a={owner:0,habitability:3,richness:2,population:12};
 const k=populationCapacity(a);
 const near={...a,population:k-1};
 assert.ok(populationGrowth(a)>populationGrowth(near));
 const forecast=populationForecast(a);assert.ok(forecast.growth>0);
 assert.ok(forecast.percent>0&&forecast.percent<100);
 assert.ok(forecast.growth<2);
});
test('unclaimed worlds do not grow and invalid population is bounded',()=>{
 const unowned={owner:null,habitability:3,richness:4,population:0};
 assert.equal(advancePopulation(unowned),0);
 assert.equal(unowned.population,0);
 const damaged={owner:1,habitability:2,richness:1,population:100};
 const cap=populationCapacity(damaged);
 advancePopulation(damaged);
 assert.equal(damaged.population,cap);
});
test('legacy integer saves keep schema v1, turn updates are deterministic and decimal',()=>{
 const a=generateGame({seed:'POPULATION-TEST',size:60,opponents:2});
 const b=structuredClone(a);const s=a.systems[a.empires[0].home];const initial=s.population;
 assert.equal(validateGame(a),true);
 endTurn(a);endTurn(b);
 assert.ok(s.population>initial);
 assert.ok(s.population-initial<2);
 assert.equal(s.population,b.systems[b.empires[0].home].population);
 assert.equal(validateGame(JSON.parse(JSON.stringify(a))),true);
});
