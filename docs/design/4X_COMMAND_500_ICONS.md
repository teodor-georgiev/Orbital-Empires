# Orbital Empires — 4X command UI and 500-icon taxonomy (2026-11-04)

## Design target and reference

Build on the user's **approved hybrid A+B+C design**, not a visual clone of another commercial game. See [APPROVED-HYBRID-UI.md](APPROVED-HYBRID-UI.md) and the approved [editable layout SVG](approved-hybrid-layout.svg). Prior implementation already has galaxy-first navigation, a selected-object inspector, a solar-system orbit scene and a unified Progress viewer.

Reference research, used for **patterns only**:
- [Stellaris interface examples](https://playcraft.space/gallery/games/stellaris/): readable galaxy map, persistent resources, contextual selected-object inspector, strategic outliner.
- [Endless Space 2 design discussion](https://www.pcgamer.com/how-the-endless-series-reimagined-the-4x-strategy-genre/): rapid navigation between galaxy, system and planet; reduced clutter.
- [Endless Space 2 tech-screen design reference](https://www.gamegrin.com/directory/game/endless-space-2/images): discipline icons, research progress, detailed effects, information when selected.
- [Galactic Civilizations IV 2026 UI roadmap](https://forums.galciv4.com/542456/galciv-iv-dev-journal-123-the-galactic-roadmap-fall-2026-edition): overview-first planet management with tabs for details, without extra busywork.
- [Endless Legend 2 UI accessibility discussion](https://community.amplitude-studios.com/amplitude-studios/endless-legend-2/blogs/996-ui-ux-next-steps): related empire actions need a predictable location; strategic resources should not dominate the view.

All references are for critique and architecture. **No images, fonts, icons, sounds, textures or markup from those games have been copied.**

## Intentional design decisions

- **Map is the primary canvas.** Keep the actual galaxy, solar scene, bottom event feed and right contextual command inspector.
- **One place for empire-wide tasks.** The left-nav command center retains seven sections, with Technology, Traditions and Policies together in Progress.
- **Outliner only for actionable information.** Instead of repeating decorative HUD widgets, add real research progress, tradition readiness and buttons that select real colony systems and fleets. Changing outliner selection invokes the existing game handlers.
- **One purpose per icon.** Meaning comes from descriptive text first. Shape, color, status and name reinforce it; colors alone never encode completion or affordability.
- **No fictitious economy, queues, or AI.** Outliner is computed from existing game state and does not alter simulation or saves.
- **Responsive.** On narrower widths, conceal the dense outliner in favor of existing navigation and selected-object panel, which already occupy limited screen space.
- **Planet management.** Swap generic emoji in real surface/orbital building cards for more consistent icon art, preserving building names, costs, and button actions.

## New 500-icon system

- `assets/ui/empire-icon-atlas.svg`: exactly **500 individually addressable SVG symbols**, generated as a deterministic compositional 25 × 20 library with a semantic base shape and distinct detail mark.
- `assets/ui/empire-icon-catalog.json`: labels, stable IDs and category for each of the 500 icons.
- `assets/ui/empire-icon-gallery.html`: searchable gallery with 25 filters; browse 20 icons per category.
- Existing `assets/ui/strategy-icons.svg` (31 hand-tuned primary icons) remains the main source for 7 navigation destinations, resource HUD and track/slot identity. Do not replace well-curated silhouettes with visually busier atlas glyphs at tiny sizes.
- New atlas symbols are used for all **16 technologies, 9 Traditions, 6 Policies**, planet/orbital building specialties, and the real empire outliner.
- The atlas represents **500 named tokens**, not 500 fully hand-painted pieces: shapes are composed from distinct category motifs with 20 variants. This means they remain cohesive and scalable; high-visibility icons may be bespoke-polished further.
- All assets are first-party original, inline data-free external SVG, can be used commercially and work offline under existing PWA caching. They contain no remote images, script, network fonts or tracking.

## Quality gates

1. Verify 500 distinct symbol IDs and catalog entries, 25 categories × 20, valid offline paths and no unsafe external references.
2. Confirm technology, Tradition, Policy and building artwork references exist.
3. Verify outliner actions use real data, select existing systems/fleets and never mutate game state when rendering.
4. Run existing Node suite and the real local Chromium smoke test; capture desktop galaxy, Progress, solar/planet and mobile views. Separately verify 500-icon gallery search/filter and a non-empty rendered SVG geometry.
5. Compare the captured layout with the approved hybrid design and 4X research observations before PR merge; keep changed files scoped.
6. No production deployment unless the project’s actual hosting pipeline reports success; GitHub Pages' older content may be sourced from a different branch.

## Next design iterations (not claimed in this PR)

Fleet order queue, colony build queue, research notification gating, production overview, real-time speed controls, minimap, custom persistent outliner sorting, and richer planet tabs should be decided alongside their corresponding simulation rules.
