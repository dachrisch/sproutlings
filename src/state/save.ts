import { load, save } from '../storage';
import type { SaveData, PartyCreature } from '../types';
import { SAVE_VERSION, STARTING_BALLS } from '../constants';
import { recomputeStat } from '../constants';
import creaturesData from '../data/creatures.json';

export function loadSave(): SaveData | null {
  return load();
}

export function saveGame(state: SaveData): void {
  save(state);
}

export function freshSave(): SaveData {
  const def = (creaturesData as Array<{
    id: string; name: string; baseStats: { hp: number; atk: number; def: number; spd: number }; moves: string[];
  }>).find(c => c.id === 'emberfox')!;

  const level = 3;
  const starter: PartyCreature = {
    creatureId: def.id,
    nickname: def.name,
    level,
    xp: 0,
    currentHp: recomputeStat(def.baseStats.hp, level),
    maxHp: recomputeStat(def.baseStats.hp, level),
    atk: recomputeStat(def.baseStats.atk, level),
    def: recomputeStat(def.baseStats.def, level),
    spd: recomputeStat(def.baseStats.spd, level),
    moves: [...def.moves],
  };

  return {
    schemaVersion: SAVE_VERSION,
    playerName: 'Trainer',
    party: [starter],
    box: [],
    seenIds: ['emberfox'],
    caughtIds: ['emberfox'],
    unlockedBiomes: ['cinder_flats'],
    seenMessages: [],
    balls: STARTING_BALLS,
  };
}

export function migrateSave(_old: SaveData): SaveData | null {
  return null;
}
