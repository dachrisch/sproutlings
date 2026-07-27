import type { Species } from '../types';
import { filledCircle, mergeCells } from './pixelShapes';

const blobbinBody = filledCircle(6, 6.5, 4.5, 2);
const blobbinEyes = [
  { x: 4, y: 5, shade: 3 as const },
  { x: 8, y: 5, shade: 3 as const },
];
const blobbinFeet = [
  { x: 3, y: 11, shade: 2 as const },
  { x: 4, y: 11, shade: 2 as const },
  { x: 7, y: 11, shade: 2 as const },
  { x: 8, y: 11, shade: 2 as const },
];

const nubkinBody = filledCircle(6, 7, 4, 2);
const nubkinHorns = [
  { x: 3, y: 2, shade: 1 as const },
  { x: 4, y: 1, shade: 1 as const },
  { x: 8, y: 1, shade: 1 as const },
  { x: 9, y: 2, shade: 1 as const },
];
const nubkinEyes = [
  { x: 4, y: 6, shade: 3 as const },
  { x: 8, y: 6, shade: 3 as const },
];

const fizzleBody = mergeCells(filledCircle(5, 6, 3.5, 2), filledCircle(9, 6, 2, 2));
const fizzleFin = [
  { x: 4, y: 2, shade: 1 as const },
  { x: 5, y: 1, shade: 1 as const },
  { x: 6, y: 2, shade: 1 as const },
];
const fizzleEyes = [{ x: 4, y: 5, shade: 3 as const }];

export const SPECIES: Species[] = [
  { id: 'blobbin', name: 'Blobbin', cells: mergeCells(blobbinBody, blobbinFeet, blobbinEyes) },
  { id: 'nubkin', name: 'Nubkin', cells: mergeCells(nubkinBody, nubkinHorns, nubkinEyes) },
  { id: 'fizzle', name: 'Fizzle', cells: mergeCells(fizzleBody, fizzleFin, fizzleEyes) },
];

export const SPECIES_MAP: Record<string, Species> = Object.fromEntries(
  SPECIES.map((species) => [species.id, species]),
);
