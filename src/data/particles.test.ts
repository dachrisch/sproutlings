import { describe, expect, it } from 'vitest';
import { PARTICLES, PARTICLES_MAP } from './particles';
import { GRID_SIZE } from '../constants';

describe('PARTICLES', () => {
  it('defines the 13 expected particle/overlay shapes with unique ids', () => {
    const ids = new Set(PARTICLES.map((p) => p.id));
    expect(ids.size).toBe(PARTICLES.length);
    expect(ids).toEqual(
      new Set([
        'particle-morsel',
        'particle-star',
        'particle-droplet',
        'particle-zzz',
        'particle-poof',
        'egg-crack-1',
        'egg-crack-2',
        'prop-food-bowl',
        'prop-food-morsel',
        'prop-pillow',
        'prop-ball',
        'prop-bubbles',
        'prop-sponge',
      ]),
    );
  });

  it('gives every particle a non-empty set of cells within the grid bounds', () => {
    for (const particle of PARTICLES) {
      expect(particle.cells.length).toBeGreaterThan(0);
      for (const cell of particle.cells) {
        expect(cell.x).toBeGreaterThanOrEqual(0);
        expect(cell.x).toBeLessThan(GRID_SIZE);
        expect(cell.y).toBeGreaterThanOrEqual(0);
        expect(cell.y).toBeLessThan(GRID_SIZE);
      }
    }
  });

  it('indexes every particle by id in PARTICLES_MAP', () => {
    for (const particle of PARTICLES) {
      expect(PARTICLES_MAP[particle.id]).toBe(particle);
    }
  });
});
