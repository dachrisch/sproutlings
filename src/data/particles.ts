import type { ParticleShape } from '../types';
import { filledCircle, mergeCells } from './pixelShapes';

const morsel = filledCircle(6, 6, 1.5, 2);

const star = [
  { x: 6, y: 3, shade: 3 as const },
  { x: 5, y: 5, shade: 3 as const },
  { x: 6, y: 5, shade: 3 as const },
  { x: 7, y: 5, shade: 3 as const },
  { x: 6, y: 7, shade: 3 as const },
  { x: 4, y: 6, shade: 3 as const },
  { x: 8, y: 6, shade: 3 as const },
];

const droplet = mergeCells(filledCircle(6, 7, 2, 3), [
  { x: 6, y: 4, shade: 3 as const },
  { x: 5, y: 5, shade: 3 as const },
  { x: 7, y: 5, shade: 3 as const },
]);

const zzz = [
  { x: 4, y: 8, shade: 1 as const },
  { x: 5, y: 8, shade: 1 as const },
  { x: 6, y: 8, shade: 1 as const },
  { x: 4, y: 9, shade: 1 as const },
  { x: 6, y: 7, shade: 1 as const },
  { x: 5, y: 6, shade: 1 as const },
  { x: 6, y: 6, shade: 1 as const },
  { x: 7, y: 6, shade: 1 as const },
  { x: 5, y: 5, shade: 1 as const },
];

const poof = mergeCells(
  filledCircle(4, 6, 2, 1),
  filledCircle(7, 5, 2.2, 2),
  filledCircle(9, 7, 1.5, 1),
);

const eggCrack1 = [
  { x: 5, y: 4, shade: 3 as const },
  { x: 6, y: 5, shade: 3 as const },
  { x: 6, y: 6, shade: 3 as const },
  { x: 7, y: 7, shade: 3 as const },
];

const eggCrack2 = mergeCells(eggCrack1, [
  { x: 4, y: 6, shade: 3 as const },
  { x: 5, y: 7, shade: 3 as const },
  { x: 8, y: 6, shade: 3 as const },
  { x: 8, y: 8, shade: 3 as const },
]);

export const PARTICLES: ParticleShape[] = [
  { id: 'particle-morsel', cells: morsel },
  { id: 'particle-star', cells: star },
  { id: 'particle-droplet', cells: droplet },
  { id: 'particle-zzz', cells: zzz },
  { id: 'particle-poof', cells: poof },
  { id: 'egg-crack-1', cells: eggCrack1 },
  { id: 'egg-crack-2', cells: eggCrack2 },
];

export const PARTICLES_MAP: Record<string, ParticleShape> = Object.fromEntries(
  PARTICLES.map((particle) => [particle.id, particle]),
);
