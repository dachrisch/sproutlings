# src/data/ — Procedural pixel data

Pure data and shape-building helpers for species and action particles. No Phaser, no DOM, no image files. See [../AGENTS.md](../AGENTS.md) for source-tree conventions.

## Rules
- Sprites are lists of `PixelCell` (`{ x, y, shade }`, shade `1 | 2 | 3`) on a `GRID_SIZE` grid; the four shades are the DMG Game Boy ramp in `constants.ts`.
- `pixelShapes.ts` holds reusable pure helpers (`filledCircle`, `mergeCells`, `shiftCells`, `closeEyes`). Compose new shapes from these and keep them side-effect free.
- `species.ts` defines the selectable species (`SPECIES`, `SPECIES_MAP`) and extra frames (`SPECIES_FRAMES`: blink / look-left / look-right). Adding a species or frame is a data-only change here — no scene or store edits needed.
- `particles.ts` defines action particles (`PARTICLES`, `PARTICLES_MAP`: morsel / star / droplet / zzz) used by the action scenes.
- Every module has a colocated `*.test.ts`; add tests for new shapes or species and run `npm run test`.
