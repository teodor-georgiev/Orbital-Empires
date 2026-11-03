import test from 'node:test';
import assert from 'node:assert/strict';
import { generateGame, endTurn, validateGame } from '../core.js';
import { createTickClock, TICKS_PER_CYCLE, SPEED_MS } from '../modules/simulation/tick-clock.js';

function rig(game=generateGame({seed:'CLOCK-TEST',size:60,opponents:2})) {
  const callbacks=new Map();let nextId=0;const updates=[];
  const clock=createTickClock({
    getGame:()=>game,
    advanceCycle:()=>endTurn(game),
    onChange:s=>updates.push(s),
    schedule:(fn,delay)=>{const id=++nextId;callbacks.set(id,{fn,delay});return id;},
    cancel:id=>callbacks.delete(id)
  });
  return {game,clock,updates,callbacks,fire(){for(const entry of [...callbacks.values()])entry.fn();}};
}
test('four deterministic ticks advance exactly one game cycle, not four',()=>{
 const a=rig(),b=generateGame({seed:'CLOCK-TEST',size:60,opponents:2});
 assert.equal(TICKS_PER_CYCLE,4);
 for(let i=1;i<4;i++){const result=a.clock.step();assert.equal(result.ok,true);assert.equal(result.turnAdvanced,false);assert.equal(a.game.turn,1);assert.equal(a.clock.state().phase,i);}
 const result=a.clock.step();assert.equal(result.turnAdvanced,true);assert.equal(a.game.turn,2);assert.equal(a.clock.state().phase,0);
 endTurn(b);assert.deepEqual(a.game,b);assert.ok(validateGame(a.game));
});
test('manual mode starts paused; play speeds use one scheduled timer',()=>{
 const x=rig();
 assert.equal(x.clock.state().speed,'paused');assert.equal(x.callbacks.size,0);
 assert.equal(x.clock.setSpeed('slow').speed,'slow');
 assert.equal([...x.callbacks.values()][0].delay,SPEED_MS.slow);
 x.clock.setSpeed('normal');assert.equal(x.callbacks.size,1);assert.equal([...x.callbacks.values()][0].delay,SPEED_MS.normal);
 x.clock.setSpeed('fast');assert.equal(x.callbacks.size,1);assert.equal([...x.callbacks.values()][0].delay,SPEED_MS.fast);
 x.fire();assert.equal(x.clock.state().phase,1);assert.equal(x.game.turn,1);
 x.clock.pause();assert.equal(x.callbacks.size,0);
 x.fire();assert.equal(x.game.turn,1);assert.equal(x.clock.state().phase,1);
 assert.throws(()=>x.clock.setSpeed('turbo'),RangeError);
});
test('manual end turn pauses auto-simulation and clears fractional ticks',()=>{
 const x=rig();x.clock.setSpeed('normal');x.fire();x.fire();
 assert.equal(x.clock.state().phase,2);
 const result=x.clock.manualCycle();assert.equal(result.ok,true);
 assert.equal(x.game.turn,2);assert.equal(x.clock.state().phase,0);assert.equal(x.clock.state().speed,'paused');assert.equal(x.callbacks.size,0);
});
test('stopped campaigns cannot continue accumulating ticks or timers',()=>{
 const x=rig();x.game.gameOver={won:true,title:'Campaign complete'};
 assert.equal(x.clock.setSpeed('fast').speed,'paused');
 assert.equal(x.callbacks.size,0);
 assert.equal(x.clock.step().ok,false);
 assert.equal(x.game.turn,1);
});
test('auto tick runs 25 cycles safely and reset pauses on campaign replacement',()=>{
 const x=rig();x.clock.setSpeed('fast');
 for(let i=0;i<25*TICKS_PER_CYCLE;i++)x.fire();
 assert.equal(x.game.turn,26);assert.ok(validateGame(x.game));
 assert.equal(x.updates.filter(y=>y.turnAdvanced).length,25);
 x.clock.reset();
 assert.equal(x.clock.state().phase,0);assert.equal(x.clock.state().speed,'paused');assert.equal(x.callbacks.size,0);
});
