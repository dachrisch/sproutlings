# src/ui/ — DOM UI

Real DOM elements plus the framework-free glue to the store. See [../AGENTS.md](../AGENTS.md) for source-tree conventions.

## Rules
- Controls are `<button data-action>` elements in the root `index.html`, not Phaser game objects — this preserves keyboard focus and tap targets. `controls.ts` queries them by id (`#buttons`) and wires them to the store and the bus.
- Need bars and `needPercent()` read from the store; never mutate store state from the UI — call `store.performAction()` and let bus events update the view.
- `blockButtons()` / `unblockButtons()` (and `isSceneActive()`) disable and re-enable the buttons while an action scene plays; respect this in new UI flows.
- `nameEntry.ts` shows the name form on hatch, trims and slices input to `MAX_NAME_LENGTH`, and focuses the field. Keep names bounded.
- Respect `prefers-reduced-motion` and visible keyboard focus — this is a quality floor, not polish.
- UI modules have colocated `*.test.ts`; run `npm run test`.
