/* Persistent individual ship IDs with fleet-count compatibility for the existing game. */
export const SHIP_CLASSES=Object.freeze({
 corvette:Object.freeze({hp:45,armor:4,shield:8,attack:5}),
 frigate:Object.freeze({hp:100,armor:12,shield:20,attack:12}),
 cruiser:Object.freeze({hp:220,armor:30,shield:52,attack:28})
});
const SHIP_TYPES=Object.keys(SHIP_CLASSES);
function counts(units){const n=Object.fromEntries(SHIP_TYPES.map(type=>[type,0]));for(const unit of units)n[unit.type]++;return n;}
export function reconcileShipUnits(g){
 if(!Number.isSafeInteger(g.nextShipId)||g.nextShipId<1){
  g.nextShipId=1;
 }
 for(const f of g.fleets||[])for(const unit of f.units||[]){
  if(Number.isInteger(unit?.id)&&unit.id>=g.nextShipId)g.nextShipId=unit.id+1;
 }
 const used=new Set();
 for(const f of g.fleets||[]){
  const old=Array.isArray(f.units)?f.units:[];
  const next=[];
  for(const type of SHIP_TYPES){
   const target=Math.max(0,Number(f.ships?.[type])||0);
   const available=old.filter(u=>u?.type===type&&Number.isInteger(u.id)&&u.id>0&&!used.has(u.id)).slice(0,target);
   for(const unit of available){used.add(unit.id);next.push(unit);}
   for(let i=available.length;i<target;i++){
    const stats=SHIP_CLASSES[type],unit={id:g.nextShipId++,type,hp:stats.hp,armor:stats.armor,shield:stats.shield,attack:stats.attack};
    next.push(unit);used.add(unit.id);
   }
  }
  f.units=next;
 }
 return g;
}
export function shipUnitRoster(g,systemId){
 return (g.fleets||[]).filter(f=>f.system===systemId)
  .flatMap(f=>(f.units||[]).map(u=>({...u,owner:f.owner,fleetId:f.id,systemId,localOrder:f.localOrder||null})));
}
export function validShipState(g){
 if(g.nextShipId!==undefined&&(!Number.isSafeInteger(g.nextShipId)||g.nextShipId<1))return false;
 const ids=new Set();
 for(const f of g.fleets||[]){
  if(f.localOrder!==undefined&&!validLocalOrder(f.localOrder))return false;
  if(f.units===undefined)continue;
  if(!Array.isArray(f.units)||f.units.length>10000)return false;
  const expected=counts(f.units);
  if(SHIP_TYPES.some(type=>expected[type]!==f.ships[type]))return false;
  for(const unit of f.units){
   if(!unit||!Number.isInteger(unit.id)||unit.id<1||ids.has(unit.id)||!SHIP_CLASSES[unit.type])return false;
   ids.add(unit.id);
   if(!Number.isFinite(unit.hp)||unit.hp<0||unit.hp>SHIP_CLASSES[unit.type].hp)return false;
   for(const key of ['armor','shield','attack'])if(!Number.isFinite(unit[key])||unit[key]<0)return false;
  }
 }
 return true;
}
export function validLocalOrder(order){
 if(!order||typeof order!=='object'||Array.isArray(order))return false;
 if(!['hold','orbit','guard','dock','patrol','move'].includes(order.kind))return false;
 if(['orbit','guard'].includes(order.kind))return Number.isInteger(order.planetId)&&order.planetId>=0&&order.planetId<100;
 if(order.kind==='move')return Array.isArray(order.position)&&order.position.length===2&&order.position.every(x=>Number.isFinite(x)&&Math.abs(x)<=9);
 return true;
}
function lookup(g,ids){
 if(!Array.isArray(ids)||!ids.length||ids.length>500||new Set(ids).size!==ids.length)return null;
 const selected=[];
 for(const id of ids){
  if(!Number.isInteger(id)||id<1)return null;
  const f=g.fleets.find(f=>f.owner===0&&(f.units||[]).some(u=>u.id===id));
  const unit=f?.units.find(u=>u.id===id);
  if(!f||!unit)return null;
  selected.push({f,unit});
 }
 if(new Set(selected.map(x=>x.f.system)).size!==1)return null;
 return selected;
}
function detach(g,f,ids){
 const selected=f.units.filter(u=>ids.has(u.id));
 if(!selected.length)return null;
 if(selected.length===f.units.length)return f;
 const next={id:g.nextFleetId++,owner:f.owner,system:f.system,name:f.name+' Detachment',ships:counts(selected),units:selected,movedTurn:f.movedTurn,route:[]};
 g.fleets.push(next);
 f.units=f.units.filter(u=>!ids.has(u.id));
 f.ships=counts(f.units);
 return next;
}
export function splitShipSelection(g,ids){
 const selected=lookup(g,ids);
 if(!selected)return {ok:false,message:'Select your own ships in one system.'};
 const fleets=[...new Set(selected.map(x=>x.f))];
 if(fleets.length!==1)return {ok:false,message:'Select ships from a single fleet to split.'};
 if(fleets[0].route?.length)return {ok:false,message:'Cancel hyperlane transit before splitting.'};
 if(selected.length===fleets[0].units.length)return {ok:false,message:'Select only part of a fleet to split it.'};
 const f=detach(g,fleets[0],new Set(ids));
 return {ok:true,message:f.name+' created.',fleetIds:[f.id],unitIds:ids};
}
export function issueShipOrder(g,ids,order,{planets=[],system=null}={}){
 const selected=lookup(g,ids);
 if(!selected)return {ok:false,message:'Select your own ships in one system.'};
 if(!validLocalOrder(order))return {ok:false,message:'Invalid tactical order.'};
 if(['orbit','guard'].includes(order.kind)&&!planets.some(p=>p.id===order.planetId))return {ok:false,message:'Choose a planet in this system.'};
 if(order.kind==='dock'&&(!system||system.owner!==0||!system.outpost&&system.owner!==0||system.outpost?.level===0))return {ok:false,message:'A friendly operational outpost is required to dock.'};
 if(selected.some(x=>x.f.route?.length))return {ok:false,message:'Cancel hyperlane transit before issuing local orders.'};
 const fleetIds=[];
 for(const f of new Set(selected.map(x=>x.f))){
  const idsForFleet=new Set(selected.filter(x=>x.f===f).map(x=>x.unit.id));
  const target=detach(g,f,idsForFleet);if(!target)continue;
  target.localOrder=structuredClone(order);
  fleetIds.push(target.id);
 }
 return {ok:true,message:'Tactical order issued to '+ids.length+' ship(s).',fleetIds,unitIds:[...ids]};
}
export function mergeShipSelection(g,ids){
 const selected=lookup(g,ids);
 if(!selected)return {ok:false,message:'Select your ships in one system.'};
 const fleets=[...new Set(selected.map(x=>x.f))];
 if(fleets.length<2)return {ok:false,message:'Select ships from at least two fleets to merge.'};
 if(fleets.some(f=>f.route?.length))return {ok:false,message:'Cancel hyperlane transit before merging.'};
 // Only fully selected fleets can merge: never silently include unselected ships.
 if(fleets.some(f=>f.units.some(u=>!ids.includes(u.id))))return {ok:false,message:'Select all ships in each fleet before merging.'};
 const main=fleets[0];
 for(const f of fleets.slice(1)){main.units.push(...f.units);g.fleets=g.fleets.filter(x=>x!==f);}
 main.ships=counts(main.units);main.localOrder={kind:'hold'};
 return {ok:true,message:'Fleets merged.',fleetIds:[main.id],unitIds:ids};
}
