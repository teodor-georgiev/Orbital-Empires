import { TECHS, TRADITIONS, POLICIES, income, traditionCost, unityIncome } from '../../core.js';

// A single, state-driven presentation for three existing progression systems.
// All purchases and research assignments continue to use core.js actions.
const PAGES = {
  research: { title: 'Technology', summary: 'Discover new capabilities and follow the prerequisites that lead to them.', noun: 'technology', verb: 'Set research focus', groups: 'branch' },
  traditions: { title: 'Traditions', summary: 'Shape your empire with lasting cultural choices funded by Unity.', noun: 'tradition', verb: 'Adopt tradition', groups: 'track' },
  policies: { title: 'Policies', summary: 'Choose one active policy per area. Changing a policy costs 20 Influence.', noun: 'policy', verb: 'Enact policy', groups: 'slot' }
};
const PAGE_ORDER = ['research', 'traditions', 'policies'];
const ITEMS = { research: TECHS, traditions: TRADITIONS, policies: POLICIES };
const ACTIONS = { research: 'research', traditions: 'adopt-tradition', policies: 'enact-policy' };
const PAGE_ICONS = { research: 'research', traditions: 'traditions', policies: 'policies' };
const GROUP_ICONS = {
  research: { Industry: 'branch-industry', Exploration: 'branch-exploration', Economy: 'branch-economy', Military: 'branch-military', Science: 'branch-science', Civics: 'branch-civics' },
  traditions: { Expansion: 'track-expansion', Prosperity: 'track-prosperity', Discovery: 'track-discovery' },
  policies: { Economy: 'policy-economy', Society: 'policy-society', Defense: 'policy-defense' }
};
const STATE_ICONS = { completed: 'state-completed', researching: 'state-active', available: 'state-available', locked: 'state-locked' };
const ITEM_ART = {
  research: {
    'orbital-industry':'technology-orbital-industry', 'stellar-survey':'technology-stellar-survey',
    'fusion-grid':'technology-fusion-grid', 'fleet-logistics':'technology-fleet-logistics',
    'quantum-labs':'technology-quantum-laboratories', 'colonial-charters':'technology-frontier-charters',
    'synthetic-smelting':'technology-synthetic-smelting', 'planetary-banking':'technology-galactic-markets',
    'shield-matrix':'technology-shield-matrix', 'capital-ships':'technology-capital-shipyards',
    'terraforming':'technology-terraforming', 'stellar-nexus':'technology-stellar-nexus',
    'culture-networks':'technology-cultural-networks', 'frontier-habitats':'technology-frontier-habitats',
    'exotic-materials':'technology-exotic-materials', 'civic-administration':'technology-civic-administration'
  },
  traditions: {
    'frontier-spirit':'traditions-frontier-spirit','pathfinders':'traditions-pathfinders',
    'settlers-covenant':'traditions-settlers-covenant','merchant-leagues':'traditions-merchant-leagues',
    'orbital-artisans':'traditions-orbital-artisans','golden-age':'traditions-golden-age',
    'scientific-method':'traditions-scientific-method','living-archives':'traditions-living-archives',
    'cosmic-insight':'traditions-cosmic-insight'
  },
  policies: {
    'open-markets':'policies-open-markets','directed-industry':'policies-directed-industry',
    'academic-freedom':'policies-academic-freedom','civic-service':'policies-civic-service',
    'fleet-doctrine':'policies-fleet-doctrine','diplomatic-corps':'policies-diplomatic-corps'
  }
};
export const developmentItemIconKey = (page, id) => ITEM_ART[page]?.[id] || null;
function itemIcon(page, item, className = 'progress-vector') {
  const key = developmentItemIconKey(page, item.id);
  return key ? '<svg class="' + className + '" aria-hidden="true" focusable="false"><use href="./assets/ui/empire-icon-atlas.svg#' + key + '"></use></svg>'
    : strategyIcon(developmentIconKey(page, item[PAGES[page].groups]), className);
}

function strategyIcon(id, className = 'progress-vector') {
  return '<svg class="' + className + '" aria-hidden="true" focusable="false"><use href="./assets/ui/strategy-icons.svg#' + id + '"></use></svg>';
}
export function developmentIconKey(page, group) {
  return Object.hasOwn(GROUP_ICONS, page) && Object.hasOwn(GROUP_ICONS[page], group) ? GROUP_ICONS[page][group] : PAGE_ICONS[page] || 'progress';
}
const escapeText = value => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const number = value => Math.round(value || 0).toLocaleString('en-US');

export const isDevelopmentPage = page => Object.hasOwn(PAGES, page);
export const developmentItems = page => ITEMS[page] || [];
export const developmentGroups = page => [...new Set(developmentItems(page).map(item => item[PAGES[page].groups]))];

export function developmentStatus(game, page, item) {
  const empire = game.empires[0];
  const completed = page === 'research' ? empire.techs.includes(item.id)
    : page === 'traditions' ? (empire.traditions || []).includes(item.id)
    : (empire.policies || []).includes(item.id);
  const active = page === 'research' && empire.research === item.id && !completed;
  const requirements = item.prereqs || [];
  const history = page === 'research' ? empire.techs : (empire.traditions || []);
  const missing = requirements.filter(id => !history.includes(id));
  const price = page === 'traditions' ? traditionCost(empire) : page === 'policies' ? 20 : item.cost;
  const affordable = page === 'traditions' ? (empire.unity || 0) >= price
    : page === 'policies' ? empire.influence >= 20 : true;
  const ready = !completed && missing.length === 0 && affordable;
  return { completed, active, missing, price, affordable, ready, status: completed ? (page === 'policies' ? 'In force' : 'Completed')
    : missing.length ? 'Requires prerequisite' : !affordable ? 'Not enough resources' : active ? 'In progress' : 'Available' };
}

function prerequisiteNames(page, item) {
  const source = developmentItems(page);
  return (item.prereqs || []).map(id => source.find(entry => entry.id === id)?.name || id);
}
function node(game, page, item, chosen, previous) {
  const state = developmentStatus(game, page, item);
  const statusClass = state.completed ? 'completed' : state.active ? 'researching' : state.ready ? 'available' : 'locked';
  const prerequisites = prerequisiteNames(page, item);
  const connected = previous && (item.prereqs || []).includes(previous.id);
  return '<button type="button" class="progress-node ' + statusClass + (connected ? ' connected' : '') + (chosen ? ' selected' : '') +
    '" data-action="select-development" data-id="' + escapeText(item.id) + '" aria-pressed="' + String(chosen) + '">' +
    '<span class="progress-node-top"><span class="progress-node-identity">' + itemIcon(page, item) +
    '<span class="progress-node-state">' + escapeText(state.status) + '</span></span><span class="progress-node-symbol">' +
    strategyIcon(STATE_ICONS[statusClass], 'progress-status-vector') + '</span></span>' +
    '<strong>' + escapeText(item.name) + '</strong><span class="progress-node-effect">' + escapeText(item.bonus) + '</span>' +
    '<small>' + (prerequisites.length ? 'After ' + escapeText(prerequisites.join(' + ')) : page === 'policies' ? escapeText(item.description) : 'Starting choice') + '</small>' +
    '</button>';
}
function details(game, page, item) {
  const empire = game.empires[0];
  const info = PAGES[page];
  const state = developmentStatus(game, page, item);
  const names = prerequisiteNames(page, item);
  const requiredLabel = names.length ? names.join(' + ') : 'None';
  const description = item.description || (page === 'traditions' ? 'A permanent cultural advantage for your empire.' : '');
  let meta = '';
  if (page === 'research') {
    const generated = income(game).science;
    const remaining = Math.max(0, item.cost - (empire.progress || 0));
    const estimatedTurns = generated > 0 ? Math.ceil(remaining / generated) : null;
    meta = '<div class="progress-details-row"><span>Research cost</span><b>' + number(item.cost) + ' Science</b></div>' +
      '<div class="progress-details-row"><span>Estimated time</span><b>' + (state.completed ? 'Finished' : (estimatedTurns === null ? 'No science income' : estimatedTurns + ' cycles')) + '</b></div>';
    if (state.active) meta += '<div class="progress-current"><div class="progress-current-meter"><span style="width:' +
      Math.min(100, Math.max(0, empire.progress / item.cost * 100)) + '%"></span></div><small>' +
      number(empire.progress) + ' / ' + number(item.cost) + ' Science invested</small></div>';
  } else if (page === 'traditions') {
    meta = '<div class="progress-details-row"><span>Adoption cost</span><b>' + number(state.price) + ' Unity</b></div>' +
      '<div class="progress-details-row"><span>Your reserve</span><b>' + number(empire.unity || 0) + ' Unity</b></div>';
  } else {
    const replacing = developmentItems(page).find(other => other.slot === item.slot && (empire.policies || []).includes(other.id));
    meta = '<div class="progress-details-row"><span>Influence cost</span><b>20 Influence</b></div>' +
      '<div class="progress-details-row"><span>Policy area</span><b>' + escapeText(item.slot) + '</b></div>' +
      (replacing && replacing.id !== item.id ? '<p class="progress-warning">Replaces ' + escapeText(replacing.name) + ' in the ' + escapeText(item.slot) + ' slot.</p>' : '');
  }
  const blocked = state.missing.length ? 'Unlock ' + escapeText(requiredLabel) + ' first.'
    : !state.affordable ? 'You need more ' + (page === 'traditions' ? 'Unity' : 'Influence') + '.' : '';
  const actionText = state.completed ? (page === 'policies' ? 'Policy in force' : 'Already unlocked')
    : state.active ? 'Current research focus' : info.verb;
  return '<aside class="progress-detail" aria-label="Selected ' + info.noun + ' details">' +
    '<span class="progress-detail-eyebrow">' + escapeText(item[PAGES[page].groups]) + ' / ' + escapeText(info.title) + '</span>' +
    '<div class="progress-detail-icon">' + itemIcon(page, item, 'progress-detail-vector') + '</div>' +
    '<h3>' + escapeText(item.name) + '</h3><p>' + escapeText(description) + '</p>' +
    '<div class="progress-effect"><small>EMPIRE EFFECT</small><strong>' + escapeText(item.bonus) + '</strong></div>' +
    '<div class="progress-details-row"><span>Prerequisites</span><b>' + escapeText(requiredLabel) + '</b></div>' + meta +
    '<div class="progress-detail-action"><button class="action-primary" type="button" data-action="' + ACTIONS[page] +
    '" data-id="' + escapeText(item.id) + '"' + (!state.ready || state.active ? ' disabled' : '') + '>' + escapeText(actionText) + '</button>' +
    (blocked ? '<small role="status">' + blocked + '</small>' : '') + '</div></aside>';
}

export function renderDevelopment(game, page = 'research', selectedId = null, filter = 'all') {
  if (!isDevelopmentPage(page)) return '';
  const empire = game.empires[0], info = PAGES[page], items = developmentItems(page), allGroups = developmentGroups(page);
  const activeGroup = filter === 'all' || allGroups.includes(filter) ? filter : 'all';
  const visible = items.filter(item => activeGroup === 'all' || item[info.groups] === activeGroup);
  const selected = visible.find(item => item.id === selectedId) ||
    visible.find(item => developmentStatus(game, page, item).active) ||
    visible.find(item => developmentStatus(game, page, item).ready) || visible[0];
  const current = items.find(item => item.id === empire.research);
  const progress = current ? Math.min(100, Math.max(0, (empire.progress / current.cost) * 100)) : 0;
  const counts = { research: empire.techs.length, traditions: (empire.traditions || []).length, policies: (empire.policies || []).length };
  const tab = key => '<button type="button" role="tab" class="progress-tab ' + (page === key ? 'active' : '') +
    '" data-nav="' + key + '" aria-selected="' + String(page === key) + '">' + strategyIcon(PAGE_ICONS[key], 'progress-tab-vector') + escapeText(PAGES[key].title) +
    ' <span>' + counts[key] + ' / ' + ITEMS[key].length + '</span></button>';
  const groupButton = group => '<button type="button" class="progress-filter ' + (activeGroup === group ? 'active' : '') +
    '" data-action="filter-development" data-filter="' + escapeText(group) +
    '" aria-pressed="' + String(activeGroup === group) + '">' +
    (group === 'all' ? strategyIcon('progress', 'progress-filter-vector') : strategyIcon(developmentIconKey(page, group), 'progress-filter-vector')) +
    (group === 'all' ? 'All fields' : escapeText(group)) + '</button>';
  const lanes = allGroups.filter(group => activeGroup === 'all' || group === activeGroup).map(group => {
    const groupItems = visible.filter(item => item[info.groups] === group);
    const complete = groupItems.filter(item => developmentStatus(game, page, item).completed).length;
    return '<section class="progress-lane" aria-label="' + escapeText(group) + '">' +
      '<div class="progress-lane-heading"><span class="progress-lane-name">' + strategyIcon(developmentIconKey(page, group), 'progress-lane-vector') +
      '<h3>' + escapeText(group) + '</h3></span><span>' + complete + ' / ' + groupItems.length + '</span></div>' +
      '<div class="progress-lane-nodes">' + groupItems.map((item, index) => node(game, page, item, item.id === selected.id, groupItems[index - 1])).join('') + '</div></section>';
  }).join('');
  const subline = page === 'research' ? (current ? 'Currently researching ' + current.name : 'Choose your next research project')
    : page === 'traditions' ? number(empire.unity || 0) + ' Unity available · next adoption costs ' + traditionCost(empire)
    : number(empire.influence) + ' Influence available · 20 per policy change';
  return '<div class="progress-workspace-content">' +
    '<div class="progress-heading"><div><button type="button" class="progress-back" data-nav="system">← Return to galaxy</button>' +
    '<h1>Empire Development</h1><p>Research, culture, and government in one command center.</p></div>' +
    '<div class="progress-metrics"><div><small>SCIENCE / CYCLE</small><strong>+' + number(income(game).science) + '</strong></div>' +
    '<div><small>UNITY</small><strong>' + number(empire.unity || 0) + ' <em>+' + number(unityIncome(game)) + '</em></strong></div>' +
    '<div><small>INFLUENCE</small><strong>' + number(empire.influence) + '</strong></div></div></div>' +
    '<div class="progress-tabbar" role="tablist" aria-label="Empire development categories">' + PAGE_ORDER.map(tab).join('') + '</div>' +
    '<div class="progress-section-head"><div><h2>' + escapeText(info.title) + '</h2><p>' + escapeText(info.summary) + '</p></div>' +
    '<div class="progress-current-project">' + escapeText(subline) + (page === 'research' && current ?
      '<div class="progress-current-meter"><span style="width:' + progress + '%"></span></div>' : '') + '</div></div>' +
    '<div class="progress-filters" aria-label="' + escapeText(info.title) + ' categories">' + ['all', ...allGroups].map(groupButton).join('') + '</div>' +
    '<div class="progress-content-layout"><div class="progress-board" aria-label="' + escapeText(info.title) + ' paths">' + lanes +
    '</div>' + (selected ? details(game, page, selected) : '<div class="progress-empty">No choices in this category.</div>') + '</div>' +
    '</div>';
}
