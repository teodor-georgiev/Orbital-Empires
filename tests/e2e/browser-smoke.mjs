/** Minimal Chrome DevTools Protocol browser smoke test, no npm dependencies.
 * Starts Chrome against a local static HTTP origin; never touches user accounts.
 */
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
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
 await ready('document.readyState==="complete"&&!!document.querySelector(".oe-home-menu")','command menu');
 assert.equal(await evaluate('document.querySelectorAll(".game-nav .nav-link").length'),8);
 assert.ok(await evaluate('!!document.querySelector(".command-group-label")'));
 await evaluate('document.querySelector(".oe-home-continue").click();true');
 await ready('document.getElementById("modal-root").hidden&&!!document.querySelector("[data-action=open-solar]")','galaxy after menu resume');
 await evaluate('document.querySelector("[data-action=open-solar]").click();true');
 await ready('!document.getElementById("solar-stage").hidden&&document.querySelectorAll("[data-action=solar-planet]").length>=4','3D or 2D solar scene');
 assert.ok(await evaluate('!!document.querySelector(".oe-population-card")'));
 const prior=await evaluate('parseFloat(document.querySelector(".oe-population-head b").textContent)');
 assert.ok(Number.isFinite(prior)&&prior>0);
 await evaluate("document.querySelector(\"[data-action=solar-planet][data-id=\\\"1\\\"]\").click();true");
 await ready("document.querySelector(\"[data-action=solar-planet][data-id=\\\"1\\\"]\")?.getAttribute('aria-pressed')==='true'&&document.getElementById('inspector').textContent.includes('Survey-only planet')",'survey-only planet selected');
 assert.equal(await evaluate('document.querySelectorAll(".oe-build-card").length'),0);
 await evaluate("document.querySelector(\"[data-action=solar-planet][data-id=\\\"0\\\"]\").click();true");
 await ready("document.querySelector(\"[data-action=solar-planet][data-id=\\\"0\\\"]\")?.getAttribute('aria-pressed')==='true'&&!!document.querySelector('.oe-population-card')",'primary colony world selected');
 assert.equal(await evaluate('document.querySelectorAll(".oe-build-card").length'),4);
 await evaluate('document.querySelector("[data-action=end-turn]").click();true');
 await ready('document.getElementById("top-turn").textContent.includes("02")','manual cycle advance');
 const next=await evaluate('parseFloat(document.querySelector(".oe-population-head b").textContent)');
 assert.ok(next>prior&&next<30,'population must grow smoothly');
 await command('Page.enable');
 await command('Page.reload',{ignoreCache:true});
 await ready('document.readyState==="complete"&&!!document.querySelector(".oe-home-menu")','saved game reload');
 await evaluate('document.querySelector(".oe-home-continue").click();true');
 await ready('document.getElementById("modal-root").hidden','resume saved game');
 assert.ok(await evaluate('document.getElementById("top-turn").textContent.includes("02")'),'turn persists after reload');
 await command('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
 assert.ok(await evaluate('document.querySelectorAll(".game-nav .nav-link").length===8'));
 assert.equal(messages.length,0,'No uncaught browser exceptions: '+messages.join('; '));
 console.log('Browser smoke OK: command menu, 3D system entry, planet selection, growth, colony upgrades, save/reload, mobile');
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
