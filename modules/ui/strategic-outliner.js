import { TECHS, TRADITIONS, ownedSystems, income, fleetPower, canAdoptTradition, traditionCost, unityIncome } from '../../core.js';

// Compact 4X command outliner: only real state and existing game actions.
// No hidden AI automation, no imaginary build queues, no direct game mutations.
const escapeText = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));
const icon = id => '<svg class="outliner-icon" aria-hidden="true" focusable="false"><use href="./assets/ui/empire-icon-atlas.svg#' + id + '"></use></svg>';
const button = (page, image, title, sub) => '<button type="button" class="outliner-overview" data-nav="' + page + '">' + icon(image) +
  '<span><strong>' + escapeText(title) + '</strong><small>' + escapeText(sub) + '</small></span><span class="outliner-chevron" aria-hidden="true">›</span></button>';

export function strategicOutlinerData(game) {
  const player = game.empires[0], colonies = ownedSystems(game);
  const fleets = game.fleets.filter(fleet => fleet.owner === 0);
  const tech = TECHS.find(item => item.id === player.research);
  const science = income(game).science;
  const traditions = TRADITIONS.filter(item => canAdoptTradition(game, item.id).ok);
  return {
    colonies, fleets, tech, science,
    researchLabel: tech ? tech.name : 'Select research',
    researchDetail: tech ? Math.round(Math.max(0, player.progress || 0)) + ' / ' + tech.cost + ' Science' : 'No active research project',
    traditionName: traditions[0]?.name || null,
    unity: Math.round(player.unity || 0),
    unityCost: traditionCost(player),
    unityPerTurn: unityIncome(game)
  };
}

export function renderStrategicOutliner(game, selectedSystemId = null, selectedFleetId = null) {
  const data = strategicOutlinerData(game);
  const colonies = data.colonies.slice(0, 4).map(system =>
    '<button type="button" class="outliner-entry ' + (selectedSystemId === system.id ? 'selected' : '') +
    '" data-action="select-system" data-id="' + system.id + '" aria-label="Select ' + escapeText(system.name) + ' system">' +
    icon(system.capital ? 'colonization-homeworld' : 'colonization-settlement') +
    '<span>' + escapeText(system.name) + '</span><small>' + escapeText(system.biome) + '</small></button>').join('');
  const fleets = data.fleets.slice(0, 3).map((fleet, i) => {
    const system = game.systems[fleet.system];
    return '<button type="button" class="outliner-entry ' + (selectedFleetId === fleet.id ? 'selected' : '') +
      '" data-action="select-fleet" data-id="' + fleet.id + '" aria-label="Select fleet ' + (i + 1) + '">' +
      icon('ships-corvette') + '<span>Fleet ' + (i + 1) + '</span><small>' +
      escapeText(system?.name || 'Unknown sector') + ' · ' + fleetPower(game, fleet) + ' power</small></button>';
  }).join('');
  const cultureTitle = data.traditionName ? 'Tradition ready' : 'Culture';
  const cultureSub = data.traditionName ? 'Adopt ' + data.traditionName
    : data.unity + ' / ' + data.unityCost + ' Unity · +' + data.unityPerTurn + '/turn';
  return '<div class="outliner-heading"><span>' + icon('command-empire-overview') + ' STRATEGIC OUTLINER</span>' +
    '<small>LIVE EMPIRE STATE</small></div>' +
    '<div class="outliner-overviews">' +
    button('research', 'technology-quantum-laboratories', data.researchLabel, data.researchDetail) +
    button('traditions', 'traditions-frontier-spirit', cultureTitle, cultureSub) +
    '</div>' +
    '<div class="outliner-section"><div class="outliner-section-title"><strong>COLONIES</strong><span>' + data.colonies.length + '</span></div>' +
    (colonies || '<p class="outliner-empty">No settled systems</p>') +
    (data.colonies.length > 4 ? '<button type="button" class="outliner-more" data-nav="colonies">All colonies →</button>' : '') +
    '</div>' +
    '<div class="outliner-section"><div class="outliner-section-title"><strong>FLEETS</strong><span>' + data.fleets.length + '</span></div>' +
    (fleets || '<p class="outliner-empty">No active fleets</p>') +
    (data.fleets.length > 3 ? '<button type="button" class="outliner-more" data-nav="military">All fleets →</button>' : '') +
    '</div>';
}
