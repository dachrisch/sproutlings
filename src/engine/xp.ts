import type { PartyCreature } from '../types';
import creaturesData from '../data/creatures.json';

interface CreatureRecord {
  id: string;
  baseStats: { hp: number; atk: number; def: number; spd: number };
}

const creatures: CreatureRecord[] = creaturesData as CreatureRecord[];

export function xpGainValue(baseXp: number, enemyLevel: number): number {
  return Math.max(1, Math.floor(baseXp * enemyLevel / 5));
}

export function xpForLevel(n: number): number {
  return n * n * n;
}

export function xpToNextLevel(currentXp: number, currentLevel: number): number {
  if (currentLevel >= 20) return 0;
  return xpForLevel(currentLevel + 1) - currentXp;
}

export function recomputeStats(creatureId: string, level: number): { maxHp: number; atk: number; def: number; spd: number } {
  const defn = creatures.find(c => c.id === creatureId);
  if (!defn) throw new Error(`Unknown creature: ${creatureId}`);
  const s = defn.baseStats;
  return {
    maxHp: Math.floor(s.hp * (1 + level * 0.08)),
    atk: Math.floor(s.atk * (1 + level * 0.08)),
    def: Math.floor(s.def * (1 + level * 0.08)),
    spd: Math.floor(s.spd * (1 + level * 0.08)),
  };
}

export function applyLevelUp(creature: PartyCreature, xpGained: number): { creature: PartyCreature; leveledUp: boolean; newLevel: number } {
  const newXp = creature.xp + xpGained;
  let newLevel = creature.level;

  while (newLevel < 20 && xpForLevel(newLevel + 1) <= newXp) {
    newLevel++;
  }

  const leveledUp = newLevel > creature.level;

  if (!leveledUp) {
    return { creature: { ...creature, xp: newXp }, leveledUp: false, newLevel: creature.level };
  }

  const stats = recomputeStats(creature.creatureId, newLevel);
  const hpGain = stats.maxHp - creature.maxHp;

  return {
    creature: {
      ...creature,
      level: newLevel,
      xp: newXp,
      maxHp: stats.maxHp,
      atk: stats.atk,
      def: stats.def,
      spd: stats.spd,
      currentHp: creature.currentHp + Math.max(0, hpGain),
    },
    leveledUp: true,
    newLevel,
  };
}
