# Orbital Empires — Changelog

All published game builds use [Semantic Versioning](https://semver.org/). Version tags are created **only after** a reviewed integration and stable release, never on work-in-progress commits.

## [0.2.2] — 2026-11-03 · Planet command redesign

- Rebuilt command menu, grouped empire navigation, and unified planet management inspector.
- Click or select any charted planet to inspect survey details; the primary world exposes colony production and immediate building upgrades.
- Smooth deterministic logistic population growth per colony, with habitat-specific carrying capacity and live growth readout.
- Extended offline PWA cache, keyboard-accessible planet list, and automated Chrome interaction smoke tests.
- Existing save schema remains **v1**; other orbital planets are explicitly survey-only.

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
