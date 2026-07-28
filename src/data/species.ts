import type { PixelCell, Species } from '../types';
import { GRID_SIZE } from '../constants';
import { filledCircle, mergeCells, shiftCells, closeEyes } from './pixelShapes';

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

const blobbinCells = mergeCells(blobbinBody, blobbinFeet, blobbinEyes);
const nubkinCells = mergeCells(nubkinBody, nubkinHorns, nubkinEyes);
const fizzleCells = mergeCells(fizzleBody, fizzleFin, fizzleEyes);

export const SPECIES: Species[] = [
  { id: 'blobbin', name: 'Blobbin', cells: blobbinCells },
  { id: 'nubkin', name: 'Nubkin', cells: nubkinCells },
  { id: 'fizzle', name: 'Fizzle', cells: fizzleCells },
];

export const SPECIES_MAP: Record<string, Species> = Object.fromEntries(
  SPECIES.map((species) => [species.id, species]),
);

export interface SpeciesFrame {
  id: string;
  cells: PixelCell[];
}

export interface SpeciesFrames {
  speciesId: string;
  base: SpeciesFrame;
  blink: SpeciesFrame;
  lookLeft: SpeciesFrame;
  lookRight: SpeciesFrame;
}

function buildFrames(speciesId: string, cells: PixelCell[]): SpeciesFrames {
  return {
    speciesId,
    base: { id: speciesId, cells },
    blink: { id: `${speciesId}_blink`, cells: closeEyes(cells) },
    lookLeft: { id: `${speciesId}_lookLeft`, cells: shiftCells(cells, -1, 0, GRID_SIZE) },
    lookRight: { id: `${speciesId}_lookRight`, cells: shiftCells(cells, 1, 0, GRID_SIZE) },
  };
}

export const SPECIES_FRAMES: SpeciesFrames[] = [
  buildFrames('blobbin', blobbinCells),
  buildFrames('nubkin', nubkinCells),
  buildFrames('fizzle', fizzleCells),
];
