import { bus, EVENTS } from '../bus';
import * as store from '../store';
import type { Monster, Need } from '../types';
import { NEED_MAX } from '../constants';

const NEEDS: Need[] = ['hunger', 'happiness', 'cleanliness', 'energy'];

let isBlocked = false;

export function isSceneActive(): boolean {
  return isBlocked;
}

export function blockButtons(): void {
  isBlocked = true;
  const buttons = document.getElementById('buttons');
  buttons?.querySelectorAll<HTMLButtonElement>('button[data-action]').forEach((button) => {
    button.disabled = true;
  });
}

export function unblockButtons(): void {
  isBlocked = false;
  const buttons = document.getElementById('buttons');
  buttons?.querySelectorAll<HTMLButtonElement>('button[data-action]').forEach((button) => {
    button.disabled = false;
  });
}

export function needPercent(value: number): number {
  return Math.round((value / NEED_MAX) * 100);
}

export function initControls(): void {
  const buttons = document.getElementById('buttons');
  const needsPanel = document.getElementById('needs');

  buttons?.querySelectorAll<HTMLButtonElement>('button[data-action]').forEach((button) => {
    button.addEventListener('click', () => {
      if (isBlocked) return;
      const need = button.dataset.action as Need;
      store.performAction(need);
    });
  });

  function render(monster: Monster | null): void {
    const visible = monster !== null;
    if (buttons) buttons.hidden = !visible;
    if (needsPanel) needsPanel.hidden = !visible;
    if (!monster) return;

    for (const need of NEEDS) {
      const fill = document.getElementById(`fill-${need}`);
      if (fill) fill.style.width = `${needPercent(monster[need])}%`;
    }
  }

  bus.on(EVENTS.MONSTER_UPDATED, render);
  bus.on(EVENTS.SCENE_COMPLETE, unblockButtons);
  render(store.getMonster());
}
