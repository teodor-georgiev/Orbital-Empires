/* Owned-system defensive outposts; optional v1 save fields keep older campaigns valid. */
export const OUTPOST_TIERS=Object.freeze([
 Object.freeze({level:0,name:'Ruined Outpost',maxHp:0,armor:0,shield:0,power:0,garrisonSlots:0,credits:0,alloys:0}),
 Object.freeze({level:1,name:'Frontier Post',maxHp:60,armor:6,shield:8,power:8,garrisonSlots:2,credits:30,alloys:18}),
 Object.freeze({level:2,name:'Defense Station',maxHp:100,armor:12,shield:16,power:20,garrisonSlots:4,credits:70,alloys:42}),
 Object.freeze({level:3,name:'Fortified Starbase',maxHp:155,armor:22,shield:32,power:36,garrisonSlots:6,credits:120,alloys:85}),
 Object.freeze({level:4,name:'Citadel',maxHp:230,armor:34,shield:48,power:60,garrisonSlots:10,credits:210,alloys:150})
]);
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
export function outpostDefense(system){
 const o=getOutpost(system),tier=o&&OUTPOST_TIERS[o.level];
 if(!o||!tier||!tier.maxHp||!o.hp)return 0;
 return Math.round((o.power+o.armor*.45+o.shield*.4)*Math.min(1,o.hp/tier.maxHp));
}
export function outpostUpgradeCost(system){
 const current=getOutpost(system),next=current&&OUTPOST_TIERS[current.level+1];
 return next?{level:next.level,credits:next.credits,alloys:next.alloys}:null;
}
export function raiseOutpost(system){
 const cost=outpostUpgradeCost(system);
 if(!cost)return null;
 system.outpost=makeOutpost(cost.level);
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
 const tier=OUTPOST_TIERS[current.level];
 if(current.hp<tier.maxHp){system.outpost={...current,hp:Math.min(tier.maxHp,current.hp+points)};}
}
export function validOutpost(system){
 if(system.outpost===undefined)return true; // Existing save-schema v1.
 const value=system.outpost;
 if(!value||typeof value!=='object'||Array.isArray(value)||system.owner===null)return false;
 if(!Number.isInteger(value.level)||value.level<0||value.level>=OUTPOST_TIERS.length)return false;
 const t=OUTPOST_TIERS[value.level];
 return Number.isInteger(value.hp)&&value.hp>=0&&value.hp<=t.maxHp&&
  ['armor','shield','power','garrisonSlots'].every(k=>Number.isInteger(value[k])&&value[k]===t[k]);
}
