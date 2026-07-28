import Phaser from 'phaser';
import { SPECIES, SPECIES_FRAMES } from '../data/species';
import { PARTICLES } from '../data/particles';
import { drawCellsToContext } from '../render/drawCells';
import { GRID_SIZE, PIXEL_SCALE, PALETTE } from '../constants';
import * as store from '../store';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create(): void {
    const size = GRID_SIZE * PIXEL_SCALE;
    for (const shape of [...SPECIES, ...PARTICLES]) {
      const texture = this.textures.createCanvas(shape.id, size, size);
      const ctx = texture?.getContext();
      if (!texture || !ctx) continue;
      drawCellsToContext(ctx, shape.cells, PIXEL_SCALE, PALETTE);
      texture.refresh();
    }

    for (const frames of SPECIES_FRAMES) {
      for (const frame of [frames.blink, frames.lookLeft, frames.lookRight]) {
        const texture = this.textures.createCanvas(frame.id, size, size);
        const ctx = texture?.getContext();
        if (!texture || !ctx) continue;
        drawCellsToContext(ctx, frame.cells, PIXEL_SCALE, PALETTE);
        texture.refresh();
      }
    }

    this.scene.start(store.getMonster() ? 'Pet' : 'Hatch');
  }
}
