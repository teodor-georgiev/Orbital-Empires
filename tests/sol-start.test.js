import test from 'node:test';
import assert from 'node:assert/strict';
import { generateGame, endTurn, validateGame, getStardate } from '../core.js';
import { generateSystemBodies } from '../system-model.js';
import { NEARBY_STARS } from '../modules/galaxy/real-stars.js';
import { readFileSync } from 'node:fs';

test('human Sol scenario starts on Earth in 2200 and uses a real nearby-star catalog', () => {
 const g=generateGame({scenario:'sol',startYear:2200,playerFaction:'human',seed:'EARTH-2200',size:60,opponents:3});
 const home=g.systems[g.empires[0].home];
 assert.equal(g.empires[0].species,'Human');
 assert.equal(g.empires[0].home,home.id);
 assert.equal(home.name,'Sol');
 assert.equal(home.realStarId,'sol');
 assert.equal(home.owner,0);
 assert.equal(g.startYear,2200);
 assert.equal(g.scenario,'sol');
 assert.equal(getStardate(g),'2200.01');
 assert.equal(validateGame(g),true);
 const names=new Set(g.systems.map(s=>s.name));
 for(const star of ['Sol','Alpha Centauri','Proxima Centauri',"Barnard's Star",'Wolf 359','Lalande 21185','Sirius']){
   assert.ok(names.has(star),star);
 }
 const alpha=g.systems.find(s=>s.name==='Alpha Centauri');
 const proxima=g.systems.find(s=>s.name==='Proxima Centauri');
 assert.equal(alpha.distanceLy,4.37);
 assert.equal(proxima.distanceLy,4.25);
 assert.ok(NEARBY_STARS.length>=7);
 const planets=generateSystemBodies(g.seed,home).planets;
 assert.equal(planets.length,8);
 assert.deepEqual(planets.map(p=>p.name),['Mercury','Venus','Earth','Mars','Jupiter','Saturn','Uranus','Neptune']);
 assert.equal(planets.find(p=>p.isColonyWorld).name,'Earth');
});
test('procedural start is preserved, player species can be selected, and calendars roll over',()=>{
 const g=generateGame({scenario:'procedural',playerFaction:'auralian',startYear:2250,size:60,opponents:2,seed:'OTHER'});
 assert.equal(g.empires[0].species,'Auralian');
 assert.notEqual(g.systems[g.empires[0].home].name,'Sol');
 assert.equal(getStardate(g),'2250.01');
 for(let i=0;i<12;i++)assert.equal(endTurn(g).ok,true);
 assert.equal(getStardate(g),'2251.01');
 const legacy=generateGame();
 delete legacy.startYear;delete legacy.scenario;
 assert.equal(validateGame(legacy),true);
 assert.equal(getStardate(legacy),'2201.01');
});
test('campaign controls expose starting year, species and Solar Frontier',()=>{
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 const js=readFileSync(new URL('../app.js',import.meta.url),'utf8');
 for(const id of ['new-start-year','new-scenario','new-faction'])assert.ok(js.includes(id));
 assert.ok(js.includes("scenario:'sol'"));
});
