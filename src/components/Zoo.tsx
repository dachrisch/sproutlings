import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { SPECIES_MAP } from '../data/species';
import { CreatureSVG } from './Creature';
import { ZOO_RATE } from '../constants';

export function Zoo() {
  const creatures = useGameStore((s) => s.creatures);
  const reducedMotion = useGameStore((s) => s.settings.reducedMotion);
  const cycleHat = useGameStore((s) => s.cycleHat);
  const [selected, setSelected] = useState<string | null>(null);

  const totalRate = creatures.length * ZOO_RATE;

  if (creatures.length === 0) {
    return (
      <section className={`view zoo-view`}>
        <div className="zoo-header">
          <h2 className="section-title">Sproutlings Zoo</h2>
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
          <p className="zoo-empty-text">Your zoo is empty!</p>
          <p className="zoo-empty-hint">Go on expeditions to discover new creatures.</p>
        </div>
      </section>
    );
  }

  return (
    <section className={`view zoo-view`}>
      <div className="zoo-header">
        <div>
          <h2 className="section-title">Sproutlings Zoo</h2>
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
            const isSelected = selected === c.uid;
            return (
              <button
                key={c.uid}
                className={`zoo-creature-card ${isSelected ? 'selected' : ''}`}
                onClick={() => {
                  if (isSelected) {
                    cycleHat(c.uid);
                  } else {
                    setSelected(c.uid);
                  }
                }}
                onBlur={() => setSelected(null)}
                type="button"
              >
                <CreatureSVG
                  species={species}
                  sparkle={c.sparkle}
                  hat={c.hat}
                  size={60}
                  animate={!reducedMotion}
                />
                <span className="zoo-creature-name">
                  {species.name}
                  {c.sparkle && ' ✨'}
                </span>
                {isSelected && (
                  <div className="zoo-creature-info">
                    <span className={`zoo-rarity ${species.rarity}`}>{species.rarity}</span>
                    {useGameStore.getState().ownedHats.length > 0 && (
                      <span className="zoo-hat-hint">tap to change hat</span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
