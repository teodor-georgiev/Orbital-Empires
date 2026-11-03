# System outposts and selectable tactical ships — implementation proposal

**Lane:** ChatGPT Web (integration-owned files by coordinator). **Base:** `feat/oe-realtime-monthly-fleet-20261103` @ `940cc8e84a0a4c26a9e8c49595139e393608ffdd`.
**Visual target:** [original desktop/mobile concept](../design/system-command-selection-concept.svg). The project owner specified bright selection outlines, real hull silhouettes, a station near each owned star, and a compact deploy command panel. The mockup refines that request. Visual sign-off is pending before release.

## Outcomes
- Owned systems have a persistent four-tier defensive outpost. Existing saves without an outpost receive a safe effective default.
- Outpost power, shields, armor and HP influence space combat and persist damage. Upgrades spend credits and alloys.
- Ships are persistent individual unit IDs nested in their fleet while legacy counts remain authoritative.
- In the existing WebGL and Canvas fallback system views, ships render distinct original metallic craft silhouettes and can be clicked, shift-added, box-selected, and given orders (orbit planet, dock outpost, guard planet, patrol or move to point).
- A partial selection creates a new fleet preserving unit IDs. Merging compatible friendly co-located fleets is supported.
- Monthly simulation and paused/hidden-tab behavior remain unchanged.

## Interfaces and compatibility
- `modules/strategy/outposts.js`: outpost defaults, defense power, upgrade and damage helpers.
- `modules/strategy/ship-units.js`: stable ship IDs, fleet reconciliation, local orders, splitting and merging.
- `modules/visuals/ship-models.js`: original static 3D triangle meshes with 2D silhouette fallback.
- Root coordinator integrates `core.js`, `app.js`, `solar-view.js`, `index.html`, `sw.js`.
- Optional save additions `system.outpost`, `fleet.units`, `fleet.localOrder`, `game.nextShipId`; legacy v1 saves migrate lazily without data loss.
- No live backend, no payments, no external art or license requirements.

## Acceptance gate
- Unit tests for auto-created outposts, upgrades, damage, capture, legacy saves, selectable individual IDs, deterministic split/merge, per-planet orders and invalid action rejection.
- Chromium and Playwright interactions for selection, box selection, command issuance, month progression and save/reload.
- Actual desktop/mobile screenshots compared to the original design. PR draft until visual review and all CI checks are green.
