# Planet appearance and biome buildings — implementation target

**Direction already authorized by owner:** "randomize planet pictures a little, make 3D models reflect biome types, add planetary buildings based on planetary type" → owner replied "go implement all" on 2026-11-03. This extends the already approved A+B+C layout; it does not redesign the navigation.

## Original visual direction (picture first)
[Seeded biome showcase and development panel](seeded-biomes-building-board.svg) — original SVG mockup created before gameplay implementation; illustrated, not a tested browser capture. It shows nine biome palettes, the shared planet inspector and terrain-specific construction with ordinary colony buildings still visible.

## Rules
1. Keep a planet's biome and deterministic orbital placement; derive small-but-visible per-planet color, noise, band, ice/cloud, lava, ring and rotation differences from immutable game seed + system ID + planet ID. Never use `Math.random` for persisted visuals. Star names and Sol AU remain factual.
2. The browser's 3D planet material and 2D preview/portrait must use the **same deterministic biome parameters**. Preserve WebGL1 and non-WebGL Canvas fallback, offline-first resources and reduced motion.
3. Existing core buildings remain available on habitable primary worlds. Add biome-specific buildings with real credits/alloys/science/capacity effects. A building from the wrong biome is rejected by the core engine, not just hidden by UI.
4. Survey-only non-primary planets may host **orbital infrastructure** if their system is owned, not surface colonies or population. Gas giants support orbital fuel harvesters. Orbital output belongs to the controlling star system; optional per-planet construction state is stored as `system.orbitalSites` with absent=empty so schema v1 saves remain valid.
5. Make available, insufficient-resources, wrong-biome and max-level states understandable. Test determinism, wrong-biome rejection, currency accounting, no double credit, saved-game compatibility and foreign ownership restrictions.
6. Release only after node suite, GitHub CI, Chrome interaction and desktop/mobile screenshots pass. Keep changes in dedicated feature branch then merge into GitHub Pages integration branch on green gate.

**Constraints:** No proprietary game assets. No new mandatory build pipeline, no unused currencies, and no production direct edits.