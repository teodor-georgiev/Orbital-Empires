/** Deterministic, dependency-free orbital scenery and one-time exploration rewards.
 * This is fictional gameplay; real Sol/nearby stars keep their factual identities.
 * No runtime fetching, external images, or extra save-schema version.
 */
export const SITE_KINDS=Object.freeze({
  asteroid:{label:'Asteroid mining site',icon:'◆',color:'#c9a58a'},
  comet:{label:'Comet',icon:'☄',color:'#b2e7f5'},
  anomaly:{label:'Spatial anomaly',icon:'✧',color:'#bd9cf4'},
  blackHole:{label:'Black hole',icon:'◉',color:'#b993f5'},
  leviathan:{label:'Void leviathan',icon:'♜',color:'#f0a0b2'}
});
export function environmentRandom(seed){
  let h=2166136261;
  for(const char of String(seed)){h^=char.charCodeAt(0);h=Math.imul(h,16777619);}
  let state=h>>>0||1;
  return ()=>{state^=state<<13;state^=state>>>17;state^=state<<5;return (state>>>0)/4294967296;};
}
export function generateStarfield(seed,systemId,count=320){
  const next=environmentRandom(`${seed}:stars:${systemId}`),stars=[];
  for(let i=0;i<count;i++){
    const z=next()*2-1,angle=next()*Math.PI*2,radial=Math.sqrt(1-z*z);
    stars.push({x:Math.cos(angle)*radial*115,y:z*115,z:Math.sin(angle)*radial*115,
      brightness:.35+next()*.65,blue:next()>.75});
  }
  return stars;
}
/** A stable set of sites for every system; no global RNG consumption. */
export function generateSpaceFeatures(seed,system){
  if(!system||!Number.isInteger(system.id)||system.id<0)throw new TypeError('Valid system required');
  const next=environmentRandom(`${seed}:orbital:${system.id}`);
  const sol=system.realStarId==='sol',fictional=!system.realStarId;
  const sites=[];
  const add=(id,kind,name,description,orbitRadius,discovery)=>{
    sites.push({id,kind,name,description,orbitRadius:Number(orbitRadius.toFixed(2)),
      phase:Number((next()*Math.PI*2).toFixed(6)),inclination:Number(((next()-.5)*.12).toFixed(5)),discovery});
  };
  // A metal-rich orbital belt is guaranteed for the playable home system.
  if(sol||next()<.90)add('asteroid-belt','asteroid',sol?'Main asteroid belt':'Metal-rich asteroid field',
    'Deploy a mining team to recover alloys. Costs 8 credits; one extraction per system.',5.9,'+18 alloys · −8 credits');
  if(sol||next()<.52)add('comet','comet',sol?'Long-period comet':'Ice-tail wanderer',
    'Sample cometary ice and dust to learn about the outer system.',10.6,'+10 unity');
  if(!sol&&next()<.60)add('anomaly','anomaly','Unexplained signal',
    'A strange spatial signature may accelerate ongoing scientific research.',7.6,'+22 research progress');
  const blackHole=fictional&&next()<.11;
  if(blackHole)add('singularity','blackHole','Black hole accretion survey',
    'Study the gravity well from a safe distance. The system is fictional.',1.4,'+34 research · +8 influence');
  if(fictional&&next()<.32)add('leviathan','leviathan','Void leviathan',
    'Hostile space fauna. Engage only with at least two corvettes in the system; one will be lost.',8.3,'−1 corvette · +24 alloys · +16 influence');
  return {blackHole,sites};
}
function denied(message){return {ok:false,message};}
function approved(message){return {ok:true,message};}
function scanKey(systemId,id){return `${systemId}:${id}`;}
export function hasScannedSite(game,systemId,id){
  return game?.spaceScans?.[scanKey(systemId,id)]===true;
}
export function canSurveySpaceSite(game,systemId,id){
  if(!game||!Number.isInteger(systemId)||systemId<0||systemId>=game.systems?.length)return denied('Unknown star system.');
  const system=game.systems[systemId],site=generateSpaceFeatures(game.seed,system).sites.find(s=>s.id===id);
  if(!site)return denied('Unknown orbital object.');
  if(game.gameOver)return denied('This campaign has ended.');
  if(hasScannedSite(game,systemId,id))return denied('Already surveyed in this campaign.');
  if(system.owner!==null&&system.owner!==0)return denied('Cannot operate in a foreign-controlled system.');
  const fleets=game.fleets.filter(f=>f.owner===0&&f.system===systemId);
  if(system.owner!==0&&!fleets.length)return denied('Send a fleet to this system before exploring its objects.');
  const player=game.empires?.[0];
  if(!player)return denied('No player civilization.');
  if(site.kind==='asteroid'&&player.credits<8)return denied('Mining requires 8 credits.');
  if(site.kind==='leviathan'&&!fleets.some(f=>(f.ships?.corvette||0)>=2))
    return denied('Deploy a fleet with at least two corvettes. One will be lost in combat.');
  return approved('Survey operation available.');
}
export function surveySpaceSite(game,systemId,id){
  const valid=canSurveySpaceSite(game,systemId,id);if(!valid.ok)return valid;
  const site=generateSpaceFeatures(game.seed,game.systems[systemId]).sites.find(s=>s.id===id);
  const player=game.empires[0];
  switch(site.kind){
    case 'asteroid':player.credits-=8;player.alloys+=18;break;
    case 'comet':player.unity=(player.unity||0)+10;break;
    case 'anomaly':player.progress+=22;break;
    case 'blackHole':player.progress+=34;player.influence+=8;break;
    case 'leviathan':{
      const fleet=game.fleets.find(f=>f.owner===0&&f.system===systemId&&f.ships.corvette>=2);
      fleet.ships.corvette--;player.alloys+=24;player.influence+=16;break;
    }
    default:return denied('Unknown exploration result.');
  }
  if(!game.spaceScans)game.spaceScans={};
  game.spaceScans[scanKey(systemId,id)]=true;
  const message=`${site.name} survey complete: ${site.discovery}.`;
  game.logs.unshift({turn:game.turn,message:`ORBITAL SURVEY: ${message}`,type:'research'});
  game.logs=game.logs.slice(0,130);
  return approved(message);
}
export function validSpaceScans(data){
  if(data===undefined)return true; // old saves remain loadable.
  if(!data||typeof data!=='object'||Array.isArray(data)||Object.keys(data).length>1000)return false;
  return Object.entries(data).every(([key,val])=>/^(0|[1-9]\d{0,2}):(asteroid-belt|comet|anomaly|singularity|leviathan)$/.test(key)&&val===true);
}
