/** Approximate distances are published astronomical facts; 2D positions are schematic game layout.
 * Real stellar systems do not imply verified habitable worlds, trade routes, hyperlanes, or empires.
 * NASA: https://science.nasa.gov/exoplanets/other-stars-other-worlds/our-nearest-celestial-neighbor-an-exotic-3-star-system/
 * Rutgers star chart: https://njsgc.rutgers.edu/sites/default/files/2023-03/44-closest-stars-how-they-compare-sun-6_PDF.pdf
 */
export const NEARBY_STARS=Object.freeze([
  {id:'sol',name:'Sol',star:'Sun · G2V',color:'#ffe8ad',distanceLy:0,x:350,y:380},
  {id:'alpha-centauri',name:'Alpha Centauri',star:'Alpha Centauri A/B · binary',color:'#fff0c5',distanceLy:4.37,x:425,y:345},
  {id:'proxima-centauri',name:'Proxima Centauri',star:'Proxima Centauri · red dwarf',color:'#e99496',distanceLy:4.25,x:456,y:418},
  {id:'barnards-star',name:"Barnard's Star",star:'Red dwarf · M4',color:'#e89598',distanceLy:5.96,x:300,y:462},
  {id:'wolf-359',name:'Wolf 359',star:'Red dwarf · M6',color:'#e89598',distanceLy:7.78,x:270,y:326},
  {id:'lalande-21185',name:'Lalande 21185',star:'Red dwarf · M2',color:'#e89598',distanceLy:8.29,x:238,y:400},
  {id:'sirius',name:'Sirius',star:'Sirius A/B · binary',color:'#b9d7ff',distanceLy:8.6,x:522,y:338},
  {id:'ross-154',name:'Ross 154',star:'Red dwarf · M3',color:'#ec9898',distanceLy:9.69,x:522,y:504},
  {id:'epsilon-eridani',name:'Epsilon Eridani',star:'Orange dwarf · K2',color:'#ffbb8d',distanceLy:10.5,x:396,y:255},
  {id:'ross-128',name:'Ross 128',star:'Red dwarf · M4',color:'#e89598',distanceLy:10.9,x:309,y:245},
  {id:'61-cygni',name:'61 Cygni',star:'61 Cygni A/B · binary',color:'#ffc089',distanceLy:11.4,x:600,y:415},
  {id:'tau-ceti',name:'Tau Ceti',star:'Sun-like star · G8',color:'#ffe0b1',distanceLy:11.9,x:584,y:270},
]);
export function nearbySystemSeed(star,id){
 const earth=star.id==='sol';
 return {
  id,name:star.name,x:star.x,y:star.y,star:star.star,color:star.color,
  biome:earth?'Terran':'Barren',
  richness:earth?3:1,habitability:earth?3:1,
  feature:earth?'Earth · humanity homeworld':'Real star · planetary resources fictional',
  neighbors:[],owner:null,population:0,buildings:{foundry:0,laboratory:0,exchange:0,citadel:0},capital:false,
  realStarId:star.id,distanceLy:star.distanceLy,planetDataStatus:earth?'solar-system':'fictional-survey'
 };
}
