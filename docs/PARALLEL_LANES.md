# Orbital Empires — Eight-Lane Development Playbook

> Updated 2026-11-03; extended from the existing four-lane playbook. **Eight lanes are proposed workstreams, not eight currently running agents.**

## Shared source of truth

- GitHub repository: `teodor-georgiev/Orbital-Empires`
- Development integration: `feat/turn-based-4x-pwa`
- Default/stable branch: `main` (never edit directly)
- Project plan: [ROADMAP.md](ROADMAP.md)\n- **Canonical game spec and version protocol:** [specs/INDEX.md](specs/INDEX.md), [specs/EDITING_PROTOCOL.md](specs/EDITING_PROTOCOL.md), and root [AGENTS.md](../AGENTS.md). Independent chats propose edits through their own branches/PRs, never simultaneously write canonical spec files.
- Prioritized tasks: [DEVELOPMENT_BACKLOG.md](DEVELOPMENT_BACKLOG.md)
- Constraints: [ARCHITECTURE.md](ARCHITECTURE.md), [GAME_DESIGN.md](GAME_DESIGN.md)
- Source assets: [ASSETS_AND_LICENSES.md](ASSETS_AND_LICENSES.md)

## Lanes and single-writer ownership

| Lane | Issue | Working folder | Purpose |
| --- | --- | --- | --- |
| A Galaxy | [#3](https://github.com/teodor-georgiev/Orbital-Empires/issues/3) | `modules/galaxy/**`, `tests/galaxy.*` | Galaxy generation, hyperlanes, seeds |
| B UI | [#4](https://github.com/teodor-georgiev/Orbital-Empires/issues/4) | `modules/ui/**`, `modules/styles/ui-*.css`, `tests/ui.*` | Menu, setup, accessibility |
| C Economy | [#5](https://github.com/teodor-georgiev/Orbital-Empires/issues/5) | `modules/economy/**`, `modules/research/**`, `tests/economy.*` | Yields, costs, tech calculators |
| D Strategy | [#6](https://github.com/teodor-georgiev/Orbital-Empires/issues/6) | `modules/strategy/strategy-*.js`, `modules/ai/**`, `tests/strategy.*` | Fleet legal actions, combat, AI |
| E Visuals | [#12](https://github.com/teodor-georgiev/Orbital-Empires/issues/12) | `modules/visuals/**`, `tests/visuals.*` | Camera/lighting/4K performance |
| F Assets | [#13](https://github.com/teodor-georgiev/Orbital-Empires/issues/13) | `assets/curated/**`, new uniquely named `assets/original/**`, `tests/assets.*` | Original and licensed art |
| G Story | [#14](https://github.com/teodor-georgiev/Orbital-Empires/issues/14) | `modules/events/**`, `modules/factions/**`, `modules/diplomacy/**`, `tests/events.*` | Factions, anomalies, diplomacy |
| H QA | [#15](https://github.com/teodor-georgiev/Orbital-Empires/issues/15) | `tests/qa.*`, `tests/e2e/**`, `scripts/smoke/**` | Regression and browser smoke |

**Director exclusively owns:** `core.js`, `app.js`, `index.html`, `style.css`, `solar-view.js`, `system-model.js`, `sw.js`, `version.js`, `package.json`, `README.md`, `docs/**`, `.github/**`, deployment configuration, `modules/strategy/civics.js` and integration tests that touch shared root state.

Existing lane A–D branches exist but may be stale. Inspect their actual current contents, PRs and latest integration SHA before reusing any branch. **Never assume a branch is ready because it exists.**

## Independent coding-chat startup

1. Start one ChatGPT Project chat per lane. Its brief is the lane issue and this playbook; independent chats do not automatically share live working context.
2. Use the approved VPS Edit v4 isolated preview worktree when reachable; otherwise use the GitHub app. First inspect repository and branch statuses.
3. Create a fresh branch `feat/oe-<lane>-<task>-YYYYMMDD` from the current exact integration SHA. Do not reuse a dirty or stale branch. If editing with GitHub tools, stay on the branch.
4. Read the issue and only the relevant source files; implement the smallest self-contained contract and tests, not changes to root shared files.
5. Run Node 22+ `npm test`, inspect all changes, ensure per-file ownership and no missing license metadata.
6. Open a PR against `feat/turn-based-4x-pwa`. Report issue URL, branch, base SHA, head SHA, tests, API exports, unresolved dependencies and link to PR.
7. Coordinator performs wiring into root app/game and re-runs integrated simulation/browser checks. Only coordinator can merge, tag and deploy after release gates.

## Copy/paste task prompt for a separate lane chat

> You are **Orbital Empires Lane [LETTER]** for issue #[NUMBER] in `teodor-georgiev/Orbital-Empires`. Begin by checking GitHub repo and latest `feat/turn-based-4x-pwa` integration commit, then read `docs/ROADMAP.md`, `docs/DEVELOPMENT_BACKLOG.md`, `docs/PARALLEL_LANES.md`, `docs/ARCHITECTURE.md` and the issue. Branch from the exact latest integration commit into a new `feat/oe-[lane]-[feature]-YYYYMMDD` branch. Own only the paths in the playbook. Implement one testable feature module with no root file modifications; run the relevant tests/CI, review the full diff and open a PR targeting the integration branch. Do not merge, deploy, change production, bypass checks or claim unverified ChatGPT Web autonomous execution. Finish by returning issue/PR URL, branch and commit SHA, test evidence and integration exports.

## Coordinator queue and state ledger

Track each lane's state in its issue or PR with:
- `READY` / `RUNNING` / `PR_OPEN` / `REVIEW` / `INTEGRATED` / `BLOCKED`
- Exact starting integration SHA and head SHA; last successful check run; owned files and export interface
- Next concrete action, blockers, and whether an external session actually accepted/completed its task

Use one writer per branch, worktree and file. Before sending a second action after an uncertain response, first fetch branch HEAD and issue/PR activity to avoid double-submission. Never silently substitute a different provider, account or coding model.

## How to increase throughput safely

- Start with **two proven independent lanes** and test actual end-to-end completion of both PRs before turning on four or eight concurrent workers.
- Keep tasks 1–3 source modules each, with a test and a named exported interface; avoid sprawling tasks such as 'build all diplomacy'.
- Run code review/CI in parallel with other lanes' work, but serialize shared-core integration.
- When the coordinator merges an integration PR, publish the new base SHA before sending the next wave.
- Prefer feature flags or explicitly unused pure modules for independent work. Don't make partially integrated UI controls appear functional.
- Measure wall-clock lead time, % of PRs needing rework, failed checks and conflicting file changes; optimize completed playable features per day, not just number of agents.

## Release discipline

`feat/*` → lane PR → CI/review → integration → browser and staging checks → stable release PR → checked publish → optional version tag. Existing GitHub Pages site is a preview of its configured branch, **not** proof that an unrelated feature PR has deployed. Do not use unreviewed runner workflows, arbitrary shell or production credentials. Commercial assets require provenance validation.

## Current constraints

VPS MCP Edit v4 has returned an internal failure in prior sessions, so GitHub fallback is currently valid. Vercel project creation returned HTTP 403 earlier; existing GitHub Pages works. ChatGPT Web browser-lane smoke tests do **not** prove two simultaneous, autonomous software changes; verify before expanding parallel execution.
