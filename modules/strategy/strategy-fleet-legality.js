/**
 * Read-only legality gate for a single fleet's next manual hyperlane step.
 *
 * Applies the existing player rules to any empire so AI fleets cannot skip
 * neutral blockers or cross borders at peace. No fleet movement, combat, RNG
 * use or save mutation occurs here. Director-owned core.js integration is
 * deliberately separate from this Lane D implementation.
 */
const blocked = reason => ({ ok: false, reason });

export function inspectFleetEntry(game, fleetId, targetId) {
  const fleet = game?.fleets?.find(f => f.id === fleetId);
  const source = game?.systems?.[fleet?.system];
  const empire = game?.empires?.[fleet?.owner];
  if (!fleet || !source || !empire) return blocked('unknown-fleet');

  const destination = Number.isInteger(targetId) ? game.systems[targetId] : null;
  if (!destination) return blocked('unknown-destination');

  if (fleet.route?.length) return blocked('active-route');
  if (fleet.movedTurn >= game.turn) return blocked('already-moved');
  if (fleet.system === targetId) return blocked('same-system');
  if (!source.neighbors?.includes(targetId)) return blocked('not-adjacent');

  if (destination.owner !== null && destination.owner !== fleet.owner &&
      !empire.wars?.[destination.owner]) {
    return blocked('peaceful-border');
  }

  const otherFleets = game.fleets.filter(f => f.system === targetId && f.owner !== fleet.owner);
  if (otherFleets.some(f => !empire.wars?.[f.owner])) {
    return blocked('neutral-blockade');
  }

  return { ok: true, combat: (destination.owner !== null &&
    destination.owner !== fleet.owner) || otherFleets.length > 0 };
}
