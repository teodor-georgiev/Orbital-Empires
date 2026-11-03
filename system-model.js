/** Visual bodies are derived from the save data; they never alter gameplay or its save schema. */
import { hashSeed } from './core.js';

const TYPES = [
  ['Barren', '#b2a99c'], ['Volcanic', '#c47549'], ['Oceanic', '#3ba5c4'],
  ['Desert', '#d9a46d'], ['Arctic', '#b2d9e8'], ['Gas Giant', '#caaed8'],
  ['Jungle', '#58a58b'], ['Terran', '#63baca'], ['Crystal', '#b49fe9'],
];
const TYPE_COLOR = Object.fromEntries(TYPES);
const FALLBACK = '#91a9ba';

function makeRng(seed) {
  let state = hashSeed(seed);
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 4294967296;
  };
}

function solarSystemBodies(seed,system){
 const next=makeRng(String(seed)+':sol:planets');
 const entries=[
  ['Mercury','Barren','#aaa59c',0.39,0.17,0],
  ['Venus','Volcanic','#e2b486',0.72,0.30,0],
  ['Earth','Terran','#5ebad5',1.00,0.34,1],
  ['Mars','Desert','#ce8d65',1.52,0.24,2],
  ['Jupiter','Gas Giant','#d3ab88',5.20,0.59,4],
  ['Saturn','Gas Giant','#e7d5a7',9.58,0.49,4],
  ['Uranus','Gas Giant','#9bd7de',19.2,0.39,2],
  ['Neptune','Gas Giant','#729ece',30.1,0.39,2]
 ];
 const planets=entries.map(([name,biome,color,orbitalDistanceAu,radius,moonCount],id)=>({
  id,name,biome,color,radius,
  orbitRadius:Number((2.4+id*1.65).toFixed(2)),
  orbitalDistanceAu,
  phase:next()*Math.PI*2,inclination:(next()-.5)*.08,
  habitability:name==='Earth'?3:0,isColonyWorld:name==='Earth',
  moons:Array.from({length:moonCount},(_,m)=>({radius:.045+next()*.025,orbitRadius:radius+.20+m*.1,phase:next()*Math.PI*2}))
 }));
 return {star:{name:'Sun',color:'#ffe8ad',radius:.92},planets,belt:{orbitRadius:(planets[3].orbitRadius+planets[4].orbitRadius)/2},historical:true};
}

export function generateSystemBodies(seed, system) {
  if (!system || !Number.isInteger(system.id) || system.id < 0) throw new TypeError('A valid star system is required');
  if(system.realStarId==='sol')return solarSystemBodies(seed,system);
  const next = makeRng(`${String(seed)}:system:${system.id}`);
  const count = 4 + Math.floor(next() * 4);
  const star = { name: system.star || 'Unknown star', color: /^#[0-9a-f]{6}$/i.test(system.color || '') ? system.color : '#ffe1b3', radius: 0.92 };
  const planets = [];
  let orbitRadius = 2.4;
  for (let id = 0; id < count; id++) {
    const primary = id === 0;
    const biome = primary ? (system.biome || 'Terran') : TYPES[Math.floor(next() * TYPES.length)][0];
    const giant = biome === 'Gas Giant';
    const radius = primary ? 0.32 : giant ? 0.47 + next() * 0.14 : 0.19 + next() * 0.2;
    const moons = [];
    if (!primary && next() > 0.42) {
      for (let m = 0, countMoons = giant ? 2 : 1; m < countMoons; m++) {
        moons.push({ radius: 0.055 + next() * 0.025, orbitRadius: radius + 0.23 + m * 0.15, phase: next() * Math.PI * 2 });
      }
    }
    planets.push({
      id,
      name: `${system.name || 'Unknown'} ${String.fromCharCode(98 + id)}`,
      biome,
      color: TYPE_COLOR[biome] || FALLBACK,
      radius: Number(radius.toFixed(3)),
      orbitRadius: Number(orbitRadius.toFixed(2)),
      phase: next() * Math.PI * 2,
      inclination: (next() - 0.5) * 0.14,
      habitability: primary ? (system.habitability || 1) : 0,
      isColonyWorld: primary,
      moons,
    });
    orbitRadius += 1.38 + next() * 0.55;
  }
  return { star, planets, belt: { orbitRadius: (planets[1].orbitRadius + planets[2].orbitRadius) / 2 } };
}

export function selectSystemPlanet(bodies, id) {
  return Number.isInteger(id) && id >= 0 ? bodies?.planets?.find(p => p.id === id) || null : null;
}
