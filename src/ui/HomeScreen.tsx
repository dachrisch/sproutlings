import { useState, useEffect, useCallback, useRef } from 'react';
import { useGameStore } from '../state/store';
import { Sprite } from './components/Sprite';
import { HpBar } from './components/HpBar';
import creaturesData from '../data/creatures.json';
import type { CreatureDef } from '../types';

const creatures = creaturesData as CreatureDef[];

type CreatureState = {
  idx: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  frame: number;
  talking: boolean;
  message: string;
  messageTimer: number;
  petAnimation: boolean;
};

const FLAVOUR_MESSAGES = [
  'Hi!',
  'Play with me!',
  'I like it here!',
  'Can we go explore?',
  'Happy!',
  'So sleepy...',
  'Look what I found!',
  'Youre the best!',
  'Feed me!',
];

function randomMessage(): string {
  return FLAVOUR_MESSAGES[Math.floor(Math.random() * FLAVOUR_MESSAGES.length)];
}

export function HomeScreen() {
  const party = useGameStore(s => s.party);
  const petCreature = useGameStore(s => s.petCreature);
  const feedCreature = useGameStore(s => s.feedCreature);
  const setTab = useGameStore(s => s.setTab);
  const [creatureStates, setCreatureStates] = useState<CreatureState[]>([]);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [showFeedNotice, setShowFeedNotice] = useState<string | null>(null);
  const areaRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>(0);

  const areaW = 320;
  const areaH = 260;

  const initCreatures = useCallback(() => {
    if (party.length === 0) {
      setCreatureStates([]);
      return;
    }
    const cols = Math.min(party.length, 4);
    const spacing = areaW / (cols + 1);
    return party.map((_, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      return {
        idx,
        x: spacing * (col + 1),
        y: 60 + row * 80 + Math.random() * 20,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.2,
        frame: 0,
        talking: false,
        message: '',
        messageTimer: 300 + Math.floor(Math.random() * 500),
        petAnimation: false,
      };
    });
  }, [party]);

  useEffect(() => {
    const next = initCreatures();
    if (next) setCreatureStates(next);
  }, [party, initCreatures]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCreatureStates(prev => prev.map(c => {
        if (c.petAnimation) return c;
        const msg = c.talking && c.messageTimer > 0
          ? c.message
          : '';
        const talking = c.talking && c.messageTimer > 0;
        const timer = c.talking ? c.messageTimer - 1 : c.messageTimer;
        if (timer <= 0 && c.talking) {
          return {
            ...c,
            talking: false,
            message: '',
            messageTimer: 500 + Math.floor(Math.random() * 500),
          };
        }
        if (!c.talking && timer <= 0) {
          return {
            ...c,
            talking: true,
            message: randomMessage(),
            messageTimer: 120,
          };
        }
        return { ...c, talking, message: msg, messageTimer: timer };
      }));
    }, 100);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let running = true;
    const step = () => {
      if (!running) return;
      setCreatureStates(prev => prev.map(c => {
        if (c.petAnimation) return c;
        let { x, y, vx, vy } = c;
        x += vx;
        y += vy;
        if (x < 20 || x > areaW - 20) { vx *= -1; x = Math.max(20, Math.min(areaW - 20, x)); }
        if (y < 30 || y > areaH - 20) { vy *= -1; y = Math.max(30, Math.min(areaH - 20, y)); }
        if (Math.random() < 0.01) { vx += (Math.random() - 0.5) * 0.2; }
        if (Math.random() < 0.01) { vy += (Math.random() - 0.5) * 0.2; }
        vx = Math.max(-0.5, Math.min(0.5, vx));
        vy = Math.max(-0.4, Math.min(0.4, vy));
        return { ...c, x, y, vx, vy };
      }));
      animRef.current = requestAnimationFrame(step);
    };
    animRef.current = requestAnimationFrame(step);
    return () => { running = false; cancelAnimationFrame(animRef.current); };
  }, [areaW, areaH]);

  const handlePet = useCallback((idx: number) => {
    petCreature(idx);
    setCreatureStates(prev => prev.map(c =>
      c.idx === idx ? { ...c, petAnimation: true } : c
    ));
    setTimeout(() => {
      setCreatureStates(prev => prev.map(c =>
        c.idx === idx ? { ...c, petAnimation: false } : c
      ));
    }, 400);
  }, [petCreature]);

  const handleFeed = useCallback((idx: number) => {
    feedCreature(idx);
    const c = party[idx];
    if (c && c.currentHp < c.maxHp) {
      setShowFeedNotice(`${c.nickname} ate! +20 HP`);
      setTimeout(() => setShowFeedNotice(null), 1500);
    }
  }, [feedCreature, party]);

  if (party.length === 0) {
    return (
      <div className="view" style={{ textAlign: 'center', padding: 40 }}>
        <div style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: 8 }}>
          No creatures yet
        </div>
        <div style={{ fontSize: '0.85rem', color: '#7a6e6a', marginBottom: 16 }}>
          Head out to explore and find creatures!
        </div>
        <button
          className="action-btn"
          onClick={() => setTab('explore')}
          type="button"
        >
          Start Exploring
        </button>
      </div>
    );
  }

  return (
    <div className="view home-view">
      <div className="section-title">Home</div>

      <div className="home-playground" ref={areaRef}>
        <div className="home-grass" />
        <div className="home-deco home-bush" />
        <div className="home-deco home-bush home-bush-right" />
        {creatureStates.map(cs => {
          const creature = party[cs.idx];
          const def = creatures.find(c => c.id === creature.creatureId);
          return (
            <div
              key={`home-creature-${cs.idx}`}
              className={`home-creature ${cs.petAnimation ? 'sprite-pet' : cs.talking ? 'sprite-bob' : ''}`}
              style={{
                left: `${(cs.x / areaW) * 100}%`,
                top: `${(cs.y / areaH) * 100}%`,
                transform: 'translate(-50%, -50%)',
              }}
              onClick={() => setSelectedIdx(prev => prev === cs.idx ? null : cs.idx)}
            >
              <Sprite
                creatureId={creature.creatureId}
                variant="face"
                size={48}
              />
              {cs.talking && cs.message && (
                <div className="home-speech">{cs.message}</div>
              )}
              {selectedIdx === cs.idx && (
                <div className="home-tooltip">
                  <div className="home-tooltip-name">{creature.nickname}</div>
                  <div className="home-tooltip-level">Lv.{creature.level}</div>
                  <div className="home-tooltip-type">{def?.type ?? ''}</div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {showFeedNotice && (
        <div className="home-feed-notice">{showFeedNotice}</div>
      )}

      <div className="home-actions">
        <button
          className="action-btn home-action-btn"
          onClick={() => setTab('explore')}
          type="button"
        >
          Explore
        </button>
        <button
          className="action-btn home-action-btn"
          onClick={() => setTab('party')}
          type="button"
        >
          Party
        </button>
      </div>

      {selectedIdx != null && party[selectedIdx] && (() => {
        const idx = selectedIdx;
        const creature = party[idx];
        const def = creatures.find(c => c.id === creature.creatureId);
        const happiness = creature.happiness ?? 0;
        const heartCount = Math.ceil(happiness / 20);
        const canFeed = creature.currentHp < creature.maxHp;

        return (
          <div className="home-care-panel">
            <div className="home-care-info">
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
              </div>
            </div>
            <div className="home-care-buttons">
              <button
                className="action-btn"
                onClick={() => { handlePet(idx); }}
                type="button"
              >
                🖐️ Pet
              </button>
              <button
                className="action-btn"
                onClick={() => { handleFeed(idx); }}
                disabled={!canFeed}
                type="button"
              >
                🍎 Feed
              </button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
