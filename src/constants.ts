export const STARTING_COINS = 25;
export const STARTING_SEEDS = 4;
export const STARTING_PLOTS = 3;

export const BASE_GROW_TIME_MS = 30_000;
export const WATERING_EFFECT = 0.3;
export const WATERING_COOLDOWN_MS = 10_000;

export const SPARKLE_BASE_CHANCE = 0.05;
export const SPARKLE_PER_LUCK_LEVEL = 0.02;
export const SPARKLE_CHANCE_CAP = 0.25;
export const LUCK_LEVEL_CAP = 10;

export const SEED_PRICE = 8;

export function plotPrice(plotsOwned: number): number {
  return 40 * Math.pow(2, plotsOwned - 3);
}
export const PLOT_CAP = 8;

export function luckUpgradePrice(level: number): number {
  return 30 * Math.pow(1.8, level);
}

export const HAT_BOX_PRICE = 45;

export const OFFLINE_ACCRUAL_CAP_MS = 8 * 60 * 60 * 1000;

export const NEW_SPECIES_BONUS = 10;

export const AUTOSAVE_INTERVAL_MS = 8_000;

export const RARITY_WEIGHTS: Record<string, { weight: number; coinsPerSec: number }> = {
  common:    { weight: 0.50, coinsPerSec: 0.2 },
  uncommon:  { weight: 0.30, coinsPerSec: 0.5 },
  rare:      { weight: 0.16, coinsPerSec: 1.2 },
  legendary: { weight: 0.04, coinsPerSec: 3.0 },
};

export const HATS = ['crown', 'flower', 'bow', 'tophat', 'ribbon'] as const;

export const SAVE_VERSION = 1;
