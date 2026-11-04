/* Owned-system defensive stations; optional v1 save fields keep older campaigns valid. */
export const OUTPOST_TIERS=Object.freeze([
 Object.freeze({level:0,name:'Ruined Outpost',maxHp:0,armor:0,shield:0,power:0,garrisonSlots:0,credits:0,alloys:0}),
 Object.freeze({level:1,name:'Frontier Post',maxHp:60,armor:6,shield:8,power:8,garrisonSlots:2,credits:30,alloys:18}),
 Object.freeze({level:2,name:'Defense Station',maxHp:100,armor:12,shield:16,power:20,garrisonSlots:4,credits:70,alloys:42}),
 Object.freeze({level:3,name:'Fortified Starbase',maxHp:155,armor:22,shield:32,power:36,garrisonSlots:6,credits:120,alloys:85}),
 Object.freeze({level:4,name:'Citadel',maxHp:230,armor:34,shield:48,power:60,garrisonSlots:10,credits:210,alloys:150})
]);
// Module slots and defensive platforms available per station tier (index = station level).
export const MODULE_SLOTS=Object.freeze([0,1,2,3,4]);
export const PLATFORM_LIMITS=Object.freeze([0,1,2,4,6]);
export const STATION_MODULES=Object.freeze({
 'gun-battery':Object.freeze({name:'Gun Battery',credits:40,alloys:40,power:10,description:'Heavy batteries add 10 station combat power.'}),
 'shield-lattice':Object.freeze({name:'Shield Lattice',credits:40,alloys:30,shield:12,description:'A lattice of emitters adds 12 station shield.'}),
 'repair-dock':Object.freeze({name:'Repair Dock',credits:35,alloys:25,repair:8,description:'Damage-control crews restore 8 hull per month.'}),
 'trade-relay':Object.freeze({name:'Trade Relay',credits:60,alloys:20,income:4,description:'Licensed trade traffic earns 4 credits per month.'})
});
export const PLATFORM_COST=Object.freeze({credits:15,alloys:20});
export const PLATFORM_POWER=4;
export const PLATFORM_HP=15;
export function makeOutpost(level=1){
 const tier=OUTPOST_TIERS[level];
 if(!tier)throw new RangeError('Unknown outpost tier.');
 return {level,hp:tier.maxHp,armor:tier.armor,shield:tier.shield,power:tier.power,garrisonSlots:tier.garrisonSlots};
}
export function getOutpost(system){
 if(!system||system.owner===null)return null;
 // Valid old saves didn't contain an outpost. They receive a defensive Frontier Post.
 return system.outpost??makeOutpost();
}
export function stationModules(system){
 const modules=system?.outpost?.modules;
 return Array.isArray(modules)?modules:[];
}
export function stationPlatforms(system){
 const platforms=system?.outpost?.platforms;
 return Number.isInteger(platforms)&&platforms>0?platforms:0;
}
export function stationMaxHp(system){
 const o=getOutpost(system),tier=o&&OUTPOST_TIERS[o.level];
 if(!o||!tier)return 0;
 return tier.maxHp+stationPlatforms(system)*PLATFORM_HP;
}
export function stationIncome(system){
 const o=getOutpost(system),tier=o&&OUTPOST_TIERS[o.level];
 if(!o||!tier||!tier.maxHp||o.hp<=0)return 0;
 return stationModules(system).reduce((n,id)=>n+(STATION_MODULES[id]?.income||0),0);
}
export function outpostDefense(system){
 const o=getOutpost(system),tier=o&&OUTPOST_TIERS[o.level];
 if(!o||!tier||!tier.maxHp||!o.hp)return 0;
 const modules=stationModules(system);
 const gun=modules.reduce((n,id)=>n+(STATION_MODULES[id]?.power||0),0);
 const lattice=modules.reduce((n,id)=>n+(STATION_MODULES[id]?.shield||0),0);
 const power=o.power+gun+stationPlatforms(system)*PLATFORM_POWER;
 const shield=o.shield+lattice;
 return Math.round((power+o.armor*.45+shield*.4)*Math.min(1,o.hp/stationMaxHp(system)));
}
export function canAddModule(system,moduleId){
 if(!Object.hasOwn(STATION_MODULES,moduleId))return {ok:false,message:'Unknown station module.'};
 const o=getOutpost(system);
 if(!o||o.level===0)return {ok:false,message:'Build or restore the station first.'};
 const modules=stationModules(system);
 if(modules.includes(moduleId))return {ok:false,message:'This module is already installed.'};
 if(modules.length>=MODULE_SLOTS[o.level])return {ok:false,message:'All module slots are in use.'};
 return {ok:true,message:'Module slot available.'};
}
export function addModule(system,moduleId){
 const check=canAddModule(system,moduleId);
 if(!check.ok)return check;
 const current=getOutpost(system);
 system.outpost={...current,modules:[...stationModules(system),moduleId]};
 return {ok:true,message:STATION_MODULES[moduleId].name+' installed.'};
}
export function canAddPlatform(system){
 const o=getOutpost(system);
 if(!o||o.level===0)return {ok:false,message:'Build or restore the station first.'};
 if(stationPlatforms(system)>=PLATFORM_LIMITS[o.level])return {ok:false,message:'All defensive platforms are in place for this tier.'};
 return {ok:true,message:'Platform berth available.'};
}
export function addPlatform(system){
 const check=canAddPlatform(system);
 if(!check.ok)return check;
 const current=getOutpost(system);
 system.outpost={...current,platforms:stationPlatforms(system)+1,hp:current.hp+PLATFORM_HP};
 return {ok:true,message:'Defense platform commissioned.'};
}
export function outpostUpgradeCost(system){
 const current=getOutpost(system),next=current&&OUTPOST_TIERS[current.level+1];
 return next?{level:next.level,credits:next.credits,alloys:next.alloys}:null;
}
export function raiseOutpost(system){
 const cost=outpostUpgradeCost(system);
 if(!cost)return null;
 const previous=getOutpost(system),modules=stationModules(system),platforms=stationPlatforms(system);
 const next=makeOutpost(cost.level);
 if(modules.length)next.modules=modules.slice();
 if(platforms>0)next.platforms=platforms;
 next.hp=OUTPOST_TIERS[cost.level].maxHp+platforms*PLATFORM_HP;
 system.outpost=next;
 return system.outpost;
}
export function damageOutpost(system,amount){
 const original=getOutpost(system);
 if(!original||!Number.isFinite(amount)||amount<0)return null;
 const outpost=system.outpost??makeOutpost(original.level);
 outpost.hp=Math.max(0,Math.round(outpost.hp-amount));
 if(outpost.hp===0){system.outpost=makeOutpost(0);return system.outpost;}
 system.outpost=outpost;
 return outpost;
}
export function restoreOutpost(system,points=6){
 const current=getOutpost(system);
 if(!current||current.level===0)return;
 const dock=stationModules(system).reduce((n,id)=>n+(STATION_MODULES[id]?.repair||0),0);
 const max=stationMaxHp(system);
 const healed=current.hp+(Number.isFinite(points)?points:0)+dock;
 if(current.hp<max)system.outpost={...current,hp:Math.min(max,healed)};
}
export function validOutpost(system){
 if(system.outpost===undefined)return true; // Existing save-schema v1.
 const value=system.outpost;
 if(!value||typeof value!=='object'||Array.isArray(value)||system.owner===null)return false;
 if(!Number.isInteger(value.level)||value.level<0||value.level>=OUTPOST_TIERS.length)return false;
 const t=OUTPOST_TIERS[value.level];
 const platforms=value.platforms===undefined?0:value.platforms;
 if(!Number.isInteger(platforms)||platforms<0||platforms>PLATFORM_LIMITS[value.level])return false;
 if(value.modules!==undefined){
  const modules=value.modules;
  if(!Array.isArray(modules)||modules.length>MODULE_SLOTS[value.level])return false;
  if(modules.some(id=>typeof id!=='string'||!Object.hasOwn(STATION_MODULES,id)))return false;
  if(new Set(modules).size!==modules.length)return false;
 }
 return Number.isInteger(value.hp)&&value.hp>=0&&value.hp<=t.maxHp+platforms*PLATFORM_HP&&
  ['armor','shield','power','garrisonSlots'].every(k=>Number.isInteger(value[k])&&value[k]===t[k]);
}
