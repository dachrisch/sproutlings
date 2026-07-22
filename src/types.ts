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
  coinsPerSec: number;
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
}

export interface DexEntry {
  normal: boolean;
  sparkle: boolean;
}

export type Tab = 'garden' | 'collection' | 'shop';

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
  plots: Plot[];
  creatures: OwnedCreature[];
  dex: Record<string, DexEntry>;
  settings: Settings;
}
