import test from 'node:test';
import assert from 'node:assert/strict';
import { TECHS, availableTechs, generateGame } from '../core.js';
import { planResearchUnlocks } from '../modules/research/prerequisite-plan.js';

test('a multi-branch technology requires both branches in deterministic order', () => {
  const researched = [];
  const before = JSON.stringify({ researched, catalog: TECHS });
  assert.deepEqual(planResearchUnlocks(TECHS, researched, 'civic-administration'), [
    'stellar-survey', 'culture-networks', 'fusion-grid', 'civic-administration'
  ]);
  assert.deepEqual(planResearchUnlocks(TECHS, researched, 'capital-ships'), [
    'fleet-logistics', 'shield-matrix', 'capital-ships'
  ]);
  assert.equal(JSON.stringify({ researched, catalog: TECHS }), before);
});

test('already researched prerequisites are excluded and shared dependencies are not repeated', () => {
  assert.deepEqual(
    planResearchUnlocks(TECHS, ['stellar-survey', 'fusion-grid'], 'civic-administration'),
    ['culture-networks', 'civic-administration']
  );
  assert.deepEqual(planResearchUnlocks(TECHS, ['fusion-grid'], 'fusion-grid'), []);
  assert.deepEqual(planResearchUnlocks(TECHS, [], 'fusion-grid'), ['fusion-grid']);

  const catalog = [
    { id: 'root', prereqs: [] },
    { id: 'left', prereqs: ['root'] },
    { id: 'right', prereqs: ['root'] },
    { id: 'target', prereqs: ['left', 'right'] }
  ];
  assert.deepEqual(planResearchUnlocks(catalog, [], 'target'), [
    'root', 'left', 'right', 'target'
  ]);
});

test('planned steps agree with authoritative availability and can be researched in sequence', () => {
  const game = generateGame({ seed: 'TECH-PATH-AUDIT', size: 48, opponents: 2 });
  const sets = [[], ['orbital-industry'], ['stellar-survey', 'fleet-logistics']];
  for (const researched of sets) {
    const empire = { ...game.empires[0], techs: researched };
    const available = new Set(availableTechs(empire).map(t => t.id));
    for (const tech of TECHS) {
      const plan = planResearchUnlocks(TECHS, researched, tech.id);
      assert.equal(plan.length === 1 && plan[0] === tech.id, available.has(tech.id), tech.id);
      const achieved = new Set(researched);
      for (const nextId of plan) {
        const next = TECHS.find(t => t.id === nextId);
        assert.ok(next.prereqs.every(id => achieved.has(id)), nextId + ' must be researchable next');
        assert.ok(!achieved.has(nextId), nextId + ' must not be duplicated');
        achieved.add(nextId);
      }
      assert.ok(achieved.has(tech.id));
    }
  }
});

test('unknown targets, missing prereqs, duplicate IDs and cycles fail closed', () => {
  assert.throws(() => planResearchUnlocks(TECHS, [], 'not-a-tech'), RangeError);
  assert.throws(() => planResearchUnlocks([{ id: 'a', prereqs: ['missing'] }], [], 'a'), RangeError);
  assert.throws(() => planResearchUnlocks([
    { id: 'a', prereqs: [] }, { id: 'a', prereqs: [] }
  ], [], 'a'), RangeError);
  assert.throws(() => planResearchUnlocks([
    { id: 'a', prereqs: ['b'] }, { id: 'b', prereqs: ['a'] }
  ], [], 'a'), RangeError);
  assert.throws(() => planResearchUnlocks([
    { id: 'a', prereqs: ['a'] }
  ], [], 'a'), RangeError);
});

test('invalid ownership and malformed catalogs cannot silently unlock technology', () => {
  assert.throws(() => planResearchUnlocks(TECHS, ['unknown'], 'fusion-grid'), RangeError);
  assert.throws(() => planResearchUnlocks(TECHS, 'stellar-survey', 'fusion-grid'), TypeError);
  assert.throws(() => planResearchUnlocks([], [], 'fusion-grid'), RangeError);
  assert.throws(() => planResearchUnlocks([
    { id: 'a', prereqs: 'b' }, { id: 'b', prereqs: [] }
  ], [], 'a'), TypeError);
});
