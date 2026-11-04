import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { generateGame, income, canQueueFleetRoute, TECHS } from '../core.js';
import { renderDevelopment, monthLabel } from '../modules/ui/development-workspace.js';
import { renderStrategicOutliner } from '../modules/ui/strategic-outliner.js';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const TURN_PHRASES = [
  [/\/turn\b/i, '"/turn"'],
  [/\bper turn\b/i, '"per turn"'],
  [/\beach turn\b/i, '"each turn"'],
  [/\bnext turn\b/i, '"next turn"'],
  [/\bthis turn\b/i, '"this turn"'],
  [/\bend turn\b/i, '"end turn"']
];

function assertRealTime(text, label) {
  for (const [pattern, phrase] of TURN_PHRASES) {
    assert.doesNotMatch(text, pattern, `${label} still shows ${phrase}`);
  }
  assert.doesNotMatch(text, /cycle/i, `${label} still shows "cycle"`);
}

test('the app shell shows a stardate instead of a cycle counter', () => {
  const html = read('index.html');
  assertRealTime(html, 'index.html');
  assert.match(html, /id="top-turn"[^>]*>STARDATE 2200\.01</);
  assert.match(html, /1×/, 'speed buttons stay visible');
  assert.match(html, /\+1M/, 'one-month step control stays visible');
});

test('rendered development and outliner views speak only in months', () => {
  const game = generateGame({ seed: 'REALTIME-WORDING', size: 60, opponents: 2 });
  for (const page of ['research', 'traditions', 'policies']) {
    assertRealTime(renderDevelopment(game, page), `renderDevelopment(${page})`);
  }
  assert.match(renderDevelopment(game, 'research'), /SCIENCE \/ MONTH/);
  assertRealTime(renderStrategicOutliner(game, game.empires[0].home, null), 'renderStrategicOutliner');
  assert.match(renderStrategicOutliner(game, game.empires[0].home, null), /Unity · \+\d+\/month/);
});

test('month counts use the singular for one month and the plural otherwise', () => {
  assert.equal(monthLabel(1), '1 month');
  assert.equal(monthLabel(2), '2 months');
  assert.equal(monthLabel(0), '0 months');
  assert.equal(monthLabel(1, true), '1 MONTH');
  assert.equal(monthLabel(4, true), '4 MONTHS');

  const game = generateGame({ seed: 'REALTIME-WORDING', size: 60, opponents: 2 });
  const empire = game.empires[0];
  const tech = TECHS.find(item => item.id === empire.research);
  const science = income(game).science;
  assert.ok(science > 0, 'starting empire generates science');

  empire.progress = Math.max(0, tech.cost - science);
  const oneMonth = renderDevelopment(game, 'research', tech.id);
  assert.match(oneMonth, /Estimated time<\/span><b>1 month<\/b>/);
  assert.doesNotMatch(oneMonth, /1 months/);

  empire.progress = 0;
  const manyMonths = renderDevelopment(game, 'research', tech.id);
  const expected = Math.ceil(tech.cost / science);
  assert.match(manyMonths, new RegExp('Estimated time</span><b>' + expected + ' months</b>'));
});

test('a one-month fleet route is labelled "1 month"', () => {
  const game = generateGame({ seed: 'REALTIME-WORDING', size: 60, opponents: 2 });
  const fleet = game.fleets.find(item => item.owner === 0);
  const target = game.systems[fleet.system].neighbors.map(id => game.systems[id])
    .find(system => canQueueFleetRoute(game, fleet.id, system.id).ok);
  assert.ok(target, 'home system offers a reachable neighbour');
  const plan = canQueueFleetRoute(game, fleet.id, target.id);
  assert.equal(plan.ok, true);
  assert.equal(plan.months, 1);
  assert.equal(monthLabel(plan.months), '1 month');

  const app = read('app.js');
  assert.match(app, /ETA \$\{monthLabel\(x\.plan\.months\)\}/, 'route buttons render the shared month label');
  assert.doesNotMatch(app, /MONTHS (LEFT|REMAINING)/, 'uppercase month labels pluralise correctly');
});

test('the in-game guide explains the real-time clock instead of ending turns', () => {
  const app = read('app.js');
  const guide = app.slice(app.indexOf("type==='guide'"), app.indexOf("type==='turn'"));
  assert.match(guide, /Months pass automatically/);
  assert.match(guide, /Pause/);
  assert.match(guide, /1× \/ 3× \/ 8×/);
  assert.match(guide, /\+1M/);
  assert.match(guide, /one month while paused/);
  assert.doesNotMatch(guide, /\b[Ee]nd [Tt]urn\b/);
  assertRealTime(guide, 'guide modal');
});

test('exported saves are named by month and loading does not depend on the file name', () => {
  const app = read('app.js');
  assert.match(app, /orbital-empires-save-month-/);
  assert.doesNotMatch(app, /save-cycle-/);
  const loadGame = app.slice(app.indexOf('function loadGame()'), app.indexOf('function persist()'));
  assert.match(loadGame, /localStorage\.getItem\(SAVE_KEY\)/);
  assert.doesNotMatch(loadGame, /save-month|\.json/);
});
