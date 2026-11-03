/** Fixed-step strategic time controller; deterministic and independent of display frame rate.
 * Existing endTurn rules are the interim one-month simulation step. No hidden-tab catch-up.
 */
const SPEEDS=[0,1,2,5,10];
export const SIM_MONTH_MS=1000;
export function createClockState(){return {speed:0,accumulatorMs:0};}
export function setClockSpeed(clock,speed){
 if(!SPEEDS.includes(speed))throw new RangeError('Invalid simulation speed');
 return {speed,accumulatorMs:speed===0?0:clock.accumulatorMs};
}
export function advanceClock(clock,elapsedMs){
 if(clock.speed===0)return {state:clock,steps:0};
 const dt=Number.isFinite(elapsedMs)?Math.max(0,Math.min(1000,elapsedMs)):0;
 const accumulated=clock.accumulatorMs+dt*clock.speed;
 const steps=Math.min(10,Math.floor(accumulated/SIM_MONTH_MS));
 return {state:{speed:clock.speed,accumulatorMs:steps===10?0:accumulated-steps*SIM_MONTH_MS},steps};
}
