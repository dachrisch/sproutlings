import { beforeEach, describe, expect, it, vi } from 'vitest';
import { needPercent } from './controls';

describe('needPercent', () => {
  it('converts a raw need value to a rounded percentage', () => {
    expect(needPercent(50)).toBe(50);
    expect(needPercent(33)).toBe(33);
    expect(needPercent(100)).toBe(100);
    expect(needPercent(0)).toBe(0);
  });
});

describe('initControls', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="needs">
        <div class="need-fill" id="fill-hunger"></div>
        <div class="need-fill" id="fill-happiness"></div>
        <div class="need-fill" id="fill-cleanliness"></div>
        <div class="need-fill" id="fill-energy"></div>
      </div>
      <div id="buttons">
        <button data-action="hunger"></button>
      </div>
    `;
    vi.resetModules();
  });

  it('calls store.performAction with the button need on click', async () => {
    vi.doMock('../store', () => ({
      getMonster: () => null,
      performAction: vi.fn(),
    }));
    const store = await import('../store');
    const { initControls } = await import('./controls');
    initControls();

    document.querySelector<HTMLButtonElement>('button[data-action="hunger"]')?.click();
    expect(store.performAction).toHaveBeenCalledWith('hunger');
  });

  it('fills need bars to match the monster state on monster-updated', async () => {
    vi.doMock('../store', () => ({
      getMonster: () => null,
      performAction: vi.fn(),
    }));
    const { initControls } = await import('./controls');
    const { bus, EVENTS } = await import('../bus');
    initControls();

    bus.emit(EVENTS.MONSTER_UPDATED, {
      speciesId: 'blobbin',
      hunger: 50,
      happiness: 100,
      cleanliness: 25,
      energy: 75,
      bornAt: 0,
      lastUpdate: 0,
      criticalSince: null,
    });

    expect(document.getElementById('fill-hunger')?.style.width).toBe('50%');
    expect(document.getElementById('fill-cleanliness')?.style.width).toBe('25%');
  });
});
