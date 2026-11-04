import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';

const moduleUrl=new URL('../modules/ui/galaxy-camera.js',import.meta.url);
const frame=async args=>{
  assert.ok(existsSync(moduleUrl),'visible-system camera framing module exists');
  const { fitKnownGalaxy }=await import(moduleUrl.href);
  return fitKnownGalaxy(args);
};

test('auto map camera fits the discovered frontier rather than the entire hidden galaxy', async()=>{
  const result=await frame({
    systems:[{id:0,x:400,y:300},{id:1,x:570,y:380},{id:2,x:1100,y:700}],
    visibleIds:new Set([0,1]),width:960,height:690,
    world:{width:1140,height:760}
  });
  assert.equal(result.cx,485);
  assert.equal(result.cy,340);
  assert.ok(result.zoom>1.6&&result.zoom<=3,'known frontier should occupy meaningful canvas area');
});

test('auto camera falls back safely before game initialization and on single-star maps',async()=>{
  const empty=await frame({systems:[],visibleIds:new Set(),width:900,height:620,world:{width:1140,height:760}});
  assert.equal(empty.cx,570);
  assert.equal(empty.cy,380);
  assert.ok(Number.isFinite(empty.zoom)&&empty.zoom>.1&&empty.zoom<=3);
  const single=await frame({systems:[{id:0,x:205,y:85}],visibleIds:new Set([0]),width:390,height:410,world:{width:1140,height:760}});
  assert.equal(single.cx,205);
  assert.equal(single.cy,85);
  assert.ok(Number.isFinite(single.zoom)&&single.zoom>.3&&single.zoom<=3);
});

test('auto camera keeps newly revealed systems in view even if their identifiers are sparse',async()=>{
  const result=await frame({
    systems:[{id:7,x:120,y:180},{id:14,x:420,y:380},{id:31,x:1110,y:650}],
    visibleIds:new Set([7,14]),width:800,height:500,
    world:{width:1140,height:760}
  });
  assert.equal(result.cx,270);
  assert.equal(result.cy,280);
  assert.ok(result.zoom>.5);
});
