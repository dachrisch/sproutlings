import { create } from 'zustand';
import type { GameState, Tab, OwnedCreature, DexEntry, Rarity } from '../types';
import {
  STARTING_COINS, STARTING_SLOTS, SAVE_VERSION,
  EXPEDITION_COST, EXPEDITION_DURATION_MS,
  SPARKLE_BASE_CHANCE, SPARKLE_PER_LUCK_LEVEL, SPARKLE_CHANCE_CAP,
  LUCK_LEVEL_CAP, slotPrice, SLOT_CAP, luckUpgradePrice,
  HAT_BOX_PRICE, OFFLINE_ACCRUAL_CAP_MS, NEW_SPECIES_BONUS,
  RARITY_WEIGHTS, HATS, AUTOSAVE_INTERVAL_MS, ZOO_RATE,
  TREASURE_MIN, TREASURE_MAX,
} from '../constants';
import { SPECIES_MAP, SPECIES_BY_RARITY } from '../data/species';
import { load, save } from '../storage';

export interface CollectResult {
  creature: OwnedCreature;
  speciesName: string;
  speciesId: string;
  isNewNormal: boolean;
  isNewSparkle: boolean;
  bonus: number;
  sparkle: boolean;
  treasure: number;
}

type Celebration = { type: 'new' | 'sparkle' | 'complete' };

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

export interface GameStore extends GameState {
  tab: Tab;
  notification: string | null;
  celebration: Celebration | null;
  setTab: (tab: Tab) => void;
  resetGame: () => void;
  clearNotification: () => void;
  closeMinigame: () => void;
  toggleSound: () => void;
  toggleReducedMotion: () => void;
  startExpedition: (slotId: number) => boolean;
  collectExpedition: (slotId: number) => CollectResult | null;
  buySlot: () => boolean;
  buyLuckUpgrade: () => boolean;
  buyHatBox: () => string | null;
  tick: () => void;
  processOffline: () => string | null;
  cycleHat: (uid: string) => void;
}

function freshGame(): GameState {
  const now = Date.now();
  return {
    version: SAVE_VERSION,
    createdAt: now,
    lastUpdate: now,
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
    settings: { reducedMotion: false, sound: true },
  };
}

const initial = load() ?? freshGame();

export const useGameStore = create<GameStore>((set, get) => ({
  ...initial,
  tab: 'zoo',
  notification: null,
  celebration: null,

  setTab: (tab) => set({ tab }),
  clearNotification: () => set({ notification: null, celebration: null }),
  closeMinigame: () => {},
  toggleSound: () =>
    set((s) => ({ settings: { ...s.settings, sound: !s.settings.sound } })),
  toggleReducedMotion: () =>
    set((s) => ({ settings: { ...s.settings, reducedMotion: !s.settings.reducedMotion } })),
  resetGame: () => {
    const fresh = freshGame();
    set(fresh as unknown as GameStore);
    save(fresh);
  },

  cycleHat: (uid) => {
    const s = get();
    const creature = s.creatures.find((c) => c.uid === uid);
    if (!creature) return;
    const allHats = [null, ...s.ownedHats];
    const idx = allHats.indexOf(creature.hat);
    const nextHat = allHats[(idx + 1) % allHats.length];
    set({
      creatures: s.creatures.map((c) =>
        c.uid === uid ? { ...c, hat: nextHat } : c
      ),
    });
  },

  startExpedition: (slotId) => {
    const s = get();
    const slot = s.expeditionSlots.find((sl) => sl.id === slotId);
    if (!slot || slot.state !== 'idle') return false;
    if (s.coins < EXPEDITION_COST) return false;
    const now = Date.now();
    set({
      coins: s.coins - EXPEDITION_COST,
      expeditionSlots: s.expeditionSlots.map((sl) =>
        sl.id === slotId
          ? { ...sl, state: 'exploring', startedAt: now, durationMs: EXPEDITION_DURATION_MS }
          : sl
      ),
      lastUpdate: now,
    });
    return true;
  },

  collectExpedition: (slotId) => {
    const s = get();
    const slot = s.expeditionSlots.find((sl) => sl.id === slotId);
    if (!slot || slot.state !== 'returned') return null;

    const rarity = rollRarity();
    const pool = SPECIES_BY_RARITY[rarity];
    const species = pool[Math.floor(Math.random() * pool.length)];
    const sparkle = rollSparkle(s.luckLevel);

    const creature: OwnedCreature = {
      uid: uid(),
      speciesId: species.id,
      sparkle,
      hat: null,
    };

    const prev = s.dex[species.id];
    const isNewNormal = !prev?.normal;
    const isNewSparkle = sparkle && !prev?.sparkle;
    const newDex: Record<string, DexEntry> = {
      ...s.dex,
      [species.id]: {
        normal: true,
        sparkle: prev?.sparkle || sparkle,
      },
    };

    const treasure = TREASURE_MIN + Math.floor(Math.random() * (TREASURE_MAX - TREASURE_MIN + 1));
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
      expeditionSlots: s.expeditionSlots.map((sl) =>
        sl.id === slotId ? { id: sl.id, state: 'idle' as const } : sl
      ),
      creatures: [...s.creatures, creature],
      dex: newDex,
      coins: s.coins + treasure + bonus,
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
      treasure,
    };
  },

  buySlot: () => {
    const s = get();
    if (s.slotCount >= SLOT_CAP) return false;
    const price = slotPrice(s.slotCount);
    if (s.coins < price) return false;
    const newSlot: { id: number; state: 'idle' } = { id: s.slotCount, state: 'idle' };
    set({
      coins: s.coins - price,
      slotCount: s.slotCount + 1,
      expeditionSlots: [...s.expeditionSlots, newSlot],
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

  tick: () => {
    const s = get();
    const now = Date.now();
    const elapsed = (now - s.lastUpdate) / 1000;
    if (elapsed < 0.5) return;

    const zooCount = s.creatures.length;
    const coinsGained = zooCount * ZOO_RATE * elapsed;

    const updatedSlots = s.expeditionSlots.map((slot) => {
      if (slot.state === 'exploring' && slot.startedAt && slot.durationMs) {
        if (now - slot.startedAt >= slot.durationMs) {
          return { ...slot, state: 'returned' as const };
        }
      }
      return slot;
    });

    set({
      coins: s.coins + coinsGained,
      expeditionSlots: updatedSlots,
      lastUpdate: now,
    });
  },

  processOffline: () => {
    const s = get();
    const now = Date.now();
    const rawElapsed = now - s.lastUpdate;
    const elapsed = Math.min(rawElapsed, OFFLINE_ACCRUAL_CAP_MS) / 1000;
    if (elapsed < 1) return null;

    const zooCount = s.creatures.length;
    const coinsGained = zooCount * ZOO_RATE * elapsed;

    const updatedSlots = s.expeditionSlots.map((slot) => {
      if (slot.state === 'exploring' && slot.startedAt && slot.durationMs) {
        if (now - slot.startedAt >= slot.durationMs) {
          return { ...slot, state: 'returned' as const };
        }
      }
      return slot;
    });

    const coinFloor = Math.floor(s.coins + coinsGained) - Math.floor(s.coins);
    const returnedCount = updatedSlots.filter(
      (sl) => sl.state === 'returned' && s.expeditionSlots.find((os) => os.id === sl.id)?.state !== 'returned'
    ).length;

    set({
      coins: s.coins + coinsGained,
      expeditionSlots: updatedSlots,
      lastUpdate: now,
    });

    if (coinFloor > 0 || returnedCount > 0) {
      const parts: string[] = [];
      if (coinFloor > 0) parts.push(`earned ${coinFloor} coins`);
      if (returnedCount > 0) parts.push(`${returnedCount} expedition${returnedCount > 1 ? 's' : ''} returned`);
      return `Welcome back! ${parts.join(' and ')}.`;
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
      expeditionSlots: current.expeditionSlots,
      slotCount: current.slotCount,
      luckLevel: current.luckLevel,
      ownedHats: current.ownedHats,
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
        expeditionSlots: current.expeditionSlots,
        slotCount: current.slotCount,
        luckLevel: current.luckLevel,
        ownedHats: current.ownedHats,
        creatures: current.creatures,
        dex: current.dex,
        settings: current.settings,
      } as GameState);
    }
  });
}
