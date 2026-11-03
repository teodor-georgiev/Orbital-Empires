# Parallel ChatGPT Development: 4 Lanes + 1 Director

## Why this design

Multiple ChatGPT chats do not automatically share working memory or edits. **GitHub is the source of truth**: one stable integration branch, explicit contracts and PR reviews. When the isolated VPS workspace broker is available, it can create 2–4 separate worktrees; until then use independent GitHub feature branches. Never allow two lanes to write the same shared file.

## Director (this conversation)

Owns game design, architecture contracts, `src/core/**`, `src/app/**`, CI, test integration and release decisions. Coordinates task issues, rebases/integrates PRs after verification, prevents duplicate work, reviews assets/licensing. Shared integration branch: `feat/turn-based-4x-pwa`.

## Lane assignments

| Lane | Chat | Write ownership | First deliverable |
| --- | --- | --- | --- |
| A | Galaxy | `src/galaxy/**` | Deterministic system generation and connected hyperlane topology, tests |
| B | Interface | `src/ui/**`, `src/styles/**` | Main menu, new campaign wizard, command HUD and map components |
| C | Economy | `src/economy/**`, `src/research/**` | Basic resource ledger, colonies, research prerequisites and tests |
| D | Strategy | `src/fleets/**`, `src/diplomacy/**`, `src/ai/**` | Legal orders for scout movement, foundation for AI rivals |

The coordinator may temporarily implement an M1 thin vertical slice in shared paths; lanes then extend via reviewed contracts.

## Branch naming and merge strategy

- Branch from the **exact integration commit**: `feat/oe-galaxy`, `feat/oe-interface`, `feat/oe-economy`, `feat/oe-strategy`.
- Each chat begins by inspecting repo status, current branch, `docs/GAME_DESIGN.md`, `docs/ARCHITECTURE.md`, and its lane issue.
- Only edit owned files. If a shared type must change, open a contract proposal for director; do not silently edit it.
- Each lane opens a PR **into `feat/turn-based-4x-pwa`**. Keep PRs small and inspectable. Review all diffs, tests, licensing and no-conflict assumptions.
- Integrate sequentially after checks, starting from lowest dependency to highest (Galaxy → UI → Economy → Strategy). Rebase/reconcile later branches before merge.
- After a verified integrated milestone, director opens integration-to-main PR; never bypass missing or failed checks.
- ChatGPT Web chats need independently opened conversations; we cannot assume the bridge has proven autonomous multiple-conversation coding. Make every handoff recoverable from GitHub issue/PR state and never blindly resend uncertain commands.

## Example lane prompt (replace bracketed values)

> Work on Orbital Empires in `teodor-georgiev/Orbital-Empires` as Lane [A/B/C/D] for [task]. Use GitHub. First inspect `feat/turn-based-4x-pwa`, game/architecture docs and the corresponding issue. Create or use your own `feat/oe-[lane]` branch from the latest integration commit. You own only [paths]. Implement and test the smallest coherent change, inspect the complete diff, then open a PR into `feat/turn-based-4x-pwa`. Do not edit main or other lanes' files, merge, deploy or claim unverified tests. Report PR URL, commit, tests, blockers and contract changes.

## Recovery / safety

Persist goal, owner, base SHA, branch, files changed, test result, open questions in every PR. One writer per branch, no automatic substitutions across ChatGPT/Codex/Claude/OpenCode accounts, no duplicate sends after uncertain submissions, no unreviewed CI privilege escalation.
