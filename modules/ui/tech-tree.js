/* Technology category tree view: pure geometry plus HTML strings.
 * Reads the existing tree model; never touches the DOM and never mutates the game. */
import { buildTechTree } from './tech-tree-model.js';

const LABEL_W = 124;
const NODE_W = 220;
const NODE_H = 84;
const COL_GAP = 32;
const ROW_GAP = 10;
const LANE_PAD = 12;

const STATUS_WORDS = { completed: 'Completed', researching: 'Researching', available: 'Available', locked: 'Locked' };

const escapeText = value => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const metric = value => String(Math.round((Number(value) || 0) * 100) / 100);

export const techImagePath = id => './assets/original/technologies/' + id + '.svg';

export function techTreeLayout(tree) {
  const categories = tree?.categories || [];
  const edges = tree?.edges || [];
  const positions = {};
  const states = new Map();
  const lanes = [];
  let top = 0;
  let widest = 0;

  for (const category of categories) {
    const rows = Math.max(0, category.rows || 0);
    const height = LANE_PAD * 2 + rows * NODE_H + Math.max(0, rows - 1) * ROW_GAP;
    let complete = 0;
    for (const node of category.nodes) {
      const x = LABEL_W + node.tier * (NODE_W + COL_GAP);
      const y = top + LANE_PAD + node.row * (NODE_H + ROW_GAP);
      positions[node.id] = { x, y };
      states.set(node.id, node.state);
      if (node.state === 'completed') complete += 1;
      widest = Math.max(widest, x + NODE_W);
    }
    lanes.push({ branch: category.branch, top, height, complete, total: category.nodes.length });
    top += height;
  }

  const links = [];
  for (const edge of edges) {
    const from = positions[edge.from];
    const to = positions[edge.to];
    if (!from || !to) continue;
    const x1 = from.x + NODE_W;
    const y1 = from.y + NODE_H / 2;
    const x2 = to.x;
    const y2 = to.y + NODE_H / 2;
    const mx = (x1 + x2) / 2;
    links.push({
      from: edge.from,
      to: edge.to,
      crossCategory: Boolean(edge.crossCategory),
      completed: states.get(edge.from) === 'completed',
      d: 'M ' + metric(x1) + ' ' + metric(y1) + ' C ' + metric(mx) + ' ' + metric(y1) + ' ' +
        metric(mx) + ' ' + metric(y2) + ' ' + metric(x2) + ' ' + metric(y2)
    });
  }

  return { width: widest ? widest + LANE_PAD : 0, height: top, lanes, positions, links };
}

export function renderTechTree(game, { selectedId = null, filter = 'all', icon = null } = {}) {
  const empire = game.empires[0];
  const tree = buildTechTree(empire);
  const categories = filter === 'all' ? tree.categories : tree.categories.filter(category => category.branch === filter);
  const visible = new Set(categories.flatMap(category => category.nodes.map(node => node.id)));
  const edges = tree.edges.filter(edge => visible.has(edge.from) && visible.has(edge.to));
  const layout = techTreeLayout({ tiers: tree.tiers, categories, edges });
  const progress = Math.max(0, Number(empire.progress) || 0);
  const iconFor = tech => (typeof icon === 'function' ? icon(tech) || '' : '');

  const laneMarkup = lane => '<section class="tech-lane" aria-label="' + escapeText(lane.branch) +
    '" style="top:' + metric(lane.top) + 'px;height:' + metric(lane.height) + 'px">' +
    '<h3 class="tech-lane-name">' + escapeText(lane.branch) +
    '<small>' + lane.complete + ' / ' + lane.total + '</small></h3></section>';

  const nodeMarkup = node => {
    const position = layout.positions[node.id];
    const status = STATUS_WORDS[node.state] || node.state;
    const chosen = node.id === selectedId;
    const researching = node.state === 'researching';
    const pct = researching ? Math.min(100, Math.max(0, (progress / node.cost) * 100)) : 0;
    return '<button type="button" class="progress-node tech-node ' + node.state + (chosen ? ' selected' : '') +
      '" data-action="select-development" data-id="' + escapeText(node.id) + '" aria-pressed="' + String(chosen) +
      '" aria-label="' + escapeText(node.name + ', ' + status + ', ' + node.cost + ' science') +
      '" style="left:' + metric(position.x) + 'px;top:' + metric(position.y) + 'px">' +
      '<img class="tech-node-art" src="' + escapeText(techImagePath(node.id)) + '" alt="" width="60" height="60" draggable="false">' +
      '<span class="tech-node-text"><strong>' + escapeText(node.name) + '</strong>' +
      '<span class="tech-node-status">' + iconFor(node) + '<span>' + escapeText(status) + ' · ' +
      escapeText(node.cost) + '</span></span>' +
      (researching ? '<span class="tech-node-meter"><span style="width:' + metric(pct) + '%"></span></span>' : '') +
      '</span></button>';
  };

  const body = categories.map((category, index) => laneMarkup(layout.lanes[index]) +
    category.nodes.map(nodeMarkup).join('')).join('');

  const linksMarkup = '<svg class="tech-links" aria-hidden="true" width="' + metric(layout.width) +
    '" height="' + metric(layout.height) + '">' + layout.links.map(link =>
      '<path class="tech-link' + (link.crossCategory ? ' cross' : '') + (link.completed ? ' done' : '') +
      '" d="' + escapeText(link.d) + '"/>').join('') + '</svg>';

  return '<div class="tech-tree" style="width:' + metric(layout.width) + 'px;height:' + metric(layout.height) + 'px">' +
    body + linksMarkup + '</div>';
}
