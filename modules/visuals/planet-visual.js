/** Seeded planet materials shared by 3D scene, 2D fallback and illustrations.
 * Hashing and xorshift are independent of game RNG and never mutate saves.
 */
export function hashVisualSeed(seed){let h=2166136261;for(const ch of String(seed)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0||1;}
export const PLANET_PALETTES=Object.freeze({
 'Terran':['#267abb','#53a56c','#f0f3ef'],
 'Oceanic':['#113e8f','#1fa4c7','#e4eef1'],
 'Jungle':['#174c40','#4b9e49','#c3e2ad'],
 'Desert':['#97623c','#eac081','#e1a56c'],
 'Arctic':['#527c9b','#c4e2e8','#f8fdff'],
 'Volcanic':['#251d2a','#63251e','#ff6824'],
 'Barren':['#5f625e','#aaa18d','#d0c5b4'],
 'Toxic':['#304a31','#a4b447','#d1d98e'],
 'Crystal':['#493d82','#8973ce','#d1acfb'],
 'Gas Giant':['#987451','#e1b78e','#efe1be'],
});
const names=Object.keys(PLANET_PALETTES);
export function biomeId(biome){const i=names.indexOf(biome);return i<0?0:i;}
export function planetPalette(biome){return PLANET_PALETTES[biome]||PLANET_PALETTES.Terran;}
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
export function planetVisual(seed,systemId,planetId,biome,{name='',historical=false}={}){
 let s=hashVisualSeed(`${seed}:${systemId}:${planetId}:${biome}`);
 const next=()=>{s^=s<<13;s^=s>>>17;s^=s<<5;return(s>>>0)/4294967296;};
 const earth=historical&&name==='Earth',saturn=historical&&name==='Saturn';
 const seedValue=next()*16384;
 const hue=earth?0:Math.round((next()-.5)*30);
 const intensity=.85+next()*.34;
 const cloud=biome==='Gas Giant'?0:biome==='Barren'?0:biome==='Volcanic'?.10+next()*.1:biome==='Desert'?.05+next()*.1:biome==='Arctic'?.18+next()*.24:earth?.37:.15+next()*.55;
 const rings=saturn?1:earth?0:biome==='Gas Giant'?(next()>.55?1:0):biome==='Crystal'&&next()>.90?1:0;
 return Object.freeze({
  seed:Math.round(seedValue*1000)/1000, biome:biomeId(biome),hue,
  tint:Math.round(intensity*100)/100,
  cloud:clamp(cloud),ice:biome==='Arctic'?.65+next()*.3:biome==='Terran'?.18+next()*.12:biome==='Oceanic'?.07+next()*.08:0,
  lava:biome==='Volcanic'?.74+next()*.2:0,
  bands:biome==='Gas Giant'?.66+next()*.32:0,
  craters:biome==='Barren'?.6+next()*.35:biome==='Desert'?.13+next()*.15:.02+next()*.1,
  atmosphere:['Terran','Oceanic','Jungle','Toxic','Gas Giant'].includes(biome)? .5+next()*.45:biome==='Arctic'?.3:biome==='Desert'?.23:.07,
  storms:biome==='Gas Giant'?.5+next()*.5:biome==='Toxic'?.25+next()*.35:0,
  terrain:.6+next()*.4, rings,rotation:Math.round(next()*359),palette:planetPalette(biome),
 });
}
export function planetArtStyle(planet){
 const v=planet?.visual||planetVisual('legacy',0,planet?.id||0,planet?.biome||'Terran');
 return `--oe-hue:${v.hue}deg;--oe-sat:${v.tint};--oe-cloud:${v.cloud.toFixed(3)};--oe-rot:${v.rotation}deg;`;
}
