import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { generateGame } from '../core.js';
import { developmentIconKey, developmentGroups, renderDevelopment } from '../modules/ui/development-workspace.js';

const read = file => readFileSync(new URL('../' + file, import.meta.url), 'utf8');
const sprite = read('assets/ui/strategy-icons.svg');
const identifiers = [...sprite.matchAll(/<symbol id="([a-z-]+)" viewBox="0 0 24 24">/g)].map(hit => hit[1]);
const ids = new Set(identifiers);
const referenced = html => [...html.matchAll(/strategy-icons\.svg#([a-z-]+)/g)].map(hit => hit[1]);

test('31 distinct original vector symbols follow the same grid and safe static format', () => {
  assert.equal(identifiers.length, 31);
  assert.equal(ids.size, identifiers.length);
  assert.match(sprite, /xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
  assert.doesNotMatch(sprite, /<(?:script|foreignObject|image|iframe)\b/i);
  assert.doesNotMatch(sprite, /onload\s*=|href="https?:/i);
  for (const identifier of identifiers) assert.match(identifier, /^[a-z-]+$/);
});
test('all seven command sections and five economy resources have a matching local icon', () => {
  const html = read('index.html'), app = read('app.js');
  for (const name of ['galaxy','colonies','progress','government','fleets','diplomacy','intel']) {
    assert.ok(ids.has(name));
    assert.ok(html.includes('strategy-icons.svg#' + name), name);
  }
  for (const name of ['credits','alloys','science','influence','unity']) {
    assert.ok(ids.has(name));
    assert.ok(app.includes("'" + name + "'"), name);
  }
  assert.match(app, /strategy-icons/);
});
test('every technology branch, tradition track and policy slot renders a semantic vector icon', () => {
  const game = generateGame({ seed: 'STRATEGY-ICONS', size: 60 });
  for (const page of ['research','traditions','policies']) {
    const html = renderDevelopment(game, page);
    for (const group of developmentGroups(page)) {
      const key = developmentIconKey(page, group);
      assert.ok(ids.has(key), page + ': ' + group);
      assert.ok(html.includes('strategy-icons.svg#' + key), key);
    }
    for (const key of referenced(html)) assert.ok(ids.has(key), page + ' references missing icon ' + key);
    assert.ok(html.includes('strategy-icons.svg#state-'), 'Progress nodes must use icons for states');
    assert.match(html, /aria-hidden="true"/);
    assert.match(html, /<svg class="progress-tab-vector"/);
  }
});
test('visual gallery and offline service-worker cache cover all new game icons', () => {
  const gallery = read('assets/ui/gallery.html');
  const worker = read('sw.js');
  const css = read('modules/styles/command-workspace.css');
  for (const name of identifiers) assert.ok(gallery.includes('strategy-icons.svg#' + name), name);
  assert.ok(worker.includes('./assets/ui/strategy-icons.svg'));
  assert.ok(worker.includes('./assets/ui/gallery.html'));
  assert.ok(css.includes('.progress-detail-vector'));
  assert.ok(css.includes('.progress-tab-vector'));
});
