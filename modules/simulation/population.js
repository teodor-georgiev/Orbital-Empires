/** Deterministic population growth toward a finite habitat carrying capacity.
 * Population is measured in billions; no random growth spikes or real-time timers.
 * All owners use the same equation. This module does not migrate the save format.
 */
import { biomeHousingBonus } from '../strategy/planet-buildings.js';
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
export function populationCapacity(system){
 if(!system||system.owner===null||system.owner===undefined)return 0;
 const habitat=clamp(Number(system.habitability)||1,1,3);
 const richness=clamp(Number(system.richness)||1,1,4);
 return 6+4*habitat+richness+biomeHousingBonus(system);
}
export function populationGrowth(system){
 const capacity=populationCapacity(system);
 if(!capacity)return 0;
 const current=clamp(Number(system.population)||0,0,capacity);
 if(current>=capacity)return 0;
 const growthRate=.16+.02*clamp(Number(system.habitability)||1,1,3);
 const effective=Math.max(.1,current);
 return Math.max(0,Math.min(capacity-current,growthRate*effective*(1-effective/capacity)));
}
export function advancePopulation(system){
 const cap=populationCapacity(system);
 if(!cap)return 0;
 const before=clamp(Number(system.population)||0,0,cap);
 const updated=Math.min(cap,Math.round((before+populationGrowth({...system,population:before}))*1000)/1000);
 system.population=updated;
 return Number((updated-before).toFixed(3));
}
export function populationForecast(system){
 const capacity=populationCapacity(system),population=Math.max(0,Number(system?.population)||0);
 if(!capacity)return {population:0,capacity:0,growth:0,percent:0};
 return {population,capacity,growth:populationGrowth(system),percent:Math.min(100,Math.round(population/capacity*100))};
}
