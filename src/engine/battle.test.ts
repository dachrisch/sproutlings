import { describe, it, expect } from 'vitest';
import { evolveState } from './battle';
import type { BattleState, PartyCreature } from '../types';

function makeCreature(overrides: Partial<PartyCreature> = {}): PartyCreature {
  return {
    creatureId: 'emberfox',
    nickname: 'Emberfox',
    level: 3,
    xp: 0,
    currentHp: 55,
    maxHp: 55,
    atk: 74,
    def: 49,
    spd: 80,
    moves: ['scratch', 'ember'],
    ...overrides,
  };
}

function makeCheckFaintState(overrides: Partial<BattleState> = {}): BattleState {
  return {
    phase: 'CHECK_FAINT',
    playerCreature: makeCreature(),
    enemyCreature: makeCreature({ creatureId: 'pebblet', nickname: 'Pebblet', currentHp: 20, maxHp: 63, level: 4 }),
    turn: 2,
    events: [],
    ...overrides,
  };
}

describe('evolveState - victory rewards', () => {
  it('populates xp reward fields in the same step that enters VICTORY', () => {
    const state = makeCheckFaintState({
      enemyCreature: makeCreature({ creatureId: 'pebblet', nickname: 'Pebblet', currentHp: 0, maxHp: 63, level: 4 }),
    });

    const next = evolveState(state);

    expect(next.phase).toBe('VICTORY');
    expect(next.xpGained).toBeGreaterThan(0);
    expect(next.xpTotal).toBe(next.playerCreature.xp);
  });

  it('carries reward fields through to END without recomputing them', () => {
    const victoryState: BattleState = {
      phase: 'VICTORY',
      playerCreature: makeCreature({ xp: 12 }),
      enemyCreature: makeCreature({ creatureId: 'pebblet', nickname: 'Pebblet', currentHp: 0, maxHp: 63 }),
      turn: 2,
      events: [],
      xpGained: 12,
      xpTotal: 12,
    };

    const next = evolveState(victoryState);

    expect(next.phase).toBe('END');
    expect(next.xpGained).toBe(12);
    expect(next.xpTotal).toBe(12);
  });

  it('unlocks a new move on level-up and appends it to the moveset', () => {
    const state = makeCheckFaintState({
      playerCreature: makeCreature({ level: 3, xp: 0, moves: ['scratch', 'ember'] }),
      enemyCreature: makeCreature({ creatureId: 'pebblet', nickname: 'Pebblet', currentHp: 0, maxHp: 63, level: 20 }),
    });

    const next = evolveState(state);

    expect(next.phase).toBe('VICTORY');
    expect(next.unlockedMove).toBe('flare');
    expect(next.playerCreature.moves).toContain('flare');
    expect(next.playerCreature.level).toBeGreaterThanOrEqual(6);
  });
});

describe('evolveState - fainted player creature', () => {
  it('routes to FORCE_SWITCH (party-wipe handling lives in the store)', () => {
    const state = makeCheckFaintState({
      playerCreature: makeCreature({ currentHp: 0 }),
    });

    const next = evolveState(state);

    expect(next.phase).toBe('FORCE_SWITCH');
  });
});

describe('evolveState - other terminal transitions', () => {
  it('moves CAUGHT to NAME_PROMPT', () => {
    const state: BattleState = {
      phase: 'CAUGHT',
      playerCreature: makeCreature(),
      enemyCreature: makeCreature({ creatureId: 'pebblet', nickname: 'Pebblet', currentHp: 10, maxHp: 63 }),
      turn: 4,
      events: [],
      caughtCreature: true,
    };

    expect(evolveState(state).phase).toBe('NAME_PROMPT');
  });

  it('moves FLED to END', () => {
    const state: BattleState = {
      phase: 'FLED',
      playerCreature: makeCreature(),
      enemyCreature: makeCreature({ creatureId: 'pebblet', nickname: 'Pebblet', currentHp: 10, maxHp: 63 }),
      turn: 4,
      events: [],
      hasRun: true,
    };

    expect(evolveState(state).phase).toBe('END');
  });
});
