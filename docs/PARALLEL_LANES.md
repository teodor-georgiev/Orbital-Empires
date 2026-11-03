# Multi-chat / Multi-lane Development Playbook

**Goal:** 4 independent ChatGPT coding conversations + 1 director on the same GitHub repository without edit collisions.

## Shared source of truth

Repository: `teodor-georgiev/Orbital-Empires`. Shared development target: `feat/turn-based-4x-pwa`; production/default branch: `main`. Each lane must begin by opening GitHub, inspecting repo/branch/PR status, then reading `docs/GAME_DESIGN.md`, `docs/ARCHITECTURE.md` and its GitHub issue. Chats do not automatically share state or messages.

The approved VPS editor's isolated-worktree tools may manage **2–4 lanes** when available; today it returned an internal failure. Until recovery, use GitHub feature branches. Do not assume autonomous browser-chat messaging was proven simply because a bridge smoke test succeeded.

## File ownership, first independently testable deliveries

| Lane | Branch | Exclusive writes | M2 first deliverable |
| --- | --- | --- | --- |
| A: Galaxy | `feat/oe-galaxy` | `modules/galaxy/**`, `tests/galaxy.*.test.js` | Shape generators (spiral/ring/cluster), deterministic connected topology + tests; no `core.js` edits |
| B: UI | `feat/oe-ui` | `modules/ui/**`, `modules/styles/**`, `tests/ui.*.test.js` | Extract menu/new-game view rendering and keyboard/accessibility utilities; no `app.js`, `style.css`, `index.html` edits |
| C: Economy | `feat/oe-economy` | `modules/economy/**`, `modules/research/**`, `tests/economy.*.test.js` | Pure resource/upgrade/research calculators + balancing tests; preserve existing public outputs |
| D: Strategy | `feat/oe-strategy` | `modules/strategy/**`, `modules/ai/**`, `tests/strategy.*.test.js` | Pure fleet order legality, basic AI priorities and deterministic combat tests |

## Director owns

`core.js`, `app.js`, `style.css`, `index.html`, `package.json`, `README.md`, `docs/**`, `.github/**`, PWA/deploy files, and all cross-lane integration changes. Only the director integrates newly exported modules into the existing game and updates old tests. Do not let separate chats independently replatform the project.

## Start-up recipe for each ChatGPT chat

1. In the Orbital Empires ChatGPT Project, open a **new chat per lane**. Give it only its lane issue and this prompt (below). ChatGPT Web cannot be presumed to spawn/manage concurrent conversations itself.
2. Connect/use the GitHub app. Inspect the current dev branch and no uncommitted work (if VPS worktree available); create your dedicated lane branch from the exact integration SHA.
3. Implement one narrow task, run `npm test` (Node 22+), inspect complete diff, open PR **to the shared integration branch**. Include base SHA, files, test evidence, contract requests.
4. Director reviews lanes in dependency order, checks every CI result and resolves any shared integration, before merging. The initial PR #1 to `main` remains separate; no direct production deployment.

### Copyable message

> Work on teodor-georgiev/Orbital-Empires as **LANE [A/B/C/D]** for the corresponding GitHub issue. Begin with GitHub repo status, current development branch, docs/GAME_DESIGN.md, docs/ARCHITECTURE.md and docs/PARALLEL_LANES.md. Branch from feat/turn-based-4x-pwa to your dedicated feat/oe-[name] branch. Work ONLY in the paths in your lane's table; avoid changes to root shared game files, CI and release configuration. Add focused tests and check npm test and diff. Open a PR targeting feat/turn-based-4x-pwa; do NOT merge or deploy. Report links, commit SHA, test results and needed integration API changes.

## Synchronization and access safety

- One writer per branch/path; do not allow parallel runs on one Git worktree or uncertain resends.
- Document explicit exported API before wiring into root code; director owns core integration.
- Persistent PR/issue journal: objective, base SHA, current branch, state, next action, tests, blockers. Don't rely on chat memory alone.
- Pinned profiles only for ChatGPT Web, Claude, Codex, OpenCode Go/Free; no automatic account substitution or quota evasion.
- After crash, inspect issue + PR + branch first before re-running write actions. Distinct branches allow simultaneous sessions, but **the bridge has not yet proven multiple autonomous browser-coding completions in this repo**.
