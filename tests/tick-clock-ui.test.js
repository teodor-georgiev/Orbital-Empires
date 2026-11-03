import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const text=file=>readFileSync(new URL('../'+file,import.meta.url),'utf8');
test('simulation clock is accessible from the galaxy footer and wired into the UI',()=>{
 const markup=text('index.html'),app=text('app.js');
 for(const action of ['sim-paused','sim-slow','sim-normal','sim-fast'])assert.ok(markup.includes('data-action="'+action+'"'));
 assert.match(markup,/aria-label="Autonomous simulation speed"/);
 assert.match(app,/createTickClock\(/);
 assert.match(app,/simClock\.manualCycle\(/);
 assert.match(app,/visibilitychange/);
});
test('simulation clock assets are available offline with a revisioned cache',()=>{
 const sw=text('sw.js');
 assert.match(sw,/modules\/simulation\/tick-clock\.js/);
 assert.match(sw,/modules\/styles\/simulation\.css/);
 assert.match(text('index.html'),/modules\/styles\/simulation\.css/);
});
