# src/ — Source tree

Applies to all TypeScript under `src/`. See [../AGENTS.md](../AGENTS.md) for product context and build commands.

Directory-specific guides:
- [src/data/AGENTS.md](data/AGENTS.md) — procedural sprite/particle data
- [src/scenes/AGENTS.md](scenes/AGENTS.md) — Phaser scenes
- [src/ui/AGENTS.md](ui/AGENTS.md) — DOM controls and name entry

## Layout
```
src/
├── main.ts          # Phaser.Game bootstrap; registers scene list; calls initControls/initNameEntry/initAudio/store.start
├── types.ts         # Monster, SaveData, Species, PixelCell, ParticleShape, Need, Mood
├── constants.ts     # single source of truth for tuning: decay, thresholds, offline cap, action restore, palette, GRID_SIZE, PIXEL_SCALE, SAVE_VERSION, MAX_NAME_LENGTH
├── state.ts         # PURE: createMonster, applyDecay, applyAction, hasRunAway, moodFor
├── bus.ts           # minimal framework-free event emitter; EVENTS constants
├── store.ts         # single mutable source of truth; owns SaveData, calls state.ts, persists to localStorage, emits on bus
├── storage.ts       # versioned load/save helpers with fresh-save fallback; currently unused by the app (only storage.test.ts imports it)
├── petAnimation.ts  # PURE state machine for pet idle/mood/reaction/running-away animations
├── data/            # procedural pixel data — see data/AGENTS.md
├── render/
│   └── drawCells.ts # pure canvas helper: cells + palette → 2D context; no Phaser
├── scenes/          # Phaser 4 scenes — see scenes/AGENTS.md
├── ui/              # DOM controls and name entry — see ui/AGENTS.md
├── audio/
│   └── synth.ts     # Web Audio oscillator blips + background loop; no audio files; honors settings.sound
└── style.css        # bezel, need bars, buttons, responsive/accessible styling
```

## Conventions
- `constants.ts` is the single source of truth for tuning — balancing is a one-file change.
- Pure logic (`state.ts`, `petAnimation.ts`, `data/*`, `render/drawCells.ts`) is framework-free: no Phaser imports, no DOM, no side effects. Test it with vitest alone.
- `bus.ts` is deliberately not Phaser's event emitter, so core logic (`state.ts`, `store.ts`, `bus.ts`) never imports `phaser` and stays trivial to unit test.
- `store.ts` is where the pure state functions are applied with real side effects (persistence, bus events). It owns the save (`getMonster`, `getSettings`, `hatchNewMonster`, `performAction`, `tick`, `start`, `stop`) and publishes `EVENTS.MONSTER_UPDATED`, `ACTION` and `RUN_AWAY`. UI and scenes subscribe to the bus rather than calling each other.
- Persistence lives in `store.ts`: `load()` runs at import time and `save()` runs after every change, both wrapped in try/catch so storage errors never crash the game. `SAVE_VERSION` is bumped in `constants.ts`; note the live loader does not enforce a version check, while `storage.ts`'s `loadSave()` does (falling back to a fresh save) — `storage.ts` is currently referenced only by its own test.
- Tests are colocated `*.test.ts` files beside the module (`state.test.ts`, `store.test.ts`, `bus.test.ts`, `petAnimation.test.ts`, `data/*.test.ts`, `render/drawCells.test.ts`, `ui/*.test.ts`). Run them with `npm run test`.
