import type { Rng } from './rng';
import { random } from './rng';
import type { CatchResult } from '../types';

export function catchProbability(maxHp: number, currentHp: number, catchRate: number, ballBonus: number): number {
  const hpFactor = (3 * maxHp - 2 * currentHp) / (3 * Math.max(maxHp, 1));
  const chance = hpFactor * catchRate * ballBonus;
  return Math.min(Math.max(chance, 0.05), 0.95);
}

export function attemptCatch(maxHp: number, currentHp: number, catchRate: number, ballBonus: number, rng: Rng): CatchResult {
  const chance = catchProbability(maxHp, currentHp, catchRate, ballBonus);
  let shakes = 0;
  for (let i = 0; i < 3; i++) {
    if (random(rng) < chance) {
      shakes++;
    }
  }
  return { success: shakes === 3, shakes };
}
