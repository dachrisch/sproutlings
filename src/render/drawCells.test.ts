import { describe, expect, it } from 'vitest';
import { drawCellsToContext } from './drawCells';

function createFakeContext() {
  const calls: { style: string; x: number; y: number; w: number; h: number }[] = [];
  const ctx = {
    fillStyle: '',
    fillRect(x: number, y: number, w: number, h: number) {
      calls.push({ style: ctx.fillStyle as string, x, y, w, h });
    },
  } as unknown as CanvasRenderingContext2D;
  return { ctx, calls };
}

describe('drawCellsToContext', () => {
  it('draws each cell scaled and colored from the palette', () => {
    const { ctx, calls } = createFakeContext();
    const palette = ['#000', '#111', '#222', '#333'] as const;
    drawCellsToContext(ctx, [{ x: 1, y: 2, shade: 2 }], 4, palette);
    expect(calls).toEqual([{ style: '#222', x: 4, y: 8, w: 4, h: 4 }]);
  });

  it('draws nothing for an empty cell list', () => {
    const { ctx, calls } = createFakeContext();
    drawCellsToContext(ctx, [], 4, ['#000', '#111', '#222', '#333']);
    expect(calls).toEqual([]);
  });
});
