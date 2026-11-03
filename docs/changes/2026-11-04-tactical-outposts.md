# 2026-11-04 — System starbases and tactical ship deployment

**ChatGPT Web only.** Starting commit: `940cc8e84a0a4c26a9e8c49595139e393608ffdd`, on branch `feat/oe-outposts-tactical-ship-command-20261104`, stacked on monthly-simulation PR #37.

## Player-visible behavior
- New and existing owned systems have defensive outposts: Frontier Post, Defense Station, Fortified Starbase, Citadel. Ruined tier zero can be rebuilt. Defense power affects fleet combat; remaining HP changes strength, and slow repairs happen with monthly simulation.
- Original polygon-mesh ships and stations render inside WebGL orbital views. Canvas 2D fallback uses matching original silhouettes. Click, multi-select rectangle, Shift-click, alt-drag camera, tap selection and move targeting.
- Local fleet orders: planet orbit/guard, dock, patrol, hold, and move to point, with partial-fleet split and complete-fleet merge. Controls and stats are present in the solar overlay and main system inspector.
- Defensive labels in galaxy map; active ship selection and order status visible in system view.

## Modules and save compatibility
- `core.js`, `app.js`, `solar-view.js`, `index.html`, `sw.js`, plus `modules/strategy/outposts.js`, `modules/strategy/ship-units.js`, `modules/visuals/ship-models.js`, `modules/styles/tactical-ships.css`.
- Optional schema-v1 fields `system.outpost`, `fleet.units`, `fleet.localOrder`, `nextShipId`; no schema bump. Existing saves are hydrated on load without discarding prior progress.

## Checks and gating
- Unit tests: `tests/tactical-outposts.test.js`, `tests/tactical-visual.test.js`, `tests/tactical-ui.test.js`.
- Real Chromium/Playwright desktop and mobile: `e2e/tactical-outposts.spec.mjs`. Screenshots captured into GitHub Actions artifacts.
- Run existing full `npm test`, browser smoke, and Playwright workflows on the exact final commit before merge or release. Screenshot comparison with original SVG mockup required.
- This feature PR must not merge directly into `main` ahead of the monthly clock branch. If either base evolves, rebase/reconcile and rerun all checks.
- Limits: ships currently use persistent individual identities with one local order per fleet; transit remains strategic one hyperlane/month, not physics-based continuous acceleration. Command UI displays at most 65 ship buttons and renders at most 320 representative 3D hulls for performance.
