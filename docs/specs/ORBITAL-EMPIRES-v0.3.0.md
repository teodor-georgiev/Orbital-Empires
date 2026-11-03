# Orbital Empires — Game Specification v0.3.0 (Candidate)

**Date:** 2026-11-03  
**Status:** Development candidate on its own PR; not automatically a public release.  
**Previous:** [v0.2.0](../../CHANGELOG.md)  
**Decision:** [ADR-0001 — Real-time with pause and organizational autonomy](../decisions/ADR-0001-REAL-TIME-AUTONOMY.md).

## Goal and player promise

A browser-based, self-hostable, installable single-player 4X about guiding a civilization that can eventually manage its own routine affairs. You control government priorities and key actions, while independent departments develop the empire. Unlike v0.2's entirely manual End Turn play, the v0.3 Solar Frontier adds Humans, real nearby stars and calendar setup; time controls are owned by **separate PR #19** and not in this branch. Full autonomous departments remain unimplemented.

## Game setup

- **Scenario: Solar Frontier (default).** Play as Humans, government United Earth Directorate, capital world Earth in star system Sol, campaign starts **2200** by default. Sol, Alpha Centauri, Proxima Centauri, Barnard's Star, Wolf 359, Lalande 21185, Sirius and other actual nearby stars appear as named systems. Their map locations are schematic (not scientific spatial coordinates); distances from Earth are approximate published values. Alpha Centauri A/B and Proxima form one physical triple-star system; the UI separates distant Proxima into an adjacent **game sector** for navigability.
- **Scenario: Procedural Galaxy.** Previously implemented star/planet generation remains. Player faction can be Human, Auralian, Vexari, Solari, Keth, Umbral or Orionic. Non-Human species and governments are original fiction.
- **Starting year:** integer from **2000 to 3000**, default 2200. Stardate `YEAR.MM` begins at `YYYY.01` and rolls to the next year after 12 simulation months. An old save missing `startYear` displays its historical `2201.01` origin.
- Existing size, opponents, difficulty, galaxy seed and campaigns remain supported. Game will never silently reset a valid local save on version update.

## Stars, planets and map authenticity

- The Solar System depicts Mercury, Venus, **Earth (sole initial colony)**, Mars, Jupiter, Saturn, Uranus, Neptune. Orbital distances in AU are catalog values; visual orbits/sizes are **deliberately not to astronomical scale** for legibility. Moon icons are representative, not a complete satellite catalog. Sol has a star named Sun.
- The names and rough distances of nearby stars are scientific facts. Other game properties (hyperlanes, habitability, mineral wealth, generated non-Sol planets, rival empires) are inventions, not a catalog of discovered planets.
- Map topology stays a connected seeded graph. Numeric system IDs and path legality must remain stable; a saved Sol scenario uses its explicit stored neighbors.

## Time and player agency — separate clock PR #19

- **Current v0.3 branch:** Manual `endTurn` advances the existing rules by one displayed calendar month; the economic balance has not yet been rescaled to a realistic month. **Separate PR #19:** explores four clock sub-ticks per existing strategic cycle. Both are transitional designs, not a fully independent monthly economy. It is *not* a fully simulated continuous economy or orbital physics engine.
- The desired final controls include **Pause / Play / adjustable speed / Step one month**. PR #19 currently implements a different interim tick-clock with slow/normal/fast and four phases per strategic cycle; its implementation and tests must be reviewed on their own merits before integration. The clock PR should pause on startup, for modal menus, hidden tabs and game over, without hidden-tab catch-up; these are its required checks, not features of the Sol branch.
- Drawing and gameplay clocks are separate; rendering can be fluid even when game state changes on discrete ticks. User can direct fleets, colonies, technology, traditions, and diplomacy at any time.
- **Not yet included:** movement transit/ETA, monthly economic rebalancing, treasury budgets, player department automation, automating diplomacy, fully continuous physics. Those belong to v0.4/v0.5 and require tests and optionally a future save-schema migration.

## Future v0.4 departmental autonomy specification

| Department | Manual | Assist | Autonomous (within guardrails) |
| --- | --- | --- | --- |
| Exploration | Player issues orders | Suggest safe routes | Survey legal routes and report findings |
| Colonies | Player chooses building queues | Recommend upgrades | Build within an assigned resource budget, never below reserves |
| Research | Player picks tech | Recommend available tech | Select from player-approved technology focus |
| Fleet Command | Direct movement and battles | Suggested formations | Patrol/defend territory; no new wars |
| Diplomacy | Player makes agreements | Suggest treaties | Routine envoy actions only; ask before war or binding treaty |

Player-set priorities outrank AI. A manual order locks that object from autonomous reassignment until completed/revoked. Every executed AI decision must log motivation, cost and effect. No autonomous irreversible or risky action without explicit policy permission. All organizations use deterministic, inspectable game logic, not mandatory live calls to an LLM.

## Acceptance checklist for v0.3
- [ ] Start a new Sol campaign in chosen year; Earth and Sol are home; Alpha Centauri and other real nearby stars visible and cataloged.
- [ ] All eight named Sol planets render in the system view and Earth is selectable.
- [ ] A procedural game still works; faction choice changes player empire; old saves pass validation and load without schema migration.
- [ ] Starting year and month display update correctly with manual End Turn; PR #19 separately validates pause/speed and hidden-tab behavior.
- [ ] Existing AI, research, traditions, policies, save/load, graphics settings and PWA continue functioning.
- [ ] CI, accessible UI smoke and deployed version checked on exact head. Only then publish v0.3 as a verified preview.

## Non-goals
- Copying Ascendance or Stellaris systems/art verbatim.
- Asserting all generated planets outside Sol are real.
- Claiming orbital motion or 3D planet sizes are scientifically scaled.
- Continuous server-hosted simulation, multiplayer or fully autonomous government in v0.3.
