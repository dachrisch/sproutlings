# Sproutlings — Monster Development Redesign

> Supersedes the idle-economy parts of `docs/sproutlings-spec.md` (§5.3 Creatures & the meadow, §5.5 Shop's economy assumptions, §5.6 Collection completion target, §5.8 offline coin accrual, §6 tuning around `coinsPerSec`). Everything else in that document — audience/safety constraints, stack, garden/plot/hatch mechanics, art direction, procedural SVG approach, quality floor — is unchanged and still authoritative.

## 1. Why

Sproutlings today is a fully-built, working idle-hatching game (Phase 0–2 all shipped): plant → grow → hatch → creature joins a meadow and earns coins forever just by existing → spend coins → repeat. That loop is complete and functional, but the game was meant to be about **monsters and their development**, not about idle accrual. The hatching/collecting shell is fine; the "so what happens to a creature after it hatches" answer is currently "nothing, it just sits there generating coins," and that's the part being redesigned.

Reference point: Bloomies (the game this project was originally inspired by, see §1 of the base spec) already treats combat-driven leveling/evolution and S+ ranks as central mechanics, not an afterthought. The base Sproutlings spec relegated that entire dimension to a "Phase 3 stretch" footnote. This redesign promotes creature development to the center of the game, but via **care and training** rather than combat, per the direction chosen for this redesign.

## 2. New core loop

```
BUY SEED → PLANT → EGG (real time, same as today)
                          │
                          ▼
                   HATCH (rarity + species + Sparkle rolled, same as today)
                          │
                          ▼
        NURSERY has an open slot? ──yes──▶ add to NURSERY
                          │no
                          ▼
                     add to RESERVE (holding area, no training progress)
                          │
              (swap Reserve ⇄ Nursery any time)
                          ▼
     FEED / PLAY / TRAIN (Vigor, Zip, Bond minigames) ──▶ stats rise
                          │
                          ▼
          total stats cross a threshold ──▶ STAGE UP
              baby → teen → adult
                          │
           at teen→adult: ADULT FORM branches by
           whichever stat (Vigor/Zip/Bond) is highest
                          │
                          ▼
        creature GRADUATES to the MEADOW (frees Nursery slot,
        small passive coin trickle, mostly a proud display)
                          │
                          ▼
   DEX records species discovered + which adult form(s) raised
                          │
                          ▼
                  spend coins on seeds/plots/luck/
                  hats/food/toys → loop continues
```

Cozy, no-fail tone is preserved throughout: nothing decays while the player is away, no losable states, no timers that can be missed.

## 3. Systems

### 3.1 The Nursery

- **3 active slots** (fixed for v1; no expansion item yet — matches the "small active roster" decision; could become a shop unlock later but is out of scope now).
- A creature in the Nursery has two needs, **Fullness** and **Energy** (0–100 each, start at 100 on arrival), and three stats, **Vigor**, **Zip**, **Bond** (start at 0).
- Needs and stats **only change during active play** — they never decay in real time or while the app is closed. A low-needs creature simply can't be trained effectively until fed/rested; it never looks neglected or sad. This is the key departure from classic Tamagotchi-style decay, chosen specifically to keep the game pressure-free for a young child.
- **Reserve** holds any hatched creature that doesn't have an open Nursery slot. Unlimited capacity. No needs/stats/training happen in Reserve — it's just a waiting area. Swapping a Reserve creature into an open Nursery slot is free and instant.

### 3.2 Feeding & play (need restoration)

- **Feed** consumes 1 Food item (bought in the Shop) → +30 Fullness.
- **Play** consumes 1 Toy item (bought in the Shop) → +30 Energy.
- Both are simple, immediate taps — no minigame, no reading required. This is the "tending" half of care, distinct from the "training" half below.

### 3.3 Training minigames

Three short (~10-15s), tap-timing minigames, one per stat — no reading required:

| Stat | Minigame flavor | Cost | Cooldown (per creature, per stat) |
|---|---|---|---|
| Vigor | stretch/tug | 15 Fullness + 15 Energy | 3 min |
| Zip | dash/fetch | 15 Fullness + 15 Energy | 3 min |
| Bond | cuddle/hand-feed | 15 Fullness + 15 Energy | 3 min |

- A successful (well-timed) attempt awards more stat XP than a rough one, but there is no failure outcome — worst case is a smaller gain, never a setback.
- **Sparring** (optional, non-losable): an alternate way to gain Vigor or Zip via a calm "adventure" encounter instead of the tap minigame, for variety. Costs 20 Energy and puts *that stat's* cooldown on cooldown — it's a different minigame feeding the same stat, not a separate activity, so it shares the Vigor/Zip cooldown rather than tracking its own. Always resolves as a win; it's flavor, not risk.
- Each successful minigame/spar also awards a small coin reward (2–4 coins) — this, plus milestone bonuses below, replaces the old passive `coinsPerSec` income entirely.

### 3.4 Growth stages & branching evolution

- Every species has 3 stages: **baby → teen → adult**, gated by total stats (`vigor + zip + bond`):
  - baby → teen at total ≥ 30
  - teen → adult at total ≥ 90
- At the **teen → adult** transition, the adult **form/track** is locked in based on whichever stat is currently highest (ties broken by a fixed priority: Vigor, then Zip, then Bond). Each species defines up to 3 tracks.
- Forms are produced by the existing single `buildCreatureSVG` builder — stage and track pass in a scale/hue-shift/accessory-flag, the same way `sparkle` already recolors today. No new hand-authored art pipeline is needed; this stays a data-only extension of the current procedural approach.
- Sparkle remains an independent recolor rolled at hatch, orthogonal to stage/track — a Sparkle creature can still grow into any of its species' 3 adult tracks.
- On stage-up: play a short animation, award a coin bonus (+10, same "celebration" beat as today's discovery bonus), and if it's the **first time this species has reached this particular adult track**, fire the bigger confetti + bonus (+15) that today's "new species" discovery gets.

### 3.5 Garden & acquisition — unchanged

Planting, watering, growth timers, and the hatch roll (rarity → species → Sparkle) are **not** part of this redesign — they stay exactly as specified in the base spec §5.1–5.2. The only change is the hatch destination: instead of joining an idle meadow, a hatched creature goes to an open Nursery slot (with a placement prompt) or to Reserve.

### 3.6 Economy rework

Coins no longer accrue from creatures existing. New sources and sinks:

**Sources:**
- Training minigame / spar success: 2–4 coins each (see 3.3)
- Stage-up bonus: +10 coins per creature per stage-up
- New adult-form/dex-entry bonus: +15 coins (first time any creature reaches a given species+track)
- Meadow trickle (graduated creatures only): 0.05 coins/sec per creature — small on purpose (compare today's 0.2–3.0/sec per creature), capped the same way today's offline accrual is capped (`OFFLINE_ACCRUAL_CAP_MS`, 8h). This is the one deliberate remaining idle element, reserved for creatures you're done actively raising.

**Sinks (in addition to today's seed/plot/luck/hat prices, unchanged):**
- **Food**: 6 coins, stackable inventory item, consumed by Feed
- **Toy**: 6 coins, stackable inventory item, consumed by Play

### 3.7 Meadow — repurposed

The Meadow is no longer where all creatures live and passively earn. It becomes the **graduation display**: once a creature reaches its final adult form, it moves here automatically, freeing its Nursery slot. It still idles/bounces exactly as today, still shows hats, and still very lightly contributes coins (§3.6), but it is no longer the game's economic engine — it's the payoff shelf for creatures you've finished raising.

### 3.8 Collection (Dex) rework

- Each species cell now tracks, per adult track, whether it's been raised — not just whether the species has been discovered.
- Header shows two progress numbers: species discovered (e.g. `12/16`, unchanged meaning) and adult forms fully raised (e.g. `5/48` = up to 3 tracks × 16 species) — the new, deeper completion goal that fits a development-focused game.
- The independent Sparkle badge stays as today, orthogonal to track.

## 4. Data model

```ts
type Stat = 'vigor' | 'zip' | 'bond';
type Stage = 'baby' | 'teen' | 'adult';
type Track = 'sturdy' | 'sleek' | 'cheerful'; // generic track slugs; species/UI may give each a flavored label

interface Species {
  id: string;
  name: string;
  rarity: Rarity;
  shape: Shape;
  hue: number;
  // coinsPerSec removed — no passive per-creature income
  forms: Record<Track, { hueShift: number; label: string }>; // adult-form tweaks fed into buildCreatureSVG
}

interface OwnedCreature {
  uid: string;
  speciesId: string;
  sparkle: boolean;
  hat: string | null;
  stage: Stage;
  track: Track | null;            // set once, at teen → adult
  stats: Record<Stat, number>;    // vigor / zip / bond
  fullness: number;               // 0-100
  energy: number;                 // 0-100
  location: 'nursery' | 'reserve' | 'meadow';
  cooldowns: Partial<Record<Stat, number>>; // epoch ms of last training attempt (minigame or spar) per stat
}

interface DexEntry {
  normal: boolean;
  sparkle: boolean;
  formsRaised: Track[];   // which adult tracks have been fully raised for this species
}

interface Inventory {
  food: number;
  toys: number;
}

interface GameState {
  version: number;
  createdAt: number;
  lastUpdate: number;       // still drives plot-growth offline advancement only
  coins: number;
  seeds: number;
  plotCount: number;
  luckLevel: number;
  ownedHats: string[];
  inventory: Inventory;     // new
  plots: Plot[];
  creatures: OwnedCreature[];
  dex: Record<string, DexEntry>;
  settings: { reducedMotion: boolean; sound: boolean };
}
```

`Plot` is unchanged from the base spec.

## 5. Tuning constants (starting values — expect to tune, single source of truth in `constants.ts`, same pattern as today)

| Constant | Value | Notes |
|---|---|---|
| Nursery slots | 3 | fixed for v1 |
| Starting Fullness / Energy | 100 / 100 | per creature, on arrival in Nursery |
| Feed action | +30 Fullness | consumes 1 Food |
| Play action | +30 Energy | consumes 1 Toy |
| Train cost | 15 Fullness + 15 Energy | per minigame attempt |
| Train cooldown | 3 min per stat, per creature | real time |
| Spar cost | 20 Energy | alternate Vigor/Zip gain, always succeeds |
| Stat XP per success | +8 well-timed / +4 rough | no failure outcome |
| Stage-up: baby → teen | total stats ≥ 30 | sum of vigor+zip+bond |
| Stage-up: teen → adult | total stats ≥ 90 | sum of vigor+zip+bond; track = highest stat |
| Food price | 6 coins | stackable |
| Toy price | 6 coins | stackable |
| Training coin reward | 2-4 coins | per successful attempt |
| Stage-up bonus | +10 coins + confetti | per creature per stage-up |
| New adult-form bonus | +15 coins + big confetti | first time any species+track is raised |
| Meadow graduated trickle | 0.05 coins/sec/creature | capped by existing `OFFLINE_ACCRUAL_CAP_MS` (8h) |
| Reserve capacity | unlimited | no needs/stats/training while in Reserve |

Seed price, plot price/cap, luck-upgrade price/cap, hat-box price, offline accrual cap, and all garden/hatch tuning are unchanged from the base spec's §6.

## 6. Migration

Bump `SAVE_VERSION`. Per the existing `storage.ts` contract (load → validate → migrate by version, fall back to a fresh game on any mismatch/parse error, never throw), an old save simply resets to a fresh game on first load after this change ships. No custom migration path is being built — consistent with "never crash on a malformed save," and appropriate for a personal/family project with no external users depending on save continuity.

## 7. Non-goals / quality floor carried forward

- No neglect/decay-while-away state of any kind.
- No losable combat/sparring outcome.
- No multiplayer, accounts, leaderboards, or external calls — unchanged from base spec §2/§13.
- No re-introduction of passive per-creature income beyond the small, capped Meadow trickle in §3.6/§3.7.
- Responsive/accessible/offline-safe quality floor (base spec §12) applies unchanged to every new screen (Nursery, minigames, Reserve).
- Nursery slot expansion, deeper track-specific hand-authored art, and additional minigame variety are explicitly deferred, not designed here — candidates for a future stretch pass, not this redesign.
