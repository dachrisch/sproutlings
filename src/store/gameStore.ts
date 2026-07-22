import { create } from 'zustand';
import type { GameState, Tab, Plot, OwnedCreature, DexEntry, Rarity, Stat, Stage, Track } from '../types';
import {
  STARTING_COINS, STARTING_SEEDS, STARTING_PLOTS, SAVE_VERSION,
  BASE_GROW_TIME_MS, WATERING_EFFECT, WATERING_COOLDOWN_MS,
  SPARKLE_BASE_CHANCE, SPARKLE_PER_LUCK_LEVEL, SPARKLE_CHANCE_CAP,
  LUCK_LEVEL_CAP, SEED_PRICE, plotPrice, PLOT_CAP, luckUpgradePrice,
  HAT_BOX_PRICE, OFFLINE_ACCRUAL_CAP_MS, NEW_SPECIES_BONUS,
  RARITY_WEIGHTS, HATS, AUTOSAVE_INTERVAL_MS,
  NURSERY_SLOTS, STARTING_FULLNESS, STARTING_ENERGY,
  FEED_AMOUNT, PLAY_AMOUNT,
  TRAIN_COST_FULLNESS, TRAIN_COST_ENERGY, SPAR_COST_ENERGY,
  TRAIN_COOLDOWN_MS, STAT_XP_WELL_TIMED, STAT_XP_ROUGH, STAT_XP_SPAR,
  STAGE_UP_THRESHOLD_TEEN, STAGE_UP_THRESHOLD_ADULT,
  FOOD_PRICE, TOY_PRICE,
  TRAIN_COIN_REWARD_MIN, TRAIN_COIN_REWARD_MAX, SPAR_COIN_REWARD,
  STAGE_UP_BONUS, NEW_FORM_BONUS, MEADOW_TRICKLE_RATE,
} from '../constants';
import { SPECIES_MAP, SPECIES_BY_RARITY } from '../data/species';
import { load, save } from '../storage';

export interface HatchResult {
  creature: OwnedCreature;
  speciesName: string;
  speciesId: string;
  isNewNormal: boolean;
  isNewSparkle: boolean;
  bonus: number;
  sparkle: boolean;
  location: 'nursery' | 'reserve';
}

export interface TrainResult {
  xp: number;
  coins: number;
  wellTimed: boolean;
  newStage?: Stage;
  newTrack?: Track;
  isNewForm?: boolean;
  newFormLabel?: string;
}

export interface StageUpResult {
  newStage: Stage;
  track?: Track;
  isNewForm?: boolean;
  newFormLabel?: string;
}

type Celebration = { type: 'new' | 'sparkle' | 'complete' | 'stageup' | 'newform' };

function uid(): string {
  return crypto.randomUUID();
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

function highestStat(stats: Record<Stat, number>): Stat {
  const order: Stat[] = ['vigor', 'zip', 'bond'];
  let best: Stat = 'vigor';
  for (const s of order) {
    if (stats[s] > stats[best]) best = s;
  }
  return best;
}

const STAT_TO_TRACK: Record<Stat, Track> = {
  vigor: 'sturdy',
  zip: 'sleek',
  bond: 'cheerful',
};

export interface GameStore extends GameState {
  tab: Tab;
  notification: string | null;
  celebration: Celebration | null;
  minigame: { uid: string; stat: Stat } | null;
  setTab: (tab: Tab) => void;
  resetGame: () => void;
  clearNotification: () => void;
  toggleSound: () => void;
  toggleReducedMotion: () => void;
  plantSeed: (plotId: number) => boolean;
  waterPlot: (plotId: number) => boolean;
  hatchPlot: (plotId: number) => HatchResult | null;
  buySeeds: () => boolean;
  buyPlot: () => boolean;
  buyLuckUpgrade: () => boolean;
  buyHatBox: () => string | null;
  buyFood: () => boolean;
  buyToy: () => boolean;
  feed: (uid: string) => boolean;
  play: (uid: string) => boolean;
  canTrain: (uid: string, stat: Stat) => { ok: boolean; reason?: string };
  startMinigame: (uid: string, stat: Stat) => void;
  closeMinigame: () => void;
  finishMinigame: (uid: string, stat: Stat, wellTimed: boolean) => TrainResult | null;
  spar: (uid: string, stat: Stat) => TrainResult | null;
  moveToNursery: (uid: string) => boolean;
  moveToReserve: (uid: string) => boolean;
  tick: () => void;
  processOffline: () => string | null;
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
    inventory: { food: 0, toys: 0 },
    plots: Array.from({ length: STARTING_PLOTS }, (_, i) => ({
      id: i,
      state: 'empty' as const,
    })),
    creatures: [],
    dex: {},
    settings: { reducedMotion: false, sound: true },
  };
}

function checkStageUp(creature: OwnedCreature, dex: Record<string, DexEntry>): StageUpResult | null {
  const total = creature.stats.vigor + creature.stats.zip + creature.stats.bond;
  if (creature.stage === 'baby' && total >= STAGE_UP_THRESHOLD_TEEN) {
    return { newStage: 'teen' };
  }
  if (creature.stage === 'teen' && total >= STAGE_UP_THRESHOLD_ADULT) {
    const topStat = highestStat(creature.stats);
    const track = STAT_TO_TRACK[topStat];
    const entry = dex[creature.speciesId];
    const isNewForm = !entry?.formsRaised.includes(track);
    const species = SPECIES_MAP[creature.speciesId];
    const label = species?.forms[track]?.label ?? track;
    return { newStage: 'adult', track, isNewForm, newFormLabel: label };
  }
  return null;
}

const initial = load() ?? freshGame();

export const useGameStore = create<GameStore>((set, get) => ({
  ...initial,
  tab: 'garden',
  notification: null,
  celebration: null,
  minigame: null,

  setTab: (tab) => set({ tab }),
  clearNotification: () => set({ notification: null, celebration: null }),
  closeMinigame: () => set({ minigame: null }),
  toggleSound: () =>
    set((s) => ({ settings: { ...s.settings, sound: !s.settings.sound } })),
  toggleReducedMotion: () =>
    set((s) => ({ settings: { ...s.settings, reducedMotion: !s.settings.reducedMotion } })),
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

    const nurseryCount = s.creatures.filter((c) => c.location === 'nursery').length;
    const location = nurseryCount < NURSERY_SLOTS ? 'nursery' : 'reserve';

    const creature: OwnedCreature = {
      uid: uid(),
      speciesId: species.id,
      sparkle,
      hat: null,
      stage: 'baby',
      track: null,
      stats: { vigor: 0, zip: 0, bond: 0 },
      fullness: STARTING_FULLNESS,
      energy: STARTING_ENERGY,
      location,
      cooldowns: {},
    };

    const prev = s.dex[species.id];
    const isNewNormal = !prev?.normal;
    const isNewSparkle = sparkle && !prev?.sparkle;
    const newDex: Record<string, DexEntry> = {
      ...s.dex,
      [species.id]: {
        normal: true,
        sparkle: prev?.sparkle || sparkle,
        formsRaised: prev?.formsRaised ?? [],
      },
    };
    let bonus = 0;
    let celebration: Celebration | null = null;
    if (isNewNormal) {
      bonus += NEW_SPECIES_BONUS;
      celebration = { type: 'new' };
    }
    if (isNewSparkle) {
      bonus += NEW_SPECIES_BONUS;
      celebration = { type: 'sparkle' };
    }
    const allFound = Object.keys(SPECIES_MAP).length;
    const newFoundCount = Object.values(newDex).filter((e) => e.normal).length;
    if (newFoundCount >= allFound && Object.values(s.dex).filter((e) => e.normal).length < allFound) {
      celebration = { type: 'complete' };
    }

    set({
      plots: s.plots.map((p) => (p.id === plotId ? { id: p.id, state: 'empty' } : p)),
      creatures: [...s.creatures, creature],
      dex: newDex,
      coins: s.coins + bonus,
      lastUpdate: Date.now(),
      celebration,
    });
    return {
      creature,
      speciesName: species.name,
      speciesId: species.id,
      isNewNormal,
      isNewSparkle,
      bonus,
      sparkle,
      location,
    };
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
    if (s.ownedHats.length >= HATS.length) return null;
    if (s.coins < HAT_BOX_PRICE) return null;
    const remaining = HATS.filter((h) => !s.ownedHats.includes(h));
    const hat = remaining[0];
    if (!hat) return null;
    set({
      coins: s.coins - HAT_BOX_PRICE,
      ownedHats: [...s.ownedHats, hat],
    });
    return hat;
  },

  buyFood: () => {
    const s = get();
    if (s.coins < FOOD_PRICE) return false;
    set({ coins: s.coins - FOOD_PRICE, inventory: { ...s.inventory, food: s.inventory.food + 1 } });
    return true;
  },

  buyToy: () => {
    const s = get();
    if (s.coins < TOY_PRICE) return false;
    set({ coins: s.coins - TOY_PRICE, inventory: { ...s.inventory, toys: s.inventory.toys + 1 } });
    return true;
  },

  feed: (uid) => {
    const s = get();
    const idx = s.creatures.findIndex((c) => c.uid === uid);
    if (idx === -1) return false;
    const c = s.creatures[idx];
    if (c.location !== 'nursery') return false;
    if (s.inventory.food < 1) return false;
    if (c.fullness >= 100) return false;
    const newFullness = Math.min(c.fullness + FEED_AMOUNT, 100);
    const updated = [...s.creatures];
    updated[idx] = { ...c, fullness: newFullness };
    set({
      creatures: updated,
      inventory: { ...s.inventory, food: s.inventory.food - 1 },
    });
    return true;
  },

  play: (uid) => {
    const s = get();
    const idx = s.creatures.findIndex((c) => c.uid === uid);
    if (idx === -1) return false;
    const c = s.creatures[idx];
    if (c.location !== 'nursery') return false;
    if (s.inventory.toys < 1) return false;
    if (c.energy >= 100) return false;
    const newEnergy = Math.min(c.energy + PLAY_AMOUNT, 100);
    const updated = [...s.creatures];
    updated[idx] = { ...c, energy: newEnergy };
    set({
      creatures: updated,
      inventory: { ...s.inventory, toys: s.inventory.toys - 1 },
    });
    return true;
  },

  canTrain: (uid, stat) => {
    const s = get();
    const c = s.creatures.find((c) => c.uid === uid);
    if (!c) return { ok: false, reason: 'Not found' };
    if (c.location !== 'nursery') return { ok: false, reason: 'Not in nursery' };
    if (c.stage === 'adult') return { ok: false, reason: 'Already graduated' };
    const now = Date.now();
    const last = c.cooldowns[stat];
    if (last && now - last < TRAIN_COOLDOWN_MS) {
      const remaining = Math.ceil((TRAIN_COOLDOWN_MS - (now - last)) / 1000);
      return { ok: false, reason: `Cooldown: ${remaining}s` };
    }
    if (c.fullness < TRAIN_COST_FULLNESS) return { ok: false, reason: 'Too hungry' };
    if (c.energy < TRAIN_COST_ENERGY) return { ok: false, reason: 'Too tired' };
    return { ok: true };
  },

  startMinigame: (uid, stat) => {
    const s = get();
    const check = s.canTrain(uid, stat);
    if (!check.ok) {
      set({ notification: check.reason ?? 'Cannot train' });
      return;
    }
    set({ minigame: { uid, stat } });
  },

  finishMinigame: (uid, stat, wellTimed) => {
    const s = get();
    const idx = s.creatures.findIndex((c) => c.uid === uid);
    if (idx === -1) return null;
    const c = s.creatures[idx];
    if (c.location !== 'nursery' || c.stage === 'adult') return null;

    const xp = wellTimed ? STAT_XP_WELL_TIMED : STAT_XP_ROUGH;
    const coins = TRAIN_COIN_REWARD_MIN + Math.floor(Math.random() * (TRAIN_COIN_REWARD_MAX - TRAIN_COIN_REWARD_MIN + 1));
    const now = Date.now();

    const newStats = { ...c.stats, [stat]: c.stats[stat] + xp };
    const updated = [...s.creatures];
    updated[idx] = {
      ...c,
      stats: newStats,
      fullness: Math.max(0, c.fullness - TRAIN_COST_FULLNESS),
      energy: Math.max(0, c.energy - TRAIN_COST_ENERGY),
      cooldowns: { ...c.cooldowns, [stat]: now },
    };

    let result: TrainResult = { xp, coins, wellTimed };

    const stageResult = checkStageUp(updated[idx], s.dex);
    if (stageResult) {
      let coinBonus = STAGE_UP_BONUS;
      let celebration: Celebration = { type: 'stageup' };
      let newDex = s.dex;
      let newFormLabel: string | undefined;

      if (stageResult.newStage === 'adult') {
        const track = stageResult.track!;
        updated[idx].track = track;
        updated[idx].location = 'meadow';

        if (stageResult.isNewForm) {
          coinBonus += NEW_FORM_BONUS;
          celebration = { type: 'newform' };
          newFormLabel = stageResult.newFormLabel;
          const entry = newDex[c.speciesId];
          if (entry) {
            newDex = {
              ...newDex,
              [c.speciesId]: { ...entry, formsRaised: [...entry.formsRaised, track] },
            };
          }
        }

        const allFound = Object.keys(SPECIES_MAP).length;
        const allFormsFound = Object.values(newDex).every((e) => e.formsRaised.length >= 3);
        if (Object.values(newDex).filter((e) => e.normal).length >= allFound && allFormsFound) {
          celebration = { type: 'complete' };
        }

        set({ dex: newDex });
      }

      const totalCoins = coins + coinBonus;
      updated[idx].stage = stageResult.newStage;
      result.newStage = stageResult.newStage;
      result.newTrack = stageResult.track;
      result.isNewForm = stageResult.isNewForm;
      result.newFormLabel = newFormLabel;

      set({
        coins: s.coins + totalCoins,
        creatures: updated,
        minigame: null,
        celebration,
        notification: stageResult.newStage === 'adult'
          ? `${SPECIES_MAP[c.speciesId]?.name ?? 'Creature'} grew into ${newFormLabel ?? stageResult.track} form! +${totalCoins}🪙`
          : `${SPECIES_MAP[c.speciesId]?.name ?? 'Creature'} grew up! +${totalCoins}🪙`,
      });
      return result;
    }

    set({
      coins: s.coins + coins,
      creatures: updated,
      minigame: null,
    });
    return result;
  },

  spar: (uid, stat) => {
    const s = get();
    const idx = s.creatures.findIndex((c) => c.uid === uid);
    if (idx === -1) return null;
    const c = s.creatures[idx];
    if (c.location !== 'nursery' || c.stage === 'adult') return null;

    if (stat === 'bond') return null; // spar is only for vigor/zip

    const now = Date.now();
    const last = c.cooldowns[stat];
    if (last && now - last < TRAIN_COOLDOWN_MS) return null;
    if (c.energy < SPAR_COST_ENERGY) return null;

    const xp = STAT_XP_SPAR;
    const coins = SPAR_COIN_REWARD;

    const newStats = { ...c.stats, [stat]: c.stats[stat] + xp };
    const updated = [...s.creatures];
    updated[idx] = {
      ...c,
      stats: newStats,
      energy: Math.max(0, c.energy - SPAR_COST_ENERGY),
      cooldowns: { ...c.cooldowns, [stat]: now },
    };

    let result: TrainResult = { xp, coins, wellTimed: false };

    const stageResult = checkStageUp(updated[idx], s.dex);
    if (stageResult) {
      let coinBonus = STAGE_UP_BONUS;
      let celebration: Celebration = { type: 'stageup' };
      let newDex = s.dex;
      let newFormLabel: string | undefined;

      if (stageResult.newStage === 'adult') {
        const track = stageResult.track!;
        updated[idx].track = track;
        updated[idx].location = 'meadow';

        if (stageResult.isNewForm) {
          coinBonus += NEW_FORM_BONUS;
          celebration = { type: 'newform' };
          newFormLabel = stageResult.newFormLabel;
          const entry = newDex[c.speciesId];
          if (entry) {
            newDex = {
              ...newDex,
              [c.speciesId]: { ...entry, formsRaised: [...entry.formsRaised, track] },
            };
          }
        }

        set({ dex: newDex });
      }

      const totalCoins = coins + coinBonus;
      updated[idx].stage = stageResult.newStage;
      result.newStage = stageResult.newStage;
      result.newTrack = stageResult.track;
      result.isNewForm = stageResult.isNewForm;
      result.newFormLabel = newFormLabel;

      set({
        coins: s.coins + totalCoins,
        creatures: updated,
        celebration,
        notification: stageResult.newStage === 'adult'
          ? `${SPECIES_MAP[c.speciesId]?.name ?? 'Creature'} grew into ${newFormLabel ?? stageResult.track} form! +${totalCoins}🪙`
          : `${SPECIES_MAP[c.speciesId]?.name ?? 'Creature'} grew up! +${totalCoins}🪙`,
      });
      return result;
    }

    set({
      coins: s.coins + coins,
      creatures: updated,
    });
    return result;
  },

  moveToNursery: (uid) => {
    const s = get();
    const idx = s.creatures.findIndex((c) => c.uid === uid);
    if (idx === -1) return false;
    const c = s.creatures[idx];
    if (c.location !== 'reserve') return false;
    const nurseryCount = s.creatures.filter((c) => c.location === 'nursery').length;
    if (nurseryCount >= NURSERY_SLOTS) return false;
    const updated = [...s.creatures];
    updated[idx] = {
      ...c,
      location: 'nursery',
      fullness: STARTING_FULLNESS,
      energy: STARTING_ENERGY,
    };
    set({ creatures: updated });
    return true;
  },

  moveToReserve: (uid) => {
    const s = get();
    const idx = s.creatures.findIndex((c) => c.uid === uid);
    if (idx === -1) return false;
    const c = s.creatures[idx];
    if (c.location !== 'nursery') return false;
    const updated = [...s.creatures];
    updated[idx] = { ...c, location: 'reserve' };
    set({ creatures: updated });
    return true;
  },

  tick: () => {
    const s = get();
    const now = Date.now();
    const elapsed = (now - s.lastUpdate) / 1000;
    if (elapsed < 0.5) return;

    const meadowRate = s.creatures.reduce((sum, c) => {
      if (c.location === 'meadow') return sum + MEADOW_TRICKLE_RATE;
      return sum;
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
      if (c.location === 'meadow') return sum + MEADOW_TRICKLE_RATE;
      return sum;
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
function scheduleAutosave() {
  if (autosaveTimer) clearTimeout(autosaveTimer);
  autosaveTimer = setTimeout(() => {
    const current = useGameStore.getState();
    save({
      version: current.version,
      createdAt: current.createdAt,
      lastUpdate: current.lastUpdate,
      coins: current.coins,
      seeds: current.seeds,
      plotCount: current.plotCount,
      luckLevel: current.luckLevel,
      ownedHats: current.ownedHats,
      inventory: current.inventory,
      plots: current.plots,
      creatures: current.creatures,
      dex: current.dex,
      settings: current.settings,
    } as GameState);
  }, AUTOSAVE_INTERVAL_MS);
}

const origSet = useGameStore.setState;
useGameStore.setState = (partial) => {
  origSet(partial);
  scheduleAutosave();
};

if (typeof window !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      const state = useGameStore.getState();
      state.tick();
      const current = useGameStore.getState();
      save({
        version: current.version,
        createdAt: current.createdAt,
        lastUpdate: current.lastUpdate,
        coins: current.coins,
        seeds: current.seeds,
        plotCount: current.plotCount,
        luckLevel: current.luckLevel,
        ownedHats: current.ownedHats,
        inventory: current.inventory,
        plots: current.plots,
        creatures: current.creatures,
        dex: current.dex,
        settings: current.settings,
      } as GameState);
    }
  });
}
