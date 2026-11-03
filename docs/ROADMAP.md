# Orbital Empires — Master Game Roadmap

> Updated 2026-11-03. This is the version-controlled **target game design**, not a list of features already playable. All coding chats should read this before beginning work.

## North star

An original, installable, browser-first **real-time-with-pause (fixed-step simulation)** 4X space-strategy game, migrating gradually from its playable turn-based roots. Inspiration: Galactic Civilizations, Master of Orion and Stellaris, but with original code, visuals and writing. Strategy is driven by memorable tradeoffs, compact turns and a galaxy that feels alive. No copyrighted game assets or source copied from other games.

**Core loop:** explore → survey → set policy and departmental goals → claim systems → develop colonies → research → adopt traditions and laws → trade/negotiate or fight → advance time, pause and intervene → respond to events. The current v0.3 preview adds the Human Sol scenario; a separate PR #19 develops initial automated time progression. Player-controlled departments are a future milestone.

## Current implementation vs ambitions

| State | Systems |
| --- | --- |
| Implemented on shared integration baseline | Deterministic star map and hyperlanes, map navigation/fog, turn-based resources, colonization, buildings, research, basic fleets/combat/diplomacy/AI, local saves, offline PWA |
| Implemented on shared integration baseline | WebGL 3D solar-system scene with orbitable camera, planets/moons and 2D fallback; **additional planets are visual-only** |
| Implemented in v0.2.0 | Unity, traditions, social policies, technology tree and configurable 4K Canvas backing resolution |\n| Feature candidate, integration/QA required | `v0.3.0` Human Earth/Sol scenario, real nearby star names and distances (schematic positions), start year and faction selection. Initial simulation speed controls are under review in separate PR #19 |
| Not implemented | Individual planet colonies, surface building, detailed politics, trade network, ship designer, espionage, multiplayer, campaigns and additional victory paths |

**Existing live URL:** https://teodor-georgiev.github.io/Orbital-Empires/ — v0.2.0 was verified published on 2026-11-03. v0.3.0 must not be called live until its integration PR is merged and the exact deployed build verified.

**Current authoritative spec:** [v0.3.0 candidate](specs/ORBITAL-EMPIRES-v0.3.0.md). **Real-time/autonomy decision:** [ADR-0001](decisions/ADR-0001-REAL-TIME-AUTONOMY.md). All coding chats must read [AGENTS.md](../AGENTS.md) before changing files.\n\n## Game systems we want to build

### 1. Main menu and campaign setup

Original logo, moving starfield, New Game, Continue, Settings, Game Codex, Credits. Configurable galaxy seed, faction, rivals, galaxy shape, galaxy size, difficulty and optional tutorial. Saves are user-exportable/importable later. Make the game understandable without reading a manual. No broken controls.

### 2. Galaxy simulation and map

Spiral, ring, elliptical and cluster shapes. 48/96/160 systems initially; 256-star epic mode after profiling. Deterministic connected hyperlane networks, chokepoints, frontier sectors, star types, nebulae, black holes, resources, anomalies, wormholes, surveyed/hidden information and fair starting positions. Clickable sector overlays, borders and routes. Stable seed and system IDs for reproducibility.

### 3. Multi-scale visuals and planets

Galaxy → system → planet inspector. Keep existing interactive WebGL solar view with orbit rotation, zoom, planets and moons, with 2D fallback. Add planet materials (Terran, desert, ocean, volcanic, ice, jungle, barren, gas giant), star lighting, atmospheres, rings, asteroid belts and station visuals. Quality presets Performance (1080p cap), Balanced (1440p cap), Ultra 4K (3840×2160 cap), reduced motion, UI scaling and 3 style palettes. Later, individual colonizable planets and optional surface/district scenes after a saved-game schema upgrade; **do not present a scene as full gameplay if it is only visual**.

### 4. Colonies and economy

Economy begins with Credits, Alloys, Science, Influence and Unity. Clear per-turn net production, transparent costs, buildings and specialization into industry, commerce, research, culture or defense. Later population species, stability, migration, orbital stations, strategic materials, internal trade routes, resource scarcity and planet-level building queues. Balance meaningful competing investments rather than adding currencies indiscriminately.

### 5. Technology, traditions and social policies

Branching technology tree with prerequisites and permanent rule effects, later separate Physics/Engineering/Society research. Unity enables traditions in Expansion, Prosperity, Discovery and later Diplomacy/Supremacy/Adaptation. Policies are mutually exclusive within Economy, Society and Defense slots, with influence cost and clearly shown bonuses. Later government authority, ethics, internal factions, agenda choices and reformation costs. AI must use coherent empire strategies rather than random bonuses.

### 6. Species, factions and civilizations

Original selectable species/factions, traits, ethics, origins, emblems, flags, government types, diplomacy preferences, initial doctrines, fleet identity and leader characters. Each faction has at least one meaningful tradeoff. Build procedural or authored faction backstories and campaign goals; avoid copyright-infringing clones.

### 7. Exploration, anomalies and events

Anomaly discoveries, first-contact scenarios, asteroid incidents, derelict ships, archaeological sites, precursors, branching story choices, event consequences and long-running chains. Seeded event selection with bounded rewards and no softlocks. An event log must explain every resulting state change.

### 8. Fleets, ship design and warfare

Fleet classes, movement along hyperlanes, scouts, shipyards, upgrades, refits, battle reporting, admirals, defenses, fleet doctrines, supply lines and eventual ship designer with hull/weapon/shield/engine slots. Initially deterministic auto-resolved battles with inspectable outcomes; later optional tactical encounter view. Transparent movement legality; no invisible AI cheating.

### 9. Diplomacy, trade and politics

First contact, relations, embassies, research agreements, trade treaties, non-aggression pacts, border access, federations, galactic council, claims, war goals, peace deals, sanctions and espionage. Believable AI strategic interests, explainable proposals and bounded treaty effects.

### 10. AI opponents

Utility-based baseline: explore, survey, colonize, specialize, research, defend, negotiate and attack when advantageous. Deterministic seeded tie breakers, reachable legal actions, skill-tier difficulty, turn-budget limits and 100-game automated balance simulations. Later personality strategy plans and dynamic threats; do not claim human-level AI.

### 11. Victory, progression and replayability

Domination/territory, scientific breakthrough, federation/diplomatic and score/turn-limit victories. Event-driven objectives and optional scenarios. Achievements and leaderboards only if the added platform/privacy cost is worthwhile; single-player and offline-first remain the priority.

### 12. Audio, art, accessibility, performance

Original or independently commercially licensed music/FX, ships, station icons, faction seals, rich planet palettes and UI animations. Source/license/attribution manifest mandatory for third-party assets; no unlicensed Stellaris/Workshop files. Keyboard support, high contrast, reduced motion, responsive layout, color-coded controls that also have text, low-spec GPU fallback and 4K frame-budget checks.

### 13. Persistence, networking and hosting

Local autosave with semantic **app version** separate from **save schema version** and tested migrations. Export/import and checkpoint saves. Optional cloud saves and multiplayer only after single-player is stable and server authority has a separate design/security plan. GitHub Pages for static preview; no required backend for the core game.

## Delivery phases

| Priority | Milestone | Acceptance gate |
| --- | --- | --- |
| P0 | Integrate v0.2 3D + civic features and versioning | Exact-commit CI green; browser smoke; live deployed hash/version confirmed; no regression in saves or PWA |
| P1 | Polished main menu, setup, galaxy shapes, accessible navigation | Players can generate, explore, colonize, save, reload and finish 30+ turns |
| P2 | Better economy, tech tree, traditions, factions and anomalies | Every choice changes rules, consistent costs and meaningful AI decisions |
| P3 | Fleet/war strategy, diplomacy, original art and sound | Legible war outcomes and multiple viable play styles |
| P4 | Planet-level gameplay, ship designer, deep diplomacy, more victory types | Save migration plus performance and balance verification |
| P5 | Optional multiplayer and mod/scenario tools | New explicit architecture plan and security review |

## Design constraints

- Build on current vanilla ES modules, Canvas/WebGL, HTML/CSS and Node test runner; no rewrite into a framework without an approved architectural decision.
- One coordinator owns shared integration files, release pipeline and public deployment; independent lanes own isolated modules/tests.
- Same seed/settings should generate the same strategic world (except explicitly documented non-gameplay timestamps).
- A testable working game must remain available after each milestone.
- Prioritize small playable vertical slices over entire unfinished subsystems.
- Track decisions and blockers in GitHub issues/PRs; do not rely on chat memory.
- No direct production edits, silent high-risk deployment or skipping failed/missing CI and staging checks.
