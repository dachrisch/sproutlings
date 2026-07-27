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
