# Orbital Empires — Game Design v0.1

## North star

A polished, turn-based 4X game playable in a browser and installable as a PWA, where **one turn represents one year** and a complete small-galaxy game is achievable in a sitting. Strategic depth should come from readable tradeoffs, not busywork.

High-level inspiration: Galactic Civilizations (accessible turn-based expansion), Master of Orion/FreeOrion (planetary strategy), Stellaris (discovery, events and diplomacy). **No copyrighted code, textures, UI screens, faction names, or game text may be copied.**

## Player experience and screen flow

1. **Main menu:** New Campaign, Continue (enabled only when a saved game exists), Settings, Codex/About. Animated procedural starfield and original emblem. Clearly mark unfinished features.
2. **New Campaign:** player empire/faction, galaxy seed, shape, star count, rivals, difficulty, and generate button. Always show the seed for reproducibility and allow regeneration.
3. **Galaxy command screen:** persistent resource top bar; left empire/notifications panel; large pannable/zoomable galaxy map with selectable systems; right selected-system/planet inspector; bottom turn controls, log and orders.
4. **Fleets and ship design:** move along lanes, explore fog, later refit and fight. Conflict resolution must explain outcome.
5. **Colonies:** planet details, population, production, economy priorities and buildings.
6. **Research:** independent progression in Physics, Engineering and Society; clearly show prerequisites and unlocks.
7. **Diplomacy:** contacts, opinion, pacts, trade, rivalries and war score.
8. **Victory:** Domination (territory), Knowledge (final project), Federation (diplomatic), Score (turn limit).

UI principles: crisp readable typography, celestial navy/charcoal, restrained teal/amber/coral accents, no overwhelming neon; desktop-first with tablet adaptations; all controls have visible text or accessible labels; no dead buttons; clear distinction between known, surveyed, and unknown systems.

## Galaxy generation

- Seeded deterministic PRNG; same seed + settings => same star coordinates, planet rolls, resources, and initial empire positions.
- **Current:** seeded elliptical starfield on a 1140×760 playfield, with 40–180 systems and 1–6 rivals.
- **Planned settings after extraction:** Spiral, Elliptical, Ring, Clusters; presets Scout / 48, Frontier / 96, Expanse / 160, Epic / 256 (validate performance before enabling Epic).
- Each system: stable ID and unique name, map coordinates, one star type, 1–6 planets, resource modifiers, habitability and orbital features.
- Hyperlane graph: connected with a guaranteed path between systems, extra local links for strategic alternatives. No impossible isolated starting systems.
- Symmetric *fairness constraints* for rivals: a minimum homeworld distance, nearby expansion opportunities, and no direct overlap.
- Fog of war: unknown systems hidden, neighbors revealed upon sensor contact; scanned system details unlocked by fleet arrival.
- Generation QA: determinism, graph connectivity, no duplicate IDs, no overlapping starting empires, bounded planet counts.

## Core loop

**Explore → Survey → Expand → Develop → Research → Negotiate or Fight → End Turn.**

Turn resolution order is fixed and testable:
1. Validate player orders and resource costs.
2. Resolve valid immediate actions (the v0.1 prototype moves fleets immediately).
3. On End Turn: apply yields, research, and AI plans in a consistent order.
4. Resolve diplomacy, conflicts, victory conditions and log messages.
5. Advance cycle and persist save. A future queued-order model must be a separately specified migration.

**Existing v0.1 code already includes** galaxy generation, colonization, a research tree, resource yields, basic building/ship recruitment, AI, combat/diplomacy, and end turn. The next step is to modularize and strengthen/balance this baseline rather than rewrite it from scratch. Future systems must not be presented as already playable.

## Economy

The current v0.1 prototype exposes **Credits, Alloys, Science and Influence**. Food and strategic materials are **future proposals**, not implemented. Prefer at most five top-bar currencies until the economy is playtested.

Each owned world has base yields and planetary modifiers. Every turn computes transparent net income. Colonies must specialize and offer tradeoffs; a weak colony can have excellent strategic position.

## Research, fleets, diplomacy

Three research paths with prerequisites and meaningful unlocks. Fleet hulls (Scout, Corvette, Frigate, Cruiser, Capital), weapon/defense tradeoffs, clear range and supply. Initially deterministic auto-battle before a tactical combat view. Diplomacy should be opinion-driven with personality traits and strategic goals, not scripted arbitrary declarations.

## AI and difficulty

First AI: a legal-move utility agent prioritizing survey, expansion, basic economy and defense, with seeded tie breakers. Difficulty changes starting bonuses and decision quality transparently; it must never silently cheat through fog.

## Multiplayer and persistence

**Do not build multiplayer first.** Offline local campaign saves, import/export later. Introduce server-authoritative turns only after single-player gameplay and save migration tests are sound. Use versioned saved-game schema with migrations.

## Milestone order

- **M0 Design first:** visual layout, data contracts, file ownership, legal asset plan.
- **M1 Playable shell (existing PR #1):** main menu, setup, procedural galaxy, pan/zoom, selectable stars, fog, expansion, fleet movement, resources/research and end turn, local save. Confirm behavior by manual browser QA before declaring it production-ready.
- **M2 Empire:** planets, colony construction, resource balancing, research and alerts.
- **M3 Rivals:** AI empires, borders, diplomacy and fleet combat.
- **M4 Polish:** PWA offline, accessibility, performance, game balance, tutorials and optional hosting.

## Non-goals for M1

Real-time simulation, tactical combat animations, multiplayer, paid DLC, user accounts and remote persistence.
