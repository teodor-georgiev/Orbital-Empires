import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = new URL('../assets/original/', import.meta.url);
const catalog = JSON.parse(await readFile(new URL('catalog.json', root), 'utf8'));

test('original art catalog includes four complete game categories', () => {
  assert.equal(catalog.schemaVersion, 1);
  assert.equal(catalog.assets.length, 18);
  assert.deepEqual(new Set(catalog.assets.map(a => a.category)), new Set(['ships','planets','stations','emblems']));
  assert.equal(new Set(catalog.assets.map(a=>a.id)).size, catalog.assets.length);
});

test('original art vector files exist, are editable SVG and have no remote dependencies', async () => {
  for (const asset of catalog.assets) {
    assert.match(asset.path, /^\\.\\/[a-z-]+\\/[a-z-]+\\.svg$/);
    const url = new URL(asset.path, root);
    const file = await readFile(url, 'utf8');
    assert.ok((await stat(url)).size > 400, asset.id);
    assert.match(file, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
    assert.ok(file.includes('<title>') && file.includes('</svg>'), asset.id);
    assert.doesNotMatch(file, /<script|<foreignObject|https?:\\/\\/(?!www\\.w3\\.org\\/2000\\/svg)/i, asset.id);
    assert.equal(asset.source, 'project-original');
  }
});
