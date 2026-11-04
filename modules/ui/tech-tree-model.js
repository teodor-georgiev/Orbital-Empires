/* Pure technology tree data model. No DOM, no side effects, no input mutation. */
import { TECHS } from '../../core.js';

export const TECH_CATEGORY_ORDER = Object.freeze(['Science', 'Exploration', 'Economy', 'Industry', 'Military', 'Civics']);

const compareText = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

/** Resolves tiers lazily so each call only follows the requested dependency chain. */
function createTierResolver(techs) {
  const byId = new Map(techs.map(tech => [tech.id, tech]));
  const tiers = new Map();
  const visiting = new Set();
  const resolve = id => {
    if (tiers.has(id)) return tiers.get(id);
    const tech = byId.get(id);
    if (!tech) throw new Error(`Unknown technology: ${id}`);
    if (visiting.has(id)) throw new Error(`Prerequisite cycle detected at: ${id}`);
    visiting.add(id);
    let tier = 0;
    for (const prereq of tech.prereqs || []) {
      if (!byId.has(prereq)) throw new Error(`Unknown prerequisite "${prereq}" for technology: ${id}`);
      tier = Math.max(tier, resolve(prereq) + 1);
    }
    visiting.delete(id);
    tiers.set(id, tier);
    return tier;
  };
  return resolve;
}

export function techTier(id, techs = TECHS) {
  return createTierResolver(techs)(id);
}

export function buildTechTree(empire, techs = TECHS) {
  const resolveTier = createTierResolver(techs);
  const branchOf = new Map(techs.map(tech => [tech.id, tech.branch]));
  const completed = new Set(empire.techs || []);
  const researching = empire.research ?? null;
  const stateOf = tech => {
    if (completed.has(tech.id)) return 'completed';
    if (researching === tech.id) return 'researching';
    return (tech.prereqs || []).every(id => completed.has(id)) ? 'available' : 'locked';
  };

  const listed = new Set(TECH_CATEGORY_ORDER);
  const present = new Set(techs.map(tech => tech.branch));
  const branches = [
    ...TECH_CATEGORY_ORDER.filter(branch => present.has(branch)),
    ...[...present].filter(branch => !listed.has(branch)).sort(compareText)
  ];

  let tierCount = 0;
  const categories = branches.map(branch => {
    const ordered = techs
      .filter(tech => tech.branch === branch)
      .map(tech => ({ tech, tier: resolveTier(tech.id) }))
      .sort((a, b) => a.tier - b.tier || a.tech.cost - b.tech.cost || compareText(a.tech.id, b.tech.id));

    const rowsByTier = new Map();
    const nodes = ordered.map(({ tech, tier }) => {
      const row = rowsByTier.get(tier) || 0;
      rowsByTier.set(tier, row + 1);
      tierCount = Math.max(tierCount, tier + 1);
      return {
        id: tech.id,
        name: tech.name,
        branch: tech.branch,
        cost: tech.cost,
        bonus: tech.bonus,
        description: tech.description,
        prereqs: [...(tech.prereqs || [])],
        tier,
        row,
        state: stateOf(tech)
      };
    });

    return { branch, rows: Math.max(0, ...rowsByTier.values()), nodes };
  });

  const edges = [];
  for (const category of categories) {
    for (const node of category.nodes) {
      for (const prereq of node.prereqs) {
        edges.push({ from: prereq, to: node.id, crossCategory: branchOf.get(prereq) !== node.branch });
      }
    }
  }

  return { tiers: tierCount, categories, edges };
}
