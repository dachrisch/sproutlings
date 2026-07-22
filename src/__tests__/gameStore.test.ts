import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '../store/gameStore';
import {
  STARTING_COINS, STARTING_SLOTS, EXPEDITION_DURATION_MS,
  EXPEDITION_COST, SLOT_CAP, ZOO_RATE,
} from '../constants';

beforeEach(() => {
  localStorage.clear();
  useGameStore.setState({
    ...useGameStore.getState(),
    coins: STARTING_COINS,
    expeditionSlots: Array.from({ length: STARTING_SLOTS }, (_, i) => ({
      id: i,
      state: 'idle' as const,
    })),
    slotCount: STARTING_SLOTS,
    luckLevel: 0,
    ownedHats: [],
    creatures: [],
    dex: {},
    lastUpdate: Date.now(),
    notification: null,
    celebration: null,
  });
});

describe('initial state', () => {
  it('starts with correct coins and slots', () => {
    const s = useGameStore.getState();
    expect(s.coins).toBe(STARTING_COINS);
    expect(s.slotCount).toBe(STARTING_SLOTS);
  });

  it('starts with idle expedition slots', () => {
    const s = useGameStore.getState();
    expect(s.expeditionSlots).toHaveLength(STARTING_SLOTS);
    for (const sl of s.expeditionSlots) {
      expect(sl.state).toBe('idle');
    }
  });

  it('starts with no creatures or dex entries', () => {
    const s = useGameStore.getState();
    expect(s.creatures).toHaveLength(0);
    expect(Object.keys(s.dex)).toHaveLength(0);
  });
});

describe('startExpedition', () => {
  it('starts an expedition on idle slot', () => {
    const ok = useGameStore.getState().startExpedition(0);
    expect(ok).toBe(true);
    const s = useGameStore.getState();
    expect(s.expeditionSlots[0].state).toBe('exploring');
    expect(s.expeditionSlots[0].startedAt).toBeGreaterThan(0);
    expect(s.expeditionSlots[0].durationMs).toBe(EXPEDITION_DURATION_MS);
    expect(s.coins).toBe(STARTING_COINS - EXPEDITION_COST);
  });

  it('fails with insufficient coins', () => {
    useGameStore.setState({ coins: 0 });
    const ok = useGameStore.getState().startExpedition(0);
    expect(ok).toBe(false);
  });

  it('fails on exploring slot', () => {
    useGameStore.getState().startExpedition(0);
    const ok = useGameStore.getState().startExpedition(0);
    expect(ok).toBe(false);
  });

  it('fails on returned slot', () => {
    useGameStore.setState({
      expeditionSlots: [{ id: 0, state: 'returned' as const }],
    });
    const ok = useGameStore.getState().startExpedition(0);
    expect(ok).toBe(false);
  });
});

describe('collectExpedition', () => {
  it('collects a returned expedition into a creature', () => {
    useGameStore.setState({
      expeditionSlots: [{ id: 0, state: 'returned' as const }],
    });
    const result = useGameStore.getState().collectExpedition(0);
    expect(result).not.toBeNull();
    expect(result!.creature.speciesId).toBeTruthy();
    expect(result!.speciesName).toBeTruthy();
    expect(result!.treasure).toBeGreaterThanOrEqual(2);

    const s = useGameStore.getState();
    expect(s.creatures).toHaveLength(1);
    expect(s.expeditionSlots[0].state).toBe('idle');
  });

  it('fails on idle slot', () => {
    const result = useGameStore.getState().collectExpedition(0);
    expect(result).toBeNull();
  });

  it('updates the dex on collect', () => {
    useGameStore.setState({
      expeditionSlots: [{ id: 0, state: 'returned' as const }],
    });
    useGameStore.getState().collectExpedition(0);
    const s = useGameStore.getState();
    const speciesId = s.creatures[0].speciesId;
    expect(s.dex[speciesId].normal).toBe(true);
  });
});

describe('shop', () => {
  it('buySlot adds a new idle slot', () => {
    useGameStore.setState({ coins: 100 });
    const ok = useGameStore.getState().buySlot();
    expect(ok).toBe(true);
    const s = useGameStore.getState();
    expect(s.slotCount).toBe(STARTING_SLOTS + 1);
    expect(s.expeditionSlots).toHaveLength(STARTING_SLOTS + 1);
    expect(s.expeditionSlots[s.expeditionSlots.length - 1].state).toBe('idle');
  });

  it('buySlot fails at cap', () => {
    useGameStore.setState({
      slotCount: SLOT_CAP,
      expeditionSlots: Array.from({ length: SLOT_CAP }, (_, i) => ({ id: i, state: 'idle' as const })),
      coins: 9999,
    });
    const ok = useGameStore.getState().buySlot();
    expect(ok).toBe(false);
  });

  it('buyLuckUpgrade increases luck level', () => {
    useGameStore.setState({ coins: 100 });
    const ok = useGameStore.getState().buyLuckUpgrade();
    expect(ok).toBe(true);
    expect(useGameStore.getState().luckLevel).toBe(1);
  });

  it('buyHatBox adds a hat', () => {
    useGameStore.setState({ coins: 100 });
    const ok = useGameStore.getState().buyHatBox();
    expect(ok).not.toBeNull();
    expect(useGameStore.getState().ownedHats).toHaveLength(1);
  });
});

describe('tick', () => {
  it('does not crash when called', () => {
    expect(() => useGameStore.getState().tick()).not.toThrow();
  });

  it('completes expeditions past their timer', () => {
    useGameStore.setState({
      lastUpdate: Date.now() - 2000,
      expeditionSlots: [{
        id: 0,
        state: 'exploring' as const,
        startedAt: Date.now() - EXPEDITION_DURATION_MS - 5000,
        durationMs: EXPEDITION_DURATION_MS,
      }],
    });
    useGameStore.getState().tick();
    const s = useGameStore.getState();
    expect(s.expeditionSlots[0].state).toBe('returned');
  });

  it('accrues coins from zoo creatures', () => {
    useGameStore.setState({
      creatures: [{ uid: 't1', speciesId: 'mossling', sparkle: false, hat: null }],
      lastUpdate: Date.now() - 2000,
    });
    useGameStore.getState().tick();
    expect(useGameStore.getState().coins).toBeGreaterThan(STARTING_COINS);
  });
});

describe('processOffline', () => {
  it('returns null when no meaningful time passed', () => {
    useGameStore.setState({ lastUpdate: Date.now() });
    const msg = useGameStore.getState().processOffline();
    expect(msg).toBeNull();
  });

  it('accrues coins for offline time', () => {
    useGameStore.setState({
      creatures: [{ uid: 't1', speciesId: 'mossling', sparkle: false, hat: null }],
      lastUpdate: Date.now() - 30_000,
      coins: 0,
    });
    const state = useGameStore.getState();
    state.processOffline();
    expect(useGameStore.getState().coins).toBeGreaterThan(0);
  });

  it('caps offline time at 8 hours', () => {
    useGameStore.setState({
      creatures: [{ uid: 't1', speciesId: 'sunny', sparkle: false, hat: null }],
      lastUpdate: Date.now() - 100_000_000,
      coins: 0,
    });
    useGameStore.getState().processOffline();
    const maxEarn = ZOO_RATE * 8 * 60 * 60;
    expect(useGameStore.getState().coins).toBeLessThanOrEqual(maxEarn + 1);
  });
});

describe('tab navigation', () => {
  it('sets tab correctly', () => {
    useGameStore.getState().setTab('collection');
    expect(useGameStore.getState().tab).toBe('collection');
    useGameStore.getState().setTab('shop');
    expect(useGameStore.getState().tab).toBe('shop');
    useGameStore.getState().setTab('zoo');
    expect(useGameStore.getState().tab).toBe('zoo');
  });
});

describe('settings', () => {
  it('toggles sound', () => {
    const before = useGameStore.getState().settings.sound;
    useGameStore.getState().toggleSound();
    expect(useGameStore.getState().settings.sound).toBe(!before);
  });

  it('toggles reduced motion', () => {
    const before = useGameStore.getState().settings.reducedMotion;
    useGameStore.getState().toggleReducedMotion();
    expect(useGameStore.getState().settings.reducedMotion).toBe(!before);
  });
});
