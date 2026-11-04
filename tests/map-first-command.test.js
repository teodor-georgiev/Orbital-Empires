import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const text = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const html = text('index.html');
const sw = text('sw.js');

test('map-first command shell is loaded after existing visual layers and precached offline', () => {
  const path = 'modules/styles/map-first-command.css';
  assert.ok(existsSync(new URL('../' + path, import.meta.url)), 'map-first command styles exist');
  assert.match(html, /<link rel="stylesheet" href="modules\/styles\/map-first-command\.css"\s*\/>/);
  assert.ok(html.indexOf('modules/styles/map-first-command.css') > html.indexOf('modules/styles/command-workspace.css'), 'load final shell stylesheet after legacy module layout');
  assert.ok(sw.includes('./' + path), 'offline service worker includes new command shell');
  assert.match(sw, /const CACHE='orbital-empires-app-[^']*map-first/);
});

test('seven functional command destinations and the selected inspector stay accessible', () => {
  const destinations = ['system', 'colonies', 'research', 'government', 'military', 'diplomacy', 'intel'];
  for (const nav of destinations) {
    assert.match(html, new RegExp('data-nav="' + nav + '"'));
  }
  assert.match(html, /<nav class="game-nav" aria-label="Game sections"/);
  assert.match(html, /id="map-viewport"/);
  assert.match(html, /id="inspector"[^>]*aria-live="polite"/);
  assert.match(html, /data-action="clock-toggle"/);  // Real time replaced End Turn.
});

test('a single map-first layer defines the responsive command hierarchy', () => {
  const css = text('modules/styles/map-first-command.css');
  assert.match(css, /\.main-layout\s*\{/);
  assert.match(css, /\.map-top\s*\{/);
  assert.match(css, /\.map-viewport\s*\{/);
  assert.match(css, /\.inspector\s*\{/);
  assert.match(css, /@media\s*\(max-width:\s*750px\)/);
  assert.match(css, /#progress-workspace\[hidden\]\s*\{\s*display:\s*none\s*!important/);
  assert.match(css, /prefers-reduced-motion/);
});
