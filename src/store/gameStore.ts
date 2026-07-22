import { create } from 'zustand';
import type { GameState, Tab } from '../types';
import { STARTING_COINS, STARTING_SEEDS, STARTING_PLOTS, SAVE_VERSION } from '../constants';
import { load, save } from '../storage';

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

let autosaveTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleAutosave(state: GameState) {
  if (autosaveTimer) clearTimeout(autosaveTimer);
  autosaveTimer = setTimeout(() => save(state), 8000);
}

interface GameStore extends GameState {
  tab: Tab;
  setTab: (tab: Tab) => void;
  resetGame: () => void;
}

const initial = load() ?? freshGame();

export const useGameStore = create<GameStore>((set) => ({
  ...initial,
  tab: 'garden',
  setTab: (tab) => set({ tab }),
  resetGame: () => {
    const fresh = freshGame();
    set(fresh);
    save(fresh);
  },
}));

const originalSet = useGameStore.setState;
useGameStore.setState = (partial) => {
  originalSet(partial);
  const state = useGameStore.getState();
  scheduleAutosave(state);
};

if (typeof window !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      save(useGameStore.getState());
    }
  });
}
