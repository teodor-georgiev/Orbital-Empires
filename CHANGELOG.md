# Orbital Empires — Changelog

All published game builds use [Semantic Versioning](https://semver.org/). Version tags are created **only after** a reviewed integration and stable release, never on work-in-progress commits.

## [Unreleased] — Rival strategic economic AI (integration candidate)

- Rivals prioritize legal, high-value frontier colonies and preserve the credit/alloy/influence budget for the next claim instead of consuming it on shipbuilding.
- When frontier expansion is blocked, rivals choose affordable, productive colony upgrades using a deterministic return heuristic.
- No player autopilot, new UI, save-schema change or monthly-balance recalibration. This remains a feature-branch candidate until reviewed and integrated.

## [0.3.1] — 2026-11-03 · Seeded biome planets

- **Orbital environment:** deterministic starfield in WebGL and Canvas 2D fallback, visible asteroid fields, orbital comets, anomalies, rare black-hole systems and hostile void leviathans (fictional beyond Sol).
- Orbital-object selector supports keyboard/touch; one-time asteroids cost 8 credits and award 18 alloys, comet scans grant 10 unity, anomalies grant 22 research, black-hole surveys grant 34 research/+8 influence, leviathan encounters require two corvettes and cost one for bounded rewards. Old saves remain compatible; results persist in optional spaceScans.
- Original concept: [space environment SVG](docs/design/orbital-space-environment-concept.svg). Browser QA includes desktop/mobile screenshots.


- Original procedural WebGL planetary materials (clouds, ice, lava, gas bands, rings and terrain) with deterministic seeds and a matching Canvas fallback.
- Slightly randomized colors and cloud treatments on the game's existing original biome portrait atlas.
- 13 biome-specific surface buildings plus orbital harvesters, mines and observatories for survey-only worlds in player-owned star systems.
- Functional credit/alloy/science and housing bonuses, explicit biome restrictions, immutable save schema v1, and browser/CI regression tests.

## [0.3.0] — 2026-11-03 · Preview candidate

- Approved A+B+C hybrid: galaxy command, cinematic planet management and immersive orbital view with floating inspector.
- Deterministic asymptotic population growth, visible carrying capacity, and click-to-focus planets; browser desktop/mobile screenshots validated.
- Original reference visual saved under docs/design/; save schema v1 preserved.

- Optional Human Solar Frontier scenario, starting on Earth in Sol with a curated, cited nearby-star catalog including Alpha Centauri and Proxima Centauri.
- Editable starting year (2000–3000) and player-species selection in a procedural galaxy.
- Sol 3D viewer shows eight real-named Solar System planets with Earth as the colony; real orbital distances displayed separately from visual scene spacing.
- Real-time-with-pause and player autonomy are approved design directions; the separate clock PR #19 remains under review, not included in this branch.
- Shared agent contract, versioned game specifications and formal design-decision ledger.
- Legacy saved campaigns remain compatible with schema v1.

## [0.2.0] — 2026-11-03 · Preview candidate

- Interactive galaxy/solar-system switching with seeded planets, orbit animation, biome art, rings, and moons.
- Display-quality presets (1080p, 1440p, 4K-capable Canvas), selectable interface themes, and reduced motion.
- Technology branches and four additional discoveries.
- New Unity resource, nine traditions in three paths, and six social policies in three exclusive slots, with simulation effects.
- Additional simulation tests and offline PWA resources.
- Existing save schema remains **v1** (no forced campaign reset).

## [0.1.0] — 2026-11-03 · Initial playable slice

- Turn-based procedural galaxy, colonization, industry, research, fleets, combat, diplomacy, and AI civilizations.
- Offline-capable PWA, local campaign saves, and static self-hosting package.

## Release and branching policy

- `feat/*` and `fix/*`: development changes and isolated preview deployments.
- `feat/turn-based-4x-pwa`: shared integration branch for combined features and staging checks.
- `main`: stable release source, promoted only after required CI, review, gameplay smoke tests, and staging checks.
- App version: `package.json` and `version.js` kept synchronized by `tests/version.test.js`.
- Save format: `SAVE_SCHEMA_VERSION` in `version.js` is separate from the app release version. A save-schema change requires migration tests.
- Create signed or annotated `vMAJOR.MINOR.PATCH` Git tags only from the reviewed stable-release commit.
