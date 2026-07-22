export type Rarity = 'common' | 'uncommon' | 'rare' | 'legendary';

export type Shape =
  | 'blob' | 'round' | 'eared' | 'sprout' | 'horned'
  | 'spiky' | 'star' | 'tall' | 'cloud' | 'mushroom' | 'stone';

export type Stat = 'vigor' | 'zip' | 'bond';
export type Stage = 'baby' | 'teen' | 'adult';
export type Track = 'sturdy' | 'sleek' | 'cheerful';

export interface Species {
  id: string;
  name: string;
  rarity: Rarity;
  shape: Shape;
  hue: number;
  forms: Record<Track, { hueShift: number; label: string }>;
}

export interface Plot {
  id: number;
  state: 'empty' | 'growing' | 'ready';
  plantedAt?: number;
  growMs?: number;
  wateredAt?: number;
}

export interface OwnedCreature {
  uid: string;
  speciesId: string;
  sparkle: boolean;
  hat: string | null;
  stage: Stage;
  track: Track | null;
  stats: Record<Stat, number>;
  fullness: number;
  energy: number;
  location: 'nursery' | 'reserve' | 'meadow';
  cooldowns: Partial<Record<Stat, number>>;
}

export interface DexEntry {
  normal: boolean;
  sparkle: boolean;
  formsRaised: Track[];
}

export interface Inventory {
  food: number;
  toys: number;
}

export type Tab = 'garden' | 'nursery' | 'collection' | 'shop';

export interface Settings {
  reducedMotion: boolean;
  sound: boolean;
}

export interface GameState {
  version: number;
  createdAt: number;
  lastUpdate: number;
  coins: number;
  seeds: number;
  plotCount: number;
  luckLevel: number;
  ownedHats: string[];
  inventory: Inventory;
  plots: Plot[];
  creatures: OwnedCreature[];
  dex: Record<string, DexEntry>;
  settings: Settings;
}
