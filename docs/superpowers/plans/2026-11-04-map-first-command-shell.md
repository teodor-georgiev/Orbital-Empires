# Map-First Command Shell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the cramped Orbital Empires gameplay HUD with the approved map-dominant galactic command layout, preserving all existing controls and game logic.

**Architecture:** Keep the dependency-free browser game and current DOM action hooks. Use one explicit last-loaded stylesheet for layout tokens, rail, inspector and breakpoint behavior; modify `index.html` only to load it; update service worker cache and CDP geometry assertions. Do not modify core simulation or app state.

**Tech Stack:** HTML/CSS, ES modules, Node 22 test runner, existing Chrome DevTools Protocol test harness.

**Spec:** docs/superpowers/specs/2026-11-04-map-first-command-shell-design.md

## Global Constraints
- Work in isolated feature branch from `feat/turn-based-4x-pwa`; PR targets integration branch, never `main` directly.
- No mandatory dependencies, external fonts/assets, game rules or save schema modifications.
- Preserve all seven `data-nav` destinations, settings/menu/end-turn, inspector action bindings and solar/planet focus.
- Approved mockup is visual direction; actual browser screenshots are evidence of implementation, not interchangeable with the concept.
- Block merge/deploy if any tests, screenshot comparisons, reviews or staging checks are incomplete.

## Review Focus
Browser height recalculation after leaving Progress; styles under `body.oe-orbital-mode`; no `font-size:0` mobile labels; no horizontal overflow at 390px; offline stylesheet availability and stale PWA caching.

### Task 1 — Baseline and test-first acceptance
- [x] Inspect current `index.html`, `style.css`, `modules/styles/command-workspace.css` and browser smoke.
- [x] Add Node structural contract checks for the new shell link/cache and the seven action IDs.
- [x] Add Chrome assertions for desktop map dominance, nav accessibility, inspector and mobile horizontal scroll.
- [x] Run tests against baseline and confirm failing assertions for the absent new shell.

### Task 2 — Reskin layout with one explicit override layer
- [x] Author `modules/styles/map-first-command.css` using responsive variables, map-first geometry, accessible nav, compact header and inspector.
- [x] Load it after current styles. Keep the Progress hidden guard and solar/planet mode selectors.
- [x] Recheck the Node contract and the existing browser smoke, adjust only for intentional new geometry.

### Task 3 — Offline, QA and review
- [x] Update `sw.js` cache version and `OFFLINE_FILES` for new CSS.
- [x] Run `npm test`, headless CDP desktop/mobile smoke, screenshot capture; no success claim without run logs.
- [x] Compare actual screenshots with the approved concept and record intentional differences.
- [ ] Review GitHub diff and open a PR to `feat/turn-based-4x-pwa` with issue #51, exact SHA, test results and blockers.
- [ ] Do not merge/deploy if no verified browser screenshot or required reviewer.

## Remaining follow-up (not this PR)
When integration has reconciled newer `main` 500-icon/outliner changes, remove redundant older structural declarations so the final shell is canonical, then perform separate visual acceptance of real-time PRs #37/#47 against this UI.

## Execution ledger — 2026-11-04

- **Ruling:** use the project-mandated integration branch (not the newer diverged `main`), so this PR is additive and independent of tactical PRs #37/#47. The cost is that recent `main` outliner/500-icon additions must be reconciled separately before live deployment.
- **Ruling:** focus automatic camera on discovered/visible systems through the pure `fitKnownGalaxy` helper. The original world-wide auto-frame left the actual visible frontier occupying roughly a fifth of the map width in the real desktop screenshot; this changes camera framing only, not star positions, fog, gameplay, manual zoom or save schema.
- **Red evidence:** GitHub Actions [41791701370](https://github.com/teodor-georgiev/Orbital-Empires/actions/runs/41791701370) failed on missing shell contract. [41792772847](https://github.com/teodor-georgiev/Orbital-Empires/actions/runs/41792772847) caught clipped orbital rail. [41792948604](https://github.com/teodor-georgiev/Orbital-Empires/actions/runs/41792948604) caught missing camera module.
- **Green evidence:** exact-head [Game validation 41793577326](https://github.com/teodor-georgiev/Orbital-Empires/actions/runs/41793577326) succeeded: JS syntax, Node tests, offline/PWA assets, Chromium smoke, 1440×900 and 390×844 screenshots. One earlier run [41793511821](https://github.com/teodor-georgiev/Orbital-Empires/actions/runs/41793511821) failed at Chromium launch before browser assertions; later exact-head run passed without modifying runtime infrastructure.
- **Visual comparison:** desktop screenshot `01-galaxy-desktop.png` now has 64px resource/turn bar, 156px labeled rail, ~978px map, 306px inspector, an explored-frontier camera frame and restrained nebula. Mobile screenshot `04-focused-planet-mobile.png` has two-row header, horizontal labeled nav, unobstructed planet actions. Solar screenshot has icon-only rail without clipping. Original concept remains more illustrated/cinematic than current live renderer; no claim of pixel-perfect matching.
- **Pending:** independent PR review, integration with newer `main` UI changes, owner acceptance of actual screenshot aesthetics, staging/deployment verification; do **not** merge or deploy on the strength of mockup approval alone.
