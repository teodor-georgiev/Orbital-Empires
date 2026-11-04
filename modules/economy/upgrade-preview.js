/**
 * Read-only colony upgrade preview. It asks the existing simulation for both
 * yields instead of duplicating economic modifiers, population or biome rules.
 * Advisory only: purchases still require core.js canBuild/build validation.
 */
import { resourceShortfalls } from './ledger.js';

const RESOURCES = Object.freeze(['credits', 'alloys', 'science', 'influence']);

function sumGain(entry) {
  return RESOURCES.reduce((total, resource) => total + Math.max(0, entry.gain[resource]), 0);
}

function compareOpportunities(a, b) {
  if (a.preservesReserves !== b.preservesReserves) return a.preservesReserves ? -1 : 1;
  if (a.affordable !== b.affordable) return a.affordable ? -1 : 1;
  const outputDifference = sumGain(b) - sumGain(a);
  return outputDifference || a.systemId - b.systemId ||
    a.buildingId.localeCompare(b.buildingId);
}

/**
 * Simulate one immediate upgrade on a cloned colony object, not on game state.
 * Returns null for a non-owned, biome-ineligible, max-level or invalid building.
 */
export function previewColonyUpgrade(game, systemId, building, systemYieldFn, reserves = {}) {
  if (typeof systemYieldFn !== 'function') throw new TypeError('systemYieldFn must be a function.');
  const system = Number.isInteger(systemId) ? game?.systems?.[systemId] : null;
  if (!system || system.owner !== 0 || !building || typeof building.id !== 'string' ||
      typeof building.name !== 'string' || !Array.isArray(building.cost) ||
      !Array.isArray(building.credit)) return null;
  if (building.allowed && (!Array.isArray(building.allowed) ||
      !building.allowed.includes(system.biome))) return null;
  const currentLevel = system.buildings?.[building.id] ?? 0;
  if (!Number.isInteger(currentLevel) || currentLevel < 0 || currentLevel >= 3 ||
      !Number.isFinite(building.cost[currentLevel]) ||
      !Number.isFinite(building.credit[currentLevel])) return null;

  const cost = { credits: building.credit[currentLevel], alloys: building.cost[currentLevel] };
  const before = systemYieldFn(game, system);
  const after = systemYieldFn(game, {
    ...system, buildings: { ...system.buildings, [building.id]: currentLevel + 1 }
  });
  const gain = {};
  for (const resource of RESOURCES) {
    if (!Number.isFinite(before?.[resource]) || !Number.isFinite(after?.[resource])) {
      throw new RangeError(`Invalid ${resource} production for ${system.id}.`);
    }
    gain[resource] = after[resource] - before[resource];
  }
  const empire = game.empires?.[0];
  const stockpile = { credits: empire?.credits, alloys: empire?.alloys };
  const affordable = Object.keys(resourceShortfalls(stockpile, cost)).length === 0;
  const shortfalls = resourceShortfalls(stockpile, cost, reserves);
  return {
    systemId, buildingId: building.id, buildingName: building.name,
    nextLevel: currentLevel + 1, cost, gain, affordable,
    preservesReserves: Object.keys(shortfalls).length === 0,
    shortfalls
  };
}

/**
 * One highest-value economic upgrade per owned colony, with safe spending first.
 * Never suggests a defense-only building as an income investment.
 */
export function recommendColonyInvestments(game, buildings, systemYieldFn,
                                         { reserves = {}, limit = 3 } = {}) {
  if (!Number.isInteger(limit) || limit < 0 || limit > 100) {
    throw new RangeError('limit must be an integer from 0 to 100.');
  }
  if (!Array.isArray(buildings)) throw new TypeError('buildings must be an array.');
  if (!Array.isArray(game?.systems)) throw new TypeError('Unknown campaign systems.');
  const results = [];
  for (const system of game.systems) {
    if (system.owner !== 0) continue;
    const upgrades = buildings
      .map(building => previewColonyUpgrade(game, system.id, building, systemYieldFn, reserves))
      .filter(entry => entry && sumGain(entry) > 0)
      .sort(compareOpportunities);
    if (upgrades.length) results.push(upgrades[0]);
  }
  return results.sort(compareOpportunities).slice(0, limit);
}
