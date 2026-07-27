import { describe, expect, it } from 'vitest';
import { SPECIES, SPECIES_MAP } from './species';
import { GRID_SIZE } from '../constants';

describe('SPECIES', () => {
  it('defines at least 3 species with unique ids', () => {
    expect(SPECIES.length).toBeGreaterThanOrEqual(3);
    const ids = new Set(SPECIES.map((s) => s.id));
    expect(ids.size).toBe(SPECIES.length);
  });

  it('gives every species a non-empty set of cells within the grid bounds', () => {
    for (const species of SPECIES) {
      expect(species.cells.length).toBeGreaterThan(0);
      for (const cell of species.cells) {
        expect(cell.x).toBeGreaterThanOrEqual(0);
        expect(cell.x).toBeLessThan(GRID_SIZE);
        expect(cell.y).toBeGreaterThanOrEqual(0);
        expect(cell.y).toBeLessThan(GRID_SIZE);
      }
    }
  });

  it('indexes every species by id in SPECIES_MAP', () => {
    for (const species of SPECIES) {
      expect(SPECIES_MAP[species.id]).toBe(species);
    }
  });
});
