/* Pauseable autonomous simulation clock.
   A tick is a deterministic quarter of a strategic cycle. Economy and AI
   resolve at cycle boundaries through the existing endTurn contract. */
export const TICKS_PER_CYCLE=4;
export const SPEED_MS=Object.freeze({paused:0,slow:1600,normal:800,fast:240});

export function createTickClock({
 getGame,advanceCycle,onChange=()=>{},
 schedule=(fn,ms)=>setInterval(fn,ms),cancel=id=>clearInterval(id)
}){
 if(typeof getGame!=='function'||typeof advanceCycle!=='function'||typeof onChange!=='function')
  throw new TypeError('Tick clock requires game, cycle, and notification callbacks.');
 let phase=0,speed='paused',timer=null;
 const state=()=>({phase,perCycle:TICKS_PER_CYCLE,speed,turn:getGame()?.turn??null,running:speed!=='paused'});
 const publish=(turnAdvanced=false)=>{const value={...state(),turnAdvanced};onChange(value);return value;};
 function stopTimer(){if(timer!==null){cancel(timer);timer=null;}}
 function pause(){stopTimer();speed='paused';return publish();}
 function setSpeed(next){
  if(!Object.hasOwn(SPEED_MS,next))throw new RangeError('Unknown simulation speed.');
  if(next==='paused'||!getGame()||getGame().gameOver)return pause();
  stopTimer();speed=next;timer=schedule(step,SPEED_MS[next]);return publish();
 }
 function step(){
  const game=getGame();
  if(!game||game.gameOver){pause();return {ok:false,turnAdvanced:false,message:'Campaign is not active.'};}
  if(phase<TICKS_PER_CYCLE-1){
   phase++;publish();return {ok:true,turnAdvanced:false};
  }
  const result=advanceCycle(game);
  if(!result?.ok){pause();return {ok:false,turnAdvanced:false,message:result?.message||'Cycle could not advance.'};}
  phase=0;publish(true);
  if(game.gameOver)pause();
  return {...result,turnAdvanced:true};
 }
 function manualCycle(){
  const game=getGame();
  pause();phase=0;
  if(!game||game.gameOver){publish();return {ok:false,message:'Campaign is not active.'};}
  const result=advanceCycle(game);publish(!!result?.ok);return result;
 }
 function reset(){stopTimer();speed='paused';phase=0;return publish();}
 return {state,step,setSpeed,pause,reset,manualCycle};
}
