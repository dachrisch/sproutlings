# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Sproutlings is a cozy, kid-friendly creature-collector idle game: plant seeds → grow eggs → hatch creatures → earn coins offline → buy upgrades → complete a 16-species dex. It ships as static files to a self-hosted server with **no backend and no external network calls of any kind** (COPPA-safe by construction — see `docs/sproutlings-spec.md` §2).

Current state: Phase 0 (scaffold) is complete. Phase 1 (MVP core loop — plots, hatching, meadow accrual, shop, dex) is next; `Garden.tsx`, `Collection.tsx`, and `Shop.tsx` are still placeholders.

## Commands

- `npm run dev` — start the Vite dev server
- `npm run build` — type-check (`tsc -b`) then build static assets to `dist/`
- `npm run preview` — serve the production build locally

There is no test suite or linter configured yet.

## Architecture

**Single flattened store.** `src/store/gameStore.ts` spreads the entire `GameState` (`src/types.ts`) directly onto the Zustand store, plus UI-only fields (`tab`, `setTab`). The store is initialized synchronously at module load from `storage.load()` (falling back to a fresh game) — there is no async loading state to handle.

**Autosave via a patched `setState`.** At the bottom of `gameStore.ts`, `useGameStore.setState` is reassigned to wrap the original: every call schedules a debounced `save()` (~8s), and a `visibilitychange` listener forces an immediate save when the tab is hidden. This means any new store action must mutate state through `set(...)` — bypassing it (e.g. direct object mutation) silently breaks autosave.

**`storage.ts` is the only module allowed to touch `localStorage`.** It checks `GameState.version` against `SAVE_VERSION` on load and falls back to `null` (→ fresh game) on any parse error or version mismatch — it never throws. Bump `SAVE_VERSION` in `constants.ts` when the save shape changes.

**`constants.ts` is the single source of truth for balance.** Prices, grow times, rarity weights/coin rates, and caps all live here. Scaling values like plot price and luck-upgrade price are exported functions (`plotPrice`, `luckUpgradePrice`), not tables — read them rather than re-deriving formulas elsewhere.

**Species are pure data.** `src/data/species.ts` defines a base roster, maps in `coinsPerSec` from `RARITY_WEIGHTS`, then derives `SPECIES_MAP` (by id) and `SPECIES_BY_RARITY` (for weighted rarity rolls at hatch time). Adding a creature is a data-only change here; it does not touch any component.

**No router.** `App.tsx` reads `tab` from the store and conditionally renders `Garden` / `Collection` / `Shop` — three tabs toggled by state equality, not routes.

## Design constraints that shape implementation choices

- **Procedural SVG, no raster assets.** A creature is rendered from `Species` data (body shape + hue), with an optional Sparkle recolor and hat overlay — not per-species art files. See spec §7 for the intended `buildCreatureSVG` shape.
- **Rarity, species, and Sparkle are rolled at hatch time, not plant time**, so luck upgrades bought while an egg grows still apply.
- **Time-based idle simulation.** Plot growth (`plantedAt` + `growMs`) and meadow coin accrual are driven by wall-clock time via `lastUpdate`, so both continue while the app is closed; offline elapsed time is capped (`OFFLINE_ACCRUAL_CAP_MS`) on reload rather than applied unbounded.
- **Phone-first, ~360px responsive**, with `prefers-reduced-motion` respected and visible keyboard focus — this is a quality floor for every phase, not just polish.

## Reference docs

- `docs/sproutlings-spec.md` — full design spec: systems detail, tuning table, data model, phased milestones with acceptance criteria, and quality floor. Consult it before implementing a new system (e.g. hatching, the shop, the dex) rather than inferring behavior from placeholders.
- `AGENTS.md` — condensed project memory; content overlaps with this file.
