# Sproutlings — Agent Memory

## Concept
A cozy, kid-friendly creature-collector idle game for a self-hosted personal website. Plant seeds → grow eggs → hatch creatures → earn coins offline → buy upgrades → complete the dex. 16 species + Sparkle recolours.

## Stack
- **Build:** Vite + React 18 + TypeScript (strict)
- **State:** Zustand (single store, autosaves to localStorage)
- **Persistence:** localStorage via `storage.ts` abstraction
- **Styling:** Plain CSS (phone-first, ~360px responsive)
- **Art:** Procedural SVG (no raster assets)
- **No routing library** — three tabs toggled via state enum
- **No external calls** — fully offline, COPPA-safe

## Project structure
```
src/
├── types.ts           # All interfaces (GameState, Species, Plot, etc.)
├── constants.ts       # Single-source-of-truth tuning values
├── storage.ts         # load/save/clear with localStorage
├── store/
│   └── gameStore.ts   # Zustand store with autosave
├── data/
│   └── species.ts     # 16-creature roster
├── components/
│   ├── TopBar.tsx     # Stats + tab navigation
│   ├── Garden.tsx     # Plot grid + meadow (placeholder)
│   ├── Collection.tsx # Dex grid (placeholder)
│   └── Shop.tsx       # Buyable items (placeholder)
├── App.tsx            # Tab shell
├── main.tsx           # Entry point
└── index.css          # Global styles
```

## Build
- `npm run dev` — dev server
- `npm run build` — produces static `dist/`

## Milestone status
- ✅ **Phase 0 — Scaffold** (complete): Vite+React+TS project, Zustand store, storage.ts, tab shell, constants, species data, production build.
- ⬜ **Phase 1 — MVP core loop** (next): plots, hatching, meadow accrual, economy, basic shop, dex discovery, autosave, offline sim.
- ⬜ **Phase 2 — Collection & polish**
- ⬜ **Phase 3 — Stretch goals**

## Key conventions
- All tuning values in `constants.ts` — balancing is a one-file change.
- Species are data-only; adding one is a new entry in `species.ts`.
- Save version bump via `SAVE_VERSION` in constants.
- `storage.ts` is the only file that touches localStorage; swap it for a backend later.
- `Rarity`, `Shape`, `Species`, `Plot`, `OwnedCreature`, `DexEntry`, `GameState`, `Settings`, `Tab` in `types.ts`.

## Spec doc
See `docs/sproutlings-spec.md` for full game design.
