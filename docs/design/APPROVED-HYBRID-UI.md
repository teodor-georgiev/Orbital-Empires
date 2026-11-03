# Orbital Empires — Approved hybrid visual direction

**Approved by project owner:** 2026-11-03 (design review in the Orbital Empires project conversation)  
**Status:** APPROVED for implementation; not yet accepted as finished code  
**Reference:** [Approved original hybrid layout diagram](approved-hybrid-layout.svg). The original three-option image was shown in the project's ChatGPT design-review conversation; this committed, editable SVG preserves the approved A+B+C arrangement independently of chat attachment access.

## Chosen blend

**A — Command Bridge:** In the galaxy view, retain a legible strategy map, visible resources and time controls, compact navigation grouped into Explore / Develop / Command, and an immediately useful selected-system inspector. Minimize redundant menu labels.

**B — Planet Command:** Click a planet (or select through its keyboard-accessible orbital list) to focus the selected planet with large, original biome artwork; show population, logistic growth/capacity, output, and accessible colony upgrades without sending the player through multiple menu layers. Primary colony worlds permit building; non-primary planets are clearly marked survey-only.

**C — Minimal Strategy:** In the orbit/solar-system view, maximize the WebGL scene's visible area by reducing the left nav to a compact command rail, keeping a small planet list, and floating the selected planet inspector. Use an optional planet-focus mode for the B layout, with an obvious way back to the C 3D scene and to the A galaxy map.

## Interface contract and quality gates

- State model: `galaxy → star system (3D or 2D) → focused planet`; Back buttons must never hide navigation or destroy game state.
- One source of truth: selecting a planet in 3D, from the keyboard list, or from a colony row updates the same selection and inspector.
- At 390px mobile viewport, major controls must remain tappable, the selected planet readable, and upgrades accessible without horizontal overflow.
- All menus and planets must be keyboard reachable, with clear focus states, reduced-motion compatibility, and Canvas 2D fallback.
- Use original/licensed Orbital Empires artwork, **not** Stellaris/Ascendancy assets.
- Preserve save schema v1 and logistic population rules. Do not implement separate orbital economies in this UI PR.
- Before merge: CI simulation and browser tests; screenshots of real desktop and mobile implementation; visual comparison and review; compatible with concurrent Solar Frontier and tick clock lanes.

## Visual reference signoff

The user explicitly selected the proposed mix of design A for galaxy, B for planet management, and C for 3D solar system, then asked to implement and save the decision. The original source illustration is a **concept**, not a game screenshot. [This SVG layout map](approved-hybrid-layout.svg) is an original, code-editable derivative of that approved layout and is saved in GitHub for future coding chats.
