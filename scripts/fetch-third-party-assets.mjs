/**
 * Download pinned, permissively licensed assets to a local, gitignored staging folder.
 * Neither the game engine nor production hosting uses these assets automatically.
 * Node.js 22+; no npm dependencies required.
 */
import { createHash } from 'node:crypto';
import { mkdir, rename, rm, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ASSET_SOURCES = Object.freeze([
  Object.freeze({
    id: 'kenney-space-kit', name: 'Kenney Space Kit', version: '1.0', license: 'CC0-1.0',
    url: 'https://kenney.nl/media/pages/assets/space-kit/20874c75ac-1677698978/kenney_space-kit.zip',
    file: 'kenney/kenney_space-kit.zip', format: 'zip', maxBytes: 15_000_000,
  }),
  Object.freeze({
    id: 'kenney-simple-space', name: 'Kenney Simple Space', version: '1.0', license: 'CC0-1.0',
    url: 'https://kenney.nl/media/pages/assets/simple-space/b9b0968a6b-1677578143/kenney_simple-space.zip',
    file: 'kenney/kenney_simple-space.zip', format: 'zip', maxBytes: 2_000_000,
  }),
  Object.freeze({
    id: 'pixijs', name: 'PixiJS', version: '8.22.0', license: 'MIT',
    url: 'https://cdn.jsdelivr.net/npm/pixi.js@8.22.0/dist/pixi.min.mjs',
    file: 'pixijs/pixi.min.mjs', format: 'js', maxBytes: 6_000_000,
  }),
  Object.freeze({
    id: 'kenney-planets', name: 'Kenney Planets', version: '1.0', license: 'CC0-1.0',
    // Kenney's own upload to OpenGameArt, with separate CC0 listing and download.
    url: 'https://opengameart.org/sites/default/files/kenney_planets.zip',
    file: 'kenney/kenney_planets.zip', format: 'zip', maxBytes: 12_000_000,
  }),
  Object.freeze({
    id: 'kenney-sci-fi-rts', name: 'Kenney Sci-Fi RTS', version: '1.0', license: 'CC0-1.0',
    // Kenney's own upload to OpenGameArt, under CC0.
    url: 'https://opengameart.org/sites/default/files/kenney_rtssci-fi.zip',
    file: 'kenney/kenney_rtssci-fi.zip', format: 'zip', maxBytes: 5_000_000,
  }),
]);
const DEFAULT_DESTINATION = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'vendor');
const hasExpectedFormat = (data, format) => format === 'zip'
  ? data.length >= 4 && data.subarray(0, 4).equals(Buffer.from([0x50, 0x4b, 0x03, 0x04]))
  : data.length > 100 && !data.subarray(0, 1024).toString('utf8').toLowerCase().includes('<!doctype html');

async function fetchBytes(source, fetcher) {
  const response = await fetcher(source.url, { redirect: 'follow', signal: AbortSignal.timeout(45_000) });
  if (!response.ok) throw new Error(`${source.id}: HTTP ${response.status}`);
  if (response.url) {
    const target = new URL(response.url), expected = new URL(source.url);
    if (target.protocol !== 'https:' || target.hostname !== expected.hostname) {
      throw new Error(`${source.id}: unexpected redirect destination ${target.hostname}`);
    }
  }
  const advertisedSize = Number(response.headers?.get('content-length') ?? 0);
  if (advertisedSize > source.maxBytes) throw new Error(`${source.id}: declared download exceeds size limit`);
  const reader = response.body?.getReader();
  if (!reader) throw new Error(`${source.id}: missing response stream`);
  let count = 0;
  const chunks = [];
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      count += value.byteLength;
      if (count > source.maxBytes) throw new Error(`${source.id}: download exceeds size limit`);
      chunks.push(Buffer.from(value));
    }
  } finally {
    await reader.cancel().catch(() => {});
  }
  const result = Buffer.concat(chunks);
  if (!hasExpectedFormat(result, source.format)) throw new Error(`${source.id}: unexpected file signature`);
  return result;
}

export async function downloadThirdPartyAssets({ destination = DEFAULT_DESTINATION, fetcher = fetch, sources = ASSET_SOURCES } = {}) {
  const root = resolve(destination);
  const entries = [];
  for (const source of sources) {
    if (source.file.startsWith('/') || source.file.split('/').some(part => !part || part === '..' || part === '.')) {
      throw new Error(`Unsafe asset destination: ${source.file}`);
    }
    const output = resolve(root, source.file);
    if (!output.startsWith(`${root}/`) && !output.startsWith(`${root}\\`)) throw new Error('Asset destination escaped root');
    const bytes = await fetchBytes(source, fetcher);
    const sha256 = createHash('sha256').update(bytes).digest('hex');
    await mkdir(dirname(output), { recursive: true });
    const staged = `${output}.tmp`;
    try {
      await writeFile(staged, bytes);
      await rename(staged, output);
    } finally {
      await rm(staged, { force: true });
    }
    entries.push({
      id: source.id, name: source.name, version: source.version, license: source.license,
      source: source.url, path: source.file, bytes: bytes.length, sha256,
    });
    console.log(`Downloaded ${source.name} ${source.version} (${(bytes.length / 1024).toFixed(1)} KiB; SHA-256 ${sha256.slice(0, 12)}...)`);
  }
  await mkdir(root, { recursive: true });
  await writeFile(join(root, 'manifest.json'), JSON.stringify({ schemaVersion: 1, assets: entries }, null, 2) + '\n');
  return entries;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  downloadThirdPartyAssets().catch(error => {
    console.error(`Asset download failed: ${error.message}`);
    console.error('Game runtime files were not changed. Check internet access and retry npm run assets:fetch.');
    process.exitCode = 1;
  });
}
