import { describe, it, expect } from 'vitest';
import { SPECIES, SPECIES_MAP, SPECIES_BY_RARITY } from '../data/species';

describe('species data', () => {
  it('has exactly 16 species', () => {
    expect(SPECIES).toHaveLength(16);
  });

  it('has unique ids', () => {
    const ids = SPECIES.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('has unique names', () => {
    const names = SPECIES.map((s) => s.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('every species has valid rarity', () => {
    const valid = ['common', 'uncommon', 'rare', 'legendary'];
    for (const s of SPECIES) {
      expect(valid).toContain(s.rarity);
    }
  });

  it('every species has valid shape', () => {
    const valid = ['blob', 'round', 'eared', 'sprout', 'horned', 'spiky', 'star', 'tall', 'cloud', 'mushroom', 'stone'];
    for (const s of SPECIES) {
      expect(valid).toContain(s.shape);
    }
  });

  it('every species has hue between 0 and 360', () => {
    for (const s of SPECIES) {
      expect(s.hue).toBeGreaterThanOrEqual(0);
      expect(s.hue).toBeLessThan(360);
    }
  });
});

describe('SPECIES_MAP', () => {
  it('maps all species by id', () => {
    for (const s of SPECIES) {
      expect(SPECIES_MAP[s.id]).toBe(s);
    }
  });

  it('has 16 entries', () => {
    expect(Object.keys(SPECIES_MAP)).toHaveLength(16);
  });
});

describe('SPECIES_BY_RARITY', () => {
  it('has non-empty arrays for each rarity', () => {
    expect(SPECIES_BY_RARITY.common.length).toBeGreaterThan(0);
    expect(SPECIES_BY_RARITY.uncommon.length).toBeGreaterThan(0);
    expect(SPECIES_BY_RARITY.rare.length).toBeGreaterThan(0);
    expect(SPECIES_BY_RARITY.legendary.length).toBeGreaterThan(0);
  });

  it('distributes 16 species across rarities correctly', () => {
    const total =
      SPECIES_BY_RARITY.common.length +
      SPECIES_BY_RARITY.uncommon.length +
      SPECIES_BY_RARITY.rare.length +
      SPECIES_BY_RARITY.legendary.length;
    expect(total).toBe(16);
  });

  it('matches species rarity to their assigned group', () => {
    for (const rarity of ['common', 'uncommon', 'rare', 'legendary'] as const) {
      for (const s of SPECIES_BY_RARITY[rarity]) {
        expect(s.rarity).toBe(rarity);
      }
    }
  });
});
