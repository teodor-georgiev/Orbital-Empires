# Central star stations: proposal

**Status:** in development on `feat/oe-star-station-20261104`, stacked on PR #50, #47 and #37. Not merged or released.
**Decision:** the owner asked on 2026-11-04 for a central base at each owned star that defends the system, built directly in the game. Mechanics follow the 4X genre. All names, models and art are original to Orbital Empires.

## Problem

PR #47 gives owned systems a defensive outpost, but:

- The outpost sits at a fixed point beside the star, not around it, and does not move.
- Winning one battle seizes the system at once, however strong the outpost is.
- Upgrades only raise numbers, so there are no choices to make.

## What changes

### The station anchors the system

- Every owned system's station orbits its star on one inner ring, between the star (radius 0.92) and the first planet (orbit 2.4).
- It looks larger and more complex at each of the four existing tiers, in WebGL and in the 2D fallback.
- Docked ships hold formation around it, wherever it is on its orbit.

### A system must be taken from its station

- A fleet that beats the defenders damages the station. The system is seized only when the station reaches 0 HP.
- A surviving fleet stays in the system. Each month it fights the station again until one side is finished.
- A station does not repair while a hostile fleet is in its system.
- Knocking a station out removes its modules and platforms.

### Upgrades become choices

Module slots by tier: 1, 2, 3, 4.

| Module | Effect | Credits | Alloys |
|---|---|---:|---:|
| Gun Battery | +10 station power | 40 | 40 |
| Shield Lattice | +12 station shield | 40 | 30 |
| Repair Dock | +8 repair per month | 35 | 25 |
| Trade Relay | +4 credits per month | 60 | 20 |

Defense platforms, by tier: up to 1, 2, 4, 6. Each costs 15 credits and 20 alloys, adds 4 power and 15 max HP, and is visible circling the station.

### Rivals use it too

A rival upgrades its weakest station when it holds at least twice the cost, without consuming the campaign's random numbers.

## Compatibility

- `system.outpost.modules` and `system.outpost.platforms` are optional, so existing saves stay valid on save schema v1.
- Bonuses are calculated when needed. `armor`, `shield` and `power` stay equal to the tier values that save validation already checks.

## Not in this version

These can follow once the core loop has been played: a shipyard module that changes where ships are built, hangars and fighters, individually targetable platforms in battle, and station markers on the galaxy map.

## Acceptance

- Unit tests cover orbit geometry, slots and limits, costs, the siege rule, repair rules, income, rival upgrades, old saves and tampered saves.
- Played in a browser at desktop and phone widths, in WebGL and in the 2D fallback.
- Screenshots go on the PR for the owner's visual review before release.
