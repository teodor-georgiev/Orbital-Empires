# Rival frontier economy (2026-11-04)

Feature branch: `feat/oe-ai-economy-frontier-20261104`; integration base `2e6c4cbbff3f15fb627af0c85fedd80844e80bf6`.

## Gameplay

- Rival empires plan adjacent neutral colonies by habitat quality and richness; the planner has deterministic tie-breaks and consumes no RNG.
- Their next colony's full credit/alloy/influence budget is reserved, even when colonization does not happen on a given cycle. Automatic shipbuilding no longer steals it.
- When no legal frontier remains, rivals choose an affordable productive building with a stable payback heuristic. Legal expansion and construction costs remain owned by core rules.
- No UI changes, save-schema changes, new resources, real-time clock integration, or player automation. Existing AI diplomacy and tactical combat remain unchanged.

## Evidence and gates

- Targeted tests in `tests/game.test.js`: pure planning, reserve protection, boxed-in investment; existing core/simulation tests remain the compatibility gate.
- CI must pass at the exact PR head. The feature is **not shipped** until reviewed and integrated into the project release branch.
- Concurrent PR #53 provides a read-only economy ledger; this feature does not depend on or duplicate it. Stacked monthly/tactical PRs #37 and #47 need coordinator reconciliation before a public release.

## Player-visible limits

Budget rules are for rival AI only; player governors and their spend policies remain future v0.4 work. Building payback is a heuristic, not a trained agent. 
