# Game Boy Tamagotchi Pivot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current shipped Monster Collector game (battle engine, Tuxemon sprites, care/training system) with a single-pet, Game Boy-style Tamagotchi built on Phaser 4 — no React, no Zustand.

**Architecture:** Plain TypeScript + Phaser 4, bootstrapped from `src/main.ts`. All game logic (`state.ts`) and data (`pixelShapes.ts`, `species.ts`) is framework-free and pure, fully unit-testable without Phaser or the DOM. A single mutable store (`store.ts`) owns the save data, calls the pure logic, persists via `storage.ts`, and publishes changes on a minimal custom event bus (`bus.ts`) that both the DOM controls and the Phaser scenes subscribe to. Controls stay real HTML `<button>`s around the Phaser canvas, not Phaser game objects, to keep keyboard/tap accessibility without a UI framework.

**Tech Stack:** Vite, TypeScript (strict), Phaser 4, vitest, oxlint. No React, no Zustand, no JSX.

## Global Constraints

- No network calls of any kind — fully static, offline, COPPA-safe.
- Package name and Docker Hub image name stay `sproutlings` — no CI/infra changes.
- `npm run dev/build/lint/test` script names must keep matching `.github/workflows/part_node_build.yaml` (`npm ci`, `npm run lint`, `npm run build`, `npm run test -- --reporter=default --reporter=junit`).
- GPLv3 `LICENSE` is unchanged.
- No player-chosen starter species — random from the roster.
- No permanent death — "run away" (soft reset to a new egg) is the only neglect consequence.
- No external art or audio asset files — sprites are procedural pixel data, audio is synthesized at runtime. No attribution file needed.
- Phone-first responsive (~360px), `prefers-reduced-motion` respected, visible keyboard focus on every interactive element.
- `tsconfig.json` enforces `noUnusedLocals`/`noUnusedParameters`; `.oxlintrc.json` enforces `typescript/no-explicit-any` as an error and `no-unused-vars` (with `^_` ignore pattern). No unused imports, no `any`.

---

## Task 1: Branch + prune legacy code + add Phaser 4

**Files:**
- Modify: `vite.config.ts`, `tsconfig.json`, `package.json` (via npm), `index.html`
- Create: `src/main.ts` (temporary stub, replaced in Task 15)
- Delete: everything currently under `src/`, `public/assets/creatures/`, `ATTRIBUTION.md`

**Interfaces:**
- Produces: a building, lintable, testable empty TypeScript + Phaser 4 project that every later task adds to.

- [ ] **Step 1: Create the branch**

```bash
git checkout -b pivot/gameboy-tamagotchi
```

- [ ] **Step 2: Remove the old game's dependencies and add Phaser 4**

```bash
npm uninstall react react-dom @vitejs/plugin-react @types/react @types/react-dom zustand
npm install phaser@^4
```

- [ ] **Step 3: Delete the old source tree, Tuxemon assets, and attribution file**

```bash
rm -rf src public/assets/creatures ATTRIBUTION.md
mkdir -p src/data src/render src/scenes src/ui src/audio
```

- [ ] **Step 4: Strip the React plugin from `vite.config.ts`**

```ts
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: 'dist',
  },
});
```

- [ ] **Step 5: Remove the JSX compiler option from `tsconfig.json`**

Edit `tsconfig.json` and delete the line `"jsx": "react-jsx",`. The rest of the file (strict mode, `noUnusedLocals`, etc.) stays as-is.

- [ ] **Step 6: Write a minimal `index.html` and `src/main.ts` stub**

`index.html`:
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Sproutlings</title>
  </head>
  <body>
    <div id="game"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

`src/main.ts`:
```ts
console.log('Sproutlings booting...');
```

- [ ] **Step 7: Verify the empty project builds, lints, and tests cleanly**

Run: `npm run build && npm run lint && npm run test`
Expected: all three succeed; vitest reports "No test files found, exiting with code 0" (allowed by `passWithNoTests` in `vitest.config.ts`).

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "chore: prune legacy Monster Collector code, add Phaser 4"
```

---

## Task 2: Constants & types

**Files:**
- Create: `src/constants.ts`, `src/types.ts`

**Interfaces:**
- Produces: `Need`, `Monster`, `SaveData`, `PixelCell`, `Species` types; all tuning constants used by every later task.

No test cycle — these are pure declarations with no behavior to assert.

- [ ] **Step 1: Write `src/types.ts`**

```ts
export type Need = 'hunger' | 'happiness' | 'cleanliness' | 'energy';

export interface Monster {
  speciesId: string;
  hunger: number;
  happiness: number;
  cleanliness: number;
  energy: number;
  bornAt: number;
  lastUpdate: number;
  criticalSince: number | null;
}

export interface SaveData {
  version: number;
  monster: Monster | null;
  settings: { sound: boolean; reducedMotion: boolean };
}

export interface PixelCell {
  x: number;
  y: number;
  shade: 1 | 2 | 3;
}

export interface Species {
  id: string;
  name: string;
  cells: PixelCell[];
}
```

- [ ] **Step 2: Write `src/constants.ts`**

```ts
export const NEED_MAX = 100;
export const NEED_START = 100;
export const DECAY_PER_HOUR = 5;
export const SAD_THRESHOLD = 30;
export const HAPPY_THRESHOLD = 70;
export const CRITICAL_THRESHOLD = 10;
export const RUNAWAY_GRACE_MS = 6 * 60 * 60 * 1000;
export const OFFLINE_CAP_MS = 12 * 60 * 60 * 1000;
export const ACTION_RESTORE_AMOUNT = 40;
export const TICK_INTERVAL_MS = 60_000;
export const SAVE_VERSION = 1;
export const GRID_SIZE = 12;
export const PIXEL_SCALE = 4;
export const PALETTE = ['#9bbc0f', '#8bac0f', '#306230', '#0f380f'] as const;
```

- [ ] **Step 3: Verify the project still builds**

Run: `npm run build`
Expected: succeeds (nothing imports these yet, but `tsc -b` must still compile them cleanly).

- [ ] **Step 4: Commit**

```bash
git add src/types.ts src/constants.ts
git commit -m "feat: add core types and tuning constants"
```

---

## Task 3: Pixel-shape helpers

**Files:**
- Create: `src/data/pixelShapes.ts`
- Test: `src/data/pixelShapes.test.ts`

**Interfaces:**
- Consumes: `PixelCell` from `src/types.ts`.
- Produces: `filledCircle(cx, cy, r, shade): PixelCell[]`, `mergeCells(...layers: PixelCell[][]): PixelCell[]` — used by Task 4 to build species.

- [ ] **Step 1: Write the failing tests**

```ts
// src/data/pixelShapes.test.ts
import { describe, expect, it } from 'vitest';
import { filledCircle, mergeCells } from './pixelShapes';

describe('filledCircle', () => {
  it('includes the center cell', () => {
    expect(filledCircle(3, 3, 2, 2)).toContainEqual({ x: 3, y: 3, shade: 2 });
  });

  it('excludes cells far outside the radius', () => {
    const cells = filledCircle(3, 3, 1, 1);
    expect(cells.some((c) => c.x === 10 && c.y === 10)).toBe(false);
  });

  it('produces a cell count close to the circle area', () => {
    const r = 4;
    const cells = filledCircle(10, 10, r, 1);
    const area = Math.PI * r * r;
    expect(cells.length).toBeGreaterThan(area * 0.7);
    expect(cells.length).toBeLessThan(area * 1.3);
  });

  it('tags every cell with the given shade', () => {
    const cells = filledCircle(2, 2, 2, 3);
    expect(cells.every((c) => c.shade === 3)).toBe(true);
  });
});

describe('mergeCells', () => {
  it('lets later layers override earlier cells at the same coordinate', () => {
    const base = [{ x: 0, y: 0, shade: 1 as const }];
    const overlay = [{ x: 0, y: 0, shade: 3 as const }];
    expect(mergeCells(base, overlay)).toEqual([{ x: 0, y: 0, shade: 3 }]);
  });

  it('keeps cells from all layers when coordinates do not collide', () => {
    const a = [{ x: 0, y: 0, shade: 1 as const }];
    const b = [{ x: 1, y: 1, shade: 2 as const }];
    const merged = mergeCells(a, b);
    expect(merged).toHaveLength(2);
    expect(merged).toContainEqual({ x: 0, y: 0, shade: 1 });
    expect(merged).toContainEqual({ x: 1, y: 1, shade: 2 });
  });
});
```

- [ ] **Step 2: Run and verify it fails**

Run: `npm run test -- src/data/pixelShapes.test.ts`
Expected: FAIL — `pixelShapes.ts` doesn't exist yet.

- [ ] **Step 3: Write the implementation**

```ts
// src/data/pixelShapes.ts
import type { PixelCell } from '../types';

export function filledCircle(cx: number, cy: number, r: number, shade: 1 | 2 | 3): PixelCell[] {
  const cells: PixelCell[] = [];
  const minY = Math.floor(cy - r);
  const maxY = Math.ceil(cy + r);
  const minX = Math.floor(cx - r);
  const maxX = Math.ceil(cx + r);
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const dx = x - cx + 0.5;
      const dy = y - cy + 0.5;
      if (dx * dx + dy * dy <= r * r) {
        cells.push({ x, y, shade });
      }
    }
  }
  return cells;
}

export function mergeCells(...layers: PixelCell[][]): PixelCell[] {
  const byKey = new Map<string, PixelCell>();
  for (const layer of layers) {
    for (const cell of layer) {
      byKey.set(`${cell.x},${cell.y}`, cell);
    }
  }
  return [...byKey.values()];
}
```

- [ ] **Step 4: Run and verify it passes**

Run: `npm run test -- src/data/pixelShapes.test.ts`
Expected: PASS, 6 tests.

- [ ] **Step 5: Commit**

```bash
git add src/data/pixelShapes.ts src/data/pixelShapes.test.ts
git commit -m "feat: add pixel-shape helpers for procedural sprite data"
```

---

## Task 4: Species data

**Files:**
- Create: `src/data/species.ts`
- Test: `src/data/species.test.ts`

**Interfaces:**
- Consumes: `filledCircle`/`mergeCells` from Task 3, `GRID_SIZE` from `constants.ts`.
- Produces: `SPECIES: Species[]`, `SPECIES_MAP: Record<string, Species>` — used by `state.ts` (Task 6, random pick) and `BootScene.ts` (Task 9, texture building).

- [ ] **Step 1: Write the failing tests**

```ts
// src/data/species.test.ts
import { describe, expect, it } from 'vitest';
import { SPECIES, SPECIES_MAP } from './species';
import { GRID_SIZE } from '../constants';

describe('SPECIES', () => {
  it('defines at least 3 species with unique ids', () => {
    expect(SPECIES.length).toBeGreaterThanOrEqual(3);
    const ids = new Set(SPECIES.map((s) => s.id));
    expect(ids.size).toBe(SPECIES.length);
  });

  it('gives every species a non-empty set of cells within the grid bounds', () => {
    for (const species of SPECIES) {
      expect(species.cells.length).toBeGreaterThan(0);
      for (const cell of species.cells) {
        expect(cell.x).toBeGreaterThanOrEqual(0);
        expect(cell.x).toBeLessThan(GRID_SIZE);
        expect(cell.y).toBeGreaterThanOrEqual(0);
        expect(cell.y).toBeLessThan(GRID_SIZE);
      }
    }
  });

  it('indexes every species by id in SPECIES_MAP', () => {
    for (const species of SPECIES) {
      expect(SPECIES_MAP[species.id]).toBe(species);
    }
  });
});
```

- [ ] **Step 2: Run and verify it fails**

Run: `npm run test -- src/data/species.test.ts`
Expected: FAIL — `species.ts` doesn't exist yet.

- [ ] **Step 3: Write the implementation**

```ts
// src/data/species.ts
import type { Species } from '../types';
import { filledCircle, mergeCells } from './pixelShapes';

const blobbinBody = filledCircle(6, 6.5, 4.5, 2);
const blobbinEyes = [
  { x: 4, y: 5, shade: 3 as const },
  { x: 8, y: 5, shade: 3 as const },
];
const blobbinFeet = [
  { x: 3, y: 11, shade: 2 as const },
  { x: 4, y: 11, shade: 2 as const },
  { x: 7, y: 11, shade: 2 as const },
  { x: 8, y: 11, shade: 2 as const },
];

const nubkinBody = filledCircle(6, 7, 4, 2);
const nubkinHorns = [
  { x: 3, y: 2, shade: 1 as const },
  { x: 4, y: 1, shade: 1 as const },
  { x: 8, y: 1, shade: 1 as const },
  { x: 9, y: 2, shade: 1 as const },
];
const nubkinEyes = [
  { x: 4, y: 6, shade: 3 as const },
  { x: 8, y: 6, shade: 3 as const },
];

const fizzleBody = mergeCells(filledCircle(5, 6, 3.5, 2), filledCircle(9, 6, 2, 2));
const fizzleFin = [
  { x: 4, y: 2, shade: 1 as const },
  { x: 5, y: 1, shade: 1 as const },
  { x: 6, y: 2, shade: 1 as const },
];
const fizzleEyes = [{ x: 4, y: 5, shade: 3 as const }];

export const SPECIES: Species[] = [
  { id: 'blobbin', name: 'Blobbin', cells: mergeCells(blobbinBody, blobbinFeet, blobbinEyes) },
  { id: 'nubkin', name: 'Nubkin', cells: mergeCells(nubkinBody, nubkinHorns, nubkinEyes) },
  { id: 'fizzle', name: 'Fizzle', cells: mergeCells(fizzleBody, fizzleFin, fizzleEyes) },
];

export const SPECIES_MAP: Record<string, Species> = Object.fromEntries(
  SPECIES.map((species) => [species.id, species]),
);
```

- [ ] **Step 4: Run and verify it passes**

Run: `npm run test -- src/data/species.test.ts`
Expected: PASS, 3 tests.

- [ ] **Step 5: Commit**

```bash
git add src/data/species.ts src/data/species.test.ts
git commit -m "feat: add 3-species pixel-art roster"
```

---

## Task 5: Storage

**Files:**
- Create: `src/storage.ts`
- Test: `src/storage.test.ts`

**Interfaces:**
- Consumes: `SaveData` from `types.ts`, `SAVE_VERSION` from `constants.ts`.
- Produces: `loadSave(): SaveData`, `saveSave(data: SaveData): void` — used by `store.ts` (Task 8).

- [ ] **Step 1: Write the failing tests**

```ts
// src/storage.test.ts
import { beforeEach, describe, expect, it } from 'vitest';
import { loadSave, saveSave } from './storage';
import { SAVE_VERSION } from './constants';
import type { SaveData } from './types';

describe('storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns a fresh save with no monster when nothing is stored', () => {
    const save = loadSave();
    expect(save.monster).toBeNull();
    expect(save.version).toBe(SAVE_VERSION);
  });

  it('round-trips a saved monster', () => {
    const data: SaveData = {
      version: SAVE_VERSION,
      monster: {
        speciesId: 'blobbin',
        hunger: 80,
        happiness: 90,
        cleanliness: 70,
        energy: 60,
        bornAt: 1000,
        lastUpdate: 2000,
        criticalSince: null,
      },
      settings: { sound: true, reducedMotion: false },
    };
    saveSave(data);
    expect(loadSave()).toEqual(data);
  });

  it('falls back to a fresh save on a version mismatch', () => {
    localStorage.setItem(
      'sproutlings-save',
      JSON.stringify({ version: SAVE_VERSION - 1, monster: null, settings: {} }),
    );
    expect(loadSave().monster).toBeNull();
    expect(loadSave().version).toBe(SAVE_VERSION);
  });

  it('falls back to a fresh save on corrupt JSON without throwing', () => {
    localStorage.setItem('sproutlings-save', '{not valid json');
    expect(() => loadSave()).not.toThrow();
    expect(loadSave().monster).toBeNull();
  });
});
```

- [ ] **Step 2: Run and verify it fails**

Run: `npm run test -- src/storage.test.ts`
Expected: FAIL — `storage.ts` doesn't exist yet.

- [ ] **Step 3: Write the implementation**

```ts
// src/storage.ts
import type { SaveData } from './types';
import { SAVE_VERSION } from './constants';

const STORAGE_KEY = 'sproutlings-save';

function freshSave(): SaveData {
  return {
    version: SAVE_VERSION,
    monster: null,
    settings: { sound: true, reducedMotion: false },
  };
}

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return freshSave();
    const parsed = JSON.parse(raw) as SaveData;
    if (parsed.version !== SAVE_VERSION) return freshSave();
    return parsed;
  } catch {
    return freshSave();
  }
}

export function saveSave(data: SaveData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // storage unavailable (e.g. private browsing quota) — game continues in-memory
  }
}
```

- [ ] **Step 4: Run and verify it passes**

Run: `npm run test -- src/storage.test.ts`
Expected: PASS, 4 tests.

- [ ] **Step 5: Commit**

```bash
git add src/storage.ts src/storage.test.ts
git commit -m "feat: add versioned localStorage save/load"
```

---

## Task 6: Pure monster state logic

**Files:**
- Create: `src/state.ts`
- Test: `src/state.test.ts`

**Interfaces:**
- Consumes: `Monster`, `Need` from `types.ts`; constants from `constants.ts`; `SPECIES` from `data/species.ts`.
- Produces: `createMonster(now, speciesId?, random?)`, `applyDecay(monster, now)`, `hasRunAway(monster)`, `applyAction(monster, need, now)`, `worstNeed(monster)`, `moodFor(monster)`, `type Mood` — used by `store.ts` (Task 8) and `PetScene.ts` (Task 10).

- [ ] **Step 1: Write the failing tests**

```ts
// src/state.test.ts
import { describe, expect, it } from 'vitest';
import { applyAction, applyDecay, createMonster, hasRunAway, moodFor, worstNeed } from './state';
import { CRITICAL_THRESHOLD, NEED_MAX, OFFLINE_CAP_MS, RUNAWAY_GRACE_MS } from './constants';
import type { Monster } from './types';

const HOUR = 60 * 60 * 1000;

function monsterAt(now: number, overrides: Partial<Monster> = {}): Monster {
  return {
    speciesId: 'blobbin',
    hunger: NEED_MAX,
    happiness: NEED_MAX,
    cleanliness: NEED_MAX,
    energy: NEED_MAX,
    bornAt: now,
    lastUpdate: now,
    criticalSince: null,
    ...overrides,
  };
}

describe('createMonster', () => {
  it('starts every need at maximum', () => {
    const monster = createMonster(0, 'blobbin');
    expect(monster.hunger).toBe(NEED_MAX);
    expect(monster.happiness).toBe(NEED_MAX);
    expect(monster.cleanliness).toBe(NEED_MAX);
    expect(monster.energy).toBe(NEED_MAX);
  });

  it('picks a species deterministically when a random function is given', () => {
    const monster = createMonster(0, undefined, () => 0);
    expect(monster.speciesId).toBe('blobbin');
  });
});

describe('applyDecay', () => {
  it('reduces all needs based on elapsed hours', () => {
    const monster = monsterAt(0);
    const decayed = applyDecay(monster, 2 * HOUR);
    expect(decayed.hunger).toBeLessThan(monster.hunger);
    expect(decayed.happiness).toBeLessThan(monster.happiness);
    expect(decayed.cleanliness).toBeLessThan(monster.cleanliness);
    expect(decayed.energy).toBeLessThan(monster.energy);
  });

  it('never drops a need below zero', () => {
    const monster = monsterAt(0, { hunger: 2 });
    const decayed = applyDecay(monster, HOUR);
    expect(decayed.hunger).toBe(0);
  });

  it('caps the elapsed time used for decay at OFFLINE_CAP_MS', () => {
    const monster = monsterAt(0);
    const cappedResult = applyDecay(monster, OFFLINE_CAP_MS);
    const farFutureResult = applyDecay(monster, OFFLINE_CAP_MS * 100);
    expect(farFutureResult.hunger).toBe(cappedResult.hunger);
  });

  it('advances lastUpdate by the capped elapsed time, not the full gap', () => {
    const monster = monsterAt(0);
    const decayed = applyDecay(monster, OFFLINE_CAP_MS * 100);
    expect(decayed.lastUpdate).toBe(OFFLINE_CAP_MS);
  });

  it('sets criticalSince when a need first drops below the critical threshold', () => {
    const monster = monsterAt(0, { hunger: CRITICAL_THRESHOLD + 1 });
    const decayed = applyDecay(monster, HOUR);
    expect(decayed.criticalSince).not.toBeNull();
  });

  it('clears criticalSince once all needs are back above the critical threshold', () => {
    const monster = monsterAt(0, { hunger: 0, criticalSince: 0 });
    const decayed = applyDecay({ ...monster, hunger: NEED_MAX }, HOUR);
    expect(decayed.criticalSince).toBeNull();
  });
});

describe('hasRunAway', () => {
  it('is false when nothing has gone critical', () => {
    expect(hasRunAway(monsterAt(0))).toBe(false);
  });

  it('is false when critical but within the grace period', () => {
    const monster = monsterAt(RUNAWAY_GRACE_MS - 1, { criticalSince: 0 });
    expect(hasRunAway(monster)).toBe(false);
  });

  it('is true once the grace period has fully elapsed', () => {
    const monster = monsterAt(RUNAWAY_GRACE_MS, { criticalSince: 0 });
    expect(hasRunAway(monster)).toBe(true);
  });
});

describe('applyAction', () => {
  it('restores the targeted need after applying decay', () => {
    const monster = monsterAt(0, { hunger: 50 });
    const result = applyAction(monster, 'hunger', HOUR);
    expect(result.hunger).toBeGreaterThan(50);
  });

  it('does not affect other needs beyond their normal decay', () => {
    const monster = monsterAt(0);
    const decayedOnly = applyDecay(monster, HOUR);
    const result = applyAction(monster, 'hunger', HOUR);
    expect(result.happiness).toBe(decayedOnly.happiness);
  });

  it('never restores a need above NEED_MAX', () => {
    const monster = monsterAt(0, { hunger: NEED_MAX });
    const result = applyAction(monster, 'hunger', 0);
    expect(result.hunger).toBe(NEED_MAX);
  });
});

describe('worstNeed and moodFor', () => {
  it('worstNeed returns the lowest of the four needs', () => {
    const monster = monsterAt(0, { hunger: 40, happiness: 90, cleanliness: 60, energy: 80 });
    expect(worstNeed(monster)).toBe(40);
  });

  it('moodFor is sad when the worst need is below the sad threshold', () => {
    expect(moodFor(monsterAt(0, { hunger: 10 }))).toBe('sad');
  });

  it('moodFor is happy when even the worst need is above the happy threshold', () => {
    expect(moodFor(monsterAt(0))).toBe('happy');
  });

  it('moodFor is content in between', () => {
    expect(moodFor(monsterAt(0, { hunger: 50 }))).toBe('content');
  });
});
```

- [ ] **Step 2: Run and verify it fails**

Run: `npm run test -- src/state.test.ts`
Expected: FAIL — `state.ts` doesn't exist yet.

- [ ] **Step 3: Write the implementation**

```ts
// src/state.ts
import type { Monster, Need } from './types';
import {
  NEED_MAX,
  NEED_START,
  DECAY_PER_HOUR,
  CRITICAL_THRESHOLD,
  SAD_THRESHOLD,
  HAPPY_THRESHOLD,
  RUNAWAY_GRACE_MS,
  OFFLINE_CAP_MS,
  ACTION_RESTORE_AMOUNT,
} from './constants';
import { SPECIES } from './data/species';

export type Mood = 'sad' | 'content' | 'happy';

function clamp(value: number): number {
  return Math.max(0, Math.min(NEED_MAX, value));
}

export function createMonster(now: number, speciesId?: string, random: () => number = Math.random): Monster {
  const id = speciesId ?? SPECIES[Math.floor(random() * SPECIES.length)].id;
  return {
    speciesId: id,
    hunger: NEED_START,
    happiness: NEED_START,
    cleanliness: NEED_START,
    energy: NEED_START,
    bornAt: now,
    lastUpdate: now,
    criticalSince: null,
  };
}

export function applyDecay(monster: Monster, now: number): Monster {
  const elapsedMs = Math.min(Math.max(now - monster.lastUpdate, 0), OFFLINE_CAP_MS);
  if (elapsedMs === 0) return monster;

  const effectiveNow = monster.lastUpdate + elapsedMs;
  const drop = (elapsedMs / (60 * 60 * 1000)) * DECAY_PER_HOUR;

  const hunger = clamp(monster.hunger - drop);
  const happiness = clamp(monster.happiness - drop);
  const cleanliness = clamp(monster.cleanliness - drop);
  const energy = clamp(monster.energy - drop);
  const anyCritical = [hunger, happiness, cleanliness, energy].some((need) => need < CRITICAL_THRESHOLD);

  return {
    ...monster,
    hunger,
    happiness,
    cleanliness,
    energy,
    lastUpdate: effectiveNow,
    criticalSince: anyCritical ? (monster.criticalSince ?? effectiveNow) : null,
  };
}

export function hasRunAway(monster: Monster): boolean {
  if (monster.criticalSince === null) return false;
  return monster.lastUpdate - monster.criticalSince >= RUNAWAY_GRACE_MS;
}

export function applyAction(monster: Monster, need: Need, now: number): Monster {
  const decayed = applyDecay(monster, now);
  return { ...decayed, [need]: clamp(decayed[need] + ACTION_RESTORE_AMOUNT) };
}

export function worstNeed(monster: Monster): number {
  return Math.min(monster.hunger, monster.happiness, monster.cleanliness, monster.energy);
}

export function moodFor(monster: Monster): Mood {
  const worst = worstNeed(monster);
  if (worst < SAD_THRESHOLD) return 'sad';
  if (worst > HAPPY_THRESHOLD) return 'happy';
  return 'content';
}
```

- [ ] **Step 4: Run and verify it passes**

Run: `npm run test -- src/state.test.ts`
Expected: PASS, 15 tests.

- [ ] **Step 5: Commit**

```bash
git add src/state.ts src/state.test.ts
git commit -m "feat: add pure monster need-decay, action, and run-away logic"
```

---

## Task 7: Canvas draw helper

**Files:**
- Create: `src/render/drawCells.ts`
- Test: `src/render/drawCells.test.ts`

**Interfaces:**
- Consumes: `PixelCell` from `types.ts`.
- Produces: `drawCellsToContext(ctx, cells, scale, palette): void` — used by `BootScene.ts` (Task 9).

- [ ] **Step 1: Write the failing tests**

```ts
// src/render/drawCells.test.ts
import { describe, expect, it } from 'vitest';
import { drawCellsToContext } from './drawCells';

function createFakeContext() {
  const calls: { style: string; x: number; y: number; w: number; h: number }[] = [];
  const ctx = {
    fillStyle: '',
    fillRect(x: number, y: number, w: number, h: number) {
      calls.push({ style: ctx.fillStyle, x, y, w, h });
    },
  } as unknown as CanvasRenderingContext2D;
  return { ctx, calls };
}

describe('drawCellsToContext', () => {
  it('draws each cell scaled and colored from the palette', () => {
    const { ctx, calls } = createFakeContext();
    const palette = ['#000', '#111', '#222', '#333'] as const;
    drawCellsToContext(ctx, [{ x: 1, y: 2, shade: 2 }], 4, palette);
    expect(calls).toEqual([{ style: '#222', x: 4, y: 8, w: 4, h: 4 }]);
  });

  it('draws nothing for an empty cell list', () => {
    const { ctx, calls } = createFakeContext();
    drawCellsToContext(ctx, [], 4, ['#000', '#111', '#222', '#333']);
    expect(calls).toEqual([]);
  });
});
```

- [ ] **Step 2: Run and verify it fails**

Run: `npm run test -- src/render/drawCells.test.ts`
Expected: FAIL — `drawCells.ts` doesn't exist yet.

- [ ] **Step 3: Write the implementation**

```ts
// src/render/drawCells.ts
import type { PixelCell } from '../types';

export function drawCellsToContext(
  ctx: CanvasRenderingContext2D,
  cells: PixelCell[],
  scale: number,
  palette: readonly string[],
): void {
  for (const cell of cells) {
    ctx.fillStyle = palette[cell.shade];
    ctx.fillRect(cell.x * scale, cell.y * scale, scale, scale);
  }
}
```

- [ ] **Step 4: Run and verify it passes**

Run: `npm run test -- src/render/drawCells.test.ts`
Expected: PASS, 2 tests.

- [ ] **Step 5: Commit**

```bash
git add src/render/drawCells.ts src/render/drawCells.test.ts
git commit -m "feat: add pure pixel-cell-to-canvas draw helper"
```

---

## Task 8: Event bus + store

**Files:**
- Create: `src/bus.ts`, `src/store.ts`
- Test: `src/bus.test.ts`, `src/store.test.ts`

**Interfaces:**
- Consumes: `loadSave`/`saveSave` (Task 5), `applyAction`/`applyDecay`/`createMonster`/`hasRunAway` (Task 6).
- Produces: `bus: { on, off, emit }`, `EVENTS.{MONSTER_UPDATED,ACTION,RUN_AWAY}`, and `store.{getMonster, getSettings, tick, performAction, hatchNewMonster, start, stop}` — used by every scene (Tasks 9-11), `controls.ts` (Task 13), `audio/synth.ts` (Task 14), and `main.ts` (Task 15).

Deliberately does **not** import the `phaser` package, so this layer stays fast and trivial to unit test.

- [ ] **Step 1: Write the failing bus test**

```ts
// src/bus.test.ts
import { describe, expect, it, vi } from 'vitest';
import { bus, EVENTS } from './bus';

describe('bus', () => {
  it('calls a registered listener when the event is emitted', () => {
    const listener = vi.fn();
    bus.on(EVENTS.ACTION, listener);
    bus.emit(EVENTS.ACTION, 'hunger');
    expect(listener).toHaveBeenCalledWith('hunger');
    bus.off(EVENTS.ACTION, listener);
  });

  it('stops calling a listener after off()', () => {
    const listener = vi.fn();
    bus.on(EVENTS.RUN_AWAY, listener);
    bus.off(EVENTS.RUN_AWAY, listener);
    bus.emit(EVENTS.RUN_AWAY);
    expect(listener).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run and verify it fails**

Run: `npm run test -- src/bus.test.ts`
Expected: FAIL — `bus.ts` doesn't exist yet.

- [ ] **Step 3: Write `src/bus.ts`**

```ts
// src/bus.ts
type Listener<T> = (payload: T) => void;

class EventBus {
  private listeners = new Map<string, Set<Listener<unknown>>>();

  on<T>(event: string, listener: Listener<T>): void {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(listener as Listener<unknown>);
  }

  off<T>(event: string, listener: Listener<T>): void {
    this.listeners.get(event)?.delete(listener as Listener<unknown>);
  }

  emit<T>(event: string, payload?: T): void {
    this.listeners.get(event)?.forEach((listener) => listener(payload as unknown));
  }
}

export const bus = new EventBus();

export const EVENTS = {
  MONSTER_UPDATED: 'monster-updated',
  ACTION: 'action',
  RUN_AWAY: 'run-away',
} as const;
```

- [ ] **Step 4: Run and verify the bus test passes**

Run: `npm run test -- src/bus.test.ts`
Expected: PASS, 2 tests.

- [ ] **Step 5: Write the failing store tests**

```ts
// src/store.test.ts
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NEED_MAX } from './constants';

async function freshStore() {
  vi.resetModules();
  return import('./store');
}

describe('store', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('has no monster before hatching', async () => {
    const store = await freshStore();
    expect(store.getMonster()).toBeNull();
  });

  it('hatchNewMonster creates and persists a monster', async () => {
    const store = await freshStore();
    store.hatchNewMonster();
    expect(store.getMonster()).not.toBeNull();
    expect(store.getMonster()?.hunger).toBe(NEED_MAX);

    const speciesId = store.getMonster()?.speciesId;
    vi.resetModules();
    const reloaded = await import('./store');
    expect(reloaded.getMonster()?.speciesId).toBe(speciesId);
  });

  it('performAction restores the targeted need', async () => {
    const store = await freshStore();
    store.hatchNewMonster();
    store.performAction('hunger');
    expect(store.getMonster()!.hunger).toBe(NEED_MAX);
  });

  it('emits monster-updated on hatch and on action', async () => {
    const store = await freshStore();
    const { bus, EVENTS } = await import('./bus');
    const seen: unknown[] = [];
    bus.on(EVENTS.MONSTER_UPDATED, (monster: unknown) => seen.push(monster));
    store.hatchNewMonster();
    store.performAction('hunger');
    expect(seen).toHaveLength(2);
  });

  it('tick with no monster does nothing and does not throw', async () => {
    const store = await freshStore();
    expect(() => store.tick()).not.toThrow();
    expect(store.getMonster()).toBeNull();
  });
});
```

- [ ] **Step 6: Run and verify it fails**

Run: `npm run test -- src/store.test.ts`
Expected: FAIL — `store.ts` doesn't exist yet.

- [ ] **Step 7: Write `src/store.ts`**

```ts
// src/store.ts
import type { Monster, Need, SaveData } from './types';
import { loadSave, saveSave } from './storage';
import { applyAction, applyDecay, createMonster, hasRunAway } from './state';
import { bus, EVENTS } from './bus';
import { TICK_INTERVAL_MS } from './constants';

let save: SaveData = loadSave();
let timer: ReturnType<typeof setInterval> | null = null;

function persist(): void {
  saveSave(save);
}

export function getMonster(): Monster | null {
  return save.monster;
}

export function getSettings(): SaveData['settings'] {
  return save.settings;
}

export function tick(now: number = Date.now()): void {
  if (!save.monster) return;
  const decayed = applyDecay(save.monster, now);
  if (hasRunAway(decayed)) {
    save = { ...save, monster: null };
    persist();
    bus.emit(EVENTS.RUN_AWAY);
    bus.emit(EVENTS.MONSTER_UPDATED, null);
    return;
  }
  save = { ...save, monster: decayed };
  persist();
  bus.emit(EVENTS.MONSTER_UPDATED, decayed);
}

export function performAction(need: Need): void {
  if (!save.monster) return;
  const monster = applyAction(save.monster, need, Date.now());
  save = { ...save, monster };
  persist();
  bus.emit(EVENTS.MONSTER_UPDATED, monster);
  bus.emit(EVENTS.ACTION, need);
}

export function hatchNewMonster(): void {
  const monster = createMonster(Date.now());
  save = { ...save, monster };
  persist();
  bus.emit(EVENTS.MONSTER_UPDATED, monster);
}

export function start(): void {
  tick();
  if (timer) return;
  timer = setInterval(() => tick(), TICK_INTERVAL_MS);
}

export function stop(): void {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}
```

- [ ] **Step 8: Run and verify the store tests pass**

Run: `npm run test -- src/store.test.ts`
Expected: PASS, 5 tests.

- [ ] **Step 9: Commit**

```bash
git add src/bus.ts src/bus.test.ts src/store.ts src/store.test.ts
git commit -m "feat: add event bus and mutable save store"
```

---

## Task 9: BootScene

**Files:**
- Create: `src/scenes/BootScene.ts`

**Interfaces:**
- Consumes: `SPECIES` (Task 4), `drawCellsToContext` (Task 7), `GRID_SIZE`/`PIXEL_SCALE`/`PALETTE` (Task 2), `store.getMonster()` (Task 8).
- Produces: a Phaser texture per species id, keyed by `species.id`; starts scene `'Pet'` or `'Hatch'` depending on save state. Used by `main.ts` (Task 15) as the first scene in the game config.

No automated test — this is Phaser scene wiring over already-tested pure helpers. Verified manually once `main.ts` exists (Task 15).

- [ ] **Step 1: Write `src/scenes/BootScene.ts`**

```ts
// src/scenes/BootScene.ts
import Phaser from 'phaser';
import { SPECIES } from '../data/species';
import { drawCellsToContext } from '../render/drawCells';
import { GRID_SIZE, PIXEL_SCALE, PALETTE } from '../constants';
import * as store from '../store';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create(): void {
    const size = GRID_SIZE * PIXEL_SCALE;
    for (const species of SPECIES) {
      const texture = this.textures.createCanvas(species.id, size, size);
      const ctx = texture?.getContext();
      if (!texture || !ctx) continue;
      drawCellsToContext(ctx, species.cells, PIXEL_SCALE, PALETTE);
      texture.refresh();
    }
    this.scene.start(store.getMonster() ? 'Pet' : 'Hatch');
  }
}
```

- [ ] **Step 2: Verify the project still builds and lints**

Run: `npm run build && npm run lint`
Expected: both succeed (scene isn't registered in a `Phaser.Game` yet — that's Task 15 — so this only needs to typecheck and lint clean).

- [ ] **Step 3: Commit**

```bash
git add src/scenes/BootScene.ts
git commit -m "feat: add BootScene building species textures from pixel data"
```

---

## Task 10: PetScene

**Files:**
- Create: `src/scenes/PetScene.ts`

**Interfaces:**
- Consumes: `bus`/`EVENTS` (Task 8), `store.getMonster()` (Task 8), `moodFor` (Task 6).
- Produces: the `'Pet'` scene — renders the monster sprite, idle/mood animation, dot-matrix grid, glow FX, and a bounce reaction on any action. Used by `main.ts` (Task 15).

No automated test — Phaser rendering/tweening is verified manually (Task 15's full playthrough).

- [ ] **Step 1: Write `src/scenes/PetScene.ts`**

```ts
// src/scenes/PetScene.ts
import Phaser from 'phaser';
import { bus, EVENTS } from '../bus';
import * as store from '../store';
import { moodFor } from '../state';
import type { Monster, Need } from '../types';

export class PetScene extends Phaser.Scene {
  private sprite?: Phaser.GameObjects.Image;
  private idleTween?: Phaser.Tweens.Tween;

  constructor() {
    super('Pet');
  }

  create(): void {
    const monster = store.getMonster();
    if (!monster) {
      this.scene.start('Hatch');
      return;
    }

    this.cameras.main.setBackgroundColor('#9bbc0f');
    this.drawGrid();

    this.sprite = this.add.image(80, 80, monster.speciesId).setOrigin(0.5);
    this.sprite.postFX?.addGlow(0x0f380f, 1, 0, false, 0.1, 6);
    this.startIdleTween(monster);

    bus.on(EVENTS.MONSTER_UPDATED, this.onMonsterUpdated, this);
    bus.on(EVENTS.ACTION, this.onAction, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      bus.off(EVENTS.MONSTER_UPDATED, this.onMonsterUpdated, this);
      bus.off(EVENTS.ACTION, this.onAction, this);
    });
  }

  private onMonsterUpdated(monster: Monster | null): void {
    if (!monster) {
      this.scene.start('Hatch');
      return;
    }
    if (this.sprite && this.sprite.texture.key !== monster.speciesId) {
      this.sprite.setTexture(monster.speciesId);
    }
    this.startIdleTween(monster);
  }

  private onAction(_need: Need): void {
    if (!this.sprite) return;
    this.tweens.add({
      targets: this.sprite,
      scale: { from: 1.15, to: 1 },
      duration: 200,
      ease: 'Bounce.Out',
    });
  }

  private startIdleTween(monster: Monster): void {
    if (!this.sprite) return;
    this.idleTween?.stop();
    const mood = moodFor(monster);
    const bounce = mood === 'happy' ? 6 : mood === 'sad' ? 1 : 3;
    const duration = mood === 'sad' ? 1400 : 700;
    this.idleTween = this.tweens.add({
      targets: this.sprite,
      y: this.sprite.y - bounce,
      duration,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private drawGrid(): void {
    const graphics = this.add.graphics();
    graphics.lineStyle(1, 0x8bac0f, 0.4);
    for (let x = 0; x <= 160; x += 4) {
      graphics.lineBetween(x, 0, x, 144);
    }
    for (let y = 0; y <= 144; y += 4) {
      graphics.lineBetween(0, y, 160, y);
    }
  }
}
```

- [ ] **Step 2: Verify the project still builds and lints**

Run: `npm run build && npm run lint`
Expected: both succeed.

- [ ] **Step 3: Commit**

```bash
git add src/scenes/PetScene.ts
git commit -m "feat: add PetScene with mood-driven idle animation and dot-matrix grid"
```

---

## Task 11: HatchScene

**Files:**
- Create: `src/scenes/HatchScene.ts`

**Interfaces:**
- Consumes: `store.hatchNewMonster()` (Task 8).
- Produces: the `'Hatch'` scene — tap-the-egg screen shown whenever there's no monster (first run or after a run-away). Used by `main.ts` (Task 15).

No automated test — manual verification in Task 15.

- [ ] **Step 1: Write `src/scenes/HatchScene.ts`**

```ts
// src/scenes/HatchScene.ts
import Phaser from 'phaser';
import * as store from '../store';

export class HatchScene extends Phaser.Scene {
  constructor() {
    super('Hatch');
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#9bbc0f');
    const egg = this.add.text(80, 60, '\u{1F95A}', { fontSize: '48px' }).setOrigin(0.5);
    const label = this.add
      .text(80, 110, 'Tap the egg', { fontSize: '14px', color: '#0f380f' })
      .setOrigin(0.5);

    egg.setInteractive({ useHandCursor: true });
    egg.on('pointerdown', () => {
      store.hatchNewMonster();
      label.setText('Hatching...');
      this.tweens.add({
        targets: egg,
        scale: 1.4,
        duration: 300,
        yoyo: true,
        onComplete: () => this.scene.start('Pet'),
      });
    });
  }
}
```

- [ ] **Step 2: Verify the project still builds and lints**

Run: `npm run build && npm run lint`
Expected: both succeed.

- [ ] **Step 3: Commit**

```bash
git add src/scenes/HatchScene.ts
git commit -m "feat: add HatchScene tap-the-egg flow"
```

---

## Task 12: DOM shell — index.html, style.css, manifest, service worker, icon

**Files:**
- Modify: `index.html`, `public/manifest.json`, `public/sw.js`, `public/icon.svg`
- Create: `src/style.css`

**Interfaces:**
- Produces: the DOM structure `controls.ts` (Task 13) attaches to — `#game`, `#needs`, `#buttons`, `#fill-{need}`, `button[data-action]`.

No automated test — visual/manual verification in Task 15.

- [ ] **Step 1: Replace `index.html`**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#306230" />
    <link rel="manifest" href="/manifest.json" />
    <title>Sproutlings</title>
  </head>
  <body>
    <div class="device">
      <div id="game"></div>
      <div class="needs" id="needs" hidden>
        <div class="need"><span class="need-icon" aria-hidden="true">🍎</span><div class="need-bar"><div class="need-fill" id="fill-hunger"></div></div></div>
        <div class="need"><span class="need-icon" aria-hidden="true">😊</span><div class="need-bar"><div class="need-fill" id="fill-happiness"></div></div></div>
        <div class="need"><span class="need-icon" aria-hidden="true">🧼</span><div class="need-bar"><div class="need-fill" id="fill-cleanliness"></div></div></div>
        <div class="need"><span class="need-icon" aria-hidden="true">⚡</span><div class="need-bar"><div class="need-fill" id="fill-energy"></div></div></div>
      </div>
      <div class="buttons" id="buttons" hidden>
        <button type="button" data-action="hunger">Feed</button>
        <button type="button" data-action="happiness">Play</button>
        <button type="button" data-action="cleanliness">Clean</button>
        <button type="button" data-action="energy">Sleep</button>
      </div>
    </div>
    <script type="module" src="/src/main.ts"></script>
    <script>
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}
</script>
  </body>
</html>
```

- [ ] **Step 2: Write `src/style.css`**

```css
:root {
  color-scheme: light;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #1b1b1b;
  font-family: system-ui, sans-serif;
}

.device {
  width: min(92vw, 360px);
  padding: 24px 20px 32px;
  border-radius: 28px;
  background: #4a4a52;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);
}

#game {
  width: 100%;
  aspect-ratio: 160 / 144;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: inset 0 0 0 6px #0f380f;
}

#game canvas {
  width: 100% !important;
  height: 100% !important;
  image-rendering: pixelated;
  display: block;
}

.needs {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-top: 18px;
}

.needs[hidden],
.buttons[hidden] {
  display: none;
}

.need {
  display: flex;
  align-items: center;
  gap: 6px;
}

.need-icon {
  font-size: 16px;
}

.need-bar {
  flex: 1;
  height: 10px;
  border-radius: 5px;
  background: #0f380f;
  overflow: hidden;
}

.need-fill {
  height: 100%;
  background: #9bbc0f;
  transition: width 0.3s ease;
  width: 100%;
}

.buttons {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-top: 16px;
}

.buttons button {
  min-height: 48px;
  border-radius: 10px;
  border: none;
  background: #8bac0f;
  color: #0f380f;
  font-weight: 700;
  font-size: 15px;
  cursor: pointer;
}

.buttons button:focus-visible {
  outline: 3px solid #ffffff;
  outline-offset: 2px;
}

.buttons button:active {
  background: #306230;
  color: #9bbc0f;
}

@media (prefers-reduced-motion: reduce) {
  .need-fill {
    transition: none;
  }
}
```

- [ ] **Step 3: Update `public/manifest.json`**

```json
{
  "name": "Sproutlings",
  "short_name": "Sproutlings",
  "description": "A pocket monster that needs feeding, playing, cleaning, and sleep — Game Boy style.",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#9bbc0f",
  "theme_color": "#306230",
  "icons": [
    { "src": "/icon.svg", "sizes": "any", "type": "image/svg+xml", "purpose": "any" }
  ]
}
```

- [ ] **Step 4: Replace `public/icon.svg`**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="14" fill="#0f380f"/>
  <rect x="6" y="6" width="52" height="52" rx="10" fill="#9bbc0f"/>
  <circle cx="32" cy="34" r="16" fill="#306230"/>
  <circle cx="26" cy="30" r="3" fill="#0f380f"/>
  <circle cx="38" cy="30" r="3" fill="#0f380f"/>
</svg>
```

- [ ] **Step 5: Bump the service worker cache name in `public/sw.js`**

Change the first line from `const CACHE = 'monster-collector-v2';` to:

```js
const CACHE = 'sproutlings-gb-v1';
```

- [ ] **Step 6: Verify the project still builds and lints**

Run: `npm run build && npm run lint`
Expected: both succeed.

- [ ] **Step 7: Commit**

```bash
git add index.html src/style.css public/manifest.json public/icon.svg public/sw.js
git commit -m "feat: add Game Boy bezel DOM shell, need bars, and PWA assets"
```

---

## Task 13: DOM controls

**Files:**
- Create: `src/ui/controls.ts`
- Test: `src/ui/controls.test.ts`

**Interfaces:**
- Consumes: `bus`/`EVENTS` (Task 8), `store.getMonster`/`store.performAction` (Task 8), `NEED_MAX` (Task 2), the DOM structure from Task 12.
- Produces: `initControls(): void`, `needPercent(value: number): number` — used by `main.ts` (Task 15).

- [ ] **Step 1: Write the failing tests**

```ts
// src/ui/controls.test.ts
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { needPercent } from './controls';

describe('needPercent', () => {
  it('converts a raw need value to a rounded percentage', () => {
    expect(needPercent(50)).toBe(50);
    expect(needPercent(33)).toBe(33);
    expect(needPercent(100)).toBe(100);
    expect(needPercent(0)).toBe(0);
  });
});

describe('initControls', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="needs">
        <div class="need-fill" id="fill-hunger"></div>
        <div class="need-fill" id="fill-happiness"></div>
        <div class="need-fill" id="fill-cleanliness"></div>
        <div class="need-fill" id="fill-energy"></div>
      </div>
      <div id="buttons">
        <button data-action="hunger"></button>
      </div>
    `;
    vi.resetModules();
  });

  it('calls store.performAction with the button need on click', async () => {
    vi.doMock('../store', () => ({
      getMonster: () => null,
      performAction: vi.fn(),
    }));
    const store = await import('../store');
    const { initControls } = await import('./controls');
    initControls();

    document.querySelector<HTMLButtonElement>('button[data-action="hunger"]')?.click();
    expect(store.performAction).toHaveBeenCalledWith('hunger');
  });

  it('fills need bars to match the monster state on monster-updated', async () => {
    vi.doMock('../store', () => ({
      getMonster: () => null,
      performAction: vi.fn(),
    }));
    const { initControls } = await import('./controls');
    const { bus, EVENTS } = await import('../bus');
    initControls();

    bus.emit(EVENTS.MONSTER_UPDATED, {
      speciesId: 'blobbin',
      hunger: 50,
      happiness: 100,
      cleanliness: 25,
      energy: 75,
      bornAt: 0,
      lastUpdate: 0,
      criticalSince: null,
    });

    expect(document.getElementById('fill-hunger')?.style.width).toBe('50%');
    expect(document.getElementById('fill-cleanliness')?.style.width).toBe('25%');
  });
});
```

- [ ] **Step 2: Run and verify it fails**

Run: `npm run test -- src/ui/controls.test.ts`
Expected: FAIL — `controls.ts` doesn't exist yet.

- [ ] **Step 3: Write the implementation**

```ts
// src/ui/controls.ts
import { bus, EVENTS } from '../bus';
import * as store from '../store';
import type { Monster, Need } from '../types';
import { NEED_MAX } from '../constants';

const NEEDS: Need[] = ['hunger', 'happiness', 'cleanliness', 'energy'];

export function needPercent(value: number): number {
  return Math.round((value / NEED_MAX) * 100);
}

export function initControls(): void {
  const buttons = document.getElementById('buttons');
  const needsPanel = document.getElementById('needs');

  buttons?.querySelectorAll<HTMLButtonElement>('button[data-action]').forEach((button) => {
    button.addEventListener('click', () => {
      const need = button.dataset.action as Need;
      store.performAction(need);
    });
  });

  function render(monster: Monster | null): void {
    const visible = monster !== null;
    if (buttons) buttons.hidden = !visible;
    if (needsPanel) needsPanel.hidden = !visible;
    if (!monster) return;

    for (const need of NEEDS) {
      const fill = document.getElementById(`fill-${need}`);
      if (fill) fill.style.width = `${needPercent(monster[need])}%`;
    }
  }

  bus.on(EVENTS.MONSTER_UPDATED, render);
  render(store.getMonster());
}
```

- [ ] **Step 4: Run and verify it passes**

Run: `npm run test -- src/ui/controls.test.ts`
Expected: PASS, 3 tests.

- [ ] **Step 5: Commit**

```bash
git add src/ui/controls.ts src/ui/controls.test.ts
git commit -m "feat: wire DOM buttons and need bars to the store"
```

---

## Task 14: Audio synth

**Files:**
- Create: `src/audio/synth.ts`

**Interfaces:**
- Consumes: `getSettings` (Task 8), `bus`/`EVENTS` (Task 8), `Need` (Task 2).
- Produces: `initAudio(): void`, `stopAudio(): void`, `playBlip(need)`, `playRunAway()` — used by `main.ts` (Task 15).

No automated test — the Web Audio API isn't available in the jsdom test environment; this is verified by ear once wired into `main.ts` (Task 15).

- [ ] **Step 1: Write `src/audio/synth.ts`**

```ts
// src/audio/synth.ts
import { getSettings } from '../store';
import { bus, EVENTS } from '../bus';
import type { Need } from '../types';

let audioCtx: AudioContext | null = null;
let loopTimer: ReturnType<typeof setInterval> | null = null;

const BLIP_FREQUENCIES: Record<Need, number> = {
  hunger: 392,
  happiness: 523,
  cleanliness: 659,
  energy: 330,
};

const LOOP_NOTES = [392, 440, 523, 440];

function ensureContext(): AudioContext | null {
  if (!getSettings().sound) return null;
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

export function playBlip(need: Need): void {
  const ctx = ensureContext();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'square';
  osc.frequency.value = BLIP_FREQUENCIES[need];
  gain.gain.setValueAtTime(0.15, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.2);
  osc.connect(gain).connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.2);
}

export function playRunAway(): void {
  const ctx = ensureContext();
  if (!ctx) return;
  [523, 440, 349, 262].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.value = freq;
    const startTime = ctx.currentTime + i * 0.15;
    gain.gain.setValueAtTime(0.15, startTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.14);
    osc.connect(gain).connect(ctx.destination);
    osc.start(startTime);
    osc.stop(startTime + 0.15);
  });
}

function playLoopStep(index: number): void {
  const ctx = ensureContext();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.value = LOOP_NOTES[index % LOOP_NOTES.length];
  gain.gain.setValueAtTime(0.05, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
  osc.connect(gain).connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.4);
}

export function initAudio(): void {
  bus.on(EVENTS.ACTION, (need: Need) => playBlip(need));
  bus.on(EVENTS.RUN_AWAY, () => playRunAway());
  let step = 0;
  loopTimer = setInterval(() => {
    playLoopStep(step);
    step += 1;
  }, 500);
}

export function stopAudio(): void {
  if (loopTimer) {
    clearInterval(loopTimer);
    loopTimer = null;
  }
}
```

- [ ] **Step 2: Verify the project still builds, lints, and tests**

Run: `npm run build && npm run lint && npm run test`
Expected: all succeed (no new test files; existing suites still pass).

- [ ] **Step 3: Commit**

```bash
git add src/audio/synth.ts
git commit -m "feat: add Web Audio synth for blips and background loop"
```

---

## Task 15: Wire it all together in main.ts

**Files:**
- Modify: `src/main.ts` (replacing the Task 1 stub)

**Interfaces:**
- Consumes: everything from Tasks 8-14.
- Produces: the running game.

- [ ] **Step 1: Replace `src/main.ts`**

```ts
// src/main.ts
import Phaser from 'phaser';
import './style.css';
import { BootScene } from './scenes/BootScene';
import { PetScene } from './scenes/PetScene';
import { HatchScene } from './scenes/HatchScene';
import { initControls } from './ui/controls';
import { initAudio } from './audio/synth';
import * as store from './store';

const GAME_WIDTH = 160;
const GAME_HEIGHT = 144;

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  pixelArt: true,
  backgroundColor: '#9bbc0f',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene, PetScene, HatchScene],
});

initControls();
initAudio();
store.start();
```

- [ ] **Step 2: Run the full check suite**

Run: `npm run build && npm run lint && npm run test`
Expected: all succeed.

- [ ] **Step 3: Manually verify the full playthrough**

Run: `npm run dev`, open the printed local URL in a browser, and confirm:
- The Game Boy bezel renders with a canvas inside it, need bars and buttons start hidden.
- Tapping the egg hatches a monster: buttons and need bars appear, a blip plays.
- Feed/Play/Clean/Sleep each nudge their bar up, trigger a bounce animation, and play a distinct blip.
- The background chiptune loop is audible.
- Reload the page: the same monster persists (localStorage round-trip).
- In devtools, manually set a need very low and advance the system clock (or temporarily lower `RUNAWAY_GRACE_MS` in `constants.ts` for the check, then revert) to confirm run-away returns to the hatch screen.

- [ ] **Step 4: Commit**

```bash
git add src/main.ts
git commit -m "feat: wire Phaser game, controls, audio, and store together"
```

---

## Task 16: Update project docs + final CI verification

**Files:**
- Modify: `CLAUDE.md`, `AGENTS.md`, `README.md`

**Interfaces:**
- None — documentation only.

- [ ] **Step 1: Replace `README.md`**

```markdown
# Sproutlings

A cozy, kid-friendly Game Boy-style Tamagotchi. Hatch a little monster and keep it fed, happy, clean, and rested — in real time, even while you're away.

Built for a self-hosted personal website — fully static, no backend, no ads, no tracking.

## Stack

- **Build:** Vite + TypeScript (no UI framework)
- **Rendering:** Phaser 4
- **State:** a single store, autosaves to localStorage
- **Styling:** Plain CSS (phone-first, ~360px responsive)
- **Art:** Procedural pixel sprites, 4-shade Game Boy green palette (no raster assets)
- **Audio:** Synthesized chiptune via Web Audio (no audio files)

## Quick start

```bash
npm install
npm run dev     # dev server at localhost:5173
npm run build   # production build to dist/
```

Production output is a `dist/` folder of static assets — serve with any static file host.

## How to play

1. **Tap the egg** to hatch a monster (randomly picked from a small roster)
2. **Feed / Play / Clean / Sleep** to keep its four needs up
3. Needs drop over real time, even while the app is closed
4. Neglect a need for too long and the monster **runs away** — tap a new egg and start again

## Design

Spec: [`docs/superpowers/specs/2026-07-28-gameboy-tamagotchi-pivot-design.md`](docs/superpowers/specs/2026-07-28-gameboy-tamagotchi-pivot-design.md)

- All tuning values live in `src/constants.ts` — balancing is a one-file change
- Species are pixel-coordinate data in `src/data/species.ts` — no art files
- Fully offline, COPPA-safe by construction (no external calls, no accounts)

## License

GPL-3.0
```

- [ ] **Step 2: Replace `CLAUDE.md`**

```markdown
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Sproutlings is a cozy, kid-friendly Game Boy-style Tamagotchi: hatch a small monster from an egg, then keep it fed, happy, clean, and rested in real time. Needs decay on real wall-clock time (even while the app is closed); persistent neglect makes the monster run away, sending you back to a fresh egg — never a death screen. It ships as static files to a self-hosted server with **no backend and no external network calls of any kind** (COPPA-safe by construction).

This is the third iteration of this repo: an idle plant/hatch game, then a Pokémon-style battle/collector ("Monster Collector"), and now this single-pet care game. See `docs/superpowers/specs/2026-07-28-gameboy-tamagotchi-pivot-design.md` for the pivot rationale; earlier specs (`docs/pivot-design.md`, `docs/superpowers/specs/2026-07-23-monster-development-redesign-design.md`, `docs/sproutlings-spec.md`) describe prior, now-superseded designs and are kept for history only.

## Commands

- `npm run dev` — start the Vite dev server
- `npm run build` — type-check (`tsc -b`) then build static assets to `dist/`
- `npm run preview` — serve the production build locally
- `npm run lint` — run oxlint
- `npm run test` — run vitest

## Architecture

**No UI framework.** The app is plain TypeScript + Phaser 4, bootstrapped from `src/main.ts`. There is no React, no Zustand, no JSX.

**Pure logic is framework-free.** `src/state.ts` (need decay, actions, run-away) and `src/data/pixelShapes.ts`/`src/data/species.ts` (procedural sprite data) have zero imports from Phaser or the DOM — they're plain functions over plain data, fully unit-testable with vitest alone.

**`src/store.ts` is the single mutable source of truth.** It owns the current `SaveData` (loaded via `src/storage.ts` at import time), applies the pure `state.ts` functions, persists after every change, and publishes changes on `src/bus.ts` (a minimal framework-free event emitter — deliberately not Phaser's, so `store.ts`/`bus.ts` stay testable without importing the Phaser package). `src/ui/controls.ts` and the Phaser scenes both subscribe to the bus rather than talking to each other directly.

**`storage.ts` is the only module allowed to touch `localStorage`.** It checks `SaveData.version` against `SAVE_VERSION` on load and falls back to a fresh save (`monster: null`) on any parse error or version mismatch — it never throws.

**`constants.ts` is the single source of truth for tuning**: need decay rate, run-away thresholds/grace period, offline decay cap, action restore amounts, and the fixed 4-shade Game Boy palette.

**Controls are real DOM, not Phaser game objects.** Feed/Play/Clean/Sleep are `<button>` elements in `index.html`, styled around the Phaser canvas — this keeps keyboard focus and tap targets accessible without needing a UI framework.

**Art and audio are 100% procedural — no asset files, no attribution needed.** Monster sprites are built from small pixel-coordinate lists (`src/data/species.ts`) drawn onto a canvas texture at boot (`src/scenes/BootScene.ts`); the four palette shades are the real DMG Game Boy green ramp. Music/SFX are synthesized at runtime via the Web Audio API (`src/audio/synth.ts`) — no external audio files.

## Design constraints that shape implementation choices

- **Single pet, real wall-clock decay, no permanent death.** Needs (hunger/happiness/cleanliness/energy) drop based on elapsed real time, capped (`OFFLINE_CAP_MS`) so a long absence can't devastate the monster in one reload. Sustained neglect triggers a "run away" — a soft reset to a fresh egg, never a death/game-over screen.
- **Species are procedural pixel data, not hand-painted art files.** A species is a list of `{x, y, shade}` cells on a fixed grid (`GRID_SIZE`), composed from small reusable shape helpers (`filledCircle`, `mergeCells`) — adding a species is a data-only change in `src/data/species.ts`.
- **Phone-first, ~360px responsive**, with `prefers-reduced-motion` respected and visible keyboard focus — this is a quality floor, not polish.

## Reference docs

- `docs/superpowers/specs/2026-07-28-gameboy-tamagotchi-pivot-design.md` — current, authoritative design.
- `docs/superpowers/plans/2026-07-28-gameboy-tamagotchi-pivot.md` — implementation plan for the current design.
- `AGENTS.md` — condensed project memory; content overlaps with this file.
- `docs/pivot-design.md`, `docs/superpowers/specs/2026-07-23-monster-development-redesign-design.md`, `docs/sproutlings-spec.md` — superseded prior designs, kept for history.

## CI/CD

Pushing any branch runs `.github/workflows/ci_branch.yaml`: node build/lint/test, then a Docker image build (nginx serving `dist/`), then a container health-check test. Pushing a tag (done by release-please, not manually) runs `.github/workflows/ci.yaml`, which additionally pushes the image to Docker Hub as `dachrisch/sproutlings:<tag>` and `:latest`. Versioned releases with changelogs are cut by `release-please` off conventional-commit messages on `master`.
```

- [ ] **Step 3: Replace `AGENTS.md`**

```markdown
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
```

- [ ] **Step 4: Run the full CI-equivalent check locally**

Run: `npm ci && npm run lint && npm run build && npm run test -- --reporter=default --reporter=junit`
Expected: every step succeeds, matching exactly what `.github/workflows/part_node_build.yaml` runs.

- [ ] **Step 5: Commit**

```bash
git add CLAUDE.md AGENTS.md README.md
git commit -m "docs: update CLAUDE.md, AGENTS.md, README.md for the Tamagotchi pivot"
```

- [ ] **Step 6: Push the branch**

```bash
git push -u origin pivot/gameboy-tamagotchi
```
