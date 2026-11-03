import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('system view includes responsive accessible fleet commands and original 3D meshes',()=>{
 const html=read('index.html'),app=read('app.js'),renderer=read('solar-view.js'),css=read('modules/styles/tactical-ships.css');
 assert.match(html,/id="solar-command-panel"/);
 for(const action of ['solar-select-ship','outpost-upgrade','ship-orbit','ship-guard','ship-dock','ship-patrol','ship-hold','ship-split','ship-merge','ship-move-target'])
  assert.match(app,new RegExp("case '"+action+"'"));
 assert.match(renderer,/renderTactical3D/);assert.match(renderer,/shipsInsideRectangle/);assert.match(renderer,/setMoveMode/);
 assert.match(css,/@media\(max-width:750px\)/);
 const sw=read('sw.js');
 for(const path of ['modules/strategy/outposts.js','modules/strategy/ship-units.js','modules/visuals/ship-models.js','modules/styles/tactical-ships.css'])assert.ok(sw.includes(path));
});
