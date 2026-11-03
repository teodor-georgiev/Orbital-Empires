import test from 'node:test';
import assert from 'node:assert/strict';
import { generateGame, advanceMonth, endTurn, getStardate, canQueueFleetRoute, queueFleetRoute, cancelFleetRoute, fleetRouteETA, validateGame } from '../core.js';
import { createMonthlyClock } from '../modules/simulation/monthly-clock.js';
import { findHyperlaneRoute } from '../modules/strategy/fleet-routes.js';

test('campaign advances by calendar months from January 2200',()=>{
 const g=generateGame({scenario:'sol',startYear:2200,seed:'REAL-TIME-2200',size:60,opponents:2});
 assert.equal(getStardate(g),'2200.01');
 const money=g.empires[0].credits;
 for(let n=0;n<12;n++)assert.equal(advanceMonth(g).ok,true);
 assert.equal(getStardate(g),'2201.01');
 assert.ok(g.empires[0].credits>money);
 assert.ok(validateGame(g));
 assert.equal(endTurn,advanceMonth);
});
test('monthly clock runs while active; suspension does not accumulate catch-up',()=>{
 const g=generateGame({seed:'CLOCK-MONTH',size:60,opponents:2});
 const timers=new Map();let nextId=1,advances=0;
 const clock=createMonthlyClock({getGame:()=>g,advanceMonth,onAdvance:()=>advances++,schedule:(cb,ms)=>{const id=nextId++;timers.set(id,{cb,ms});return id;},cancel:id=>timers.delete(id)});
 assert.equal(clock.state().running,false);assert.equal(clock.state().speed,'normal');
 clock.resume();assert.equal(timers.size,1);
 const first=[...timers.values()][0];assert.equal(first.ms,1400);
 first.cb();assert.equal(getStardate(g),'2200.02');assert.equal(advances,1);
 clock.setSpeed('fast');assert.equal(timers.size,1);assert.equal([...timers.values()][0].ms,550);
 clock.suspend();assert.equal(timers.size,0);
 assert.equal(clock.step().ok,true);assert.equal(getStardate(g),'2200.03');
 clock.resume();clock.suspend();assert.equal(getStardate(g),'2200.03');
 assert.throws(()=>clock.setSpeed('bad'),RangeError);
});
test('fleets receive multi-month route orders, move once per month and stop safely',()=>{
 const g=generateGame({seed:'FLEET-ROUTE-RT',size:60,opponents:2});
 const fleet=g.fleets.find(f=>f.owner===0),home=fleet.system;
 g.explored=g.systems.map(s=>s.id);
 const allowed=id=>g.systems[id].owner===null||g.systems[id].owner===0;
 const distant=g.systems.find(s=>s.owner===null&&(findHyperlaneRoute(g.systems,home,s.id,allowed)?.length??0)>1);
 assert.ok(distant,'an unclaimed system at least two hops away must exist');
 const plan=canQueueFleetRoute(g,fleet.id,distant.id);
 assert.equal(plan.ok,true);assert.ok(plan.months>1);
 assert.equal(queueFleetRoute(g,fleet.id,distant.id).ok,true);
 assert.equal(fleet.system,home);assert.equal(fleetRouteETA(fleet),plan.months);
 advanceMonth(g);assert.equal(fleetRouteETA(fleet),plan.months-1);
 assert.notEqual(fleet.system,distant.id);
 assert.equal(validateGame(JSON.parse(JSON.stringify(g))),true);
 assert.equal(cancelFleetRoute(g,fleet.id).ok,true);
 const stopped=fleet.system;advanceMonth(g);assert.equal(fleet.system,stopped);
 assert.equal(fleetRouteETA(fleet),0);
});
test('hyperlane routing never traverses blocked systems and handles unreachable destinations',()=>{
 const s=[{neighbors:[1]},{neighbors:[0,2]},{neighbors:[1]}];
 assert.deepEqual(findHyperlaneRoute(s,0,2),[1,2]);
 assert.equal(findHyperlaneRoute(s,0,2,n=>n!==1),null);
 assert.deepEqual(findHyperlaneRoute(s,0,0),[]);
 assert.equal(findHyperlaneRoute(s,0,9),null);
});
