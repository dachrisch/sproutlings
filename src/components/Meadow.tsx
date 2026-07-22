import { useGameStore } from '../store/gameStore';
import { SPECIES_MAP } from '../data/species';
import { CreatureSVG } from './Creature';

export function Meadow() {
  const creatures = useGameStore((s) => s.creatures);
  const reducedMotion = useGameStore((s) => s.settings.reducedMotion);

  const graduated = creatures.filter((c) => c.location === 'meadow');

  const cycleHat = (uid: string) => {
    const state = useGameStore.getState();
    const creature = state.creatures.find((c) => c.uid === uid);
    if (!creature) return;
    const allHats = [null, ...state.ownedHats];
    const idx = allHats.indexOf(creature.hat);
    const nextHat = allHats[(idx + 1) % allHats.length];
    useGameStore.setState({
      creatures: state.creatures.map((c) => (c.uid === uid ? { ...c, hat: nextHat } : c)),
    });
  };

  if (graduated.length === 0) {
    return (
      <div className="meadow meadow-empty">
        <p className="meadow-hint">Raise a creature to adulthood to see it here!</p>
      </div>
    );
  }

  const totalRate = graduated.length * 0.05;

  return (
    <div className="meadow">
      <div className="meadow-header">
        <h3 className="meadow-title">Graduated friends</h3>
        <span className="meadow-rate">+{totalRate.toFixed(2)} 🪙/s</span>
      </div>
      <div className="meadow-row">
        {graduated.map((c) => {
          const species = SPECIES_MAP[c.speciesId];
          if (!species) return null;
          return (
            <button
              key={c.uid}
              className="creature-btn"
              onClick={() => cycleHat(c.uid)}
              type="button"
              title="Tap to change hat"
            >
              <CreatureSVG
                species={species}
                sparkle={c.sparkle}
                hat={c.hat}
                size={56}
                animate={!reducedMotion}
                stage={c.stage}
                track={c.track ?? undefined}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
