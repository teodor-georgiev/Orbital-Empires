# Orbital Empires — Ordered Development Backlog

> Updated 2026-11-03. This is the single backlog for the eight-lane development plan. Issue links name tasks, not agents actually running. Each task gets its own feature branch and focused PR to `feat/turn-based-4x-pwa`.

## P0 — Current development priorities

- [ ] Review and integrate **v0.3 Solar Frontier / Human Earth** in the dedicated PR: real-star names/distances, starting year, Sol planetary atlas and shared specs. Check Node tests and web/PWA smoke on exact source SHA before releasing.
- [ ] Review **[PR #19](https://github.com/teodor-georgiev/Orbital-Empires/pull/19)** separately: simulation clock with pause and speed. One owner for clock source, no competing implementations in Sol PR.
- [ ] Build **[issue #21](https://github.com/teodor-georgiev/Orbital-Empires/issues/21)** after the clock: autonomous departments (exploration, colonies, research, defense) with budgets, manual overrides and logs.
- [ ] Build **[issue #22](https://github.com/teodor-georgiev/Orbital-Empires/issues/22)** after the clock: monthly economic rebalance and actual fleet transit/ETA.

## P0.1 — Previous integrated game release verification

- [ ] **Director:** Complete and review `feat/oe-v020-civics-3d-integration-20261103`; keep existing WebGL view and its 2D fallback. Run full tests and examine complete diff.
- [ ] **Director + Lane H:** Browser-smoke a seeded campaign: menu, star selection, enter/exit solar view, tech, traditions, policies, End Turn, save/reload, 4K setting, reduced motion, responsive layout.
- [ ] **Director:** Merge only after required CI/security/review/staging gates; verify the exact deployed GitHub Pages commit and `BUILD v0.2.0`; document the published hash. Tag an eventual stable version from an approved stable commit, **not** from an unmerged feature branch.
- [ ] **Director:** Fix any broken launch/configuration, page cache, missing assets or game actions before large feature expansion.

## P1 — Eight parallel independent work packets

| Lane | Existing issue | Work packet | Exclusive write path | Dependency / acceptance |
| --- | --- | --- | --- | --- |
| A Galaxy | [#3](https://github.com/teodor-georgiev/Orbital-Empires/issues/3) | Deterministic spiral/ring/cluster positioning and connected lanes | `modules/galaxy/**`, `tests/galaxy.*` | Same-seed, connectivity and fair start tests |
| B UI | [#4](https://github.com/teodor-georgiev/Orbital-Empires/issues/4) | Main menu, new-game model, keyboard/accessibility helpers | `modules/ui/**`, `modules/styles/ui-*.css`, `tests/ui.*` | Usable keyboard flow; director wires screens |
| C Economy | [#5](https://github.com/teodor-georgiev/Orbital-Empires/issues/5) | Pure yields/colonization/upgrade/research calculators | `modules/economy/**`, `modules/research/**`, `tests/economy.*` | Preserve existing actions and exact outputs until contracted change |
| D Strategy | [#6](https://github.com/teodor-georgiev/Orbital-Empires/issues/6) | Fleet legality, seeded combat and AI utility helper extraction | `modules/strategy/strategy-*.js`, `modules/ai/**`, `tests/strategy.*` | No illegal moves, repeatable battle results |
| E Visuals | [#12](https://github.com/teodor-georgiev/Orbital-Empires/issues/12) | 3D/2D camera math, draw budget/quality settings, material utilities | `modules/visuals/**`, `tests/visuals.*` | Backing-size caps and fallback test; existing `solar-view.js` untouched |
| F Assets | [#13](https://github.com/teodor-georgiev/Orbital-Empires/issues/13) | Licensed original/CC0 asset catalog and small curated visual pack | `assets/curated/**`, uniquely named `assets/original/**`, `tests/assets.*` | Every asset provenance and checksum verified |
| G Story | [#14](https://github.com/teodor-georgiev/Orbital-Empires/issues/14) | Faction definitions and seeded anomaly/event choice engine | `modules/events/**`, `modules/factions/**`, `modules/diplomacy/**`, `tests/events.*` | Same seed yields same choices, bounded effects |
| H QA | [#15](https://github.com/teodor-georgiev/Orbital-Empires/issues/15) | Static/PWA/save/browser smoke fixtures and quality assertions | `tests/qa.*`, `tests/e2e/**`, `scripts/smoke/**` | Runnable, fail-loud tests and reproducible QA log |

**Director-only shared files:** `core.js`, `app.js`, `index.html`, `style.css`, `solar-view.js`, `system-model.js`, `sw.js`, `version.js`, `package.json`, `docs/**`, `.github/**`, `modules/strategy/civics.js`, and all deployment configuration. One owner per exported contract and one writer per branch.

## P2 — Follow-up tasks by system

- **Galaxy:** sector ownership borders; strategic choke points; wormholes, anomalies, rare system traits.
- **UI:** complete Codex, tooltips, turn summary, tutorial missions, event popups, save export/import.
- **Economy:** meaningful planet specialization; production tradeoffs; later multi-colony per star with save migration.
- **Research:** real Physics/Engineering/Society branches; unlock impacts explained per technology.
- **Strategy:** fleet stance and doctrine; explainable battle report; ship designer as a separate milestone.
- **Visuals:** procedural atmosphere, gas-giant bands, rings, shaders, low-end fallback, zoom transitions.
- **Assets:** consistent visual language for ships/planets/origins; audio with proven redistribution rights.
- **Story:** anomalies, empire origins, first-contact event chains, diplomacy and federation votes.
- **QA:** seed fuzzing, 40/90/180-star soak tests, no-save/offline compatibility, failed-PWA recovery.

## Per-issue definition of ready

A lane task is ready only when it has: user-observable outcome, accepted input/output API, owner directories, expected tests, clear dependencies and a base integration commit SHA. Do **not** start work in a lane if another lane currently owns the same file or if base has changed without reconciling.

## Definition of done per lane

1. Tests added and passing; current GitHub CI checked on exact head SHA.
2. Diff shows only owned files; no unrelated refactor or unsupported dependency.
3. A focused PR targets the shared integration branch and explains exports and wiring requests.
4. Reviewer checks correctness, accessibility/security and licensing where relevant.
5. Coordinator integrates modules into shared code, runs complete tests, validates UI/preview and verifies deployment if releasing.
6. GitHub issue/PR journal has commit, tests, blockers and next step.

## Suggested parallel execution

- **First wave:** A Galaxy, B UI, C Economy, D Strategy, E Visuals, F Assets, G Story, H QA can develop *pure modules only* in parallel once the P0 v0.2 integration baseline is stable.
- **Second wave:** Coordinator connects completed modules in dependency order: C/D mechanics, A galaxy, B UI, E/F rendering/assets, G stories; H supplies QA throughout.
- **Release:** Coordinator alone merges/redeploys stable integration after all gates. Do not run eight simultaneous edits to root files.

**Concurrency is not proof of automation.** Starting 8 GitHub tasks is distinct from successfully dispatching 8 autonomous ChatGPT browser coding sessions. If a remote supervisor is introduced, first demonstrate two independent completed changes with verified PRs and durable job journals before raising concurrency.
