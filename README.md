# Orbital Empires

**A turn-based, installable, browser-first space 4X strategy game**: explore a procedural galaxy, expand your empire, research technology, manage colonies, and command fleets.

**Status:** foundation in development. This repository is not yet a deployed, complete game.

## Direction

The game takes high-level inspiration from classics such as Galactic Civilizations, Master of Orion, Stellaris, and FreeOrion, but implements its own mechanics, names, UI, source and artwork. Default experience is **single-player, deterministic, one empire turn at a time**.

Read [Game Design](docs/GAME_DESIGN.md), [Architecture](docs/ARCHITECTURE.md), [Parallel ChatGPT Lanes](docs/PARALLEL_LANES.md), and [Asset Licenses](docs/ASSETS_AND_LICENSES.md).

## Development

Shared integration branch: `feat/turn-based-4x-pwa`. The `main` branch is never an editing target.

After UI scaffold lands: `npm install`, `npm run dev`, `npm run test`, `npm run build`.

No production deployments, commits to main, or merges without passing required checks. Parallel chats use dedicated feature branches and narrow ownership.
