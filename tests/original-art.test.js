import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';

const root = new URL('../assets/original/', import.meta.url);
const catalog = JSON.parse(await readFile(new URL('catalog.json', root), 'utf8'));

test('art registry lists 18 unique project-created assets across four categories', () => {
  assert.equal(catalog.schemaVersion, 1);
  assert.equal(catalog.assets.length, 18);
  assert.equal(new Set(catalog.assets.map(item => item.id)).size, 18);
  for (const [category, count] of Object.entries({ships:5,planets:6,stations:3,emblems:4})) {
    assert.equal(catalog.assets.filter(item => item.category === category).length, count, category);
  }
});

test('all original sprites are readable transparent SVG documents with no external assets', async () => {
  for (const asset of catalog.assets) {
    assert.ok(asset.path.startsWith('./' + asset.category + '/'), asset.path);
    assert.ok(asset.path.endsWith('.svg') && !asset.path.includes('..'), asset.path);
    const fileURL = new URL(asset.path, root);
    const svg = await readFile(fileURL, 'utf8');
    assert.ok((await stat(fileURL)).size > 400, asset.id);
    assert.ok(svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg"'), asset.id);
    assert.ok(svg.includes('<title>') && svg.includes('</svg>'), asset.id);
    const other = svg.replaceAll('http://www.w3.org/2000/svg', '');
    assert.ok(!other.includes('http://') && !other.includes('https://'), asset.id);
    assert.ok(!svg.toLowerCase().includes('<script') && !svg.toLowerCase().includes('<foreignobject'), asset.id);
    assert.equal(asset.source, 'project-original');
  }
});
