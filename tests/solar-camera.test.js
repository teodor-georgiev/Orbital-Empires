import test from 'node:test';
import assert from 'node:assert/strict';
import { clampSolarCamera, projectPoint } from '../solar-view.js';

test('solar camera clamps pitch and zoom to usable values', () => {
  assert.deepEqual(clampSolarCamera({yaw:2,pitch:-5,distance:3}),{yaw:2,pitch:0.14,distance:8});
  assert.deepEqual(clampSolarCamera({yaw:0,pitch:4,distance:900}),{yaw:0,pitch:1.35,distance:34});
});

test('projectPoint returns pixel coordinates or null for points behind camera', () => {
  const m = new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]);
  assert.deepEqual(projectPoint([0,0,0],m,800,600),{x:400,y:300,depth:0});
  assert.equal(projectPoint([0,0,0],new Float32Array(16),800,600),null);
});
