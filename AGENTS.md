# Monster Collector — Agent Memory

## Concept
A mobile-first **creature collector** game for a kid's phone. Explore biomes → encounter wild creatures → battle → catch → name → level up → repeat. 12 species, 4 types, 3 biomes. No management chores — just discovery, combat, and delight.

## Core loop
```
PICK BIOME → encounter wild creature → BATTLE (turn-based) → CATCH or defeat
                                                                    │
                                                                    ▼
                                              creature joins PARTY ──▶ level up from XP
                                                                    │
                                                                    ▼
                                              DEX updates (new species?) ──▶ loop
```

## Stack
- **Build:** Vite + React 18 + TypeScript (strict)
- **State:** Zustand (single store, autosaves to localStorage)
- **Persistence:** localStorage via `storage.ts` abstraction
- **Styling:** Plain CSS (phone-first, ~360px responsive)
- **Art:** Pixel-art sprites (Tuxemon Set 1, CC BY-SA 3.0) — 64×64 front/back, 24×24 face
- **No routing library** — tabs toggled via state enum
- **No external calls** — fully offline

## Project structure
```
src/
├── types.ts              # All interfaces (MonsterType, CreatureDef, BattleState, SaveData, etc.)
├── constants.ts          # Tuning values (level cap, ball bonus, biome boss wins)
├── storage.ts            # load/save/clear with localStorage
├── engine/               # Pure functions — zero React, zero DOM
│   ├── battle.ts         # State machine reducer (step, createBattle, evolveState)
│   ├── damage.ts         # Damage formula + type effectiveness
│   ├── catch.ts          # Catch-rate formula + 3-shake mechanic
│   ├── xp.ts             # XP gain, level thresholds, stat recompute
│   └── rng.ts            # Seedable PRNG (mulberry32)
├── state/
│   ├── store.ts          # Zustand store (battle state, party, progression, autosave)
│   ├── save.ts           # Load/save/migrate with schemaVersion guard
│   └── messages.ts       # Fetch + filter queue for personal messages (§11)
├── data/
│   ├── creatures.json    # 12 creatures
│   ├── moves.json        # ~15 moves across 4 types
│   ├── types.json        # Fire/water/grass/stone effectiveness matrix
│   └── biomes.json       # 3 biomes with weighted encounter tables
├── ui/
│   ├── BattleScreen.tsx  # Main battle view (phases: INTRO→FIGHT→RESOLVE→...)
│   ├── BiomeSelect.tsx   # Area picker with lock/unlock + boss button
│   ├── PartyScreen.tsx   # Party management + heal all
│   ├── CollectionScreen.tsx # Species grid (seen/caught progress)
│   ├── TopBar.tsx        # Stats + tab navigation + settings
│   ├── MessageModal.tsx  # Stub for personal messages
│   ├── components/
│   │   ├── Sprite.tsx    # Pixel-art renderer with fallback
│   │   ├── MoveGrid.tsx  # 2×2 move button grid
│   │   └── HpBar.tsx     # Type-coloured HP bar
│   └── shared/
│       └── DamagePopup.tsx # Floating damage numbers
├── App.tsx               # Tab shell + autosave on mount + notification toast
├── main.tsx              # Entry point
└── index.css             # Global styles
```

## Battle state machine
```
INTRO → PLAYER_ACTION → RESOLVING → CHECK_FAINT
                                       ├→ PLAYER_ACTION (continue)
                                       ├→ FORCE_SWITCH (player fainted)
                                       ├→ VICTORY → END
                                       ├→ CAUGHT → NAME_PROMPT → END
                                       ├→ DEFEAT → END
                                       └→ FLED → END
```

Key rules: CATCH/SWITCH/RUN resolve before enemy moves. RUN always succeeds. Turn order by SPD stat (higher first, coinflip ties).

## Build
- `npm run dev` — dev server
- `npm run build` — produces static `dist/`
- `npm run lint` — oxlint
- `npm run test` — vitest

## Key conventions
- All tuning values in `constants.ts` — balancing is a one-file change.
- `engine/` is pure functions over plain data — no React, no DOM, no side effects.
- Save version bump via `SAVE_VERSION` in constants.
- `storage.ts` is the only file that touches localStorage.
- JSON data files are the single source of truth for creatures, moves, types, biomes.

## CI/CD
Same infrastructure as Sproutlings — Vite build → Docker (nginx) → Docker Hub. See `.github/workflows/`.

## Spec doc
See `docs/monster-collector-4day-spec.md` for full game design.
See `docs/pivot-design.md` for the Sproutlings → Monster Collector migration plan.
