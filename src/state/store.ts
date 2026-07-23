import { create } from 'zustand';
import { loadSave, saveGame, freshSave } from './save';
import type { SaveData, BattleState, PlayerAction, Tab, PartyCreature, BattlePhase } from '../types';
import type { CreatureDef, BiomeDef } from '../types';
import { PARTY_MAX, BIOME_BOSS_WINS_REQUIRED } from '../constants';
import { createBattle, step, evolveState } from '../engine/battle';
import { createRng } from '../engine/rng';
import { recomputeStats } from '../engine/xp';
import creaturesData from '../data/creatures.json';
import biomesData from '../data/biomes.json';
import movesData from '../data/moves.json';

const creatures = creaturesData as CreatureDef[];
const biomes = biomesData as BiomeDef[];
const movesList = movesData as Array<{ id: string; unlockLevel: number }>;

function pickEncounter(biomeId: string, rng: { seed: number; next(): number }): string {
  const biome = biomes.find(b => b.id === biomeId)!;
  const total = biome.encounters.reduce((s, e) => s + e.weight, 0);
  let roll = rng.next() * total;
  for (const enc of biome.encounters) {
    roll -= enc.weight;
    if (roll <= 0) return enc.creature;
  }
  return biome.encounters[biome.encounters.length - 1].creature;
}

function buildCreature(creatureId: string, level: number): PartyCreature {
  const def = creatures.find(c => c.id === creatureId)!;
  const stats = recomputeStats(creatureId, level);
  const moves = def.moves.filter(m => {
    const md = movesList.find(x => x.id === m);
    return md && md.unlockLevel <= level;
  });
  return {
    creatureId: def.id,
    nickname: def.name,
    level,
    xp: 0,
    currentHp: stats.maxHp,
    maxHp: stats.maxHp,
    atk: stats.atk,
    def: stats.def,
    spd: stats.spd,
    moves: moves.length > 0 ? moves : [def.moves[0]],
  };
}

function isInteractive(phase: BattlePhase): boolean {
  return phase === 'INTRO' || phase === 'PLAYER_ACTION' || phase === 'FORCE_SWITCH' || phase === 'NAME_PROMPT';
}

function isTerminal(phase: BattlePhase): boolean {
  return phase === 'VICTORY' || phase === 'DEFEAT' || phase === 'FLED' || phase === 'END';
}

interface GameStore extends SaveData {
  tab: Tab;
  battleState: BattleState | null;
  notification: string | null;
  currentBiome: string | null;
  bossWins: number;

  setTab: (tab: Tab) => void;
  startBattle: (biomeId: string, isBoss?: boolean) => void;
  performAction: (action: PlayerAction) => void;
  finishBattle: () => void;
  healAll: () => void;
  setName: (idx: number, name: string) => void;
  addToParty: (creature: PartyCreature) => boolean;
  clearNotification: () => void;
  randomForBiome: (biomeId: string, rng: { seed: number; next(): number }) => string;
}

const saved = loadSave();
const persisted: SaveData = saved ?? freshSave();

export const useGameStore = create<GameStore>((set, get) => ({
  ...persisted,
  tab: 'biomes',
  battleState: null,
  notification: null,
  currentBiome: null,
  bossWins: 0,

  setTab: tab => set({ tab }),

  startBattle: (biomeId, isBoss) => {
    const rng = createRng();
    const biome = biomes.find(b => b.id === biomeId);
    if (!biome) return;
    const party = get().party;
    if (party.length === 0) return;

    let creatureId: string;
    let level: number;
    if (isBoss && biome.boss) {
      creatureId = biome.boss.creature;
      level = biome.boss.level;
    } else {
      creatureId = pickEncounter(biomeId, rng);
      level = biome.levelRange[0] + Math.floor(rng.next() * (biome.levelRange[1] - biome.levelRange[0] + 1));
    }

    const playerCreature = party[0];
    const enemyCreature = buildCreature(creatureId, level);
    const battleState = createBattle(playerCreature, enemyCreature);

    const seenIds = get().seenIds;
    const nextSeen = seenIds.includes(creatureId) ? seenIds : [...seenIds, creatureId];
    set({ battleState, currentBiome: biomeId, tab: 'battle', seenIds: nextSeen });
  },

  performAction: action => {
    const battleState = get().battleState;
    if (!battleState) return;

    let bs = step(battleState, action).state;
    for (let i = 0; i < 20; i++) {
      if (isInteractive(bs.phase) || isTerminal(bs.phase)) break;
      bs = evolveState(bs);
    }
    set({ battleState: bs });
  },

  finishBattle: () => {
    const state = get();
    const b = state.battleState;
    if (!b) return;

    let { party, caughtIds, seenIds, box, bossWins, currentBiome } = state;
    let newParty = [...party];
    let newCaughtIds = [...caughtIds];
    let newSeenIds = [...seenIds];
    let newBox = [...box];
    let newBossWins = bossWins;
    let notification: string | null = null;

    const isVictory = b.phase === 'VICTORY';
    const isCapture = b.phase === 'CAUGHT' || b.phase === 'NAME_PROMPT';

    if (isVictory) {
      notification = `You defeated ${b.enemyCreature.nickname}!`;
      const idx = newParty.findIndex(c => c.creatureId === b.playerCreature.creatureId);
      if (idx !== -1) newParty[idx] = { ...b.playerCreature };

      const biome = biomes.find(bi => bi.id === currentBiome);
      if (biome?.boss && b.enemyCreature.creatureId === biome.boss.creature) {
        newBossWins += 1;
        if (newBossWins >= BIOME_BOSS_WINS_REQUIRED && biome.boss.unlocks) {
          const current = get().unlockedBiomes;
          if (!current.includes(biome.boss.unlocks)) {
            set({ unlockedBiomes: [...current, biome.boss.unlocks] });
          }
        }
      }
    }

    if (isCapture) {
      const enemy = b.enemyCreature;
      notification = `You caught ${enemy.nickname}!`;
      if (!newSeenIds.includes(enemy.creatureId)) newSeenIds.push(enemy.creatureId);
      if (!newCaughtIds.includes(enemy.creatureId)) newCaughtIds.push(enemy.creatureId);
      if (newParty.length < PARTY_MAX) {
        newParty.push(enemy);
      } else {
        newBox.push(enemy);
      }
    }

    if (b.phase === 'DEFEAT') {
      notification = 'You were defeated...';
      newParty = newParty.map(c => ({ ...c, currentHp: c.maxHp }));
    }

    if (b.phase === 'FLED') {
      notification = 'You got away safely!';
    }

    set({
      battleState: null,
      currentBiome: null,
      party: newParty,
      caughtIds: newCaughtIds,
      seenIds: newSeenIds,
      box: newBox,
      bossWins: newBossWins,
      notification,
    });
  },

  healAll: () => {
    const party = get().party.map(c => ({ ...c, currentHp: c.maxHp }));
    set({ party });
  },

  setName: (idx, name) => {
    const party = [...get().party];
    if (party[idx]) {
      party[idx] = { ...party[idx], nickname: name };
      set({ party });
    }
  },

  addToParty: creature => {
    const party = get().party;
    if (party.length >= PARTY_MAX) return false;
    set({ party: [...party, creature] });
    return true;
  },

  clearNotification: () => set({ notification: null }),

  randomForBiome: (biomeId, rng) => pickEncounter(biomeId, rng),
}));

let autosaveTimer: number | null = null;

function scheduleAutosave(): void {
  if (autosaveTimer !== null) clearTimeout(autosaveTimer);
  autosaveTimer = window.setTimeout(() => {
    saveGame(useGameStore.getState());
    autosaveTimer = null;
  }, 200);
}

useGameStore.subscribe(scheduleAutosave);

const origSet = useGameStore.setState;
useGameStore.setState = partial => {
  origSet(partial);
  scheduleAutosave();
};
