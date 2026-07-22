import { describe, it, expect, beforeEach } from 'vitest';
import { load, save, clear } from '../storage';
import type { GameState } from '../types';
import { SAVE_VERSION } from '../constants';

const mockState: GameState = {
  version: SAVE_VERSION,
  createdAt: 1000,
  lastUpdate: 2000,
  coins: 50,
  seeds: 2,
  plotCount: 4,
  luckLevel: 1,
  ownedHats: ['crown'],
  plots: [
    { id: 0, state: 'empty' },
    { id: 1, state: 'growing', plantedAt: 1500, growMs: 30_000 },
    { id: 2, state: 'ready' },
    { id: 3, state: 'empty' },
  ],
  inventory: { food: 0, toys: 0 },
  creatures: [
    { uid: 'c1', speciesId: 'mossling', sparkle: false, hat: null, stage: 'baby', track: null, stats: { vigor: 0, zip: 0, bond: 0 }, fullness: 100, energy: 100, location: 'nursery', cooldowns: {} },
  ],
  dex: { mossling: { normal: true, sparkle: false, formsRaised: [] } },
  settings: { reducedMotion: false, sound: true },
};

beforeEach(() => {
  localStorage.clear();
});

describe('save and load', () => {
  it('saves and loads a valid state', () => {
    save(mockState);
    const loaded = load();
    expect(loaded).not.toBeNull();
    expect(loaded!.coins).toBe(50);
    expect(loaded!.seeds).toBe(2);
    expect(loaded!.plotCount).toBe(4);
  });

  it('returns null when no save exists', () => {
    expect(load()).toBeNull();
  });

  it('preserves nested data', () => {
    save(mockState);
    const loaded = load()!;
    expect(loaded.plots).toHaveLength(4);
    expect(loaded.plots[1].state).toBe('growing');
    expect(loaded.creatures).toHaveLength(1);
    expect(loaded.dex.mossling.normal).toBe(true);
  });
});

describe('version migration', () => {
  it('returns null for version mismatch', () => {
    const bad = { ...mockState, version: 999 };
    save(bad);
    expect(load()).toBeNull();
  });

  it('returns null for malformed data', () => {
    localStorage.setItem('sproutlings-save', '{bad json');
    expect(load()).toBeNull();
  });

  it('returns null for non-object data', () => {
    localStorage.setItem('sproutlings-save', '"string"');
    expect(load()).toBeNull();
  });
});

describe('clear', () => {
  it('removes saved data', () => {
    save(mockState);
    clear();
    expect(load()).toBeNull();
  });
});
