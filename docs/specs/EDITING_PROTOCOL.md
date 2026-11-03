# Shared specs: how all coding chats read, write, and version game features

## Roles
- **Reader:** every lane can read `AGENTS.md`, `docs/specs/**`, ADRs, issues, PRs and commits.
- **Proposal writer:** each lane writes a **new uniquely named** `docs/proposals/<lane>-<issue>-<topic>.md` on its own `feat/*` branch; that document references a section and version in the current spec.
- **Integrator:** coordinator reviews proposals and code, updates canonical spec and changelog via one merged PR, and communicates the new baseline SHA to all lanes.
- **Reviewer:** checks contracts, compatibility, simulations, UI, copyright/licenses, and test evidence.

## Required proposal structure
```text
Title and owner lane / GitHub issue
Base spec version and base Git SHA
Problem and player-facing outcome
Rules / inputs / outputs / examples
What changes in save schema, time units, AI or resource balance
Owned paths and public module interface
Tests / accessibility / performance / migration / rollback
Dependencies, risks and explicitly deferred functionality
Requested release version and acceptance gate
```

## Version controls
1. Release tag `vMAJOR.MINOR.PATCH` only after approved release, not for every PR. Keep `package.json`, `version.js`, initial HTML build label, PWA cache and `CHANGELOG.md` synchronized.
2. Save schema is independently versioned. `SAVE_SCHEMA_VERSION = 1` remains valid in v0.3. New optional fields may have backwards-compatible defaults; structural conversions require explicit versioned migration.
3. ADRs are immutable historical decisions. For new direction, add a superseding ADR rather than silently rewrite past decisions.
4. Each major feature gets one issue, a bounded branch, tests, a PR and review. Two chats never push to the same feature branch or author the same root file.
5. Cross-lane synchronization is by **GitHub commits/PRs**, not by claims in chat messages. Status must include exact SHA.
6. Merge gate: head CI success, review/security where relevant, current integration and browser QA, then deployment verification. Do not silently bypass missing gates.
7. Closed or hidden tab: no simulated catch-up or hidden server job; game time is client-local until intentionally redesigned.

## Rollout when chats are truly concurrent
Prove two completed PRs on non-overlapping paths before raising the number of simultaneous workers. Use the eight-lane matrix in `docs/PARALLEL_LANES.md`. Where an agent cannot reach the development VPS, use the connected GitHub editor safely. Human-directed proposals may be merged into the spec once reviewed.
