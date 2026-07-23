# Sproutlings — Agent Memory

## Concept
A cozy, kid-friendly **zoo exploration** game for a self-hosted personal website. Fund expeditions → discover new species → grow your zoo → earn coins from visitors → buy upgrades → complete the dex. 16 species + Sparkle recolours. No management chores — just discovery and delight.

## Stack
- **Build:** Vite + React 18 + TypeScript (strict)
- **State:** Zustand (single store, autosaves to localStorage)
- **Persistence:** localStorage via `storage.ts` abstraction
- **Styling:** Plain CSS (phone-first, ~360px responsive)
- **Art:** Procedural SVG (no raster assets)
- **No routing library** — four tabs toggled via state enum
- **No external calls** — fully offline, COPPA-safe

## Project structure
```
src/
├── types.ts           # All interfaces (GameState, Species, ExpeditionSlot, etc.)
├── constants.ts       # Single-source-of-truth tuning values
├── storage.ts         # load/save/clear with localStorage
├── store/
│   └── gameStore.ts   # Zustand store with autosave
├── data/
│   └── species.ts     # 16-creature roster
├── audio.ts           # Web Audio API sound effects (coin, discovery, complete, welcome)
├── components/
│   ├── TopBar.tsx     # Stats + tab navigation + settings (sound, gentle mode, reset)
│   ├── Zoo.tsx        # Main creature showcase with passive income
│   ├── ExpeditionPost.tsx # Expedition slots — send out, wait, collect discoveries
│   ├── Collection.tsx # Dex grid with discovered/undiscovered
│   ├── Shop.tsx       # Buyable items (expedition slot, luck, hats)
│   ├── Creature.tsx   # Procedural SVG creature renderer
│   └── Confetti.tsx   # Confetti celebration particles
├── App.tsx            # Tab shell + tick loop + offline sim + sound
├── main.tsx           # Entry point
└── index.css          # Global styles
```

## Core loop
```
EARN coins (zoo visitors + expedition treasure)
      │
      ▼
START EXPEDITION (costs coins) ──▶ wait in real time ──▶ COLLECT
                                                              │
                                                              ▼
                                              DISCOVER new creature!
                                              (rarity + sparkle rolled)
                                                              │
                                                              ▼
                                          creature joins ZOO ──▶ more visitors (passive income)
                                                              │
                                                              ▼
                                          DEX updates (new species? celebrate!) ──▶ loop
```

## Build
- `npm run dev` — dev server
- `npm run build` — produces static `dist/`
- `npm run lint` — oxlint
- `npm run test` — vitest (no test files yet; passes via `passWithNoTests`)

## Milestone status
- ✅ **Phase 0 — Scaffold** (original): Vite+React+TS project, Zustand store, storage.ts, tab shell, constants, species data, production build.
- ✅ **Phase 1 — Zoo redesign** (current): stripped all management (plots, nursery, feeding, training, stages, tracks) and replaced with Expedition Post + Zoo showcase. Creatures are discovered via expeditions, live in the zoo, generate passive income. Three shop items: expedition slots, luck upgrades, hat boxes. Simpler, more game-like, no chores.

## Key conventions
- All tuning values in `constants.ts` — balancing is a one-file change.
- Species are data-only; adding one is a new entry in `species.ts`.
- Save version bump via `SAVE_VERSION` in constants.
- `storage.ts` is the only file that touches localStorage; swap it for a backend later.
- `Rarity`, `Shape`, `Species`, `ExpeditionSlot`, `OwnedCreature`, `DexEntry`, `GameState`, `Settings`, `Tab` in `types.ts`.
- No decay/neglect/cooldowns — creatures just exist and are cute. The only wait is expedition duration.

## CI/CD
- Any branch push → `.github/workflows/ci_branch.yaml`: node build/lint/test, Docker image build (nginx serving `dist/`), container health-check test.
- Tag push (by release-please, not manual) → `.github/workflows/ci.yaml`: same, plus push image to Docker Hub as `dachrisch/sproutlings:<tag>` and `:latest`.
- `release-please` cuts versioned releases with changelogs from conventional-commit messages on `master`; Renovate bumps use `fix:` commits so they cascade into real releases automatically.
- Full rationale: `docs/superpowers/specs/2026-07-22-ci-cd-infrastructure-design.md`.

## Spec doc
See `docs/sproutlings-spec.md` for full game design.
