import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const mobileCSS=readFileSync(new URL('../modules/styles/government.css',import.meta.url),'utf8');
const app=readFileSync(new URL('../app.js',import.meta.url),'utf8');

test('seven primary sections preserve Government, Galaxy, and unified Progress',()=>{
 for(const id of ['system','colonies','research','government','military','diplomacy','intel']){
   assert.match(html,new RegExp('<button data-nav="'+id+'"[^>]*title="[^"]+"'));
 }
 assert.match(html,/EMPIRE COMMAND <span>07<\/span>/);
 assert.match(html,/class="nav-link progress-nav" title="Technology, Traditions and Policies"/);
 assert.doesNotMatch(html,/<button data-nav="(?:traditions|policies)" class="nav-link"/);
 assert.match(html,/id="progress-workspace"/);
 assert.match(app,/isDevelopmentPage\(activePage\)/);
});

test('government and Progress remain reachable on mobile within existing navigation grid',()=>{
 assert.match(mobileCSS,/@media\(max-width:750px\)/);
 assert.match(mobileCSS,/\.sidebar \.game-nav\{grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
 assert.match(app,/const nav=event\.target\.closest\('\[data-nav\]'\)/);
 assert.match(app,/\(isDevelopmentPage\(activePage\)\?\$\('#progress-workspace'\):\$\('#inspector'\)\)\.scrollIntoView/);
});
