import { describe, it, expect, beforeEach } from 'vitest';
import { load, save, clear } from '../storage';
import type { GameState } from '../types';
import { SAVE_VERSION } from '../constants';

const mockState: GameState = {
  version: SAVE_VERSION,
  createdAt: 1000,
  lastUpdate: 2000,
  coins: 50,
  expeditionSlots: [
    { id: 0, state: 'idle' },
    { id: 1, state: 'exploring', startedAt: 1500, durationMs: 30000 },
  ],
  slotCount: 2,
  luckLevel: 1,
  ownedHats: ['crown'],
  creatures: [
    { uid: 'c1', speciesId: 'mossling', sparkle: false, hat: null, level: 1, xp: 0, happiness: 50, stage: 'baby', training: 'none' },
  ],
  dex: { mossling: { normal: true, sparkle: false } },
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
    expect(loaded!.slotCount).toBe(2);
  });

  it('returns null when no save exists', () => {
    expect(load()).toBeNull();
  });

  it('preserves nested data', () => {
    save(mockState);
    const loaded = load()!;
    expect(loaded.expeditionSlots).toHaveLength(2);
    expect(loaded.expeditionSlots[1].state).toBe('exploring');
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
