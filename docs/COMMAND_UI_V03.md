# Orbital Empires — Command UI v0.3 design brief

**Design first.** A visual concept of the unified Progress viewer was generated before implementation on 2026-11-03. The concept establishes the dark command-deck theme, single primary content surface, tabbed progression, connected cards and contextual detail pane. The implementation uses the **actual game data and actions**, not the concept's illustrative resource amounts or unimplemented queue/real-time controls.

## Problem

The previous eight-item navigation placed Technology, Traditions and Social Policies in a 335px-wide inspector next to the galaxy. Each feature used a different tile style, lacked an obvious exploration path and forced players to scroll nested areas. The empire emblem, decorative labels and secondary utility actions competed with navigation and the galaxy. These issues make it hard to understand what can be done this turn.

## One coherent command structure

| Area | Purpose | Main action | Rule |
| --- | --- | --- | --- |
| Top command bar | Check treasury, yields and cycle | End Turn, open settings or menu | Keep current real resources; do not invent realtime controls |
| Left primary navigation | Decide which gameplay area to manage | Galaxy, Colonies, Progress, Fleets, Diplomacy, Intel | Six destinations; Progress contains three tabs |
| Galaxy / Solar system | See territory and select star systems and worlds | Select a star, inspect or enter a solar system | The map stays primary outside Progress |
| Context inspector | Show information and legal commands for the chosen gameplay target | Colonize, build, recruit, move, negotiate | Only relevant information to the current selection |
| Progress workspace | Compare and make long-term empire decisions | Technology, Traditions, Policies | One viewer pattern for all three systems |
| Event feed | Explain the last outcome | View full log in Intel | Passive status, not a decorative dashboard |

## Progress viewer information architecture

1. **Header:** Return to Galaxy, purpose statement, real science/unity/influence values.
2. **Tabs:** Technology, Traditions, Policies; clear counts and selected state.
3. **Overview:** one-sentence outcome and the available science, unity or influence for the selected category.
4. **Filters:** All fields plus relevant Technology branches, Tradition tracks, or Policy slots.
5. **Paths:** horizontally scrollable grouped columns. Every selectable item clearly shows name, effect, dependency and state (available, locked, in progress or completed). Connectors show progression within a path; any cross-path prerequisites are explicitly named.
6. **Selected item inspector:** description, concrete empire effect, prerequisite names, exact cost, affordability/eligibility, and one explicit action. Choosing a node never commits resources; the action button does.
7. **Policy replacement:** clearly identify the current policy that will be replaced before enactment.

The viewer is intentionally **not** a research queue, drag-and-drop editor, or an autonomous assignment system; those mechanics do not yet exist.

## Visual language

- Background #080f1a; raised content #142438; thin #294158 borders.
- Primary text #e9f2fa; secondary #96adbf.
- Cyan #65d5df for navigation and selection; green for completed outcomes; amber for attention or costs.
- One intentional frame around the map or progression board. No nested ornamental cards without a job to perform.
- Clear verb-based labels, honest disabled states, keyboard focus outlines, readable text, reduced-motion support.
- Laptop: narrow sidebar, wide main surface, optional inspector. Tablet/mobile: horizontally scrollable nav and development lanes, stacked detail panel.

## Acceptance

- [ ] Default galaxy campaign, star selection, and solar-system opening/closing still work.
- [ ] A single **Progress** left-nav entry opens a full-width viewer.
- [ ] Technology, Traditions, Policies switch using the same tabs and card/detail architecture.
- [ ] Locked options may be inspected but cannot be purchased or researched.
- [ ] Affordability and prerequisites reflect real core.js rules and amounts.
- [ ] Clicking a node merely selects it; a separately labeled button invokes the existing action.
- [ ] Policies indicate what would be replaced.
- [ ] End Turn, save/reload, modal menu, responsive layout and canvas resize still work.
- [ ] Node focus persists when a selection updates, and reduced motion disables animated transitions.
- [ ] Tests and actual browser smoke test pass before merging or deploying.

## Scope boundaries

This UI pass does **not** change core simulation, technology costs, tradition effects, policy slots, planet data, save schema or real-time/tick mechanics. Ship designer, multiple researched projects, governance councils and additional policies remain independent tasks.
