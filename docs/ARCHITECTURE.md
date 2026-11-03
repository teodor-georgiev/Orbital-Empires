# Technical Architecture and Contracts v0.1

## Platform and repository

Browser-first **React + TypeScript + Vite** PWA. Game rules are pure TypeScript modules and never depend on React, DOM, local storage, timers or network. Render galaxy as SVG for M1, migrate only the map surface to MIT-licensed PixiJS if performance data justifies it; keep game state and order processing separate from rendering.

Self-hostable static build for single-player; saves via `localStorage` in prototype, with future IndexedDB and versioned migration. Do not invent a backend until server-authoritative multiplayer becomes a requirement.

## Ownership

- `src/core/**`: typed deterministic data contracts, seeded RNG and turn rules (director/coordinator owns interfaces).
- `src/galaxy/**`: galaxy generation, topology and galaxy renderer (Galaxy lane).
- `src/ui/**`, `src/styles/**`: menu, shell, HUD, panels, responsive style, accessibility (UI lane).
- `src/economy/**`, `src/research/**`: economy/research pure rules and data (Economy lane).
- `src/fleets/**`, `src/diplomacy/**`, `src/ai/**`: ships, fleet orders, diplomacy, AI (Fleet lane).
- `src/app/**`: composition, persistence and navigation (director only).
- `tests/**`: cross-system integration tests (director) and local tests owned by each lane.

If a path doesn't exist yet, coordinate the contract before adding one. Lane branches must never write `src/app/**`, `src/core/**`, `package.json`, shared styles, or CI without explicit coordinator sign-off.

## Core types / stable identifiers

`GalaxySettings`: `seed: string`, `shape: spiral|elliptical|ring|clusters`, `size: 48|96|160|256`, `rivals: number`, `difficulty: explorer|standard|admiral`, `factionId: string`.

`StarSystem`: `id: string`, `name: string`, `x: number`, `y: number`, `starClass: string`, `planets: Planet[]`, `neighbors: string[]`; mutable campaign visibility, survey and ownership are stored separately to preserve generation reproducibility.

`Empire`: `id`, `name`, `color`, `capitalSystemId`, `resources`, `ownedSystemIds`. `Fleet`: `id`, `empireId`, `locationSystemId`, `destinationSystemId|null`, `ships`. `Campaign`: `schemaVersion`, `settings`, `turn`, `galaxy`, `empires`, `fleets`, `knowledge`, `events`.

Orders should be discriminated unions such as `{type:"MOVE_FLEET",fleetId,targetSystemId}`, `{type:"FOUND_OUTPOST",systemId}` and `{type:"END_TURN"}`; validation errors are values, never partial mutations.

## Determinism and reproducibility

Use seeded PRNG for galaxy/AI/combat. No Math.random, Date.now, locale-sensitive sorting or floating-point non-deterministic mutation inside simulation. All turn results derive from `campaign state + ordered commands`; keep rendering callbacks outside engine. Ownership/knowledge should not rewrite base galaxy layout.

## Quality gates

TypeScript strict, unit tests for deterministic generation, topology connectivity, valid legal moves, save/load and turn resource invariants; CI runs `npm run typecheck`, `npm run test`, `npm run build`. No claim of runtime verification until checks pass. PRs require review and passing checks before integration. No direct push to main.
