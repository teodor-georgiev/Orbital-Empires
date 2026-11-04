# Colony Investment Advisor — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans and test-driven-development task by task.

**Goal:** Give the existing Colonies & Economy inspector real, read-only building upgrade previews using the authoritative yield formula, without adding a new screen, changing saves, or spending for the player.

**Architecture:** The already-tested economy ledger from PR #53 stays read-only. A new pure `modules/economy/upgrade-preview.js` accepts the game, building catalog and `systemYield` function, simulates an upgrade on a cloned colony object, and returns expected production gains, exact resource costs and whether player-defined reserves survive. The director adds one small existing-inspector section in `app.js`. No global economic rebalance yet.

**Tech stack:** Vanilla ES modules, Node 22 built-in tests, existing headless Chrome CDP browser smoke.

**Spec:** `docs/ROADMAP.md` economy section, `AGENTS.md` section on design-first UI. This is a *minor extension of the existing Colonies inspector*, not a new screen or major navigation change, so the new-screen mockup gate does not apply. The future full-screen Economy layout still requires owner-selected desktop/mobile mockups.

## Global constraints
- Preserve v1 save schema, existing yields, costs, player actions and AI results.
- Preserve existing 7 navigation items and active map/solar views.
- Manual building purchases remain governed by existing `canBuild` and `build`; budget advice never changes eligibility.
- No runtime dependencies, no backend, no new resources, no automatic investments or fake upkeep values.
- Production delta is authoritative: only a cloned system gets an upgraded building level.
- The economy PR #53 is a dependency; do not merge this stacked PR before it.
- Director is sole writer for `app.js` and shared browser smoke test.

## Review focus
- A maxed or biome-ineligible building must not be suggested.
- An unaffordable upgrade remains visible with a clear shortage, not represented as purchasable.
- Reserves are advisory only: avoid overriding existing purchase legality.
- Forecasting does not modify game, save state or invalidate planet building costs.
- Colony names are escaped when rendered; mobile inspector has no horizontal overflow.

## Task 1 — Pure forecast
**Files:** Create `tests/economy.preview.test.js`, `modules/economy/upgrade-preview.js`.

**Interfaces:**
- `previewColonyUpgrade(game, systemId, building, systemYieldFn, reserves = {})`: returns `null` for foreign, unavailable biome, max level or unknown building; otherwise `{systemId, buildingId, buildingName, nextLevel, cost, gain, affordable, preservesReserves, shortfalls}`.
- `recommendColonyInvestments(game, buildings, systemYieldFn, {reserves = {}, limit = 3} = {})`: at most one recommendation per owned colony, sorted by reserves, affordability, summed positive gain and stable ID order.

- [ ] Write tests proving projected delta equals yield after actual `build` and that preview does not mutate.
- [ ] Write tests for biome restrictions, max levels, insufficient stockpiles, reserve preservation, competing colonies and deterministic order.
- [ ] Run GitHub Actions (RED): tests fail because preview module does not exist.
- [ ] Implement both pure exports with no dependency on `app.js`.
- [ ] Run full Node + browser CI (GREEN).

## Task 2 — Existing inspector advice (not a new route)
**Files:** Modify `app.js` only, plus `tests/e2e/browser-smoke.mjs` for browser acceptance.

- [ ] Extend browser smoke to enter Colonies after loading, show upgrade forecasts, verify clicking Manage opens the correct colony, return to map, and take a desktop screenshot; repeat on mobile.
- [ ] Run RED workflow and confirm new assertions fail with missing advice.
- [ ] Import `recommendColonyInvestments` and add a compact, clearly labeled read-only section to `renderColonies`.
- [ ] Show cost, immediate production delta, and reserve safety; link to existing `inspect-colony`, never create a fake purchase button.
- [ ] Run full Node + CDP CI on exact head and inspect screenshots, mobile overflow and PWA smoke.
- [ ] Review full diff, request independent review, keep PR draft until integration and design gates.

## Deferred
A standalone full-screen Economy workspace, production/upkeep rebalance, AI governors spending resources, automation permissions and a real market all require separate specs and tests.
