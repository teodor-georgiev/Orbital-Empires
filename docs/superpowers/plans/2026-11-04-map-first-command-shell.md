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
- [ ] Inspect current `index.html`, `style.css`, `modules/styles/command-workspace.css` and browser smoke.
- [ ] Add Node structural contract checks for the new shell link/cache and the seven action IDs.
- [ ] Add Chrome assertions for desktop map dominance, nav accessibility, inspector and mobile horizontal scroll.
- [ ] Run tests against baseline and confirm failing assertions for the absent new shell.

### Task 2 — Reskin layout with one explicit override layer
- [ ] Author `modules/styles/map-first-command.css` using responsive variables, map-first geometry, accessible nav, compact header and inspector.
- [ ] Load it after current styles. Keep the Progress hidden guard and solar/planet mode selectors.
- [ ] Recheck the Node contract and the existing browser smoke, adjust only for intentional new geometry.

### Task 3 — Offline, QA and review
- [ ] Update `sw.js` cache version and `OFFLINE_FILES` for new CSS.
- [ ] Run `npm test`, headless CDP desktop/mobile smoke, screenshot capture; no success claim without run logs.
- [ ] Compare actual screenshots with the approved concept and record intentional differences.
- [ ] Review GitHub diff and open a PR to `feat/turn-based-4x-pwa` with issue #51, exact SHA, test results and blockers.
- [ ] Do not merge/deploy if no verified browser screenshot or required reviewer.

## Remaining follow-up (not this PR)
When integration has reconciled newer `main` 500-icon/outliner changes, remove redundant older structural declarations so the final shell is canonical, then perform separate visual acceptance of real-time PRs #37/#47 against this UI.
