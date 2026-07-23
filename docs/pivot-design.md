# Pivot Design — Sproutlings → Monster Collector

## Overview

Transform the existing Sproutlings (cozy zoo explorer) into the Monster Collector (battle-centric creature catcher). Same stack (Vite + React 18 + TS + Zustand), completely different game. Approx. 12h total, 4 phases.

## What we keep (infrastructure)

| Piece | File(s) | Why |
|---|---|---|
| Build tooling | `package.json`, `tsconfig.json`, `vite.config.ts`, `vitest.config.ts` | Same stack |
| `storage.ts` | `src/storage.ts` | Pattern is correct; just needs new types |
| `index.css` | `src/index.css` | Reuse layout, variables, breakpoints, tap targets. Gut game-specific sections |
| `audio.ts` | `src/audio.ts` | Reuse API; add battle SFX later |
| `Confetti.tsx` | `src/components/Confetti.tsx` | Reuse for catch/evo celebrations |
| `main.tsx` | `src/main.tsx` | Entry point unchanged |
| CI/CD | `.github/`, `Dockerfile`, `nginx.conf`, `renovate.json` | No changes needed |
| Tab navigation pattern | App shell → conditional tab rendering | Same concept |

## What we discard (replace entirely)

| Current file(s) | Replacement |
|---|---|
| `src/types.ts` | New types: Creature, Move, Biome, BattleState, etc. |
| `src/constants.ts` | New constants (level cap, ball bonus, etc.) |
| `src/data/species.ts` | `src/data/creatures.json`, `moves.json`, `types.json`, `biomes.json` |
| `src/store/gameStore.ts` | New Zustand store with battle + party + progression |
| `src/components/Zoo.tsx` | `src/ui/BattleScreen.tsx` |
| `src/components/ExpeditionPost.tsx` | `src/ui/BiomeSelect.tsx` |
| `src/components/Collection.tsx` | `src/ui/PartyScreen.tsx` |
| `src/components/Shop.tsx` | `src/ui/MessageModal.tsx` + future shop |
| `src/components/Creature.tsx` | Sprite-based renderer in `ui/components/` |
| `src/components/TopBar.tsx` | New top bar (player name, balls, seen/caught count) |
| `src/App.tsx` | New shell (battle loop, tick, autosave) |

## New file structure

```
src/
├── engine/                  # Pure functions, zero React, zero DOM
│   ├── battle.ts            # State machine reducer
│   ├── damage.ts            # Damage formula
│   ├── catch.ts             # Catch-rate formula
│   ├── xp.ts                # XP gain + level thresholds
│   └── rng.ts               # Seeded RNG for reproducibility
├── data/
│   ├── creatures.json       # 12 creatures (son's file)
│   ├── moves.json           # ~15 moves
│   ├── types.json           # 4-type effectiveness matrix
│   └── biomes.json          # 3 biomes + encounter tables (Day 3)
├── state/
│   ├── save.ts              # Load/save/migrate with schemaVersion
│   ├── store.ts             # Zustand store
│   └── messages.ts          # Fetch + filter queue (§11)
├── ui/
│   ├── BattleScreen.tsx     # Main battle view
│   ├── PartyScreen.tsx      # Party management
│   ├── BiomeSelect.tsx      # Area picker
│   ├── MessageModal.tsx     # Sprite + text box for events
│   ├── components/
│   │   ├── Sprite.tsx        # Pixel-art sprite renderer (integer scale)
│   │   ├── HpBar.tsx         # Type-coloured HP bar
│   │   ├── MoveGrid.tsx      # 2×2 move buttons
│   │   └── CatchShake.tsx    # 3-shake catch animation
│   └── shared/
│       └── DamagePopup.tsx   # Floating damage numbers
├── assets/
│   └── creatures/           # {id}_front.png, {id}_back.png, {id}_face1.png, {id}_face2.png
│       └── modified/        # CC BY-SA edits go here
├── types.ts                 # All interfaces
├── constants.ts             # Tuning values
├── audio.ts                 # Web Audio SFX (keep, extend)
├── storage.ts               # localStorage wrapper (keep pattern)
├── App.tsx                  # Tab shell + tick
├── main.tsx                 # Entry (keep)
└── index.css                # Styles (clean up)
```

## Migration phases

### Phase A — Strip to skeleton (15 min)

```
git checkout -b pivot/monster-collector
```

1. Delete all component files except `Confetti.tsx`
2. Delete `src/data/species.ts`
3. Delete `src/store/gameStore.ts`
4. Gut `src/types.ts` to empty + `constants.ts` to empty
5. Delete `src/App.tsx` content, leave shell
6. Create `src/engine/`, `src/state/`, `src/ui/` directories
7. Create stub `src/types.ts` with new schemas

**Done when:** `npm run dev` starts with a blank page and no errors.

### Phase B — Data + engine + battle screen (spec Day 1)

Parallel workstreams:

**B1 — Data files**
- `src/data/types.json` — 4-type matrix
- `src/data/creatures.json` — 12 entries (Son fills spreadsheet)
- `src/data/moves.json` — ~15 moves
- `src/constants.ts` — level cap 20, ball bonus 1.0, etc.

**B2 — Engine**
- `src/engine/rng.ts` — seedable PRNG
- `src/engine/damage.ts` — `calcDamage(attacker, defender, move, rng) → { damage, effectiveness, didHit }`
- `src/engine/catch.ts` — `catchChance(wild, ballBonus) → probability`
- `src/engine/xp.ts` — `xpGain(baseXp, enemyLevel)`, `xpForLevel(n)`, `recomputeStats(creature)`
- `src/engine/battle.ts` — single `step(state, action) → { state, events[] }` state machine

**B3 — Battle UI**
- `src/ui/BattleScreen.tsx` — portrait layout: enemy top, player bottom, 2×2 move grid, event log
- `src/ui/components/Sprite.tsx` — `image-rendering: pixelated`, 4× integer scale
- `src/ui/components/MoveGrid.tsx` — 2×2 button grid for move selection
- `src/ui/components/HpBar.tsx` — type-coloured bar

**Son:** fills creature spreadsheet (names, types, stats, moves, flavour).
**Done when:** hardcoded battle is playable on phone.

### Phase C — Progression + persistence (spec Day 2)

- `CATCH` action + shake animation + name prompt
- Party of 6, overflow box, `PartyScreen.tsx` with switch/reorder
- XP award on victory, level-up with stat recompute, move unlock
- `src/state/save.ts` — autosave after battles, `schemaVersion` guard
- Heal-all button
- `src/state/store.ts` — Zustand store derived from `step()` outputs

**Done when:** catch → name → close browser → reopen → creature persists.

### Phase D — Biomes + encounters (spec Day 3)

- `src/data/biomes.json` — 3 areas, weighted encounter tables
- `src/ui/BiomeSelect.tsx` — large tap targets, locked greyed out
- Weighted random encounter system
- Boss per biome: fixed level, unlocks next area
- "Seen / Caught" counter

**Done when:** beat boss → new area unlocks → keep playing.

### Phase E — Polish + PWA (spec Day 4)

- Face sprites (24×24) in party menu as icons, two-frame idle
- Type-coloured HP bars, damage popups, faint fade-out, catch-shake
- PWA manifest + icon + `display: standalone` + service worker
- Deploy behind Traefik
- `ATTRIBUTION.md` generated from Tuxemon wiki data
- Message hooks (schema field, `MessageModal.tsx` shell, silent fetch)

**Done when:** icon on home screen, works offline on U-Bahn.

## Architecture decisions

### Battle engine is pure, always
`step(state, action) → { state, events[] }`. No React, no DOM, no side effects.
Events are a flat log the UI animates frame by frame. The UI never computes game logic.

### Zustand store is a thin wrapper
The store calls `step()`, saves the result, and triggers re-renders. It doesn't do game logic itself. Pattern:
```ts
const performMove = (moveId: string) => {
  const { battleState } = get();
  const { state: nextState, events } = step(battleState, { type: 'FIGHT', moveId });
  set({ battleState: nextState, pendingEvents: [...pendingEvents, ...events] });
  scheduleAutosave();
};
```

### Type system
New `types.ts` mirrors spec schemas exactly. Creature data from `creatures.json` is imported as const:

```ts
import creaturesData from './data/creatures.json';
export const CREATURES = creaturesData as Creature[];
export const CREATURE_MAP = Object.fromEntries(CREATURES.map(c => [c.id, c]));
```

### Save migration from Sproutlings
The save schema is entirely different (no `exepeditionSlots`, `luckLevel`, `ownedHats`, etc). We bump `SAVE_VERSION` to 5 and return null on any Sproutlings v1-4 save, starting fresh. No migration needed — the games are too different.

### Sprites (Day 0 prep)
Tuxemon Set 1 from OpenGameArt. Selected sprites renamed to creature IDs. Loaded as static assets:
```tsx
const frontSrc = `/assets/creatures/${creatureId}_front.png`;
```

## Save schema (monster collector)

```ts
interface MonsterCollectorSave {
  schemaVersion: 5;
  playerName: string;
  party: PartyCreature[];
  box: PartyCreature[];
  seenIds: string[];
  caughtIds: string[];
  unlockedBiomes: string[];
  seenMessages: string[];
  balls: number;
}

interface PartyCreature {
  creatureId: string;
  nickname: string;
  level: number;
  xp: number;
  currentHp: number;
}
```

## Risk mitigation

| Risk | Mitigation |
|---|---|
| Sproutlings save gets wiped | Schema bump to 5, old saves simply don't load (no data loss, just fresh start) |
| Son loses interest | Phase B ends with a playable battle using HIS creatures. If it lands, momentum carries. |
| Balance broken | Seeded RNG + headless sim script for 1000 battles per matchup |
| Sprites unavailable/broken licence | Source only from verified OpenGameArt; fallback to placeholder coloured boxes |
| Scope creep into overworld | The entire non-goals section is taped to the monitor |

## Dependency tree

```
types.ts ←───────────┐
   ├── engine/*.ts    │ (no framework imports)
   ├── data/*.json    │
   ├── constants.ts ──┤
   └── state/store.ts ┤
         ├── ui/*.tsx  │ (React components)
         ├── App.tsx ──┘
         └── main.tsx
```

Engine has zero imports from React or the DOM. UI imports from engine. Store imports from engine and React. App imports from store and UI.
