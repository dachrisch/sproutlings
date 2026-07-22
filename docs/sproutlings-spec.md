# Sproutlings — Build Spec

> A cozy, kid-friendly creature-collector idle game for a self-hosted personal website.
> *Working title: **Sproutlings** — rename freely (single find-replace on the title constant).*

**How to use this document:** Drop it into the repo as `SPEC.md` and have Claude Code build it **phase by phase** (see [Milestones](#8-milestones--acceptance-criteria)). Each phase has explicit acceptance criteria — treat them as the definition of done before moving on. Numbers in the [Tuning](#6-tuning-constants) section are the single source of truth; put them in one `constants.ts` so balancing is a one-file change.

---

## 1. Concept

You tend a little garden. You plant seeds, they grow into eggs, you hatch the eggs into cute creatures. Each creature wanders a meadow and quietly earns coins — even while the tab is closed. You spend coins to buy more seeds, more garden plots, silly hats, and luck upgrades. The heart of the game is **completing the collection**: a dex that shows exactly which creatures you've found and which you're still missing, including rare recoloured "Sparkle" variants.

The tone is **cozy, relaxing, at-your-own-pace**. There is no failure state, no timers you can lose, no pressure. It should be pleasant to leave running in a background tab and check on now and then.

*Mechanically inspired by the loop in Bloomies (plant → egg → hatch → collect → idle-earn → shop → rare variants). All creatures, names, and art in this project are original — do not use any assets, names, or copy from that game.*

## 2. Audience & constraints

- **Primary player:** a young child. UI must be large, tappable, forgiving, and readable with minimal text. No reading-heavy screens.
- **Safety / privacy:** no accounts, no logins, no ads, **no external network calls of any kind**, no analytics, no user text leaving the device. Fully COPPA-friendly by construction (all state is local).
- **Hosting:** ships as **static files** to a self-hosted server (Hetzner + Traefik). Must run from a plain static file host with no backend. Works fully offline after first load.
- **Devices:** phone-first (portrait), also fine on tablet and desktop. Touch and mouse.
- **Accessibility floor:** responsive down to ~360px, visible keyboard focus, `prefers-reduced-motion` respected, adequate contrast.

## 3. Recommended stack

> These are defaults chosen for a static, self-hosted SPA that Claude Code builds cleanly. Swap points are called out — flip them before Phase 0 if preferred.

- **Build:** Vite + React + TypeScript. *(Swap point: a single-file vanilla HTML/TS app is a legitimate alternative if you want zero build step — the whole design is small enough. If you go vanilla, keep the same module boundaries.)*
- **State:** Zustand (simple, persists easily) or plain React context + reducer. Keep all game state in one store.
- **Styling:** CSS modules or Tailwind — either is fine. Creatures are **procedural SVG**, not image assets (see [Art](#7-art-direction)).
- **Persistence:** `localStorage`, wrapped behind a `storage.ts` abstraction so a remote backend can be added later without touching game logic. *(Swap point: add a tiny backend + per-device key only if cross-device saves are ever wanted — explicitly out of scope for v1.)*
- **No routing library needed** — three in-app tabs (Garden / Collection / Shop) toggled via state.
- **Optional:** ship as an installable PWA (manifest + service worker) so it can live on a phone home screen. Stretch, not required.

Deliverable of a production build: a `dist/` folder of static assets that can be served as-is.

## 4. Core loop

```
BUY SEED ──▶ PLANT in empty plot ──▶ GROWS (real time; watering speeds it up)
                                            │
                                            ▼
                                     EGG READY  ──tap──▶ HATCH
                                            │
                          roll rarity ──▶ pick species ──▶ roll Sparkle
                                            │
                                            ▼
                       CREATURE joins the MEADOW  ──▶ earns COINS over time (idle)
                                            │
                                            ▼
                       DEX updates (new species? celebrate) ──▶ spend COINS ──▶ (loop)
```

## 5. Systems (detailed)

### 5.1 Garden & plots
- The garden is a grid of **plots**. Start with 3; buy more in the shop up to a cap.
- A plot is `empty`, `growing`, or `ready`.
- Tapping an **empty** plot plants a seed if the player has one (consumes 1 seed). Growth begins.
- Growth is driven by **real wall-clock time** (`plantedAt` + `growMs`), so it advances while the app is closed.
- Tapping a **growing** plot **waters** it: reduces remaining grow time by a percentage, on a cooldown. Watering is a satisfying kid interaction — show droplets and a little bounce.
- When growth completes, the plot becomes `ready` and shows a wobbling **egg**.

### 5.2 Eggs & hatching
- Tapping a **ready** egg hatches it. **Rarity and species are rolled at hatch time, not at plant time** (so luck upgrades bought while it grows still count).
- Roll order: (1) pick a **rarity** by weighted chance; (2) pick a random **species** of that rarity from the roster; (3) roll the **Sparkle** variant chance.
- A **Sparkle** is a recoloured version of the same species (hue-shifted + glitter), tracked as its own dex sub-entry, and earns double coins.
- On hatch: play a short reveal animation, add the creature to the meadow, update the dex. If it's a **newly discovered** species (or new Sparkle), fire a celebration (confetti + small coin bonus).

### 5.3 Creatures & the meadow
- Hatched creatures live in a **meadow** strip and gently idle/bounce/wander.
- Each creature passively generates coins at its species rate (Sparkle ×2). The meadow's total rate is the sum.
- Tapping a meadow creature is a small delight: it hops, and (if the player owns hats) cycles the hat it's wearing.
- No cap on meadow size for v1, but keep rendering light (see performance note in [Milestones](#8-milestones--acceptance-criteria)).

### 5.4 Economy
- **Coins** are the only currency. They accrue continuously from the meadow and are spent in the shop.
- Store coins as a float internally; display floored.
- **Seeds** are a consumable bought with coins; needed to plant.

### 5.5 Shop
Buyable items (see [Tuning](#6-tuning-constants) for prices):
- **Seed** — one seed. Cheap, repeatable.
- **New plot** — expands the garden. Price scales with plots owned; capped.
- **Luck upgrade** — increases Sparkle chance by a fixed step. Price scales; capped.
- **Hat box** — unlocks the next cosmetic hat (purely decorative).
- *(Stretch)* **Automation skills** — auto-water, auto-hatch, auto-plant. See stretch goals.

Shop entries show price, current level/owned count, and disable/grey when unaffordable.

### 5.6 Collection (Dex)
- A grid of every species in the roster. Undiscovered species render as a **"???" silhouette**; discovered ones render in full colour with their name.
- Each discovered cell shows a small **Sparkle star badge** once the Sparkle variant is found.
- Header shows progress: `Found 7 / 16`. Reaching full completion triggers a big one-time celebration.
- This is the "see exactly what you're missing" screen — make it feel like the goal of the game.

### 5.7 Hats / customization
- A fixed set of ~5 cosmetic hats (SVG overlays). Owned via hat boxes.
- Applied by tapping meadow creatures to cycle `null → hat1 → hat2 → … → null`.
- Purely visual; persisted per creature.

### 5.8 Offline / idle simulation
On load, compute elapsed time since `lastUpdate` and:
- Accrue coins = meadow rate × elapsed (cap elapsed at **8 hours** so long absences don't trivialize the game).
- Advance any `growing` plots; flip to `ready` if their timer elapsed (eggs wait to be hatched — do **not** auto-hatch in v1).
- Show a small friendly "welcome back — you earned X coins" toast if meaningful.

## 6. Tuning constants

Put all of these in one `constants.ts`. These are starting values — expect to tune.

| Constant | Value | Notes |
|---|---|---|
| Starting coins | 25 | |
| Starting seeds | 4 | |
| Starting plots | 3 | |
| Base grow time | 30 s | time from plant → egg |
| Watering effect | −30% of remaining time | |
| Watering cooldown | 10 s per plot | |
| Sparkle base chance | 5% | |
| Sparkle per luck level | +2% | |
| Sparkle chance cap | 25% | luck cap = 10 levels |
| Seed price | 8 coins | flat for v1 |
| Plot price | `40 × 2^(plotsOwned − 3)` | 4th plot = 40, then 80, 160… |
| Plot cap | 8 | |
| Luck upgrade price | `30 × 1.8^level` | |
| Luck level cap | 10 | |
| Hat box price | 45 coins | until all hats owned |
| Offline accrual cap | 8 hours | |
| New-species bonus | +10 coins + confetti | |

**Rarity roll weights**

| Rarity | Weight | Coins/sec | Sparkle coins/sec |
|---|---|---|---|
| Common | 50% | 0.2 | 0.4 |
| Uncommon | 30% | 0.5 | 1.0 |
| Rare | 16% | 1.2 | 2.4 |
| Legendary | 4% | 3.0 | 6.0 |

## 7. Art direction

- **Cute, cozy, rounded.** Warm meadow palette; creatures are the colour. Suggested base: soft sky gradient, green grass, wooden planter boxes, gold coins, pink/cyan sparkle accents. Avoid a flat/corporate look — this should feel like a toy.
- **Procedural SVG creatures.** No raster asset pipeline. A single builder function draws any creature from its data:

  ```ts
  function buildCreatureSVG(
    species: Species,
    opts: { sparkle?: boolean; hat?: string | null; mood?: 'happy' }
  ): string; // returns inline SVG markup
  ```

  A creature = a **body shape** + a **hue** + an always-happy cute face (two big eyes, blush, smile). Shape supplies the silhouette (e.g. horns, ears, spikes, antenna). `sparkle` recolours (hue shift + lighter) and adds glitter. `hat` overlays an SVG hat. This keeps all 16 species + variants tiny and consistent, and makes adding species a data change.
- **Motion:** gentle idle bob/wobble on creatures, egg wiggle, hatch pop, coin float, confetti on discovery. Keep it calm. Respect `prefers-reduced-motion` (disable ambient motion, keep essential feedback).
- **Rounded, chunky typography.** No serif body face. Big friendly buttons with a pressed state.

## 8. Content: starter roster (16)

Seed data for `species.ts`. Shapes are hints for the SVG builder's silhouette vocabulary — implement a shape set that covers these.

| id | Name | Rarity | Shape | Hue | Flavor |
|---|---|---|---|---|---|
| mossling | Mossling | common | blob | 110 | round mossy green |
| berrybub | Berrybub | common | blob | 330 | pink berry |
| sunny | Sunny | common | round | 48 | little sun |
| puddle | Puddle | common | eared | 205 | blue, long ears |
| mushcap | Mushcap | common | mushroom | 20 | mushroom cap |
| twiglet | Twiglet | uncommon | sprout | 90 | leaf antenna |
| emberling | Emberling | uncommon | horned | 25 | warm orange |
| frostnip | Frostnip | uncommon | eared | 185 | icy cyan |
| bramble | Bramble | uncommon | spiky | 275 | purple thorns |
| pebbly | Pebbly | uncommon | stone | 40 | rocky grey-tan |
| thornox | Thornox | rare | horned | 355 | red, big horns |
| glimmer | Glimmer | rare | star | 165 | teal, star antenna |
| voltick | Voltick | rare | spiky | 240 | indigo, zappy |
| zappa | Zappa | rare | spiky | 55 | electric yellow |
| aurelia | Aurelia | legendary | tall | 45 | gold, crowned |
| nimbus | Nimbus | legendary | cloud | 210 | fluffy cloud |

Completion target = all 16 found. Sparkle variants are a bonus layer on top.

## 9. Data model

```ts
type Rarity = 'common' | 'uncommon' | 'rare' | 'legendary';
type Shape  = 'blob' | 'round' | 'eared' | 'sprout' | 'horned'
            | 'spiky' | 'star' | 'tall' | 'cloud' | 'mushroom' | 'stone';

interface Species {
  id: string;
  name: string;
  rarity: Rarity;
  shape: Shape;
  hue: number;          // 0–360
  coinsPerSec: number;  // derived from rarity but stored explicitly for tuning
}

interface Plot {
  id: number;
  state: 'empty' | 'growing' | 'ready';
  plantedAt?: number;   // epoch ms
  growMs?: number;      // total grow duration for this plant
  wateredAt?: number;   // epoch ms of last watering (cooldown)
}

interface OwnedCreature {
  uid: string;          // unique instance id
  speciesId: string;
  sparkle: boolean;
  hat: string | null;
}

interface DexEntry { normal: boolean; sparkle: boolean; }

interface GameState {
  version: number;              // bump to migrate saves
  createdAt: number;
  lastUpdate: number;           // for offline accrual
  coins: number;                // float; display floored
  seeds: number;
  plotCount: number;
  luckLevel: number;
  ownedHats: string[];
  plots: Plot[];                // length === plotCount
  creatures: OwnedCreature[];
  dex: Record<string, DexEntry>;
  settings: { reducedMotion: boolean; sound: boolean };
}
```

**Persistence contract (`storage.ts`):**
```ts
load(): GameState | null       // parse + validate + migrate by version
save(state: GameState): void   // debounced autosave (~every 5–10s) + on key actions + on tab hide
clear(): void                  // reset to a fresh game (with confirm)
```
Autosave on: plant, water-to-ready, hatch, any purchase, `visibilitychange` hidden. Migrate old saves by `version`; never crash on a malformed save — fall back to a fresh game.

## 10. Screens / UI

- **Top bar (persistent):** coins 🪙, seeds 🌱, dex progress `7/16`. Three tabs: **Garden** (default) · **Collection** · **Shop**.
- **Garden:** planter-plot grid (tap to plant/water/hatch) above a meadow strip of idling creatures. Toast area for welcome-back / discovery messages.
- **Collection:** the dex grid with silhouettes, names, sparkle badges, and completion header.
- **Shop:** list of buyable items with price, owned/level, and affordability state.
- **Settings (small):** sound toggle, reduced-motion toggle, "start a new garden" reset (with confirm), *(stretch)* export/import save.

## 11. Milestones & acceptance criteria

Build in order. Do not advance until a phase's criteria pass.

### Phase 0 — Scaffold
Vite + React + TS project; state store; `storage.ts` with load/save/clear; tab shell (Garden/Collection/Shop); constants + species data files; a production build that serves as static files.
- **Done when:** `npm run build` produces a `dist/` that runs from a static server; empty tabs switch; a dummy value round-trips through save/load across reload.

### Phase 1 — MVP core loop
Plots (plant / water / grow / ready); egg hatching with rarity + species + Sparkle rolls; meadow with idle coin accrual; coins + seeds economy; basic shop (seeds + plots); dex view with discovery; autosave + offline simulation.
- **Done when:** a player can plant a seed, watch it grow (and speed it with watering), hatch an egg into a creature, watch coins accrue, buy seeds and a new plot, and see the dex update on first discovery. Closing the tab and returning later grants offline coins and finishes grown eggs. All of it survives a hard reload.

### Phase 2 — Collection & polish
Full 16 roster; dex silhouettes + sparkle badges + completion celebration; hats + hat-box shop + tap-to-cycle; luck upgrades; hatch/discovery animations; sound + reduced-motion toggles; phone-first responsive pass; keyboard focus.
- **Done when:** the game feels finished and cozy on a phone, the collection is completable, hats and luck work, and the quality floor (below) passes.

### Phase 3 — Stretch (pick any)
- **Idle automation** ("skills"): auto-water, auto-hatch, auto-plant — bought in shop; matches the "automate as needed" idea. Auto-hatch may run offline.
- **Shadow creatures / auto-battles / world level:** optional, toggleable combat where meadow creatures auto-fight shadows for coins and unlock higher shop tiers via world-level/bosses. Must be disableable for a purely cozy session.
- **Seed tiers** (faster/rarer seeds), **themes/decor** for the garden, **installable PWA**, **export/import save** (JSON) for backup/moving devices.

## 12. Quality floor (applies to every phase)

- No external network calls; works offline after first load.
- Responsive to ~360px; touch and mouse; visible keyboard focus; `prefers-reduced-motion` honoured.
- No accounts, ads, tracking, or any text leaving the device.
- Save never corrupts the game: malformed/incompatible saves fall back cleanly to a fresh start.
- Meadow rendering stays smooth with many creatures (cap re-renders; only rebuild the meadow when the creature set changes, not every tick).

## 13. Non-goals (v1)

Multiplayer, accounts, cloud saves, real-money anything, chat or shared text, leaderboards, external APIs. Keep it a single-player, local, cozy toy.
