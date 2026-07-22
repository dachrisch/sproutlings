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

export const SAVE_VERSION = 3;
