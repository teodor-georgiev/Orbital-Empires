/* Original low-poly procedural ship silhouettes, generated as triangle meshes. */
function builder(){
 const data=[];
 function face(a,b,c){
  const ab=b.map((v,i)=>v-a[i]),ac=c.map((v,i)=>v-a[i]);
  let n=[ab[1]*ac[2]-ab[2]*ac[1],ab[2]*ac[0]-ab[0]*ac[2],ab[0]*ac[1]-ab[1]*ac[0]];
  const m=Math.hypot(...n)||1;n=n.map(v=>v/m);
  for(const p of [a,b,c])data.push(...p,...n);
 }
 function prism(points,bottom=-.1,top=.1){
  for(let i=1;i<points.length-1;i++){
   const p=points;face([p[0][0],top,p[0][1]],[p[i][0],top,p[i][1]],[p[i+1][0],top,p[i+1][1]]);
   face([p[0][0],bottom,p[0][1]],[p[i+1][0],bottom,p[i+1][1]],[p[i][0],bottom,p[i][1]]);
  }
  for(let i=0;i<points.length;i++){
   const a=points[i],b=points[(i+1)%points.length];
   const lo=[a[0],bottom,a[1]],hi=[a[0],top,a[1]],nlo=[b[0],bottom,b[1]],nhi=[b[0],top,b[1]];
   face(lo,nlo,nhi);face(lo,nhi,hi);
  }
 }
 function box(cx,cy,cz,wx,wy,wz){
  const a=wx/2,b=wy/2,c=wz/2;
  prism([[cx-a,cz-c],[cx+a,cz-c],[cx+a,cz+c],[cx-a,cz+c]],cy-b,cy+b);
 }
 return {prism,box,finish:()=>new Float32Array(data)};
}
const HULLS={
 corvette:[[0,-1.05],[-.18,-.3],[-.78,.16],[-.78,.46],[-.21,.24],[-.12,.85],[0,.56],[.12,.85],[.21,.24],[.78,.46],[.78,.16],[.18,-.3]],
 frigate:[[0,-1.35],[-.3,-.58],[-.4,-.16],[-.94,.18],[-.74,.57],[-.34,.39],[-.28,.99],[.28,.99],[.34,.39],[.74,.57],[.94,.18],[.4,-.16],[.3,-.58]],
 cruiser:[[0,-1.55],[-.37,-.73],[-.77,-.33],[-1.16,.1],[-1.04,.61],[-.54,.43],[-.66,1.04],[0,.83],[.66,1.04],[.54,.43],[1.04,.61],[1.16,.1],[.77,-.33],[.37,-.73]]
};
export const HULL_COLORS=Object.freeze({friendly:'#85d9ec',hostile:'#ef9ca0',neutral:'#afbbc9',outpost:'#b6e6ed'});
export function hullOutline(type){return HULLS[type]||HULLS.corvette;}
export function buildShipMesh(type){
 const b=builder();b.prism(hullOutline(type),-.095,.14);
 const scale={corvette:.15,frigate:.23,cruiser:.34}[type]||.15;
 b.box(0,.22,-.27,scale,.18,.6);
 return b.finish();
}
const TAU=Math.PI*2;
export const STATION_ORBIT=1.65;
/** Central station position on its inner orbit between the star and the first planet. */
export function stationPosition(time=0){
 const a=.6+time*.05;
 return [Math.cos(a)*STATION_ORBIT,.25,Math.sin(a)*STATION_ORBIT];
}
export function stationScale(level){return [0,.24,.28,.32,.36][level]||0;}
export function platformPositions(center=[0,0,0],count=0,time=0){
 const n=Math.max(0,Math.floor(count||0)),base=time*.11;
 const [cx,cy,cz]=[center[0]||0,center[1]||0,center[2]||0];
 return Array.from({length:n},(_,i)=>{
  const a=base+i*TAU/n;
  return [cx+Math.cos(a)*.62,cy+Math.sin(a*1.7)*.04,cz+Math.sin(a)*.62];
 });
}
function outpostHull(b){
 b.prism([[0,-1.35],[-.2,-.35],[-1.2,-.18],[-.43,.2],[-.9,.95],[0,.52],[.9,.95],[.43,.2],[1.2,-.18],[.2,-.35]],-.18,.18);
 b.box(0,.15,0,.68,.46,.68);
 b.box(0,.39,0,.26,.22,.26);
}
function arm(b,angle,r0,r1,width,bottom,top){
 const c=Math.cos(angle),s=Math.sin(angle),w=width/2;
 const at=(r,o)=>[c*r-s*o,s*r+c*o];
 b.prism([at(r0,-w),at(r1,-w),at(r1,w),at(r0,w)],bottom,top);
}
export function buildOutpostMesh(){
 const b=builder();outpostHull(b);
 return b.finish();
}
/** The station grows in steps: tier 1 is the former outpost, each tier adds structure. */
export function buildStationMesh(level=1){
 const tier=Math.max(0,Math.min(4,Math.floor(level)||0)),b=builder();
 if(tier===0)return b.finish();
 outpostHull(b);
 if(tier>=2)for(let i=0;i<4;i++)arm(b,i*TAU/4+Math.PI/4,.26,.82,.22,-.06,.06);
 if(tier>=3)for(let i=0;i<12;i++){const a=i*TAU/12;b.box(Math.cos(a),.03,Math.sin(a),.16,.12,.16);}
 if(tier>=4){
  for(let i=0;i<16;i++){const a=i*TAU/16+.1;b.box(Math.cos(a)*1.3,.02,Math.sin(a)*1.3,.1,.09,.1);}
  for(let i=0;i<8;i++)arm(b,i*TAU/8+.06,.3,1.3,.06,-.02,.02);
 }
 return b.finish();
}
export function buildPlatformMesh(){
 const b=builder();
 b.box(0,0,0,.18,.1,.18);
 b.prism([[-.07,-.07],[.07,-.07],[.09,.08],[-.09,.08]],.05,.17);
 return b.finish();
}
export function shipLocalPosition(unit,planetaryBodies,time=0,formationIndex=0){
 const order=unit.localOrder||{kind:'hold'};
 const offset=(unit.id%11)*.42+formationIndex*.19;
 const spread=1.35+(unit.id%5)*.39;
 if(order.kind==='move'&&Array.isArray(order.position))return [order.position[0],.15,order.position[1]];
 if(['orbit','guard'].includes(order.kind)){
  const p=planetaryBodies?.planets?.find(p=>p.id===order.planetId);
  if(p){
   const phase=p.phase+time*.095/Math.pow(p.orbitRadius,1.05);
   const angle=phase+.15+offset*.17;
   return [Math.cos(angle)*(p.orbitRadius+1.05),.14,Math.sin(angle)*(p.orbitRadius+1.05)];
  }
 }
 if(order.kind==='dock'){const p=stationPosition(time);return [p[0]+offset*.07,.12,p[2]+offset*.05];}
 const radius=order.kind==='patrol'?4.3+spread:4.2+spread*.48;
 const angle=(unit.id*2.399963+formationIndex*.12)+(order.kind==='patrol'?time*.035:0);
 return [Math.cos(angle)*radius,.12+((unit.id%3)-1)*.16,Math.sin(angle)*radius];
}
export function shipsInsideRectangle(points,box){
 const left=Math.min(box.x1,box.x2),right=Math.max(box.x1,box.x2),top=Math.min(box.y1,box.y2),bottom=Math.max(box.y1,box.y2);
 return points.filter(p=>p.owner===0&&p.x>=left&&p.x<=right&&p.y>=top&&p.y<=bottom).map(p=>p.id);
}
export function nearestSelectableShip(points,x,y,radius=25){
 return points.filter(p=>p.owner===0&&Math.hypot(p.x-x,p.y-y)<=radius).sort((a,b)=>Math.hypot(a.x-x,a.y-y)-Math.hypot(b.x-x,b.y-y))[0]||null;
}
