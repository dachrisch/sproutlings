export type Need = 'hunger' | 'happiness' | 'cleanliness' | 'energy';

export interface Monster {
  speciesId: string;
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
