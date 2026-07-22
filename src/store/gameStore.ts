import { create } from 'zustand';
import type { GameState, Tab, Plot, OwnedCreature, DexEntry, Rarity } from '../types';
import {
  STARTING_COINS, STARTING_SEEDS, STARTING_PLOTS, SAVE_VERSION,
  BASE_GROW_TIME_MS, WATERING_EFFECT, WATERING_COOLDOWN_MS,
  SPARKLE_BASE_CHANCE, SPARKLE_PER_LUCK_LEVEL, SPARKLE_CHANCE_CAP,
  LUCK_LEVEL_CAP, SEED_PRICE, plotPrice, PLOT_CAP, luckUpgradePrice,
  HAT_BOX_PRICE, OFFLINE_ACCRUAL_CAP_MS, NEW_SPECIES_BONUS,
  RARITY_WEIGHTS, HATS, AUTOSAVE_INTERVAL_MS,
} from '../constants';
import { SPECIES_MAP, SPECIES_BY_RARITY } from '../data/species';
import { load, save } from '../storage';

export interface HatchResult {
  creature: OwnedCreature;
  speciesName: string;
  isNewNormal: boolean;
  isNewSparkle: boolean;
  bonus: number;
  sparkle: boolean;
}

function freshGame(): GameState {
  const now = Date.now();
  return {
    version: SAVE_VERSION,
    createdAt: now,
    lastUpdate: now,
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
    settings: { reducedMotion: false, sound: true },
  };
}

function rollRarity(): Rarity {
  const roll = Math.random();
  let cum = 0;
  for (const [rarity, data] of Object.entries(RARITY_WEIGHTS)) {
    cum += data.weight;
    if (roll < cum) return rarity as Rarity;
  }
  return 'common';
}

function rollSparkle(luckLevel: number): boolean {
  const chance = Math.min(
    SPARKLE_BASE_CHANCE + luckLevel * SPARKLE_PER_LUCK_LEVEL,
    SPARKLE_CHANCE_CAP
  );
  return Math.random() < chance;
}

export interface GameStore extends GameState {
  tab: Tab;
  notification: string | null;
  setTab: (tab: Tab) => void;
  resetGame: () => void;
  clearNotification: () => void;
  plantSeed: (plotId: number) => boolean;
  waterPlot: (plotId: number) => boolean;
  hatchPlot: (plotId: number) => HatchResult | null;
  buySeeds: () => boolean;
  buyPlot: () => boolean;
  buyLuckUpgrade: () => boolean;
  buyHatBox: () => boolean;
  tick: () => void;
  processOffline: () => string | null;
}

const initial = load() ?? freshGame();

export const useGameStore = create<GameStore>((set, get) => ({
  ...initial,
  tab: 'garden',
  notification: null,

  setTab: (tab) => set({ tab }),
  clearNotification: () => set({ notification: null }),
  resetGame: () => {
    const fresh = freshGame();
    set(fresh as unknown as GameStore);
    save(fresh);
  },

  plantSeed: (plotId) => {
    const s = get();
    const plot = s.plots.find((p) => p.id === plotId);
    if (!plot || plot.state !== 'empty' || s.seeds < 1) return false;
    const now = Date.now();
    set({
      seeds: s.seeds - 1,
      plots: s.plots.map((p) =>
        p.id === plotId
          ? { ...p, state: 'growing', plantedAt: now, growMs: BASE_GROW_TIME_MS }
          : p
      ),
      lastUpdate: now,
    });
    return true;
  },

  waterPlot: (plotId) => {
    const s = get();
    const plot = s.plots.find((p) => p.id === plotId);
    if (!plot || plot.state !== 'growing' || !plot.plantedAt || !plot.growMs) return false;
    const now = Date.now();
    if (plot.wateredAt && now - plot.wateredAt < WATERING_COOLDOWN_MS) return false;
    const elapsed = now - plot.plantedAt;
    const remaining = plot.growMs - elapsed;
    if (remaining <= 0) return false;
    const newRemaining = remaining * (1 - WATERING_EFFECT);
    const newPlantedAt = now - (plot.growMs - newRemaining);
    set({
      plots: s.plots.map((p) =>
        p.id === plotId ? { ...p, wateredAt: now, plantedAt: newPlantedAt } : p
      ),
    });
    return true;
  },

  hatchPlot: (plotId) => {
    const s = get();
    const plot = s.plots.find((p) => p.id === plotId);
    if (!plot || plot.state !== 'ready') return null;

    const rarity = rollRarity();
    const pool = SPECIES_BY_RARITY[rarity];
    const species = pool[Math.floor(Math.random() * pool.length)];
    const sparkle = rollSparkle(s.luckLevel);
    const uid = crypto.randomUUID();
    const creature: OwnedCreature = { uid, speciesId: species.id, sparkle, hat: null };

    const prev = s.dex[species.id];
    const isNewNormal = !prev?.normal;
    const isNewSparkle = sparkle && !prev?.sparkle;
    const newDex: Record<string, DexEntry> = {
      ...s.dex,
      [species.id]: { normal: true, sparkle: prev?.sparkle || sparkle },
    };
    let bonus = 0;
    if (isNewNormal) bonus += NEW_SPECIES_BONUS;
    if (isNewSparkle) bonus += NEW_SPECIES_BONUS;

    set({
      plots: s.plots.map((p) => (p.id === plotId ? { id: p.id, state: 'empty' } : p)),
      creatures: [...s.creatures, creature],
      dex: newDex,
      coins: s.coins + bonus,
      lastUpdate: Date.now(),
    });
    const result: HatchResult = {
      creature,
      speciesName: species.name,
      isNewNormal,
      isNewSparkle,
      bonus,
      sparkle,
    };
    return result;
  },

  buySeeds: () => {
    const s = get();
    if (s.coins < SEED_PRICE) return false;
    set({ coins: s.coins - SEED_PRICE, seeds: s.seeds + 1 });
    return true;
  },

  buyPlot: () => {
    const s = get();
    if (s.plotCount >= PLOT_CAP) return false;
    const price = plotPrice(s.plotCount);
    if (s.coins < price) return false;
    const newPlot: Plot = { id: s.plotCount, state: 'empty' };
    set({
      coins: s.coins - price,
      plotCount: s.plotCount + 1,
      plots: [...s.plots, newPlot],
    });
    return true;
  },

  buyLuckUpgrade: () => {
    const s = get();
    if (s.luckLevel >= LUCK_LEVEL_CAP) return false;
    const price = luckUpgradePrice(s.luckLevel);
    if (s.coins < price) return false;
    set({ coins: s.coins - price, luckLevel: s.luckLevel + 1 });
    return true;
  },

  buyHatBox: () => {
    const s = get();
    if (s.ownedHats.length >= HATS.length) return false;
    if (s.coins < HAT_BOX_PRICE) return false;
    const remaining = HATS.filter((h) => !s.ownedHats.includes(h));
    const hat = remaining[0];
    if (!hat) return false;
    set({
      coins: s.coins - HAT_BOX_PRICE,
      ownedHats: [...s.ownedHats, hat],
    });
    return true;
  },

  tick: () => {
    const s = get();
    const now = Date.now();
    const elapsed = (now - s.lastUpdate) / 1000;
    if (elapsed < 0.5) return;

    const meadowRate = s.creatures.reduce((sum, c) => {
      const species = SPECIES_MAP[c.speciesId];
      if (!species) return sum;
      return sum + species.coinsPerSec * (c.sparkle ? 2 : 1);
    }, 0);
    const coinsGained = meadowRate * elapsed;

    const updatedPlots = s.plots.map((plot) => {
      if (plot.state === 'growing' && plot.plantedAt && plot.growMs) {
        if (now - plot.plantedAt >= plot.growMs) {
          return { ...plot, state: 'ready' as const };
        }
      }
      return plot;
    });

    set({
      coins: s.coins + coinsGained,
      plots: updatedPlots,
      lastUpdate: now,
    });
  },

  processOffline: () => {
    const s = get();
    const now = Date.now();
    const rawElapsed = now - s.lastUpdate;
    const elapsed = Math.min(rawElapsed, OFFLINE_ACCRUAL_CAP_MS) / 1000;
    if (elapsed < 1) return null;

    const meadowRate = s.creatures.reduce((sum, c) => {
      const species = SPECIES_MAP[c.speciesId];
      if (!species) return sum;
      return sum + species.coinsPerSec * (c.sparkle ? 2 : 1);
    }, 0);
    const coinsGained = meadowRate * elapsed;

    const updatedPlots = s.plots.map((plot) => {
      if (plot.state === 'growing' && plot.plantedAt && plot.growMs) {
        if (now - plot.plantedAt >= plot.growMs) {
          return { ...plot, state: 'ready' as const };
        }
      }
      return plot;
    });

    const coinFloor = Math.floor(s.coins + coinsGained) - Math.floor(s.coins);
    const readyCount = updatedPlots.filter(
      (p) => p.state === 'ready' && s.plots.find((op) => op.id === p.id)?.state !== 'ready'
    ).length;

    set({
      coins: s.coins + coinsGained,
      plots: updatedPlots,
      lastUpdate: now,
    });

    if (coinFloor > 0 || readyCount > 0) {
      const parts: string[] = [];
      if (coinFloor > 0) parts.push(`earned ${coinFloor} coins`);
      if (readyCount > 0) parts.push(`${readyCount} egg${readyCount > 1 ? 's' : ''} ready`);
      return `Welcome back! You ${parts.join(' and ')}.`;
    }
    return null;
  },
}));

let autosaveTimer: ReturnType<typeof setTimeout> | null = null;
function scheduleAutosave(state: GameStore) {
  if (autosaveTimer) clearTimeout(autosaveTimer);
  autosaveTimer = setTimeout(() => save(state), AUTOSAVE_INTERVAL_MS);
}

const origSet = useGameStore.setState;
useGameStore.setState = (partial) => {
  origSet(partial);
  scheduleAutosave(useGameStore.getState());
};

if (typeof window !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      const state = useGameStore.getState();
      state.tick();
      save(useGameStore.getState());
    }
  });
}
