import type { Monster, Need } from './types';
import {
  NEED_MAX,
  NEED_START,
  DECAY_PER_HOUR,
  CRITICAL_THRESHOLD,
  SAD_THRESHOLD,
  HAPPY_THRESHOLD,
  RUNAWAY_GRACE_MS,
  OFFLINE_CAP_MS,
  ACTION_RESTORE_AMOUNT,
} from './constants';
import { SPECIES } from './data/species';

export type Mood = 'sad' | 'content' | 'happy';

function clamp(value: number): number {
  return Math.max(0, Math.min(NEED_MAX, value));
}

export function createMonster(
  now: number,
  name: string,
  speciesId?: string,
  random: () => number = Math.random,
): Monster {
  const id = speciesId ?? SPECIES[Math.floor(random() * SPECIES.length)].id;
  return {
    speciesId: id,
    name,
    hunger: NEED_START,
    happiness: NEED_START,
    cleanliness: NEED_START,
    energy: NEED_START,
    bornAt: now,
    lastUpdate: now,
    criticalSince: null,
  };
}

export function applyDecay(monster: Monster, now: number): Monster {
  const elapsedMs = Math.min(Math.max(now - monster.lastUpdate, 0), OFFLINE_CAP_MS);
  if (elapsedMs === 0) return monster;

  const effectiveNow = monster.lastUpdate + elapsedMs;
  const drop = (elapsedMs / (60 * 60 * 1000)) * DECAY_PER_HOUR;

  const hunger = clamp(monster.hunger - drop);
  const happiness = clamp(monster.happiness - drop);
  const cleanliness = clamp(monster.cleanliness - drop);
  const energy = clamp(monster.energy - drop);
  const anyCritical = [hunger, happiness, cleanliness, energy].some((need) => need < CRITICAL_THRESHOLD);

  return {
    ...monster,
    hunger,
    happiness,
    cleanliness,
    energy,
    lastUpdate: effectiveNow,
    criticalSince: anyCritical ? (monster.criticalSince ?? effectiveNow) : null,
  };
}

export function hasRunAway(monster: Monster): boolean {
  if (monster.criticalSince === null) return false;
  return monster.lastUpdate - monster.criticalSince >= RUNAWAY_GRACE_MS;
}

export function applyAction(monster: Monster, need: Need, now: number): Monster {
  const decayed = applyDecay(monster, now);
  return { ...decayed, [need]: clamp(decayed[need] + ACTION_RESTORE_AMOUNT) };
}

export function worstNeed(monster: Monster): number {
  return Math.min(monster.hunger, monster.happiness, monster.cleanliness, monster.energy);
}

export function moodFor(monster: Monster): Mood {
  const worst = worstNeed(monster);
  if (worst < SAD_THRESHOLD) return 'sad';
  if (worst > HAPPY_THRESHOLD) return 'happy';
  return 'content';
}
