import type { PixelCell } from '../types';

export function drawCellsToContext(
  ctx: CanvasRenderingContext2D,
  cells: PixelCell[],
  scale: number,
  palette: readonly string[],
): void {
  for (const cell of cells) {
    ctx.fillStyle = palette[cell.shade];
    ctx.fillRect(cell.x * scale, cell.y * scale, scale, scale);
  }
}
