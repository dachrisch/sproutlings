export const SAVE_VERSION = 5;
export const STORAGE_KEY = 'monster-collector-save';

export const PARTY_MAX = 6;
export const LEVEL_CAP = 20;
export const STARTING_BALLS = 10;
export const BALL_BONUS = 1.0;

export const BASE_XP_FACTOR = 5;

export function xpForLevel(n: number): number {
  return n * n * n;
}

export function recomputeStat(base: number, level: number): number {
  return Math.floor(base * (1 + level * 0.08));
}

export function healCost(_creatureLevel: number): number {
  return 0;
}

export const BIOME_BOSS_WINS_REQUIRED = 5;
