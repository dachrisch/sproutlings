import { useState, useEffect, useCallback } from 'react';
import type { BattlePhase, CreatureDef, PartyCreature } from '../types';
import { useGameStore } from '../state/store';
import { useBattleAudio } from '../state/audioManager';
import { Sprite } from './components/Sprite';
import { MoveGrid } from './components/MoveGrid';
import { HpBar } from './components/HpBar';
import { DamagePopup } from './shared/DamagePopup';
import creatures from '../data/creatures.json';

function getCreature(id: string): CreatureDef | undefined {
  return (creatures as CreatureDef[]).find(c => c.id === id);
}

export function BattleScreen() {
  const battleState = useGameStore(s => s.battleState);
  const performAction = useGameStore(s => s.performAction);
  const advanceBattle = useGameStore(s => s.advanceBattle);
  const finishBattle = useGameStore(s => s.finishBattle);
  const party = useGameStore(s => s.party);
  const setName = useGameStore(s => s.setName);
  const balls = useGameStore(s => s.balls);
  const setTab = useGameStore(s => s.setTab);
  const healAll = useGameStore(s => s.healAll);

  const [nickname, setNickname] = useState('');
  const [showSwitch, setShowSwitch] = useState(false);
  const [popups, setPopups] = useState<{ id: number; amount: number; effectiveness?: number; x: number; y: number }[]>([]);
  const [popupId, setPopupId] = useState(0);
  const [shakePhase, setShakePhase] = useState<'idle' | 'shaking' | 'success' | 'fail'>('idle');
  const [fainted, setFainted] = useState<'none' | 'enemy' | 'player'>('none');

  useBattleAudio(battleState);

  const phase: BattlePhase | null = battleState?.phase ?? null;
  const playerCreature: PartyCreature | null = battleState?.playerCreature ?? null;
  const enemyCreature: PartyCreature | null = battleState?.enemyCreature ?? null;
  const lastEvent = battleState?.events?.[battleState.events.length - 1] ?? null;

  const playerDef = playerCreature ? getCreature(playerCreature.creatureId) : null;
  const enemyDef = enemyCreature ? getCreature(enemyCreature.creatureId) : null;

  useEffect(() => {
    setShowSwitch(false);
    if (phase === 'CAUGHT') {
      const shakes = battleState?.catchShakes ?? 3;
      const delay = battleState?.catchShakeResult ? 500 : 400;
      setShakePhase('shaking');
      const totalTime = shakes * delay + 300;
      setTimeout(() => {
        setShakePhase(battleState?.catchShakeResult ? 'success' : 'fail');
      }, totalTime);
    }
    if (phase === 'INTRO') {
      setFainted('none');
      setShakePhase('idle');
    }
  }, [phase, battleState?.catchShakes, battleState?.catchShakeResult]);

  useEffect(() => {
    if (phase === 'NAME_PROMPT' && enemyDef) {
      setNickname(enemyDef.name);
    }
  }, [phase, enemyDef]);

  useEffect(() => {
    if (phase === 'CAUGHT') {
      const shakes = battleState?.catchShakes ?? 3;
      const delay = battleState?.catchShakeResult ? 600 : 400;
      const total = shakes * 400 + delay;
      const t = setTimeout(() => advanceBattle(), total);
      return () => clearTimeout(t);
    }
  }, [phase, battleState?.catchShakes, battleState?.catchShakeResult, advanceBattle]);

  useEffect(() => {
    if (phase === 'END') {
      finishBattle();
    }
  }, [phase, finishBattle]);

  useEffect(() => {
    if (phase === 'RESOLVING') {
      const t = setTimeout(() => advanceBattle(), 600);
      return () => clearTimeout(t);
    }
  }, [phase, advanceBattle]);

  useEffect(() => {
    if (phase === 'VICTORY') {
      const t = setTimeout(() => advanceBattle(), 1000);
      return () => clearTimeout(t);
    }
  }, [phase, advanceBattle]);

  useEffect(() => {
    if (phase === 'FLED') {
      const t = setTimeout(() => advanceBattle(), 1200);
      return () => clearTimeout(t);
    }
  }, [phase, advanceBattle]);

  useEffect(() => {
    if (lastEvent?.type === 'damage' && lastEvent.amount != null) {
      const id = popupId;
      setPopupId(prev => prev + 1);
      const isEnemy = lastEvent.target === 'enemy';
      setPopups(prev => [...prev, {
        id,
        amount: lastEvent.amount!,
        effectiveness: lastEvent.effectiveness,
        x: isEnemy ? 50 : 50,
        y: isEnemy ? 25 : 70,
      }]);
    }
    if (lastEvent?.type === 'faint') {
      setFainted(lastEvent.target === 'enemy' ? 'enemy' : 'player');
    }
  }, [lastEvent, popupId]);

  const handleMoveSelect = useCallback((moveId: string) => {
    performAction({ type: 'FIGHT', moveId });
  }, [performAction]);

  const handleCatch = useCallback(() => {
    performAction({ type: 'CATCH' });
  }, [performAction]);

  const handleRun = useCallback(() => {
    performAction({ type: 'RUN' });
  }, [performAction]);

  const handleSwitchSelect = useCallback((idx: number) => {
    setShowSwitch(false);
    performAction({ type: 'SWITCH', partyIndex: idx });
  }, [performAction]);

  const handleNicknameConfirm = useCallback(() => {
    if (!enemyCreature) return;
    const alive = party.filter(p => p.currentHp > 0);
    setName(alive.length, nickname);
    finishBattle();
  }, [enemyCreature, finishBattle, nickname, party, setName]);

  const handleDefeatRetry = useCallback(() => {
    healAll();
    setTab('biomes');
  }, [healAll, setTab]);

  const handlePopupDone = useCallback((id: number) => {
    setPopups(prev => prev.filter(p => p.id !== id));
  }, []);

  if (!battleState || !playerCreature || !enemyCreature) return null;

  const partyAlive = party.filter(p => p.currentHp > 0);
  const switchCandidates = phase === 'FORCE_SWITCH'
    ? partyAlive.filter(p => p.creatureId !== playerCreature.creatureId)
    : partyAlive;

  const enemyOpacity = fainted === 'enemy' ? 0.3 : 1;
  const playerOpacity = fainted === 'player' ? 0.3 : 1;

  const renderTopArea = () => (
    <div
      style={{
        flex: 4,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        padding: '16px 16px 4px',
      }}
    >
      {phase === 'INTRO' ? (
        <>
          <Sprite creatureId={enemyCreature.creatureId} variant="front" size={112} />
          <div
            style={{
              fontSize: '1rem',
              fontWeight: 800,
              marginTop: 12,
              textAlign: 'center',
            }}
          >
            A wild {enemyDef?.name ?? '???'} appeared!
          </div>
          <button
            onClick={() => advanceBattle()}
            style={{
              marginTop: 16,
              padding: '14px 48px',
              borderRadius: 22,
              background: '#6abf69',
              color: '#fff',
              border: 'none',
              fontWeight: 800,
              fontSize: '1.1rem',
              cursor: 'pointer',
              minHeight: 44,
              fontFamily: 'inherit',
            }}
          >
            Fight!
          </button>
        </>
      ) : (
        <div style={{ opacity: enemyOpacity, transition: 'opacity 0.5s' }}>
          <Sprite creatureId={enemyCreature.creatureId} variant="front" size={96} />
          {shakePhase !== 'idle' && (
            <div
              style={{
                position: 'absolute',
                top: '40%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                fontSize: '2rem',
                fontWeight: 800,
                color: shakePhase === 'success' ? '#6abf69' : '#e74c3c',
                textShadow: '0 2px 8px rgba(0,0,0,0.3)',
                animation: shakePhase === 'shaking' ? 'shake 0.3s infinite' : 'none',
              }}
            >
              {shakePhase === 'shaking' && '⚾'}
              {shakePhase === 'success' && '⭐'}
              {shakePhase === 'fail' && '💥'}
            </div>
          )}
        </div>
      )}

      {popups.map(p => (
        <DamagePopup
          key={p.id}
          amount={p.amount}
          effectiveness={p.effectiveness}
          x={p.x}
          y={p.y}
          onDone={() => handlePopupDone(p.id)}
        />
      ))}
    </div>
  );

  const renderHpArea = () => (
    <div
      style={{
        flex: 1,
        padding: '2px 16px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}
    >
      <HpBar
        current={enemyCreature.currentHp}
        max={enemyCreature.maxHp}
        creatureType={enemyDef?.type ?? 'stone'}
        label={enemyDef?.name ?? '???'}
      />
    </div>
  );

  const renderPlayerArea = () => (
    <div
      style={{
        flex: 4,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '4px 16px 8px',
        gap: 6,
        opacity: playerOpacity,
        transition: 'opacity 0.5s',
      }}
    >
      <Sprite creatureId={playerCreature.creatureId} variant="back" size={72} />
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          width: '100%',
          maxWidth: 280,
        }}
      >
        <div
          style={{
            fontSize: '0.85rem',
            fontWeight: 700,
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          <span>{playerCreature.nickname}</span>
          <span style={{ color: '#7a6e6a' }}>Lv.{playerCreature.level}</span>
        </div>
        <HpBar
          current={playerCreature.currentHp}
          max={playerCreature.maxHp}
          creatureType={playerDef?.type ?? 'stone'}
        />
      </div>
    </div>
  );

  const renderActions = () => {
    switch (phase) {
      case 'PLAYER_ACTION':
        return (
          <div
            style={{
              padding: '8px 12px',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            {showSwitch ? (
              <PartySelectList
                candidates={switchCandidates}
                onSelect={handleSwitchSelect}
                onCancel={() => setShowSwitch(false)}
              />
            ) : (
              <>
                <MoveGrid
                  moves={playerCreature.moves}
                  onSelect={handleMoveSelect}
                />
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                  <ActionBtn onClick={handleCatch} label={`Catch (${balls})`} />
                  <ActionBtn
                    onClick={() => setShowSwitch(true)}
                    label="Switch"
                    disabled={switchCandidates.length === 0}
                  />
                  <ActionBtn onClick={handleRun} label="Run" />
                </div>
              </>
            )}
          </div>
        );

      case 'FORCE_SWITCH':
        return (
          <div style={{ padding: '8px 12px', overflowY: 'auto', maxHeight: 200 }}>
            <div
              style={{
                fontSize: '0.85rem',
                fontWeight: 700,
                marginBottom: 8,
                textAlign: 'center',
              }}
            >
              {playerCreature.currentHp <= 0
                ? `${playerCreature.nickname} fainted! Choose another:`
                : 'Choose a creature:'}
            </div>
            <PartySelectList
              candidates={switchCandidates}
              onSelect={handleSwitchSelect}
            />
          </div>
        );

      case 'VICTORY':
        return (
          <div
            style={{
              padding: 16,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#6abf69' }}>
              Victory!
            </div>
            {battleState.xpGained != null && (
              <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                +{battleState.xpGained} XP
              </div>
            )}
            {battleState.xpTotal != null && (
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#7a6e6a' }}>
                Total: {battleState.xpTotal} XP
              </div>
            )}
            {battleState.unlockedMove && (
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#4a9fff' }}>
                Learned {battleState.unlockedMove}!
              </div>
            )}
          </div>
        );

      case 'NAME_PROMPT':
        return (
          <div
            style={{
              padding: 16,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <div style={{ fontSize: '0.9rem', fontWeight: 700, textAlign: 'center' }}>
              You caught {enemyDef?.name}! Give it a nickname:
            </div>
            <input
              value={nickname}
              onChange={e => setNickname(e.target.value)}
              style={{
                padding: '10px 14px',
                border: '2px solid #d4cfc4',
                borderRadius: 12,
                fontSize: '1rem',
                fontWeight: 700,
                width: '100%',
                maxWidth: 280,
                textAlign: 'center',
                fontFamily: 'inherit',
                color: '#3a2e2a',
              }}
              autoFocus
            />
            <button
              onClick={handleNicknameConfirm}
              style={{
                padding: '14px 48px',
                borderRadius: 22,
                background: '#6abf69',
                color: '#fff',
                border: 'none',
                fontWeight: 800,
                fontSize: '1rem',
                cursor: 'pointer',
                minHeight: 44,
                fontFamily: 'inherit',
              }}
            >
              Confirm
            </button>
          </div>
        );

      case 'DEFEAT':
        return (
          <div
            style={{
              padding: 16,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#e74c3c' }}>
              You lost!
            </div>
            <button
              onClick={handleDefeatRetry}
              style={{
                padding: '14px 48px',
                borderRadius: 22,
                background: '#4a9fff',
                color: '#fff',
                border: 'none',
                fontWeight: 800,
                fontSize: '1rem',
                cursor: 'pointer',
                minHeight: 44,
                fontFamily: 'inherit',
              }}
            >
              Try Again
            </button>
          </div>
        );

      case 'RESOLVING':
        return (
          <div
            style={{
              padding: 16,
              textAlign: 'center',
              fontSize: '0.85rem',
              fontWeight: 700,
              color: '#7a6e6a',
            }}
          >
            {lastEvent?.text ?? '...'}
          </div>
        );

      case 'CAUGHT':
      case 'FLED':
      case 'END':
        return null;

      default:
        return null;
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        background: 'linear-gradient(180deg, #87CEEB 0%, #98D8C8 50%, #7BBF7A 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {renderTopArea()}
      {renderHpArea()}
      {renderPlayerArea()}
      <div
        style={{
          flex: '0 0 auto',
          borderTop: '2px solid rgba(0,0,0,0.1)',
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
        }}
      >
        {renderActions()}
      </div>
    </div>
  );
}

function ActionBtn({
  onClick, label, disabled,
}: {
  onClick: () => void; label: string; disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        flex: 1,
        padding: '12px 8px',
        border: '2px solid #d4cfc4',
        borderRadius: 12,
        background: disabled ? '#f0ece6' : '#fff',
        cursor: disabled ? 'default' : 'pointer',
        fontWeight: 700,
        fontSize: '0.8rem',
        minHeight: 44,
        fontFamily: 'inherit',
        color: disabled ? '#b0a8a0' : '#3a2e2a',
        opacity: disabled ? 0.6 : 1,
      }}
    >
      {label}
    </button>
  );
}

function PartySelectList({
  candidates, onSelect, onCancel,
}: {
  candidates: PartyCreature[]; onSelect: (idx: number) => void; onCancel?: () => void;
}) {
  const party = useGameStore(s => s.party);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {candidates.map(p => {
        const idx = party.findIndex(pp => pp.creatureId === p.creatureId && pp.nickname === p.nickname);
        return (
          <button
            key={`${p.creatureId}-${idx}`}
            onClick={() => onSelect(idx)}
            style={{
              padding: '10px 14px',
              border: '2px solid #d4cfc4',
              borderRadius: 12,
              background: '#fff',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.85rem',
              minHeight: 44,
              fontFamily: 'inherit',
              color: '#3a2e2a',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span
              style={{
                width: 24, height: 24, borderRadius: '50%',
                background: '#e8f5e0', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                fontSize: '0.7rem', fontWeight: 800, flexShrink: 0,
              }}
            >
              {p.level}
            </span>
            <span style={{ flex: 1, textAlign: 'left' }}>{p.nickname}</span>
            <span style={{ color: '#7a6e6a', fontSize: '0.75rem' }}>
              {p.currentHp}/{p.maxHp} HP
            </span>
          </button>
        );
      })}
      {onCancel && (
        <button
          onClick={onCancel}
          style={{
            padding: '10px 14px', border: '2px solid #d4cfc4',
            borderRadius: 12, background: '#f0ece6', cursor: 'pointer',
            fontWeight: 700, fontSize: '0.85rem', minHeight: 44,
            fontFamily: 'inherit', color: '#7a6e6a',
          }}
        >
          Cancel
        </button>
      )}
    </div>
  );
}
