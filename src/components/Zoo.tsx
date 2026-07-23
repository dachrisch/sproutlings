import { useState, useEffect, useCallback } from 'react';
import { useGameStore } from '../store/gameStore';
import { SPECIES_MAP } from '../data/species';
import { CreatureSVG } from './Creature';
import {
  ZOO_RATE, HAPPINESS_MAX, XP_PER_LEVEL, MAX_LEVEL,
  TRAINING_DURATION_MS, TRAINING_COST,
  EVOLVE_LEVEL_REQUIREMENT, EVOLVE_HAPPINESS_REQUIREMENT,
  LEVEL_COIN_BONUS_PER_LEVEL,
} from '../constants';
import type { OwnedCreature } from '../types';

function HappinessBar({ value }: { value: number }) {
  const pct = Math.round((value / HAPPINESS_MAX) * 100);
  const color = pct > 60 ? 'var(--c-accent)' : pct > 30 ? 'var(--c-gold)' : '#e74c3c';
  return (
    <div className="creature-bar-label">
      <span>❤️ {pct}%</span>
      <div className="creature-bar-track">
        <div className="creature-bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

function XpBar({ xp, level }: { xp: number; level: number }) {
  if (level >= MAX_LEVEL) {
    return <span className="creature-bar-label">⭐ Max Level</span>;
  }
  const needed = level * XP_PER_LEVEL;
  const pct = Math.min((xp / needed) * 100, 100);
  return (
    <div className="creature-bar-label">
      <span>⭐ Lv.{level} ({Math.floor(xp)}/{needed} XP)</span>
      <div className="creature-bar-track">
        <div className="creature-bar-fill" style={{ width: `${pct}%`, background: '#7ec8e3' }} />
      </div>
    </div>
  );
}

function CreatureDetail({ creature, onClose }: { creature: OwnedCreature; onClose: () => void }) {
  const pet = useGameStore((s) => s.pet);
  const play = useGameStore((s) => s.play);
  const startTraining = useGameStore((s) => s.startTraining);
  const collectTraining = useGameStore((s) => s.collectTraining);
  const evolve = useGameStore((s) => s.evolve);
  const coins = useGameStore((s) => s.coins);
  const cycleHat = useGameStore((s) => s.cycleHat);
  const ownedHats = useGameStore((s) => s.ownedHats);
  const species = SPECIES_MAP[creature.speciesId];
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, []);

  if (!species) return null;

  const petOnCooldown = creature.petCooldownUntil && now < creature.petCooldownUntil;
  const petRemaining = petOnCooldown ? Math.ceil((creature.petCooldownUntil! - now) / 1000) : 0;
  const playOnCooldown = creature.petCooldownUntil && now < creature.petCooldownUntil;
  const playRemaining = playOnCooldown ? Math.ceil((creature.petCooldownUntil! - now) / 1000) : 0;

  const inTraining = creature.training !== 'none' && creature.trainingStartedAt;
  const trainingDone = inTraining && now - creature.trainingStartedAt! >= TRAINING_DURATION_MS;
  const trainingProgress = inTraining
    ? Math.min((now - creature.trainingStartedAt!) / TRAINING_DURATION_MS, 1)
    : 0;

  const nextStage = creature.stage === 'baby' ? 'adult' : creature.stage === 'adult' ? 'elder' : null;
  const canEvolve = nextStage
    && creature.level >= (EVOLVE_LEVEL_REQUIREMENT as Record<string, number>)[nextStage]
    && creature.happiness >= EVOLVE_HAPPINESS_REQUIREMENT;

  const handlePet = useCallback(() => {
    pet(creature.uid);
  }, [creature.uid, pet]);

  const handlePlay = useCallback(() => {
    play(creature.uid);
  }, [creature.uid, play]);

  const handleStartTraining = useCallback((type: 'speed' | 'luck' | 'charm') => {
    startTraining(creature.uid, type);
  }, [creature.uid, startTraining]);

  const handleCollectTraining = useCallback(() => {
    collectTraining(creature.uid);
  }, [creature.uid, collectTraining]);

  const handleEvolve = useCallback(() => {
    evolve(creature.uid);
  }, [creature.uid, evolve]);

  const handleCycleHat = useCallback(() => {
    cycleHat(creature.uid);
  }, [creature.uid, cycleHat]);

  const stageIcon = creature.stage === 'baby' ? '🍼' : creature.stage === 'adult' ? '🌿' : '👑';

  return (
    <div className="zoo-detail-overlay" onClick={onClose}>
      <div className="zoo-detail" onClick={(e) => e.stopPropagation()}>
        <button className="zoo-detail-close" onClick={onClose} type="button">✕</button>
        <div className="zoo-detail-creature">
          <CreatureSVG species={species} sparkle={creature.sparkle} hat={creature.hat} size={80} animate stage={creature.stage} />
        </div>
        <div className="zoo-detail-name">
          {species.name} {creature.sparkle && '✨'}
        </div>
        <div className="zoo-detail-stage">{stageIcon} {creature.stage}</div>

        <div className="zoo-detail-stats">
          <HappinessBar value={creature.happiness} />
          <XpBar xp={creature.xp} level={creature.level} />
          <div className="creature-stat-row">
            <span>💰 +{(ZOO_RATE * (1 + (creature.level - 1) * LEVEL_COIN_BONUS_PER_LEVEL)).toFixed(2)}/s</span>
          </div>
        </div>

        <div className="zoo-detail-actions">
          <div className="zoo-detail-actions-row">
            <button
              className="action-btn"
              onClick={handlePet}
              disabled={!!petOnCooldown}
              type="button"
            >
              🖐️ Pet{petOnCooldown ? ` (${petRemaining}s)` : ''}
            </button>
            <button
              className="action-btn"
              onClick={handlePlay}
              disabled={!!playOnCooldown}
              type="button"
            >
              🎾 Play{playOnCooldown ? ` (${playRemaining}s)` : ''}
            </button>
            {ownedHats.length > 0 && (
              <button className="action-btn" onClick={handleCycleHat} type="button">
                🎩 Hat
              </button>
            )}
          </div>

          <div className="zoo-detail-training">
            {inTraining ? (
              <div className="training-section">
                <div className="creature-bar-label">Training: {creature.training}</div>
                <div className="creature-bar-track">
                  <div className="creature-bar-fill" style={{ width: `${trainingProgress * 100}%`, background: '#f5b342' }} />
                </div>
                {trainingDone ? (
                  <button className="action-btn" onClick={handleCollectTraining} type="button">
                    🎓 Collect Training
                  </button>
                ) : (
                  <span className="training-time">
                    {Math.ceil((TRAINING_DURATION_MS - (now - creature.trainingStartedAt!)) / 1000)}s remaining
                  </span>
                )}
              </div>
            ) : (
              <div className="training-buttons">
                <span className="training-label">Train ({TRAINING_COST}🪙):</span>
                <div className="training-btn-row">
                  <button
                    className="action-btn small"
                    onClick={() => handleStartTraining('speed')}
                    disabled={coins < TRAINING_COST}
                    type="button"
                  >
                    ⚡ Speed
                  </button>
                  <button
                    className="action-btn small"
                    onClick={() => handleStartTraining('luck')}
                    disabled={coins < TRAINING_COST}
                    type="button"
                  >
                    🍀 Luck
                  </button>
                  <button
                    className="action-btn small"
                    onClick={() => handleStartTraining('charm')}
                    disabled={coins < TRAINING_COST}
                    type="button"
                  >
                    💖 Charm
                  </button>
                </div>
              </div>
            )}
          </div>

          {canEvolve && nextStage && (
            <button className="action-btn evolve-btn" onClick={handleEvolve} type="button">
              🌟 Evolve to {nextStage}!
            </button>
          )}

          {!canEvolve && nextStage && (
            <div className="evolve-hint">
              Evolve to {nextStage}: need Lv.{(EVOLVE_LEVEL_REQUIREMENT as Record<string, number>)[nextStage]}, ❤️ {EVOLVE_HAPPINESS_REQUIREMENT}%
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function Zoo() {
  const creatures = useGameStore((s) => s.creatures);
  const reducedMotion = useGameStore((s) => s.settings.reducedMotion);
  const [selected, setSelected] = useState<string | null>(null);

  const totalRate = creatures.reduce((sum, c) => {
    const base = ZOO_RATE * (1 + (c.level - 1) * LEVEL_COIN_BONUS_PER_LEVEL);
    const happinessRatio = c.happiness / HAPPINESS_MAX;
    const happinessMult = 0.5 + happinessRatio * 1.5;
    return sum + base * happinessMult;
  }, 0);

  if (creatures.length === 0) {
    return (
      <section className="view zoo-view">
        <div className="zoo-header">
          <h2 className="section-title">Sproutlings Sanctuary</h2>
          <span className="zoo-stat">{creatures.length} creatures</span>
        </div>
        <div className="zoo-empty">
          <div className="zoo-empty-art">
            <svg width="120" height="100" viewBox="0 0 120 100">
              <rect x="10" y="70" width="100" height="8" rx="4" fill="#c4956a" />
              <rect x="20" y="50" width="80" height="22" rx="4" fill="#a67b55" />
              <path d="M30,50 L30,40 Q30,30 40,30 L80,30 Q90,30 90,40 L90,50" fill="#f5f0e8" stroke="#d4cfc4" strokeWidth="2" />
              <circle cx="55" cy="42" r="4" fill="#d4cfc4" />
              <circle cx="65" cy="42" r="4" fill="#d4cfc4" />
              <path d="M56,46 Q60,50 64,46" fill="none" stroke="#d4cfc4" strokeWidth="1.5" />
            </svg>
          </div>
          <p className="zoo-empty-text">Your sanctuary is empty!</p>
          <p className="zoo-empty-hint">Go on expeditions to discover new creatures.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="view zoo-view">
      <div className="zoo-header">
        <div>
          <h2 className="section-title">Sproutlings Sanctuary</h2>
          <span className="zoo-rate">+{totalRate.toFixed(2)} 🪙/s from visitors</span>
        </div>
        <span className="zoo-stat">{creatures.length} creatures</span>
      </div>

      <div className="zoo-enclosure">
        <div className="zoo-grass" />
        <div className="zoo-creatures">
          {creatures.map((c) => {
            const species = SPECIES_MAP[c.speciesId];
            if (!species) return null;
            const stageIcon = c.stage === 'baby' ? '🍼' : c.stage === 'adult' ? '🌿' : '👑';
            return (
              <button
                key={c.uid}
                className={`zoo-creature-card ${selected === c.uid ? 'selected' : ''}`}
                onClick={() => setSelected(c.uid)}
                type="button"
              >
                <CreatureSVG
                  species={species}
                  sparkle={c.sparkle}
                  hat={c.hat}
                  size={60}
                  animate={!reducedMotion}
                  stage={c.stage}
                />
                <span className="zoo-creature-name">
                  {species.name}
                  {c.sparkle && '✨'}
                </span>
                <span className="zoo-stage-icon">{stageIcon}</span>
                <span className="zoo-level-badge">Lv.{c.level}</span>
                <div className="zoo-happiness-dot" style={{
                  background: c.happiness > 60 ? 'var(--c-accent)' : c.happiness > 30 ? 'var(--c-gold)' : '#e74c3c',
                }} />
              </button>
            );
          })}
        </div>
      </div>

      {selected && (() => {
        const c = creatures.find((cr) => cr.uid === selected);
        if (!c) return null;
        return (
          <CreatureDetail
            creature={c}
            onClose={() => setSelected(null)}
          />
        );
      })()}
    </section>
  );
}
