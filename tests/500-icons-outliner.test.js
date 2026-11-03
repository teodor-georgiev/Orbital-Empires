import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { generateGame, TECHS, TRADITIONS, POLICIES } from '../core.js';
import { developmentItemIconKey, renderDevelopment } from '../modules/ui/development-workspace.js';
import { renderStrategicOutliner, strategicOutlinerData } from '../modules/ui/strategic-outliner.js';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const atlas = read('assets/ui/empire-icon-atlas.svg');
const catalog = JSON.parse(read('assets/ui/empire-icon-catalog.json'));
const symbols = [...atlas.matchAll(/<symbol id="([a-z0-9-]+)" viewBox="0 0 32 32">/g)].map(match => match[1]);
const names = new Set(symbols);

test('500 distinct meaningful SVG icons are organized in 25 real gameplay domains', () => {
  assert.equal(catalog.icons.length, 500);
  assert.equal(symbols.length, 500);
  assert.equal(names.size, 500);
  assert.equal(catalog.categories.length, 25);
  assert.equal(new Set(catalog.categories).size, 25);
  for (const cat of catalog.categories) assert.equal(catalog.icons.filter(icon => icon.category === cat).length, 20, cat);
  for (const icon of catalog.icons) {
    assert.ok(icon.label.length >= 3);
    assert.ok(names.has(icon.id), icon.id);
    assert.match(icon.id, /^[a-z0-9-]+$/);
  }
  assert.doesNotMatch(atlas, /<script\b|<foreignObject\b|onload\s*=|href=["']https?:/i);
});

test('every live technology tradition and policy renders its own specific atlas symbol', () => {
  const game = generateGame({ seed:'ICON-COVERAGE', size:60, opponents:2 });
  for (const [page,items] of [['research',TECHS],['traditions',TRADITIONS],['policies',POLICIES]]) {
    const html = renderDevelopment(game, page);
    for (const item of items) {
      const icon = developmentItemIconKey(page,item.id);
      assert.ok(icon, page+' '+item.id);
      assert.ok(names.has(icon), icon);
      assert.ok(html.includes('empire-icon-atlas.svg#'+icon), icon);
    }
  }
});

test('strategic outliner is data-backed and links to real existing commands', () => {
  const game = generateGame({ seed:'OUTLINER-TEST',size:60,opponents:2 });
  const snapshot = JSON.stringify(game);
  const data = strategicOutlinerData(game);
  const view = renderStrategicOutliner(game,game.empires[0].home,null);
  assert.ok(data.colonies.length>0);
  assert.equal(data.fleets.length,game.fleets.filter(fleet=>fleet.owner===0).length);
  assert.match(view, /data-nav="research"/);
  assert.match(view, /data-nav="traditions"/);
  assert.match(view, /data-action="select-system"/);
  assert.match(view, /data-action="select-fleet"/);
  assert.match(view, /empire-icon-atlas\.svg#colonization-homeworld/);
  assert.match(view, /empire-icon-atlas\.svg#ships-corvette/);
  assert.match(view, /aria-label="Select/);
  assert.equal(JSON.stringify(game), snapshot, 'rendering never mutates game state');
});

test('atlas, catalog, searchable visual gallery and outliner are wired to HTML and PWA', () => {
  const html=read('index.html'), worker=read('sw.js'), app=read('app.js'), css=read('modules/styles/4x-command.css');
  const gallery=read('assets/ui/empire-icon-gallery.html');
  assert.match(html,/id="strategic-outliner"/);
  assert.match(html,/modules\/styles\/4x-command\.css/);
  assert.match(app,/renderStrategicOutliner\(game,selectedId,selectedFleetId\)/);
  assert.match(app,/function buildingArt\(/);
  assert.match(gallery, /data-category="technology"/);
  assert.match(gallery, /data-group="all"/);
  assert.equal((gallery.match(/class="token"/g)||[]).length,500);
  for(const path of [
    './assets/ui/empire-icon-atlas.svg','./assets/ui/empire-icon-catalog.json','./assets/ui/empire-icon-gallery.html',
    './modules/styles/4x-command.css','./modules/ui/strategic-outliner.js'
  ]) assert.ok(worker.includes(path),path);
  assert.match(css, /@media\(max-width:1020px\)\{\.strategic-outliner\{display:none!important\}\}/);
});
