import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from './store';
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

function makeCheckFaintState(playerCreature: PartyCreature): BattleState {
  return {
    phase: 'CHECK_FAINT',
    playerCreature,
    enemyCreature: makeCreature({ creatureId: 'pebblet', nickname: 'Pebblet', currentHp: 30, maxHp: 63 }),
    turn: 1,
    events: [],
  };
}

beforeEach(() => {
  useGameStore.setState({ notification: null, tab: 'battle' });
});

describe('performAction - party-wipe handling', () => {
  it('transitions to DEFEAT when the fainted creature has no healthy backup', () => {
    const fainted = makeCreature({ currentHp: 0 });
    useGameStore.setState({
      party: [fainted],
      battleState: makeCheckFaintState(fainted),
    });

    useGameStore.getState().performAction({ type: 'RUN' });

    expect(useGameStore.getState().battleState?.phase).toBe('DEFEAT');
  });

  it('stays at FORCE_SWITCH when a healthy backup creature is available', () => {
    const fainted = makeCreature({ currentHp: 0 });
    const backup = makeCreature({ creatureId: 'sparkmoth', nickname: 'Sparky', currentHp: 40 });
    useGameStore.setState({
      party: [fainted, backup],
      battleState: makeCheckFaintState(fainted),
    });

    useGameStore.getState().performAction({ type: 'RUN' });

    expect(useGameStore.getState().battleState?.phase).toBe('FORCE_SWITCH');
  });
});

describe('finishBattle', () => {
  it('resets tab to home and clears battleState after victory', () => {
    const player = makeCreature({ currentHp: 40 });
    useGameStore.setState({
      party: [player],
      battleState: {
        phase: 'VICTORY',
        playerCreature: player,
        enemyCreature: makeCreature({ creatureId: 'pebblet', nickname: 'Pebblet', currentHp: 0, maxHp: 63 }),
        turn: 3,
        events: [],
        xpGained: 12,
        xpTotal: 12,
      },
    });

    useGameStore.getState().finishBattle();

    const state = useGameStore.getState();
    expect(state.battleState).toBeNull();
    expect(state.tab).toBe('home');
    expect(state.notification).toContain('defeated');
  });

  it('heals the party and resets tab to home after defeat', () => {
    const player = makeCreature({ currentHp: 0 });
    useGameStore.setState({
      party: [player],
      battleState: {
        phase: 'DEFEAT',
        playerCreature: player,
        enemyCreature: makeCreature({ creatureId: 'pebblet', nickname: 'Pebblet', currentHp: 20, maxHp: 63 }),
        turn: 5,
        events: [],
      },
    });

    useGameStore.getState().finishBattle();

    const state = useGameStore.getState();
    expect(state.battleState).toBeNull();
    expect(state.tab).toBe('home');
    expect(state.notification).toBe('You were defeated...');
    expect(state.party[0].currentHp).toBe(state.party[0].maxHp);
  });
});
