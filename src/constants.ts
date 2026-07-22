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

export const RARITY_WEIGHTS: Record<string, { weight: number }> = {
  common:    { weight: 0.50 },
  uncommon:  { weight: 0.30 },
  rare:      { weight: 0.16 },
  legendary: { weight: 0.04 },
};

export const HATS = ['crown', 'flower', 'bow', 'tophat', 'ribbon'] as const;

export const NURSERY_SLOTS = 3;
export const STARTING_FULLNESS = 100;
export const STARTING_ENERGY = 100;
export const FEED_AMOUNT = 30;
export const PLAY_AMOUNT = 30;
export const TRAIN_COST_FULLNESS = 15;
export const TRAIN_COST_ENERGY = 15;
export const SPAR_COST_ENERGY = 20;
export const TRAIN_COOLDOWN_MS = 3 * 60 * 1000;
export const STAT_XP_WELL_TIMED = 8;
export const STAT_XP_ROUGH = 4;
export const STAT_XP_SPAR = 6;
export const STAGE_UP_THRESHOLD_TEEN = 30;
export const STAGE_UP_THRESHOLD_ADULT = 90;
export const FOOD_PRICE = 6;
export const TOY_PRICE = 6;
export const TRAIN_COIN_REWARD_MIN = 2;
export const TRAIN_COIN_REWARD_MAX = 4;
export const SPAR_COIN_REWARD = 3;
export const STAGE_UP_BONUS = 10;
export const NEW_FORM_BONUS = 15;
export const MEADOW_TRICKLE_RATE = 0.05;

export const SAVE_VERSION = 2;
