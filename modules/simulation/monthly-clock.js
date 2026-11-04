/* Autonomous deterministic monthly cadence, independent of Canvas/WebGL frames.
   It never catches up elapsed time while suspended or after a hidden tab. */
export const MONTH_SPEEDS=Object.freeze({normal:1400,fast:550,rapid:180});
export function createMonthlyClock({
 getGame,advanceMonth,onAdvance=()=>{},
 schedule=(fn,delay)=>setInterval(fn,delay),cancel=id=>clearInterval(id)
}){
 if(typeof getGame!=='function'||typeof advanceMonth!=='function'||typeof onAdvance!=='function')
  throw new TypeError('Monthly clock needs game, advance and notification callbacks.');
 let speed='normal',running=false,timer=null;
 function state(){return {speed,running,delay:MONTH_SPEEDS[speed],stardate:getGame()?.turn??null};}
 function suspend(){if(timer!==null){cancel(timer);timer=null;}running=false;return state();}
 function tick(){
  const game=getGame();
  if(!game||game.gameOver){suspend();return {ok:false,message:'The campaign is not active.'};}
  const result=advanceMonth(game);
  if(!result?.ok){suspend();return result||{ok:false,message:'Month failed to advance.'};}
  onAdvance(result);
  if(game.gameOver)suspend();
  return result;
 }
 function resume(){
  if(running)return state();
  if(!getGame()||getGame().gameOver)return suspend();
  running=true;timer=schedule(tick,MONTH_SPEEDS[speed]);return state();
 }
 function setSpeed(next){
  if(!Object.hasOwn(MONTH_SPEEDS,next))throw new RangeError('Unknown simulation speed.');
  const wasRunning=running;suspend();speed=next;if(wasRunning)resume();return state();
 }
 function step(){if(running)return {ok:false,message:'Pause the simulation to step a month.'};return tick();}
 return {state,suspend,resume,setSpeed,step,tick};
}
