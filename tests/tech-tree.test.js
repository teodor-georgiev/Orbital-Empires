import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { TECHS, generateGame } from '../core.js';
import { buildTechTree } from '../modules/ui/tech-tree-model.js';
import { techImagePath, techTreeLayout, renderTechTree } from '../modules/ui/tech-tree.js';
import { renderDevelopment } from '../modules/ui/development-workspace.js';

// Node box size from the tech tree brief; layout must keep every box apart.
const NODE_W = 220;
const NODE_H = 84;
const CROSS_LINKS = ['fusion-grid→civic-administration', 'stellar-survey→culture-networks', 'stellar-survey→quantum-labs'];

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const game = () => generateGame({ seed: 'TECH-TREE-VIEW', size: 60, opponents: 2 });
const techNodeCount = html => (html.match(/class="progress-node tech-node[^"]*"/g) || []).length;
const linkCount = html => (html.match(/<path class="tech-link/g) || []).length;
const layoutOf = empire => techTreeLayout(buildTechTree(empire));

test('every technology renders exactly one illustrated tree node', () => {
  const markup = renderTechTree(game(), { icon: () => '' });
  assert.equal(techNodeCount(markup), TECHS.length);
  assert.equal((markup.match(/<section class="tech-lane"/g) || []).length, 6);
  for (const tech of TECHS) {
    assert.equal((markup.match(new RegExp('data-id="' + tech.id + '"', 'g')) || []).length, 1, tech.id);
    assert.ok(markup.includes('src="' + techImagePath(tech.id) + '"'), tech.id);
    assert.ok(markup.includes('aria-label="' + tech.name.replace(/"/g, '&quot;') + ', '), tech.name);
  }
  assert.equal(techImagePath('quantum-labs'), './assets/original/technologies/quantum-labs.svg');
});

test('every technology art file exists and is static local SVG', () => {
  for (const tech of TECHS) {
    const path = techImagePath(tech.id).replace(/^\.\//, '');
    const svg = read(path);
    assert.ok(svg.length > 400, tech.id);
    assert.match(svg, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/, tech.id);
    assert.doesNotMatch(svg, /<script|<foreignObject|xlink:href|href=["']https?:/i, tech.id);
  }
});

test('layout keeps every node box apart across all six lanes', () => {
  const layout = layoutOf(game().empires[0]);
  const ids = Object.keys(layout.positions);
  assert.equal(ids.length, TECHS.length);
  assert.ok(layout.width > 0 && layout.height > 0);
  for (let a = 0; a < ids.length; a += 1) {
    for (let b = a + 1; b < ids.length; b += 1) {
      const first = layout.positions[ids[a]];
      const second = layout.positions[ids[b]];
      const overlap = first.x < second.x + NODE_W && second.x < first.x + NODE_W &&
        first.y < second.y + NODE_H && second.y < first.y + NODE_H;
      assert.equal(overlap, false, ids[a] + ' overlaps ' + ids[b]);
    }
  }
  for (const lane of layout.lanes) {
    assert.ok(lane.height > 0, lane.branch);
    assert.equal(lane.complete, 0, lane.branch);
  }
});

test('prerequisite links are cubic curves and the three category crossings are flagged', () => {
  const economy = game().empires[0];
  const tree = buildTechTree(economy);
  const layout = techTreeLayout(tree);
  assert.equal(layout.links.length, tree.edges.length);
  const curve = /^M -?\d+(?:\.\d+)? -?\d+(?:\.\d+)? C -?\d+(?:\.\d+)? -?\d+(?:\.\d+)? -?\d+(?:\.\d+)? -?\d+(?:\.\d+)? -?\d+(?:\.\d+)? -?\d+(?:\.\d+)?$/;
  for (const link of layout.links) {
    assert.match(link.d, curve, link.from + '→' + link.to);
    const from = layout.positions[link.from];
    const to = layout.positions[link.to];
    const numbers = link.d.match(/-?\d+(?:\.\d+)?/g).map(Number);
    assert.deepEqual(numbers.slice(0, 2), [from.x + NODE_W, from.y + NODE_H / 2], link.from);
    assert.deepEqual(numbers.slice(-2), [to.x, to.y + NODE_H / 2], link.to);
    assert.equal(link.completed, false, link.from + '→' + link.to);
  }
  const crossings = layout.links.filter(link => link.crossCategory).map(link => link.from + '→' + link.to).sort();
  assert.deepEqual(crossings, CROSS_LINKS);

  const completed = layoutOf({ ...economy, techs: ['fusion-grid'], research: 'planetary-banking' });
  const finished = completed.links.find(link => link.from === 'fusion-grid' && link.to === 'civic-administration');
  assert.equal(finished.completed, true);
  const pending = completed.links.find(link => link.from === 'orbital-industry' && link.to === 'synthetic-smelting');
  assert.equal(pending.completed, false);
});

test('the Military filter shows only Military nodes and drops links to hidden technologies', () => {
  const military = TECHS.filter(tech => tech.branch === 'Military');
  const markup = renderTechTree(game(), { filter: 'Military' });
  assert.equal(techNodeCount(markup), military.length);
  assert.equal((markup.match(/<section class="tech-lane"/g) || []).length, 1);
  for (const tech of TECHS.filter(entry => entry.branch !== 'Military')) {
    assert.ok(!markup.includes('data-id="' + tech.id + '"'), tech.id);
  }
  // fleet-logistics → shield-matrix → capital-ships are the only edges with both ends visible.
  assert.equal(linkCount(markup), 2);
  // Tiers stay as computed by the full tree: capital-ships is still the third column.
  const x = 124 + 2 * (NODE_W + 32);
  assert.match(markup, new RegExp('data-id="capital-ships"[^>]*style="left:' + x + 'px'));
});

test('the selected node reports aria-pressed instead of relying on colour alone', () => {
  const markup = renderTechTree(game(), { selectedId: 'quantum-labs' });
  assert.match(markup, /data-id="quantum-labs" aria-pressed="true"/);
  assert.equal((markup.match(/aria-pressed="true"/g) || []).length, 1);
  assert.equal((markup.match(/aria-pressed="false"/g) || []).length, TECHS.length - 1);
});

test('the research page mounts the tree board with live icons and the detail art', () => {
  const markup = renderDevelopment(game(), 'research');
  assert.match(markup, /class="progress-board tech-board"/);
  assert.equal(techNodeCount(markup), TECHS.length);
  assert.match(markup, /class="tech-node-status"><svg class="progress-vector"/);
  assert.match(markup, /<img class="tech-detail-art" src="\.\/assets\/original\/technologies\/[a-z-]+\.svg" alt="" width="104" height="104">/);
});

test('traditions and policies keep their existing cards without tree nodes', () => {
  const fresh = game();
  for (const page of ['traditions', 'policies']) {
    const markup = renderDevelopment(fresh, page);
    assert.doesNotMatch(markup, /tech-node/, page);
    assert.doesNotMatch(markup, /tech-tree/, page);
    assert.match(markup, /class="progress-board"/, page);
  }
});

test('offline shell and HTML expose the tree module, stylesheet and all art', () => {
  const worker = read('sw.js');
  const html = read('index.html');
  for (const file of ['./modules/ui/tech-tree.js', './modules/styles/tech-tree.css', './modules/ui/tech-tree-model.js']) {
    assert.ok(worker.includes(file), file);
  }
  for (const tech of TECHS) assert.ok(worker.includes(techImagePath(tech.id)), tech.id);
  assert.ok(html.includes('modules/styles/tech-tree.css'));
  assert.ok(html.indexOf('modules/styles/tech-tree.css') > html.indexOf('modules/styles/4x-command.css'));
});
