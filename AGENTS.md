# Sproutlings — Agent Memory

## Concept
A Game Boy-style Tamagotchi for an 8-year-old: hatch a monster, then Feed/Play/Clean/Sleep to keep its four needs up in real time. Needs decay on real wall-clock time; sustained neglect makes the monster run away (soft reset to a new egg) — no permanent death. Single pet, 3+ random species, monochrome 4-shade Game Boy green palette, procedural pixel art, synthesized chiptune audio. No battle system, no party, no biomes — this replaced the earlier "Monster Collector" battler entirely.

## Core loop
```
NO MONSTER → tap egg → HATCH (random species)
                              │
                              ▼
        real-time decay of Hunger/Happiness/Cleanliness/Energy
                              │
              Feed / Play / Clean / Sleep restores a need
                              │
        any need critically low too long ──▶ RUN AWAY ──▶ back to egg
```

## Stack
- **Build:** Vite + TypeScript (strict), no UI framework
- **Rendering:** Phaser 4 (`src/scenes/`)
- **State:** a single mutable store (`src/store.ts`), no Zustand/Redux
- **Persistence:** localStorage via `src/storage.ts`, versioned, never throws
- **Controls:** real DOM `<button>`s in `index.html`, not Phaser game objects — keeps keyboard/tap accessibility without a framework
- **Art:** procedural pixel-coordinate sprites, no image files
- **Audio:** Web Audio synth, no audio files
- **No external calls** — fully offline

## Project structure
```
src/
├── types.ts              # Monster, SaveData, Species, PixelCell
├── constants.ts          # Decay rate, thresholds, offline cap, palette
├── storage.ts            # load/save localStorage, versioned, never throws
├── state.ts              # PURE: createMonster, applyDecay, applyAction, hasRunAway, moodFor
├── bus.ts                # Minimal framework-free event emitter
├── store.ts              # Mutable singleton: owns SaveData, calls state.ts, persists, emits on bus
├── data/
│   ├── pixelShapes.ts    # filledCircle/mergeCells — pure shape-building helpers
│   └── species.ts        # 3+ species built from pixelShapes
├── render/
│   └── drawCells.ts      # pure canvas-drawing helper (species cells → 2D context)
├── scenes/
│   ├── BootScene.ts      # builds a Phaser texture per species from drawCells
│   ├── PetScene.ts       # renders the monster, idle/mood animation, dot-matrix+glow
│   └── HatchScene.ts     # tap-the-egg screen shown when there's no monster
├── ui/
│   └── controls.ts       # wires DOM buttons + need bars to store.ts via bus.ts
├── audio/
│   └── synth.ts          # Web Audio blips + background loop
├── main.ts                # Phaser.Game bootstrap + wires controls/audio/store
└── style.css               # bezel, need bars, buttons, responsive/accessible styling
```

## Key conventions
- All tuning values in `constants.ts` — balancing is a one-file change.
- `state.ts` is pure functions over plain data — no Phaser, no DOM, no side effects. `store.ts` is the only place those functions get called with real side effects (persistence, bus events).
- Save version bump via `SAVE_VERSION` in `constants.ts`; `storage.ts` falls back to a fresh save on any mismatch, never throws.
- `bus.ts` is intentionally not Phaser's event emitter, so core logic (`state.ts`, `store.ts`, `bus.ts`) never needs to import the `phaser` package and stays fast/trivial to unit test.

## Build
- `npm run dev` — dev server
- `npm run build` — produces static `dist/`
- `npm run lint` — oxlint
- `npm run test` — vitest

## CI/CD
Same infrastructure as before this pivot — Vite build → Docker (nginx) → Docker Hub. See `.github/workflows/`.

## Spec doc
See `docs/superpowers/specs/2026-07-28-gameboy-tamagotchi-pivot-design.md` for the current design.
See `docs/superpowers/plans/2026-07-28-gameboy-tamagotchi-pivot.md` for the implementation plan.
Prior designs (`docs/pivot-design.md`, `docs/superpowers/specs/2026-07-23-monster-development-redesign-design.md`, `docs/sproutlings-spec.md`) are superseded — kept for history.
