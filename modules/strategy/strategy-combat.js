/**
 * Pure, deterministic casualty calculation for the three-class fleet model.
 *
 * Preserves the legacy combat rule that a winning fleet retains at least one
 * existing ship, without creating a corvette when its last hull was a frigate
 * or cruiser. This helper is NOT wired into root combat (director owns core.js).
 * It never mutates the caller's fleet or save state.
 */
const SHIP_CLASSES = Object.freeze(['corvette', 'frigate', 'cruiser']);

export function applyShipCasualties(ships, fraction) {
  if (typeof fraction !== 'number' || !Number.isFinite(fraction) ||
      fraction < 0 || fraction > 1) {
    throw new RangeError('Casualty fraction must be a finite number in [0, 1].');
  }
  if (!ships || typeof ships !== 'object' || Array.isArray(ships)) {
    throw new RangeError('Ship counts must be a fleet object.');
  }

  const remaining = {};
  let total = 0;
  for (const type of SHIP_CLASSES) {
    const count = ships[type];
    if (!Number.isSafeInteger(count) || count < 0) {
      throw new RangeError(`Invalid ${type} count.`);
    }
    remaining[type] = count;
    total += count;
  }
  if (total > Number.MAX_SAFE_INTEGER) {
    throw new RangeError('Fleet ship total exceeds the safe integer limit.');
  }
  if (total === 0 || fraction === 0) return remaining;

  // Mirror the legacy rounding/minimum-loss rule, but never delete the last
  // existing hull only to synthesize a replacement of a different class.
  const requested = Math.max(Math.floor(total * fraction), fraction > 0.15 ? 1 : 0);
  let toRemove = Math.min(requested, total - 1);
  for (const type of SHIP_CLASSES) {
    const losses = Math.min(remaining[type], toRemove);
    remaining[type] -= losses;
    toRemove -= losses;
  }
  return remaining;
}
