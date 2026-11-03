import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ASSET_SOURCES, downloadThirdPartyAssets } from '../scripts/fetch-third-party-assets.mjs';

const zip = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x00, 0x00]);
const js = Buffer.from('// Offline test placeholder, not PixiJS source\n' + 'export const value=1;'.repeat(9));
const mock = async url => {
  const bytes = url.endsWith('.zip') ? zip : js;
  return new Response(bytes, { status: 200, headers: { 'content-length': String(bytes.length) } });
};

test('all sources are pinned to HTTPS and declare licenses', () => {
  assert.equal(ASSET_SOURCES.length, 5);
  assert.deepEqual(ASSET_SOURCES.map(s => s.license), ['CC0-1.0', 'CC0-1.0', 'MIT', 'CC0-1.0', 'CC0-1.0']);
  assert.ok(ASSET_SOURCES.every(s => new URL(s.url).protocol === 'https:'));
  assert.equal(ASSET_SOURCES[2].version, '8.22.0');
});

test('valid content is saved only below the requested directory with digest inventory', async () => {
  const root = await mkdtemp(join(tmpdir(), 'oe-assets-'));
  try {
    const entries = await downloadThirdPartyAssets({ destination: root, fetcher: mock });
    assert.equal(entries.length, 5);
    for (const e of entries) {
      assert.equal((await stat(join(root, e.path))).size, e.bytes);
      assert.match(e.sha256, /^[a-f0-9]{64}$/);
    }
    const manifest = JSON.parse(await readFile(join(root, 'manifest.json'), 'utf8'));
    assert.equal(manifest.assets.length, 5);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('malformed responses and oversized downloads are refused', async () => {
  const root = await mkdtemp(join(tmpdir(), 'oe-assets-'));
  try {
    const source = ASSET_SOURCES[2];
    await assert.rejects(
      downloadThirdPartyAssets({ destination: root, sources: [source], fetcher: async () => new Response('<!DOCTYPE html>error'.repeat(20)) }),
      /signature/,
    );
    await assert.rejects(
      downloadThirdPartyAssets({ destination: root, sources: [{ ...source, maxBytes: 2 }], fetcher: mock }),
      /size limit/,
    );
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('path traversal is always rejected', async () => {
  const root = await mkdtemp(join(tmpdir(), 'oe-assets-'));
  try {
    await assert.rejects(
      downloadThirdPartyAssets({ destination: root, sources: [{ ...ASSET_SOURCES[0], file: '../outside.zip' }], fetcher: mock }),
      /Unsafe asset/,
    );
  } finally { await rm(root, { recursive: true, force: true }); }
});
