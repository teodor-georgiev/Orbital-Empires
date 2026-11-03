import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { APP_VERSION, SAVE_SCHEMA_VERSION } from '../version.js';
import { VERSION } from '../core.js';
const pkg=JSON.parse(readFileSync(new URL('../package.json',import.meta.url),'utf8'));
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const sw=readFileSync(new URL('../sw.js',import.meta.url),'utf8');

test('displayed release version, package version, and PWA cache stay synchronized',()=>{
 assert.match(APP_VERSION,/^\d+\.\d+\.\d+$/);
 assert.equal(pkg.version,APP_VERSION);
 assert.ok(html.includes(`BUILD v${APP_VERSION}`));
 assert.ok(sw.includes(`orbital-empires-app-${APP_VERSION}`));
 assert.ok(sw.includes('./version.js'));
});
test('app releases do not silently invalidate preexisting saved games',()=>{
 assert.equal(SAVE_SCHEMA_VERSION,1);
 assert.equal(VERSION,SAVE_SCHEMA_VERSION);
});
