/** Biome-aware construction data. Pure rules: core.js enforces ownership and payments.
 * All bonuses are additive and capped at three building levels.
 */
const unit=(credits=0,alloys=0,science=0,influence=0)=>({credits,alloys,science,influence});
export const BIOME_BUILDINGS=Object.freeze([
 {id:'agri-domes',name:'Agri Domes',icon:'✿',allowed:['Terran','Oceanic','Jungle'],description:'Farms, water recycling and habitable growth zones.',cost:[19,34,51],credit:[17,26,38],yield:unit(2),capacity:2,effect:'+2 credits and +2B housing / level'},
 {id:'biosphere-lab',name:'Biosphere Laboratory',icon:'❖',allowed:['Terran','Jungle','Oceanic'],description:'Study complex living ecosystems.',cost:[23,39,60],credit:[22,35,48],yield:unit(0,0,4),effect:'+4 science / level'},
 {id:'tidal-generators',name:'Tidal Generators',icon:'≈',allowed:['Oceanic'],description:'Turn deep tidal currents into useful power.',cost:[20,35,53],credit:[17,29,43],yield:unit(5),effect:'+5 credits / level'},
 {id:'canopy-arcology',name:'Canopy Arcology',icon:'♧',allowed:['Jungle'],description:'Layered settlements in the rainforest canopy.',cost:[29,46,69],credit:[25,39,55],yield:unit(1),capacity:3,effect:'+3B housing and +1 credit / level'},
 {id:'solar-array',name:'Solar Array',icon:'☼',allowed:['Desert','Barren'],description:'Wide solar fields supply power in clear skies.',cost:[18,31,49],credit:[16,26,38],yield:unit(7),effect:'+7 credits / level'},
 {id:'dust-extractors',name:'Dust Extractors',icon:'⌁',allowed:['Desert'],description:'Refine sand and surface ore into raw materials.',cost:[20,33,52],credit:[18,29,43],yield:unit(0,3),effect:'+3 alloys / level'},
 {id:'cryo-refinery',name:'Cryo Refinery',icon:'❄',allowed:['Arctic'],description:'Harvest valuable deposits beneath the ice.',cost:[24,42,64],credit:[18,31,48],yield:unit(0,4),effect:'+4 alloys / level'},
 {id:'polar-observatory',name:'Polar Observatory',icon:'✧',allowed:['Arctic'],description:'Low-noise climate stations and long-range sensors.',cost:[22,38,57],credit:[18,30,42],yield:unit(0,0,4),effect:'+4 science / level'},
 {id:'magma-foundry',name:'Magma Foundry',icon:'♨',allowed:['Volcanic'],description:'Use magma heat to melt heavy ore.',cost:[27,45,67],credit:[22,35,48],yield:unit(0,6),effect:'+6 alloys / level'},
 {id:'geothermal-grid',name:'Geothermal Grid',icon:'⚡',allowed:['Volcanic'],description:'Convert planetary geothermal energy into credits.',cost:[23,36,55],credit:[20,32,46],yield:unit(6),effect:'+6 credits / level'},
 {id:'deep-core-mine',name:'Deep-Core Mine',icon:'◆',allowed:['Barren','Crystal'],description:'Extract deep mineral seams through hardened crust.',cost:[24,41,62],credit:[20,32,45],yield:unit(0,5),effect:'+5 alloys / level'},
 {id:'crystal-resonator',name:'Crystal Resonator',icon:'◇',allowed:['Crystal'],description:'Harness crystalline resonance for research.',cost:[27,46,68],credit:[23,38,53],yield:unit(0,0,6),effect:'+6 science / level'},
 {id:'sealed-vault',name:'Sealed Research Vault',icon:'⌬',allowed:['Toxic'],description:'Study extreme chemistry in contained laboratories.',cost:[28,46,70],credit:[24,38,54],yield:unit(0,0,6),effect:'+6 science / level'},
]);
export const ORBITAL_BUILDINGS=Object.freeze([
 {id:'gas-harvester',name:'Gas Harvester',icon:'◎',allowed:['Gas Giant'],description:'Skim valuable atmospheric gases from orbit.',cost:[17,32,49],credit:[20,30,44],yield:unit(4),effect:'+4 credits / orbital level'},
 {id:'orbital-mines',name:'Orbital Mines',icon:'✥',allowed:['Barren','Volcanic','Crystal','Desert'],description:'Mine a survey-only world without a surface colony.',cost:[23,39,58],credit:[20,34,49],yield:unit(0,4),effect:'+4 alloys / orbital level'},
 {id:'orbital-observatory',name:'Orbital Observatory',icon:'✧',allowed:['Oceanic','Arctic','Jungle','Terran','Toxic'],description:'Remote scientific station above a surveyed planet.',cost:[22,40,59],credit:[24,38,53],yield:unit(0,0,4),effect:'+4 science / orbital level'},
]);
export const BIOME_NAMES=['Terran','Oceanic','Jungle','Desert','Arctic','Volcanic','Barren','Toxic','Crystal','Gas Giant'];
export function biomeBuildingAllowed(building,system){return Boolean(building&&system&&building.allowed.includes(system.biome))}
export function buildingYield(system){
 const totals=unit();
 for(const item of BIOME_BUILDINGS){
  const lv=system?.buildings?.[item.id]||0;
  if(!biomeBuildingAllowed(item,system)||!Number.isInteger(lv)||lv<1||lv>3)continue;
  for(const key of Object.keys(totals))totals[key]+=(item.yield?.[key]||0)*lv;
 }
 return totals;
}
export function orbitalYield(system){
 const totals=unit();
 if(!system?.orbitalSites)return totals;
 for(const site of Object.values(system.orbitalSites)){
  for(const building of ORBITAL_BUILDINGS){
   const level=site?.[building.id]||0;
   if(Number.isInteger(level)&&level>=1&&level<=3)for(const key of Object.keys(totals))totals[key]+=(building.yield[key]||0)*level;
  }
 }
 return totals;
}
export function biomeHousingBonus(system){return BIOME_BUILDINGS.reduce((n,b)=>n+(biomeBuildingAllowed(b,system)&&Number.isInteger(system?.buildings?.[b.id])?b.capacity*(system.buildings[b.id]||0):0),0);}
