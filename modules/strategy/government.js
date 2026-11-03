/* Deterministic, optional government layer; legacy v1 saves need no migration. */
export const GOVERNMENTS = [
  {id:'directorate',name:'Directorate Charter',description:'An interim administration with no structural bonuses. Reform when the empire is ready.',bonus:'Neutral governance',effects:{},stability:0},
  {id:'parliament',name:'Federated Parliament',description:'Representatives protect local rights and shared civic institutions.',bonus:'Unity +12%, influence +8%',effects:{unity:.12,influence:.08},stability:4},
  {id:'technocracy',name:'Technocratic Council',description:'Experts lead the state, accelerating research at a cost to popular trust.',bonus:'Science +15%',effects:{science:.15},stability:-4},
  {id:'imperium',name:'Imperial Directorate',description:'A centralized command prioritizes the navy and industrial mobilization.',bonus:'Fleet +13%, alloys +6%',effects:{fleet:.13,alloys:.06},stability:-5}
];
export const CIVICS = [
  {id:'open-assembly',name:'Open Assembly',slot:'Constitution',description:'Public deliberation and transparent institutions.',bonus:'Unity +10%; stability +4',effects:{unity:.1},stability:4},
  {id:'executive-mandate',name:'Executive Mandate',slot:'Constitution',description:'Decisive rule concentrates authority and reduces representation.',bonus:'Influence +12%; stability -4',effects:{influence:.12},stability:-4},
  {id:'merit-service',name:'Meritocratic Service',slot:'Constitution',description:'Appointments are earned through demonstrated expertise.',bonus:'Science +9%; stability +1',effects:{science:.09},stability:1},
  {id:'trade-charters',name:'Trade Charters',slot:'Development',description:'Guarantee the freedom of interstellar enterprise.',bonus:'Credits +12%; stability -1',effects:{credits:.12},stability:-1},
  {id:'public-works',name:'Public Works',slot:'Development',description:'State-led infrastructure benefits every colony.',bonus:'Alloys +9%; stability +3',effects:{alloys:.09},stability:3},
  {id:'frontier-autonomy',name:'Frontier Autonomy',slot:'Development',description:'Grant settlers autonomy over far-flung worlds.',bonus:'Colonization discount +10%; stability +1',effects:{colonization:.1},stability:1}
];
export const COUNCIL_OFFICES = [
  {id:'chancellor',name:'Chancellor',description:'Directs economic and civil administration.'},
  {id:'scientist',name:'Chief Scientist',description:'Sets the agenda for discovery.'},
  {id:'admiral',name:'Fleet Marshal',description:'Coordinates the defense of the realm.'}
];
export const LEADERS = [
  {id:'mara-vale',name:'Mara Vale',office:'chancellor',trait:'Consensus Builder',bonus:'Unity +10%; stability +3',effects:{unity:.10},stability:3},
  {id:'darius-sol',name:'Darius Sol',office:'chancellor',trait:'Trade Strategist',bonus:'Credits +10%; stability -1',effects:{credits:.10},stability:-1},
  {id:'nira-chen',name:'Nira Chen',office:'scientist',trait:'Open Science',bonus:'Science +10%; stability +2',effects:{science:.10},stability:2},
  {id:'veya-ren',name:'Veya Ren',office:'scientist',trait:'Experimentalist',bonus:'Science +16%; stability -3',effects:{science:.16},stability:-3},
  {id:'tarek-voss',name:'Tarek Voss',office:'admiral',trait:'Defensive Doctrine',bonus:'Fleet +9%; stability +2',effects:{fleet:.09},stability:2},
  {id:'kael-orum',name:'Kael Orum',office:'admiral',trait:'Rapid Mobilization',bonus:'Fleet +15%; stability -3',effects:{fleet:.15},stability:-3}
];
export const FACTIONS = [
  {id:'guilds',name:'Trade Guilds',description:'Prosperity and free commerce.'},
  {id:'scholars',name:'Scholars',description:'Discovery and civil liberties.'},
  {id:'settlers',name:'Frontier Settlers',description:'Local autonomy and security.'}
];
const clamp=(n,min,max)=>Math.min(max,Math.max(min,n));
const governmentOf=emp=>GOVERNMENTS.find(g=>g.id===(emp?.government||'directorate'))||GOVERNMENTS[0];
const activeCivics=emp=>CIVICS.filter(c=>Array.isArray(emp?.civics)&&emp.civics.includes(c.id));
const activeLeaders=emp=>LEADERS.filter(l=>emp?.council?.[l.office]===l.id);
export function governanceBonuses(emp){
  const bonuses={credits:0,alloys:0,science:0,influence:0,unity:0,fleet:0,colonization:0};
  for(const x of [governmentOf(emp),...activeCivics(emp),...activeLeaders(emp)]){
    for(const [key,value] of Object.entries(x.effects))bonuses[key]+=value;
  }
  return bonuses;
}
export function factionLoyalty(emp,id){
  const value=emp?.factionLoyalty?.[id];
  return Number.isFinite(value)&&value>=0&&value<=100?value:55;
}
export function factionTargets(emp){
  const government=governmentOf(emp).id;
  const civics=new Set(activeCivics(emp).map(c=>c.id));
  const policies=new Set(Array.isArray(emp?.policies)?emp.policies:[]);
  return {
    guilds:clamp(50+(government==='parliament'?6:government==='imperium'?-8:0)+(civics.has('trade-charters')?18:0)+(policies.has('open-markets')?14:0)-(policies.has('directed-industry')?8:0),10,90),
    scholars:clamp(50+(government==='technocracy'?10:government==='imperium'?-10:0)+(civics.has('merit-service')?12:0)+(civics.has('open-assembly')?7:0)+(policies.has('academic-freedom')?15:0),10,90),
    settlers:clamp(50+(government==='imperium'?-5:0)+(civics.has('frontier-autonomy')?17:0)+(civics.has('public-works')?9:0)+(policies.has('civic-service')?12:0)-(policies.has('fleet-doctrine')?7:0),10,90)
  };
}
export function politicalStability(emp){
  const loyalty=FACTIONS.reduce((n,f)=>n+factionLoyalty(emp,f.id),0)/FACTIONS.length;
  const stability=[governmentOf(emp),...activeCivics(emp),...activeLeaders(emp)].reduce((n,x)=>n+x.stability,0);
  return clamp(Math.round(55+(loyalty-55)*1.1+stability),0,100);
}
export function stabilityProductionFactor(emp){
  const stability=politicalStability(emp);
  return stability<30?.75:stability<45?.9:stability>=75?1.07:1;
}
export function advancePolitics(emp){
  const previous=politicalStability(emp),targets=factionTargets(emp);
  const next={};
  for(const faction of FACTIONS){
    const before=factionLoyalty(emp,faction.id),target=targets[faction.id];
    next[faction.id]=clamp(before+Math.sign(target-before)*Math.min(2,Math.abs(target-before)),0,100);
  }
  emp.factionLoyalty=next;
  return {previous,current:politicalStability(emp),unrest:politicalStability(emp)<30&&previous>=30};
}
export function canReformGovernment(game,id){
  const emp=game?.empires?.[0],gov=GOVERNMENTS.find(g=>g.id===id);
  if(!emp)return {ok:false,message:'No player empire.'};
  if(!gov)return {ok:false,message:'Unknown government.'};
  if((emp.government||'directorate')===id)return {ok:false,message:'Government already in force.'};
  if((emp.influence||0)<40)return {ok:false,message:'A government reform requires 40 influence.'};
  if(Number.isInteger(emp.lastGovernmentReform)&&game.turn-emp.lastGovernmentReform<5)return {ok:false,message:'Government reforms require five cycles between changes.'};
  return {ok:true,message:'Reform available.'};
}
export function canAdoptCivic(game,id){
  const emp=game?.empires?.[0],civic=CIVICS.find(c=>c.id===id);
  if(!emp)return {ok:false,message:'No player empire.'};
  if(!civic)return {ok:false,message:'Unknown civic.'};
  if((emp.civics||[]).includes(id))return {ok:false,message:'Civic already adopted.'};
  if((emp.influence||0)<20)return {ok:false,message:'Adopting a civic requires 20 influence.'};
  return {ok:true,message:'Civic available.'};
}
export function canAppointLeader(game,id){
  const emp=game?.empires?.[0],leader=LEADERS.find(l=>l.id===id);
  if(!emp)return {ok:false,message:'No player empire.'};
  if(!leader)return {ok:false,message:'Unknown council candidate.'};
  if(emp.council?.[leader.office]===id)return {ok:false,message:'Candidate already holds this office.'};
  if((emp.influence||0)<12)return {ok:false,message:'An appointment requires 12 influence.'};
  if(Number.isInteger(emp.lastAppointments?.[leader.office])&&game.turn-emp.lastAppointments[leader.office]<2)return {ok:false,message:'This office cannot be reassigned for two cycles.'};
  return {ok:true,message:'Appointment available.'};
}
export function reformGovernment(game,id){
  const valid=canReformGovernment(game,id);if(!valid.ok)return valid;
  const emp=game.empires[0],gov=GOVERNMENTS.find(g=>g.id===id);
  emp.influence-=40;emp.government=id;emp.lastGovernmentReform=game.turn;
  emp.factionLoyalty=Object.fromEntries(FACTIONS.map(f=>[f.id,clamp(factionLoyalty(emp,f.id)-4,0,100)]));
  game.logs.unshift({turn:game.turn,message:'GOVERNMENT REFORM: '+gov.name+' established. Factions react to the change.',type:'culture'});game.logs=game.logs.slice(0,130);
  return {ok:true,message:gov.name+' established.'};
}
export function adoptCivic(game,id){
  const valid=canAdoptCivic(game,id);if(!valid.ok)return valid;
  const emp=game.empires[0],civic=CIVICS.find(c=>c.id===id);
  emp.influence-=20;
  emp.civics=(emp.civics||[]).filter(x=>CIVICS.find(c=>c.id===x)?.slot!==civic.slot);
  emp.civics.push(id);
  game.logs.unshift({turn:game.turn,message:'CIVIC REFORM: '+civic.name+' adopted.',type:'culture'});game.logs=game.logs.slice(0,130);
  return {ok:true,message:civic.name+' adopted.'};
}
export function appointLeader(game,id){
  const valid=canAppointLeader(game,id);if(!valid.ok)return valid;
  const emp=game.empires[0],leader=LEADERS.find(l=>l.id===id);
  emp.influence-=12;
  emp.council={...(emp.council||{}),[leader.office]:id};
  emp.lastAppointments={...(emp.lastAppointments||{}),[leader.office]:game.turn};
  game.logs.unshift({turn:game.turn,message:'COUNCIL: '+leader.name+' appointed '+COUNCIL_OFFICES.find(o=>o.id===leader.office).name+'.',type:'culture'});game.logs=game.logs.slice(0,130);
  return {ok:true,message:leader.name+' appointed.'};
}
export function validGovernmentState(emp){
  if(emp.government!==undefined&&!GOVERNMENTS.some(g=>g.id===emp.government))return false;
  if(emp.civics!==undefined){
    if(!Array.isArray(emp.civics)||emp.civics.length>2||emp.civics.some(id=>!CIVICS.some(c=>c.id===id)))return false;
    if(new Set(emp.civics.map(id=>CIVICS.find(c=>c.id===id).slot)).size!==emp.civics.length)return false;
  }
  if(emp.council!==undefined){
    if(!emp.council||typeof emp.council!=='object'||Array.isArray(emp.council)||Object.entries(emp.council).some(([office,id])=>!LEADERS.some(l=>l.office===office&&l.id===id)))return false;
  }
  if(emp.factionLoyalty!==undefined){
    if(!emp.factionLoyalty||typeof emp.factionLoyalty!=='object'||Array.isArray(emp.factionLoyalty)||Object.entries(emp.factionLoyalty).some(([id,v])=>!FACTIONS.some(f=>f.id===id)||!Number.isInteger(v)||v<0||v>100))return false;
  }
  if(emp.lastGovernmentReform!==undefined&&(!Number.isInteger(emp.lastGovernmentReform)||emp.lastGovernmentReform<1))return false;
  if(emp.lastAppointments!==undefined&&(!emp.lastAppointments||typeof emp.lastAppointments!=='object'||Array.isArray(emp.lastAppointments)||Object.entries(emp.lastAppointments).some(([id,v])=>!COUNCIL_OFFICES.some(o=>o.id===id)||!Number.isInteger(v)||v<1)))return false;
  return true;
}
