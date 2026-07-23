export type MonsterType = 'fire' | 'water' | 'grass' | 'stone';

export interface CreatureDef {
  id: string;
  name: string;
  type: MonsterType;
  baseStats: { hp: number; atk: number; def: number; spd: number };
  moves: string[];
  catchRate: number;
  baseXp: number;
  rarity: string;
  flavour: string;
  sprite: string;
}

export interface MoveDef {
  id: string;
  name: string;
  type: MonsterType;
  power: number;
  accuracy: number;
  unlockLevel: number;
}

export interface TypeChart {
  types: MonsterType[];
  chart: Record<string, Record<string, number>>;
}

export interface BiomeEncounter {
  creature: string;
  weight: number;
}

export interface BiomeBoss {
  creature: string;
  level: number;
  unlocks: string;
}

export interface BiomeDef {
  id: string;
  name: string;
  unlockedBy: string | null;
  levelRange: [number, number];
  encounters: BiomeEncounter[];
  boss: BiomeBoss | null;
}

export interface PartyCreature {
  creatureId: string;
  nickname: string;
  level: number;
  xp: number;
  currentHp: number;
  maxHp: number;
  atk: number;
  def: number;
  spd: number;
  moves: string[];
  happiness?: number;
}

export type BattlePhase =
  | 'INTRO'
  | 'PLAYER_ACTION'
  | 'RESOLVING'
  | 'CHECK_FAINT'
  | 'FORCE_SWITCH'
  | 'VICTORY'
  | 'CAUGHT'
  | 'NAME_PROMPT'
  | 'DEFEAT'
  | 'FLED'
  | 'END';

export type PlayerAction =
  | { type: 'FIGHT'; moveId: string }
  | { type: 'CATCH' }
  | { type: 'SWITCH'; partyIndex: number }
  | { type: 'RUN' };

export interface BattleEvent {
  type: 'damage' | 'heal' | 'faint' | 'levelUp' | 'catchAttempt' | 'catchFail' | 'catchSuccess' | 'switch' | 'run' | 'miss' | 'message';
  target: 'player' | 'enemy';
  amount?: number;
  effectiveness?: number;
  moveName?: string;
  text?: string;
}

export interface BattleState {
  phase: BattlePhase;
  playerCreature: PartyCreature;
  enemyCreature: PartyCreature;
  turn: number;
  events: BattleEvent[];
  catchShakes?: number;
  catchShakeResult?: boolean;
  xpGained?: number;
  xpTotal?: number;
  caughtCreature?: boolean;
  hasRun?: boolean;
  unlockedMove?: string;
}

export interface CatchResult {
  success: boolean;
  shakes: number;
}

export interface SaveData {
  schemaVersion: number;
  playerName: string;
  party: PartyCreature[];
  box: PartyCreature[];
  seenIds: string[];
  caughtIds: string[];
  unlockedBiomes: string[];
  seenMessages: string[];
  balls: number;
}

export type Tab = 'battle' | 'party' | 'biomes' | 'collection' | 'care';

export interface Settings {
  reducedMotion: boolean;
  sound: boolean;
}
