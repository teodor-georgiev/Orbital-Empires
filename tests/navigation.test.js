import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../modules/styles/cinematic-ui.css', import.meta.url), 'utf8');
const app = readFileSync(new URL('../app.js', import.meta.url), 'utf8');

test('every strategy tab keeps a usable title when compact navigation hides text', () => {
  for (const id of ['system', 'colonies', 'research', 'traditions', 'policies', 'military', 'diplomacy', 'intel']) {
    assert.match(html, new RegExp('<button data-nav="' + id + '"[^>]*title="[^"]+"'));
  }
});

test('phone navigation shows labels and reveals the chosen inspector', () => {
  assert.match(css, /@media\(max-width:750px\)/);
  assert.match(css, /\.sidebar \.game-nav\{[^}]*overflow-x:auto/);
  assert.match(css, /\.sidebar \.game-nav \.nav-link\{[^}]*font-size:11px!important/);
  assert.match(app, /activePage=nav\.dataset\.nav;render\(\);if\(window\.matchMedia\('\(max-width:750px\)'\)\.matches\)\$\('#inspector'\)\.scrollIntoView/);
});
