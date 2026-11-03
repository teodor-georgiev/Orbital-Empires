/* Deterministic planet catalog and dependency-free 2.5D orbital renderer. */
import { hashSeed } from '../../core.js';
const BIOMES=['Terran','Oceanic','Desert','Jungle','Arctic','Barren','Volcanic','Gas Giant'];
const ROMAN=['I','II','III','IV','V','VI','VII','VIII'];
const COLORS={Terran:['#c2eed1','#348b8f','#163c53'],Oceanic:['#9ef3ef','#2585be','#102f60'],
 Desert:['#f8d2a2','#ba8659','#4e3b37'],Jungle:['#c3f3a4','#3a9661','#164657'],
 Arctic:['#f1f9ff','#92c6dd','#467ba8'],Barren:['#c7c3c1','#777d8b','#343c51'],
 Volcanic:['#ffd2a0','#b24b41','#311c33'],'Gas Giant':['#e3cee9','#9786ba','#3d375d']};
export function planetsForSystem(system){
 if(!system||!Number.isInteger(system.id))return [];
 let seed=hashSeed(`${system.id}:${system.name}:orbital-planets-v1`);
 const random=()=>{seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return(seed>>>0)/4294967296;};
 const count=3+Math.floor(random()*5),primaryIndex=1+Math.floor(random()*Math.min(count-1,3));
 return Array.from({length:count},(_,i)=>{
  const primary=i===primaryIndex,biome=primary?system.biome:BIOMES[Math.floor(random()*BIOMES.length)];
  return {id:i,name:`${system.name} ${ROMAN[i]}`,biome,primary,
   habitability:primary?system.habitability:['Terran','Oceanic','Jungle'].includes(biome)?3:['Desert','Arctic'].includes(biome)?2:0,
   richness:primary?system.richness:1+Math.floor(random()*4),
   size:biome==='Gas Giant'?1.3+random()*.65:.55+random()*.67,
   moons:Math.floor(random()*(biome==='Gas Giant'?7:3)),ringed:biome==='Gas Giant'&&random()>.37,
   phase:random()*Math.PI*2,period:5+i*3+Math.floor(random()*8)};
 });
}
function sphere(ctx,x,y,r,biome,ringed,selected){
 const [light,middle,dark]=COLORS[biome]||COLORS.Barren;
 if(ringed){ctx.save();ctx.translate(x,y);ctx.rotate(-.22);ctx.strokeStyle='#b9b1d17a';ctx.lineWidth=Math.max(2,r*.29);ctx.beginPath();ctx.ellipse(0,0,r*1.75,r*.48,0,0,Math.PI*2);ctx.stroke();ctx.restore();}
 const g=ctx.createRadialGradient(x-r*.4,y-r*.45,Math.max(.1,r*.04),x+r*.23,y+r*.25,r*1.45);
 g.addColorStop(0,light);g.addColorStop(.4,middle);g.addColorStop(1,dark);
 ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=g;ctx.fill();
 if(biome==='Gas Giant'){ctx.save();ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.clip();ctx.strokeStyle='#ffffff30';ctx.lineWidth=Math.max(1,r*.13);for(let i=-2;i<=2;i++){ctx.beginPath();ctx.moveTo(x-r,y+i*r*.34);ctx.bezierCurveTo(x-r*.2,y+(i-.5)*r*.28,x+r*.3,y+(i+.4)*r*.3,x+r,y+i*r*.34);ctx.stroke()}ctx.restore();}
 if(selected){ctx.strokeStyle='#a5f6f3';ctx.lineWidth=1.6;ctx.beginPath();ctx.arc(x,y,r+5,0,Math.PI*2);ctx.stroke();}
}
export function drawSolarSystem(ctx,system,width,height,time,selectedIndex=0,animate=true){
 const planets=planetsForSystem(system),cx=width*.49,cy=height*.52,limit=Math.min(width*.42,height*.83);
 const nebula=ctx.createRadialGradient(cx,cy,8,cx,cy,limit*1.25);
 nebula.addColorStop(0,'#204455');nebula.addColorStop(.5,'#0d2236');nebula.addColorStop(1,'#060e1b');
 ctx.fillStyle=nebula;ctx.fillRect(0,0,width,height);
 ctx.save();ctx.strokeStyle='#80b8d52c';ctx.lineWidth=1;
 const points=[];
 for(const p of planets){const orbit=limit*(.19+.78*(p.id+1)/(planets.length+1));ctx.beginPath();ctx.ellipse(cx,cy,orbit,orbit*.42,-.09,0,Math.PI*2);ctx.stroke();
  const angle=p.phase+(animate?time*.11/p.period:0);
  points.push({...p,x:cx+Math.cos(angle)*orbit,y:cy+Math.sin(angle)*orbit*.42,r:Math.max(5,Math.min(20,8*p.size+Math.min(width,height)*.005))});}
 const glow=ctx.createRadialGradient(cx,cy,0,cx,cy,65);glow.addColorStop(0,'#fff9d2');glow.addColorStop(.19,system.color||'#ffc98f');glow.addColorStop(.3,'#c88c4d66');glow.addColorStop(1,'#ff9e5000');ctx.fillStyle=glow;ctx.beginPath();ctx.arc(cx,cy,65,0,Math.PI*2);ctx.fill();
 ctx.beginPath();ctx.arc(cx,cy,15,0,Math.PI*2);ctx.fillStyle=system.color||'#fff1c4';ctx.fill();
 for(const p of points.slice().sort((a,b)=>a.y-b.y)){sphere(ctx,p.x,p.y,p.r,p.biome,p.ringed,p.id===selectedIndex);
  ctx.fillStyle=p.id===selectedIndex?'#d7fffb':'#a4bac9';ctx.font=(p.id===selectedIndex?'700 ':'500 ')+'11px Rajdhani, sans-serif';ctx.textAlign='center';ctx.fillText(p.name,p.x,p.y+p.r+15);}
 ctx.restore();return points;
}
