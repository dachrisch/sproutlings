import { useGameStore } from '../store/gameStore';
import { SPECIES_MAP } from '../data/species';
import { CreatureSVG } from './Creature';

export function Meadow() {
  const creatures = useGameStore((s) => s.creatures);
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

  if (creatures.length === 0) {
    return (
      <div className="meadow meadow-empty">
        <p className="meadow-hint">Hatch an egg above to see your creatures here!</p>
      </div>
    );
  }

  return (
    <div className="meadow">
      <h3 className="meadow-title">Meadow ({creatures.length})</h3>
      <div className="meadow-row">
        {creatures.map((c) => {
          const species = SPECIES_MAP[c.speciesId];
          if (!species) return null;
          return (
            <button
              key={c.uid}
              className="creature-btn"
              onClick={() => cycleHat(c.uid)}
              type="button"
            >
              <CreatureSVG species={species} sparkle={c.sparkle} hat={c.hat} size={56} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
