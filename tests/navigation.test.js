import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../modules/styles/government.css', import.meta.url), 'utf8');
const app = readFileSync(new URL('../app.js', import.meta.url), 'utf8');

test('all nine strategy sections have discoverable names and title tooltips', () => {
  for (const id of ['system', 'colonies', 'research', 'traditions', 'policies', 'government', 'military', 'diplomacy', 'intel']) {
    assert.match(html, new RegExp('<button data-nav="'+id+'"[^>]*title="[^"]+"'));
  }
  assert.match(html, /EMPIRE COMMAND <span>09<\/span>/);
});

test('government stays reachable on mobile in the planet-command navigation grid', () => {
  assert.match(css, /@media\(max-width:750px\)/);
  assert.match(css, /\.sidebar \.game-nav\{grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
  assert.match(app, /activePage=nav\.dataset\.nav;render\(\);if\(window\.matchMedia\('\(max-width:750px\)'\)\.matches\)\$\('#inspector'\)\.scrollIntoView/);
});
