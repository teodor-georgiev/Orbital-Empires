# Stellaris art provenance and reuse audit

Reviewed 2026-11-03. **Commercial standalone reuse status: no examined Stellaris Workshop shipset has yet been cleared.** Do not copy Workshop models, textures, sounds, UI art, ship silhouettes or portraits into Orbital Empires merely because a mod is free to subscribe to, shows credits, or is on public GitHub. **No Workshop binaries are checked into this repository.**

## How Stellaris' ship art is made

- Paradox's art team creates original visual direction and detailed ship-class concepts, then 3D artists model, UV-map, texture, animate and optimize them either in-house or with contractors. Primary source: [Stellaris Dev Diary #230: Aquatics art](https://steamcommunity.com/games/281990/announcements/detail/3064130149887783938), [Dev Diary #342: Machine Age art](https://steamcommunity.com/games/281990/announcements/detail/4199119695789352922).
- [N-iX Games' Stellaris case study](https://gamestudio.n-ix.com/case-study/stellaris-game-art-grand-strategy-game/) documents outsourced production, including 16 Humanoids DLC ships and seven Apocalypse ships; its process includes concept art, blockout, high/low-poly modelling, UV unwrapping and texturing. This is custom commissioned artwork, not a free model pack.
- [Artist James Molnar's Stellar-Naval portfolio](https://jamesmolnar.artstation.com/projects/dOGwx1) explicitly describes original ships modelled in 3DS Max, textured in Substance Painter, and converted with a dedicated Stellaris Maya mesh plugin.
- [Stellaris Texture Pack](https://stellaris.smods.ru/archives/34832) credits original/borrowed planet textures, SpaceEngine, Substance Designer and other editing software. Some Solar System modders use JPL imagery or maps: [Scientifically Accurate Star Systems](https://steamcommunity.com/sharedfiles/filedetails/?id=919932376). **Do not extract textures from those mods:** credited materials may include Paradox artwork, contributed modifications, or restricted imagery.

## Workshop candidates: inspect or seek permission; NOT approved for redistribution

| Creator / shipset | Provenance evidence | Standalone commercial status | Action |
| --- | --- | --- | --- |
| [Stellar-Naval Ship Pack](https://steamcommunity.com/sharedfiles/filedetails/?id=1918294643) by James Molnar | Artist's [hand-created ship portfolio](https://jamesmolnar.artstation.com/projects/dOGwx1) | **Permission required**, no commercial license found on the inspected sources | Contact original creator to license specific model files + textures for a separate commercial game; seek source format and proof of ownership |
| [Machine Shipset](https://steamcommunity.com/sharedfiles/filedetails/?id=2077186491) | Community mod, credited contributors | **Not cleared** | Find individual asset authors and written license for each model/texture |
| [United Fleet Shipset](https://steamcommunity.com/sharedfiles/filedetails/?id=2027015321) | Multiple ship/station designs, four skin variants | **Not cleared** | Identify authorship, background assets, and possible third-party components |
| [Gigastructural Engineering's shipset sources](https://steamcommunity.com/sharedfiles/filedetails/?id=2678443706) | Authors of source shipsets were separately asked for permission to reuse within a Stellaris mod | **Not cleared** | Previous mod-to-mod permissions do not extend to Orbital Empires |
| [Star Wars Legacy-era Galactic Alliance ships](https://steamcommunity.com/sharedfiles/filedetails/?id=1719719577) | Uses models, designs and textures from multiple credited authors / other franchise artwork | **Not suitable** | Do not import franchise-specific models or derivatives |
| [Stellaris-Moding-Assets](https://github.com/quetzatcoatl/Stellaris-Moding-Assets) | README says use is free **for modding Stellaris** and discloses artwork derived from original Paradox game material | **Not suitable** | Its public availability and partial original authorship do not give our independent game rights |

Relevant terms: [Paradox User Agreement](https://legal.paradoxplaza.com/eula) sections 1 and 5 reserve underlying game IP and describe non-commercial UGC; [Steam Subscriber Agreement](https://store.steampowered.com/subscriber_agreement/) treats Workshop contributions as Steam subscriptions. Workshop permission does not automatically cover a separate distributable commercial game. If a creator can demonstrate entirely original assets, a **separate explicit license** can potentially authorize external use.

## Original-source alternatives that ARE candidates for a commercial Orbital Empires asset library

The following resources have an explicit source-page license allowing commercial reuse. Download directly from the original publisher rather than extracting an uncertain copy from a Stellaris mod. Validate each file and its accompanying license before incorporating it; different source assets may have separate terms.

| Candidate | Format / quality | Source license | Intended use |
| --- | --- | --- | --- |
| [Quaternius Ships Pack](https://quaternius.com/packs/ships.html) | 6 textured ship models, FBX/OBJ/Blend | CC0; publisher says personal/commercial allowed | Initial ships or source geometry for custom variants |
| [Quaternius Ultimate Space Kit](https://quaternius.com/packs/ultimatespacekit.html) | Space-themed 3D kit | CC0 as shown on the pack page | 3D craft, orbital structures, scene building |
| [OpenGameArt 3D Spaceships Pack by mehrasaur](https://opengameart.org/content/3d-spaceships-pack) | 9 original-looking untextured ships in Blend/OBJ/FBX; pack page excludes a previous TIE fighter | CC0 | Original-textured prototype fleet assets; independently review silhouettes |
| [OpenGameArt 3D LowPoly Spaceships and Components by Majadroid](https://opengameart.org/content/3d-lowpoly-spaceships-and-components) | Modular FBX, Blend, PNG textures | CC0; creator says textures are self-made | Build variants by combining parts |
| [Kenney Modular Space Kit](https://kenney.nl/assets/modular-space-kit) | 40 modular 3D objects | CC0 | Stations and habitats |
| [Solar System Scope planet textures](https://www.solarsystemscope.com/textures/) | Planet texture maps, some constructed from NASA data | CC BY 4.0; commercial permitted **with attribution** | Solar-system views, with visible credits |
| [NASA 3D Resources](https://science.nasa.gov/3d-resources/) | Scientific spacecraft and planetary models | Subject to NASA [media-use guidelines](https://www.nasa.gov/nasa-brand-center/images-and-media/) and possible third-party material | Informational/simulation uses only after asset-level source review |

These are **candidates, not shipped third-party files**. Existing [asset acquisition](ASSETS_AND_LICENSES.md) remains separate and currently does not integrate downloaded models with the runtime. Stellaris-style polish would require material authoring, faction visual languages, coherent silhouettes, LOD/performance optimization, camera/lighting design, and a browser-capable 3D renderer; PixiJS handles 2D only.

## Clearance gate before putting externally sourced ship art in game

1. Record canonical model/download URL, creator, license text/snapshot URL, source revision, exact filename and SHA-256; preserve required credits.
2. Check every constituent ship mesh, material, texture, sound, font and effects dependency. **A permission from a mod curator is not enough** when the original creator is someone else.
3. For Workshop assets, obtain explicit written permission from every relevant rights holder for redistribution and adaptation in a commercial **non-Stellaris** game, including the intended web/mobile/self-hosted distribution. Confirm there is no embedded Paradox or external franchise IP.
4. Store the source and permission evidence in our third-party inventory; require review before conversion/import.
5. No copying, extracting, repackaging, or automatic scraping of Workshop/installed-game binaries in the development branch before clearance.

This document is a provenance and licensing research record, not legal advice and not a claim that third-party game assets have been imported.
