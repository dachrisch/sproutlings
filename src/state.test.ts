import { describe, expect, it } from 'vitest';
import { applyAction, applyDecay, createMonster, hasRunAway, moodFor, worstNeed } from './state';
import { CRITICAL_THRESHOLD, NEED_MAX, OFFLINE_CAP_MS, RUNAWAY_GRACE_MS } from './constants';
import type { Monster } from './types';

const HOUR = 60 * 60 * 1000;

function monsterAt(now: number, overrides: Partial<Monster> = {}): Monster {
  return {
    speciesId: 'blobbin',
    name: 'Sprout',
    hunger: NEED_MAX,
    happiness: NEED_MAX,
    cleanliness: NEED_MAX,
    energy: NEED_MAX,
    bornAt: now,
    lastUpdate: now,
    criticalSince: null,
    ...overrides,
  };
}

describe('createMonster', () => {
  it('starts every need at maximum', () => {
    const monster = createMonster(0, 'Sprout', 'blobbin');
    expect(monster.hunger).toBe(NEED_MAX);
    expect(monster.happiness).toBe(NEED_MAX);
    expect(monster.cleanliness).toBe(NEED_MAX);
    expect(monster.energy).toBe(NEED_MAX);
  });

  it('sets the given name', () => {
    const monster = createMonster(0, 'Sprout', 'blobbin');
    expect(monster.name).toBe('Sprout');
  });

  it('picks a species deterministically when a random function is given', () => {
    const monster = createMonster(0, 'Sprout', undefined, () => 0);
    expect(monster.speciesId).toBe('blobbin');
  });
});

describe('applyDecay', () => {
  it('reduces all needs based on elapsed hours', () => {
    const monster = monsterAt(0);
    const decayed = applyDecay(monster, 2 * HOUR);
    expect(decayed.hunger).toBeLessThan(monster.hunger);
    expect(decayed.happiness).toBeLessThan(monster.happiness);
    expect(decayed.cleanliness).toBeLessThan(monster.cleanliness);
    expect(decayed.energy).toBeLessThan(monster.energy);
  });

  it('never drops a need below zero', () => {
    const monster = monsterAt(0, { hunger: 2 });
    const decayed = applyDecay(monster, HOUR);
    expect(decayed.hunger).toBe(0);
  });

  it('caps the elapsed time used for decay at OFFLINE_CAP_MS', () => {
    const monster = monsterAt(0);
    const cappedResult = applyDecay(monster, OFFLINE_CAP_MS);
    const farFutureResult = applyDecay(monster, OFFLINE_CAP_MS * 100);
    expect(farFutureResult.hunger).toBe(cappedResult.hunger);
  });

  it('advances lastUpdate by the capped elapsed time, not the full gap', () => {
    const monster = monsterAt(0);
    const decayed = applyDecay(monster, OFFLINE_CAP_MS * 100);
    expect(decayed.lastUpdate).toBe(OFFLINE_CAP_MS);
  });

  it('sets criticalSince when a need first drops below the critical threshold', () => {
    const monster = monsterAt(0, { hunger: CRITICAL_THRESHOLD + 1 });
    const decayed = applyDecay(monster, HOUR);
    expect(decayed.criticalSince).not.toBeNull();
  });

  it('clears criticalSince once all needs are back above the critical threshold', () => {
    const monster = monsterAt(0, { hunger: 0, criticalSince: 0 });
    const decayed = applyDecay({ ...monster, hunger: NEED_MAX }, HOUR);
    expect(decayed.criticalSince).toBeNull();
  });
});

describe('hasRunAway', () => {
  it('is false when nothing has gone critical', () => {
    expect(hasRunAway(monsterAt(0))).toBe(false);
  });

  it('is false when critical but within the grace period', () => {
    const monster = monsterAt(RUNAWAY_GRACE_MS - 1, { criticalSince: 0 });
    expect(hasRunAway(monster)).toBe(false);
  });

  it('is true once the grace period has fully elapsed', () => {
    const monster = monsterAt(RUNAWAY_GRACE_MS, { criticalSince: 0 });
    expect(hasRunAway(monster)).toBe(true);
  });
});

describe('applyAction', () => {
  it('restores the targeted need after applying decay', () => {
    const monster = monsterAt(0, { hunger: 50 });
    const result = applyAction(monster, 'hunger', HOUR);
    expect(result.hunger).toBeGreaterThan(50);
  });

  it('does not affect other needs beyond their normal decay', () => {
    const monster = monsterAt(0);
    const decayedOnly = applyDecay(monster, HOUR);
    const result = applyAction(monster, 'hunger', HOUR);
    expect(result.happiness).toBe(decayedOnly.happiness);
  });

  it('never restores a need above NEED_MAX', () => {
    const monster = monsterAt(0, { hunger: NEED_MAX });
    const result = applyAction(monster, 'hunger', 0);
    expect(result.hunger).toBe(NEED_MAX);
  });
});

describe('worstNeed and moodFor', () => {
  it('worstNeed returns the lowest of the four needs', () => {
    const monster = monsterAt(0, { hunger: 40, happiness: 90, cleanliness: 60, energy: 80 });
    expect(worstNeed(monster)).toBe(40);
  });

  it('moodFor is sad when the worst need is below the sad threshold', () => {
    expect(moodFor(monsterAt(0, { hunger: 10 }))).toBe('sad');
  });

  it('moodFor is happy when even the worst need is above the happy threshold', () => {
    expect(moodFor(monsterAt(0))).toBe('happy');
  });

  it('moodFor is content in between', () => {
    expect(moodFor(monsterAt(0, { hunger: 50 }))).toBe('content');
  });
});
