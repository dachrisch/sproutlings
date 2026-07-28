import { beforeEach, describe, expect, it } from 'vitest';
import { loadSave, saveSave } from './storage';
import { SAVE_VERSION } from './constants';
import type { SaveData } from './types';

describe('storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns a fresh save with no monster when nothing is stored', () => {
    const save = loadSave();
    expect(save.monster).toBeNull();
    expect(save.version).toBe(SAVE_VERSION);
  });

  it('round-trips a saved monster', () => {
    const data: SaveData = {
      version: SAVE_VERSION,
      monster: {
        speciesId: 'blobbin',
        name: 'Sprout',
        hunger: 80,
        happiness: 90,
        cleanliness: 70,
        energy: 60,
        bornAt: 1000,
        lastUpdate: 2000,
        criticalSince: null,
      },
      settings: { sound: true, reducedMotion: false },
    };
    saveSave(data);
    expect(loadSave()).toEqual(data);
  });

  it('falls back to a fresh save on a version mismatch', () => {
    localStorage.setItem(
      'sproutlings-save',
      JSON.stringify({ version: SAVE_VERSION - 1, monster: null, settings: {} }),
    );
    expect(loadSave().monster).toBeNull();
    expect(loadSave().version).toBe(SAVE_VERSION);
  });

  it('falls back to a fresh save on corrupt JSON without throwing', () => {
    localStorage.setItem('sproutlings-save', '{not valid json');
    expect(() => loadSave()).not.toThrow();
    expect(loadSave().monster).toBeNull();
  });
});
