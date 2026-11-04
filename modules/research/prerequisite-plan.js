/**
 * Deterministic research prerequisite planner for the existing tech catalog.
 *
 * Read-only: returns missing technology IDs in prerequisite-first order.
 * It never grants technologies, charges science, or alters game/save state.
 * The caller decides when to issue the authoritative chooseResearch action.
 */
export function planResearchUnlocks(catalog, researchedIds, targetId) {
  if (!Array.isArray(catalog) || !Array.isArray(researchedIds)) {
    throw new TypeError('Catalog and researched technologies must be arrays.');
  }
  const byId = new Map();
  for (const tech of catalog) {
    if (!tech || typeof tech.id !== 'string' || !tech.id.trim() ||
        !Array.isArray(tech.prereqs)) {
      throw new TypeError('Each technology requires an ID and prerequisite array.');
    }
    if (byId.has(tech.id)) throw new RangeError('Duplicate technology ID: ' + tech.id);
    byId.set(tech.id, tech);
  }
  for (const tech of catalog) {
    const seen = new Set();
    for (const prereq of tech.prereqs) {
      if (!byId.has(prereq)) {
        throw new RangeError('Unknown prerequisite ' + prereq + ' for ' + tech.id);
      }
      if (seen.has(prereq)) {
        throw new RangeError('Duplicate prerequisite ' + prereq + ' for ' + tech.id);
      }
      seen.add(prereq);
    }
  }

  // Validate the full graph, including branches not connected to this target.
  const state = new Map();
  function validate(id) {
    if (state.get(id) === 'visiting') throw new RangeError('Circular research dependency at ' + id);
    if (state.get(id) === 'done') return;
    state.set(id, 'visiting');
    for (const prereq of byId.get(id).prereqs) validate(prereq);
    state.set(id, 'done');
  }
  for (const tech of catalog) validate(tech.id);

  const owned = new Set(researchedIds);
  for (const id of owned) {
    if (!byId.has(id)) throw new RangeError('Unknown researched technology: ' + id);
    for (const prereq of byId.get(id).prereqs) {
      if (!owned.has(prereq)) {
        throw new RangeError('Researched technology ' + id + ' is missing prerequisite ' + prereq);
      }
    }
  }
  if (!byId.has(targetId)) throw new RangeError('Unknown target technology: ' + targetId);

  const path = [], added = new Set();
  function collect(id) {
    if (owned.has(id) || added.has(id)) return;
    for (const prereq of byId.get(id).prereqs) collect(prereq);
    added.add(id);
    path.push(id);
  }
  collect(targetId);
  return path;
}
