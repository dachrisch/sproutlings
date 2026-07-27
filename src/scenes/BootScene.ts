import Phaser from 'phaser';
import { SPECIES } from '../data/species';
import { drawCellsToContext } from '../render/drawCells';
import { GRID_SIZE, PIXEL_SCALE, PALETTE } from '../constants';
import * as store from '../store';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create(): void {
    const size = GRID_SIZE * PIXEL_SCALE;
    for (const species of SPECIES) {
      const texture = this.textures.createCanvas(species.id, size, size);
      const ctx = texture?.getContext();
      if (!texture || !ctx) continue;
      drawCellsToContext(ctx, species.cells, PIXEL_SCALE, PALETTE);
      texture.refresh();
    }
    this.scene.start(store.getMonster() ? 'Pet' : 'Hatch');
  }
}
