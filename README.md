# Orbital Empires

An original **turn-based 4X strategy game** for the browser, designed for self-hosting and offline-capable installation (PWA).

## Play locally

Prerequisites: Node.js 22+ to run tests, and any static HTTP server to play. No npm dependencies.

```bash
npm test
python3 -m http.server 4173
```

Open http://localhost:4173/. The game is not meant to be opened as a `file://` page: service workers require an HTTP/HTTPS origin. Browsers generally permit installation from HTTPS or localhost only.

## Gameplay included in v0.1

- Seeded galaxy generation, navigable hyperlanes, fog of war, interactive pan/zoom map
- 2–6 AI rivals; colony expansion and resource generation
- Buildings, research, fleet recruitment, turn-based movement and combat
- Diplomacy, wars and peace, empire overview, campaign victory conditions
- Local save/load, new game setup, tutorials, keyboard shortcuts and mobile layout
- Installable PWA with application-shell caching for offline play after first visit

Single-player games save locally in the browser (localStorage), not on the server. Clearing site data may erase progress. Multiplayer, accounts, cloud saves, and deterministic network synchronization are **not implemented**.

## Self-host on your own VPS

This package provides a hardened static Nginx container that listens **only on 127.0.0.1:8087 on the server**, leaving an existing HTTPS reverse proxy and ports 80/443 untouched.

1. On a development VPS with Docker + Compose, clone your own GitHub repository: `git clone <your-repository-url> orbital-empires && cd orbital-empires`.
2. Run `npm test` in a trusted development environment before release.
3. Start the HTTP origin for the reverse proxy: `docker compose up -d --build`.
4. Point a dedicated subdomain at the server; configure your **existing HTTPS reverse proxy** to serve `http://127.0.0.1:8087` (an example Caddy site is at `deploy/Caddyfile.example`). HTTPS is required for PWA installation on devices.
5. Check `http://127.0.0.1:8087/healthz` on the host, and then verify the real HTTPS address, service-worker registration, offline reload, and installation on a device.

**Safety:** The provided Compose file cannot expose the game directly to the public network because its published port is loopback-bound. It does not configure DNS, the host proxy, SSH, credentials, or system services. Only use the host's approved deployment workflow and verify its existing setup before making changes. Never run the deployment workflow directly against an unreviewed production host.

## Project structure

- `core.js`: deterministic, dependency-free 4X simulation
- `app.js`: browser UI, canvas rendering and local save support
- `style.css`: responsive visual design
- `manifest.webmanifest`, `sw.js`, `assets/`: installable/offline PWA
- `tests/game.test.js`: simulation and game-rules tests
- `Dockerfile`, `compose.yaml`, `deploy/`: self-hosting package
- `.github/workflows/ci.yml`: tests every branch/PR

## Development and release

Develop only on feature/fix branches; require a successful test workflow and review before merging into `main`. Self-hosted deployment remains a separately controlled action. No external services are required at runtime.

## Game design and parallel development

- [Game systems and milestone design](docs/GAME_DESIGN.md)
- [Current architecture and modularization gate](docs/ARCHITECTURE.md)
- [Four ChatGPT lanes and GitHub branch ownership](docs/PARALLEL_LANES.md)
- [Online references, asset sources and license safety](docs/ASSETS_AND_LICENSES.md)

Shared integration branch: `feat/turn-based-4x-pwa`. Build feature modules in separate branches and bring them into this branch through reviewed PRs. Current code is dependency-free JavaScript; do not replace the stack silently.

## Download optional Kenney art and PixiJS

From a network-connected development machine with Node.js 22+:

```bash
npm run assets:fetch
```

This fetches **Kenney Space Kit (3D ZIP)**, **Kenney Simple Space (2D ZIP)** and a **self-hostable pinned PixiJS v8.22.0 ES module** into `assets/vendor/` with a SHA-256 `manifest.json`. Downloads are deliberately gitignored and not included in the existing deployment, so game startup and offline PWA behavior remain unchanged. The archives are not automatically extracted or rendered; a separate reviewed UI/graphics change must integrate the selected assets. See [asset provenance and licensing](docs/ASSETS_AND_LICENSES.md).

PixiJS renders **2D**, not Kenney's native 3D GLB files. Models need pre-rendered sprites or a separately selected 3D renderer. If the archive source changes, reverify its CC0 license before changing the download URL.

## Additional commercial-use artwork

The repository includes **18 original vector game sprites** in `assets/original/` (ships, planets, orbital stations and faction insignia) and a self-contained [gallery](assets/original/gallery.html). They are ready for the graphics lane to integrate but do not yet replace the existing Canvas visuals.

`npm run assets:fetch` also fetches Kenney's CC0 **Planets** and **Sci-Fi RTS** packs from creator-uploaded OpenGameArt files, alongside the original Kenney packs and PixiJS; all downloaded archives stay gitignored under `assets/vendor/`. See [asset license and provenance inventory](docs/ASSETS_AND_LICENSES.md).
