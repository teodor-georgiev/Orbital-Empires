# Online references and reuse policy

Reviewed 2026-11-03. **Inspiration is not permission to clone copyrighted game expression.**

| Source | Use | License / constraint |
| --- | --- | --- |
| https://github.com/freeorion/freeorion | Design research for pure turn-based 4X systems, procedural game content and interface ideas | FreeOrion source GPL-2.0; assets CC-BY-SA-3.0; do **not** copy into this project without an explicit GPL/share-alike compliance decision |
| https://kenney.nl/assets/simple-space | Small top-down ship/map sprites as optional replacement for procedural SVG symbols | CC0 1.0, commercial use permitted; preserve source note |
| https://kenney.nl/assets/space-kit | Spaceport/ship 3D models for future 3D views or portraits | CC0 1.0, commercial use permitted |
| https://kenney.nl/assets/space-station-kit | Space stations and ship models | CC0 1.0, commercial use permitted |
| https://github.com/pixijs/pixijs | Optional high-throughput 2D/WebGL galaxy renderer when justified | MIT; retain license notice if included |
| https://www.nasa.gov/nasa-brand-center/images-and-media/ | Space photography reference for informational visuals | NASA content has nuanced media/commercial guidelines, logos and third-party content restrictions; do not automatically import images for commercial game art |

M1 uses **original procedural canvas/SVG/CSS visuals**, so it does not redistribute copyrighted third-party game assets. If imported art is later used: record exact file origin, version, license and any attribution in a manifest; never hotlink unstable content without approval. Prefer original or CC0 assets and maintain a source inventory.

## Pinned asset acquisition

Use `npm run assets:fetch` (Node.js 22+) on a machine with outbound HTTPS access. The script only fetches the five pinned upstream files, checks size/file signature, and writes a SHA-256 inventory. Downloads are saved to an ignored `assets/vendor/` staging area. **Not integrated with gameplay, rendering, Docker, or PWA caching yet.**

| Local file after download | Original official source | License | Notes |
| --- | --- | --- | --- |
| `assets/vendor/kenney/kenney_space-kit.zip` | https://kenney.nl/assets/space-kit | CC0 1.0 | 150 3D models; official ZIP |
| `assets/vendor/kenney/kenney_simple-space.zip` | https://kenney.nl/assets/simple-space | CC0 1.0 | 48 top-down sprite files; official ZIP |
| `assets/vendor/pixijs/pixi.min.mjs` | https://github.com/pixijs/pixijs/releases/tag/v8.22.0 | MIT | v8.22.0 minified, self-hostable ES module from jsDelivr; preserve MIT license text in `docs/third_party/PIXI-LICENSE.txt` |

**Distinction:** PixiJS is a 2D WebGL/WebGPU renderer; it cannot directly display Kenney GLB/3D scenes. The currently shipped Canvas map stays unchanged until the rendering lane wires in a verified replacement. No CDN is required at game runtime. Downloading third-party code does not imply it is safe to run without review; ensure downstream bundle provenance before release.

## Original Orbital Empires art (committed)

`assets/original/` contains **18 newly authored SVG game sprites**: five spacecraft, six planetary biomes, three orbital stations and four unique faction emblems. They are source-editable, transparent-background project artwork rather than copied material. They can be used in a commercial build; the repository does **not** claim that they are third-party CC0 assets. Browse `assets/original/gallery.html` from the local development HTTP server. Metadata and provenance: `assets/original/catalog.json`.

## Additional verified CC0 download options

| Resource | Landing page and license | Download / action |
| --- | --- | --- |
| Kenney Planets (50+ sprites) | https://kenney.nl/assets/planets and Kenney-authored OpenGameArt https://opengameart.org/content/planets-8 | Automated into `assets/vendor/kenney/kenney_planets.zip` via `npm run assets:fetch` |
| Kenney Sci-Fi RTS (120+ graphics) | https://kenney.nl/assets/sci-fi-rts and Kenney-authored OpenGameArt https://opengameart.org/content/sci-fi-rts-120-sprites | Automated into `assets/vendor/kenney/kenney_rtssci-fi.zip` via `npm run assets:fetch` |
| Quaternius Ultimate Space Kit (92 models) | https://quaternius.com/packs/ultimatespacekit.html (CC0 on pack page) | Manual download; not bundled or mirrored; verify any current pack-specific terms |
| Poly Haven | https://polyhaven.com/license (CC0) | Selective curated HDRI/texture/3D downloads; avoid bulk-importing large unneeded files |

The OpenGameArt files above are creator-uploaded copies (Kenney is the listed author). Do not copy or vendor anything that has uncertain license provenance. **Remote ZIP download success and extraction still require a network-enabled host.** None of these downloads are committed to Git or served at runtime by default.
