# ADR-0001 — Transition from turn-based to real-time with pause and automation

**Date:** 2026-11-03  
**Status:** Accepted direction; incremental implementation  
**Why:** User wants a living galaxy where nations, fleets, researchers and industry advance with minimal micromanagement but manual intervention stays possible.

## Considered
1. **Autoplay old End Turn only:** quickest but no genuine continuous transit, poor economic cadence. Acceptable only as a transitional visible prototype.
2. **Fixed-step real-time-with-pause (chosen):** strategic month ticks, continuous visual interpolation, pause/speed, goal-driven department AI, strong deterministic tests, browser-only save.
3. **Minute-level physical logistics/ship simulation:** too complex for the current game stage and 40–180 system scale.

## Chosen approach
Adopt approach (2), exposing 0/1/2/5/10x clock speeds and one-month stepping. v0.3 first introduces the controller over existing turn rules; no claims that old resource production is rebalanced. Preserve `endTurn(g)` as compatibility API while progressively extracting `advanceMonth(g)`, which will own deterministic economy, research, diplomacy, fleet routes and AI decision scheduling.

## Next stages
- v0.3: Sol scenario, real nearby stars, date selection, pause/speed/month stepping.
- v0.4: Player organization AI for exploration/economy/research/defense with budget reserves, manual overrides, decision explanations.
- v0.5: Monthly yields, population growth scaling, fleet travel times and backtesting of AI policies; migrate saved state only if required.
- v0.6: deeper trade, diplomacy, events and political factions.

**Constraint:** Do not simulate while a browser tab is hidden. Never require online hosted worker or LLM per tick; it must run smoothly offline. Irreversible actions (wars, treaties, colony destruction) are manual by default. A future simulation engine is deterministic and independent of frame rate.

**Reference:** [Ascendance research](../research/ASCENDANCE-4X-MECHANICS.md). Design inspiration is allowed; copying copyright-protected game expression is not.
