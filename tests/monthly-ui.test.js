import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const get=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
test('game replaces End Turn with monthly real-time controls',()=>{
 const html=get('index.html'),app=get('app.js'),css=get('modules/styles/monthly-time.css');
 assert.doesNotMatch(html,/data-action="end-turn"/);
 for(const name of ['clock-toggle','clock-speed','step-month'])assert.ok(html.includes('data-action="'+name+'"'));
 assert.match(app,/createMonthlyClock\(/);
 assert.match(app,/STARDATE \$\{getStardate\(game\)\}/);
 assert.doesNotMatch(app,/Each fleet can move once per turn/);assert.match(app,/visibilitychange/);
 assert.match(app,/case 'queue-fleet-route'/);assert.match(app,/case 'cancel-fleet-route'/);
 assert.match(css,/@media\(max-width:750px\)/);
});
test('offline cache includes monthly simulation code and fleet routing',()=>{
 const sw=get('sw.js');
 for(const path of ['modules/simulation/monthly-clock.js','modules/strategy/fleet-routes.js','modules/styles/monthly-time.css'])assert.ok(sw.includes('./'+path));
});
test('agents must journal implemented feature changes',()=>{
 assert.match(get('AGENTS.md'),/Mandatory record of every implemented change/);
 assert.match(get('CHANGELOG.md'),/Monthly simulation and fleet routing/);
});
