import type { GameState } from './types';
import { SAVE_VERSION } from './constants';

const STORAGE_KEY = 'sproutlings-save';

export function load(): GameState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GameState;
    if (typeof parsed !== 'object' || parsed.version !== SAVE_VERSION) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function save(state: GameState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
  }
}

export function clear(): void {
  localStorage.removeItem(STORAGE_KEY);
}
