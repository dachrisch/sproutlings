# Sproutlings — Agent Memory

Repo-wide essentials only. Implementation details live in per-directory guides:
[src/AGENTS.md](src/AGENTS.md) (source tree and conventions) and
[.github/workflows/AGENTS.md](.github/workflows/AGENTS.md) (CI and releases).

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
- Vite + TypeScript (strict), no UI framework
- Phaser 4 for rendering; real DOM `<button>`s in `index.html` for controls
- Procedural pixel sprites and Web Audio synth — no image or audio files
- Static site, no backend, no external network calls

## Build / verify
Commands defined in `package.json`:
- `npm run dev` — dev server
- `npm run build` — `tsc -b` then `vite build`, outputs static `dist/`
- `npm run preview` — serve the production build locally
- `npm run lint` — oxlint
- `npm run test` — vitest

## Safety / policies
- Fully offline and backend-free — never introduce network calls or external asset files (COPPA-safe by construction).
- No death/game-over state: neglect leads to a soft reset to a fresh egg, never a loss screen.
- Keep art and audio procedural; do not add image/audio asset files.

## CI/CD
Branch pushes run build/lint/test plus a Docker (nginx) image build and health check; tag pushes run the same and additionally publish the image to Docker Hub. Versions and releases are cut by release-please. See [.github/workflows/AGENTS.md](.github/workflows/AGENTS.md).

## Reference docs
- `docs/superpowers/specs/2026-07-28-gameboy-tamagotchi-pivot-design.md` — current, authoritative design.
- `docs/superpowers/plans/2026-07-28-gameboy-tamagotchi-pivot.md` — implementation plan.
- `docs/superpowers/specs/2026-07-28-pet-character-engagement-design.md` and `docs/superpowers/plans/2026-07-28-pet-character-engagement.md` — current pet-character/animation design.
- `docs/pivot-design.md`, `docs/superpowers/specs/2026-07-23-monster-development-redesign-design.md`, `docs/sproutlings-spec.md` — superseded prior designs, kept for history.
