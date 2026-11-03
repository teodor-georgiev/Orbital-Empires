import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const app=readFileSync(new URL('../app.js',import.meta.url),'utf8');
const css=readFileSync(new URL('../modules/styles/command-workspace.css',import.meta.url),'utf8');

test('seven clear command sections and one discoverable Progress viewer with three internal categories',()=>{
 for(const id of ['system','colonies','research','government','military','diplomacy','intel'])
   assert.match(html,new RegExp('<button data-nav="'+id+'"[^>]*title="[^"]+"'));
 assert.equal((html.match(/class="nav-link(?: active| progress-nav)?"/g)||[]).length,7);
 assert.match(html,/COMMAND CENTER <span>07<\/span>/);
 assert.match(html,/class="nav-link progress-nav"/);
 assert.match(html,/id="progress-workspace"/);
 for(const page of ['traditions','policies'])assert.doesNotMatch(html,new RegExp('<button data-nav="'+page+'" class="nav-link'));
});
test('Progress viewer hides map but preserves Government, solar scene and navigation',()=>{
 assert.match(css,/\.main-layout\.progress-mode/);
 assert.match(app,/const isProgress=isDevelopmentPage\(activePage\)/);
 assert.match(app,/renderDevelopment\(game,activePage,selectedDevelopmentId,developmentFilter\)/);
 assert.match(app,/case 'select-development'/);
 assert.match(app,/case 'filter-development'/);
 assert.match(app,/selectedSpaceSite\?renderSpaceSite\(\):renderPlanetInspector\(\)/);
});
