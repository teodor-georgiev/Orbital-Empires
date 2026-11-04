/** Minimal Chrome DevTools Protocol browser smoke test, no npm dependencies.
 * Starts Chrome against a local static HTTP origin; never touches user accounts.
 */
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const chromeBin=process.env.CHROME_BIN;
if(!chromeBin)throw Error('CHROME_BIN not set; a headless browser is required');
const root=mkdtempSync(join(tmpdir(),'orbital-smoke-'));
const chrome=spawn(chromeBin,['--headless=new','--no-sandbox','--disable-gpu',
 '--disable-dev-shm-usage','--no-first-run','--no-default-browser-check',
 '--remote-debugging-address=127.0.0.1','--remote-debugging-port=9224',
 '--user-data-dir='+root,'about:blank'],{stdio:'ignore'});
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const screenshots=join(process.cwd(),'artifacts','ui');
mkdirSync(screenshots,{recursive:true});
async function polling(fn,description,timeout=15000){
 const until=Date.now()+timeout;
 while(Date.now()<until){try{const value=await fn();if(value)return value;}catch{}await sleep(180);}
 throw Error('Timed out: '+description);
}
const messages=[];
let ws=null,request=0;
const pending=new Map();
const command=(method,params={})=>new Promise((resolve,reject)=>{
 const id=++request;
 const timeout=setTimeout(()=>{pending.delete(id);reject(Error('CDP request timed out: '+method));},8000);
 pending.set(id,{resolve,reject,timeout});
 ws.send(JSON.stringify({id,method,params}));
});
async function evaluate(expression){
 const response=await command('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
 if(response.exceptionDetails)throw Error('Browser JS exception: '+response.exceptionDetails.text);
 return response.result?.value;
}
async function ready(expression,label){return polling(async()=>await evaluate(expression),label);}
async function capture(name){await sleep(200);const reply=await command('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});writeFileSync(join(screenshots,name),Buffer.from(reply.data,'base64'));}
let failures=0;
try{
 await polling(async()=>{const r=await fetch('http://127.0.0.1:9224/json/version');return r.ok;},'Chrome launch');
 const tab=await (await fetch('http://127.0.0.1:9224/json/new?'+encodeURIComponent('http://127.0.0.1:4173/'),{method:'PUT'})).json();
 ws=new WebSocket(tab.webSocketDebuggerUrl);
 await new Promise((resolve,reject)=>{
  const timer=setTimeout(()=>reject(Error('WebSocket handshake timed out')),8000);
  ws.onopen=()=>{clearTimeout(timer);resolve();};
  ws.onerror=event=>{clearTimeout(timer);reject(Error('WebSocket error'));};
 });
 ws.onmessage=event=>{
  const result=JSON.parse(event.data);
  if(result.method==='Runtime.exceptionThrown')messages.push(result.params.exceptionDetails?.text||'JS exception');
  if(!result.id)return;
  const p=pending.get(result.id);if(!p)return;
  clearTimeout(p.timeout);pending.delete(result.id);
  if(result.error)p.reject(Error(JSON.stringify(result.error)));else p.resolve(result.result);
 };
 await command('Runtime.enable');
 await command('Page.enable');
 await command('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});
 await ready('document.readyState==="complete"&&!!document.querySelector(".oe-home-menu")','command menu');
 assert.equal(await evaluate('document.querySelectorAll(".game-nav .nav-link").length'),7);
 assert.ok(await evaluate('!!document.querySelector("[data-nav=government]")&&!!document.querySelector(".progress-nav")'));
 assert.ok(await evaluate('!!document.querySelector("#progress-workspace")'));
 assert.ok(await evaluate('!!document.querySelector(".command-group-label")'));
 await evaluate('document.querySelector(".oe-home-continue").click();true');
 await ready('document.getElementById("modal-root").hidden&&!!document.querySelector("[data-action=open-solar]")','galaxy after menu resume');
 // Regression: CSS display:flex must not override the Progress section's hidden attribute.
 assert.ok(await evaluate("document.getElementById('progress-workspace').hidden&&getComputedStyle(document.getElementById('progress-workspace')).display==='none'&&document.getElementById('progress-workspace').offsetHeight===0"),'hidden Progress section must not occupy the galaxy scene');
 const galaxyGeometry=JSON.parse(await evaluate("JSON.stringify(({top:document.getElementById('map-viewport').getBoundingClientRect().top,height:document.getElementById('map-viewport').getBoundingClientRect().height}))"));
 assert.ok(galaxyGeometry.top<310&&galaxyGeometry.height>450,'galaxy canvas must fill command surface, not be pushed below an invisible panel: '+JSON.stringify(galaxyGeometry));

 const shell=JSON.parse(await evaluate(`JSON.stringify((()=>{
   const layout=document.querySelector('.main-layout'),map=document.getElementById('map-viewport'),
     inspector=document.getElementById('inspector'),header=document.querySelector('.topbar');
   return {layoutWidth:layout.getBoundingClientRect().width,mapWidth:map.getBoundingClientRect().width,
     inspectorWidth:inspector.getBoundingClientRect().width,headerHeight:header.getBoundingClientRect().height,
     nav:[...document.querySelectorAll('.game-nav .nav-link')].map(b=>({name:b.textContent.trim(),size:parseFloat(getComputedStyle(b).fontSize),height:b.getBoundingClientRect().height}))};
 })())`));
 assert.ok(shell.mapWidth/shell.layoutWidth>.62&&shell.inspectorWidth>=275,
   'map must dominate while keeping inspector reachable: '+JSON.stringify(shell));
 assert.ok(shell.headerHeight<=70&&shell.nav.length===7&&shell.nav.every(n=>n.size>=11&&n.height>=40),
   'desktop command navigation should have seven readable actions: '+JSON.stringify(shell));

 await capture('01-galaxy-desktop.png');
 // A dedicated Progress workspace must replace the map without retaining hidden
 // layout space, and return to the exact same playable map surface.
 await evaluate('document.querySelector(".game-nav [data-nav=research]").click();true');
 await ready('!document.getElementById("progress-workspace").hidden&&document.querySelector(".main-layout").classList.contains("progress-mode")','Progress workspace opens');
 assert.equal(await evaluate("getComputedStyle(document.getElementById('map-viewport')).display"),'none','Progress mode removes inactive canvas from layout');
 await evaluate('document.querySelector(".game-nav [data-nav=system]").click();true');
 await ready('document.getElementById("progress-workspace").hidden&&!document.querySelector(".main-layout").classList.contains("progress-mode")','galaxy restored after Progress');
 assert.ok(await evaluate("getComputedStyle(document.getElementById('progress-workspace')).display==='none'&&document.getElementById('map-viewport').getBoundingClientRect().height>450"),
   'returning from Progress must restore a full-height galaxy map');

 await evaluate('document.querySelector("[data-action=open-solar]").click();true');
 await ready('!document.getElementById("solar-stage").hidden&&document.querySelectorAll("[data-action=solar-planet]").length>=4','3D or 2D solar scene');
 assert.ok(await evaluate('!!document.querySelector(".oe-population-card")'));
 assert.ok(await evaluate('document.body.classList.contains("oe-orbital-mode")&&!document.body.classList.contains("oe-planet-focus")'));

 const orbitalNav=JSON.parse(await evaluate(`JSON.stringify((()=>{
   const rail=document.querySelector('.sidebar');
   return {railWidth:rail.getBoundingClientRect().width,
     labels:[...rail.querySelectorAll('.nav-link')].map(el=>parseFloat(getComputedStyle(el).fontSize))};
 })())`));
 assert.ok(orbitalNav.railWidth<=76&&orbitalNav.labels.every(size=>size===0),
   'compact orbital rail must show icons without clipped text labels: '+JSON.stringify(orbitalNav));

 assert.ok(await evaluate("getComputedStyle(document.getElementById('progress-workspace')).display==='none'"),'hidden Progress viewer cannot squeeze orbital system');
 await capture('02-orbital-system-desktop.png');
 const prior=await evaluate('parseFloat(document.querySelector(".oe-population-head b").textContent)');
 assert.ok(Number.isFinite(prior)&&prior>0);
 const primaryId=await evaluate('document.querySelector(".solar-planet-option[aria-pressed=true]")?.dataset.id');
 assert.ok(primaryId!==undefined,'homeworld must be selected');
 await evaluate("document.querySelector(\"[data-action=solar-planet][data-id=\\\"1\\\"]\").click();true");
 await ready("document.querySelector(\"[data-action=solar-planet][data-id=\\\"1\\\"]\")?.getAttribute('aria-pressed')==='true'&&document.getElementById('inspector').textContent.includes('Survey-only planet')",'survey-only planet selected');
 assert.equal(await evaluate('document.querySelectorAll(".oe-specialty-card").length'),0);
 assert.ok(await evaluate('document.querySelectorAll(".oe-orbital-card").length>=1'),'owned surveyed Venus has biome-specific orbital installations');
 assert.ok(await evaluate('document.body.classList.contains("oe-planet-focus")&&!document.getElementById("planet-focus-stage").hidden'));
 assert.ok(await evaluate('document.getElementById("planet-focus-stage").textContent.includes("SURVEY-ONLY PLANET")'));
 await evaluate(`document.querySelector('[data-action=solar-planet][data-id="${primaryId}"]').click();true`);
 await ready(`document.querySelector('[data-action=solar-planet][data-id="${primaryId}"]')?.getAttribute('aria-pressed')==='true'&&!!document.querySelector('.oe-population-card')`,'primary colony world selected');
 assert.ok(await evaluate('document.querySelectorAll(".oe-specialty-card").length>=2'),'Terran Earth has specialist buildings');
 assert.equal(await evaluate('document.querySelectorAll(".oe-orbital-card").length'),0);
 assert.ok(await evaluate('!!document.querySelector("[data-action=build][data-type=agri-domes]:not([disabled])")'));
 await capture('03-focused-planet-biome-buildings.png');
 await evaluate('document.querySelector("[data-action=build][data-type=agri-domes]").click();true');
 await ready('document.querySelector(".oe-specialty-card")?.textContent.includes("Level 1/3")','Terran housing building purchased');
 const postBuildPlanets=await evaluate(`JSON.stringify([...document.querySelectorAll('[data-action=solar-planet]')].map(el=>({id:el.dataset.id,label:el.textContent.trim().slice(0,45)})))`);
 console.log('POST_BUILD_PLANETS',postBuildPlanets);
 const gasId=await evaluate(`[...document.querySelectorAll('[data-action=solar-planet]')].find(el=>el.textContent.includes('Jupiter'))?.dataset.id??null`);
 assert.ok(gasId,'Jupiter should remain selectable after colony construction: '+postBuildPlanets);
 await evaluate(`document.querySelector('[data-action=solar-planet][data-id="${gasId}"]').click();true`);
 await ready('document.querySelector(".oe-orbital-card")?.textContent.includes("Gas Harvester")','gas giant building available');
 await capture('04-gas-giant-building-desktop.png');
 await evaluate('document.querySelector("[data-action=build-orbital][data-type=gas-harvester]").click();true');
 await ready('document.querySelector(".oe-orbital-card")?.textContent.includes("Level 1/3")','gas harvester purchased');
 await evaluate(`document.querySelector('[data-action=solar-planet][data-id="${primaryId}"]').click();true`);
 await ready('!!document.querySelector(".oe-population-card")','return to Earth');
 assert.ok(await evaluate('document.getElementById("planet-focus-stage").textContent.includes("MANAGE COLONY")'));
 await capture('03-focused-planet-desktop.png');
 await evaluate('document.querySelector("[data-action=solar-show-orbit]").click();true');
 await ready('!document.body.classList.contains("oe-planet-focus")','return to orbits');
 await evaluate('document.getElementById("solar-focus-planet").click();true');
 await ready('document.body.classList.contains("oe-planet-focus")','return to planet focus');
 await evaluate('document.querySelector("[data-action=end-turn]").click();true');
 await ready('document.getElementById("top-turn").textContent.includes("02")','manual cycle advance');
 const next=await evaluate('parseFloat(document.querySelector(".oe-population-head b").textContent)');
 assert.ok(next>prior&&next<30,'population must grow smoothly');
 await command('Page.reload',{ignoreCache:true});
 await ready('document.readyState==="complete"&&!!document.querySelector(".oe-home-menu")','saved game reload');
 await evaluate('document.querySelector(".oe-home-continue").click();true');
 await ready('document.getElementById("modal-root").hidden','resume saved game');
 assert.ok(await evaluate('document.getElementById("top-turn").textContent.includes("02")'),'turn persists after reload');
 await command('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
 assert.ok(await evaluate('document.querySelector(".topbar").getBoundingClientRect().height<=105'), 'phone header must fit brand, commands and resources in two compact rows');
 await capture('03-galaxy-mobile.png');
 assert.ok(await evaluate('document.querySelectorAll(".game-nav .nav-link").length===7'));
 await evaluate('document.querySelector("[data-action=open-solar]").click();true');
 await ready('!document.getElementById("solar-stage").hidden','mobile orbital scene');
 await evaluate('document.getElementById("solar-focus-planet").click();true');
 await ready('document.body.classList.contains("oe-planet-focus")','mobile focused planet');
 // Mobile regression: navigation must be above the scene and the planet card
 // must not be obstructed by the orbital-objects chooser.
 const mobileVisual=JSON.parse(await evaluate(`JSON.stringify((()=>{
   const nav=document.querySelector('.sidebar'),panel=document.querySelector('.solar-planet-panel'),
     card=document.querySelector('.oe-focus-caption'),viewport=document.querySelector('.map-viewport'),
     bar=document.querySelector('.game-nav');
   return {navTop:nav.getBoundingClientRect().top,navBottom:nav.getBoundingClientRect().bottom,
     sceneTop:viewport.getBoundingClientRect().top,cardHeight:card.getBoundingClientRect().height,
     cardWidth:card.getBoundingClientRect().width,sceneHeight:viewport.getBoundingClientRect().height,
     chooser:getComputedStyle(panel).display,navScrollWidth:bar.scrollWidth,
     navFontPx:parseFloat(getComputedStyle(bar.querySelector('[data-nav=research]')).fontSize),
     navContainsLabels:bar.textContent.includes('Government')&&bar.textContent.includes('Progress')};
 })())`));
 assert.ok(mobileVisual.navTop<255&&mobileVisual.navBottom<=mobileVisual.sceneTop+2,
   'mobile command nav must appear before galaxy/planet view: '+JSON.stringify(mobileVisual));
 assert.equal(mobileVisual.chooser,'none','planet-focused action card must not be covered by orbital chooser');
 assert.ok(mobileVisual.cardWidth>275&&mobileVisual.cardHeight>70&&mobileVisual.navContainsLabels&&mobileVisual.navFontPx>=11,
   'planet focus controls and labeled nav must remain legible: '+JSON.stringify(mobileVisual));
 await capture('04-focused-planet-mobile.png');
 const mobileLayout=await evaluate(`JSON.stringify({viewport:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth,offenders:[...document.querySelectorAll('*')].filter(el=>{const r=el.getBoundingClientRect();return r.width>0&&r.right>window.innerWidth+4}).slice(0,16).map(el=>({tag:el.tagName,class:el.className?.baseVal||el.className||'',right:Math.round(el.getBoundingClientRect().right),width:Math.round(el.getBoundingClientRect().width)}))})`);
 console.log('MOBILE_LAYOUT',mobileLayout);
 assert.ok(await evaluate('document.documentElement.scrollWidth<=document.documentElement.clientWidth+3'),'no mobile horizontal overflow');
 assert.equal(messages.length,0,'No uncaught browser exceptions: '+messages.join('; '));
 console.log('Browser smoke OK: seeded planet visuals, biome colony upgrades, gas harvester, save/reload, mobile');
}catch(err){
 failures++;
 console.error('BROWSER_SMOKE_FAILED:',err.stack||err);
 if(ws?.readyState===1){
  try{console.error('Debug:',await evaluate('({title:document.title,html:document.body?.innerText?.slice(0,250)})'));}catch{}
 }
}finally{
 ws?.close();
 chrome.kill();
 for(const item of pending.values())clearTimeout(item.timeout);
 await new Promise(resolve=>{if(chrome.exitCode!==null)return resolve();chrome.once('exit',resolve);setTimeout(resolve,1200);});
 try{rmSync(root,{recursive:true,force:true,maxRetries:5,retryDelay:150});}catch(error){console.warn('Chrome temp cleanup warning:',error.code);}
}
if(failures)process.exitCode=1;
