import { describe, it, expect } from 'vitest';
import {
  slotPrice, luckUpgradePrice, SLOT_CAP, LUCK_LEVEL_CAP,
  EXPEDITION_COST, HAT_BOX_PRICE, SPARKLE_BASE_CHANCE, SPARKLE_PER_LUCK_LEVEL,
  SPARKLE_CHANCE_CAP, STARTING_COINS, STARTING_SLOTS,
  OFFLINE_ACCRUAL_CAP_MS, NEW_SPECIES_BONUS, RARITY_WEIGHTS, HATS,
} from '../constants';

describe('starting values', () => {
  it('starts with 25 coins', () => expect(STARTING_COINS).toBe(25));
  it('starts with 2 slots', () => expect(STARTING_SLOTS).toBe(2));
});

describe('slotPrice', () => {
  it('returns 40 for the 3rd slot', () => expect(slotPrice(2)).toBe(40));
  it('returns 80 for the 4th slot', () => expect(slotPrice(3)).toBe(80));
  it('returns 160 for the 5th slot', () => expect(slotPrice(4)).toBe(160));
  it('returns 320 for the 6th slot', () => expect(slotPrice(5)).toBe(320));
  it('doubles each step after the 3rd slot', () => {
    expect(slotPrice(3)).toBe(slotPrice(2) * 2);
    expect(slotPrice(4)).toBe(slotPrice(3) * 2);
  });
});

describe('luckUpgradePrice', () => {
  it('starts at 30 for level 0', () => expect(luckUpgradePrice(0)).toBe(30));
  it('is 54 for level 1', () => expect(luckUpgradePrice(1)).toBe(54));
  it('scales by 1.8 each level', () => {
    const p1 = luckUpgradePrice(1);
    const p2 = luckUpgradePrice(2);
    expect(p2 / p1).toBeCloseTo(1.8, 1);
  });
});

describe('caps', () => {
  it('slot cap is 6', () => expect(SLOT_CAP).toBe(6));
  it('luck level cap is 10', () => expect(LUCK_LEVEL_CAP).toBe(10));
  it('offline cap is 8 hours', () => expect(OFFLINE_ACCRUAL_CAP_MS).toBe(8 * 60 * 60 * 1000));
});

describe('prices', () => {
  it('expedition cost is 8', () => expect(EXPEDITION_COST).toBe(8));
  it('hat box price is 45', () => expect(HAT_BOX_PRICE).toBe(45));
  it('new species bonus is 10', () => expect(NEW_SPECIES_BONUS).toBe(10));
});

describe('sparkle chance', () => {
  it('base chance is 5%', () => expect(SPARKLE_BASE_CHANCE).toBe(0.05));
  it('per luck level is 2%', () => expect(SPARKLE_PER_LUCK_LEVEL).toBe(0.02));
  it('cap is 25%', () => expect(SPARKLE_CHANCE_CAP).toBe(0.25));
  it('hits cap at 10 luck levels', () => {
    const chance = SPARKLE_BASE_CHANCE + LUCK_LEVEL_CAP * SPARKLE_PER_LUCK_LEVEL;
    expect(chance).toBeGreaterThanOrEqual(SPARKLE_CHANCE_CAP);
  });
});

describe('rarity weights', () => {
  it('sums to 1', () => {
    const total = Object.values(RARITY_WEIGHTS).reduce((s, r) => s + r.weight, 0);
    expect(total).toBeCloseTo(1, 2);
  });
  it('has all 4 rarities', () => {
    expect(RARITY_WEIGHTS).toHaveProperty('common');
    expect(RARITY_WEIGHTS).toHaveProperty('uncommon');
    expect(RARITY_WEIGHTS).toHaveProperty('rare');
    expect(RARITY_WEIGHTS).toHaveProperty('legendary');
  });
});

describe('hats', () => {
  it('has 5 hat types', () => expect(HATS.length).toBe(5));
  it('includes crown and flower', () => {
    expect(HATS).toContain('crown');
    expect(HATS).toContain('flower');
  });
});
