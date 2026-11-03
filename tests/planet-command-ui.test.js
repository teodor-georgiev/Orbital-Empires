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

test('approved three-view route and mockup are saved in repository',()=>{
 const app=file('app.js'),html=file('index.html'),css=file('modules/styles/planet-command.css'),spec=file('docs/design/APPROVED-HYBRID-UI.md'),svg=file('docs/design/approved-hybrid-layout.svg');
 for(const action of ['solar-focus-planet','solar-show-orbit','planet-upgrades'])assert.ok(app.includes("case '"+action+"'"));
 for(const id of ['planet-focus-stage','solar-focus-planet','solar-show-orbit'])assert.ok(html.includes('id="'+id+'"'));
 assert.match(css,/oe-orbital-mode/);assert.match(css,/oe-focused-planet-art/);
 assert.match(spec,/Approved by project owner/);
 assert.match(svg,/<svg xmlns=/);
 assert.doesNotMatch(svg,/<\/rect>/);
});
