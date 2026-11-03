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

## Mandatory record of every implemented change

Every feature and fix PR must document the actual code change, not only proposed ideas. Before requesting integration, add or update a dated record under `docs/changes/YYYY-MM-DD-feature.md` that states player-visible behavior, affected systems/files, exact tests and their verified results, save/version implications, conflicts with parallel lanes, and outstanding limitations. Update the `[Unreleased]` section of `CHANGELOG.md` for player-visible behavior; include issue/PR and final SHA in the PR description. Canonical specs and ADRs are edited only by the designated coordinator after review. No undocumented feature is considered complete, and no chat may claim an unmerged feature is live. Small repairs may use a concise change record.

## Mandatory picture-first UI design gate

For every **new gameplay screen, major menu redesign, HUD/layout overhaul, planet/galaxy scene redesign or significant visual asset change**, all coding agents must follow this order:

1. **Design before code:** Create at least one original visual mockup/picture (PNG/JPG/WebP or Figma screenshot) of the proposed screen. Include the intended desktop layout and a mobile/narrow-width treatment. Prose-only plans and lists of UI elements do **not** satisfy this gate.
2. **Show and select:** Attach/link the visual to the feature issue or PR, show it to the project owner, record which visual direction was selected and any requested edits. Do not implement the major UI layout before that selection. If no selection is available, keep work limited to planning, visual options and non-UI engine tests.
3. **Implement against the selected target:** Reuse the project's original/licensed assets, existing architecture and interactive patterns. Do not copy Stellaris or any other game's proprietary layout/art. Keep keyboard, touch, 2D fallback and save compatibility in scope.
4. **Compare after coding:** Attach actual browser screenshots at desktop and mobile widths and compare them with the approved mockup. Record intended differences, test clicking/keyboard navigation and obtain the normal CI/review gates before merge or deployment.
5. **Exceptions:** Trivial copy edits, invisible simulation/logic, small accessibility repairs and urgent bug fixes can skip a new image. Document the exception on the PR. A UI bug fix that changes layout substantially still requires a visual.

**Existing in-flight UI PRs created without a mockup** must disclose the design-first exception, obtain a visual review before release, and remain drafts until the visual gate is met. No agent should claim a generated concept image is a tested game screenshot.

## Architecture constraints
- Browser-first offline single-player. Existing JavaScript ES modules with no mandatory runtime dependencies, Canvas/WebGL fallback, Node 22+ tests.
- Real-time-with-pause is the **approved strategic direction**. v0.3 adds Human Sol and historical-star setup; pause/speed controls are in a separate development PR #19 and cannot be assumed shipped. Department autonomy and continuous fleet transit are not yet shipped.
- No copied proprietary code, art, screenshots or faction IP from Ascendance, Stellaris or other titles.
- Retain saves: semantic release version (`version.js`) differs from save schema version. A breaking save schema change needs migration tests.
- Real-star names, published distances and Solar System planet names are factual; **map projection, hyperlanes, governments, economy and non-Sol worlds are fictional gameplay**.

## Resume after interruption
Fetch the PR/branch status and latest CI first. Check whether a previous tool call already committed before sending another write. If a lane has an uncertain result, don't resend side effects blindly. Never claim unsupervised multi-chat execution without confirmed individual runs and resulting PRs.
