# Game Boy-Style Tamagotchi Pivot — Design

> Supersedes `docs/pivot-design.md` (Sproutlings → Monster Collector) and
> `docs/superpowers/specs/2026-07-23-monster-development-redesign-design.md`
> (Nursery/training redesign) in their entirety, along with everything in
> `docs/sproutlings-spec.md`. This is a full replacement of the currently
> shipped Monster Collector game (v1.4.1 — battle engine, care/training
> system, 12 Tuxemon-sprite creatures, Dex) with a new single-pet,
> Game Boy-style Tamagotchi game. Built on a dedicated branch; `master` and
> the live released game are untouched until this is reviewed and merged.

## 1. Why

The repo has already pivoted twice (idle hatching game → Nursery/care
redesign → Monster Collector battler). The new direction is a deliberate
third pivot, requested directly by the project owner for their 8-year-old:
a classic single-pet Tamagotchi — feed/play/clean/sleep a monster that
reacts to care in real time — styled after a monochrome-green Game Boy
handheld (dot-matrix screen, chunky pixel sprites, backlit glow), rather
than the current Pokémon-style party battler.

## 2. What gets discarded

The entire current `src/` tree is replaced: the React + Zustand app shell,
the battle engine (`src/engine/*`), the 12 Tuxemon creature sprites and
their CC BY-SA attribution requirements, `creatures.json`/`moves.json`/
`biomes.json`, the care/training/evolution system, and the existing save
schema and all its versions. `SAVE_VERSION` is bumped again; old saves
simply don't load and the player starts fresh, consistent with how every
prior pivot in this repo has handled schema breaks.

**Kept:** git history, the repo itself, the CI/CD pipeline shape (Docker
image built from `dist/`, pushed to Docker Hub as `dachrisch/sproutlings`
on tag, release-please versioning), the GPLv3 `LICENSE`, and the
`docs/superpowers/specs/` convention for design docs. Package name and
Docker Hub image name stay `sproutlings` so no CI secrets or infra need to
change.

## 3. Game concept

- **Single pet.** On first run (or after a run-away), a new monster
  hatches, randomly picked from a roster of 3–5 species — no player
  species-picker.
- **Four needs**, 0–100 each: Hunger, Happiness, Cleanliness, Energy.
- **Four actions**: Feed, Play, Clean, Sleep — each restores its
  corresponding need and has no failure state.
- **Real wall-clock decay**: needs drop based on elapsed real time,
  computed on load and on an interval while open, capped so a long absence
  doesn't devastate the monster instantly (same spirit as the old
  `OFFLINE_ACCRUAL_CAP_MS`, new constant for this game).
- **Neglect consequence**: if a need stays critically low for too long,
  the monster "runs away" — a soft reset back to picking a new egg, not a
  death screen. No permanent loss state, no funeral UI.
- **Extensibility**: no specific v2 features are promised or designed here
  (no mini-games, multiplayer, or seasonal content committed to). The data
  model and code should simply avoid closing doors on adding more needs,
  species, or actions later.

## 4. Architecture

Full rewrite on Phaser 4, scaffolded via `npm create @phaserjs/game@latest`
(TypeScript template). No React, no Zustand.

- **`BootScene`** — builds all pixel-art textures programmatically at
  startup (no asset loading pipeline; nothing to attribute or license).
- **`PetScene`** — the monster itself: idle animation, reactions to
  actions, the dot-matrix/glow visual treatment.
- **`state.ts`** — a plain TS module owning the monster/save state, with
  no Phaser or DOM imports. Scenes read it to render; an `EventEmitter`
  bridges state changes to scene reactions.
- **Controls stay real DOM**, not Phaser game objects: Feed/Play/Clean/
  Sleep are `<button>` elements in `index.html`, positioned around the
  canvas via CSS. This preserves the project's existing accessibility
  quality floor (keyboard focus, phone-first tap targets) without needing
  a UI framework to get it.

## 5. Data model

```ts
interface Monster {
  speciesId: string;
  hunger: number;      // 0-100
  happiness: number;   // 0-100
  cleanliness: number; // 0-100
  energy: number;      // 0-100
  bornAt: number;       // epoch ms
  lastUpdate: number;   // epoch ms, drives decay calc
}

interface SaveData {
  version: number;
  monster: Monster | null; // null = no monster yet, show the egg/hatch screen
  settings: { sound: boolean; reducedMotion: boolean };
}

interface Species {
  id: string;
  name: string;
  pixelGrid: number[][]; // values 0-3, indexing the 4-shade GB green palette
}
```

Species differ by sprite shape only — the screen has one fixed 4-shade
green ramp, so there's no per-species hue/color variation to model.

## 6. Needs decay & neglect tuning

Single source of truth in `constants.ts`, same pattern as the current
project:

| Constant | Purpose |
|---|---|
| Decay rate per need (per hour) | How fast Hunger/Happiness/Cleanliness/Energy fall |
| Sad/grumpy threshold | Below this, the monster's idle animation/expression changes |
| Run-away threshold + duration | How low, and for how long continuously, before a run-away triggers |
| Offline decay cap | Caps elapsed-time decay calculation on reload, so a week-long absence doesn't instantly trigger run-away |

Exact numeric values are tuning, decided during implementation/playtesting,
not fixed in this design.

## 7. Rendering

A low logical resolution canvas (e.g. 64×64) with `pixelArt: true` and
nearest-neighbor scaling for chunky, crisp pixels. A CSS bezel around the
canvas gives the handheld device frame. A dot-matrix grid overlay plus
Phaser 4's built-in glow/bloom filter gives the backlit-LCD look.

## 8. Audio

No external audio files. A small Web Audio synth generates a short looping
chiptune background track plus one-shot square-wave blips for feed/play/
clean and a distinct cue for a run-away event.

## 9. Persistence

Single versioned JSON blob in `localStorage`, ported from the existing
`storage.ts` contract: load → validate version → migrate/fallback, never
throws, falls back to a fresh (no-monster) state on any parse error or
version mismatch. No network calls of any kind — the COPPA-safe-by-
construction constraint carries over unchanged.

## 10. Testing & CI

`state.ts` (decay math, thresholds, save/load) stays framework-free so
vitest can test it without a real canvas or DOM. `npm run dev/build/lint/
test` script names are kept matching what `.github/workflows/ci_branch.yaml`
already expects; the workflow itself is only touched if the Phaser
template's generated scripts differ from those names.

## 11. Rollout

Done on a new branch (not `master`), so the currently deployed v1.4.1
Monster Collector keeps running untouched until this is reviewed and
explicitly merged.

## 12. Non-goals (v1)

- No player-chosen starter species (random from the pool).
- No permanent death — run-away/reset is the only neglect consequence.
- No mini-games, multiplayer, trading, or seasonal content designed here.
- No hand-drawn/external art or audio assets, and therefore no attribution
  file needed (unlike the current Tuxemon-sprite game).
