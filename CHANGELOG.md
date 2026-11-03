# Orbital Empires — Changelog

All published game builds use [Semantic Versioning](https://semver.org/). Version tags are created **only after** a reviewed integration and stable release, never on work-in-progress commits.

## [0.3.1] — 2026-11-03 · GitHub Pages release candidate

- Seeded distant starfield rendered in WebGL and 2D fallback, with bounded asteroid-belt rocks and observable moving comet/anomaly markers.
- Accessible orbital-object selector, including mouse and keyboard inspection. Asteroid and comet sites can be mined/surveyed; rare fictional procedural star systems may contain black-hole gravity wells or hostile void leviathans.
- One-time resource/research effects: asteroids cost 8 credits and award 18 alloys, comet scans grant 10 unity, anomalies grant research, black holes grant research/influence, and leviathan engagements require two corvettes and sacrifice one.
- Sol keeps the real named eight-planet system and has only an asteroid belt and comet from the new encounter pool. Special objects in other star systems are fictional.
- Save schema v1 preserved with optional bounded orbital-scan state; no repeated mining, no mandatory network connection or runtime dependencies.
- Government/Council integration from PR #32, real-star Solar Frontier and asymptotic population growth remain included.
- Browser tests cover desktop/mobile, PWA save persistence, and WebGL-disabled fallback. Public GitHub Pages deployment depends on the separately reviewed release.

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
