import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {generateGame, validateGame, income, endTurn, reformGovernment, adoptCivic, appointLeader} from '../core.js';
import {GOVERNMENTS, CIVICS, LEADERS, COUNCIL_OFFICES, FACTIONS, governanceBonuses, factionLoyalty, politicalStability, stabilityProductionFactor, canReformGovernment, canAdoptCivic, canAppointLeader, advancePolitics, validGovernmentState} from '../modules/strategy/government.js';

test('governments civics and council choices have unique ids and bounded effects',()=>{
  assert.equal(new Set(GOVERNMENTS.map(x=>x.id)).size,GOVERNMENTS.length);
  assert.equal(new Set(CIVICS.map(x=>x.id)).size,CIVICS.length);
  assert.equal(new Set(LEADERS.map(x=>x.id)).size,LEADERS.length);
  assert.deepEqual(new Set(CIVICS.map(x=>x.slot)),new Set(['Constitution','Development']));
  assert.deepEqual(new Set(LEADERS.map(x=>x.office)),new Set(COUNCIL_OFFICES.map(x=>x.id)));
  assert.equal(FACTIONS.length,3);
  for(const item of [...GOVERNMENTS,...CIVICS,...LEADERS])for(const value of Object.values(item.effects)){
    assert.ok(Number.isFinite(value)&&value>=0&&value<=.2);
  }
});

test('fresh and legacy v1 games are playable and political defaults preserve baseline income',()=>{
  const game=generateGame({seed:'GOVERNANCE-LEGACY'});
  const before=income(game,0);
  assert.equal(game.empires[0].government,'directorate');
  assert.equal(politicalStability(game.empires[0]),55);
  assert.equal(stabilityProductionFactor(game.empires[0]),1);
  const old=structuredClone(game);
  for(const empire of old.empires)for(const key of ['government','civics','council','factionLoyalty','lastGovernmentReform','lastAppointments'])delete empire[key];
  assert.equal(validateGame(old),true);
  assert.deepEqual(income(old,0),before);
  assert.equal(endTurn(old).ok,true);
  assert.equal(validateGame(old),true);
});

test('a government reform costs influence and is subject to a five-cycle cooldown',()=>{
  const game=generateGame();
  const empire=game.empires[0],before=empire.influence;
  assert.equal(canReformGovernment(game,'undefined').ok,false);
  assert.equal(reformGovernment(game,'technocracy').ok,true);
  assert.equal(empire.influence,before-40);
  assert.equal(empire.government,'technocracy');
  assert.equal(reformGovernment(game,'imperium').ok,false);
  empire.influence=100;
  assert.match(reformGovernment(game,'imperium').message,/five cycles/);
  game.turn+=5;
  assert.equal(reformGovernment(game,'imperium').ok,true);
  assert.equal(empire.lastGovernmentReform,game.turn);
  assert.ok(empire.factionLoyalty.guilds<55);
});

test('civics occupy one per slot and change production with replacement costs',()=>{
  const game=generateGame(),e=game.empires[0];
  e.influence=120;
  const old=income(game,0).credits;
  assert.equal(adoptCivic(game,'trade-charters').ok,true);
  assert.equal(adoptCivic(game,'open-assembly').ok,true);
  assert.ok(income(game,0).credits>old);
  assert.equal(e.civics.length,2);
  assert.equal(e.influence,80);
  assert.equal(adoptCivic(game,'public-works').ok,true);
  assert.deepEqual(e.civics,['open-assembly','public-works']);
  assert.equal(adoptCivic(game,'public-works').ok,false);
  assert.equal(canAdoptCivic(game,'invalid').ok,false);
});

test('council appointment costs influence, locks its office, and grants unique bonuses',()=>{
  const game=generateGame(),e=game.empires[0];
  assert.equal(canAppointLeader(game,'invalid').ok,false);
  assert.equal(appointLeader(game,'nira-chen').ok,true);
  assert.equal(e.council.scientist,'nira-chen');
  assert.equal(e.influence,44);
  assert.equal(appointLeader(game,'nira-chen').ok,false);
  assert.equal(appointLeader(game,'veya-ren').ok,false);
  game.turn+=2;
  assert.equal(appointLeader(game,'veya-ren').ok,true);
  assert.equal(e.council.scientist,'veya-ren');
  assert.equal(e.influence,32);
  assert.ok(governanceBonuses(e).science>.15);
});

test('faction loyalty drifts deterministically and unrest changes real yields',()=>{
  const game=generateGame(),e=game.empires[0];
  const old=income(game,0);
  e.factionLoyalty={guilds:0,scholars:0,settlers:0};
  assert.equal(stabilityProductionFactor(e),.75);
  const suppressed=income(game,0);
  for(const key of ['credits','alloys','science','influence'])assert.ok(suppressed[key]<=old[key]);
  const before=factionLoyalty(e,'guilds');
  const result=advancePolitics(e);
  assert.equal(result.current>=result.previous,true);
  assert.equal(factionLoyalty(e,'guilds'),before+2);
  assert.equal(validateGame(game),true);
});

test('save validator rejects corrupt optional government data but accepts missing v1 fields',()=>{
  const g=generateGame(),e=g.empires[0];
  assert.equal(validGovernmentState({}),true);
  assert.equal(validateGame(g),true);
  e.civics=['open-assembly','executive-mandate'];
  assert.equal(validateGame(g),false);
  e.civics=[];
  e.council={scientist:'tarek-voss'};
  assert.equal(validateGame(g),false);
  e.council={};
  e.factionLoyalty.guilds=1234;
  assert.equal(validateGame(g),false);
});

test('Government page, click actions, styling and offline assets are wired',()=>{
  const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
  const app=readFileSync(new URL('../app.js',import.meta.url),'utf8');
  const sw=readFileSync(new URL('../sw.js',import.meta.url),'utf8');
  assert.match(html,/data-nav="government"/);
  assert.match(html,/government\.css/);
  assert.match(app,/case 'government':return renderGovernment\(\)/);
  for(const action of ['reform-government','adopt-civic','appoint-leader'])assert.match(app,new RegExp("case '"+action+"'"));
  assert.match(sw,/modules\/strategy\/government\.js/);
  assert.match(sw,/modules\/styles\/government\.css/);
});
