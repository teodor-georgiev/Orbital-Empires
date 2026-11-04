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
export function buildOutpostMesh(){
 const b=builder();
 b.prism([[0,-1.35],[-.2,-.35],[-1.2,-.18],[-.43,.2],[-.9,.95],[0,.52],[.9,.95],[.43,.2],[1.2,-.18],[.2,-.35]],-.18,.18);
 b.box(0,.15,0,.68,.46,.68);
 b.box(0,.39,0,.26,.22,.26);
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
 if(order.kind==='dock')return [1.9+offset*.07,.12,1.1+offset*.05];
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
