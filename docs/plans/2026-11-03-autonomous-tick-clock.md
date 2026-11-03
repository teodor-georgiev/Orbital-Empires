# Autonomous tick-clock implementation plan (2026-11-03)

**Goal:** Make the turn-based galaxy capable of autonomous, pauseable progression at player-selected speeds without breaking strategic actions or existing saves.

**Architecture:** The new pure `modules/simulation/tick-clock.js` takes callbacks for the existing `endTurn()` and the UI. Four deterministic ticks make one full strategic cycle. The current economy, technology, AI and combat still resolve at the cycle boundary; this is the first automation step, **not yet continuous per-tick world simulation**.

**Interface:** Pause / slow (1600 ms per tick) / normal (800 ms per tick) / fast (240 ms per tick). Manual End Turn remains and stops autoplay. Opening menus or hiding the tab pauses autoplay to prevent surprise unattended progress. New campaigns reset the clock. No on-disk schema change.

**Acceptance:** 4 ticks produce exactly one equivalent `endTurn` result; no auto-advancement in pause; one timer regardless of speed changes; autoplay stops at game over; 25-cycle seeded regression; old saves validate; controls and PWA offline assets present.

## Next systems (separate reviewed milestones)

1. **True economic sub-ticks:** Move labor, upkeep, population, construction, research and travel into measured per-tick reducers with deterministic order and save migrations. Avoid duplicate grants at cycle boundaries.
2. **Internal factions and loyalty:** Empire ethics and ideology, faction leaders, support percentage, local colony stability, unrest thresholds, event consequences, and lawful rebellion/independence paths. Require predictable triggers, counter-play and save compatibility.
3. **Species and races:** Distinct portrait/icons, origin traits, ethics, habitability and population composition. Species currently exist as empire templates, not population entities.
4. **More meaningful resources:** Start with energy, minerals and food as measured production/consumption, then selective strategic materials. Do not add unused currencies.
5. **AI autonomy:** Assign player-governor policy priorities for exploration, construction and research with transparent AI decisions and a visible event queue. Never silently spend scarce resources unless the user enables delegation.

**Release gate:** Push PR into the integration branch, require GitHub CI, code review and real browser smoke before the GitHub Pages source branch is updated.
