import type { PixelCell } from '../types';

export function filledCircle(cx: number, cy: number, r: number, shade: 1 | 2 | 3): PixelCell[] {
  const cells: PixelCell[] = [];
  const minY = Math.floor(cy - r);
  const maxY = Math.ceil(cy + r);
  const minX = Math.floor(cx - r);
  const maxX = Math.ceil(cx + r);
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const dx = x - cx + 0.5;
      const dy = y - cy + 0.5;
      if (dx * dx + dy * dy <= r * r) {
        cells.push({ x, y, shade });
      }
    }
  }
  return cells;
}

export function mergeCells(...layers: PixelCell[][]): PixelCell[] {
  const byKey = new Map<string, PixelCell>();
  for (const layer of layers) {
    for (const cell of layer) {
      byKey.set(`${cell.x},${cell.y}`, cell);
    }
  }
  return [...byKey.values()];
}

export function shiftCells(cells: PixelCell[], dx: number, dy: number, gridSize: number): PixelCell[] {
  return cells
    .map((cell) => ({ ...cell, x: cell.x + dx, y: cell.y + dy }))
    .filter((cell) => cell.x >= 0 && cell.x < gridSize && cell.y >= 0 && cell.y < gridSize);
}

export function closeEyes(cells: PixelCell[]): PixelCell[] {
  return cells.map((cell) =>
    cell.shade === 3 ? { ...cell, shade: 2 as const } : cell
  );
}
