import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NEED_MAX } from './constants';

async function freshStore() {
  vi.resetModules();
  return import('./store');
}

describe('store', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('has no monster before hatching', async () => {
    const store = await freshStore();
    expect(store.getMonster()).toBeNull();
  });

  it('hatchNewMonster creates and persists a monster', async () => {
    const store = await freshStore();
    store.hatchNewMonster();
    expect(store.getMonster()).not.toBeNull();
    expect(store.getMonster()?.hunger).toBe(NEED_MAX);

    const speciesId = store.getMonster()?.speciesId;
    vi.resetModules();
    const reloaded = await import('./store');
    expect(reloaded.getMonster()?.speciesId).toBe(speciesId);
  });

  it('performAction restores the targeted need', async () => {
    const store = await freshStore();
    store.hatchNewMonster();
    store.performAction('hunger');
    expect(store.getMonster()!.hunger).toBe(NEED_MAX);
  });

  it('emits monster-updated on hatch and on action', async () => {
    const store = await freshStore();
    const { bus, EVENTS } = await import('./bus');
    const seen: unknown[] = [];
    bus.on(EVENTS.MONSTER_UPDATED, (monster: unknown) => seen.push(monster));
    store.hatchNewMonster();
    store.performAction('hunger');
    expect(seen).toHaveLength(2);
  });

  it('tick with no monster does nothing and does not throw', async () => {
    const store = await freshStore();
    expect(() => store.tick()).not.toThrow();
    expect(store.getMonster()).toBeNull();
  });
});
