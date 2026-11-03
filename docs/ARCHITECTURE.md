# Orbital Empires — Technical Architecture (Current Code + Modularization Plan)

## Verified starting point: PR #1

The first implementation uses **plain browser JavaScript ES modules**, HTML, CSS, Canvas 2D, and **zero runtime dependencies**. The existing live modules are:
- `core.js`: deterministic-ish 4X game rules including seeded galaxy, connected hyperlanes, economy, research, AI, fleets and diplomacy. `generateGame` currently includes `startedAt: Date.now()`, so the entire saved-game object is not bit-for-bit deterministic even though generated systems match across runs.
- `app.js`: DOM UI, main menu, setup, HUD, canvas galaxy renderer, pointer navigation and saving.
- `index.html`, `style.css`: layout and responsive styling.
- `tests/game.test.js`: Node built-in test runner; 6 simulation tests. `npm test` requires Node 22+.
- `manifest.webmanifest`, `sw.js`, `assets/`: PWA shell.
- `Dockerfile`, `compose.yaml`, `deploy/`: loopback-bound static self-hosting, **not a production deployment**.
- `.github/workflows/ci.yml`: syntax, unit tests and PWA static verification. Existing branch CI checked green on 2026-11-03, but visual/browser QA is still pending.

**Do not replace the project with React/TypeScript/Vite without a separate architectural decision.** Modularize in-place using ordinary ES modules and preserve the no-dependency footprint initially.

## Contract extraction gate: before independent feature merges

As shipped, `core.js` and `app.js` are large shared modules. Four chats writing them at once would conflict. Therefore **the director alone owns these root files**. Feature lanes create extracted modules with public export contracts and tests under non-overlapping directories; the director then wires them into root files in small reviewed integrations.

Proposed modules (new paths, not yet connected):
- `modules/galaxy/`: seeded position generation, shape presets, hyperlane algorithms.
- `modules/ui/` and `modules/styles/`: main menu/setup components, view-state utilities and styles.
- `modules/economy/`, `modules/research/`: pure yields, costs, tech prerequisites and calculators.
- `modules/strategy/`, `modules/ai/`: fleet-order legality, battle math and AI decision policies.

Module rules: named exports; no mutation of global browser state; no `Math.random()` in rules; no new dependencies without approval; tests live in `tests/galaxy.*.test.js`, `tests/ui.*.test.js`, `tests/economy.*.test.js`, or `tests/strategy.*.test.js` respectively. Prefer pure functions that take state and return a value or bounded state patch. Avoid duplicating the entire simulation.

## Stable interfaces and migration strategy

**Existing v0.1 interfaces are authoritative until replaced via reviewed contract:**
- `generateGame({seed,size,opponents,difficulty})` returns a mutable campaign state.
- State has `version`, `seed`, `rng`, `turn`, `systems`, `empires`, `fleets`, `logs`, `explored` and `gameOver`.
- System IDs are numeric array indices; `neighbors` are arrays of those IDs. Do not silently change to string IDs.
- Player empire is `empires[0]`. Existing game has 4 resources (credits, alloys, science, influence) and 12 techs. See `core.js` for exact action signatures.
- `generateGame`, `endTurn`, `getVisibility`, `moveFleet`, `colonize` and other exported functions must continue to pass legacy tests after extraction.

**Hardening priorities:** specify versioned save migration before changing state shape; remove wall-clock-dependent values from reproducibility comparisons; separate seeded RNG from mutable gameplay; test an AI playthrough on 40/90/180 stars; add browser smoke test for menu, PWA install, save/load and canvas clicks; make missing/invalid save recovery user-friendly.

## Quality and security

All branches require current PR-based CI. For UI changes, use an isolated preview to verify layout and controls. GitHub fallback may run its own CI, but do not claim the isolated Turbopack preview exists for this dependency-free project. Do not deploy on a production host before explicit release gates. License review mandatory for outside assets.
