export const STARTING_COINS = 25;
export const STARTING_SLOTS = 2;

export const EXPEDITION_COST = 8;
export const EXPEDITION_DURATION_MS = 20_000;

export const SPARKLE_BASE_CHANCE = 0.05;
export const SPARKLE_PER_LUCK_LEVEL = 0.02;
export const SPARKLE_CHANCE_CAP = 0.25;
export const LUCK_LEVEL_CAP = 10;

export function slotPrice(slotsOwned: number): number {
  return 40 * Math.pow(2, slotsOwned - STARTING_SLOTS);
}
export const SLOT_CAP = 6;

export function luckUpgradePrice(level: number): number {
  return 30 * Math.pow(1.8, level);
}

export const HAT_BOX_PRICE = 45;

export const OFFLINE_ACCRUAL_CAP_MS = 8 * 60 * 60 * 1000;

export const NEW_SPECIES_BONUS = 10;

export const AUTOSAVE_INTERVAL_MS = 8_000;

export const ZOO_RATE = 0.1;

export const TREASURE_MIN = 2;
export const TREASURE_MAX = 6;

export const RARITY_WEIGHTS: Record<string, { weight: number }> = {
  common:    { weight: 0.50 },
  uncommon:  { weight: 0.30 },
  rare:      { weight: 0.16 },
  legendary: { weight: 0.04 },
};

export const HATS = ['crown', 'flower', 'bow', 'tophat', 'ribbon'] as const;

export const SAVE_VERSION = 4;

// Creature development
export const XP_PER_LEVEL = 100;
export const MAX_LEVEL = 10;
export const HAPPINESS_DECAY_PER_SEC = 0.002;
export const PET_HAPPINESS_BOOST = 15;
export const PET_COOLDOWN_MS = 5_000;
export const PLAY_HAPPINESS_BOOST = 25;
export const PLAY_COOLDOWN_MS = 30_000;
export const HAPPINESS_MAX = 100;
export const BASE_XP_PER_SEC = 0.02;

export const EVOLVE_LEVEL_REQUIREMENT: Record<string, number> = {
  baby: 3,
  adult: 7,
  elder: MAX_LEVEL,
};
export const EVOLVE_HAPPINESS_REQUIREMENT = 60;

export const TRAINING_DURATION_MS = 45_000;
export const TRAINING_XP_REWARD = 50;
export const TRAINING_COST = 10;

export const HAPPINESS_MULTIPLIER_MIN = 0.5;
export const HAPPINESS_MULTIPLIER_MAX = 2.0;
export const LEVEL_COIN_BONUS_PER_LEVEL = 0.15;
export const TRAINING_SPEED_BONUS = 0.2;
export const TRAINING_LUCK_BONUS = 0.2;
export const TRAINING_CHARM_BONUS = 0.2;
