import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const sw=readFileSync(new URL('../sw.js',import.meta.url),'utf8');
const app=readFileSync(new URL('../app.js',import.meta.url),'utf8');

test('solar scene can be entered, closed and controlled from accessible HTML elements',()=>{
  for(const id of ['solar-stage','solar-canvas','solar-planet-list','solar-planet-detail','solar-renderer']){
    assert.match(html,new RegExp(`id="${id}"`));
  }
  for(const action of ['open-solar','close-solar','solar-reset','solar-planet']){
    assert.match(app,new RegExp(`case '${action}'`));
  }
  assert.match(app,/hasSeen\(game,system.id\)/);
});

test('offline service worker precaches all source modules used by the orbital view',()=>{
  for(const file of ['core.js','app.js','system-model.js','solar-view.js','style.css','index.html','manifest.webmanifest']){
    assert.ok(existsSync(new URL(`../${file}`,import.meta.url)),`${file} exists`);
    assert.ok(sw.includes(`./${file}`),`${file} is cached`);
  }
});
