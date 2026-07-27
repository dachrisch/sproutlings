import { describe, expect, it } from 'vitest';
import { filledCircle, mergeCells } from './pixelShapes';

describe('filledCircle', () => {
  it('includes the center cell', () => {
    expect(filledCircle(3, 3, 2, 2)).toContainEqual({ x: 3, y: 3, shade: 2 });
  });

  it('excludes cells far outside the radius', () => {
    const cells = filledCircle(3, 3, 1, 1);
    expect(cells.some((c) => c.x === 10 && c.y === 10)).toBe(false);
  });

  it('produces a cell count close to the circle area', () => {
    const r = 4;
    const cells = filledCircle(10, 10, r, 1);
    const area = Math.PI * r * r;
    expect(cells.length).toBeGreaterThan(area * 0.7);
    expect(cells.length).toBeLessThan(area * 1.3);
  });

  it('tags every cell with the given shade', () => {
    const cells = filledCircle(2, 2, 2, 3);
    expect(cells.every((c) => c.shade === 3)).toBe(true);
  });
});

describe('mergeCells', () => {
  it('lets later layers override earlier cells at the same coordinate', () => {
    const base = [{ x: 0, y: 0, shade: 1 as const }];
    const overlay = [{ x: 0, y: 0, shade: 3 as const }];
    expect(mergeCells(base, overlay)).toEqual([{ x: 0, y: 0, shade: 3 }]);
  });

  it('keeps cells from all layers when coordinates do not collide', () => {
    const a = [{ x: 0, y: 0, shade: 1 as const }];
    const b = [{ x: 1, y: 1, shade: 2 as const }];
    const merged = mergeCells(a, b);
    expect(merged).toHaveLength(2);
    expect(merged).toContainEqual({ x: 0, y: 0, shade: 1 });
    expect(merged).toContainEqual({ x: 1, y: 1, shade: 2 });
  });
});
