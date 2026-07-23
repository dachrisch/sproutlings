import { useState, useCallback } from 'react';
import { useGameStore } from '../state/store';
import { Sprite } from './components/Sprite';
import { HpBar } from './components/HpBar';
import creaturesData from '../data/creatures.json';
import type { CreatureDef } from '../types';

const creatures = creaturesData as CreatureDef[];

export function CareScreen() {
  const party = useGameStore(s => s.party);
  const petCreature = useGameStore(s => s.petCreature);
  const feedCreature = useGameStore(s => s.feedCreature);
  const [frames, setFrames] = useState<Record<number, number>>({});
  const [hearts, setHearts] = useState<{ idx: number; id: number }[]>([]);
  const [heartId, setHeartId] = useState(0);

  const toggleFrame = useCallback((idx: number) => {
    setFrames(prev => ({ ...prev, [idx]: (prev[idx] ?? 0) + 1 }));
  }, []);

  const handlePet = useCallback((idx: number) => {
    petCreature(idx);
    const id = heartId;
    setHeartId(prev => prev + 1);
    setHearts(prev => [...prev, { idx, id }]);
    setTimeout(() => {
      setHearts(prev => prev.filter(h => h.id !== id));
    }, 800);
  }, [petCreature, heartId]);

  const handleFeed = useCallback((idx: number) => {
    feedCreature(idx);
  }, [feedCreature]);

  if (party.length === 0) {
    return (
      <div className="view" style={{ textAlign: 'center', padding: 40 }}>
        <div style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: 8 }}>
          No creatures yet
        </div>
        <div style={{ fontSize: '0.85rem', color: '#7a6e6a' }}>
          Explore biomes to find creatures to care for!
        </div>
      </div>
    );
  }

  return (
    <div className="view care-view">
      <div className="section-title">Care</div>
      <div className="care-list">
        {party.map((creature, idx) => {
          const def = creatures.find(c => c.id === creature.creatureId);
          const happiness = creature.happiness ?? 0;
          const heartCount = Math.ceil(happiness / 20);
          const canFeed = creature.currentHp < creature.maxHp;

          return (
            <div key={`${creature.creatureId}-${idx}`} className="care-card" style={{ position: 'relative' }}>
              <div style={{ position: 'relative' }}>
                <Sprite
                  creatureId={creature.creatureId}
                  variant="face"
                  size={56}
                  animate
                  frame={frames[idx] ?? 0}
                  onFrameChange={() => toggleFrame(idx)}
                />
                {hearts.filter(h => h.idx === idx).map(h => (
                  <span key={h.id} className="heart-float" style={{ top: -4, left: '50%' }}>
                    ❤️
                  </span>
                ))}
              </div>
              <div className="care-info">
                <div className="care-name-row">
                  <span className="care-nickname">{creature.nickname}</span>
                  <span className="care-level">Lv.{creature.level}</span>
                </div>
                <div className="care-species" style={{ fontSize: '0.75rem', color: '#7a6e6a', fontWeight: 600 }}>
                  {def?.name ?? creature.creatureId}
                </div>
                <HpBar
                  current={creature.currentHp}
                  max={creature.maxHp}
                  creatureType={def?.type ?? 'stone'}
                />
                <div className="care-happiness">
                  {Array.from({ length: 5 }, (_, i) => (
                    <span key={i} className={i < heartCount ? 'care-heart-filled' : 'care-heart-empty'}>
                      ♥
                    </span>
                  ))}
                  <span style={{ marginLeft: 4 }}>{happiness}/100</span>
                </div>
                <div className="care-actions">
                  <button
                    className="care-btn care-btn-pet"
                    onClick={() => handlePet(idx)}
                    type="button"
                  >
                    🖐️ Pet
                  </button>
                  <button
                    className="care-btn care-btn-feed"
                    onClick={() => handleFeed(idx)}
                    disabled={!canFeed}
                    type="button"
                  >
                    🍎 Feed
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
