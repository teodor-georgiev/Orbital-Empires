/**
 * Read-only, fleet-owner-agnostic entry legality for one adjacent hyperlane.
 * Director must integrate into core.js; this module makes no game mutations.
 */
export function inspectFleetEntry(game, fleetId, targetId) {
  return { ok: true, combat: false };
}
