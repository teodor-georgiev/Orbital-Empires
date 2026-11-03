import test from 'node:test';
import assert from 'node:assert/strict';
import { generateGame, adoptTradition, enactPolicy } from '../core.js';
import { TECHS, TRADITIONS, POLICIES } from '../core.js';
import { isDevelopmentPage, developmentItems, developmentStatus, developmentGroups, renderDevelopment } from '../modules/ui/development-workspace.js';

test('one reusable viewer serves technology, traditions and policies with working action names', () => {
  const game = generateGame({ seed: 'PROGRESS-HUB', size: 60, opponents: 2 });
  assert.deepEqual(['research', 'traditions', 'policies'].map(isDevelopmentPage), [true, true, true]);
  assert.equal(isDevelopmentPage('galaxy'), false);
  for (const [page, source, action] of [
    ['research', TECHS, 'research'],
    ['traditions', TRADITIONS, 'adopt-tradition'],
    ['policies', POLICIES, 'enact-policy']
  ]) {
    const markup = renderDevelopment(game, page);
    assert.equal(developmentItems(page), source);
    assert.match(markup, /Empire Development/);
    assert.match(markup, /role="tablist"/);
    assert.match(markup, /data-nav="research"/);
    assert.match(markup, /data-nav="traditions"/);
    assert.match(markup, /data-nav="policies"/);
    assert.match(markup, /data-action="select-development"/);
    assert.match(markup, new RegExp('data-action="' + action + '"'));
    assert.match(markup, /data-nav="system"/);
    assert.ok(developmentGroups(page).length > 1);
  }
});

test('prerequisites, costs, disabled buttons and eligibility are honest to the game', () => {
  const game = generateGame({ seed: 'PROGRESS-LOCKED' });
  const empire = game.empires[0];
  const locked = TRADITIONS.find(t => t.id === 'pathfinders');
  assert.deepEqual(developmentStatus(game, 'traditions', locked).missing, ['frontier-spirit']);
  const lockedMarkup = renderDevelopment(game, 'traditions', 'pathfinders');
  assert.match(lockedMarkup, /Unlock Frontier Spirit first/);
  assert.match(lockedMarkup, /data-action="adopt-tradition" data-id="pathfinders" disabled/);
  empire.unity = 200;
  assert.equal(adoptTradition(game, 'frontier-spirit').ok, true);
  assert.equal(developmentStatus(game, 'traditions', locked).ready, true);
  assert.match(renderDevelopment(game, 'traditions', 'pathfinders'), /data-action="adopt-tradition" data-id="pathfinders"/);
  assert.match(renderDevelopment(game, 'traditions', 'frontier-spirit'), /Already unlocked/);
});

test('changing a policy communicates which mutually-exclusive policy will be replaced', () => {
  const game = generateGame();
  assert.equal(enactPolicy(game, 'open-markets').ok, true);
  const next = POLICIES.find(p => p.id === 'directed-industry');
  assert.equal(developmentStatus(game, 'policies', next).ready, true);
  const view = renderDevelopment(game, 'policies', 'directed-industry', 'Economy');
  assert.match(view, /Replaces Open Markets/);
  assert.match(view, /data-filter="Economy"/);
  assert.doesNotMatch(view, /data-id="academic-freedom"/);
});

test('research view communicates active project and keeps locked research choices inspectable', () => {
  const game = generateGame();
  const active = TECHS.find(t => t.id === game.empires[0].research);
  const markup = renderDevelopment(game, 'research');
  if (active) assert.match(markup, new RegExp('Currently researching ' + active.name));
  const locked = TECHS.find(t => t.prereqs.length && !t.prereqs.every(id => game.empires[0].techs.includes(id)));
  assert.equal(developmentStatus(game, 'research', locked).ready, false);
  const focus = renderDevelopment(game, 'research', locked.id, locked.branch);
  assert.match(focus, /Requires prerequisite/);
  assert.match(focus, new RegExp('data-id="' + locked.id + '" aria-pressed="true"'));
  assert.match(focus, new RegExp('data-action="research" data-id="' + locked.id + '" disabled'));
});

test('offline PWA keeps the unified viewer and stylesheet available without a network', async () => {
  const { readFileSync } = await import('node:fs');
  const sw = readFileSync(new URL('../sw.js', import.meta.url), 'utf8');
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(sw, /modules\/ui\/development-workspace\.js/);
  assert.match(sw, /modules\/styles\/command-workspace\.css/);
  assert.match(html, /id="progress-workspace"/);
  assert.match(html, /modules\/styles\/command-workspace\.css/);
});
