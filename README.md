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
