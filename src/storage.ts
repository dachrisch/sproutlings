import type { SaveData } from './types';
import { SAVE_VERSION, STORAGE_KEY } from './constants';

export function load(): SaveData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed.schemaVersion !== SAVE_VERSION) {
      return null;
    }
    return parsed as SaveData;
  } catch {
    return null;
  }
}

export function save(state: SaveData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
  }
}

export function clear(): void {
  localStorage.removeItem(STORAGE_KEY);
}
