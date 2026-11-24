# src/scenes/ — Phaser scenes

Phaser 4 scenes only. See [../AGENTS.md](../AGENTS.md) for source-tree conventions.

## Rules
- The scene list is registered in `src/main.ts` with `pixelArt: true`; each scene is a `Phaser.Scene` subclass with a stable key used by `this.scene.start(...)`.
- `BootScene` builds one canvas texture per species/particle/frame from `data/*` via `render/drawCells.ts`, then routes to `Pet` or `Hatch` based on `store.getMonster()`. Register new sprite textures there.
- `PetScene` subscribes to `EVENTS.MONSTER_UPDATED`, `ACTION`, `RUN_AWAY` and `SCENE_COMPLETE` on the bus, and unsubscribes on `Phaser.Scenes.Events.SHUTDOWN`. Keep this subscribe/unsubscribe discipline in any new long-lived scene.
- `HatchScene` handles the egg → name-entry → hatch flow.
- The action scenes (`FeedScene`, `PlayScene`, `CleanScene`, `SleepScene`) play a short animation and emit `EVENTS.SCENE_COMPLETE` when done; `PetScene` launches them via its `ACTION_SCENE` map keyed by `Need`.
- Scenes never talk to each other directly — go through the bus and the store. Do not import Phaser into core logic.
