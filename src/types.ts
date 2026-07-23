export type Rarity = 'common' | 'uncommon' | 'rare' | 'legendary';

export type Shape =
  | 'blob' | 'round' | 'eared' | 'sprout' | 'horned'
  | 'spiky' | 'star' | 'tall' | 'cloud' | 'mushroom' | 'stone';

export interface Species {
  id: string;
  name: string;
  rarity: Rarity;
  shape: Shape;
  hue: number;
}

export type EvolutionStage = 'baby' | 'adult' | 'elder';

export interface OwnedCreature {
  uid: string;
  speciesId: string;
  sparkle: boolean;
  hat: string | null;
  level: number;
  xp: number;
  happiness: number;
  stage: EvolutionStage;
  training: 'none' | 'speed' | 'luck' | 'charm';
  trainingStartedAt?: number;
  petCooldownUntil?: number;
}

export interface ExpeditionSlot {
  id: number;
  state: 'idle' | 'exploring' | 'returned';
  startedAt?: number;
  durationMs?: number;
}

export interface DexEntry {
  normal: boolean;
  sparkle: boolean;
}

export type Tab = 'zoo' | 'expeditions' | 'collection' | 'shop';

export interface Settings {
  reducedMotion: boolean;
  sound: boolean;
}

export interface GameState {
  version: number;
  createdAt: number;
  lastUpdate: number;
  coins: number;
  expeditionSlots: ExpeditionSlot[];
  slotCount: number;
  luckLevel: number;
  ownedHats: string[];
  creatures: OwnedCreature[];
  dex: Record<string, DexEntry>;
  settings: Settings;
}
