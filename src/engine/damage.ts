import type { MonsterType } from '../types';
import type { Rng } from './rng';
import { random } from './rng';
import typeData from '../data/types.json';

interface TypeChart {
  types: string[];
  chart: Record<string, Record<string, number>>;
}

const chart: TypeChart = typeData as TypeChart;

export function typeMultiplier(attackType: MonsterType, defendType: MonsterType): number {
  return chart.chart[attackType]?.[defendType] ?? 1;
}

export interface DamageResult {
  damage: number;
  didHit: boolean;
  effectiveness: number;
}

export function calcDamage(
  level: number,
  power: number,
  atk: number,
  def: number,
  accuracy: number,
  rng: Rng,
  attackerType: MonsterType,
  defenderType: MonsterType,
): DamageResult {
  if (random(rng) > accuracy) {
    return { damage: 0, didHit: false, effectiveness: 1 };
  }

  const effectiveness = typeMultiplier(attackerType, defenderType);
  const base = Math.floor(((2 * level / 5 + 2) * power * atk / def) / 50) + 2;
  const variance = 0.85 + random(rng) * 0.15;
  const damage = Math.max(1, Math.floor(base * effectiveness * variance));

  return { damage, didHit: true, effectiveness };
}
