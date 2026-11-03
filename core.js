import { advancePopulation } from './modules/simulation/population.js';
/* Orbital Empires — deterministic, dependency-free turn-based 4X simulation. */
import { TRADITIONS, POLICIES, traditionCost, unityIncome, civicBonuses, canAdoptTradition, canEnactPolicy } from './modules/strategy/civics.js';
export { TRADITIONS, POLICIES, traditionCost, unityIncome };
import { SAVE_SCHEMA_VERSION } from './version.js';
export const VERSION = SAVE_SCHEMA_VERSION;
export const WORLD = { width: 1140, height: 760 };
export const EMPIRE_TEMPLATES = [
  { name: 'Terran Directorate', short: 'TERRAN', color: '#46d9dc', motto: 'Knowledge is our frontier.', species: 'Human', trait: 'Adaptive' },
  { name: 'Auralis Concord', short: 'AURALIS', color: '#b497f5', motto: 'A galaxy in harmony.', species: 'Auralian', trait: 'Scientific' },
  { name: 'Vex Dominion', short: 'VEX', color: '#ef777f', motto: 'Order through strength.', species: 'Vexari', trait: 'Militaristic' },
  { name: 'Solari Ascendancy', short: 'SOLARI', color: '#f4be74', motto: 'We outlast the stars.', species: 'Solari', trait: 'Industrial' },
  { name: 'Keth Collective', short: 'KETH', color: '#8bdb9e', motto: 'The many are one.', species: 'Keth', trait: 'Expansionist' },
  { name: 'Umbral Syndicate', short: 'UMBRAL', color: '#ff9ed1', motto: 'Every shadow is a path.', species: 'Umbral', trait: 'Diplomatic' },
  { name: 'Orion Assembly', short: 'ORION', color: '#8bb6ff', motto: 'We forge tomorrow.', species: 'Orionic', trait: 'Engineering' },
];
export const BUILDINGS = [
  { id: 'foundry', name: 'Orbital Foundry', icon: '⚙', description: 'Refine asteroids into shipbuilding alloys.', cost: [32, 53, 78], credit: [12, 18, 27], effect: '+3 alloys / level', resource: 'alloys' },
  { id: 'laboratory', name: 'Research Array', icon: '✧', description: 'Unlock the secrets of the universe.', cost: [28, 49, 74], credit: [16, 24, 34], effect: '+3 science / level', resource: 'science' },
  { id: 'exchange', name: 'Trade Nexus', icon: '◈', description: 'Galactic banking and commerce.', cost: [26, 47, 71], credit: [14, 22, 32], effect: '+5 credits / level', resource: 'credits' },
  { id: 'citadel', name: 'Defense Grid', icon: '⛨', description: 'Planetary shields and orbital defenses.', cost: [37, 59, 86], credit: [15, 22, 32], effect: '+7 defensive power / level', resource: 'defense' },
];
export const SHIPS = [
  { id: 'corvette', name: 'Corvette', power: 5, alloy: 27, credits: 15, tech: null, icon: '◇', description: 'Fast, affordable early-game combat vessel.' },
  { id: 'frigate', name: 'Frigate', power: 12, alloy: 60, credits: 34, tech: 'fleet-logistics', icon: '⬡', description: 'Versatile midline combat vessel.' },
  { id: 'cruiser', name: 'Cruiser', power: 28, alloy: 132, credits: 74, tech: 'capital-ships', icon: '⬢', description: 'Heavy line ship with overwhelming firepower.' },
];
export const TECHS = [
  { id: 'orbital-industry', name: 'Orbital Industry', branch: 'Industry', cost: 56, prereqs: [], description: 'Advanced fabrication adds 20% to alloy production.', bonus: '+20% alloys', color: '#e6b581' },
  { id: 'stellar-survey', name: 'Stellar Cartography', branch: 'Exploration', cost: 58, prereqs: [], description: 'Surveys expose systems two hyperlane hops away.', bonus: '+1 survey radius', color: '#7ed2e9' },
  { id: 'fusion-grid', name: 'Fusion Grid', branch: 'Economy', cost: 62, prereqs: [], description: 'Efficient generators increase credit yield by 20%.', bonus: '+20% credits', color: '#e1ce95' },
  { id: 'fleet-logistics', name: 'Fleet Logistics', branch: 'Military', cost: 72, prereqs: [], description: 'Unlock Frigates and improve fleet strength.', bonus: 'Frigates unlocked', color: '#ed929d' },
  { id: 'quantum-labs', name: 'Quantum Computation', branch: 'Science', cost: 92, prereqs: ['stellar-survey'], description: 'Artificial minds accelerate discovery.', bonus: '+30% science', color: '#7ed2e9' },
  { id: 'colonial-charters', name: 'Frontier Charters', branch: 'Exploration', cost: 88, prereqs: ['stellar-survey'], description: 'Colonization costs 25% less influence and credits.', bonus: 'Cheaper colonies', color: '#7ed2e9' },
  { id: 'synthetic-smelting', name: 'Synthetic Smelting', branch: 'Industry', cost: 102, prereqs: ['orbital-industry'], description: 'Automation doubles efficiency of orbital furnaces.', bonus: '+25% alloys', color: '#e6b581' },
  { id: 'planetary-banking', name: 'Interstellar Markets', branch: 'Economy', cost: 105, prereqs: ['fusion-grid'], description: 'The credit economy scales across star systems.', bonus: '+30% credits', color: '#e1ce95' },
  { id: 'shield-matrix', name: 'Shield Matrix', branch: 'Military', cost: 98, prereqs: ['fleet-logistics'], description: 'Energy shields fortify colonies and combat ships.', bonus: '+20% fleet defense', color: '#ed929d' },
  { id: 'capital-ships', name: 'Capital Shipyards', branch: 'Military', cost: 142, prereqs: ['shield-matrix'], description: 'Shipyards can assemble heavy Cruisers.', bonus: 'Cruisers unlocked', color: '#ed929d' },
  { id: 'terraforming', name: 'Planetary Engineering', branch: 'Exploration', cost: 131, prereqs: ['colonial-charters'], description: 'Improve colony productivity and capacity by 25%.', bonus: '+25% colony output', color: '#7ed2e9' },
  { id: 'stellar-nexus', name: 'Stellar Nexus', branch: 'Science', cost: 157, prereqs: ['quantum-labs'], description: 'Interlinked research institutes multiply discoveries.', bonus: '+35% science', color: '#7ed2e9' },
  { id: 'culture-networks', name: 'Cultural Networks', branch: 'Civics', cost: 89, prereqs: ['stellar-survey'], description: 'Shared galactic institutions accelerate the rise of traditions.', bonus: '+20% unity', color: '#c3a9ef' },
  { id: 'frontier-habitats', name: 'Frontier Habitats', branch: 'Exploration', cost: 132, prereqs: ['colonial-charters'], description: 'New frontier colonies start with an extra population unit.', bonus: '+1 starting population', color: '#7ed2e9' },
  { id: 'exotic-materials', name: 'Exotic Materials', branch: 'Industry', cost: 170, prereqs: ['synthetic-smelting'], description: 'Rare-matter extraction increases alloy output.', bonus: '+15% alloys', color: '#e6b581' },
  { id: 'civic-administration', name: 'Galactic Administration', branch: 'Civics', cost: 149, prereqs: ['culture-networks','fusion-grid'], description: 'A federated bureaucracy strengthens influence throughout the empire.', bonus: '+20% influence', color: '#c3a9ef' },
];
const PREFIX = ['Ar', 'Bel', 'Cor', 'Den', 'Eri', 'Fal', 'Gai', 'Hel', 'Ixo', 'Jor', 'Kel', 'Lor', 'Mer', 'Niv', 'Oph', 'Pra', 'Qua', 'Rig', 'Sar', 'Tal', 'Umb', 'Vel', 'Wey', 'Xan', 'Yor', 'Zen', 'Astra', 'Ceti', 'Cygn', 'Drac'];
const SUFFIX = ['ion', 'aris', 'ora', ' Prime', ' IX', 'or', 'eus', 'une', 'a', 'os', 'ara', 'ium', 'eti', 'ax', 'is', 'eron', 'ilia', 'orion', 'eth', 'ore'];
const STAR_TYPES = [{ c:'#b4cfff',name:'Blue Giant' },{c:'#a7d3fa',name:'White Star'},{c:'#ffe9ba',name:'Yellow Star'},{c:'#ffc18c',name:'Orange Dwarf'},{c:'#e99697',name:'Red Dwarf'}];
const BIOMES = ['Terran', 'Oceanic', 'Desert', 'Jungle', 'Arctic', 'Barren', 'Volcanic', 'Gas Giant'];
const FEATURES = ['Ancient ruins', 'Crystal deposits', 'Rich asteroid belts', 'Magnetic storms', 'Orbital gardens', 'Precursor artifact', 'Abundant minerals', 'Trade crossroads'];
const RATIO = [0.17,0.21,0.28,0.2,0.14];
const clamp=(v,min,max)=>Math.min(max,Math.max(min,v));
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const has=(emp,tech)=>emp.techs.includes(tech);
const isWar=(a,b)=>!!a.wars[b.id];
const success = (message, extra={})=>({ok:true,message,...extra});
const failure = (message)=>({ok:false,message});
export const titleFor = id => TECHS.find(t=>t.id===id)?.name||id;
export function hashSeed(seed) {let h=2166136261;for(const ch of String(seed)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}return (h>>>0)||1;}
function rand(g) {let x=g.rng|0;x^=x<<13;x^=x>>>17;x^=x<<5;g.rng=x>>>0;return g.rng/4294967296;}
function between(g,a,b){return a+rand(g)*(b-a)}
function roll(g,n){return Math.floor(rand(g)*n)}
function pick(g,items){return items[roll(g,items.length)]}
function connect(g,a,b){if(a===b)return;const x=g.systems[a],y=g.systems[b];if(!x.neighbors.includes(b))x.neighbors.push(b);if(!y.neighbors.includes(a))y.neighbors.push(a);}
function generateMap(g,count){
  const used=new Set();let tries=0;
  while(g.systems.length<count&&tries<count*400){
    tries++;const x=between(g,49,WORLD.width-49),y=between(g,48,WORLD.height-48);
    if(Math.pow((x-570)/625,2)+Math.pow((y-380)/440,2)>1)continue;
    if(g.systems.some(s=>(s.x-x)**2+(s.y-y)**2<30**2))continue;
    let name, guard=0;do{name=pick(g,PREFIX)+pick(g,SUFFIX);guard++}while(used.has(name)&&guard<100);
    if(used.has(name))name+=` ${g.systems.length}`;used.add(name);
    const p=pick(g,BIOMES),star=STAR_TYPES[roll(g,STAR_TYPES.length)];
    const richness=1+roll(g,4),habitability=p==='Terran'||p==='Oceanic'||p==='Jungle'?3:p==='Desert'||p==='Arctic'?2:1;
    g.systems.push({id:g.systems.length,name,x:Math.round(x),y:Math.round(y),star:star.name,color:star.c,biome:p,richness,habitability,feature:pick(g,FEATURES),neighbors:[],owner:null,population:0,buildings:{foundry:0,laboratory:0,exchange:0,citadel:0},capital:false});
  }
  // Prim's minimum spanning tree ensures every system can be reached.
  const inside=new Set([0]);
  while(inside.size<g.systems.length){let best=[Infinity,-1,-1];for(const i of inside)for(let j=0;j<g.systems.length;j++)if(!inside.has(j)){
    const d=dist(g.systems[i],g.systems[j]);if(d<best[0])best=[d,i,j];
  }connect(g,best[1],best[2]);inside.add(best[2]);}
  // Local shortcuts create choices without turning every system into a hub.
  for(const s of g.systems){const ranked=g.systems.filter(t=>t.id!==s.id&&!s.neighbors.includes(t.id)).sort((a,b)=>dist(s,a)-dist(s,b));
    for(const n of ranked.slice(0,2)){if(s.neighbors.length>=5)break;if(dist(s,n)>142||n.neighbors.length>=5)continue;if(rand(g)<0.34)connect(g,s.id,n.id);}
  }
}
function chooseHomes(g,n){
  let homes=[];const candidates=g.systems.filter(s=>s.neighbors.length>=2&&s.habitability>=2);
  let first=candidates.slice().sort((a,b)=>((a.x-360)**2+(a.y-380)**2)-((b.x-360)**2+(b.y-380)**2))[0];
  homes.push(first);
  while(homes.length<n){let best=null,score=-Infinity;for(const c of candidates){if(homes.includes(c))continue;const min=Math.min(...homes.map(s=>dist(c,s)));if(min>score){score=min;best=c}}if(!best)break;homes.push(best);}
  return homes;
}
export function generateGame({seed='ORION-47',size=90,opponents=4,difficulty='normal'}={}){
  size=clamp(Number(size)||90,40,180);opponents=clamp(Number(opponents)||4,1,6);
  const g={version:VERSION,seed:String(seed).slice(0,40)||'ORION-47',rng:hashSeed(seed),turn:1,systems:[],empires:[],fleets:[],logs:[],nextFleetId:1,explored:[],difficulty,gameOver:null,startedAt:Date.now()};
  generateMap(g,size);
  const homes=chooseHomes(g,opponents+1);
  for(let i=0;i<homes.length;i++){
    const t=EMPIRE_TEMPLATES[i];const home=homes[i];home.owner=i;home.population=6;home.capital=true;home.buildings={foundry:1,laboratory:1,exchange:1,citadel:1};
    g.empires.push({...t,id:i,home:home.id,credits:i===0?175:150,alloys:i===0?124:110,influence:56,techs:[],research:'orbital-industry',progress:0,unity:25,traditions:[],policies:[],wars:{},relations:{},lastEnvoy:{},eliminated:false});
    g.fleets.push({id:g.nextFleetId++,owner:i,system:home.id,ships:{corvette:3,frigate:0,cruiser:0},movedTurn:0,name:i===0?'First Expedition':'Home Guard'});
  }
  for(const e of g.empires)for(const r of g.empires)if(r.id!==e.id){e.wars[r.id]=false;e.relations[r.id]=e.id===0?0:roll(g,25)-12;}
  for(const star of g.systems)if(dist(star,homes[0])<145)g.explored.push(star.id);
  log(g,'A new age dawns. The Terran Directorate looks to the stars.','start');
  return g;
}
function log(g,message,type='news'){g.logs.unshift({turn:g.turn,message,type});g.logs=g.logs.slice(0,130)}
export function getNeighbors(g,id){return g.systems[id]?.neighbors.map(i=>g.systems[i])||[]}
export function getEmpire(g,id=0){return g.empires[id]}
export function ownedSystems(g,id=0){return g.systems.filter(s=>s.owner===id)}
export function getVisibility(g,id=0){
 const visible=new Set(), radius=id===0&&has(g.empires[0],'stellar-survey')?2:1;
 const sources=[...ownedSystems(g,id).map(s=>s.id),...g.fleets.filter(f=>f.owner===id).map(f=>f.system)];
 for(const start of sources){visible.add(start);let layer=[start];for(let d=0;d<radius;d++){const nxt=[];for(const i of layer)for(const j of g.systems[i].neighbors){if(!visible.has(j)){visible.add(j);nxt.push(j)}}layer=nxt;}}
 return visible;
}
export function hasSeen(g,id){return g.explored.includes(id)||getVisibility(g).has(id)}
export function reveal(g){const vis=getVisibility(g);for(const id of vis)if(!g.explored.includes(id))g.explored.push(id)}
function modifier(emp,stat){let mod=1;
 if(stat==='alloys'){if(has(emp,'orbital-industry'))mod+=.2;if(has(emp,'synthetic-smelting'))mod+=.25;if(has(emp,'exotic-materials'))mod+=.15;if(emp.trait==='Industrial')mod+=.15;}
 if(stat==='credits'){if(has(emp,'fusion-grid'))mod+=.2;if(has(emp,'planetary-banking'))mod+=.3;if(emp.trait==='Diplomatic')mod+=.12;}
 if(stat==='science'){if(has(emp,'quantum-labs'))mod+=.3;if(has(emp,'stellar-nexus'))mod+=.35;if(emp.trait==='Scientific')mod+=.16;}
 if(emp.trait==='Expansionist'&&stat==='influence')mod+=.15;if(stat==='influence'&&has(emp,'civic-administration'))mod+=.2;
  mod+=civicBonuses(emp)[stat]||0;
 if(has(emp,'terraforming'))mod+=.12;
 return mod;
}
export function systemYield(g,s){if(s.owner===null)return {credits:0,alloys:0,science:0,influence:0};
 const emp=g.empires[s.owner],quality=.72+s.habitability*.18,rich=.7+s.richness*.17,pop=s.population||2;
 return {
  credits:Math.round((3+pop*.52+s.buildings.exchange*5+(s.capital?5:0))*quality*modifier(emp,'credits')),
  alloys:Math.round((1.8+rich*1.6+s.buildings.foundry*3+(s.capital?3:0))*modifier(emp,'alloys')),
  science:Math.round((1.5+s.buildings.laboratory*3+(s.capital?3:0))*quality*modifier(emp,'science')),
  influence:Math.round((s.capital?5:1)*modifier(emp,'influence'))
 };
}
export function income(g,id=0){return ownedSystems(g,id).reduce((a,s)=>{const v=systemYield(g,s);for(const key of Object.keys(a))a[key]+=v[key];return a;},{credits:0,alloys:0,science:0,influence:0})}
export function score(g,id=0){const e=g.empires[id];return ownedSystems(g,id).length*24+e.techs.length*18+g.fleets.filter(f=>f.owner===id).reduce((n,f)=>n+fleetPower(g,f),0)*.45+Math.floor(e.credits/25)+(e.traditions?.length||0)*15;}
export function fleetPower(g,f){let p=SHIPS.reduce((sum,ship)=>sum+(f.ships[ship.id]||0)*ship.power,0);const e=g.empires[f.owner];if(has(e,'fleet-logistics'))p*=1.1;if(has(e,'shield-matrix'))p*=1.2;if(e.trait==='Militaristic')p*=1.15;p*=1+civicBonuses(e).fleet;return Math.round(p);}
export function availableTechs(emp){return TECHS.filter(t=>!has(emp,t.id)&&t.prereqs.every(id=>has(emp,id)))}
export function chooseResearch(g,id){const e=g.empires[0],t=TECHS.find(t=>t.id===id);if(!t)return failure('Unknown technology.');if(has(e,id))return failure('This technology is already researched.');if(!t.prereqs.every(p=>has(e,p)))return failure('Prerequisite technologies are missing.');e.research=id;return success(`Research focus set to ${t.name}.`)}
export function colonyCost(g,id=0){const e=g.empires[id],discount=Math.max(.5,(has(e,'colonial-charters')?.75:1)-civicBonuses(e).colonization);return {credits:Math.ceil(70*discount),alloys:42,influence:Math.ceil(18*discount)};}
function canColonizeBy(g,id,owner){const s=g.systems[id],e=g.empires[owner];if(!s)return failure('Unknown system.');if(s.owner!==null)return failure('This system is already claimed.');if(!s.neighbors.some(n=>g.systems[n].owner===owner))return failure('Colonies must connect to an existing star system.');const c=colonyCost(g,owner);if(Object.keys(c).some(k=>e[k]<c[k]))return failure('Not enough resources to establish a colony.');return success('Ready to colonize.',{cost:c})}
export function canColonize(g,id){return canColonizeBy(g,id,0)}
function colonizeBy(g,id,owner){const allowed=canColonizeBy(g,id,owner);if(!allowed.ok)return allowed;const e=g.empires[owner],s=g.systems[id];for(const [k,v] of Object.entries(allowed.cost))e[k]-=v;s.owner=owner;s.population=2+(has(e,'frontier-habitats')?1:0);s.buildings={foundry:0,laboratory:0,exchange:0,citadel:0};if(owner===0){reveal(g);log(g,`${s.name} joins the Directorate. Colonists begin settling ${s.biome.toLowerCase()} worlds.`,'colony')}else if(getVisibility(g).has(id))log(g,`${e.short} has founded a colony at ${s.name}.`,'intel');return success(`${s.name} colonized successfully.`)}
export function colonize(g,id){return colonizeBy(g,id,0)}
export function canBuild(g,id,type){const s=g.systems[id],e=g.empires[0],b=BUILDINGS.find(b=>b.id===type);if(!s||s.owner!==0)return failure('Select one of your colonies.');if(!b)return failure('Unknown development.');const lv=s.buildings[type];if(lv>=3)return failure('Maximum level reached.');if(e.alloys<b.cost[lv]||e.credits<b.credit[lv])return failure('Insufficient credits or alloys.');return success('Construction available.',{cost:{alloys:b.cost[lv],credits:b.credit[lv]}})}
export function build(g,id,type){const r=canBuild(g,id,type);if(!r.ok)return r;const e=g.empires[0],s=g.systems[id];e.alloys-=r.cost.alloys;e.credits-=r.cost.credits;s.buildings[type]++;log(g,`${s.name}: ${BUILDINGS.find(b=>b.id===type).name} upgraded to level ${s.buildings[type]}.`,'build');return success('Development completed.')}
export function canRecruit(g,systemId,shipId){const s=g.systems[systemId],emp=g.empires[0],ship=SHIPS.find(x=>x.id===shipId);if(!s||s.owner!==0)return failure('Ships require a friendly colony.');if(!ship)return failure('Unknown ship class.');if(ship.tech&&!has(emp,ship.tech))return failure(`Research ${titleFor(ship.tech)} to unlock this ship.`);if(emp.alloys<ship.alloy||emp.credits<ship.credits)return failure('Insufficient shipbuilding resources.');return success('Ship ready for construction.')}
export function recruit(g,systemId,shipId){const valid=canRecruit(g,systemId,shipId);if(!valid.ok)return valid;const ship=SHIPS.find(x=>x.id===shipId),emp=g.empires[0];emp.alloys-=ship.alloy;emp.credits-=ship.credits;let f=g.fleets.find(f=>f.owner===0&&f.system===systemId);if(!f){f={id:g.nextFleetId++,owner:0,system:systemId,ships:{corvette:0,frigate:0,cruiser:0},movedTurn:0,name:`${g.systems[systemId].name} Squadron`};g.fleets.push(f)}f.ships[shipId]++;log(g,`${ship.name} commissioned at ${g.systems[systemId].name}.`,'military');return success(`${ship.name} commissioned.`)}
export function combat(g,attacker,target){const defending=g.fleets.filter(f=>f.owner!==attacker.owner&&f.system===target&&isWar(g.empires[attacker.owner],g.empires[f.owner]));const s=g.systems[target];const defenderOwner=s.owner;
 const attack=fleetPower(g,attacker)*(between(g,.78,1.25));const defFleet=defending.reduce((n,f)=>n+fleetPower(g,f),0);const station=defenderOwner!==null&&defenderOwner!==attacker.owner?6+s.buildings.citadel*7:0;
 const defense=(defFleet+station)*between(g,.77,1.25);
 const won=attack>=defense;
 if(won){for(const f of defending)g.fleets=g.fleets.filter(a=>a.id!==f.id);
   const casualties=clamp(defense/(attack+1)*.53,0,.72);damageFleet(g,attacker,casualties);
   if(s.owner!==null&&s.owner!==attacker.owner){const prev=s.owner;s.owner=attacker.owner;s.capital=false;s.population=Math.max(1,Math.floor(s.population*.65));
     log(g,`${g.empires[attacker.owner].short} seized ${s.name} from ${g.empires[prev].short}.`,'war');}
   else log(g,`${g.empires[attacker.owner].short} prevailed in the battle at ${s.name}.`,'war');
 }else{for(const f of defending)damageFleet(g,f,clamp(attack/(defense+1)*.4,0,.58));g.fleets=g.fleets.filter(f=>f.id!==attacker.id);log(g,`${g.empires[attacker.owner].short}'s fleet was lost at ${s.name}.`,'war');}
 cleanupFleets(g);return won;
}
function damageFleet(g,f,fraction){let remove=Math.floor((f.ships.corvette+f.ships.frigate+f.ships.cruiser)*fraction);if(fraction>0.15)remove=Math.max(1,remove);for(const id of ['corvette','frigate','cruiser']){const n=Math.min(remove,f.ships[id]);f.ships[id]-=n;remove-=n;}if(!Object.values(f.ships).some(Boolean))f.ships.corvette=1;}
function cleanupFleets(g){g.fleets=g.fleets.filter(f=>Object.values(f.ships).some(Boolean));}
export function canMove(g,fleetId,target){const f=g.fleets.find(f=>f.id===fleetId),s=g.systems[target];if(!f||f.owner!==0)return failure('Select one of your fleets first.');if(!s)return failure('Unknown destination.');if(f.movedTurn>=g.turn)return failure('This fleet has already moved this turn.');if(f.system===target)return failure('Fleet is already at this system.');if(!g.systems[f.system].neighbors.includes(target))return failure('Choose a directly connected system along a hyperlane.');if(s.owner!==null&&s.owner!==0&&!isWar(g.empires[0],g.empires[s.owner]))return failure('Declare war in Diplomacy before entering rival territory.');const rivals=g.fleets.filter(x=>x.system===target&&x.owner!==0);if(rivals.some(x=>!isWar(g.empires[0],g.empires[x.owner])))return failure('Neutral fleets are blocking the route.');return success('A navigable hyperlane is available.')}
export function moveFleet(g,fleetId,target){const can=canMove(g,fleetId,target);if(!can.ok)return can;const f=g.fleets.find(x=>x.id===fleetId),s=g.systems[target];f.movedTurn=g.turn;const enemies=g.fleets.filter(x=>x.system===target&&x.owner!==f.owner);if(enemies.length||(s.owner!==null&&s.owner!==f.owner)){const win=combat(g,f,target);if(!win)return failure(`Fleet lost in combat at ${s.name}.`)}f.system=target;reveal(g);log(g,`${f.name} arrived at ${s.name}.`,'fleet');return success(`Fleet moved to ${s.name}.`)}
export function declareWar(g,id){const player=g.empires[0],enemy=g.empires[id];if(!enemy||id===0||enemy.eliminated)return failure('Choose an active rival civilization.');if(player.wars[id])return failure('Already at war.');player.wars[id]=true;enemy.wars[0]=true;player.relations[id]=-100;enemy.relations[0]=-100;log(g,`WAR DECLARED: ${player.short} and ${enemy.short} are now at war.`,'war');return success(`War declared on ${enemy.name}.`)}
export function sendEnvoy(g,id){const e=g.empires[0],r=g.empires[id];if(!r||id===0||r.eliminated)return failure('Choose a rival empire.');if(e.wars[id])return failure('Diplomacy is suspended during war.');if(e.lastEnvoy[id]===g.turn)return failure('An envoy has already visited this turn.');if(e.influence<12)return failure('Not enough influence to send an envoy.');e.influence-=12;e.relations[id]=clamp((e.relations[id]||0)+21,-100,100);r.relations[0]=clamp((r.relations[0]||0)+21,-100,100);e.lastEnvoy[id]=g.turn;log(g,`An envoy improved diplomatic ties with ${r.short}.`,'diplomacy');return success('Diplomatic relations improved by 21.')}
export function offerPeace(g,id){const p=g.empires[0],enemy=g.empires[id];if(!enemy||!p.wars[id])return failure('You are not at war with this empire.');const ps=score(g,0),es=score(g,id);if(ps<es*.95&&ownedSystems(g,id).length>1)return failure('Your rival refuses peace while it holds the advantage.');p.wars[id]=false;enemy.wars[0]=false;p.relations[id]=-35;enemy.relations[0]=-35;log(g,`Peace treaty signed with ${enemy.short}.`,'diplomacy');return success('A peace treaty has been signed.')}
function empireResearch(g,e){if(!e.research||has(e,e.research))e.research=availableTechs(e)[0]?.id||null;if(!e.research)return;const t=TECHS.find(t=>t.id===e.research);if(!t||!t.prereqs.every(p=>has(e,p))){e.research=availableTechs(e)[0]?.id||null;return;}e.progress+=income(g,e.id).science;while(e.research){const cur=TECHS.find(t=>t.id===e.research);if(!cur||e.progress<cur.cost)break;e.progress-=cur.cost;e.techs.push(cur.id);if(e.id===0)log(g,`RESEARCH COMPLETE: ${cur.name}. ${cur.bonus}.`,'research');e.research=availableTechs(e)[0]?.id||null;}}
export function adoptTradition(g,id){const valid=canAdoptTradition(g,id);if(!valid.ok)return valid;const e=g.empires[0],t=TRADITIONS.find(x=>x.id===id);e.unity=(e.unity||0)-traditionCost(e);(e.traditions??=[]).push(id);log(g,`TRADITION ADOPTED: ${t.name}. ${t.bonus}.`,'culture');return success(`${t.name} adopted.`);}
export function enactPolicy(g,id){const valid=canEnactPolicy(g,id);if(!valid.ok)return valid;const e=g.empires[0],p=POLICIES.find(x=>x.id===id);e.influence-=20;e.policies=(e.policies||[]).filter(x=>POLICIES.find(z=>z.id===x)?.slot!==p.slot);e.policies.push(id);log(g,`SOCIAL POLICY: ${p.name}. ${p.bonus}.`,'culture');return success(`${p.name} enacted.`);}
function aiRecruit(g,emp){const system=ownedSystems(g,emp.id).find(s=>s.capital)||ownedSystems(g,emp.id)[0];if(!system)return;const ship=SHIPS.slice().reverse().find(ship=>(!ship.tech||has(emp,ship.tech))&&emp.alloys>=ship.alloy&&emp.credits>=ship.credits);if(!ship)return;emp.alloys-=ship.alloy;emp.credits-=ship.credits;let f=g.fleets.find(x=>x.owner===emp.id&&x.system===system.id);if(!f){f={id:g.nextFleetId++,owner:emp.id,system:system.id,ships:{corvette:0,frigate:0,cruiser:0},movedTurn:0,name:`${emp.short} Armada`};g.fleets.push(f)}f.ships[ship.id]++;}
function aiTurn(g,emp){if(!ownedSystems(g,emp.id).length){emp.eliminated=true;return;}
 const colonies=ownedSystems(g,emp.id),choices=[];for(const s of colonies)for(const n of getNeighbors(g,s.id))if(n.owner===null&&!choices.includes(n.id))choices.push(n.id);
 const ranked=choices.map(id=>g.systems[id]).sort((a,b)=>(b.richness+b.habitability)-(a.richness+a.habitability));
 if(ranked.length&&rand(g)<(g.difficulty==='hard'?.83:g.difficulty==='easy'?.42:.62))colonizeBy(g,ranked[0].id,emp.id);
 if(rand(g)<.52&&emp.alloys>34&&emp.credits>25){const s=pick(g,colonies);const b=pick(g,BUILDINGS.slice(0,3));const lv=s.buildings[b.id];if(lv<3&&emp.alloys>=b.cost[lv]&&emp.credits>=b.credit[lv]){emp.alloys-=b.cost[lv];emp.credits-=b.credit[lv];s.buildings[b.id]++;}}
 if(rand(g)<.75)aiRecruit(g,emp);
 // Opportunistic but conservative AI: threats emerge after initial expansion.
 if(g.turn>12){for(const rival of g.empires){if(rival.id===emp.id||rival.eliminated||emp.wars[rival.id])continue;
   const touching=colonies.some(s=>s.neighbors.some(n=>g.systems[n].owner===rival.id));
   if(touching&&emp.relations[rival.id]<-18&&rand(g)<.075){emp.wars[rival.id]=true;rival.wars[emp.id]=true;log(g,`${emp.short} declared war on ${rival.short}!`,'war');}
 }}
 for(const f of g.fleets.filter(f=>f.owner===emp.id)){
   const targets=getNeighbors(g,f.system);const hostile=targets.filter(s=>s.owner!==null&&s.owner!==emp.id&&emp.wars[s.owner]);
   if(hostile.length&&rand(g)<.56){const dest=hostile.sort((a,b)=>(b.habitability+b.richness)-(a.habitability+a.richness))[0];const won=combat(g,f,dest.id);if(won)f.system=dest.id;continue;}
   // Rally fleets toward neighboring disputed territory instead of random wandering.
   if(rand(g)<.18){const friendly=targets.filter(s=>s.owner===emp.id);if(friendly.length)f.system=pick(g,friendly).id;}
 }
}
export function endTurn(g){if(g.gameOver)return failure('This campaign has ended. Start a new galaxy to continue.');g.turn++;
 for(const e of g.empires){const y=income(g,e.id);for(const k of ['credits','alloys','influence'])e[k]+=y[k];e.unity=(e.unity||0)+unityIncome(g,e.id);if(ownedSystems(g,e.id).length)empireResearch(g,e)}
 for(const system of g.systems)if(system.owner!==null)advancePopulation(system);
 for(const e of g.empires.slice(1)){aiTurn(g,e)}
 reveal(g);
 for(const e of g.empires)if(!ownedSystems(g,e.id).length)e.eliminated=true;
 const mine=ownedSystems(g,0).length;if(mine===0){g.gameOver={won:false,title:'The last light fades',description:'The Directorate has lost its final colony.'};log(g,'The Terran Directorate has fallen.','war')}
 else if(mine>=Math.ceil(g.systems.length*.65)){g.gameOver={won:true,title:'Galactic Dominion',description:`The Directorate controls ${mine} of ${g.systems.length} star systems.`};log(g,'VICTORY: The Directorate dominates the galaxy!','victory')}
 else if(g.empires.slice(1).every(e=>e.eliminated)){g.gameOver={won:true,title:'Victory among the stars',description:'No competing empire remains.'};log(g,'VICTORY: All rival empires have fallen.','victory')}
 return success(`Turn ${g.turn} has begun.`,{income:income(g,0),newEvents:g.logs.filter(x=>x.turn===g.turn)});
}
export function validateGame(data){
 if(!data||data.version!==VERSION||!Array.isArray(data.systems)||!Array.isArray(data.empires)||!Array.isArray(data.fleets)||data.systems.length<40||data.systems.length>180||data.empires.length<2||data.empires.length>7)return false;
 if(!Number.isInteger(data.turn)||data.turn<1||data.turn>100000||!Number.isInteger(data.rng)||data.systems.some((s,i)=>s.id!==i||!Array.isArray(s.neighbors)||!s.neighbors.every(n=>Number.isInteger(n)&&n>=0&&n<data.systems.length)||!(s.owner===null||Number.isInteger(s.owner)&&s.owner>=0&&s.owner<data.empires.length)))return false;
 return true;
}
