/** Dependency-free WebGL solar system scene. Canvas 2D remains available on unsupported devices. */
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
  gl_PointSize = 1.7;
}`;
const FRAGMENT = `
precision mediump float;
varying vec3 v_normal;
uniform vec3 u_color;
uniform vec3 u_light;
uniform float u_mode;
uniform float u_kind;
uniform float u_alpha;
uniform float u_time;
void main() {
  if(u_mode > 1.5){gl_FragColor = vec4(u_color,u_alpha);return;}
  vec3 n = normalize(v_normal);
  if(u_mode > .5) {
    float plasma = sin(n.y*13.0 + sin(n.x*14.0 + u_time*.55)*2.0);
    gl_FragColor = vec4(min(vec3(1.0),u_color * (1.12 + plasma*.12) + vec3(.12,.08,.04)),1.0);
    return;
  }
  float lit = max(0.0,dot(n,normalize(u_light)));
  float haze = .19 + lit*.81;
  float terrain = sin(n.x*21.0 + sin(n.y*13.0+n.z*11.0)*1.7)*sin(n.z*26.0);
  float band = sin(n.y*49.0 + sin(n.x*6.0)*1.3);
  float colorMod = u_kind > 1.5 ? 1.0 + band*.18 : 1.0 + terrain*.17;
  vec3 color = u_color * haze * colorMod;
  color += pow(lit,8.0)*vec3(.10,.13,.18);
  gl_FragColor = vec4(color,1.0);
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
  for(const uni of ['u_viewproj','u_offset','u_radius','u_color','u_light','u_mode','u_kind','u_alpha','u_time'])locations[uni]=gl.getUniformLocation(program,uni);
  const mesh=sphereMesh();
  const vertex=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,vertex);gl.bufferData(gl.ARRAY_BUFFER,mesh.vertices,gl.STATIC_DRAW);
  const index=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,index);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,mesh.indices,gl.STATIC_DRAW);
  const orbit=gl.createBuffer();
  gl.enable(gl.DEPTH_TEST);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
  return {program,locations,mesh,vertex,index,orbit};
}

export function createSolarView(canvas,{onSelect=()=>{},quality=()=>({scale:2,maxPixels:2560*1440}),shouldAnimate=()=>true}={}) {
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
  let camera={yaw:.46,pitch:.53,distance:22};
  let width=1,height=1,dpr=1,lastPoints=[],pointer=null,clockBase=0;
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
  function material(position,radius,color,mode,kind=0,alpha=1){
    const L=gfx.locations,c=rgb(color);
    gl.uniform3fv(L.u_offset,position);gl.uniform1f(L.u_radius,radius);gl.uniform3fv(L.u_color,c);
    gl.uniform3fv(L.u_light,position.some(x=>Math.abs(x)>0.01)?position.map(x=>-x):[.8,.7,1.0]);
    gl.uniform1f(L.u_mode,mode);gl.uniform1f(L.u_kind,kind);gl.uniform1f(L.u_alpha,alpha);
  }
  function ball(position,radius,color,mode=0,kind=0){
    bindPositions(gfx.vertex);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,gfx.index);
    material(position,radius,color,mode,kind);
    gl.drawElements(gl.TRIANGLES,gfx.mesh.indices.length,gl.UNSIGNED_SHORT,0);
  }
  function lineRing(radius,angle,color,opacity=.29){
    const coordinates=[];
    for(let i=0;i<129;i++){
      const a=TAU*i/128;
      coordinates.push(Math.cos(a),Math.sin(a)*angle,Math.sin(a),0,1,0);
    }
    bindPositions(gfx.orbit);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(coordinates),gl.DYNAMIC_DRAW);
    gl.depthMask(false);
    material([0,0,0],radius,color,2,0,opacity);
    gl.drawArrays(gl.LINE_STRIP,0,129);
    gl.depthMask(true);
  }
  function drawGL(matrix,time){
    gl.viewport(0,0,canvas.width,canvas.height);
    gl.clearColor(.014,.026,.049,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    assignUniforms(matrix,time);
    for(const p of bodies.planets){lineRing(p.orbitRadius,p.inclination,p.id===selected?'#8adfeb':'#6e90ab',p.id===selected?.55:.20);}
    lineRing(bodies.belt.orbitRadius,0,'#a68b78',.24);
    gl.clear(gl.DEPTH_BUFFER_BIT);
    ball([0,0,0],bodies.star.radius,bodies.star.color,1);
    const points=[];
    for(const p of bodies.planets){
      const pos=at(p,time);ball(pos,p.radius*1.3,p.color,0,p.biome==='Gas Giant'?2:0);
      const screen=projectPoint(pos,matrix,width,height);
      const sizePoint=projectPoint([pos[0]+p.radius*1.3,pos[1],pos[2]],matrix,width,height);
      if(screen)points.push({id:p.id,x:screen.x,y:screen.y,r:Math.max(15,Math.abs((sizePoint?.x||screen.x+12)-screen.x)+8),depth:screen.depth});
      for(const moon of p.moons){
        const angle=moon.phase+time*.4;
        const satellite=[pos[0]+Math.cos(angle)*moon.orbitRadius,pos[1]+Math.sin(angle)*.10,pos[2]+Math.sin(angle)*moon.orbitRadius];
        ball(satellite,moon.radius,'#c4d3d8',0);
      }
    }
    lastPoints=points;
  }
  function fallbackSphere(x,y,r,color,star=false){
    const g=ctx.createRadialGradient(x-r*.32,y-r*.34,1,x,y,r);
    g.addColorStop(0,star?'#fff6d6':color);g.addColorStop(.48,color);g.addColorStop(1,'#101725');
    ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.fillStyle=g;ctx.fill();
  }
  function draw2D(time){
    ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,width,height);
    const cx=width/2,cy=height/2,scale=Math.min(width/29,height/20)*22/camera.distance;
    ctx.strokeStyle='rgba(120,177,197,.19)';ctx.lineWidth=1;
    for(const p of bodies.planets){ctx.beginPath();ctx.ellipse(cx,cy,p.orbitRadius*scale,p.orbitRadius*scale*.48,0,0,TAU);ctx.stroke();}
    fallbackSphere(cx,cy,Math.max(18,bodies.star.radius*scale),bodies.star.color,true);
    lastPoints=[];
    for(const p of bodies.planets){
      const phase=p.phase+time*.095/Math.pow(p.orbitRadius,1.05),x=cx+Math.cos(phase)*p.orbitRadius*scale,y=cy+Math.sin(phase)*p.orbitRadius*scale*.48;
      const radius=Math.max(5,p.radius*scale);fallbackSphere(x,y,radius,p.color);
      lastPoints.push({id:p.id,x,y,r:Math.max(16,radius+8),depth:0});
    }
  }
  function tick(){
    if(!active)return;
    resize();
    if(width>0&&height>0){const time=frameTime();if(gl)drawGL(cameraMatrix(),time);else if(ctx)draw2D(time);}
    raf=requestAnimationFrame(tick);
  }
  function open(nextSystem,nextBodies){
    system=nextSystem;bodies=nextBodies;selected=0;camera={yaw:.46,pitch:.53,distance:22};
    clockBase=performance.now();active=true;resize();if(!raf)raf=requestAnimationFrame(tick);
  }
  function close(){active=false;system=null;bodies=null;lastPoints=[];if(raf)cancelAnimationFrame(raf);raf=0;}
  function pickPlanet(x,y){
    if(!active)return;
    const candidates=lastPoints.filter(p=>Math.hypot(x-p.x,y-p.y)<p.r).sort((a,b)=>Math.hypot(x-a.x,y-a.y)-Math.hypot(x-b.x,y-b.y));
    if(candidates.length){selected=candidates[0].id;onSelect(selected);}
  }
  canvas.addEventListener('pointerdown',event=>{
    if(!active)return;
    pointer={id:event.pointerId,x:event.clientX,y:event.clientY,lastX:event.clientX,lastY:event.clientY,moved:false};
    canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener('pointermove',event=>{
    if(!pointer||event.pointerId!==pointer.id)return;
    const dx=event.clientX-pointer.lastX,dy=event.clientY-pointer.lastY;
    if(Math.hypot(event.clientX-pointer.x,event.clientY-pointer.y)>5)pointer.moved=true;
    if(pointer.moved){camera=clampSolarCamera({...camera,yaw:camera.yaw-dx*.007,pitch:camera.pitch+dy*.006});}
    pointer.lastX=event.clientX;pointer.lastY=event.clientY;
  });
  canvas.addEventListener('pointerup',event=>{
    if(!pointer||event.pointerId!==pointer.id)return;
    if(!pointer.moved){const r=canvas.getBoundingClientRect();pickPlanet(event.clientX-r.left,event.clientY-r.top);}
    pointer=null;
  });
  canvas.addEventListener('pointercancel',()=>pointer=null);
  canvas.addEventListener('wheel',event=>{if(!active)return;event.preventDefault();camera=clampSolarCamera({...camera,distance:camera.distance*(event.deltaY<0?.9:1.1)});},{passive:false});
  window.addEventListener('resize',resize);
  canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();use2DFallback();resize();});
  return {open,close,resize,selectPlanet(id){selected=id;},resetCamera(){camera={yaw:.46,pitch:.53,distance:22};},is3D(){return Boolean(gl&&gfx);},isActive(){return active;}};
}
