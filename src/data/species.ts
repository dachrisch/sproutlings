import type { Species, Rarity, Track } from '../types';

const TRACKS: Record<Track, { hueShift: number; label: string }> = {
  sturdy: { hueShift: 0, label: 'Sturdy' },
  sleek: { hueShift: -20, label: 'Sleek' },
  cheerful: { hueShift: 20, label: 'Cheerful' },
};

const speciesData: { id: string; name: string; rarity: Rarity; shape: Species['shape']; hue: number }[] = [
  { id: 'mossling',  name: 'Mossling',  rarity: 'common',    shape: 'blob',     hue: 110 },
  { id: 'berrybub',  name: 'Berrybub',  rarity: 'common',    shape: 'blob',     hue: 330 },
  { id: 'sunny',     name: 'Sunny',     rarity: 'common',    shape: 'round',    hue: 48  },
  { id: 'puddle',    name: 'Puddle',    rarity: 'common',    shape: 'eared',    hue: 205 },
  { id: 'mushcap',   name: 'Mushcap',   rarity: 'common',    shape: 'mushroom', hue: 20  },
  { id: 'twiglet',   name: 'Twiglet',   rarity: 'uncommon',  shape: 'sprout',   hue: 90  },
  { id: 'emberling', name: 'Emberling', rarity: 'uncommon',  shape: 'horned',   hue: 25  },
  { id: 'frostnip',  name: 'Frostnip',  rarity: 'uncommon',  shape: 'eared',    hue: 185 },
  { id: 'bramble',   name: 'Bramble',   rarity: 'uncommon',  shape: 'spiky',    hue: 275 },
  { id: 'pebbly',    name: 'Pebbly',    rarity: 'uncommon',  shape: 'stone',    hue: 40  },
  { id: 'thornox',   name: 'Thornox',   rarity: 'rare',      shape: 'horned',   hue: 355 },
  { id: 'glimmer',   name: 'Glimmer',   rarity: 'rare',      shape: 'star',     hue: 165 },
  { id: 'voltick',   name: 'Voltick',   rarity: 'rare',      shape: 'spiky',    hue: 240 },
  { id: 'zappa',     name: 'Zappa',     rarity: 'rare',      shape: 'spiky',    hue: 55  },
  { id: 'aurelia',   name: 'Aurelia',   rarity: 'legendary', shape: 'tall',     hue: 45  },
  { id: 'nimbus',    name: 'Nimbus',    rarity: 'legendary', shape: 'cloud',    hue: 210 },
];

export const SPECIES: Species[] = speciesData.map((s) => ({
  ...s,
  forms: { ...TRACKS },
}));

export const SPECIES_MAP: Record<string, Species> = Object.fromEntries(
  SPECIES.map((s) => [s.id, s])
);

export const SPECIES_BY_RARITY: Record<Rarity, Species[]> = {
  common:    [],
  uncommon:  [],
  rare:      [],
  legendary: [],
};

for (const s of SPECIES) {
  SPECIES_BY_RARITY[s.rarity].push(s);
}
