import test from 'node:test';
import assert from 'node:assert/strict';
import { TECHS, generateGame } from '../core.js';
import { TECH_CATEGORY_ORDER, techTier, buildTechTree } from '../modules/ui/tech-tree-model.js';

const realEmpire = (overrides = {}) => {
  const game = generateGame({ seed: 'TECH-TREE', size: 60, opponents: 2 });
  return { ...game.empires[0], techs: [], research: null, ...overrides };
};

test('category order is frozen and canonical', () => {
  assert.deepEqual([...TECH_CATEGORY_ORDER], ['Science', 'Exploration', 'Economy', 'Industry', 'Military', 'Civics']);
  assert.equal(Object.isFrozen(TECH_CATEGORY_ORDER), true);
});

test('every technology appears exactly once in the tree', () => {
  const tree = buildTechTree(realEmpire());
  const ids = tree.categories.flatMap(category => category.nodes.map(node => node.id));
  assert.equal(ids.length, TECHS.length);
  assert.equal(new Set(ids).size, TECHS.length);
  assert.deepEqual([...ids].sort(), TECHS.map(tech => tech.id).sort());
});

test('categories follow the canonical order and group nodes by tier', () => {
  const tree = buildTechTree(realEmpire());
  assert.deepEqual(tree.categories.map(category => category.branch), [...TECH_CATEGORY_ORDER]);
  assert.equal(tree.tiers, 3);
  for (const category of tree.categories) {
    const sorted = [...category.nodes].sort((a, b) => a.tier - b.tier || a.cost - b.cost || (a.id < b.id ? -1 : 1));
    assert.deepEqual(category.nodes.map(node => node.id), sorted.map(node => node.id));
    const maxRow = Math.max(...category.nodes.map(node => node.row));
    assert.equal(category.rows, maxRow + 1);
    for (const tier of new Set(category.nodes.map(node => node.tier))) {
      const rows = category.nodes.filter(node => node.tier === tier).map(node => node.row);
      assert.deepEqual(rows, rows.map((_, index) => index));
    }
  }
});

test('known technologies resolve their tier from prerequisites', () => {
  assert.equal(techTier('orbital-industry'), 0);
  assert.equal(techTier('synthetic-smelting'), 1);
  assert.equal(techTier('exotic-materials'), 2);
  assert.equal(techTier('capital-ships'), 2);
  assert.equal(techTier('civic-administration'), 2);
});

test('edges mark prerequisite crossings between categories', () => {
  const tree = buildTechTree(realEmpire());
  assert.equal(tree.edges.length, TECHS.reduce((total, tech) => total + tech.prereqs.length, 0));
  assert.deepEqual(
    tree.edges.find(edge => edge.from === 'stellar-survey' && edge.to === 'quantum-labs'),
    { from: 'stellar-survey', to: 'quantum-labs', crossCategory: true }
  );
  assert.deepEqual(
    tree.edges.find(edge => edge.from === 'orbital-industry' && edge.to === 'synthetic-smelting'),
    { from: 'orbital-industry', to: 'synthetic-smelting', crossCategory: false }
  );
});

test('a real empire produces completed, researching, available and locked nodes', () => {
  const empire = realEmpire({ techs: ['orbital-industry'], research: 'stellar-survey' });
  const tree = buildTechTree(empire);
  const stateOf = id => tree.categories.flatMap(category => category.nodes).find(node => node.id === id).state;
  assert.equal(stateOf('orbital-industry'), 'completed');
  assert.equal(stateOf('stellar-survey'), 'researching');
  assert.equal(stateOf('fusion-grid'), 'available');
  assert.equal(stateOf('quantum-labs'), 'locked');
  const states = new Set(tree.categories.flatMap(category => category.nodes.map(node => node.state)));
  assert.deepEqual([...states].sort(), ['available', 'completed', 'locked', 'researching']);
});

test('output is deterministic across calls', () => {
  const empire = realEmpire({ techs: ['orbital-industry', 'stellar-survey'], research: 'fusion-grid' });
  assert.deepEqual(buildTechTree(empire), buildTechTree(empire));
});

test('building the tree does not mutate the empire or the technology list', () => {
  const empire = realEmpire({ techs: ['orbital-industry'], research: 'stellar-survey' });
  const empireBefore = structuredClone(empire);
  const techsBefore = structuredClone(TECHS);
  buildTechTree(empire);
  assert.deepEqual(empire, empireBefore);
  assert.deepEqual(TECHS, techsBefore);
});

test('small lists reject cycles, unknown prerequisites and unknown ids', () => {
  const cyclic = [
    { id: 'a', name: 'A', branch: 'Science', cost: 1, prereqs: ['b'] },
    { id: 'b', name: 'B', branch: 'Science', cost: 1, prereqs: ['a'] }
  ];
  assert.throws(() => techTier('a', cyclic), /cycle/i);
  assert.throws(() => buildTechTree(realEmpire(), cyclic), /cycle/i);

  const brokenPrereq = [{ id: 'a', name: 'A', branch: 'Science', cost: 1, prereqs: ['ghost'] }];
  assert.throws(() => techTier('a', brokenPrereq), /unknown prerequisite/i);
  assert.throws(() => buildTechTree(realEmpire(), brokenPrereq), /unknown prerequisite/i);

  assert.throws(() => techTier('ghost'), /unknown technology/i);
  assert.throws(() => techTier('ghost', brokenPrereq), /unknown technology/i);
});

test('unlisted branches are appended alphabetically after canonical ones', () => {
  const techs = [
    { id: 'z', name: 'Zeta', branch: 'Zeta', cost: 3, prereqs: [] },
    { id: 'a', name: 'Alpha', branch: 'Alpha', cost: 1, prereqs: [] },
    { id: 's', name: 'Science', branch: 'Science', cost: 2, prereqs: [] }
  ];
  const tree = buildTechTree(realEmpire(), techs);
  assert.deepEqual(tree.categories.map(category => category.branch), ['Science', 'Alpha', 'Zeta']);
});
