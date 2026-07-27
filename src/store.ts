import type { Monster, Need, SaveData } from './types';
import { SAVE_VERSION } from './constants';
import { createMonster, applyDecay, applyAction } from './state';
import { bus, EVENTS } from './bus';

const SAVE_KEY = 'sproutlings-save';

let _monster: Monster | null = null;
let _settings = { sound: true, reducedMotion: false };

function save(): void {
  const data: SaveData = { version: SAVE_VERSION, monster: _monster, settings: _settings };
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch {
    // storage full or unavailable
  }
}

function load(): void {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return;
    const data: SaveData = JSON.parse(raw);
    if (data.monster) _monster = data.monster;
    if (data.settings) _settings = data.settings;
  } catch {
    // corrupt save
  }
}

load();

export function getMonster(): Monster | null {
  return _monster;
}

export function getSettings() {
  return _settings;
}

export function hatchNewMonster(): void {
  _monster = createMonster(Date.now());
  save();
  bus.emit(EVENTS.MONSTER_UPDATED, _monster);
}

export function performAction(need: Need): void {
  if (!_monster) return;
  _monster = applyAction(_monster, need, Date.now());
  save();
  bus.emit(EVENTS.ACTION, need);
  bus.emit(EVENTS.MONSTER_UPDATED, _monster);
}

export function tick(): void {
  if (!_monster) return;
  _monster = applyDecay(_monster, Date.now());
  save();
  bus.emit(EVENTS.MONSTER_UPDATED, _monster);
}
