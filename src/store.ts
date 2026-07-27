import type { Monster, Need, SaveData } from './types';
import { SAVE_VERSION } from './constants';
import { createMonster, applyDecay, applyAction, hasRunAway } from './state';
import { bus, EVENTS } from './bus';
import { TICK_INTERVAL_MS } from './constants';

const SAVE_KEY = 'sproutlings-save';

let _monster: Monster | null = null;
let _settings = { sound: true, reducedMotion: false };
let _timer: ReturnType<typeof setInterval> | null = null;

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
  if (hasRunAway(_monster)) {
    _monster = null;
    save();
    bus.emit(EVENTS.RUN_AWAY);
    bus.emit(EVENTS.MONSTER_UPDATED, null);
    return;
  }
  save();
  bus.emit(EVENTS.MONSTER_UPDATED, _monster);
}

export function start(): void {
  tick();
  if (_timer) return;
  _timer = setInterval(() => tick(), TICK_INTERVAL_MS);
}

export function stop(): void {
  if (_timer) {
    clearInterval(_timer);
    _timer = null;
  }
}
