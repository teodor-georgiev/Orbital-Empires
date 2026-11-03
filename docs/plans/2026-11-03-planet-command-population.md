# Planet command interface and logistic population plan

> **For agentic workers:** implement on an isolated feature branch and verify the exact commit before release.

**Goal:** A discoverable galaxy → star system → planet workflow with a clean command menu and readable population growth that approaches finite capacity.

**Architecture:** Keep the current vanilla JS, WebGL and Canvas rendering. Selecting any 3D planet or keyboard-accessible list item routes to one inspector. Only the primary planet represents the colony in save schema v1; other planets explicitly display survey-only status. A pure population reducer replaces random +1 growth at each cycle.

**UX reference:** Learn from Stellaris' organization of planet summary, production, population and immediately visible build actions. Use only Orbital Empires' own artwork and controls; do not duplicate publisher screenshots/assets.

## Implementation gates
- [x] Test-first planetary click-to-inspect and menu structure.
- [x] Define and test logistic growth with capacity: `K = 6 + 4*habitability + richness`; `delta = (0.16 + 0.02*habitability) * population * (1 - population/K)`.
- [x] Handle old save schema v1 without migration; fractional population in billions.
- [x] Align planet list, WebGL click and inspector; render colony construction only on owned primary worlds.
- [x] Replace dense sidebar with Explore, Develop and Command groups; rebuild command main menu.
- [x] GitHub CI and headless Chrome click-through smoke (PR branch). Diff review and final deployed version to be verified. Browser smoke on an isolated test origin, including low-res layouts and WebGL/2D fallback.
- [ ] Merge and publish only after all gates pass; verify actual published source and PWA update.

**Not in scope:** separate colonization of every orbiting planet, factions, loyalty, migration, housing buildings, or individual job populations. These require their own save-data migration and gameplay design.
