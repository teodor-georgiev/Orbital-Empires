# Orbital Empires

An original **turn-based 4X strategy game** for the browser, designed for self-hosting and offline-capable installation (PWA).

## Play locally

Prerequisites: Node.js 22+ to run tests, and any static HTTP server to play. No npm dependencies.

```bash
npm test
python3 -m http.server 4173
```

Open http://localhost:4173/. The game is not meant to be opened as a `file://` page: service workers require an HTTP/HTTPS origin. Browsers generally permit installation from HTTPS or localhost only.

## Gameplay included in v0.3

- Seeded galaxy generation, navigable hyperlanes, fog of war, interactive pan/zoom map
- Click through into solar systems with WebGL 3D planets and moons, camera rotation, zoom and Canvas 2D fallback. Visual-only planets retain the existing core-colony mechanics.
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
- `app.js`: browser UI, galaxy canvas and local save support
- `system-model.js`: stable planet and moon metadata derived from existing game systems
- `solar-view.js`: interactive WebGL solar-scene rendering with Canvas 2D fallback
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
- [Master roadmap: all game systems and milestones](docs/ROADMAP.md)
- [Priority-ordered feature backlog and GitHub issues](docs/DEVELOPMENT_BACKLOG.md)
- [Eight ChatGPT development lanes and GitHub branch ownership](docs/PARALLEL_LANES.md)
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

## Exploring a solar system (v0.3)

Choose a discovered star and click **Enter Solar System** (or click the same star twice). Drag to orbit the 3D camera, scroll to zoom and click/select a planet from the orbital list. Use **Back to Galaxy** or Escape to return. Colony actions remain in the right inspector; additional orbital bodies are illustrative until the individual planet economy milestone. See [the implementation plan](docs/plans/2026-11-03-solar-system-3d.md).
## Illustrated planet portraits and command menu

Eight detailed original AI-assisted planet illustrations are stored locally in `assets/planet-portraits/atlas.webp` (4 columns by 2 rows, 384-pixel tiles). They are **illustrations**, not photographs of real exoplanets, NASA photography, or Stellaris models. Jungle and Barren are color-graded from original Terran and Desert artwork. They are displayed in the planet inspector, solar-system HUD, main menu and new-campaign preview; the existing WebGL orbital geometry remains intact.

The custom sprite set `assets/ui/interface-icons.svg` has 28 original vector interface icons for navigation, resources and game commands. `modules/styles/cinematic-ui.css` provides the command-theme refresh without touching game rules. The main menu appears on load and is accessible again from the header. All images, icons and styles are self-hosted and offline cached.

## Install, download and optional donations (v0.2.1)

The recommended option is **Install game** from the in-game main menu. Modern browsers install the HTTPS-hosted PWA and cache core files for offline play. If the browser does not show an install prompt, use its Install / Add to Home Screen action.

The **Download game ZIP** option is GitHub's published source branch archive, not a signed Windows or macOS executable. Unzip it. With Python 3 installed, run `launch-windows.cmd` (Windows) or `sh launch-unix.sh` (macOS/Linux); `python3 launch-local.py` also works. This serves only at `127.0.0.1` with an automatically assigned local port and opens the browser. No public network server is started. Export a save backup via Download / Backup → Back up your save if you want to carry progress between devices. Restoring imported saves is not implemented yet.

**PWA updates:** The service worker fetches newer app files from the hosting origin on reload when online and falls back to the cached versions offline. New Git changes reach players only after deployment; merging the reviewed `main` branch triggers Vercel production if the Git integration is configured and enabled. The browser does not forcibly restart an active game.

**Donations:** The in-game Donate menu is visible, but no money is accepted until the project owner configures a verified HTTPS third-party fundraising URL in `support-config.js`. Only approved provider domains are supported; no payment form, secrets or transaction storage exists in the game. Sharing or starring the repository is available without payment.

## Planet command UI and population (v0.3)

The command menu groups core decisions and the sidebar organizes exploration, development and fleet command. Select a discovered star, enter the solar system, then click a planet in 3D or use the keyboard-accessible orbital list. The right inspector shows the selected planet; owned primary worlds show colony population, a growth/capacity meter, production and immediate infrastructure upgrades. Non-primary planets remain survey-only until future save-schema changes support individual planet colonies.

Population now follows a bounded logistic curve each cycle: its maximum is derived from habitability and richness, and the growth rate gradually slows as that capacity fills. This retains legacy save schema v1 and replaces random +1-B population jumps. See [implementation plan](docs/plans/2026-11-03-planet-command-population.md).
