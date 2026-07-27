import type { Monster, Need, SaveData } from './types';
import { loadSave, saveSave } from './storage';
import { applyAction, applyDecay, createMonster, hasRunAway } from './state';
import { bus, EVENTS } from './bus';
import { TICK_INTERVAL_MS } from './constants';

let save: SaveData = loadSave();
let timer: ReturnType<typeof setInterval> | null = null;

function persist(): void {
  saveSave(save);
}

export function getMonster(): Monster | null {
  return save.monster;
}

export function getSettings(): SaveData['settings'] {
  return save.settings;
}

export function tick(now: number = Date.now()): void {
  if (!save.monster) return;
  const decayed = applyDecay(save.monster, now);
  if (hasRunAway(decayed)) {
    save = { ...save, monster: null };
    persist();
    bus.emit(EVENTS.RUN_AWAY);
    bus.emit(EVENTS.MONSTER_UPDATED, null);
    return;
  }
  save = { ...save, monster: decayed };
  persist();
  bus.emit(EVENTS.MONSTER_UPDATED, decayed);
}

export function performAction(need: Need): void {
  if (!save.monster) return;
  const monster = applyAction(save.monster, need, Date.now());
  save = { ...save, monster };
  persist();
  bus.emit(EVENTS.MONSTER_UPDATED, monster);
  bus.emit(EVENTS.ACTION, need);
}

export function hatchNewMonster(): void {
  const monster = createMonster(Date.now());
  save = { ...save, monster };
  persist();
  bus.emit(EVENTS.MONSTER_UPDATED, monster);
}

export function start(): void {
  tick();
  if (timer) return;
  timer = setInterval(() => tick(), TICK_INTERVAL_MS);
}

export function stop(): void {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}
