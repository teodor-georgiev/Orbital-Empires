# Orbital Empires — Map-First Command Shell Design

**Status:** Approved visual direction by project owner, 2026-11-04. Implement on an isolated branch; screenshot QA still pending.
**Issue:** #51. **Visual references:** original user-approved cinematic galaxy mockup in the project chat; repository companion `docs/design/map-first-command-shell.svg` includes a responsive layout.
**Source baseline:** `feat/turn-based-4x-pwa` @ `2e6c4cbbff3f15fb627af0c85fedd80844e80bf6`. `main` has newer outliner/icon commits, so maintain compatibility with both DOM variants. Do not claim these changes are live.

## Intent
The user should be able to read the galaxy, see current resources, select a system and immediately act without navigating through decorative chrome. The game is a compact original 4X strategy interface, not a SaaS dashboard.

## Goals
- **Map first:** center canvas/solar scene is the dominant region, filling remaining height without fake gutters.
- **Predictable command rail:** all seven existing destinations stay labeled and keyboard/touch accessible.
- **Selection second:** the existing right inspector is visually consistent, with identity, main stats and actionable choices easy to scan.
- **Status third:** one concise galactic feed/status strip, not a second page header with repeated instructions.
- **Responsive:** at 390px, navigation precedes the scene; inspector follows; actionable buttons do not cover planet-focus controls.
- **Compatibility:** keep existing DOM hooks, action IDs, save format, JS game logic, WebGL/Canvas fallback, reduced-motion and 4K quality settings.

## Non-goals
No real-time controller, fleet movement logic, changes to localStorage, content economy, new API, third-party assets, game engine rewrite, or changes to PRs #37/#47.

## Approaches considered
1. **Full JS component framework rewrite:** strongest long-term componentization but unsafe to existing dependency-free game and game action bindings. Rejected.
2. **Add parallel canvas/UI implementation:** looks great in a mockup but duplicates interaction, breaks save/navigation semantics. Rejected.
3. **Chosen: focused structural skin over current DOM:** retain action IDs and existing renderers, update one final command-shell stylesheet and the HTML link/PWA manifest, add runtime browser geometry checks. Lower risk and keeps ongoing feature PRs feasible. Follow-up may consolidate older cascade rules once visual QA is complete.

## Interface contract
- Desktop >= 1021px: height-limited 64px header, ~152px labeled command rail, centered playable map, ~306px inspector and 42px event feed. The sidebar may scroll to reveal the accessible existing outliner; do not remove it from the DOM.
- Tablet 751–1020px: icon rail 72px and 280px inspector. Navigation icons have descriptive title/aria label. No map occlusion.
- Phone <= 750px: responsive header, horizontal labeled nav at top, galaxy >= 50vh, inspector beneath scene, scrollable content without horizontal page overflow.
- Solar/planet mode: retain existing floating inspector/orbital chooser rules where applicable; never overlay essential planet actions.
- Progress mode: keep full-width workspace; invisible map and inspector must not steal height. Hidden progress DOM stays display:none when inactive.
- Semantics: use only established buttons `data-nav`, `data-action`, `#map-viewport`, `#inspector`; no decoratively fake active actions.

## Visual language
Midnight blue surfaces, cool cyan for focus/selection and amber for primary economic/command actions. Low-contrast dividers, slight shadows only for active layers. Large, readable map names; compact 12–14px navigation, 11–12px metadata. No proprietary art/branding. Respect prefers-reduced-motion.

## Failure modes and QA
CDP browser smoke at 1440x900 and 390x844 verifies map height/width, hidden Progress, mode navigation, selected inspector and no viewport overflow. Verify planet and solar workflows and 2D fallback in existing tests. Screenshot artifacts compared to approved mockup, then independent code review and normal CI. The new shell must be in the service worker offline asset list with a bumped cache key.

## Approvals
Project owner approved the map-first original visual and explicitly said to execute the UI overhaul without more questions. This document captures that direction and implementation choices; it does not claim final QA or release approval.
