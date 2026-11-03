# 2026-11-03 — Autonomous month progression and fleet orders

**Owner:** ChatGPT Web integration lane. **Base:** `feat/turn-based-4x-pwa` at `27e0f176db6d4a647fd2ec69764999f4729d8a96`.
**Branch:** `feat/oe-realtime-monthly-fleet-20261103`. This is a development change, not a deployed release.

## Implemented
- Default Human Sol campaign starts January 2200 and advances automatically through each calendar month after closing the welcome menu.
- Simulation controls Pause/Play, 1× (1400 ms/month), 3× (550 ms/month), 8× (180 ms/month), and single-month step while paused.
- Existing deterministic monthly rules drive research, resource income, population, political shifts, rival AI and combat; render FPS does not control simulated time.
- Modal dialogs and hidden tabs suspend the clock; no hidden-tab time catch-up or background hosting.
- Player fleets receive legal shortest-path routes and move one hyperlane each month. ETA, queued path on map, Hold Position and obstruction handling are available. Old movement API still exists for compatibility.
- `endTurn` remains a compatibility alias for `advanceMonth` and existing schema v1 saves remain accepted.

## Verification and dependencies
- New tests: `tests/monthly-simulation.test.js`, `tests/monthly-ui.test.js`. Full repository CI, interactive browser checks and GitHub Pages release verification are required before merging or calling this live.
- File scope: `core.js`, `app.js`, `index.html`, `sw.js`, added simulation/fleet route modules, time-control CSS and tests, docs and changelog.
- This branch intentionally does **not** incorporate clock PR #19. Clock PR #19 is an earlier four-ticks-per-cycle autoplay experiment; it must be closed/superseded or reconciled by the coordinator after review.
- Planet buildings PR #33 also edits `core.js`, `app.js`, and `sw.js`; it requires a deliberate rebased integration rather than concurrent writes.
- This is fixed-step real-time-with-pause, not a physics simulator; economic balance uses the existing per-cycle amounts as monthly yields and requires later tuning.
- New gameplay controls extend the existing header only; no new full-screen layout or major visual overhaul, so a new picture-first menu gate is not applicable. Browser screenshot validation still required before release.

## Integration reconciliation

- Rebasing was necessary because biome buildings and space environments entered the shared integration branch after this feature began. The monthly feature was manually merged on top of integration commit `e8707c0dd104f2c354c6ea84489085c4c131d37a` without replacing the planetary economy, shaders, environmental events, UI or tests.
- The browser smoke flow pauses the monthly clock during deterministic planet-building assertions, then steps exactly one month. The branch's CI result remains authoritative; no green status is assumed until it completes.
