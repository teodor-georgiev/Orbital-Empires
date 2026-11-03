# Orbital Empires — shared coding agent instructions

All ChatGPT, Claude, Codex and other coding sessions use **this GitHub repository** as the shared source of truth. Chat histories are not a synchronized database.

## Read first, every session
1. Inspect current GitHub branch, open PRs, CI and base SHA.
2. Read [spec index](docs/specs/INDEX.md), [current game spec](docs/specs/ORBITAL-EMPIRES-v0.3.0.md), [decisions](docs/decisions/), [roadmap](docs/ROADMAP.md), [eight-lane playbook](docs/PARALLEL_LANES.md), and your task's GitHub issue.
3. Respect the owning lane's directories. Director alone changes `core.js`, `app.js`, `system-model.js`, `solar-view.js`, `index.html`, root CSS, `version.js`, `sw.js`, release configuration and canonical specs.
4. Make focused `feat/*` or `fix/*` branches from the latest integration SHA. Never edit `main` or the shared integration branch directly.
5. Write tests, inspect the full diff and open a PR targeting `feat/turn-based-4x-pwa`. Include the issue, version, starting SHA, export contracts, tests, screenshots if applicable, blockers and any spec amendment.
6. To change game direction: put a proposal in `docs/proposals/<lane>-<topic>.md` on your branch and link it in the PR. Only a reviewed, coordinator-integrated change updates canonical spec version / ADR.
7. State actual code/QA/deployment status; never describe planned features as playable.
8. Never bypass tests, permissions, secret handling, licensing or UI preview gates. Merge/deploy only via approved workflow.

## Architecture constraints
- Browser-first offline single-player. Existing JavaScript ES modules with no mandatory runtime dependencies, Canvas/WebGL fallback, Node 22+ tests.
- Real-time-with-pause is the **approved strategic direction**. v0.3 adds Human Sol and historical-star setup; pause/speed controls are in a separate development PR #19 and cannot be assumed shipped. Department autonomy and continuous fleet transit are not yet shipped.
- No copied proprietary code, art, screenshots or faction IP from Ascendance, Stellaris or other titles.
- Retain saves: semantic release version (`version.js`) differs from save schema version. A breaking save schema change needs migration tests.
- Real-star names, published distances and Solar System planet names are factual; **map projection, hyperlanes, governments, economy and non-Sol worlds are fictional gameplay**.

## Resume after interruption
Fetch the PR/branch status and latest CI first. Check whether a previous tool call already committed before sending another write. If a lane has an uncertain result, don't resend side effects blindly. Never claim unsupervised multi-chat execution without confirmed individual runs and resulting PRs.
