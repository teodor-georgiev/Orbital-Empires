/**
 * Read-only economic ledger for the current one-colony-per-star rules.
 *
 * Production uses the authoritative system-yield callback from core.js;
 * it is deliberately NOT a second implementation of modifiers or buildings.
 * Unity is calculated by the existing civics rules. Science is research flow,
 * not a liquid treasury currency. No save schema change or monthly rescaling.
 */
import { unityIncome } from '../strategy/civics.js';

const OUTPUTS = Object.freeze(['credits', 'alloys', 'science', 'influence']);
const SPENDABLE = Object.freeze(['credits', 'alloys', 'influence', 'unity']);

function nonnegative(value, name) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    throw new RangeError(`${name} must be a finite, non-negative number.`);
  }
  return value;
}

/**
 * Report the existing per-cycle income for one empire, by system.
 * @param {object} game Current campaign state (never mutated).
 * @param {number} empireId Numeric empire ID.
 * @param {(game:object, system:object)=>object} systemYield Authoritative core yield calculator.
 */
export function economyLedger(game, empireId, systemYield) {
  if (!Array.isArray(game?.empires) || !Array.isArray(game?.systems) ||
      !Number.isInteger(empireId) || empireId < 0 || !game.empires[empireId]) {
    throw new RangeError('Unknown empire.');
  }
  if (typeof systemYield !== 'function') {
    throw new TypeError('A system-yield calculator is required.');
  }
  const production = { credits: 0, alloys: 0, science: 0, influence: 0 };
  const colonies = [];
  for (const system of game.systems) {
    if (system.owner !== empireId) continue;
    const raw = systemYield(game, system);
    const yieldByResource = {};
    for (const resource of OUTPUTS) {
      const value = nonnegative(raw?.[resource], `System ${system.id} ${resource} production`);
      yieldByResource[resource] = value;
      production[resource] += value;
    }
    colonies.push({
      id: system.id,
      name: system.name,
      biome: system.biome,
      population: system.population,
      production: yieldByResource
    });
  }
  production.unity = nonnegative(unityIncome(game, empireId), 'Unity production');
  const empire = game.empires[empireId];
  const stockpile = {
    credits: nonnegative(empire.credits, 'Credits treasury'),
    alloys: nonnegative(empire.alloys, 'Alloys treasury'),
    influence: nonnegative(empire.influence, 'Influence treasury'),
    unity: nonnegative(empire.unity ?? 0, 'Unity treasury')
  };
  return { empireId, colonies, production, stockpile };
}

/**
 * Positive shortages after protecting reserve amounts.
 * Never subtracts from treasury. Only spendable resources are accepted:
 * Science is a flow into research, not a treasury balance.
 */
export function resourceShortfalls(stockpile, cost, reserves = {}) {
  for (const [name, obj] of Object.entries({ stockpile, cost, reserves })) {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
      throw new TypeError(`${name} must be a resource object.`);
    }
    for (const [resource, amount] of Object.entries(obj)) {
      if (!SPENDABLE.includes(resource)) throw new RangeError(`Not a spendable resource: ${resource}.`);
      nonnegative(amount, `${name} ${resource}`);
    }
  }
  const result = {};
  for (const [resource, amount] of Object.entries(cost)) {
    const shortage = amount + (reserves[resource] ?? 0) - (stockpile[resource] ?? 0);
    if (shortage > 0) result[resource] = shortage;
  }
  return result;
}
