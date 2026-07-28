export type Need = 'hunger' | 'happiness' | 'cleanliness' | 'energy';

export interface Monster {
  speciesId: string;
  name: string;
  hunger: number;
  happiness: number;
  cleanliness: number;
  energy: number;
  bornAt: number;
  lastUpdate: number;
  criticalSince: number | null;
}

export interface SaveData {
  version: number;
  monster: Monster | null;
  settings: { sound: boolean; reducedMotion: boolean };
}

export interface PixelCell {
  x: number;
  y: number;
  shade: 1 | 2 | 3;
}

export interface Species {
  id: string;
  name: string;
  cells: PixelCell[];
}

export interface ParticleShape {
  id: string;
  cells: PixelCell[];
}
