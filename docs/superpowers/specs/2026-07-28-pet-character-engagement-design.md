# Pet Character & Engagement Design

## Problem

Manual playtesting of the shipped Game Boy Tamagotchi pivot (v1.5.0) surfaced two gaps beyond the `bus.ts` context-binding bug (fixed separately in PR #27):

1. The monster has no name — nothing personalizes it for the player.
2. The only visual feedback is a single generic scale-bounce, shared by all four actions, plus a two-speed idle bounce keyed to mood. The pet doesn't feel alive or distinct in character, and neglect ("run away") and hatching are visually abrupt.

This design adds naming, a richer per-action/per-mood animation system built on an explicit finite-state machine, and animated hatch/run-away sequences.

## Non-goals (explicitly decided against during brainstorming)

- No random idle "fidgets" (blinks, look-arounds) independent of mood — all personality animation is driven by mood or player action, not a timer.
- No per-species signature idle moves — the 3 species keep sharing one animation system; only color/shape differs, not behavior.
- No colorful/emoji particle effects — all new visual effects stay in the 4-shade DMG palette (`PALETTE` in `constants.ts`), built the same way species sprites are (pixel-cell lists via `filledCircle`/`mergeCells` + `drawCellsToContext`).

## 1. Data model & naming flow

- `Monster` gains `name: string` (`src/types.ts`).
- `state.ts`'s `createMonster` gains a required `name` parameter: `createMonster(now, name, speciesId?, random?)`.
- `store.ts` replaces the no-arg `hatchNewMonster()` with `hatchNewMonster(name: string, speciesId?: string)`. A monster is only ever persisted with both a species and a name — no transient unnamed monster ever reaches `localStorage`.
- **`HatchScene` sequence** (revised):
  1. Idle egg, gentle idle pulse tween (subtle scale breathing), "Tap the egg" label — as today.
  2. Tap → multi-stage crack animation (see §3) → a species is picked (`SPECIES[random index]`) and its texture revealed in place of the egg. **Not yet persisted.**
  3. A DOM overlay appears — a new `#name-entry` panel (real HTML `<input>` + confirm button, hidden by default, following the same pattern as the existing `#buttons`/`#needs` DOM panels toggled via the `hidden` attribute) prompting "Name your pet". Basic validation only: non-empty, trimmed, capped at a short max length (e.g. 16 chars) — no profanity filtering (offline, single local player, COPPA-safe by construction already).
  4. Confirm → `store.hatchNewMonster(name, revealedSpeciesId)` persists, DOM overlay hides, a brief "welcome" sparkle flourish plays, then `scene.start('Pet')`.
- The name is rendered as Phaser canvas text at the top of the Pet screen (consistent with `HatchScene` already rendering its label as canvas text — keeps it inside the Game Boy "screen" rather than adding new DOM chrome around the bezel).

## 2. Animation FSM

**New pure module `src/petAnimation.ts`** — framework-free, unit-tested the same way as `state.ts`, no Phaser import.

```ts
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

export function initialPetAnimationState(mood: Mood): PetAnimationState;
export function transitionPetAnimation(state: PetAnimationState, event: PetAnimationEvent): PetAnimationState;
```

### Precedence rules

1. `RUN_AWAY` wins from any state → `runningAway` (terminal; the scene owns what happens after, see §4).
2. A player `ACTION` always preempts an in-progress `moodShift` flourish — the child's tap is never blocked by ambient animation.
3. A new `ACTION` while already `reacting` restarts the reaction with the new need — rapid taps stay responsive, never dropped.
4. `MOOD_UPDATED` while `reacting` updates the carried `mood` silently but does not interrupt the current reaction; the flourish (if the mood is still different) plays once the reaction completes.
5. `moodShift` and `reacting` are transient states: the scene plays the matching tween and dispatches `ANIMATION_COMPLETE` from the tween's `onComplete`, returning the FSM to `idle`.
6. `MOOD_UPDATED` with a mood equal to the current `idle` mood is a no-op (no flourish replay).

### Scene integration

`PetScene` owns one `PetAnimationState` (in-memory only, not persisted — purely visual, fine to reset on reload). It forwards bus events into `transitionPetAnimation`, and on every state change plays the tween/particle matching the new `state.kind`, wiring `onComplete` back into `ANIMATION_COMPLETE`. The scene never decides animation logic itself — it's a thin player over the FSM's decisions.

This also fixes an ordering gap: today `RUN_AWAY` and `MONSTER_UPDATED(null)` fire back-to-back and `onMonsterUpdated` switches scenes immediately, with no animation. With the FSM, `onMonsterUpdated(null)` becomes a no-op when the FSM is already (or transitioning to) `runningAway`; the scene switch happens only after the exit tween's `onComplete`.

### Reaction table

| Trigger | Body tween | Particle (new pixel-cell shapes, in-palette) |
|---|---|---|
| Feed (hunger) | quick squash/stretch "chomp" pulse | morsel: bobs up, fades |
| Play (happiness) | hop + slight rotation wiggle | 2–3 star sparkles burst outward |
| Clean (cleanliness) | brief shine/shake tween | droplets fall and bounce |
| Sleep (energy) | gentle downward "settle" | floating "Z" glyph fades upward |
| mood → happy | upward hop | sparkle burst (reuse star) |
| mood → sad | downward "deflate" squash | none — kept subtle |
| running away | shrink + fade + float upward | poof/cloud burst |

Idle tweens per mood build on the existing bounce-height/duration table: `happy` adds a slight rotation wiggle on top of the existing fast/tall bounce; `sad` adds a slow head-tilt droop on top of the existing slow/short bounce; `content` is unchanged. Exact durations/easing are implementation-level tuning, verified visually during implementation rather than specified here.

## 3. Hatch crack sequence

Replaces the current single 300ms scale-yoyo:

1. 2–3 short "jolt" tweens with increasing intensity (small rotation/position shake) — reads as the egg struggling.
2. A crack-line overlay: 1–2 additional pixel-cell texture(s) (drawn the same way as species sprites, via `drawCellsToContext`) composited over the egg between jolts, showing progressive cracking.
3. A "pop": quick scale-flash + fade-out of the egg, fade-in of the revealed species sprite in its place.
4. Species sprite settles into its normal idle tween while the DOM name-entry panel appears.

## 4. Run-away sequence

On `EVENTS.RUN_AWAY`, `PetScene`'s FSM enters `runningAway`. The scene plays: sprite shrinks + fades + floats upward, with a poof-cloud particle burst at the moment it visually "leaves", timed alongside the existing `playRunAway()` audio jingle (`audio/synth.ts`, unchanged). `scene.start('Hatch')` is deferred to this tween's `onComplete` — today it fires instantly on the `MONSTER_UPDATED(null)` event with no animation at all.

## 5. New pixel-cell assets

All new shapes follow the existing `pixelShapes.ts` pattern (`filledCircle`, `mergeCells`, plain cell lists) and are pre-rendered to textures in `BootScene` alongside species textures, reusing the already-tested `drawCellsToContext`:

- `particle-morsel`, `particle-star`, `particle-droplet`, `particle-zzz`, `particle-poof`
- `egg-crack-1`, `egg-crack-2` (overlay stages for the hatch sequence)

## 6. Testing plan

- **`src/petAnimation.test.ts`** (new, pure, mirrors `state.test.ts`'s style): covers every transition rule in the precedence table above — this is the highest-value test surface in this design, since it's the one place complex conditional logic lives outside of Phaser.
- **`src/data/pixelShapes.test.ts` / new particle shape tests**: new shape-builder functions (if any beyond reusing `filledCircle`/`mergeCells`) get the same coverage style as existing shapes.
- Scene wiring (`PetScene`, `HatchScene`) stays manually verified only, consistent with the existing project convention ("No automated test — Phaser rendering/tweening is verified manually").
- Manual verification pass in-browser (as done for this design's motivating playtest) before considering the feature done: hatch → name → each of the 4 actions shows a distinct reaction → mood transitions show the flourish → forcing a run away (e.g. via devtools time manipulation) shows the exit animation.
