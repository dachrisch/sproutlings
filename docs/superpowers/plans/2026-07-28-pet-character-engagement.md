# Pet Character & Engagement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the monster a player-chosen name, replace the single generic action-bounce with a finite-state-machine-driven animation system (distinct per-action reactions, richer mood-linked idle behavior, an animated hatch and run-away), per `docs/superpowers/specs/2026-07-28-pet-character-engagement-design.md`.

**Architecture:** A new pure, framework-free `src/petAnimation.ts` module models animation as an explicit state machine (`idle`/`reacting`/`moodShift`/`runningAway`) with defined event precedence, unit-tested the same way as `state.ts`. `PetScene` becomes a thin player over that FSM: it forwards bus events in, and reacts to state changes by playing Phaser tweens/particles, never deciding animation logic itself. New pixel-cell particle/overlay shapes follow the existing `species.ts` pattern (data only, rendered via the already-tested `drawCellsToContext`). Naming is a real DOM form (matching the existing pattern of DOM buttons around the canvas), shown by `HatchScene` after the species is revealed but before the monster is persisted.

**Tech Stack:** Vite, TypeScript (strict), Phaser 4, vitest, oxlint. No React, no Zustand, no JSX, no new dependencies.

## Global Constraints

- No network calls of any kind — fully static, offline, COPPA-safe.
- No player-chosen starter species — species is still picked randomly; only the *name* is player-chosen.
- No permanent death — "run away" (soft reset to a new egg) remains the only neglect consequence; this plan only adds an animated exit, not a new consequence.
- No external art or audio asset files — all new visuals are procedural pixel-cell data in the existing 4-shade DMG palette (`PALETTE` in `constants.ts`); no emoji/colorful particles inside the canvas.
- No random idle "fidgets" — all personality animation is driven by mood or player action, never a timer (per design spec's non-goals).
- No per-species signature animations — all 3 species share one animation system.
- `tsconfig.json` enforces `noUnusedLocals`/`noUnusedParameters`; `.oxlintrc.json` enforces `typescript/no-explicit-any` as an error and `no-unused-vars`. No unused imports, no `any`.
- `npm run dev/build/lint/test` script names must keep matching CI. Every task must leave `npm run build && npm run lint && npm run test` green.

---

## Task 1: Monster name + shared constants/types

**Files:**
- Modify: `src/types.ts`
- Modify: `src/constants.ts`

**Interfaces:**
- Produces: `Monster.name: string`; `ParticleShape { id: string; cells: PixelCell[] }`; `MAX_NAME_LENGTH` constant — used by every later task in this plan.

No test cycle — these are pure declarations with no behavior to assert (matches the convention set by the original pivot plan's Task 2).

- [ ] **Step 1: Add `name` to `Monster` and add the `ParticleShape` type**

Edit `src/types.ts`. Add `name: string;` to the `Monster` interface (right after `speciesId: string;`), and add a new `ParticleShape` interface after `Species`:

```ts
export interface Monster {
  speciesId: string;
  name: string;
  hunger: number;
  happiness: number;
  cleanliness: number;
  energy: number;
  bornAt: number;
  lastUpdate: number;
  criticalSince: number | null;
}
```

```ts
export interface ParticleShape {
  id: string;
  cells: PixelCell[];
}
```

- [ ] **Step 2: Add `MAX_NAME_LENGTH` to constants**

Edit `src/constants.ts`, add at the end:

```ts
export const MAX_NAME_LENGTH = 16;
```

- [ ] **Step 3: Verify the project still type-checks**

Run: `npm run build`
Expected: FAILS — `state.ts`, `state.test.ts`, and `store.test.ts` construct `Monster` objects without `name` and will now be missing a required property. This is expected; Task 2 and Task 3 fix it. Confirm the failure is specifically about the missing `name` property (not something else) before moving on.

- [ ] **Step 4: Commit**

```bash
git add src/types.ts src/constants.ts
git commit -m "feat: add Monster.name and ParticleShape type"
```

---

## Task 2: `state.ts` — name-aware monster creation

**Files:**
- Modify: `src/state.ts`
- Modify: `src/state.test.ts`
- Modify: `src/storage.test.ts`

**Interfaces:**
- Consumes: `Monster.name` (Task 1).
- Produces: `createMonster(now: number, name: string, speciesId?: string, random?: () => number): Monster` — used by `store.ts` (Task 3).

- [ ] **Step 1: Update the failing/existing tests for the new signature**

Edit `src/state.test.ts`. Replace the `monsterAt` helper and the `createMonster` describe block:

```ts
function monsterAt(now: number, overrides: Partial<Monster> = {}): Monster {
  return {
    speciesId: 'blobbin',
    name: 'Sprout',
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
```

```ts
describe('createMonster', () => {
  it('starts every need at maximum', () => {
    const monster = createMonster(0, 'Sprout', 'blobbin');
    expect(monster.hunger).toBe(NEED_MAX);
    expect(monster.happiness).toBe(NEED_MAX);
    expect(monster.cleanliness).toBe(NEED_MAX);
    expect(monster.energy).toBe(NEED_MAX);
  });

  it('sets the given name', () => {
    const monster = createMonster(0, 'Sprout', 'blobbin');
    expect(monster.name).toBe('Sprout');
  });

  it('picks a species deterministically when a random function is given', () => {
    const monster = createMonster(0, 'Sprout', undefined, () => 0);
    expect(monster.speciesId).toBe('blobbin');
  });
});
```

- [ ] **Step 2: Run and verify the new/updated tests fail**

Run: `npm run test -- src/state.test.ts`
Expected: FAIL — `createMonster` doesn't accept a `name` argument yet, and the returned object has no `name` property.

- [ ] **Step 3: Update the implementation**

Edit `src/state.ts`, replace `createMonster`:

```ts
export function createMonster(
  now: number,
  name: string,
  speciesId?: string,
  random: () => number = Math.random,
): Monster {
  const id = speciesId ?? SPECIES[Math.floor(random() * SPECIES.length)].id;
  return {
    speciesId: id,
    name,
    hunger: NEED_START,
    happiness: NEED_START,
    cleanliness: NEED_START,
    energy: NEED_START,
    bornAt: now,
    lastUpdate: now,
    criticalSince: null,
  };
}
```

- [ ] **Step 4: Run and verify all state tests pass**

Run: `npm run test -- src/state.test.ts`
Expected: PASS, 19 tests.

- [ ] **Step 5: Fix the other `Monster` object literal that predates `name`**

`src/storage.test.ts`'s "round-trips a saved monster" test builds a `Monster` object literal directly (not via `createMonster`) and will now fail to type-check since `name` is a required field. Edit `src/storage.test.ts`, adding `name: 'Sprout',` to the monster literal (right after `speciesId: 'blobbin',`):

```ts
  it('round-trips a saved monster', () => {
    const data: SaveData = {
      version: SAVE_VERSION,
      monster: {
        speciesId: 'blobbin',
        name: 'Sprout',
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
```

- [ ] **Step 6: Verify the full project builds, lints, and tests pass**

Run: `npm run build && npm run lint && npm run test`
Expected: all succeed — this is the first point since Task 1 where the whole project type-checks again.

- [ ] **Step 7: Commit**

```bash
git add src/state.ts src/state.test.ts src/storage.test.ts
git commit -m "feat: thread monster name through createMonster"
```

---

## Task 3: `store.ts` — persist the name at hatch

**Files:**
- Modify: `src/store.ts`
- Modify: `src/store.test.ts`

**Interfaces:**
- Consumes: `createMonster(now, name, speciesId?, random?)` (Task 2).
- Produces: `hatchNewMonster(name: string, speciesId?: string): void` — used by `HatchScene` (Task 8).

- [ ] **Step 1: Update the failing/existing store tests**

Edit `src/store.test.ts`, update every `hatchNewMonster()` call to pass a name, and add a name assertion:

```ts
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

  it('hatchNewMonster creates and persists a named monster', async () => {
    const store = await freshStore();
    store.hatchNewMonster('Sprout');
    expect(store.getMonster()).not.toBeNull();
    expect(store.getMonster()?.hunger).toBe(NEED_MAX);
    expect(store.getMonster()?.name).toBe('Sprout');

    const speciesId = store.getMonster()?.speciesId;
    vi.resetModules();
    const reloaded = await import('./store');
    expect(reloaded.getMonster()?.speciesId).toBe(speciesId);
    expect(reloaded.getMonster()?.name).toBe('Sprout');
  });

  it('performAction restores the targeted need', async () => {
    const store = await freshStore();
    store.hatchNewMonster('Sprout');
    store.performAction('hunger');
    expect(store.getMonster()!.hunger).toBe(NEED_MAX);
  });

  it('emits monster-updated on hatch and on action', async () => {
    const store = await freshStore();
    const { bus, EVENTS } = await import('./bus');
    const seen: unknown[] = [];
    bus.on(EVENTS.MONSTER_UPDATED, (monster: unknown) => seen.push(monster));
    store.hatchNewMonster('Sprout');
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

- [ ] **Step 2: Run and verify the tests fail**

Run: `npm run test -- src/store.test.ts`
Expected: FAIL — `hatchNewMonster` doesn't accept a `name` argument yet.

- [ ] **Step 3: Update the implementation**

Edit `src/store.ts`, replace `hatchNewMonster`:

```ts
export function hatchNewMonster(name: string, speciesId?: string): void {
  _monster = createMonster(Date.now(), name, speciesId);
  save();
  bus.emit(EVENTS.MONSTER_UPDATED, _monster);
}
```

- [ ] **Step 4: Run the full test suite and verify it passes**

Run: `npm run test`
Expected: PASS — all suites green (state, store, and everything else unaffected).

- [ ] **Step 5: Commit**

```bash
git add src/store.ts src/store.test.ts
git commit -m "feat: require a name when hatching a monster"
```

---

## Task 4: Pet animation finite-state machine

**Files:**
- Create: `src/petAnimation.ts`
- Test: `src/petAnimation.test.ts`

**Interfaces:**
- Consumes: `Mood` from `src/state.ts`, `Need` from `src/types.ts`.
- Produces: `PetAnimationState`, `PetAnimationEvent`, `initialPetAnimationState(mood): PetAnimationState`, `transitionPetAnimation(state, event): PetAnimationState` — used by `PetScene` (Task 9).

- [ ] **Step 1: Write the failing tests**

Create `src/petAnimation.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { initialPetAnimationState, transitionPetAnimation } from './petAnimation';

describe('initialPetAnimationState', () => {
  it('starts idle with the given mood', () => {
    expect(initialPetAnimationState('happy')).toEqual({ kind: 'idle', mood: 'happy' });
  });
});

describe('transitionPetAnimation', () => {
  it('RUN_AWAY wins from idle', () => {
    const state = initialPetAnimationState('content');
    expect(transitionPetAnimation(state, { type: 'RUN_AWAY' })).toEqual({ kind: 'runningAway' });
  });

  it('RUN_AWAY wins from reacting', () => {
    const state = { kind: 'reacting', need: 'hunger', mood: 'content' } as const;
    expect(transitionPetAnimation(state, { type: 'RUN_AWAY' })).toEqual({ kind: 'runningAway' });
  });

  it('RUN_AWAY wins from moodShift', () => {
    const state = { kind: 'moodShift', from: 'content', to: 'happy' } as const;
    expect(transitionPetAnimation(state, { type: 'RUN_AWAY' })).toEqual({ kind: 'runningAway' });
  });

  it('runningAway is terminal and ignores further events', () => {
    const state = { kind: 'runningAway' } as const;
    expect(transitionPetAnimation(state, { type: 'ACTION', need: 'hunger' })).toEqual({ kind: 'runningAway' });
  });

  it('an ACTION from idle enters reacting with the current mood', () => {
    const state = initialPetAnimationState('happy');
    expect(transitionPetAnimation(state, { type: 'ACTION', need: 'happiness' })).toEqual({
      kind: 'reacting',
      need: 'happiness',
      mood: 'happy',
    });
  });

  it('a MOOD_UPDATED to a different mood from idle enters moodShift', () => {
    const state = initialPetAnimationState('content');
    expect(transitionPetAnimation(state, { type: 'MOOD_UPDATED', mood: 'sad' })).toEqual({
      kind: 'moodShift',
      from: 'content',
      to: 'sad',
    });
  });

  it('a MOOD_UPDATED to the same mood from idle is a no-op (same reference)', () => {
    const state = initialPetAnimationState('content');
    expect(transitionPetAnimation(state, { type: 'MOOD_UPDATED', mood: 'content' })).toBe(state);
  });

  it('a new ACTION while reacting restarts the reaction with the new need', () => {
    const state = { kind: 'reacting', need: 'hunger', mood: 'content' } as const;
    expect(transitionPetAnimation(state, { type: 'ACTION', need: 'energy' })).toEqual({
      kind: 'reacting',
      need: 'energy',
      mood: 'content',
    });
  });

  it('a MOOD_UPDATED while reacting updates the mood silently without leaving reacting', () => {
    const state = { kind: 'reacting', need: 'hunger', mood: 'content' } as const;
    expect(transitionPetAnimation(state, { type: 'MOOD_UPDATED', mood: 'sad' })).toEqual({
      kind: 'reacting',
      need: 'hunger',
      mood: 'sad',
    });
  });

  it('a MOOD_UPDATED with the same mood while reacting is a no-op (same reference)', () => {
    const state = { kind: 'reacting', need: 'hunger', mood: 'sad' } as const;
    expect(transitionPetAnimation(state, { type: 'MOOD_UPDATED', mood: 'sad' })).toBe(state);
  });

  it('ANIMATION_COMPLETE while reacting returns to idle with the carried mood', () => {
    const state = { kind: 'reacting', need: 'hunger', mood: 'sad' } as const;
    expect(transitionPetAnimation(state, { type: 'ANIMATION_COMPLETE' })).toEqual({ kind: 'idle', mood: 'sad' });
  });

  it('an ACTION while moodShift is playing preempts it and enters reacting with the target mood', () => {
    const state = { kind: 'moodShift', from: 'content', to: 'happy' } as const;
    expect(transitionPetAnimation(state, { type: 'ACTION', need: 'cleanliness' })).toEqual({
      kind: 'reacting',
      need: 'cleanliness',
      mood: 'happy',
    });
  });

  it('a further MOOD_UPDATED while moodShift is playing updates the target mood', () => {
    const state = { kind: 'moodShift', from: 'content', to: 'happy' } as const;
    expect(transitionPetAnimation(state, { type: 'MOOD_UPDATED', mood: 'sad' })).toEqual({
      kind: 'moodShift',
      from: 'content',
      to: 'sad',
    });
  });

  it('a MOOD_UPDATED matching the current target while moodShift is playing is a no-op (same reference)', () => {
    const state = { kind: 'moodShift', from: 'content', to: 'happy' } as const;
    expect(transitionPetAnimation(state, { type: 'MOOD_UPDATED', mood: 'happy' })).toBe(state);
  });

  it('ANIMATION_COMPLETE while moodShift is playing settles into idle at the target mood', () => {
    const state = { kind: 'moodShift', from: 'content', to: 'happy' } as const;
    expect(transitionPetAnimation(state, { type: 'ANIMATION_COMPLETE' })).toEqual({ kind: 'idle', mood: 'happy' });
  });
});
```

- [ ] **Step 2: Run and verify it fails**

Run: `npm run test -- src/petAnimation.test.ts`
Expected: FAIL — `petAnimation.ts` doesn't exist yet.

- [ ] **Step 3: Write the implementation**

Create `src/petAnimation.ts`:

```ts
import type { Mood } from './state';
import type { Need } from './types';

export type PetAnimationState =
  | { kind: 'idle'; mood: Mood }
  | { kind: 'moodShift'; from: Mood; to: Mood }
  | { kind: 'reacting'; need: Need; mood: Mood }
  | { kind: 'runningAway' };

export type PetAnimationEvent =
  | { type: 'MOOD_UPDATED'; mood: Mood }
  | { type: 'ACTION'; need: Need }
  | { type: 'RUN_AWAY' }
  | { type: 'ANIMATION_COMPLETE' };

export function initialPetAnimationState(mood: Mood): PetAnimationState {
  return { kind: 'idle', mood };
}

export function transitionPetAnimation(
  state: PetAnimationState,
  event: PetAnimationEvent,
): PetAnimationState {
  if (event.type === 'RUN_AWAY') {
    return { kind: 'runningAway' };
  }
  if (state.kind === 'runningAway') {
    return state;
  }

  switch (state.kind) {
    case 'idle': {
      if (event.type === 'ACTION') {
        return { kind: 'reacting', need: event.need, mood: state.mood };
      }
      if (event.type === 'MOOD_UPDATED') {
        if (event.mood === state.mood) return state;
        return { kind: 'moodShift', from: state.mood, to: event.mood };
      }
      return state;
    }
    case 'reacting': {
      if (event.type === 'ACTION') {
        return { kind: 'reacting', need: event.need, mood: state.mood };
      }
      if (event.type === 'MOOD_UPDATED') {
        if (event.mood === state.mood) return state;
        return { kind: 'reacting', need: state.need, mood: event.mood };
      }
      if (event.type === 'ANIMATION_COMPLETE') {
        return { kind: 'idle', mood: state.mood };
      }
      return state;
    }
    case 'moodShift': {
      if (event.type === 'ACTION') {
        return { kind: 'reacting', need: event.need, mood: state.to };
      }
      if (event.type === 'MOOD_UPDATED') {
        if (event.mood === state.to) return state;
        return { kind: 'moodShift', from: state.from, to: event.mood };
      }
      if (event.type === 'ANIMATION_COMPLETE') {
        return { kind: 'idle', mood: state.to };
      }
      return state;
    }
  }
}
```

- [ ] **Step 4: Run and verify it passes**

Run: `npm run test -- src/petAnimation.test.ts`
Expected: PASS, 16 tests.

- [ ] **Step 5: Commit**

```bash
git add src/petAnimation.ts src/petAnimation.test.ts
git commit -m "feat: add pet animation FSM with explicit event precedence"
```

---

## Task 5: Particle & egg-crack pixel-cell data

**Files:**
- Create: `src/data/particles.ts`
- Test: `src/data/particles.test.ts`

**Interfaces:**
- Consumes: `filledCircle`/`mergeCells` (`src/data/pixelShapes.ts`), `ParticleShape` (Task 1), `GRID_SIZE` (`constants.ts`).
- Produces: `PARTICLES: ParticleShape[]`, `PARTICLES_MAP: Record<string, ParticleShape>` — used by `BootScene` (Task 6), `PetScene` and `HatchScene` (Tasks 8-9).

- [ ] **Step 1: Write the failing tests**

Create `src/data/particles.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { PARTICLES, PARTICLES_MAP } from './particles';
import { GRID_SIZE } from '../constants';

describe('PARTICLES', () => {
  it('defines the 7 expected particle/overlay shapes with unique ids', () => {
    const ids = new Set(PARTICLES.map((p) => p.id));
    expect(ids.size).toBe(PARTICLES.length);
    expect(ids).toEqual(
      new Set([
        'particle-morsel',
        'particle-star',
        'particle-droplet',
        'particle-zzz',
        'particle-poof',
        'egg-crack-1',
        'egg-crack-2',
      ]),
    );
  });

  it('gives every particle a non-empty set of cells within the grid bounds', () => {
    for (const particle of PARTICLES) {
      expect(particle.cells.length).toBeGreaterThan(0);
      for (const cell of particle.cells) {
        expect(cell.x).toBeGreaterThanOrEqual(0);
        expect(cell.x).toBeLessThan(GRID_SIZE);
        expect(cell.y).toBeGreaterThanOrEqual(0);
        expect(cell.y).toBeLessThan(GRID_SIZE);
      }
    }
  });

  it('indexes every particle by id in PARTICLES_MAP', () => {
    for (const particle of PARTICLES) {
      expect(PARTICLES_MAP[particle.id]).toBe(particle);
    }
  });
});
```

- [ ] **Step 2: Run and verify it fails**

Run: `npm run test -- src/data/particles.test.ts`
Expected: FAIL — `particles.ts` doesn't exist yet.

- [ ] **Step 3: Write the implementation**

Create `src/data/particles.ts`:

```ts
import type { ParticleShape } from '../types';
import { filledCircle, mergeCells } from './pixelShapes';

const morsel = filledCircle(6, 6, 1.5, 2);

const star = [
  { x: 6, y: 3, shade: 3 as const },
  { x: 5, y: 5, shade: 3 as const },
  { x: 6, y: 5, shade: 3 as const },
  { x: 7, y: 5, shade: 3 as const },
  { x: 6, y: 7, shade: 3 as const },
  { x: 4, y: 6, shade: 3 as const },
  { x: 8, y: 6, shade: 3 as const },
];

const droplet = mergeCells(filledCircle(6, 7, 2, 3), [
  { x: 6, y: 4, shade: 3 as const },
  { x: 5, y: 5, shade: 3 as const },
  { x: 7, y: 5, shade: 3 as const },
]);

const zzz = [
  { x: 4, y: 8, shade: 1 as const },
  { x: 5, y: 8, shade: 1 as const },
  { x: 6, y: 8, shade: 1 as const },
  { x: 4, y: 9, shade: 1 as const },
  { x: 6, y: 7, shade: 1 as const },
  { x: 5, y: 6, shade: 1 as const },
  { x: 6, y: 6, shade: 1 as const },
  { x: 7, y: 6, shade: 1 as const },
  { x: 5, y: 5, shade: 1 as const },
];

const poof = mergeCells(
  filledCircle(4, 6, 2, 1),
  filledCircle(7, 5, 2.2, 2),
  filledCircle(9, 7, 1.5, 1),
);

const eggCrack1 = [
  { x: 5, y: 4, shade: 3 as const },
  { x: 6, y: 5, shade: 3 as const },
  { x: 6, y: 6, shade: 3 as const },
  { x: 7, y: 7, shade: 3 as const },
];

const eggCrack2 = mergeCells(eggCrack1, [
  { x: 4, y: 6, shade: 3 as const },
  { x: 5, y: 7, shade: 3 as const },
  { x: 8, y: 6, shade: 3 as const },
  { x: 8, y: 8, shade: 3 as const },
]);

export const PARTICLES: ParticleShape[] = [
  { id: 'particle-morsel', cells: morsel },
  { id: 'particle-star', cells: star },
  { id: 'particle-droplet', cells: droplet },
  { id: 'particle-zzz', cells: zzz },
  { id: 'particle-poof', cells: poof },
  { id: 'egg-crack-1', cells: eggCrack1 },
  { id: 'egg-crack-2', cells: eggCrack2 },
];

export const PARTICLES_MAP: Record<string, ParticleShape> = Object.fromEntries(
  PARTICLES.map((particle) => [particle.id, particle]),
);
```

- [ ] **Step 4: Run and verify it passes**

Run: `npm run test -- src/data/particles.test.ts`
Expected: PASS, 3 tests.

- [ ] **Step 5: Commit**

```bash
git add src/data/particles.ts src/data/particles.test.ts
git commit -m "feat: add procedural particle and egg-crack pixel-cell data"
```

---

## Task 6: `BootScene` — build particle/crack textures

**Files:**
- Modify: `src/scenes/BootScene.ts`

**Interfaces:**
- Consumes: `PARTICLES` (Task 5).
- Produces: a Phaser texture per particle/overlay id, keyed the same way species textures are — used by `HatchScene` (Task 8) and `PetScene` (Task 9).

No automated test — matches the existing convention for `BootScene` ("verified manually once main.ts exists").

- [ ] **Step 1: Update `BootScene.ts` to also build particle textures**

Edit `src/scenes/BootScene.ts`:

```ts
import Phaser from 'phaser';
import { SPECIES } from '../data/species';
import { PARTICLES } from '../data/particles';
import { drawCellsToContext } from '../render/drawCells';
import { GRID_SIZE, PIXEL_SCALE, PALETTE } from '../constants';
import * as store from '../store';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create(): void {
    const size = GRID_SIZE * PIXEL_SCALE;
    for (const shape of [...SPECIES, ...PARTICLES]) {
      const texture = this.textures.createCanvas(shape.id, size, size);
      const ctx = texture?.getContext();
      if (!texture || !ctx) continue;
      drawCellsToContext(ctx, shape.cells, PIXEL_SCALE, PALETTE);
      texture.refresh();
    }
    this.scene.start(store.getMonster() ? 'Pet' : 'Hatch');
  }
}
```

- [ ] **Step 2: Verify the project still lints, and builds with only the known pre-existing error**

Run: `npm run lint`
Expected: succeeds clean.

Run: `npm run build`
Expected: FAILS with exactly one error, `src/scenes/HatchScene.ts(18,13): error TS2554: Expected 1-2 arguments, but got 0.` — this is a pre-existing gap (HatchScene still calls the old 0-arg `hatchNewMonster()`) that Task 8 fixes, not this task. If the build fails with any *other* or *additional* error, that's a real regression from this task's change — investigate before committing.

- [ ] **Step 3: Commit**

```bash
git add src/scenes/BootScene.ts
git commit -m "feat: build particle and egg-crack textures in BootScene"
```

---

## Task 7: DOM name-entry panel

**Files:**
- Create: `src/ui/nameEntry.ts`
- Test: `src/ui/nameEntry.test.ts`
- Modify: `index.html`, `src/style.css`, `src/main.ts`

**Interfaces:**
- Consumes: `MAX_NAME_LENGTH` (Task 1).
- Produces: `initNameEntry(): void`, `showNameEntry(onConfirm: (name: string) => void): void`, `hideNameEntry(): void` — used by `HatchScene` (Task 8).

- [ ] **Step 1: Write the failing tests**

Create `src/ui/nameEntry.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('nameEntry', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <form id="name-entry" hidden>
        <input id="name-input" />
        <button id="name-confirm" type="submit"></button>
      </form>
    `;
    vi.resetModules();
  });

  it('reveals the panel when shown', async () => {
    const { initNameEntry, showNameEntry } = await import('./nameEntry');
    initNameEntry();
    showNameEntry(() => {});
    expect((document.getElementById('name-entry') as HTMLFormElement).hidden).toBe(false);
  });

  it('trims the input, hides the panel, and invokes the callback on submit', async () => {
    const { initNameEntry, showNameEntry } = await import('./nameEntry');
    initNameEntry();
    const callback = vi.fn();
    showNameEntry(callback);

    const input = document.getElementById('name-input') as HTMLInputElement;
    input.value = '  Sprout  ';
    document.getElementById('name-entry')?.dispatchEvent(new Event('submit', { cancelable: true }));

    expect(callback).toHaveBeenCalledWith('Sprout');
    expect((document.getElementById('name-entry') as HTMLFormElement).hidden).toBe(true);
  });

  it('caps the confirmed name at MAX_NAME_LENGTH characters', async () => {
    const { initNameEntry, showNameEntry } = await import('./nameEntry');
    const { MAX_NAME_LENGTH } = await import('../constants');
    initNameEntry();
    const callback = vi.fn();
    showNameEntry(callback);

    const input = document.getElementById('name-input') as HTMLInputElement;
    input.value = 'A'.repeat(MAX_NAME_LENGTH + 10);
    document.getElementById('name-entry')?.dispatchEvent(new Event('submit', { cancelable: true }));

    expect(callback).toHaveBeenCalledWith('A'.repeat(MAX_NAME_LENGTH));
  });

  it('ignores submit when the trimmed name is empty', async () => {
    const { initNameEntry, showNameEntry } = await import('./nameEntry');
    initNameEntry();
    const callback = vi.fn();
    showNameEntry(callback);

    const input = document.getElementById('name-input') as HTMLInputElement;
    input.value = '   ';
    document.getElementById('name-entry')?.dispatchEvent(new Event('submit', { cancelable: true }));

    expect(callback).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run and verify it fails**

Run: `npm run test -- src/ui/nameEntry.test.ts`
Expected: FAIL — `nameEntry.ts` doesn't exist yet.

- [ ] **Step 3: Write the implementation**

Create `src/ui/nameEntry.ts`:

```ts
import { MAX_NAME_LENGTH } from '../constants';

let onConfirm: ((name: string) => void) | null = null;

export function initNameEntry(): void {
  const form = document.getElementById('name-entry') as HTMLFormElement | null;
  const input = document.getElementById('name-input') as HTMLInputElement | null;

  form?.addEventListener('submit', (event) => {
    event.preventDefault();
    const name = (input?.value ?? '').trim().slice(0, MAX_NAME_LENGTH);
    if (!name) return;
    hideNameEntry();
    const callback = onConfirm;
    onConfirm = null;
    callback?.(name);
  });
}

export function showNameEntry(callback: (name: string) => void): void {
  const form = document.getElementById('name-entry') as HTMLFormElement | null;
  const input = document.getElementById('name-input') as HTMLInputElement | null;
  onConfirm = callback;
  if (form) form.hidden = false;
  if (input) {
    input.value = '';
    input.focus();
  }
}

export function hideNameEntry(): void {
  const form = document.getElementById('name-entry') as HTMLFormElement | null;
  if (form) form.hidden = true;
}
```

- [ ] **Step 4: Run and verify it passes**

Run: `npm run test -- src/ui/nameEntry.test.ts`
Expected: PASS, 4 tests.

- [ ] **Step 5: Add the DOM panel to `index.html`**

Edit `index.html`, add immediately after the `.buttons` div (still inside `.device`, before the closing `</div>` and the `<script type="module" ...>` tag):

```html
<form class="name-entry" id="name-entry" hidden>
  <label for="name-input">Name your pet</label>
  <input id="name-input" type="text" maxlength="16" autocomplete="off" />
  <button id="name-confirm" type="submit">Confirm</button>
</form>
```

- [ ] **Step 6: Style the panel in `src/style.css`**

Edit `src/style.css`. Change the existing hidden-panel selector:

```css
.needs[hidden],
.buttons[hidden] {
  display: none;
}
```

to:

```css
.needs[hidden],
.buttons[hidden],
.name-entry[hidden] {
  display: none;
}
```

Then add a new block after the existing `.buttons button:active { ... }` rule (before the `@media (prefers-reduced-motion: reduce)` block):

```css
.name-entry {
  display: grid;
  gap: 10px;
  margin-top: 16px;
}

.name-entry label {
  color: #f5f5f0;
  font-size: 13px;
  font-weight: 600;
}

.name-entry input {
  min-height: 44px;
  border-radius: 10px;
  border: none;
  padding: 0 12px;
  font-size: 15px;
  background: #0f380f;
  color: #9bbc0f;
}

.name-entry input:focus-visible {
  outline: 3px solid #ffffff;
  outline-offset: 2px;
}

.name-entry button {
  min-height: 48px;
  border-radius: 10px;
  border: none;
  background: #8bac0f;
  color: #0f380f;
  font-weight: 700;
  font-size: 15px;
  cursor: pointer;
}

.name-entry button:focus-visible {
  outline: 3px solid #ffffff;
  outline-offset: 2px;
}
```

- [ ] **Step 7: Wire `initNameEntry()` into `main.ts`**

Edit `src/main.ts`. Add the import alongside the other `ui`/`audio` imports:

```ts
import { initNameEntry } from './ui/nameEntry';
```

Add the call alongside `initControls()`/`initAudio()`:

```ts
initControls();
initNameEntry();
initAudio();
store.start();
```

- [ ] **Step 8: Verify the project builds, lints, and tests pass**

Run: `npm run build && npm run lint && npm run test`
Expected: all succeed.

- [ ] **Step 9: Commit**

```bash
git add src/ui/nameEntry.ts src/ui/nameEntry.test.ts index.html src/style.css src/main.ts
git commit -m "feat: add DOM name-entry panel for hatching"
```

---

## Task 8: `HatchScene` — crack sequence, reveal, and naming

**Files:**
- Modify: `src/scenes/HatchScene.ts`

**Interfaces:**
- Consumes: `store.hatchNewMonster(name, speciesId?)` (Task 3), `showNameEntry` (Task 7), `SPECIES` (`src/data/species.ts`), `egg-crack-1`/`egg-crack-2`/`particle-star` textures (Task 6).
- Produces: the revised `'Hatch'` scene — used by `main.ts` (already wired) and reached from `PetScene`'s run-away exit (Task 9).

No automated test — matches the existing convention for Phaser scenes ("verified manually").

- [ ] **Step 1: Replace `src/scenes/HatchScene.ts`**

```ts
import Phaser from 'phaser';
import * as store from '../store';
import { showNameEntry } from '../ui/nameEntry';
import { SPECIES } from '../data/species';

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
    const crack1 = this.add.image(80, 60, 'egg-crack-1').setOrigin(0.5).setVisible(false);
    const crack2 = this.add.image(80, 60, 'egg-crack-2').setOrigin(0.5).setVisible(false);

    const idlePulse = this.tweens.add({
      targets: egg,
      scale: { from: 1, to: 1.05 },
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    egg.setInteractive({ useHandCursor: true });
    egg.once('pointerdown', () => {
      egg.disableInteractive();
      idlePulse.stop();
      egg.setScale(1);
      label.setText('Hatching...');
      this.playCrackSequence(egg, crack1, crack2, label);
    });
  }

  private playCrackSequence(
    egg: Phaser.GameObjects.Text,
    crack1: Phaser.GameObjects.Image,
    crack2: Phaser.GameObjects.Image,
    label: Phaser.GameObjects.Text,
  ): void {
    const jolt = (angle: number, onComplete: () => void): void => {
      this.tweens.add({
        targets: egg,
        angle: { from: -angle, to: angle },
        duration: 90,
        yoyo: true,
        repeat: 1,
        onComplete,
      });
    };

    jolt(6, () => {
      crack1.setVisible(true);
      jolt(10, () => {
        crack2.setVisible(true);
        jolt(14, () => this.revealSpecies(egg, crack1, crack2, label));
      });
    });
  }

  private revealSpecies(
    egg: Phaser.GameObjects.Text,
    crack1: Phaser.GameObjects.Image,
    crack2: Phaser.GameObjects.Image,
    label: Phaser.GameObjects.Text,
  ): void {
    const species = SPECIES[Math.floor(Math.random() * SPECIES.length)];
    const sprite = this.add.image(80, 60, species.id).setOrigin(0.5).setScale(0);

    this.tweens.add({
      targets: egg,
      scale: 1.5,
      alpha: 0,
      duration: 200,
      onComplete: () => {
        egg.destroy();
        crack1.destroy();
        crack2.destroy();
      },
    });
    this.tweens.add({
      targets: sprite,
      scale: 1,
      duration: 250,
      ease: 'Back.Out',
    });

    label.setText('Name your pet!');
    showNameEntry((name) => {
      store.hatchNewMonster(name, species.id);
      this.playWelcomeFlourish(sprite, () => this.scene.start('Pet'));
    });
  }

  private playWelcomeFlourish(sprite: Phaser.GameObjects.Image, onComplete: () => void): void {
    const sparkle = this.add.image(sprite.x, sprite.y - 20, 'particle-star').setOrigin(0.5).setAlpha(0);
    this.tweens.add({
      targets: sparkle,
      alpha: { from: 0, to: 1 },
      y: sprite.y - 32,
      scale: { from: 0.6, to: 1.2 },
      duration: 300,
      yoyo: true,
      onComplete: () => {
        sparkle.destroy();
        onComplete();
      },
    });
  }
}
```

- [ ] **Step 2: Verify the project builds and lints**

Run: `npm run build && npm run lint`
Expected: both succeed.

- [ ] **Step 3: Commit**

```bash
git add src/scenes/HatchScene.ts
git commit -m "feat: animate egg-crack, species reveal, and naming in HatchScene"
```

---

## Task 9: `PetScene` — FSM-driven reactions, richer idle, run-away exit

**Files:**
- Modify: `src/scenes/PetScene.ts`

**Interfaces:**
- Consumes: `initialPetAnimationState`/`transitionPetAnimation`/`PetAnimationState`/`PetAnimationEvent` (Task 4), particle textures (Task 6), `Monster.name` (Task 1).
- Produces: the revised `'Pet'` scene.

No automated test — matches the existing convention for Phaser scenes ("verified manually"); Task 10 is the manual verification pass for this and Task 8 together.

- [ ] **Step 1: Replace `src/scenes/PetScene.ts`**

```ts
import Phaser from 'phaser';
import { bus, EVENTS } from '../bus';
import * as store from '../store';
import { moodFor, type Mood } from '../state';
import type { Monster, Need } from '../types';
import {
  initialPetAnimationState,
  transitionPetAnimation,
  type PetAnimationEvent,
  type PetAnimationState,
} from '../petAnimation';

const REACTION_PARTICLE: Record<Need, string> = {
  hunger: 'particle-morsel',
  happiness: 'particle-star',
  cleanliness: 'particle-droplet',
  energy: 'particle-zzz',
};

export class PetScene extends Phaser.Scene {
  private sprite?: Phaser.GameObjects.Image;
  private nameLabel?: Phaser.GameObjects.Text;
  private idleTween?: Phaser.Tweens.Tween;
  private transientTween?: Phaser.Tweens.Tween;
  private animState: PetAnimationState = initialPetAnimationState('content');

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

    this.nameLabel = this.add
      .text(80, 12, monster.name, { fontSize: '12px', color: '#0f380f' })
      .setOrigin(0.5);
    this.sprite = this.add.image(80, 80, monster.speciesId).setOrigin(0.5);
    this.cameras.main.filters.internal.addGlow(0x0f380f, 1, 0);

    this.animState = initialPetAnimationState(moodFor(monster));
    this.playForState(this.animState);

    bus.on(EVENTS.MONSTER_UPDATED, this.onMonsterUpdated, this);
    bus.on(EVENTS.ACTION, this.onAction, this);
    bus.on(EVENTS.RUN_AWAY, this.onRunAway, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      bus.off(EVENTS.MONSTER_UPDATED, this.onMonsterUpdated, this);
      bus.off(EVENTS.ACTION, this.onAction, this);
      bus.off(EVENTS.RUN_AWAY, this.onRunAway, this);
    });
  }

  private dispatch(event: PetAnimationEvent): void {
    const next = transitionPetAnimation(this.animState, event);
    if (next === this.animState) return;
    this.animState = next;
    this.playForState(next);
  }

  private onMonsterUpdated(monster: Monster | null): void {
    if (!monster) return;
    if (this.sprite && this.sprite.texture.key !== monster.speciesId) {
      this.sprite.setTexture(monster.speciesId);
    }
    if (this.nameLabel) this.nameLabel.setText(monster.name);
    this.dispatch({ type: 'MOOD_UPDATED', mood: moodFor(monster) });
  }

  private onAction(need: Need): void {
    this.dispatch({ type: 'ACTION', need });
  }

  private onRunAway(): void {
    this.dispatch({ type: 'RUN_AWAY' });
  }

  private complete(): void {
    this.dispatch({ type: 'ANIMATION_COMPLETE' });
  }

  private playForState(state: PetAnimationState): void {
    if (!this.sprite) return;
    switch (state.kind) {
      case 'idle':
        this.playIdle(state.mood);
        break;
      case 'reacting':
        this.playReaction(state.need);
        break;
      case 'moodShift':
        this.playMoodShift(state.to);
        break;
      case 'runningAway':
        this.playRunningAway();
        break;
    }
  }

  private playIdle(mood: Mood): void {
    if (!this.sprite) return;
    this.idleTween?.stop();
    this.sprite.setAngle(0);
    const baseY = this.sprite.y;
    const bounce = mood === 'happy' ? 6 : mood === 'sad' ? 1 : 3;
    const duration = mood === 'sad' ? 1400 : 700;
    const targetAngle = mood === 'happy' ? 4 : mood === 'sad' ? -3 : 0;

    this.idleTween = this.tweens.add({
      targets: this.sprite,
      y: baseY - bounce,
      angle: targetAngle,
      duration,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private playReaction(need: Need): void {
    if (!this.sprite) return;
    this.idleTween?.pause();
    this.transientTween?.stop();
    const sprite = this.sprite;
    const onComplete = () => this.complete();

    switch (need) {
      case 'hunger':
        this.transientTween = this.tweens.add({
          targets: sprite,
          scaleX: { from: 0.85, to: 1 },
          scaleY: { from: 1.15, to: 1 },
          duration: 220,
          ease: 'Bounce.Out',
          onComplete,
        });
        break;
      case 'happiness':
        this.transientTween = this.tweens.add({
          targets: sprite,
          y: sprite.y - 10,
          angle: { from: 0, to: 8 },
          duration: 200,
          yoyo: true,
          ease: 'Sine.easeOut',
          onComplete,
        });
        break;
      case 'cleanliness':
        this.transientTween = this.tweens.add({
          targets: sprite,
          scaleX: { from: 1, to: 1.08 },
          angle: { from: 0, to: 5 },
          duration: 90,
          yoyo: true,
          repeat: 2,
          onComplete,
        });
        break;
      case 'energy':
        this.transientTween = this.tweens.add({
          targets: sprite,
          y: sprite.y + 6,
          duration: 300,
          yoyo: true,
          ease: 'Sine.easeInOut',
          onComplete,
        });
        break;
    }

    this.spawnParticle(REACTION_PARTICLE[need], sprite.x, sprite.y - 16);
  }

  private playMoodShift(to: Mood): void {
    if (!this.sprite) return;
    this.idleTween?.pause();
    this.transientTween?.stop();
    const sprite = this.sprite;
    const onComplete = () => this.complete();

    if (to === 'happy') {
      this.transientTween = this.tweens.add({
        targets: sprite,
        y: sprite.y - 14,
        duration: 220,
        yoyo: true,
        onComplete,
      });
      this.spawnParticle('particle-star', sprite.x, sprite.y - 20);
      return;
    }
    if (to === 'sad') {
      this.transientTween = this.tweens.add({
        targets: sprite,
        scaleY: { from: 1, to: 0.85 },
        duration: 250,
        yoyo: true,
        onComplete,
      });
      return;
    }
    this.transientTween = this.tweens.add({
      targets: sprite,
      scale: { from: 0.95, to: 1 },
      duration: 200,
      onComplete,
    });
  }

  private playRunningAway(): void {
    if (!this.sprite) return;
    this.idleTween?.stop();
    this.transientTween?.stop();
    const sprite = this.sprite;
    this.spawnParticle('particle-poof', sprite.x, sprite.y);
    this.tweens.add({
      targets: sprite,
      y: sprite.y - 30,
      alpha: 0,
      scale: 0.4,
      duration: 500,
      ease: 'Cubic.In',
      onComplete: () => this.scene.start('Hatch'),
    });
  }

  private spawnParticle(textureKey: string, x: number, y: number): void {
    const particle = this.add.image(x, y, textureKey).setOrigin(0.5).setAlpha(0);
    this.tweens.add({
      targets: particle,
      alpha: { from: 0, to: 1 },
      y: y - 14,
      duration: 350,
      yoyo: true,
      onComplete: () => particle.destroy(),
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

- [ ] **Step 2: Verify the project builds, lints, and the full test suite passes**

Run: `npm run build && npm run lint && npm run test`
Expected: all succeed.

- [ ] **Step 3: Commit**

```bash
git add src/scenes/PetScene.ts
git commit -m "feat: drive PetScene reactions and idle mood off the animation FSM"
```

---

## Task 10: Manual verification pass

**Files:** none (verification only).

- [ ] **Step 1: Start the dev server**

Run: `npm run dev`

- [ ] **Step 2: Full playthrough in a browser**

Open the served URL and verify, in order:
1. Egg has a gentle idle pulse; tapping it plays a multi-stage jolt/crack sequence, then reveals a species sprite (not the egg).
2. The name-entry panel appears below the canvas; typing a name and confirming plays a brief sparkle flourish, then transitions to the Pet screen showing the pet's name at the top.
3. Tapping each of Feed/Play/Clean/Sleep plays a *visibly distinct* body animation and a matching particle (morsel/star/droplet/Z) — not the old generic bounce.
4. Rapidly tapping the same button multiple times keeps animating smoothly with no visual glitches (verifies the transient-tween race-condition fix).
5. Open the browser console and confirm zero exceptions are logged during the above (regression check for the class of bug fixed in PR #27).
6. Force a mood change (e.g. via devtools, advance the monster's `lastUpdate` far enough back that `moodFor` flips) and confirm the idle animation visibly changes character (wiggle for happy, droop for sad) with a one-time transition flourish, not a replay loop.
7. Force a run-away (advance time past `RUNAWAY_GRACE_MS` after a need goes critical) and confirm the pet visibly shrinks/fades/floats with a poof particle *before* the scene switches back to the egg — not an instant cut.

- [ ] **Step 3: Report results**

If every check in Step 2 passes, the feature is complete. If any check fails, use `superpowers:systematic-debugging` to root-cause it before patching — do not guess-fix.
