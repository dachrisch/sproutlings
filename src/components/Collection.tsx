import { useGameStore } from '../store/gameStore';
import { SPECIES } from '../data/species';
import { CreatureSVG } from './Creature';

export function Collection() {
  const dex = useGameStore((s) => s.dex);
  const found = Object.values(dex).filter((e) => e.normal).length;
  const total = SPECIES.length;

  return (
    <section className="view collection-view">
      <h2 className="section-title">Collection</h2>
      <p className="dex-progress">Found {found} / {total}</p>
      {found === total && (
        <p className="dex-complete">Complete! You found every creature!</p>
      )}
      <div className="dex-grid">
        {SPECIES.map((species) => {
          const entry = dex[species.id];
          const discovered = !!entry?.normal;
          return (
            <div key={species.id} className={`dex-cell ${discovered ? 'discovered' : 'unknown'}`}>
              {discovered ? (
                <CreatureSVG species={species} sparkle={false} size={56} />
              ) : (
                <div className="dex-silhouette">?</div>
              )}
              <span className="dex-name">{discovered ? species.name : '???'}</span>
              {discovered && (
                <span className={`dex-rarity ${species.rarity}`}>{species.rarity}</span>
              )}
              {entry?.sparkle && <span className="dex-sparkle-badge">✨</span>}
            </div>
          );
        })}
      </div>
    </section>
  );
}
