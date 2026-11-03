# Solar System 3D View Implementation Plan

> **For agentic workers:** Use test-driven development and inspect each changed file before release.

**Goal:** Add a navigable 3D solar-system view beside the existing strategic galaxy, with click-through stars, orbit camera, selectable planets, and preserved 4X mechanics.

**Architecture:** Keep the existing deterministic game simulation and save schema unchanged. Generate decorative system bodies deterministically from the star's existing metadata and campaign seed. Render locally in WebGL, with a Canvas 2D fallback for unsupported browsers, while using existing HTML panels for colony operations.

**Tech Stack:** Vanilla JavaScript modules, WebGL 1, Canvas 2D fallback, Node built-in tests, GitHub Pages PWA. No network runtime dependencies.

**Spec:** User requested galaxy and solar-system views, zoom into 3D if possible, and existing turn-based mechanics.

## Global Constraints
- Keep existing stars, fleets, saves, building/research actions and routes working.
- Show no detailed planet information for unscouted/hidden star systems.
- Additional planets are illustrative in v0.2; only the original colony world has gameplay actions.
- GitHub Pages subpath and offline installation must work with relative paths.
- Deliver on a feature branch; run tests, visual browser QA and CI before public deployment.

## Review Focus
- Hidden systems cannot be opened via UI actions.
- Same (seed, star) produces identical body lists across reloads.
- Invalid world metadata does not break the game or renderer.
- WebGL unavailable still leaves the solar system playable via 2D canvas.
- Returning to Galaxy preserves selection, fleet routing and turn behavior.

---

### Task 1: Deterministic planet model
**Files:** Create `system-model.js`, `tests/system-model.test.js`.
**Interface:** `generateSystemBodies(seed, system) -> {star, planets, belt}`; `selectSystemPlanet(bodies,id) -> planet|null`.
- [ ] Write failing determinism, bounds, primary-colony and invalid-ID tests.
- [ ] Verify RED with `node --test tests/system-model.test.js`.
- [ ] Implement stable seeded body generation without mutating game systems.
- [ ] Verify GREEN and run full `npm test`.

### Task 2: 3D/2D renderer
**Files:** Create `solar-view.js`.
**Interface:** `createSolarView(canvas,{onSelect})` exposing `open(system,bodies)`, `close()`, `resize()`, `selectPlanet(id)`, `resetCamera()`, `is3D()`.
- [ ] Add browser smoke checks to cover WebGL scene and 2D fallback.
- [ ] Implement WebGL spheres, orbits, planet colors, lighting, moons, drag camera, scroll zoom, hit selection, and Canvas fallback.
- [ ] Verify interactions, rendering, resize, hidden tab, and fallback.

### Task 3: UI wiring
**Files:** Modify `app.js`, `index.html`, `style.css`.
- [ ] Add solar mode stage, back button, planet list and a dedicated accessible selection panel.
- [ ] On galaxy-star selection, provide an open-system control; switching modes preserves galaxy state and inspector actions.
- [ ] Add ESC/back navigation, viewport/responsive controls and render guards for fog of war.
- [ ] Verify no regressions in fleet selection, end turns, save/load, colonization and navigation.

### Task 4: Release safety and docs
**Files:** Modify `sw.js`, `README.md`, add this plan.
- [ ] Cache added modules and bump service-worker cache.
- [ ] Run Node tests, JS syntax checks, browser smoke/visual QA, and asset checks.
- [ ] Push reviewed diff to a new feature branch; open PR and verify CI before publishing via GitHub Pages.
