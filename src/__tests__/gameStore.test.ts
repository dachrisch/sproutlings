import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '../store/gameStore';
import {
  STARTING_COINS, STARTING_SEEDS, STARTING_PLOTS, BASE_GROW_TIME_MS,
  SEED_PRICE, PLOT_CAP, MEADOW_TRICKLE_RATE,
} from '../constants';

beforeEach(() => {
  localStorage.clear();
  useGameStore.setState({
    ...useGameStore.getState(),
    coins: STARTING_COINS,
    seeds: STARTING_SEEDS,
    plotCount: STARTING_PLOTS,
    luckLevel: 0,
    ownedHats: [],
    plots: Array.from({ length: STARTING_PLOTS }, (_, i) => ({
      id: i,
      state: 'empty' as const,
    })),
    creatures: [],
    dex: {},
    lastUpdate: Date.now(),
    notification: null,
    celebration: null,
  });
});

describe('initial state', () => {
  it('starts with correct coins and seeds', () => {
    const s = useGameStore.getState();
    expect(s.coins).toBe(STARTING_COINS);
    expect(s.seeds).toBe(STARTING_SEEDS);
    expect(s.plotCount).toBe(STARTING_PLOTS);
  });

  it('starts with empty plots', () => {
    const s = useGameStore.getState();
    expect(s.plots).toHaveLength(STARTING_PLOTS);
    for (const p of s.plots) {
      expect(p.state).toBe('empty');
    }
  });

  it('starts with no creatures or dex entries', () => {
    const s = useGameStore.getState();
    expect(s.creatures).toHaveLength(0);
    expect(Object.keys(s.dex)).toHaveLength(0);
  });
});

describe('plantSeed', () => {
  it('plants a seed in an empty plot', () => {
    const ok = useGameStore.getState().plantSeed(0);
    expect(ok).toBe(true);
    const s = useGameStore.getState();
    expect(s.plots[0].state).toBe('growing');
    expect(s.plots[0].plantedAt).toBeGreaterThan(0);
    expect(s.plots[0].growMs).toBe(BASE_GROW_TIME_MS);
    expect(s.seeds).toBe(STARTING_SEEDS - 1);
  });

  it('fails with no seeds', () => {
    useGameStore.setState({ seeds: 0 });
    const ok = useGameStore.getState().plantSeed(0);
    expect(ok).toBe(false);
  });

  it('fails on a growing plot', () => {
    useGameStore.getState().plantSeed(0);
    const ok = useGameStore.getState().plantSeed(0);
    expect(ok).toBe(false);
  });

  it('fails on a ready plot', () => {
    useGameStore.setState({
      plots: [{ id: 0, state: 'ready' as const }],
    });
    const ok = useGameStore.getState().plantSeed(0);
    expect(ok).toBe(false);
  });
});

describe('waterPlot', () => {
  it('waters a growing plot and reduces time', () => {
    const s0 = useGameStore.getState();
    s0.plantSeed(0);
    const before = useGameStore.getState().plots[0];
    const remainingBefore = before.growMs! - (Date.now() - before.plantedAt!);

    const ok = useGameStore.getState().waterPlot(0);
    expect(ok).toBe(true);

    const after = useGameStore.getState().plots[0];
    expect(after.wateredAt).toBeGreaterThan(0);
    const remainingAfter = after.growMs! - (Date.now() - after.plantedAt!);
    expect(remainingAfter).toBeLessThan(remainingBefore);
  });

  it('fails on cooldown', () => {
    const s0 = useGameStore.getState();
    s0.plantSeed(0);
    useGameStore.getState().waterPlot(0);
    const ok = useGameStore.getState().waterPlot(0);
    expect(ok).toBe(false);
  });

  it('fails on empty plot', () => {
    const ok = useGameStore.getState().waterPlot(0);
    expect(ok).toBe(false);
  });
});

describe('hatchPlot', () => {
  it('hatches a ready egg into a creature', () => {
    useGameStore.setState({
      plots: [{ id: 0, state: 'ready' as const }],
    });
    const result = useGameStore.getState().hatchPlot(0);
    expect(result).not.toBeNull();
    expect(result!.creature.speciesId).toBeTruthy();
    expect(result!.speciesName).toBeTruthy();

    const s = useGameStore.getState();
    expect(s.creatures).toHaveLength(1);
    expect(s.plots[0].state).toBe('empty');
  });

  it('fails on empty plot', () => {
    const result = useGameStore.getState().hatchPlot(0);
    expect(result).toBeNull();
  });

  it('updates the dex on hatch', () => {
    useGameStore.setState({
      plots: [{ id: 0, state: 'ready' as const }],
    });
    useGameStore.getState().hatchPlot(0);
    const s = useGameStore.getState();
    const speciesId = s.creatures[0].speciesId;
    expect(s.dex[speciesId].normal).toBe(true);
  });
});

describe('shop', () => {
  it('buySeeds reduces coins and adds seeds', () => {
    const ok = useGameStore.getState().buySeeds();
    expect(ok).toBe(true);
    const s = useGameStore.getState();
    expect(s.seeds).toBe(STARTING_SEEDS + 1);
    expect(s.coins).toBe(STARTING_COINS - SEED_PRICE);
  });

  it('buySeeds fails with insufficient coins', () => {
    useGameStore.setState({ coins: 0 });
    const ok = useGameStore.getState().buySeeds();
    expect(ok).toBe(false);
  });

  it('buyPlot adds a new empty plot', () => {
    useGameStore.setState({ coins: 100 });
    const ok = useGameStore.getState().buyPlot();
    expect(ok).toBe(true);
    const s = useGameStore.getState();
    expect(s.plotCount).toBe(STARTING_PLOTS + 1);
    expect(s.plots).toHaveLength(STARTING_PLOTS + 1);
    expect(s.plots[s.plots.length - 1].state).toBe('empty');
  });

  it('buyPlot fails at cap', () => {
    useGameStore.setState({ plotCount: PLOT_CAP, plots: Array.from({ length: PLOT_CAP }, (_, i) => ({ id: i, state: 'empty' as const })) });
    const ok = useGameStore.getState().buyPlot();
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

    it('advances growing plots past their timer', () => {
    useGameStore.setState({
      lastUpdate: Date.now() - 2000,
      plots: [{
        id: 0,
        state: 'growing' as const,
        plantedAt: Date.now() - BASE_GROW_TIME_MS - 5000,
        growMs: BASE_GROW_TIME_MS,
      }],
    });
    useGameStore.getState().tick();
    const s = useGameStore.getState();
    expect(s.plots[0].state).toBe('ready');
  });

  it('accrues coins from meadow creatures', () => {
    useGameStore.setState({
      creatures: [{
        uid: 't1', speciesId: 'mossling', sparkle: false, hat: null,
        stage: 'adult', track: 'sturdy', stats: { vigor: 0, zip: 0, bond: 0 },
        fullness: 100, energy: 100, location: 'meadow', cooldowns: {},
      }],
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
      creatures: [{
        uid: 't1', speciesId: 'mossling', sparkle: false, hat: null,
        stage: 'adult', track: 'sturdy', stats: { vigor: 0, zip: 0, bond: 0 },
        fullness: 100, energy: 100, location: 'meadow', cooldowns: {},
      }],
      lastUpdate: Date.now() - 30_000,
      coins: 0,
    });
    const state = useGameStore.getState();
    state.processOffline();
    expect(useGameStore.getState().coins).toBeGreaterThan(0);
  });

  it('caps offline time at 8 hours', () => {
    useGameStore.setState({
      creatures: [{
        uid: 't1', speciesId: 'sunny', sparkle: false, hat: null,
        stage: 'adult', track: 'sleek', stats: { vigor: 0, zip: 0, bond: 0 },
        fullness: 100, energy: 100, location: 'meadow', cooldowns: {},
      }],
      lastUpdate: Date.now() - 100_000_000,
      coins: 0,
    });
    useGameStore.getState().processOffline();
    const maxEarn = MEADOW_TRICKLE_RATE * 8 * 60 * 60; // 8 hours at 0.05/s
    expect(useGameStore.getState().coins).toBeLessThanOrEqual(maxEarn + 1);
  });
});

describe('tab navigation', () => {
  it('sets tab correctly', () => {
    useGameStore.getState().setTab('collection');
    expect(useGameStore.getState().tab).toBe('collection');
    useGameStore.getState().setTab('shop');
    expect(useGameStore.getState().tab).toBe('shop');
    useGameStore.getState().setTab('garden');
    expect(useGameStore.getState().tab).toBe('garden');
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
