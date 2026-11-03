import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const file=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');

test('planet inspection connects the 3D canvas and the keyboard-accessible planet list',()=>{
 const app=file('app.js'),html=file('index.html');
 assert.match(app,/function renderPlanetInspector\(/);
 assert.match(app,/renderPlanetInspector\(\)/);
 assert.match(app,/onSelect: id =>/);
 assert.match(app,/case 'solar-planet'/);
 assert.match(html,/id="solar-planet-list"/);
 assert.match(html,/aria-label="Planets in this system"/);
});
test('redesigned menu has clear hierarchy and distinct map and colony controls',()=>{
 const html=file('index.html'),sw=file('sw.js');
 assert.match(html,/class="command-group-label"/);
 assert.match(html,/data-nav="colonies"/);
 assert.match(html,/data-nav="research"/);
 assert.match(html,/modules\/styles\/planet-command\.css/);
 assert.match(sw,/modules\/styles\/planet-command\.css/);
 assert.match(sw,/modules\/simulation\/population\.js/);
});
