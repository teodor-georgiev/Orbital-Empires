import test from 'node:test';
import assert from 'node:assert/strict';
import {buildShipMesh,buildOutpostMesh,hullOutline,shipLocalPosition,shipsInsideRectangle,nearestSelectableShip} from '../modules/visuals/ship-models.js';
test('original ship and outpost meshes are finite nonempty triangles',()=>{
 for(const type of ['corvette','frigate','cruiser']){
  const mesh=buildShipMesh(type);assert.ok(mesh.length>120);assert.equal(mesh.length%18,0);
  assert.ok([...mesh].every(Number.isFinite));assert.ok(hullOutline(type).length>=10);
 }
 const station=buildOutpostMesh();assert.ok(station.length>120);assert.equal(station.length%18,0);
});
test('ship positions and marquee selection use stable IDs and don't mutate world',()=>{
 const unit={id:7,localOrder:{kind:'hold'}},p=shipLocalPosition(unit,{planets:[]});
 assert.equal(p.length,3);assert.ok(p.every(Number.isFinite));
 const positions=[{id:1,x:20,y:30,owner:0},{id:2,x:90,y:85,owner:0},{id:3,x:23,y:25,owner:1}];
 assert.deepEqual(shipsInsideRectangle(positions,{x1:45,y1:50,x2:0,y2:0}),[1]);
 assert.equal(nearestSelectableShip(positions,23,28)?.id,1);
 assert.equal(nearestSelectableShip(positions,500,500),null);
});
