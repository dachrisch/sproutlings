export interface Rng {
  seed: number;
  next(): number;
}

export function createRng(seed?: number): Rng {
  let s = seed ?? Date.now();
  let state = s | 0;
  return {
    seed: s,
    next(): number {
      state = (state + 0x6d2b79f5) | 0;
      let t = Math.imul(state ^ (state >>> 15), 1 | state);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
  };
}

export function random(rng: Rng): number {
  return rng.next();
}

export function randomInt(rng: Rng, min: number, max: number): number {
  return min + Math.floor(rng.next() * (max - min + 1));
}
