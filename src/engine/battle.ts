import type { BattleState, BattleEvent, PlayerAction, PartyCreature, MonsterType } from '../types';
import type { MoveDef } from '../types';
import type { Rng } from './rng';
import { createRng, random, randomInt } from './rng';
import { calcDamage } from './damage';
import { attemptCatch } from './catch';
import { xpGainValue, applyLevelUp } from './xp';
import creaturesData from '../data/creatures.json';
import movesData from '../data/moves.json';

/* ---------- internal helpers ---------- */

interface CreatureRecord {
  id: string;
  name: string;
  type: MonsterType;
  baseStats: { hp: number; atk: number; def: number; spd: number };
  moves: string[];
  catchRate: number;
  baseXp: number;
  rarity: string;
  flavour: string;
  sprite: string;
}

const creatures: CreatureRecord[] = creaturesData as CreatureRecord[];
const allMoves: MoveDef[] = movesData as MoveDef[];

function findMove(id: string): MoveDef | undefined {
  return allMoves.find(m => m.id === id);
}

function findCreature(id: string): CreatureRecord | undefined {
  return creatures.find(c => c.id === id);
}

function creatureType(id: string): MonsterType {
  return findCreature(id)?.type ?? 'stone';
}

function creatureName(id: string): string {
  return findCreature(id)?.name ?? id;
}

function creatureBaseXp(id: string): number {
  return findCreature(id)?.baseXp ?? 30;
}

function validMoves(moveIds: string[]): MoveDef[] {
  return moveIds.map(id => findMove(id)).filter((m): m is MoveDef => m !== undefined);
}

function pickRandomMove(moveIds: string[], rng: Rng): MoveDef | undefined {
  const pool = validMoves(moveIds);
  if (pool.length === 0) return undefined;
  return pool[randomInt(rng, 0, pool.length - 1)];
}

function getRng(state: BattleState): Rng {
  const s = state as unknown as Record<string, unknown>;
  if (s._rng) return s._rng as Rng;
  const newRng = createRng();
  s._rng = newRng;
  return newRng;
}

function findUnlockedMove(creatureId: string, knownMoves: string[], newLevel: number): string | undefined {
  const defn = findCreature(creatureId);
  if (!defn) return undefined;
  for (const moveId of defn.moves) {
    const move = findMove(moveId);
    if (move && move.unlockLevel <= newLevel && !knownMoves.includes(moveId)) {
      return moveId;
    }
  }
  return undefined;
}

function applyDamage(
  attacker: PartyCreature,
  defender: PartyCreature,
  move: MoveDef,
  rng: Rng,
): { damage: number; didHit: boolean; effectiveness: number } {
  return calcDamage(
    attacker.level,
    move.power,
    attacker.atk,
    defender.def,
    move.accuracy,
    rng,
    move.type,
    creatureType(defender.creatureId),
  );
}

function cleanState(raw: BattleState): BattleState {
  const r = raw as unknown as Record<string, unknown>;
  const { _pendingPlayerMoveId: _, ...rest } = r;
  return rest as unknown as BattleState;
}

/* ---------- create ---------- */

export function createBattle(playerCreature: PartyCreature, enemyCreature: PartyCreature): BattleState {
  const rng = createRng();
  const state = {
    phase: 'INTRO' as const,
    playerCreature: { ...playerCreature },
    enemyCreature: { ...enemyCreature },
    turn: 0,
    events: [] as BattleEvent[],
    _rng: rng,
  };
  return state as BattleState;
}

/* ---------- step ---------- */

export function step(state: BattleState, action: PlayerAction): { state: BattleState; events: BattleEvent[] } {
  if (state.phase === 'FORCE_SWITCH') {
    return stepForceSwitch(state, action);
  }
  if (state.phase !== 'PLAYER_ACTION') {
    return { state, events: [] };
  }

  const events: BattleEvent[] = [];

  switch (action.type) {
    case 'FIGHT': {
      const move = findMove(action.moveId);
      if (!move) {
        events.push({ type: 'message', target: 'player', text: 'Move not found!' });
        return { state: { ...state, events: [...state.events, ...events] }, events };
      }
      events.push({ type: 'message', target: 'player', moveName: move.name, text: `used ${move.name}!` });
      const next = {
        ...state,
        _pendingPlayerMoveId: action.moveId,
        phase: 'RESOLVING' as const,
        turn: state.turn + 1,
        events: [...state.events, ...events],
      } as BattleState;
      return { state: next, events };
    }

    case 'CATCH': {
      events.push({ type: 'catchAttempt', target: 'enemy', text: 'Threw a ball!' });
      const rng = getRng(state);
      const result = attemptCatch(
        state.enemyCreature.maxHp,
        state.enemyCreature.currentHp,
        findCreature(state.enemyCreature.creatureId)?.catchRate ?? 0.3,
        1.0,
        rng,
      );

      if (result.success) {
        events.push({ type: 'catchSuccess', target: 'enemy', text: `Caught! (${result.shakes} shakes)` });
        const next = {
          ...state,
          phase: 'CAUGHT' as const,
          caughtCreature: true,
          catchShakes: result.shakes,
          catchShakeResult: true,
          events: [...state.events, ...events],
        } as BattleState;
        return { state: next, events };
      }

      events.push({ type: 'catchFail', target: 'enemy', text: `Broke free! (${result.shakes} shakes)` });
      for (let i = 0; i < result.shakes; i++) {
        events.push({ type: 'catchAttempt' as const, target: 'enemy', text: '*shake*' });
      }
      events.push({ type: 'message', target: 'enemy', text: 'It broke free!' });
      const next = {
        ...state,
        phase: 'CHECK_FAINT' as const,
        catchShakes: result.shakes,
        catchShakeResult: false,
        events: [...state.events, ...events],
      } as BattleState;
      return { state: next, events };
    }

    case 'SWITCH': {
      events.push({ type: 'switch', target: 'player', text: 'Switch in!' });
      const next = {
        ...state,
        phase: 'CHECK_FAINT' as const,
        events: [...state.events, ...events],
      } as BattleState;
      return { state: next, events };
    }

    case 'RUN': {
      events.push({ type: 'run', target: 'player', text: 'Got away safely!' });
      const next = {
        ...state,
        phase: 'FLED' as const,
        hasRun: true,
        events: [...state.events, ...events],
      } as BattleState;
      return { state: next, events };
    }

    default:
      return { state, events: [] };
  }
}

function stepForceSwitch(state: BattleState, action: PlayerAction): { state: BattleState; events: BattleEvent[] } {
  if (action.type !== 'SWITCH') {
    return { state, events: [] };
  }
  const events: BattleEvent[] = [
    { type: 'switch', target: 'player', text: 'Go! You can do it!' },
  ];
  const next = {
    ...state,
    phase: 'PLAYER_ACTION' as const,
    events: [...state.events, ...events],
  } as BattleState;
  return { state: next, events };
}

/* ---------- evolve ---------- */

export function evolveState(state: BattleState): BattleState {
  switch (state.phase) {
    case 'INTRO':
      return evolveIntro(state);
    case 'RESOLVING':
      return evolveResolving(state);
    case 'CHECK_FAINT':
      return evolveCheckFaint(state);
    case 'VICTORY':
      return { ...state, phase: 'END' as const };
    case 'CAUGHT':
      return { ...state, phase: 'NAME_PROMPT' as const };
    case 'FLED':
      return { ...state, phase: 'END' as const };
    default:
      return state;
  }
}

function evolveIntro(state: BattleState): BattleState {
  const events: BattleEvent[] = [
    { type: 'message', target: 'enemy', text: `Wild ${creatureName(state.enemyCreature.creatureId)} appeared!` },
  ];
  return { ...state, phase: 'PLAYER_ACTION' as const, events: [...state.events, ...events] };
}

function evolveResolving(state: BattleState): BattleState {
  const rng = getRng(state);
  const events: BattleEvent[] = [];

  const s = state as unknown as Record<string, unknown>;
  const pendingMoveId = s._pendingPlayerMoveId as string | undefined;
  const playerMove = pendingMoveId ? findMove(pendingMoveId) : undefined;
  const enemyMove = pickRandomMove(state.enemyCreature.moves, rng);

  if (!playerMove && !enemyMove) {
    return cleanState({ ...state, phase: 'CHECK_FAINT' as const, events: [...state.events, ...events] });
  }

  const pSpd = state.playerCreature.spd;
  const eSpd = state.enemyCreature.spd;
  const playerFirst = pSpd > eSpd || (pSpd === eSpd && random(rng) < 0.5);

  let pHp = state.playerCreature.currentHp;
  let eHp = state.enemyCreature.currentHp;

  const firstMove = playerFirst ? playerMove : enemyMove;
  const secondMove = playerFirst ? enemyMove : playerMove;

  function resolveAttack(
    attackerMove: MoveDef | undefined,
    defenderHp: number,
    target: 'player' | 'enemy',
    attackerCreature: PartyCreature,
    defenderCreature: PartyCreature,
  ): number {
    if (!attackerMove) return defenderHp;
    const result = applyDamage(attackerCreature, defenderCreature, attackerMove, rng);
    if (!result.didHit) {
      events.push({ type: 'miss', target, moveName: attackerMove.name });
      return defenderHp;
    }
    const newHp = Math.max(0, defenderHp - result.damage);
    events.push({
      type: 'damage',
      target,
      amount: result.damage,
      effectiveness: result.effectiveness,
      moveName: attackerMove.name,
    });
    if (result.effectiveness > 1) {
      events.push({ type: 'message', target, text: "It's super effective!" });
    } else if (result.effectiveness < 1) {
      events.push({ type: 'message', target, text: "It's not very effective..." });
    }
    return newHp;
  }

  if (playerFirst) {
    eHp = resolveAttack(firstMove, eHp, 'enemy', state.playerCreature, state.enemyCreature);
    if (eHp > 0) {
      pHp = resolveAttack(secondMove, pHp, 'player', state.enemyCreature, state.playerCreature);
    }
  } else {
    pHp = resolveAttack(firstMove, pHp, 'player', state.enemyCreature, state.playerCreature);
    if (pHp > 0) {
      eHp = resolveAttack(secondMove, eHp, 'enemy', state.playerCreature, state.enemyCreature);
    }
  }

  const out = {
    ...state,
    playerCreature: { ...state.playerCreature, currentHp: pHp },
    enemyCreature: { ...state.enemyCreature, currentHp: eHp },
    phase: 'CHECK_FAINT' as const,
    events: [...state.events, ...events],
  } as BattleState;

  return cleanState(out);
}

function evolveCheckFaint(state: BattleState): BattleState {
  const events: BattleEvent[] = [];

  if (state.enemyCreature.currentHp <= 0) {
    events.push({ type: 'faint', target: 'enemy', text: `${creatureName(state.enemyCreature.creatureId)} fainted!` });
    return applyVictoryRewards({
      ...state,
      phase: 'VICTORY' as const,
      events: [...state.events, ...events],
    });
  }

  if (state.playerCreature.currentHp <= 0) {
    events.push({ type: 'faint', target: 'player', text: `${state.playerCreature.nickname || state.playerCreature.creatureId} fainted!` });
    return {
      ...state,
      phase: 'FORCE_SWITCH' as const,
      events: [...state.events, ...events],
    };
  }

  return { ...state, phase: 'PLAYER_ACTION' as const };
}

function applyVictoryRewards(state: BattleState): BattleState {
  const events: BattleEvent[] = [];
  const baseXp = creatureBaseXp(state.enemyCreature.creatureId);
  const gained = xpGainValue(baseXp, state.enemyCreature.level);

  const { creature: updatedPlayer, leveledUp, newLevel } = applyLevelUp(state.playerCreature, gained);

  events.push({ type: 'message', target: 'player', text: `Gained ${gained} XP!` });

  let finalCreature = updatedPlayer;
  let unlockedMove: string | undefined;

  if (leveledUp) {
    events.push({ type: 'levelUp', target: 'player', text: `${finalCreature.nickname || finalCreature.creatureId} grew to level ${newLevel}!` });
    unlockedMove = findUnlockedMove(finalCreature.creatureId, finalCreature.moves, newLevel);
    if (unlockedMove) {
      const moveDef = findMove(unlockedMove);
      const moveName = moveDef?.name ?? unlockedMove;
      events.push({ type: 'message', target: 'player', text: `${finalCreature.nickname || finalCreature.creatureId} learned ${moveName}!` });
      finalCreature = {
        ...finalCreature,
        moves: [...finalCreature.moves, unlockedMove],
      };
    }
  }

  return {
    ...state,
    playerCreature: finalCreature,
    xpGained: gained,
    xpTotal: finalCreature.xp,
    unlockedMove,
    events: [...state.events, ...events],
  };
}
