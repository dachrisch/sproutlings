# Sproutlings

A cozy, kid-friendly creature-collector idle game. Plant seeds, grow eggs, hatch cute creatures, earn coins offline, and complete your collection.

Built for a self-hosted personal website — fully static, no backend, no ads, no tracking.

## Stack

- **Build:** Vite + React 18 + TypeScript
- **State:** Zustand (single store, autosaves to localStorage)
- **Styling:** Plain CSS (phone-first, ~360px responsive)
- **Art:** Procedural SVG (no raster assets)

## Quick start

```bash
npm install
npm run dev     # dev server at localhost:5173
npm run build   # production build to dist/
```

Production output is a `dist/` folder of static assets — serve with any static file host.

## How to play

1. **Plant** a seed in an empty plot
2. **Water** to speed up growth
3. **Hatch** the egg to reveal a creature
4. Creatures earn **coins** while you're away
5. Spend coins on seeds, plots, luck upgrades, and hats
6. Complete the **Collection** (16 species + shiny Sparkle variants)

## Design

Spec and tuning: [`docs/sproutlings-spec.md`](docs/sproutlings-spec.md)

- All tuning values live in `src/constants.ts` — balancing is a one-file change
- Species are data-only in `src/data/species.ts`
- Fully offline, COPPA-safe by construction (no external calls, no accounts)

## License

GPL-3.0
