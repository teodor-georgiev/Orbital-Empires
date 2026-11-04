/** Dependency-free WebGL solar system scene. Canvas 2D remains available on unsupported devices. */
import { planetPalette } from './modules/visuals/planet-visual.js';
import { buildShipMesh,buildOutpostMesh,hullOutline,shipLocalPosition,shipsInsideRectangle,nearestSelectableShip,HULL_COLORS } from './modules/visuals/ship-models.js';
const TAU = Math.PI * 2;
const clamp = (value, low, high) => Math.max(low, Math.min(high, value));

export function clampSolarCamera(camera) {
  return { yaw: camera.yaw, pitch: clamp(camera.pitch, 0.14, 1.35), distance: clamp(camera.distance, 8, 34) };
}

/** Column-major clip-space projection; null means the point is behind the camera. */
export function projectPoint(position, matrix, width, height) {
  const [x,y,z] = position;
  const w = matrix[3]*x + matrix[7]*y + matrix[11]*z + matrix[15];
  if (w <= 0 || !Number.isFinite(w)) return null;
  const px = (matrix[0]*x+matrix[4]*y+matrix[8]*z+matrix[12])/w;
  const py = (matrix[1]*x+matrix[5]*y+matrix[9]*z+matrix[13])/w;
  const pz = (matrix[2]*x+matrix[6]*y+matrix[10]*z+matrix[14])/w;
  return { x: (px*.5+.5)*width, y:(.5-py*.5)*height, depth:pz };
}

function perspective(fov, aspect, near, far) {
  const f = 1/Math.tan(fov/2);
  return new Float32Array([f/aspect,0,0,0, 0,f,0,0, 0,0,(far+near)/(near-far),-1, 0,0,2*far*near/(near-far),0]);
}
function lookAt(eye) {
  const normalize = v => {const l = Math.hypot(...v)||1;return v.map(x=>x/l)};
  const cross = (a,b) => [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  const forward = normalize(eye.map(x=>-x));
  const side = normalize(cross(forward,[0,1,0]));
  const up = cross(side,forward);
  return new Float32Array([
    side[0],up[0],-forward[0],0,
    side[1],up[1],-forward[1],0,
    side[2],up[2],-forward[2],0,
    -side.reduce((s,v,i)=>s+v*eye[i],0),-up.reduce((s,v,i)=>s+v*eye[i],0),forward.reduce((s,v,i)=>s+v*eye[i],0),1,
  ]);
}
function multiply(a,b) {
  const out = new Float32Array(16);
  for(let c=0;c<4;c++) for(let r=0;r<4;r++) for(let k=0;k<4;k++) out[c*4+r]+=a[k*4+r]*b[c*4+k];
  return out;
}
function rgb(hex) {
  const n = Number.parseInt((hex || '#ffffff').slice(1),16);
  return [(n>>16&255)/255,(n>>8&255)/255,(n&255)/255];
}
function sphereMesh(latitudes=23,longitudes=36) {
  const vertices=[],indices=[];
  for(let lat=0;lat<=latitudes;lat++){
    const theta=lat*Math.PI/latitudes;
    for(let lon=0;lon<=longitudes;lon++){
      const phi=lon*TAU/longitudes;
      const x=Math.sin(theta)*Math.cos(phi),y=Math.cos(theta),z=Math.sin(theta)*Math.sin(phi);
      vertices.push(x,y,z,x,y,z);
    }
  }
  for(let lat=0;lat<latitudes;lat++)for(let lon=0;lon<longitudes;lon++){
    const a=lat*(longitudes+1)+lon,b=a+longitudes+1;
    indices.push(a,b,a+1,b,b+1,a+1);
  }
  return {vertices:new Float32Array(vertices),indices:new Uint16Array(indices)};
}
const VERTEX = `
attribute vec3 a_position;
attribute vec3 a_normal;
uniform mat4 u_viewproj;
uniform vec3 u_offset;
uniform float u_radius;
varying vec3 v_normal;
void main() {
  v_normal = a_normal;
  gl_Position = u_viewproj * vec4(a_position*u_radius + u_offset, 1.0);
  gl_PointSize = 2.7;
}`;
const FRAGMENT = `
precision mediump float;
varying vec3 v_normal;
uniform vec3 u_color;
uniform vec3 u_light;
uniform vec3 u_surfaceA;
uniform vec3 u_surfaceB;
uniform vec3 u_surfaceC;
uniform float u_mode;
uniform float u_kind;
uniform float u_alpha;
uniform float u_time;
uniform float u_biome;
uniform float u_seed;
uniform float u_cloud;
uniform float u_ice;
uniform float u_lava;
uniform float u_bands;
uniform float u_craters;
uniform float u_atmosphere;
uniform float u_storms;
uniform float u_tint;
float rand3(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
float noise3(vec3 p){
 vec3 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);
 return mix(mix(mix(rand3(i),rand3(i+vec3(1,0,0)),f.x),mix(rand3(i+vec3(0,1,0)),rand3(i+vec3(1,1,0)),f.x),f.y),
 mix(mix(rand3(i+vec3(0,0,1)),rand3(i+vec3(1,0,1)),f.x),mix(rand3(i+vec3(0,1,1)),rand3(i+vec3(1,1,1)),f.x),f.y),f.z);
}
void main() {
 if(u_mode>2.5){float shade=.32+.68*max(0.0,dot(normalize(v_normal),normalize(u_light)));gl_FragColor=vec4(u_color*shade,1.0);return;}
 if(u_mode>1.5){gl_FragColor=vec4(u_color,u_alpha);return;}
 vec3 n=normalize(v_normal);
 if(u_mode>.5){
  float plasma=sin(n.y*13.0+sin(n.x*14.0+u_time*.55)*2.0);
  gl_FragColor=vec4(min(vec3(1),u_color*(1.12+plasma*.12)+vec3(.12,.08,.04)),1.0);return;
 }
 vec3 pn=n*5.3+vec3(u_seed*.008,u_seed*.003,u_seed*.006);
 float land=noise3(pn)+.24*(noise3(pn*2.8)-.5);
 float detail=noise3(n*30.0+u_seed*.024);
 vec3 color=u_surfaceA;
 if(u_biome>8.5){
  float wave=sin(n.y*(51.0+u_bands*18.0)+land*8.0+n.x*4.0+u_seed*.1);
  float band=smoothstep(-.5,.55,wave);
  color=mix(u_surfaceA,u_surfaceB,band);
  color=mix(color,u_surfaceC,clamp((detail-.63)*1.3,0.0,1.0));
  float storm=(1.0-smoothstep(.1,.38,length(n.xz-vec2(sin(u_seed)*.4,cos(u_seed)*.55))))*u_storms;
  color=mix(color,u_surfaceC,storm*.68);
 } else if(u_biome<.5){
  color=mix(u_surfaceA,u_surfaceB,smoothstep(.46,.61,land)); // Terran continents
 } else if(u_biome<1.5){
  color=mix(u_surfaceA,u_surfaceB,smoothstep(.67,.80,land)*.45); // Ocean
 } else if(u_biome<2.5){
  color=mix(u_surfaceA,u_surfaceB,smoothstep(.27,.50,land)); // Jungle
 } else if(u_biome<3.5){
  color=mix(u_surfaceA,u_surfaceB,smoothstep(.22,.80,land)); // Desert dunes
 } else if(u_biome<4.5){
  color=mix(u_surfaceA,u_surfaceB,smoothstep(.27,.68,land)); // Arctic ice
 } else if(u_biome<5.5){
  color=mix(u_surfaceA,u_surfaceB,smoothstep(.5,.82,land)*.42); // Volcanic crust
  float fissure=smoothstep(.89,.97,abs(sin(n.x*43.0+sin(n.y*35.0)*3.0+u_seed*.03)));
  color+=u_surfaceC*fissure*u_lava*.85;
 } else if(u_biome<6.5){
  color=mix(u_surfaceA,u_surfaceB,smoothstep(.3,.72,land));
  float crater=smoothstep(.82,.98,detail)*u_craters;
  color=mix(color,u_surfaceA*.48,crater);
 } else if(u_biome<7.5){
  color=mix(u_surfaceA,u_surfaceB,smoothstep(.3,.73,land));
  color+=u_surfaceC*max(0.0,sin(n.y*27.0+u_seed*.03))*.12;
 } else {
  float edge=abs(fract((n.x+n.y*.72+n.z)*14.0+u_seed*.01)-.5);
  color=mix(u_surfaceA,u_surfaceB,smoothstep(.23,.6,land));
  color=mix(color,u_surfaceC,smoothstep(.42,.5,edge)*.45);
 }
 if(u_ice>0.0){float pole=smoothstep(.45,.91,abs(n.y))*u_ice;color=mix(color,u_surfaceC,pole);}
 if(u_cloud>0.0&&u_biome<8.5){
  float vapor=smoothstep(.68,.88,noise3(n*18.0+vec3(u_seed*.02,u_seed*.01,u_seed*.04)));
  color=mix(color,vec3(.91,.95,.98),vapor*u_cloud*.72);
 }
 float lit=max(0.0,dot(n,normalize(u_light)));
 float rim=pow(1.0-abs(dot(n,normalize(u_light))),3.0);
 float haze=.17+lit*.83;
 color*=haze*u_tint;
 color+=u_atmosphere*rim*vec3(.09,.18,.23);
 if(u_lava>.2)color+=u_surfaceC*smoothstep(.77,.94,detail)*u_lava*(1.0-lit)*.37;
 color+=pow(lit,11.0)*vec3(.08,.1,.12);
 gl_FragColor=vec4(clamp(color,0.0,1.0),1.0);
}`;
function compile(gl,source,type){
  const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);
  if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)){const msg=gl.getShaderInfoLog(shader);gl.deleteShader(shader);throw Error(msg);}
  return shader;
}
function makeGL(gl) {
  const program=gl.createProgram();
  const vs=compile(gl,VERTEX,gl.VERTEX_SHADER),fs=compile(gl,FRAGMENT,gl.FRAGMENT_SHADER);
  gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);
  gl.deleteShader(vs);gl.deleteShader(fs);
  if(!gl.getProgramParameter(program,gl.LINK_STATUS)) throw Error(gl.getProgramInfoLog(program));
  gl.useProgram(program);
  const locations={};
  for(const attr of ['a_position','a_normal'])locations[attr]=gl.getAttribLocation(program,attr);
  for(const uni of ['u_viewproj','u_offset','u_radius','u_color','u_light','u_mode','u_kind','u_alpha','u_time','u_surfaceA','u_surfaceB','u_surfaceC','u_biome','u_seed','u_cloud','u_ice','u_lava','u_bands','u_craters','u_atmosphere','u_storms','u_tint'])locations[uni]=gl.getUniformLocation(program,uni);
  const mesh=sphereMesh();
  const vertex=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,vertex);gl.bufferData(gl.ARRAY_BUFFER,mesh.vertices,gl.STATIC_DRAW);
  const index=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,index);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,mesh.indices,gl.STATIC_DRAW);
  const orbit=gl.createBuffer(),stars=gl.createBuffer();
  gl.enable(gl.DEPTH_TEST);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
  return {program,locations,mesh,vertex,index,orbit,stars};
}

export function createSolarView(canvas,{onSelect=()=>{},onSelectSite=()=>{},onSelectShips=()=>{},onSelectOutpost=()=>{},onMoveShips=()=>{},quality=()=>({scale:2,maxPixels:2560*1440}),shouldAnimate=()=>true}={}) {
  let gl=null,gfx=null,ctx=null,fallbackCanvas=null;
  function use2DFallback(){
    gl=null;gfx=null;
    ctx=canvas.getContext('2d');
    // Browsers cannot switch a canvas from an existing WebGL context to 2D.
    // In that case paint the compatibility view on a sibling canvas instead.
    if(!ctx){
      if(!fallbackCanvas){
        fallbackCanvas=document.createElement('canvas');
        fallbackCanvas.className='solar-fallback-canvas';
        fallbackCanvas.setAttribute('aria-hidden','true');
        canvas.after(fallbackCanvas);
      }
      ctx=fallbackCanvas.getContext('2d');
    }
  }
  try {gl=canvas.getContext('webgl',{alpha:true,antialias:true,preserveDrawingBuffer:false});if(gl)gfx=makeGL(gl);}catch{use2DFallback();}
  if(!gl&&!ctx)use2DFallback();
  let system=null,bodies=null,active=false,selected=0,raf=0;
  let tacticalUnits=[],tacticalOutpost=null,moveTargetMode=false,selectedShipIds=new Set(),lastShipPoints=[],lastOutpostPoint=null;
  const geometry=new Map();
  const box=document.createElement('div');box.className='oe-ship-selection-rectangle';box.hidden=true;canvas.after(box);
  function shipBuffer(type){
   if(!geometry.has(type)){
    const mesh=type==='outpost'?buildOutpostMesh():buildShipMesh(type);
    const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,mesh,gl.STATIC_DRAW);
    geometry.set(type,{buffer,count:mesh.length/6});
   }
   return geometry.get(type);
  }
  let camera={yaw:.46,pitch:.53,distance:22};
  let width=1,height=1,dpr=1,lastPoints=[],lastSitePoints=[],pointer=null,clockBase=0;
  const at=(p,t)=>{
    const angle=p.phase + t*.095/Math.pow(p.orbitRadius,1.05);
    return [Math.cos(angle)*p.orbitRadius,Math.sin(angle)*p.inclination*p.orbitRadius,Math.sin(angle)*p.orbitRadius];
  };
  const frameTime=()=> shouldAnimate() ? (performance.now()-clockBase)/1000 : 0;
  function cameraMatrix(){
    const c=camera,d=c.distance;
    const eye=[Math.sin(c.yaw)*Math.cos(c.pitch)*d,Math.sin(c.pitch)*d,Math.cos(c.yaw)*Math.cos(c.pitch)*d];
    return multiply(perspective(Math.PI/3,Math.max(.3,width/height),.08,190),lookAt(eye));
  }
  function resize(){
    const rect=canvas.getBoundingClientRect();
    if(!rect.width||!rect.height)return;
    width=rect.width;height=rect.height;const preset=quality();dpr=Math.min(preset.scale,Math.sqrt(preset.maxPixels/(width*height)));
    const w=Math.max(1,Math.round(width*dpr)),h=Math.max(1,Math.round(height*dpr));
    if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
    if(fallbackCanvas){fallbackCanvas.width=w;fallbackCanvas.height=h;}
    if(gl)gl.viewport(0,0,canvas.width,canvas.height);
  }
  function assignUniforms(matrix,time){
    const {locations:L}=gfx;gl.useProgram(gfx.program);
    gl.uniformMatrix4fv(L.u_viewproj,false,matrix);
    gl.uniform1f(L.u_time,time);
  }
  function bindPositions(buffer){
    const {locations:L}=gfx;
    gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
    gl.enableVertexAttribArray(L.a_position);gl.vertexAttribPointer(L.a_position,3,gl.FLOAT,false,24,0);
    gl.enableVertexAttribArray(L.a_normal);gl.vertexAttribPointer(L.a_normal,3,gl.FLOAT,false,24,12);
  }
  function material(position,radius,color,mode,kind=0,alpha=1,visual=null){
    const L=gfx.locations,c=rgb(color),palette=visual?.palette||planetPalette('Barren');
    gl.uniform3fv(L.u_offset,position);gl.uniform1f(L.u_radius,radius);gl.uniform3fv(L.u_color,c);
    gl.uniform3fv(L.u_light,position.some(x=>Math.abs(x)>0.01)?position.map(x=>-x):[.8,.7,1.0]);
    gl.uniform1f(L.u_mode,mode);gl.uniform1f(L.u_kind,kind);gl.uniform1f(L.u_alpha,alpha);
    gl.uniform3fv(L.u_surfaceA,rgb(palette[0]));gl.uniform3fv(L.u_surfaceB,rgb(palette[1]));gl.uniform3fv(L.u_surfaceC,rgb(palette[2]));
    gl.uniform1f(L.u_biome,visual?.biome??6);gl.uniform1f(L.u_seed,visual?.seed??0);
    for(const name of ['cloud','ice','lava','bands','craters','atmosphere','storms','tint'])gl.uniform1f(L['u_'+name],visual?.[name]??(name==='tint'?1:0));
  }
  function ball(position,radius,color,mode=0,kind=0,visual=null){
    bindPositions(gfx.vertex);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,gfx.index);
    material(position,radius,color,mode,kind,1,visual);
    gl.drawElements(gl.TRIANGLES,gfx.mesh.indices.length,gl.UNSIGNED_SHORT,0);
  }
  function renderTactical3D(matrix,time){
    lastShipPoints=[];lastOutpostPoint=null;
    if(tacticalOutpost?.level>0){
      const atStation=[1.9,.25,1.1],mesh=shipBuffer('outpost');
      bindPositions(mesh.buffer);material(atStation,.58,HULL_COLORS.outpost,3);
      gl.drawArrays(gl.TRIANGLES,0,mesh.count);
      const screen=projectPoint(atStation,matrix,width,height);
      if(screen)lastOutpostPoint={...screen,r:28};
    }
    for(const [index,unit] of tacticalUnits.slice(0,320).entries()){
      const pos=shipLocalPosition(unit,bodies,time,index);
      const mesh=shipBuffer(unit.type),scale=unit.type==='cruiser'?.61:unit.type==='frigate'?.51:.44;
      bindPositions(mesh.buffer);material(pos,scale,unit.owner===0?HULL_COLORS.friendly:HULL_COLORS.hostile,3);
      gl.drawArrays(gl.TRIANGLES,0,mesh.count);
      if(selectedShipIds.has(unit.id))lineRing(.55,0,'#8ff9e9',.95,pos);
      const screen=projectPoint(pos,matrix,width,height);
      if(screen)lastShipPoints.push({id:unit.id,owner:unit.owner,x:screen.x,y:screen.y,r:25,depth:screen.depth});
    }
  }
  function fallbackHull(unit,x,y,r){
    const points=hullOutline(unit.type);
    ctx.save();ctx.translate(x,y);ctx.rotate(.4);ctx.beginPath();
    points.forEach(([px,py],i)=>{if(i===0)ctx.moveTo(px*r,py*r);else ctx.lineTo(px*r,py*r);});ctx.closePath();
    ctx.fillStyle=unit.owner===0?'#4f94ad':'#bf6d77';ctx.strokeStyle=unit.owner===0?'#d4f8ff':'#ffb7b7';
    ctx.lineWidth=1.4;ctx.fill();ctx.stroke();
    ctx.fillStyle='#94f9ff';ctx.fillRect(-2,r*.65,4,r*.35);
    if(selectedShipIds.has(unit.id)){ctx.strokeStyle='#a8ffef';ctx.lineWidth=2.4;ctx.beginPath();ctx.arc(0,0,r*1.6,0,TAU);ctx.stroke();}
    ctx.restore();
  }
  function renderTactical2D(cx,cy,scale,time){
    lastShipPoints=[];lastOutpostPoint=null;
    if(tacticalOutpost?.level>0){
      const x=cx+1.9*scale,y=cy+1.1*scale*.48;
      ctx.save();ctx.translate(x,y);ctx.fillStyle='#5da5b2';ctx.strokeStyle='#d2f8ff';ctx.lineWidth=2;
      ctx.beginPath();for(let n=0;n<8;n++){const a=n*TAU/8;const r=n%2===0?20:8;if(n===0)ctx.moveTo(Math.cos(a)*r,Math.sin(a)*r);else ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r);}ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();
      lastOutpostPoint={x,y,r:24};
    }
    for(const [index,unit] of tacticalUnits.slice(0,320).entries()){
      const pos=shipLocalPosition(unit,bodies,time,index),x=cx+pos[0]*scale,y=cy+pos[2]*scale*.48;
      fallbackHull(unit,x,y,unit.type==='cruiser'?14:unit.type==='frigate'?12:10);
      lastShipPoints.push({id:unit.id,owner:unit.owner,x,y,r:25,depth:0});
    }
  }
  function updateSelectionBox(startX,startY,endX,endY){
    const left=Math.min(startX,endX),top=Math.min(startY,endY);
    Object.assign(box.style,{left:left+'px',top:top+'px',width:Math.abs(startX-endX)+'px',height:Math.abs(startY-endY)+'px'});
    box.hidden=false;
  }
  function emitSelection(ids,add=false){
    const next=add?new Set(selectedShipIds):new Set();
    for(const id of ids){if(add&&next.has(id))next.delete(id);else next.add(id);}
    selectedShipIds=next;onSelectShips([...next]);
  }
  function lineRing(radius,angle,color,opacity=.29,center=[0,0,0]){
    const coordinates=[];
    for(let i=0;i<129;i++){
      const a=TAU*i/128;
      coordinates.push(Math.cos(a),Math.sin(a)*angle,Math.sin(a),0,1,0);
    }
    bindPositions(gfx.orbit);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(coordinates),gl.DYNAMIC_DRAW);
    gl.depthMask(false);
    material(center,radius,color,2,0,opacity);
    gl.drawArrays(gl.LINE_STRIP,0,129);
    gl.depthMask(true);
  }
  function drawStars(){
    const stars=bodies.backgroundStars||[];
    if(!stars.length)return;
    const vertices=new Float32Array(stars.length*6);
    stars.forEach((s,i)=>{const n=i*6;vertices[n]=s.x;vertices[n+1]=s.y;vertices[n+2]=s.z;vertices[n+4]=1;});
    bindPositions(gfx.stars);
    gl.bufferData(gl.ARRAY_BUFFER,vertices,gl.DYNAMIC_DRAW);
    gl.disable(gl.DEPTH_TEST);
    material([0,0,0],1,'#bedcf1',2,0,.74);
    gl.drawArrays(gl.POINTS,0,stars.length);
    gl.enable(gl.DEPTH_TEST);
  }
  function sitePosition(site,time){
    if(site.kind==='blackHole')return [0,0,0];
    return at(site,site.kind==='comet'?time*2.1:time);
  }
  function drawSpaceObjects(matrix,time){
    lastSitePoints=[];
    if(!bodies.sites?.length)return;
    const belt=bodies.sites.find(s=>s.kind==='asteroid');
    if(belt){
      // Bounded, deterministic belt geometry; same spatial field in 2D and 3D.
      for(let i=0;i<28;i++){
        const angle=i*2.399963+(.06*Math.sin(i*7)),radius=belt.orbitRadius+Math.sin(i*18)*.17;
        ball([Math.cos(angle)*radius,Math.sin(i*9)*.08,Math.sin(angle)*radius],.035+(i%3)*.013,i%3===0?'#d9bea0':'#8fa5b8',0);
      }
    }
    for(const site of bodies.sites){
      const pos=sitePosition(site,time);
      const color=site.kind==='comet'?'#bdeefa':site.kind==='anomaly'?'#b39ae9':site.kind==='blackHole'?'#bd8eee':site.kind==='leviathan'?'#e28eac':'#c4a78e';
      if(site.kind==='comet'){ball(pos,.115,color,1);for(let i=1;i<=3;i++)ball([pos[0]-.22*i,pos[1]+.02*i,pos[2]+.16*i],.065/(i*.8),color,1);}
      if(site.kind==='anomaly'){ball(pos,.17,color,1);ball([pos[0]+.17,pos[1]+.1,pos[2]],.045,'#f2dfef',1);}
      if(site.kind==='leviathan'){ball(pos,.22,color);ball([pos[0]-.20,pos[1]-.05,pos[2]-.08],.09,'#f2bac3');ball([pos[0]+.22,pos[1]-.07,pos[2]-.08],.08,'#9a608c');}
      if(site.kind==='blackHole'){lineRing(.9,0,color,.7);lineRing(1.1,.16,'#7a68b2',.45);}
      const screen=projectPoint(pos,matrix,width,height);
      if(screen)lastSitePoints.push({id:site.id,x:screen.x,y:screen.y,r:site.kind==='blackHole'?24:21,depth:screen.depth});
    }
  }
  function drawGL(matrix,time){
    gl.viewport(0,0,canvas.width,canvas.height);
    gl.clearColor(.012,.023,.045,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    assignUniforms(matrix,time);
    drawStars();
    for(const p of bodies.planets){lineRing(p.orbitRadius,p.inclination,p.id===selected?'#8adfeb':'#6e90ab',p.id===selected?.55:.20);}
    lineRing(bodies.belt.orbitRadius,0,'#a68b78',.24);
    gl.clear(gl.DEPTH_BUFFER_BIT);
    if(bodies.star.kind==='black-hole'){
      lineRing(1.08,.22,'#8f78cc',.67);lineRing(1.34,-.12,'#b2777d',.38);
      ball([0,0,0],bodies.star.radius,'#050511',2);
    }else ball([0,0,0],bodies.star.radius,bodies.star.color,1);
    const points=[];
    for(const p of bodies.planets){
      const pos=at(p,time);ball(pos,p.radius*1.3,p.color,0,p.biome==='Gas Giant'?2:0,p.visual);
      if(p.visual?.rings){lineRing(p.radius*1.75,.02,p.visual.palette[1],.72,pos);lineRing(p.radius*2.05,.02,p.visual.palette[2],.48,pos);}
      const screen=projectPoint(pos,matrix,width,height);
      const sizePoint=projectPoint([pos[0]+p.radius*1.3,pos[1],pos[2]],matrix,width,height);
      if(screen)points.push({id:p.id,x:screen.x,y:screen.y,r:Math.max(23,Math.abs((sizePoint?.x||screen.x+12)-screen.x)+14),depth:screen.depth});
      for(const moon of p.moons){
        const angle=moon.phase+time*.4;
        const satellite=[pos[0]+Math.cos(angle)*moon.orbitRadius,pos[1]+Math.sin(angle)*.10,pos[2]+Math.sin(angle)*moon.orbitRadius];
        ball(satellite,moon.radius,'#c4d3d8',0);
      }
    }
    lastPoints=points;
    drawSpaceObjects(matrix,time);
    renderTactical3D(matrix,time);
  }
  function fallbackSphere(x,y,r,color,star=false){
    const g=ctx.createRadialGradient(x-r*.32,y-r*.34,1,x,y,r);
    g.addColorStop(0,star?'#fff6d6':color);g.addColorStop(.48,color);g.addColorStop(1,'#101725');
    ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.fillStyle=g;ctx.fill();
  }
  function fallbackPlanet(x,y,r,planet){
    const v=planet.visual,pal=v?.palette||planetPalette(planet.biome);
    ctx.save();ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.clip();
    fallbackSphere(x,y,r,pal[0]);
    if(planet.biome==='Gas Giant'){
      for(let i=-6;i<=6;i++){const offset=i*r/6;ctx.beginPath();ctx.moveTo(x-r,y+offset);ctx.bezierCurveTo(x-r/3,y+offset+r*.12,x+r/3,y+offset-r*.13,x+r,y+offset);ctx.lineWidth=Math.max(1,r*.17);ctx.strokeStyle=i%3?pal[1]:pal[2];ctx.globalAlpha=.3+.4*(v?.bands||0);ctx.stroke();}
    }else{
      for(let i=0;i<9;i++){
       const angle=(v?.seed||1)*.053+i*2.399,dx=Math.cos(angle)*r*.66,dy=Math.sin(angle*1.37)*r*.62;
       ctx.beginPath();ctx.ellipse(x+dx,y+dy,Math.max(1,r*(.13+(i%3)*.04)),Math.max(1,r*.1),angle,0,TAU);
       ctx.fillStyle=planet.biome==='Volcanic'&&i%3===0?pal[2]:pal[i%3===0?2:1];
       ctx.globalAlpha=planet.biome==='Oceanic'?.3:.38;
       ctx.fill();
      }
      if((v?.cloud||0)>.12){ctx.globalAlpha=v.cloud*.32;ctx.lineWidth=Math.max(1,r*.12);ctx.strokeStyle='#f8fbff';for(let i=0;i<3;i++){ctx.beginPath();ctx.arc(x-r*.2,y+(i-1)*r*.3,r*.75,.3+i*.3,2.3+i*.3);ctx.stroke();}}
    }
    ctx.restore();ctx.globalAlpha=1;
    if(v?.rings){ctx.beginPath();ctx.ellipse(x,y,r*1.94,r*.5,-.1,0,TAU);ctx.strokeStyle=pal[2];ctx.globalAlpha=.65;ctx.lineWidth=Math.max(2,r*.18);ctx.stroke();ctx.globalAlpha=1;}
  }
  function draw2D(time){
    ctx.setTransform(dpr,0,0,dpr,0,0);
    ctx.fillStyle='#031020';ctx.fillRect(0,0,width,height);
    for(const star of bodies.backgroundStars||[]){
      const x=((star.x/230+.5+camera.yaw/TAU)%1+1)%1*width;
      const y=((.5-star.y/260+camera.pitch*.05)%1+1)%1*height;
      ctx.globalAlpha=star.brightness*.85;ctx.fillStyle=star.blue?'#b7d6ff':'#e2f4fa';
      ctx.fillRect(x,y,star.brightness>0.85?1.7:1,star.brightness>0.85?1.7:1);
    }
    ctx.globalAlpha=1;
    const cx=width/2,cy=height/2,scale=Math.min(width/29,height/20)*22/camera.distance;
    ctx.strokeStyle='rgba(120,177,197,.19)';ctx.lineWidth=1;
    for(const p of bodies.planets){ctx.beginPath();ctx.ellipse(cx,cy,p.orbitRadius*scale,p.orbitRadius*scale*.48,0,0,TAU);ctx.stroke();}
    if(bodies.star.kind==='black-hole'){
      ctx.strokeStyle='#ad84d9';ctx.lineWidth=5;ctx.beginPath();ctx.ellipse(cx,cy,Math.max(17,1.1*scale),Math.max(8,.42*scale),-.22,0,TAU);ctx.stroke();
      ctx.fillStyle='#03030b';ctx.beginPath();ctx.arc(cx,cy,Math.max(12,bodies.star.radius*scale),0,TAU);ctx.fill();
    }else fallbackSphere(cx,cy,Math.max(18,bodies.star.radius*scale),bodies.star.color,true);
    lastPoints=[];
    for(const p of bodies.planets){
      const phase=p.phase+time*.095/Math.pow(p.orbitRadius,1.05),x=cx+Math.cos(phase)*p.orbitRadius*scale,y=cy+Math.sin(phase)*p.orbitRadius*scale*.48;
      const radius=Math.max(5,p.radius*scale);fallbackPlanet(x,y,radius,p);
      lastPoints.push({id:p.id,x,y,r:Math.max(23,radius+12),depth:0});
    }
    lastSitePoints=[];
    for(const site of bodies.sites||[]){
      if(site.kind==='asteroid'){
        for(let i=0;i<78;i++){
          const angle=i*2.399963,r=site.orbitRadius*scale+Math.sin(i*19)*3;
          ctx.fillStyle=i%3===0?'#cbb197':'#6f899c';
          ctx.fillRect(cx+Math.cos(angle)*r,cy+Math.sin(angle)*r*.48,1.3+i%3*.5,1.3+i%3*.5);
        }
      }
      const phase=site.phase+time*.095/Math.pow(site.orbitRadius,1.05);
      const x=site.kind==='blackHole'?cx:cx+Math.cos(phase)*site.orbitRadius*scale;
      const y=site.kind==='blackHole'?cy:cy+Math.sin(phase)*site.orbitRadius*scale*.48;
      if(site.kind!=='asteroid'&&site.kind!=='blackHole'){
        const colors={comet:'#bdebf5',anomaly:'#ba9cf4',leviathan:'#ef98a9'};
        const color=colors[site.kind]||'#d9c3a1';
        ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,site.kind==='leviathan'?7:5,0,TAU);ctx.fill();
        if(site.kind==='comet'){ctx.strokeStyle='#7bbdde';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-24,y+12);ctx.stroke();}
      }
      lastSitePoints.push({id:site.id,x,y,r:site.kind==='blackHole'?22:18,depth:0});
    }
    renderTactical2D(cx,cy,scale,time);
  }
  function tick(){
    if(!active)return;
    resize();
    if(width>0&&height>0){const time=frameTime();if(gl)drawGL(cameraMatrix(),time);else if(ctx)draw2D(time);}
    raf=requestAnimationFrame(tick);
  }
  function open(nextSystem,nextBodies){
    system=nextSystem;bodies=nextBodies;selected=0;lastSitePoints=[];lastShipPoints=[];selectedShipIds.clear();camera={yaw:.46,pitch:.53,distance:22};
    clockBase=performance.now();active=true;resize();if(!raf)raf=requestAnimationFrame(tick);
  }
  function close(){active=false;system=null;bodies=null;lastPoints=[];lastSitePoints=[];lastShipPoints=[];box.hidden=true;selectedShipIds.clear();moveTargetMode=false;canvas.classList.remove('oe-target-mode');if(raf)cancelAnimationFrame(raf);raf=0;}
  function pickPlanet(x,y){
    if(!active)return;
    if(moveTargetMode){moveTargetMode=false;canvas.classList.remove('oe-target-mode');onMoveShips([Math.max(-7,Math.min(7,x/width*14-7)),Math.max(-7,Math.min(7,y/height*14-7))]);return;}
    const ship=nearestSelectableShip(lastShipPoints,x,y);
    if(ship){emitSelection([ship.id],pointer?.shift);return;}
    if(lastOutpostPoint&&Math.hypot(lastOutpostPoint.x-x,lastOutpostPoint.y-y)<lastOutpostPoint.r){onSelectOutpost();return;}
    const candidates=[
      ...lastPoints.filter(p=>Math.hypot(x-p.x,y-p.y)<p.r).map(p=>({...p,kind:'planet'})),
      ...lastSitePoints.filter(p=>Math.hypot(x-p.x,y-p.y)<p.r).map(p=>({...p,kind:'site'}))
    ].sort((a,b)=>Math.hypot(x-a.x,y-a.y)-Math.hypot(x-b.x,y-b.y));
    if(candidates.length){
      const target=candidates[0];if(target.kind==='site')onSelectSite(target.id);
      else{selected=target.id;onSelect(selected);}
    }
  }
  canvas.addEventListener('pointerdown',event=>{
    if(!active||event.button===2)return;
    pointer={id:event.pointerId,x:event.clientX,y:event.clientY,lastX:event.clientX,lastY:event.clientY,moved:false,shift:event.shiftKey,
      mode:event.pointerType==='touch'||event.altKey||event.button===1?'camera':'select'};
    canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener('pointermove',event=>{
    if(!pointer||event.pointerId!==pointer.id)return;
    const dx=event.clientX-pointer.lastX,dy=event.clientY-pointer.lastY;
    if(Math.hypot(event.clientX-pointer.x,event.clientY-pointer.y)>5)pointer.moved=true;
    if(pointer.moved){if(pointer.mode==='camera')camera=clampSolarCamera({...camera,yaw:camera.yaw-dx*.007,pitch:camera.pitch+dy*.006});else{const rect=canvas.getBoundingClientRect();updateSelectionBox(pointer.x-rect.left,pointer.y-rect.top,event.clientX-rect.left,event.clientY-rect.top);}}
    pointer.lastX=event.clientX;pointer.lastY=event.clientY;
  });
  canvas.addEventListener('pointerup',event=>{
    if(!pointer||event.pointerId!==pointer.id)return;
    const r=canvas.getBoundingClientRect();
    if(pointer.mode==='select'&&pointer.moved){emitSelection(shipsInsideRectangle(lastShipPoints,{x1:pointer.x-r.left,y1:pointer.y-r.top,x2:event.clientX-r.left,y2:event.clientY-r.top}),pointer.shift);}
    else if(!pointer.moved){pickPlanet(event.clientX-r.left,event.clientY-r.top);}
    box.hidden=true;pointer=null;
  });
  canvas.addEventListener('pointercancel',()=>{pointer=null;box.hidden=true;});
  canvas.addEventListener('contextmenu',event=>{if(!active)return;event.preventDefault();if(!selectedShipIds.size)return;const r=canvas.getBoundingClientRect();const x=(event.clientX-r.left)/r.width*14-7,y=(event.clientY-r.top)/r.height*14-7;onMoveShips([Math.max(-7,Math.min(7,x)),Math.max(-7,Math.min(7,y))]);});
  canvas.addEventListener('wheel',event=>{if(!active)return;event.preventDefault();camera=clampSolarCamera({...camera,distance:camera.distance*(event.deltaY<0?.9:1.1)});},{passive:false});
  window.addEventListener('resize',resize);
  canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();use2DFallback();resize();});
  return {open,close,resize,selectPlanet(id){selected=id;},setTacticalState(units,outpost){tacticalUnits=units||[];tacticalOutpost=outpost||null;selectedShipIds=new Set([...selectedShipIds].filter(id=>tacticalUnits.some(u=>u.id===id)));},setSelectedShips(ids){selectedShipIds=new Set(ids||[]);},setMoveMode(value){moveTargetMode=Boolean(value);canvas.classList.toggle('oe-target-mode',moveTargetMode);},getVisibleShips(){return lastShipPoints.map(x=>({...x}));},resetCamera(){camera={yaw:.46,pitch:.53,distance:22};},is3D(){return Boolean(gl&&gfx);},isActive(){return active;}};
}
