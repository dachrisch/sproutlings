# Changelog

## [1.5.0](https://github.com/dachrisch/sproutlings/compare/v1.4.3...v1.5.0) (2026-07-27)


### Features

* add 3-species pixel-art roster ([660a4d0](https://github.com/dachrisch/sproutlings/commit/660a4d0cccc40b744498f16469a077a6df0ad9af))
* add BootScene building species textures from pixel data ([fea5735](https://github.com/dachrisch/sproutlings/commit/fea573577e55f0a3c5a9f6a0ddc89fc9e907b581))
* add core types and tuning constants ([b1cfa3c](https://github.com/dachrisch/sproutlings/commit/b1cfa3c9d281f9249e836cc7af241a2385a4e0ae))
* add event bus and mutable save store ([d277de4](https://github.com/dachrisch/sproutlings/commit/d277de43a42e3760d9fcaca4f82cbafedf0fb64e))
* add Game Boy bezel DOM shell, need bars, and PWA assets ([b33d432](https://github.com/dachrisch/sproutlings/commit/b33d432b48e796db914b2f8f3d7ac955e58fdde2))
* add HatchScene tap-the-egg flow ([fed19fd](https://github.com/dachrisch/sproutlings/commit/fed19fd8829e5b46a845850b5fcc66c6b0926592))
* add PetScene with mood-driven idle animation and dot-matrix grid ([e8fbf59](https://github.com/dachrisch/sproutlings/commit/e8fbf5972164b14fec86637e1d18e33f54d1f0fc))
* add pixel-shape helpers for procedural sprite data ([b480793](https://github.com/dachrisch/sproutlings/commit/b48079311178fafe9d32ae0f8e0a48cc5b2d0d73))
* add pure monster need-decay, action, and run-away logic ([4b9572d](https://github.com/dachrisch/sproutlings/commit/4b9572dfbe81c34519290470a3be8fcfe7b2f425))
* add pure pixel-cell-to-canvas draw helper ([eeb6613](https://github.com/dachrisch/sproutlings/commit/eeb661304c87ebdaad5483f3c3156b7e926d0ed7))
* add versioned localStorage save/load ([226e13e](https://github.com/dachrisch/sproutlings/commit/226e13e7b935a337e63f78851f3418d63bdece7d))
* add Web Audio synth for blips and background loop ([1cedba1](https://github.com/dachrisch/sproutlings/commit/1cedba11c9bf94820f646d432f117453dfaaa0fc))
* wire DOM buttons and need bars to the store ([58fe374](https://github.com/dachrisch/sproutlings/commit/58fe3740d129c14e8decceaa372cd3e9dc3b5a73))
* wire Phaser game, controls, audio, and store together ([d60e2d3](https://github.com/dachrisch/sproutlings/commit/d60e2d3f26e3cbaa7c16d9836334bfe010b0e90f))


### Bug Fixes

* cast fillStyle to string in drawCells test ([d8d3383](https://github.com/dachrisch/sproutlings/commit/d8d3383aa7d6f4b50bc75f155f7eecf6d0cfc07e))

## [1.4.3](https://github.com/dachrisch/sproutlings/compare/v1.4.2...v1.4.3) (2026-07-27)


### Bug Fixes

* **deps:** lock file maintenance ([#21](https://github.com/dachrisch/sproutlings/issues/21)) ([f4e9964](https://github.com/dachrisch/sproutlings/commit/f4e99648e9f9cc65c05c8e7cb41ae3542b3d513e))

## [1.4.2](https://github.com/dachrisch/sproutlings/compare/v1.4.1...v1.4.2) (2026-07-24)


### Bug Fixes

* stop clipping creature sprites into colored bubbles ([5cdd0ee](https://github.com/dachrisch/sproutlings/commit/5cdd0eec4ef0b61b6d8659cfac5d37fe1fcb78a1))

## [1.4.1](https://github.com/dachrisch/sproutlings/compare/v1.4.0...v1.4.1) (2026-07-24)


### Bug Fixes

* bump service worker cache to v2 to invalidate stale assets ([36d1470](https://github.com/dachrisch/sproutlings/commit/36d147057bc9984acc6fe4a80863ab97fb4e3cee))

## [1.4.0](https://github.com/dachrisch/sproutlings/compare/v1.3.1...v1.4.0) (2026-07-24)


### Features

* replace tabbed UI with living Home screen ([26156e8](https://github.com/dachrisch/sproutlings/commit/26156e8361aaec9fdfce92a790228e24c57f1eb9))

## [1.3.1](https://github.com/dachrisch/sproutlings/compare/v1.3.0...v1.3.1) (2026-07-23)


### Bug Fixes

* make victory rewards visible and defeat reachable in battle ([#16](https://github.com/dachrisch/sproutlings/issues/16)) ([0e217a4](https://github.com/dachrisch/sproutlings/commit/0e217a4c6567c789c24e2bb4be3368e79dd86145))

## [1.3.0](https://github.com/dachrisch/sproutlings/compare/v1.2.0...v1.3.0) (2026-07-23)


### Features

* creature animation and care system ([43b8b39](https://github.com/dachrisch/sproutlings/commit/43b8b3968a024bfde08a92cdb528346e3ff66480))


### Bug Fixes

* render pixel-art sprite for discovered creatures in Dex ([#14](https://github.com/dachrisch/sproutlings/issues/14)) ([af20eda](https://github.com/dachrisch/sproutlings/commit/af20edafa7242710207f35fb4bff99a82c74ec12))

## [1.2.0](https://github.com/dachrisch/sproutlings/compare/v1.1.0...v1.2.0) (2026-07-23)


### Features

* add Tuxemon Set 1 pixel-art sprites for all 12 creatures ([#12](https://github.com/dachrisch/sproutlings/issues/12)) ([1323bfd](https://github.com/dachrisch/sproutlings/commit/1323bfd31ec1e708b849919db4010862a9b9eb9e))

## [1.1.0](https://github.com/dachrisch/sproutlings/compare/v1.0.0...v1.1.0) (2026-07-23)


### Features

* creature development system with care, training, and evolution ([#8](https://github.com/dachrisch/sproutlings/issues/8)) ([8252077](https://github.com/dachrisch/sproutlings/commit/82520777a066ed16b40feb0ea2c2f3fdf871cc61))

## 1.0.0 (2026-07-23)


### Features

* add Docker image (nginx serving static build) ([d80f3ac](https://github.com/dachrisch/sproutlings/commit/d80f3acb15cc620e9fd1942b1d1b10bb1779fdff))
* child-friendly polish — hatch animation, confetti, water splash, creature bob, settings toggles, improved dex & shop ([90a3e30](https://github.com/dachrisch/sproutlings/commit/90a3e3062c116ab442927adabc832716f4ad3585))
* finish Phase 2 — sound effects, reset game button, shape silhouettes, garden welcome, celebration polish ([893fd51](https://github.com/dachrisch/sproutlings/commit/893fd51772bb075be907dfc057a955f46b4023f1))
* Phase 1 MVP core loop — plots, hatching, meadow, shop, collection, offline sim ([a5183ce](https://github.com/dachrisch/sproutlings/commit/a5183ce03b1d63793e87c146f6ed10c705f8b786))
* scaffold Phase 0 — Vite + React + TS, store, storage, tab shell, constants, species data ([b46003f](https://github.com/dachrisch/sproutlings/commit/b46003f6f6df4887f8e48deb8d65006fe614b488))


### Bug Fixes

* make renovate use fix commit type and bundle react deps ([b84434c](https://github.com/dachrisch/sproutlings/commit/b84434ca2d4ac6939207e0816b3490c99b8c56d6))
* regenerate package-lock.json to fix npm ci in CI ([cf29afd](https://github.com/dachrisch/sproutlings/commit/cf29afdbf9019d8366bb63b23db7450d9691076e))
* regenerate package-lock.json to fix npm ci in CI ([4b01d31](https://github.com/dachrisch/sproutlings/commit/4b01d31d3fb9c637727c5c570427a858e4b85bd2))
* restore RELEASE_PLEASE_TOKEN now that secret is set ([bd3812e](https://github.com/dachrisch/sproutlings/commit/bd3812e756c94a4f3451fd727d02c1e8a4c90b13))
* use 127.0.0.1 in Dockerfile HEALTHCHECK to avoid IPv6 loopback mismatch ([6d5c270](https://github.com/dachrisch/sproutlings/commit/6d5c2709dc1d37d7d0f55e9771c806feb5f4fa88))
* use GITHUB_TOKEN instead of missing RELEASE_PLEASE_TOKEN secret ([f6ad4b9](https://github.com/dachrisch/sproutlings/commit/f6ad4b9930bd13fa2ad50639fd887558d21afae8))
