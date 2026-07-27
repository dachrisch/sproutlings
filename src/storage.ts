import type { SaveData } from './types';
import { SAVE_VERSION } from './constants';

const STORAGE_KEY = 'sproutlings-save';

function freshSave(): SaveData {
  return {
    version: SAVE_VERSION,
    monster: null,
    settings: { sound: true, reducedMotion: false },
  };
}

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return freshSave();
    const parsed = JSON.parse(raw) as SaveData;
    if (parsed.version !== SAVE_VERSION) return freshSave();
    return parsed;
  } catch {
    return freshSave();
  }
}

export function saveSave(data: SaveData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // storage unavailable (e.g. private browsing quota) — game continues in-memory
  }
}
