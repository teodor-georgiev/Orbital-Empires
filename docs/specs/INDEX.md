# Game specifications — shared versioned source of truth

**Current preview candidate:** [Orbital Empires v0.3.0](ORBITAL-EMPIRES-v0.3.0.md).  
**Stable deployed preview as of 2026-11-03 before this PR:** v0.2.0; check GitHub Pages workflow and page before claiming v0.3 is live.

## How sessions collaborate

Every coding chat reads this index plus [AGENTS.md](../../AGENTS.md). The default developer integration target is `feat/turn-based-4x-pwa`; `main` is the separate release branch. Each chat works on an isolated branch and its issue, writes changes, and sends a PR. Source-of-truth specifications **may be read by all**, but writes to canonical spec files are serialized through reviewed pull requests. This prevents chat A overwriting chat B.

Propose a rule change in `docs/proposals/<lane>-<topic>.md` and mention it in the PR, then coordinator updates the canonical spec and decision register. Keep spec version, game release version and save-schema version distinct. See [spec editing protocol](EDITING_PROTOCOL.md).

## Version history

| Version | Status | Scope |
| --- | --- | --- |
| v0.1.0 | historical implementation | Turn-based 4X initial game |
| v0.2.0 | deployed preview / historical | WebGL 3D solar inspection, traditions, social policies, 4K visuals |
| v0.3.0 | integration candidate | Human Sol/Earth scenario, real nearby star catalog, start year, selectable faction, fixed-step real-time pause/speed controls |
| v0.4.0 | not yet implemented | Autonomous player departments, goal/budget constraints, decision log and manual override |
| v0.5.0+ | proposal | Economic balancing for monthly ticks, fleet transit/ETA, planet colonies, save migrations |

## Companion documents

- [Real-time autonomy decision](../decisions/ADR-0001-REAL-TIME-AUTONOMY.md)
- [Ascendance gameplay research](../research/ASCENDANCE-4X-MECHANICS.md)
- [Real star catalog notes](REAL-STARS.md)
- [Feature backlog](../DEVELOPMENT_BACKLOG.md)
- [Game design](../GAME_DESIGN.md)
- [Architecture](../ARCHITECTURE.md)
